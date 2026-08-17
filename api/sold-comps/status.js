/**
 * Diagnostics / admin status API for the sold-comp enrichment pipeline.
 *
 * GET /api/sold-comps/status
 *
 * Returns a compact JSON view of:
 *   - Queue counts by recent-comp bucket (0, 1, 2, 3+)
 *   - Cards queued, in error state, paused
 *   - Last successful enrichment run
 *   - Provider status (ok / unavailable / rate-limited)
 *   - Recent failures
 *   - Cards newly promoted to hot watch since last run
 *
 * Security: requires Authorization: ******
 */

'use strict';

const { sb } = require('../../lib/sold-comps/supabase-client');

async function safeQuery(path, options) {
  try { return await sb(path, { method: 'GET', ...options }); } catch { return null; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET is not configured' });
  }
  if (req.headers.authorization !== 'Bearer ' + cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Run all queries in parallel
    const [
      queueRows,
      recentRuns,
      providerStatuses,
      recentReview,
      recentHotWatch
    ] = await Promise.all([
      // Queue summary grouped by recent_comp_count bucket
      safeQuery(
        `sold_comp_enrichment_queue` +
        `?select=status,recent_verified_raw_sold_comp_count` +
        `&limit=2000`
      ),

      // Last 5 completed runs
      safeQuery(
        `sold_comp_ingest_runs` +
        `?select=id,provider_name,started_at,finished_at,status,cards_succeeded,comps_accepted` +
        `&order=started_at.desc` +
        `&limit=5`
      ),

      // Latest provider status per provider
      safeQuery(
        `sold_comp_provider_status` +
        `?select=provider_name,status,message,recorded_at` +
        `&order=recorded_at.desc` +
        `&limit=20`
      ),

      // Cards in review queue (last 24 h)
      safeQuery(
        `sold_comp_review_queue` +
        `?select=catalog_id,provider_name,title,confidence_score,match_status,created_at` +
        `&order=created_at.desc` +
        `&limit=25`
      ),

      // Cards promoted to hot watch in last 48 h
      safeQuery(
        `flip_hot_watch_log` +
        `?select=catalog_id,promoted_at,trigger_source` +
        `&trigger_source=eq.sold_comp_ingest` +
        `&order=promoted_at.desc` +
        `&limit=20`
      )
    ]);

    // ── Bucket queue rows by comp count ────────────────────────────────────
    const buckets = { 0: 0, 1: 0, 2: 0, '3+': 0, error: 0, paused: 0 };
    let totalQueued = 0;

    for (const row of (queueRows || [])) {
      if (row.status === 'error') { buckets.error++; totalQueued++; continue; }
      if (row.status === 'paused') { buckets.paused++; continue; }
      totalQueued++;
      const c = Number(row.recent_verified_raw_sold_comp_count || 0);
      if (c >= 3) buckets['3+']++;
      else if (c === 2) buckets[2]++;
      else if (c === 1) buckets[1]++;
      else buckets[0]++;
    }

    // ── Last successful run ────────────────────────────────────────────────
    const lastSuccess = (recentRuns || []).find(r => r.status === 'success' || r.status === 'partial');

    // ── Deduplicate provider statuses to latest per provider ──────────────
    const providerMap = {};
    for (const ps of (providerStatuses || [])) {
      if (!providerMap[ps.provider_name]) {
        providerMap[ps.provider_name] = ps;
      }
    }

    return res.status(200).json({
      queue: {
        total: totalQueued,
        byCompBucket: buckets,
        errorCount: buckets.error,
        pausedCount: buckets.paused
      },
      lastSuccessfulRun: lastSuccess
        ? {
            id: lastSuccess.id,
            startedAt: lastSuccess.started_at,
            finishedAt: lastSuccess.finished_at,
            cardsSucceeded: lastSuccess.cards_succeeded,
            compsAccepted: lastSuccess.comps_accepted
          }
        : null,
      recentRuns: (recentRuns || []).slice(0, 5),
      providerStatus: Object.values(providerMap),
      recentReviewItems: (recentReview || []).slice(0, 10),
      newlyPromotedToHotWatch: (recentHotWatch || []).slice(0, 10),
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('[sold-comps/status]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Status query failed'
    });
  }
};
