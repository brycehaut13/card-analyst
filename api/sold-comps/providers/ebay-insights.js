/**
 * eBay Marketplace Insights API adapter.
 *
 * This adapter uses the eBay Marketplace Insights API (sold-item history)
 * to retrieve raw sold comps.  It requires the scope:
 *   https://api.ebay.com/oauth/api_scope/buy.marketplace.insights
 *
 * If the required credentials are absent, or if the API responds with a
 * scope/access-restricted error (403, 401, or "IAF_0002"), this adapter
 * immediately returns provider_unavailable so that no fake data is stored.
 *
 * Rate-limit (429) responses trigger a rate_limited result with backoff.
 */

const {
  unavailableResult,
  rateLimitedResult,
  okResult,
  errorResult
} = require('./base');

const INSIGHTS_SCOPE =
  'https://api.ebay.com/oauth/api_scope/buy.marketplace.insights';
const TOKEN_URL =
  'https://api.ebay.com/identity/v1/oauth2/token';
const INSIGHTS_SEARCH_URL =
  'https://api.ebay.com/buy/marketplace_insights/v1_beta/item_sales/search';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtain an OAuth application token for the Marketplace Insights scope.
 * Returns null (not a throw) if credentials are absent.
 */
async function getInsightsToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: INSIGHTS_SCOPE
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Scope not granted or credential issue – treat as unavailable
    const msg = data.error_description || data.error || `Token request failed: ${response.status}`;
    if (
      response.status === 401 ||
      response.status === 403 ||
      String(data.error).includes('IAF') ||
      String(data.error_description || '').toLowerCase().includes('scope')
    ) {
      return null; // signal unavailable to caller
    }
    throw new Error(msg);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (Number(data.expires_in) || 7200) * 1000;
  return cachedToken;
}

/**
 * Build a q string from a target card identity.
 */
function buildQuery(target) {
  const parts = [target.player];
  if (target.year) parts.push(String(target.year));
  if (target.set) parts.push(target.set);
  if (target.cardNumber) parts.push(`#${target.cardNumber}`);
  if (target.parallel) parts.push(target.parallel);
  return parts.filter(Boolean).join(' ');
}

/**
 * Map a single eBay Marketplace Insights item to the SoldComp shape.
 */
function mapItem(item) {
  const price = item.lastSoldPrice || item.price || {};
  const salePrice = Number(price.value);

  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return null;
  }

  return {
    sourceItemId: String(item.legacyItemId || item.itemId || ''),
    title: item.title || '',
    salePrice,
    shippingPrice: null, // Insights API doesn't surface shipping separately
    saleDate: item.lastSoldDate || item.itemCreationDate || null,
    itemUrl: item.itemWebUrl || null,
    condition: item.condition || null,
    providerPayload: item
  };
}

/**
 * Fetch sold comps for a single target card identity.
 *
 * @param {object} target – card identity fields from the enrichment queue
 * @param {object} [options]
 * @param {number} [options.limit=50]
 * @param {number} [options.dayLimit=45]   – how far back to look
 */
async function fetchSoldComps(target, options = {}) {
  const { limit = 50, dayLimit = 45 } = options;

  let token;
  try {
    token = await getInsightsToken();
  } catch (err) {
    return errorResult(`Token fetch failed: ${err.message}`);
  }

  if (!token) {
    return unavailableResult(
      'eBay Marketplace Insights credentials absent or scope not granted. ' +
      'No data fabricated. Obtain buy.marketplace.insights scope to enable this adapter.'
    );
  }

  const q = buildQuery(target);
  if (!q.trim()) {
    return errorResult('Target has insufficient identity fields to build a query');
  }

  // Date filter: last N days
  const since = new Date(Date.now() - dayLimit * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    q,
    limit: String(Math.min(limit, 200)),
    filter: `lastSoldDate:[${since}..]`
  });

  let response;
  try {
    response = await fetch(
      `${INSIGHTS_SEARCH_URL}?${params.toString()}`,
      {
        headers: {
          Authorization: `******
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
      }
    );
  } catch (networkErr) {
    return errorResult(`Network error: ${networkErr.message}`);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') || 60) * 1000;
    return rateLimitedResult(retryAfter, 'eBay Insights rate limited');
  }

  if (response.status === 401 || response.status === 403) {
    // Clear cached token so next run re-authenticates
    cachedToken = null;
    tokenExpiresAt = 0;
    return unavailableResult(
      `eBay Insights access denied (HTTP ${response.status}). ` +
      'This account may not have Marketplace Insights API access.'
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return errorResult(`eBay Insights HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return errorResult('eBay Insights returned non-JSON response');
  }

  const items = data.itemSales || data.items || [];
  const comps = items.map(mapItem).filter(Boolean);

  return okResult(comps);
}

module.exports = {
  name: 'ebay_insights',
  fetchSoldComps
};
