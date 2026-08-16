/**
 * Provider interface constants and helpers for the sold-comp ingestion pipeline.
 *
 * A provider adapter must export:
 *   name      – string slug, e.g. 'ebay_insights' or 'manual_import'
 *   fetchSoldComps(target, options) -> Promise<ProviderResult>
 *
 * ProviderResult:
 *   {
 *     status:    'ok' | 'provider_unavailable' | 'rate_limited' | 'error',
 *     comps:     SoldComp[],   // empty when status !== 'ok'
 *     message:   string,       // human-readable status detail
 *     retryAfterMs: number|null
 *   }
 *
 * SoldComp (raw, pre-identity-scoring):
 *   {
 *     sourceItemId:  string,   // unique within this provider
 *     title:         string,
 *     salePrice:     number,   // USD
 *     shippingPrice: number|null,
 *     saleDate:      string,   // ISO-8601
 *     itemUrl:       string|null,
 *     condition:     string|null,
 *     marketplace:   string,   // provider slug, e.g. 'ebay_insights', 'goldin'
 *                              // used to separate ebay_execution_fair_value
 *                              // from blended_market_fair_value
 *     providerPayload: object  // raw provider response, preserved verbatim
 *   }
 *
 * Valuation outputs (computed by valuation.js from accepted comps):
 *   ebay_execution_fair_value  – Flips only; derived solely from eBay comps
 *   blended_market_fair_value  – Portfolio/Golden Goose; cross-marketplace,
 *                                weighted by confidence, recency, liquidity,
 *                                marketplace relevance, and sale type
 */

const PROVIDER_STATUS = Object.freeze({
  OK: 'ok',
  UNAVAILABLE: 'provider_unavailable',
  RATE_LIMITED: 'rate_limited',
  ERROR: 'error'
});

/**
 * Build a provider-unavailable result.  Adapters call this when credentials
 * are absent or the provider endpoint is restricted.  No comps are returned
 * and no fake data is fabricated.
 */
function unavailableResult(message) {
  return {
    status: PROVIDER_STATUS.UNAVAILABLE,
    comps: [],
    message: message || 'Provider unavailable',
    retryAfterMs: null
  };
}

/**
 * Build a rate-limited result.
 */
function rateLimitedResult(retryAfterMs, message) {
  return {
    status: PROVIDER_STATUS.RATE_LIMITED,
    comps: [],
    message: message || 'Rate limited',
    retryAfterMs: retryAfterMs || 60000
  };
}

/**
 * Build an ok result.
 */
function okResult(comps) {
  return {
    status: PROVIDER_STATUS.OK,
    comps: comps || [],
    message: `${(comps || []).length} comps returned`,
    retryAfterMs: null
  };
}

/**
 * Build an error result.
 */
function errorResult(message) {
  return {
    status: PROVIDER_STATUS.ERROR,
    comps: [],
    message: message || 'Provider error',
    retryAfterMs: null
  };
}

/**
 * Provider slugs that are considered eBay-origin.
 * Only these contribute to ebay_execution_fair_value.
 */
const EBAY_PROVIDER_NAMES = Object.freeze(['ebay_insights', 'ebay_manual']);

/**
 * Returns true if a provider name belongs to eBay.
 * Used by valuation.js to keep eBay and non-eBay comps separate.
 */
function isEbayProvider(providerName) {
  return EBAY_PROVIDER_NAMES.includes(String(providerName));
}

module.exports = {
  PROVIDER_STATUS,
  unavailableResult,
  rateLimitedResult,
  okResult,
  errorResult,
  EBAY_PROVIDER_NAMES,
  isEbayProvider
};
