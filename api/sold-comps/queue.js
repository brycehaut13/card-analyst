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

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  'https://tjqeuiqyjdhpjgzhfwev.supabase.co';

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sbHeaders(extra) {
  if (!SUPABASE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: SUPABASE_KEY,
    Authorization: `******
    'Content-Type': 'application/json',
    ...extra
  };
}

async function sb(path, options) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: sbHeaders(options.headers || {})
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function sbRpc(fn, args) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(args)
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error(`Supabase RPC ${fn} ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Fetch due enrichment targets ordered by priority.
 *
 * @param {number} [limit=50]
 * @returns {Promise<object[]>}
 */
async function getDueTargets(limit = 50) {
  // Try the database view first; fall back to a manual query if it doesn't exist.
  try {
    return (
      await sb(
        `sold_comp_enrichment_due` +
        `?select=*` +
        `&order=priority.desc,last_enrichment_attempt.asc.nullsfirst` +
        `&limit=${limit}`,
        { method: 'GET' }
      )
    ) || [];
  } catch {
    // Fallback: query the queue table directly
    return (
      await sb(
        `sold_comp_enrichment_queue` +
        `?select=*` +
        `&status=neq.paused` +
        `&or=(next_attempt_at.is.null,next_attempt_at.lte.${encodeURIComponent(new Date().toISOString())})` +
        `&order=priority.desc,last_attempt_at.asc.nullsfirst` +
        `&limit=${limit}`,
        { method: 'GET' }
      )
    ) || [];
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
  markQueueSuccess,
  markQueueFailure,
  createRunLog,
  finishRunLog
};
