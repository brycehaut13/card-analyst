/**
 * Vercel cron handler: sold-comp enrichment collector.
 *
 * Triggered by the Vercel cron scheduler (e.g. every 6 hours).
 * Runs the sold-comp enrichment pipeline for all due queue targets.
 *
 * Security: requires Authorization: ******
 */

'use strict';

const { runEnrichment } = require('../../lib/sold-comps/runner');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET is not configured' });
  }
  if (req.headers.authorization !== `******) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runEnrichment();
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[sold-comps/collect] fatal error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Enrichment run failed'
    });
  }
};
