/**
 * Scheduled enrichment runner for the sold-comp ingestion pipeline.
 *
 * Processes the enrichment queue in small controlled batches.
 * Suitable for Supabase/Vercel background execution (no browser, server-side only).
 *
 * Features:
 *   – Small batch sizes with configurable concurrency
 *   – Per-provider rate-limit handling and exponential backoff
 *   – Retries on transient errors
 *   – Ingestion-run logging via queue.js
 *   – Post-ingest flip valuation and hot-watch refresh (delegated to ingest.js)
 */

'use strict';

const ebayInsightsAdapter = require('./providers/ebay-insights');
const { ingestComps } = require('./ingest');
const {
  getDueTargets,
  markQueueSuccess,
  markQueueFailure,
  createRunLog,
  finishRunLog
} = require('./queue');
const { PROVIDER_STATUS } = require('./providers/base');
const { sb } = require('./supabase-client');

// ── Configuration ──────────────────────────────────────────────────────────

const BATCH_SIZE = parseInt(process.env.SOLD_COMP_BATCH_SIZE || '20', 10);
const CONCURRENCY = parseInt(process.env.SOLD_COMP_CONCURRENCY || '4', 10);
const MAX_CARDS_PER_RUN = parseInt(process.env.SOLD_COMP_MAX_PER_RUN || '50', 10);
const BASE_RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 2;

// Re-attempt interval for normal cards (24 h); for flips cohort (6 h)
const NORMAL_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FLIPS_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Ordered list of provider adapters to try for each card.
// Add new adapters here; they will be tried left-to-right until one succeeds.
const PROVIDER_ADAPTERS = [ebayInsightsAdapter];

// ── Provider state (backoff tracking, in-memory per run) ──────────────────

const providerBackoff = {};

function isProviderInBackoff(providerName) {
  const backoff = providerBackoff[providerName];
  return backoff && Date.now() < backoff.until;
}

function recordProviderBackoff(providerName, retryAfterMs) {
  providerBackoff[providerName] = {
    until: Date.now() + (retryAfterMs || 60000)
  };
}

// ── Retry helper ───────────────────────────────────────────────────────────

async function withRetry(fn, retries, baseDelay) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise(resolve =>
          setTimeout(resolve, baseDelay * Math.pow(2, attempt))
        );
      }
    }
  }
  throw lastErr;
}

// ── Single-card processing ─────────────────────────────────────────────────

async function processTarget(target) {
  const isFlipsCohort = Boolean(target.is_flips_cohort || target.flip_tier);
  const nextAttemptAt = new Date(
    Date.now() + (isFlipsCohort ? FLIPS_INTERVAL_MS : NORMAL_INTERVAL_MS)
  ).toISOString();

  const queueId = target.queue_id || target.id;

  const summary = { accepted: 0, review: 0, rejected: 0, duplicates: 0, errors: 0 };

  for (const adapter of PROVIDER_ADAPTERS) {
    if (isProviderInBackoff(adapter.name)) {
      continue; // skip until backoff expires
    }

    let providerResult;
    try {
      providerResult = await withRetry(
        () => adapter.fetchSoldComps(target, { limit: 50, dayLimit: 45 }),
        MAX_RETRIES,
        BASE_RETRY_DELAY_MS
      );
    } catch (err) {
      console.error(`[runner] adapter ${adapter.name} threw:`, err.message);
      continue;
    }

    if (providerResult.status === PROVIDER_STATUS.UNAVAILABLE) {
      // Record provider-unavailable; do not fabricate comps
      console.info(`[runner] provider ${adapter.name} unavailable: ${providerResult.message}`);
      await recordProviderUnavailable(target.catalog_id, adapter.name, providerResult.message);
      continue;
    }

    if (providerResult.status === PROVIDER_STATUS.RATE_LIMITED) {
      recordProviderBackoff(adapter.name, providerResult.retryAfterMs);
      console.warn(`[runner] provider ${adapter.name} rate-limited; backing off ${providerResult.retryAfterMs}ms`);
      continue;
    }

    if (providerResult.status === PROVIDER_STATUS.ERROR) {
      console.warn(`[runner] provider ${adapter.name} error: ${providerResult.message}`);
      continue;
    }

    // status === 'ok'
    const batchSummary = await ingestComps(target, adapter.name, providerResult.comps);
    summary.accepted += batchSummary.accepted;
    summary.review += batchSummary.review;
    summary.rejected += batchSummary.rejected;
    summary.duplicates += batchSummary.duplicates;
    summary.errors += batchSummary.errors;

    // If we got comps (or at least attempted), we're done with this target
    if (providerResult.comps.length > 0 || batchSummary.accepted > 0) {
      break;
    }
  }

  if (queueId) {
    try {
      if (summary.errors > 0 && summary.accepted === 0) {
        await markQueueFailure(queueId, `${summary.errors} errors`, nextAttemptAt);
      } else {
        await markQueueSuccess(queueId, summary, nextAttemptAt);
      }
    } catch (err) {
      console.warn(`[runner] queue update failed for ${queueId}:`, err.message);
    }
  }

  return { success: true, catalogId: target.catalog_id, summary };
}

