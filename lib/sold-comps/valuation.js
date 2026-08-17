/**
 * Dual-path fair-value computation for sold comps.
 *
 * Two clearly separated outputs are produced from a pool of accepted comps:
 *
 *   ebay_execution_fair_value
 *     – Used by Flips only.
 *     – Derived exclusively from eBay comps (provider_name in EBAY_PROVIDER_NAMES).
 *     – Non-eBay comps are completely excluded; they cannot influence this value.
 *
 *   blended_market_fair_value
 *     – Used by Portfolio and Golden Goose.
 *     – Derived from all accepted verified comps across any provider.
 *     – Each comp is weighted by: confidence score × recency × liquidity ×
 *       marketplace relevance × sale-type factor.
 *
 * Identity constraints (preserved from ingest.js / identity.js):
 *   – Raw and graded comps are never mixed.  The ingest layer already ensures
 *     only raw comps (confidence >= 0.98, no grader/PSA/BGS/SGC) reach this
 *     function.
 *   – PSA/BGS/SGC comps were hard-rejected upstream; they never appear here.
 *
 * Neither path fabricates data.  If no qualifying comps exist for a path,
 * that path returns null.
 */

'use strict';

const { isEbayProvider } = require('./providers/base');

// ── Weighting constants ────────────────────────────────────────────────────

/**
 * How quickly recency weight decays.
 * A comp sold RECENCY_HALF_LIFE_DAYS ago is worth half of a same-day comp.
 */
const RECENCY_HALF_LIFE_DAYS = 21;

/**
 * Marketplace relevance weights (0–1).
 * Higher = more liquid / more representative for card resale.
 * eBay comps are fully weighted (1.0); other markets may have lower liquidity
 * or different buyer pools.  Adjust as data accumulates.
 *
 * Providers NOT listed here default to 0.7 (reasonable but uncertain).
 */
const MARKETPLACE_RELEVANCE = Object.freeze({
  ebay_insights: 1.0,
  ebay_manual: 1.0,
  goldin: 0.85,
  heritage: 0.85,
  rea: 0.85,
  scp: 0.8,
  memory_lane: 0.8,
  lelands: 0.8,
  pristine: 0.75,
  huggins_scott: 0.75,
  fanatics_collect: 0.9
});

const DEFAULT_MARKETPLACE_RELEVANCE = 0.7;

/**
 * Sale-type factor.
 * Auction "hammer" prices on high-end auction houses can differ from
 * fixed-price eBay comps; normalise slightly downward for auctions because
 * auction premiums/reserves vary.  Most eBay comps are fixed-price or BIN.
 */
const SALE_TYPE_FACTOR = Object.freeze({
  auction: 0.92,
  fixed: 1.0,
  bin: 1.0,
  best_offer: 0.97
});

const DEFAULT_SALE_TYPE_FACTOR = 1.0;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute the recency weight for a comp sold on `saleDateIso`.
 * Returns a value in (0, 1].  More recent = closer to 1.0.
 */
function recencyWeight(saleDateIso) {
  if (!saleDateIso) return 0.5; // unknown date – half weight
  const ageMs = Date.now() - new Date(saleDateIso).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return 0.5;
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Return the effective sale price (sale_price + any stated shipping).
 */
function effectivePrice(comp) {
  const base = Number(comp.sale_price || comp.salePrice || 0);
  const ship = Number(comp.shipping_price || comp.shippingPrice || 0);
  return base + (Number.isFinite(ship) ? ship : 0);
}

/**
 * Compute a composite weight for a single comp.
 *
 *   weight = confidence × recency × marketplaceRelevance × saleTypeFactor
 */
function compWeight(comp) {
  const confidence = Number(comp.confidence_score || comp.confidenceScore || 1);
  const recency = recencyWeight(comp.sale_date || comp.saleDate);
  const mktRelevance =
    MARKETPLACE_RELEVANCE[comp.provider_name || comp.providerName] ??
    DEFAULT_MARKETPLACE_RELEVANCE;
  const saleType = String(comp.sale_type || comp.saleType || '').toLowerCase();
  const stFactor = SALE_TYPE_FACTOR[saleType] ?? DEFAULT_SALE_TYPE_FACTOR;
  return confidence * recency * mktRelevance * stFactor;
}

/**
 * Compute a weighted median of prices, each entry having a `price` and `weight`.
 *
 * The weighted median is more robust than a weighted mean when outliers exist
 * (e.g. one extremely high auction result).
 *
 * Returns null if entries is empty.
 */
function weightedMedian(entries) {
  if (!entries || entries.length === 0) return null;
  if (entries.length === 1) return entries[0].price;

  // Sort ascending by price
  const sorted = [...entries].sort((a, b) => a.price - b.price);
  const totalWeight = sorted.reduce((s, e) => s + e.weight, 0);
  if (totalWeight === 0) return null;

  const halfWeight = totalWeight / 2;
  let cumulative = 0;
  for (const entry of sorted) {
    cumulative += entry.weight;
    if (cumulative >= halfWeight) {
      return entry.price;
    }
  }
  // Fallback to last entry
  return sorted[sorted.length - 1].price;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Compute both valuation paths from a list of accepted sold comps.
 *
 * @param {object[]} acceptedComps
 *   Comps that have already passed identity scoring (status === 'accepted').
 *   Each entry must have at minimum:
 *     provider_name  {string}
 *     sale_price     {number}
 *     sale_date      {string}  ISO-8601
 *     confidence_score {number}
 *
 * @returns {{
 *   ebay_execution_fair_value:  number|null,
 *   blended_market_fair_value:  number|null,
 *   ebay_comp_count:            number,
 *   blended_comp_count:         number
 * }}
 */
function computeValuation(acceptedComps) {
  if (!acceptedComps || acceptedComps.length === 0) {
    return {
      ebay_execution_fair_value: null,
      blended_market_fair_value: null,
      ebay_comp_count: 0,
      blended_comp_count: 0
    };
  }

  // ── eBay-only path ─────────────────────────────────────────────────────
  const ebayEntries = acceptedComps
    .filter(c => isEbayProvider(c.provider_name || c.providerName || ''))
    .map(c => ({ price: effectivePrice(c), weight: compWeight(c) }))
    .filter(e => e.price > 0 && e.weight > 0);

  const ebay_execution_fair_value = weightedMedian(ebayEntries);

  // ── Blended path (all providers) ──────────────────────────────────────
  const blendedEntries = acceptedComps
    .map(c => ({ price: effectivePrice(c), weight: compWeight(c) }))
    .filter(e => e.price > 0 && e.weight > 0);

  const blended_market_fair_value = weightedMedian(blendedEntries);

  return {
    ebay_execution_fair_value:
      ebay_execution_fair_value !== null
        ? Math.round(ebay_execution_fair_value * 100) / 100
        : null,
    blended_market_fair_value:
      blended_market_fair_value !== null
        ? Math.round(blended_market_fair_value * 100) / 100
        : null,
    ebay_comp_count: ebayEntries.length,
    blended_comp_count: blendedEntries.length
  };
}

module.exports = {
  computeValuation,
  // Exported for tests
  recencyWeight,
  compWeight,
  weightedMedian,
  MARKETPLACE_RELEVANCE,
  RECENCY_HALF_LIFE_DAYS
};
