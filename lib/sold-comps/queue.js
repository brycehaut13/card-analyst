/**
 * Enrichment queue helpers for the sold-comp ingestion pipeline.
 *
 * Priority rules (higher wins):
 *   1. Cards currently in the $25–$50 Flips discovery cohort
 *      (flip_tier IN ('discovery', 'flip') AND fair_value BETWEEN 25 AND 50)
 *   2. Cards with fresh active eBay depth (recent market snapshot) but
 *      fewer than 3 recent verified raw sold comps
 *   3. All other catalog cards due for enrichment
 *
 * The queue table is `sold_comp_enrichment_queue`.
 */

'use strict';

const { sb } = require('./supabase-client');

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fairValueForPilot(target) {
  return (
    num(target?.ebay_execution_fair_value) ??
    num(target?.fair_value) ??
    num(target?.fair_exit_price) ??
    num(target?.raw_market_value) ??
    num(target?.blended_market_fair_value)
  );
}

function recentCompCount(target) {
  return (
    num(target?.recent_verified_raw_sold_comp_count) ??
    num(target?.verified_raw_sold_comp_count) ??
    num(target?.raw_sold_comp_count) ??
    0
  );
}

function activeDepth(target) {
  return (
    num(target?.robust_listing_count) ??
    num(target?.exact_active_listings) ??
    num(target?.accepted_listing_count) ??
    num(target?.last_listing_count) ??
    0
  );
}

function isPilotFlipsCohort(target) {
  const fairValue = fairValueForPilot(target);
  const tier = String(target?.flip_tier || '').toLowerCase();
  return (
    Boolean(target?.is_flips_cohort) ||
    ((tier === 'discovery' || tier === 'flip' || tier === 'buy' || tier === 'buy now') &&
      fairValue !== null &&
      fairValue >= 25 &&
      fairValue <= 50)
  );
}

function pilotBackfillScore(target) {
  const basePriority = num(target?.priority) ?? 0;
  const fairValue = fairValueForPilot(target);
  const compCount = recentCompCount(target);
  const depth = activeDepth(target);
  const sparseComps = compCount < 3;
  const inPilotRange = fairValue !== null && fairValue >= 25 && fairValue <= 50;

  let score = basePriority;

  if (isPilotFlipsCohort(target) || inPilotRange) {
    score += 1000;
  }

  if (sparseComps) {
    score += 180 + ((3 - compCount) * 50);
  }

  if (sparseComps && depth >= 5) {
    score += 250 + Math.min(depth, 25) * 12;
  } else {
    score += Math.min(depth, 25) * 4;
  }

  return score;
}

function lastAttemptTimestamp(target) {
  const raw =
    target?.last_enrichment_attempt ||
    target?.last_attempt_at ||
    target?.updated_at ||
    null;
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function sortTargetsForPilotBackfill(targets) {
  return (targets || []).slice().sort((a, b) => {
    const scoreDiff = pilotBackfillScore(b) - pilotBackfillScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return lastAttemptTimestamp(a) - lastAttemptTimestamp(b);
  });
}

/**
 * Fetch due enrichment targets ordered by priority.
 *
 * @param {number} [limit=50]
 * @returns {Promise<object[]>}
 */
async function getDueTargets(limit = 50) {
  const fetchLimit = Math.min(Math.max(limit * 4, limit), 250);
  // Try the database view first; fall back to a manual query if it doesn't exist.
  try {
    const rows = (
      await sb(
        `sold_comp_enrichment_due` +
        `?select=*` +
        `&order=priority.desc,last_enrichment_attempt.asc.nullsfirst` +
        `&limit=${fetchLimit}`,
        { method: 'GET' }
      )
    ) || [];
    return sortTargetsForPilotBackfill(rows).slice(0, limit);
  } catch {
    // Fallback: query the queue table directly
    const rows = (
      await sb(
        `sold_comp_enrichment_queue` +
        `?select=*` +
        `&status=neq.paused` +
        `&or=(next_attempt_at.is.null,next_attempt_at.lte.${encodeURIComponent(new Date().toISOString())})` +
        `&order=priority.desc,last_attempt_at.asc.nullsfirst` +
        `&limit=${fetchLimit}`,
        { method: 'GET' }
      )
    ) || [];
    return sortTargetsForPilotBackfill(rows).slice(0, limit);
  }
}

/**
 * Mark a queue entry as successfully processed.
 */
async function markQueueSuccess(queueId, summary, nextAttemptAt) {
  await sb(
    `sold_comp_enrichment_queue?id=eq.${queueId}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: summary.accepted > 0 ? 'enriched' : 'attempted',
        last_attempt_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        next_attempt_at: nextAttemptAt,
        attempt_count_raw: null, // incremented by DB trigger if present
        last_accepted_count: summary.accepted,
        last_review_count: summary.review,
        last_error: null,
        updated_at: new Date().toISOString()
      })
    }
  );
}

/**
 * Mark a queue entry as failed.
 */
async function markQueueFailure(queueId, errorMessage, nextAttemptAt) {
  await sb(
    `sold_comp_enrichment_queue?id=eq.${queueId}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: 'error',
        last_attempt_at: new Date().toISOString(),
        next_attempt_at: nextAttemptAt,
        last_error: String(errorMessage || '').slice(0, 1500),
        updated_at: new Date().toISOString()
      })
    }
  );
}

/**
 * Create a new ingestion-run log entry.
 * Returns the run id.
 */
async function createRunLog(providerName, startedAt) {
  try {
    const rows = await sb('sold_comp_ingest_runs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        provider_name: providerName,
        started_at: startedAt,
        status: 'running',
        cards_attempted: 0,
        cards_succeeded: 0,
        cards_failed: 0,
        comps_accepted: 0,
        comps_review: 0,
        comps_rejected: 0
      })
    });
    return rows?.[0]?.id || null;
  } catch (err) {
    console.warn('[queue] createRunLog failed:', err.message);
    return null;
  }
}

/**
 * Finalise a run log entry.
 */
async function finishRunLog(runId, stats, status) {
  if (!runId) return;
  try {
    await sb(`sold_comp_ingest_runs?id=eq.${runId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        finished_at: new Date().toISOString(),
        status,
        cards_attempted: stats.cardsAttempted,
        cards_succeeded: stats.cardsSucceeded,
        cards_failed: stats.cardsFailed,
        comps_accepted: stats.compsAccepted,
        comps_review: stats.compsReview,
        comps_rejected: stats.compsRejected
      })
    });
  } catch (err) {
    console.warn('[queue] finishRunLog failed:', err.message);
  }
}

module.exports = {
  getDueTargets,
  isPilotFlipsCohort,
  pilotBackfillScore,
  sortTargetsForPilotBackfill,
  markQueueSuccess,
  markQueueFailure,
  createRunLog,
  finishRunLog
};
