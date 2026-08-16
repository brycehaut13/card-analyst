/**
 * Manual import handler.
 *
 * POST /api/sold-comps/import
 *
 * Accepts a JSON body with approved sold comps in the following shape:
 *   {
 *     catalog_id: string,
 *     rows: [
 *       {
 *         source_item_id: string,
 *         title: string,
 *         sale_price: number,
 *         sale_date: string,  // YYYY-MM-DD or ISO timestamp
 *         shipping_price?: number,
 *         item_url?: string,
 *         condition?: string
 *       },
 *       ...
 *     ]
 *   }
 *
 * Or a multipart/form-data upload with a CSV file where the first row
 * contains column headers matching the field names above.
 *
 * Security: requires Authorization: ******
 *
 * This endpoint feeds data through the same ingestComps() pipeline so
 * all identity scoring and deduplication rules apply identically.
 */

'use strict';

const manualImportAdapter = require('./providers/manual-import');
const { ingestComps } = require('./ingest');
const { sb } = require('./supabase-client');

async function fetchTarget(catalogId) {
  const rows = await sb(
    `catalog_cards` +
    `?id=eq.${encodeURIComponent(catalogId)}` +
    `&select=id,player_name,year,set_name,card_number,parallel,serial_to,require_autograph,grade,grader`,
    { method: 'GET' }
  );
  if (!rows || rows.length === 0) {
    throw new Error(`Catalog card ${catalogId} not found`);
  }
  return { ...rows[0], catalog_id: rows[0].id };
}

/**
 * Parse a simple CSV string into an array of objects.
 * First row must be headers.  Values are trimmed; quoted values supported.
 */
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // Simple CSV split (handles quoted commas via a basic state machine)
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET is not configured' });
  }
  if (req.headers.authorization !== `******) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let catalogId, rows;

  try {
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('text/csv')) {
      // For CSV uploads, req.body must be a raw string.  If a framework
      // middleware has already parsed it (e.g. body-parser JSON), we cannot
      // recover the original CSV text and must reject the request.
      if (typeof req.body !== 'string') {
        return res.status(400).json({
          error:
            'CSV body must be sent as raw text/csv. ' +
            'Ensure the request body has not been pre-parsed by JSON middleware.'
        });
      }
      const parsed = parseCsv(req.body);
      if (!parsed.length) {
        return res.status(400).json({ error: 'CSV contained no data rows' });
      }
      // catalog_id must be provided as a query param for CSV uploads
      catalogId = req.query.catalog_id;
      rows = parsed;
    } else {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      catalogId = body.catalog_id;
      rows = body.rows;
    }

    if (!catalogId) {
      return res.status(400).json({ error: 'catalog_id is required' });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'rows array is required and must not be empty' });
    }

    const target = await fetchTarget(catalogId);

    const providerResult = await manualImportAdapter.fetchSoldComps(rows);
    if (providerResult.status !== 'ok') {
      return res.status(400).json({ error: providerResult.message });
    }

    const summary = await ingestComps(target, manualImportAdapter.name, providerResult.comps);

    return res.status(200).json({
      success: true,
      catalogId,
      rowsSubmitted: rows.length,
      compsAccepted: summary.accepted,
      compsReview: summary.review,
      compsRejected: summary.rejected,
      duplicates: summary.duplicates,
      errors: summary.errors
    });

  } catch (err) {
    console.error('[sold-comps/import]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Import failed'
    });
  }
};
