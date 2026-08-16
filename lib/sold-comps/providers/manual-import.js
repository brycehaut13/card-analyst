/**
 * Manual import adapter.
 *
 * Accepts pre-approved sold comps from a structured in-memory payload
 * (parsed from CSV or JSON by the import endpoint before calling this adapter).
 * Each entry must already have been reviewed and approved by an admin.
 *
 * This adapter never fetches from an external API; it simply maps the approved
 * payload into the SoldComp shape so the core ingest pipeline can score and
 * dedup them identically to live-provider comps.
 *
 * Required fields per row (CSV/JSON):
 *   source_item_id  – unique identifier within the source batch
 *   title           – full listing title as it appeared on the platform
 *   sale_price      – numeric USD
 *   sale_date       – ISO-8601 date (YYYY-MM-DD or full timestamp)
 *
 * Optional fields:
 *   shipping_price  – numeric USD
 *   item_url        – original listing URL
 *   condition       – e.g. "Ungraded"
 */

const { okResult, errorResult } = require('./base');

/**
 * Map a single approved import row to the SoldComp shape.
 * Returns null if required fields are missing or clearly invalid.
 */
function mapRow(row, index) {
  const sourceItemId = String(row.source_item_id || row.sourceItemId || '').trim();
  const title = String(row.title || '').trim();
  const salePrice = Number(row.sale_price ?? row.salePrice);
  const saleDate = String(row.sale_date || row.saleDate || '').trim();

  if (!sourceItemId) {
    return { error: `Row ${index}: missing source_item_id`, row };
  }
  if (!title) {
    return { error: `Row ${index}: missing title`, row };
  }
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return { error: `Row ${index}: invalid sale_price`, row };
  }
  if (!saleDate) {
    return { error: `Row ${index}: missing sale_date`, row };
  }

  const shippingRaw = row.shipping_price ?? row.shippingPrice ?? null;
  const shippingPrice =
    shippingRaw !== null && shippingRaw !== ''
      ? Number(shippingRaw)
      : null;

  return {
    comp: {
      sourceItemId,
      title,
      salePrice,
      shippingPrice: Number.isFinite(shippingPrice) ? shippingPrice : null,
      saleDate,
      itemUrl: String(row.item_url || row.itemUrl || '').trim() || null,
      condition: String(row.condition || '').trim() || null,
      providerPayload: row
    }
  };
}

/**
 * Process a pre-parsed array of approved rows.
 * Returns a ProviderResult with comps that parsed cleanly.
 * Rows that fail validation are logged but do not abort the whole batch.
 *
 * @param {object[]} rows – approved import rows
 */
async function fetchSoldComps(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return errorResult('Manual import: no rows provided');
  }

  const comps = [];
  const errors = [];

  rows.forEach((row, i) => {
    const result = mapRow(row, i);
    if (result.error) {
      errors.push(result.error);
    } else {
      comps.push(result.comp);
    }
  });

  if (errors.length) {
    console.warn('[manual-import] Row validation errors:', errors);
  }

  if (!comps.length) {
    return errorResult(
      `Manual import: all ${rows.length} rows failed validation. ` +
      errors.slice(0, 5).join('; ')
    );
  }

  return {
    status: 'ok',
    comps,
    message: `${comps.length} comps parsed from manual import (${errors.length} rows skipped)`,
    retryAfterMs: null
  };
}

module.exports = {
  name: 'manual_import',
  fetchSoldComps
};
