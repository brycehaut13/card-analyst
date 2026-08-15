let cachedToken = null;
let tokenExpiresAt = 0;

async function getEbayToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing eBay credentials in Vercel');
  }

  const basic = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'https://api.ebay.com/oauth/api_scope'
  });

  const response = await fetch(
    'https://api.ebay.com/identity/v1/oauth2/token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
      data.error ||
      'eBay OAuth failed'
    );
  }

  cachedToken = data.access_token;
  tokenExpiresAt =
    Date.now() + (Number(data.expires_in) || 7200) * 1000;

  return cachedToken;
}

function money(x) {
  if (!x) return null;

  return {
    value: Number(x.value),
    currency: x.currency
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const q = String(req.query.q || '').trim();

    if (!q) {
      return res.status(400).json({
        error: 'Missing q search parameter'
      });
    }

    const requestedLimit =
      Number(req.query.limit) || 25;

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      50
    );

    const token = await getEbayToken();

    const params = new URLSearchParams({
      q,
      limit: String(limit)
    });

    const url =
      'https://api.ebay.com/buy/browse/v1/item_summary/search?' +
      params.toString();

    const ebayResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    const data = await ebayResponse.json();

    if (!ebayResponse.ok) {
      return res.status(ebayResponse.status).json({
        error: 'eBay Browse request failed',
        details: data
      });
    }

    const items = (data.itemSummaries || []).map(item => {
      const shipping =
        item.shippingOptions?.[0]?.shippingCost || null;

      const price = money(item.price);
      const ship = money(shipping);

      const totalAsk =
        price &&
        ship &&
        price.currency === ship.currency
          ? price.value + ship.value
          : price?.value ?? null;

      return {
        itemId: item.itemId,
        legacyItemId: item.legacyItemId || null,

        title: item.title || null,

        price,
        shipping: ship,
        totalAsk,

        buyingOptions:
          item.buyingOptions || [],

        bidCount:
          item.bidCount ?? null,

        currentBidPrice:
          money(item.currentBidPrice),

        condition:
          item.condition || null,

        conditionId:
          item.conditionId || null,

        itemCreationDate:
          item.itemCreationDate || null,

        itemEndDate:
          item.itemEndDate || null,

        image:
          item.image?.imageUrl || null,

        itemWebUrl:
          item.itemWebUrl || null,

        seller:
          item.seller
            ? {
                username:
                  item.seller.username || null,
                feedbackPercentage:
                  item.seller.feedbackPercentage ?? null,
                feedbackScore:
                  item.seller.feedbackScore ?? null
              }
            : null
      };
    });

    const asks = items
      .map(x => x.totalAsk)
      .filter(x => Number.isFinite(x))
      .sort((a, b) => a - b);

    const medianAsk =
      asks.length === 0
        ? null
        : asks.length % 2
          ? asks[Math.floor(asks.length / 2)]
          : (
              asks[asks.length / 2 - 1] +
              asks[asks.length / 2]
            ) / 2;

    return res.status(200).json({
      source: 'ebay_browse',
      marketplace: 'EBAY_US',
      query: q,

      totalMatching:
        data.total ?? null,

      returned:
        items.length,

      market: {
        lowestAsk:
          asks.length ? asks[0] : null,

        medianAsk,

        activeListings:
          data.total ?? items.length
      },

      items
    });
  } catch (error) {
    console.error('eBay search error', error);

    return res.status(500).json({
      error:
        error.message ||
        'Unexpected eBay search error'
    });
  }
};
