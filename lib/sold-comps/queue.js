/**
 * Enrichment queue helpers for the sold-comp ingestion pipeline.
 *
 * Designed for short, resumable Vercel worker runs.
 */

'use strict';

const { sb } = require('./supabase-client');

const DEFAULT_BATCH_SIZE = 8;
const MAX_BATCH_SIZE = 20;

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
    num(target?.accepted_comp_count) ??
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
    (
      (
        tier === 'discovery' ||
        tier === 'flip' ||
        tier === 'buy' ||
        tier === 'buy now'
      ) &&
      fairValue !== null &&
      fairValue >= 25 &&
      fairValue <= 50
    )
  );
}

function pilotBackfillScore(target) {
  const basePriority = num(target?.priority) ?? 0;
  const fairValue = fairValueForPilot(target);
  const compCount = recentCompCount(target);
  const depth = activeDepth(target);

  const sparseComps = compCount < 3;

  const inPilotRange =
    fairValue !== null &&
    fairValue >= 25 &&
    fairValue <= 50;

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

  const value = raw
    ? new Date(raw).getTime()
    : 0;

  return Number.isFinite(value)
    ? value
    : 0;
}

function sortTargetsForPilotBackfill(targets) {
  return (targets || [])
    .slice()
    .sort((a, b) => {
      const scoreDiff =
        pilotBackfillScore(b) -
        pilotBackfillScore(a);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return (
        lastAttemptTimestamp(a) -
        lastAttemptTimestamp(b)
      );
    });
}

/**
 * Fetch a deliberately small batch of due targets.
 *
 * Short batches are important because Vercel currently has a
 * 60-second execution ceiling for this worker.
 */
async function getDueTargets(limit = DEFAULT_BATCH_SIZE) {
  const requested = Math.min(
    Math.max(Number(limit) || DEFAULT_BATCH_SIZE, 1),
    MAX_BATCH_SIZE
  );

  const fetchLimit = Math.min(
    Math.max(requested * 3, requested),
    60
  );

  try {
    const rows = (
      await sb(
        'sold_comp_enrichment_due' +
        '?select=*' +
        '&order=priority.desc,last_enrichment_attempt.asc.nullsfirst' +
        `&limit=${fetchLimit}`,
        {
          method: 'GET'
        }
      )
    ) || [];

    return sortTargetsForPilotBackfill(rows)
      .slice(0, requested);

  } catch (error) {
    console.warn(
      '[queue] due view unavailable; using queue table:',
      error.message
    );

    const now = encodeURIComponent(
      new Date().toISOString()
    );

    const rows = (
      await sb(
        'sold_comp_enrichment_queue' +
        '?select=*' +
        '&status=neq.paused' +
        `&or=(next_attempt_at.is.null,next_attempt_at.lte.${now})` +
        '&order=priority.desc,last_attempt_at.asc.nullsfirst' +
        `&limit=${fetchLimit}`,
        {
          method: 'GET'
        }
      )
    ) || [];

    return sortTargetsForPilotBackfill(rows)
      .slice(0, requested);
  }
}

/**
 * Mark a queue entry as successfully processed.
 *
 * Only writes columns that actually exist in
 * sold_comp_enrichment_queue.
 */
async function markQueueSuccess(
  queueId,
  summary,
  nextAttemptAt
) {
  const now = new Date().toISOString();

  const accepted =
    Number(summary?.accepted) || 0;

  await sb(
    `sold_comp_enrichment_queue?id=eq.${encodeURIComponent(queueId)}`,
    {
      method: 'PATCH',

      /*
       * This PATCH is safe to retry because it sets deterministic
       * state rather than inserting another comp.
       */
      retrySafe: true,

      headers: {
        Prefer: 'return=minimal'
      },

      body: JSON.stringify({
        status:
          accepted > 0
            ? 'enriched'
            : 'attempted',

        last_attempt_at: now,
        last_success_at: now,
        next_attempt_at: nextAttemptAt || null,

        /*
         * This represents the latest accepted count for the queue
         * target. Actual individual comps remain stored separately.
         */
        accepted_comp_count: accepted,

        last_error: null,
        updated_at: now
      })
    }
  );
}

/**
 * Mark a queue entry as failed.
 */
async function markQueueFailure(
  queueId,
  errorMessage,
  nextAttemptAt
) {
  const now = new Date().toISOString();

  await sb(
    `sold_comp_enrichment_queue?id=eq.${encodeURIComponent(queueId)}`,
    {
      method: 'PATCH',

      retrySafe: true,

      headers: {
        Prefer: 'return=minimal'
      },

      body: JSON.stringify({
        status: 'error',
        last_attempt_at: now,
        next_attempt_at: nextAttemptAt || null,

        last_error: String(
          errorMessage || 'Unknown enrichment error'
        ).slice(0, 1500),

        updated_at: now
      })
    }
  );
}

/**
 * Create ingestion-run log entry.
 *
 * Logging failure must NEVER kill comp ingestion.
 */
async function createRunLog(
  providerName,
  startedAt
) {
  try {
    const rows = await sb(
      'sold_comp_ingest_runs',
      {
        method: 'POST',

        headers: {
          Prefer: 'return=representation'
        },

        body: JSON.stringify({
          provider_name: providerName,
          started_at:
            startedAt ||
            new Date().toISOString(),

          status: 'running',

          cards_attempted: 0,
          cards_succeeded: 0,
          cards_failed: 0,

          comps_accepted: 0,
          comps_review: 0,
          comps_rejected: 0
        })
      }
    );

    return rows?.[0]?.id || null;

  } catch (error) {
    console.warn(
      '[queue] createRunLog failed:',
      error.message
    );

    return null;
  }
}

/**
 * Finalise ingestion-run log.
 *
 * Logging failure must NEVER kill the worker.
 */
async function finishRunLog(
  runId,
  stats,
  status
) {
  if (!runId) {
    return;
  }

  try {
    await sb(
      `sold_comp_ingest_runs?id=eq.${encodeURIComponent(runId)}`,
      {
        method: 'PATCH',
        retrySafe: true,

        headers: {
          Prefer: 'return=minimal'
        },

        body: JSON.stringify({
          finished_at:
            new Date().toISOString(),

          status:
            status || 'finished',

          cards_attempted:
            Number(stats?.cardsAttempted) || 0,

          cards_succeeded:
            Number(stats?.cardsSucceeded) || 0,

          cards_failed:
            Number(stats?.cardsFailed) || 0,

          comps_accepted:
            Number(stats?.compsAccepted) || 0,

          comps_review:
            Number(stats?.compsReview) || 0,

          comps_rejected:
            Number(stats?.compsRejected) || 0
        })
      }
    );

  } catch (error) {
    console.warn(
      '[queue] finishRunLog failed:',
      error.message
    );
  }
}

module.exports = {
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,

  getDueTargets,

  isPilotFlipsCohort,
  pilotBackfillScore,
  sortTargetsForPilotBackfill,

  markQueueSuccess,
  markQueueFailure,

  createRunLog,
  finishRunLog
};
