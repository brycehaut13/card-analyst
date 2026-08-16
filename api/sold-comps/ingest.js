/**
 * Core ingestion logic for sold comps.
 *
 * This module sits between the provider adapters and the Supabase
 * golden_goose_market_comps table / ingest_verified_market_comp RPC.
 *
 * Responsibilities:
 *   – Score each candidate against the card identity (confidence >= 0.98)
 *   – Reject graded cards from raw comp ingestion
 *   – Deduplicate by provider + source_item_id (idempotent on re-run)
 *   – Call the existing ingest_verified_market_comp RPC (never bypass it)
 *   – Record review/error state for ambiguous listings
 *   – After successful ingestion, trigger flip valuation and hot-watch refresh
 *
 * This module never fabricates data and never writes comps that scored < 0.98.
 */

'use strict';

const { scoreSoldComp, SOLD_COMP_MIN_CONFIDENCE } = require('./identity');
const { sb, sbRpc } = require('./supabase-client');

// ── Deduplication ──────────────────────────────────────────────────────────

/**
 * Fetch existing source_item_ids for a given provider + catalog_id to deduplicate.
 * Returns a Set of already-stored source_item_ids.
 */
async function fetchExistingIds(catalogId, providerName) {
  const rows = await sb(
    `golden_goose_market_comps` +
    `?catalog_id=eq.${encodeURIComponent(catalogId)}` +
    `&provider_name=eq.${encodeURIComponent(providerName)}` +
    `&select=source_item_id`,
    { method: 'GET' }
  );
  return new Set((rows || []).map(r => String(r.source_item_id)));
}

// ── Post-ingest hooks ──────────────────────────────────────────────────────

/**
 * Trigger the flip valuation refresh for a catalog card.
 * We call the existing RPC; if it doesn't exist yet the error is swallowed
 * so ingestion itself is not blocked.
 */
async function refreshFlipValuation(catalogId) {
  try {
    await sbRpc('refresh_flip_valuation', { p_catalog_id: catalogId });
  } catch (err) {
    console.warn(`[ingest] refresh_flip_valuation skipped for ${catalogId}:`, err.message);
  }
}

/**
 * Trigger the hot-watch sync so newly eligible cards can graduate.
 */
async function syncFlipHotWatch(catalogId) {
  try {
    await sbRpc('sync_flip_hot_watch', { p_catalog_id: catalogId });
  } catch (err) {
    console.warn(`[ingest] sync_flip_hot_watch skipped for ${catalogId}:`, err.message);
  }
}

// ── Review logging ─────────────────────────────────────────────────────────

/**
 * Persist a review/skipped comp to sold_comp_review_queue so a human can
 * decide whether to manually approve it.
 */
async function logReviewComp(catalogId, providerName, comp, scoreResult) {
  try {
    await sb('sold_comp_review_queue', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        catalog_id: catalogId,
        provider_name: providerName,
        source_item_id: comp.sourceItemId,
        title: comp.title,
        sale_price: comp.salePrice,
        shipping_price: comp.shippingPrice,
        sale_date: comp.saleDate,
        item_url: comp.itemUrl,
        confidence_score: scoreResult.score,
        match_status: scoreResult.status,
        rejection_reasons: scoreResult.reasons,
        provider_payload: comp.providerPayload,
        created_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.warn(`[ingest] logReviewComp failed:`, err.message);
  }
}

// ── Main ingest ────────────────────────────────────────────────────────────

/**
 * Ingest a batch of raw sold-comp candidates for a single catalog card.
 *
 * @param {object}   target      – card identity from the enrichment queue
 * @param {string}   providerName
 * @param {object[]} comps       – raw SoldComp objects from a provider adapter
 *
 * @returns {object} summary: { accepted, review, rejected, duplicates, errors }
 */
async function ingestComps(target, providerName, comps) {
  const catalogId = target.catalog_id;

  const summary = { accepted: 0, review: 0, rejected: 0, duplicates: 0, errors: 0 };

  if (!comps || comps.length === 0) {
    return summary;
  }

  // Build identity target shape expected by scoreSoldComp
  const identityTarget = {
    player: target.player_name || target.player,
    year: target.year,
    set: target.set_name || target.set,
    cardNumber: target.card_number || target.cardNumber,
    parallel: target.parallel || '',
    serialTo: target.serial_to ?? target.serialTo ?? null,
    isAutograph: Boolean(target.require_autograph ?? target.isAutograph),
    grade: target.grade || '',
    grader: target.grader || ''
  };

  let existingIds;
  try {
    existingIds = await fetchExistingIds(catalogId, providerName);
  } catch (err) {
    console.error(`[ingest] fetchExistingIds failed for ${catalogId}:`, err.message);
    summary.errors += comps.length;
    return summary;
  }

  let anyAccepted = false;

  for (const comp of comps) {
    try {
      // Deduplication
      if (existingIds.has(String(comp.sourceItemId))) {
        summary.duplicates++;
        continue;
      }

      // Identity scoring
      const scoreResult = scoreSoldComp(
        { title: comp.title, condition: comp.condition || '' },
        identityTarget
      );

      if (scoreResult.status === 'rejected') {
        summary.rejected++;
        continue;
      }

      if (scoreResult.status === 'review') {
        summary.review++;
        await logReviewComp(catalogId, providerName, comp, scoreResult);
        continue;
      }

      // status === 'accepted' and score >= SOLD_COMP_MIN_CONFIDENCE
      // Call the existing verified comp write path (never bypass it)
      await sbRpc('ingest_verified_market_comp', {
        p_catalog_id: catalogId,
        p_market_type: 'sold',
        p_provider_name: providerName,
        p_source_item_id: String(comp.sourceItemId),
        p_title: comp.title,
        p_sale_price: comp.salePrice,
        p_shipping_price: comp.shippingPrice,
        p_sale_date: comp.saleDate,
        p_item_url: comp.itemUrl || null,
        p_condition: comp.condition || null,
        p_confidence_score: scoreResult.score,
        p_identity_evidence: {
          reasons: scoreResult.reasons,
          identityTarget,
          scoredAt: new Date().toISOString()
        },
        p_provider_payload: comp.providerPayload || null
      });

      // Track in our dedup set so we don't double-insert within the same batch
      existingIds.add(String(comp.sourceItemId));

      summary.accepted++;
      anyAccepted = true;

    } catch (err) {
      console.error(`[ingest] comp error for ${catalogId}:`, err.message);
      summary.errors++;
    }
  }

  // After any accepted comps, refresh flip valuation and hot-watch
  if (anyAccepted) {
    await refreshFlipValuation(catalogId);
    await syncFlipHotWatch(catalogId);
  }

  return summary;
}

module.exports = {
  ingestComps,
  SOLD_COMP_MIN_CONFIDENCE
};