/**
 * Record that a provider was unavailable for a given catalog card.
 * Stored in sold_comp_provider_status so the admin view can surface it.
 */
async function recordProviderUnavailable(catalogId, providerName, message) {
  try {
    await sb('sold_comp_provider_status', {
      method: 'POST',
      headers: { Prefer: 'return=minimal,resolution=merge-duplicates' },
      body: JSON.stringify({
        catalog_id: catalogId,
        provider_name: providerName,
        status: 'unavailable',
        message: String(message || '').slice(0, 1000),
        recorded_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.warn('[runner] recordProviderUnavailable failed:', err.message);
  }
}

// ── Batch execution ────────────────────────────────────────────────────────

async function runBatch(targets) {
  const results = [];
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const slice = targets.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(slice.map(processTarget));
    results.push(...batchResults);
  }
  return results;
}

// ── Public entry point ─────────────────────────────────────────────────────

/**
 * Run the enrichment pipeline for all due targets.
 * Called from the Vercel cron endpoint (api/sold-comps/collect.js).
 *
 * @returns {Promise<object>} run summary
 */
async function runEnrichment() {
  const providerName = PROVIDER_ADAPTERS.map(a => a.name).join(',');
  const startedAt = new Date().toISOString();

  const runId = await createRunLog(providerName, startedAt);

  const stats = {
    cardsAttempted: 0,
    cardsSucceeded: 0,
    cardsFailed: 0,
    compsAccepted: 0,
    compsReview: 0,
    compsRejected: 0
  };

  try {
    const targets = await getDueTargets(Math.min(MAX_CARDS_PER_RUN, BATCH_SIZE * 10));
    stats.cardsAttempted = targets.length;

    if (!targets.length) {
      await finishRunLog(runId, stats, 'success');
      return { runId, message: 'No cards currently due', stats };
    }

    const results = await runBatch(targets);

    for (const r of results) {
      if (r.success) {
        stats.cardsSucceeded++;
        stats.compsAccepted += r.summary?.accepted || 0;
        stats.compsReview += r.summary?.review || 0;
        stats.compsRejected += r.summary?.rejected || 0;
      } else {
        stats.cardsFailed++;
      }
    }

    const runStatus =
      stats.cardsFailed === 0
        ? 'success'
        : stats.cardsSucceeded > 0
          ? 'partial'
          : 'failed';

    await finishRunLog(runId, stats, runStatus);

    return { runId, runStatus, stats, finishedAt: new Date().toISOString() };

  } catch (err) {
    console.error('[runner] runEnrichment fatal error:', err);
    await finishRunLog(runId, stats, 'failed');
    throw err;
  }
}

module.exports = { runEnrichment };
