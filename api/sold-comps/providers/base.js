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
 *     providerPayload: object  // raw provider response, preserved verbatim
 *   }
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

module.exports = {
  PROVIDER_STATUS,
  unavailableResult,
  rateLimitedResult,
  okResult,
  errorResult
};
