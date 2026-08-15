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

function norm(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasWord(hay, word) {
  const h = ` ${norm(hay)} `;
  const w = ` ${norm(word)} `;

  return h.includes(w);
}

function money(x) {
  if (!x) return null;

  return {
    value: Number(x.value),
    currency: x.currency
  };
}

const PARALLEL_CONFLICTS = [
  'hyper',
  'wave',
  'china',
  'ice',
  'cracked ice',
  'pink ice',
  'red ice',
  'green ice',
  'blue ice',
  'pulsar',
  'checkerboard',
  'choice',
  'fast break',
  'disco',
  'scope',
  'mojo',
  'shimmer',
  'sparkle',
  'orange',
  'gold',
  'black',
  'purple',
  'pink',
  'red',
  'blue',
  'green',
  'white',
  'neon',
  'ruby',
  'tiger',
  'elephant',
  'snakeskin',
  'prizm break',
  'variation'
];

function scoreExactMatch(item, target) {
  const title = norm(item.title || '');
  const reasons = [];

  let score = 1.0;

  const playerTokens = norm(target.player || '')
    .split(' ')
    .filter(Boolean);

  if (playerTokens.some(t => !hasWord(title, t))) {
    reasons.push('player_mismatch');

    return {
      score: 0,
      status: 'rejected',
      reasons
    };
  }

  if (target.cardNumber) {
    const n = String(target.cardNumber).replace(/^#/, '');

    const patterns = [
      ` ${n} `,
      ` #${n} `
    ];

    if (!patterns.some(p => ` ${title} `.includes(p))) {
      score -= 0.22;
      reasons.push('card_number_not_explicit');
    }
  }

  const yr = norm(target.year || '');

  if (
    yr &&
    !title.includes(yr) &&
    !title.includes(yr.replace('-', ' '))
  ) {
    score -= 0.12;
    reasons.push('year_not_explicit');
  }

  const setTokens = norm(target.set || '')
    .split(' ')
    .filter(
      t =>
        t.length > 2 &&
        !['panini', 'topps'].includes(t)
    );

  if (
    setTokens.length &&
    setTokens.some(t => !hasWord(title, t))
  ) {
    score -= 0.12;
    reasons.push('set_not_explicit');
  }

  const wanted = norm(target.parallel || '');

  if (wanted) {
    for (const conflict of PARALLEL_CONFLICTS) {
      if (
        hasWord(title, conflict) &&
        !wanted.includes(norm(conflict))
      ) {
        reasons.push(`wrong_parallel:${conflict}`);

        return {
          score: 0.25,
          status: 'rejected',
          reasons
        };
      }
    }

    if (
      wanted.includes('silver') &&
      !hasWord(title, 'silver')
    ) {
      score -= 0.28;
      reasons.push('silver_not_explicit');
    }
  }

  const gradedWords = [
    'psa',
    'bgs',
    'sgc',
    'cgc',
    'graded',
    'gem mint',
    'mint 10',
    'psa 10',
    'psa 9'
  ];

  const titleLooksGraded =
    gradedWords.some(x =>
      title.includes(norm(x))
    );

  const itemLooksGraded =
    /^graded$/i.test(
      String(item.condition || '').trim()
    ) ||
    titleLooksGraded;

  if (target.rawOnly && itemLooksGraded) {
    reasons.push('graded_copy');

    return {
      score: 0.2,
      status: 'rejected',
      reasons
    };
  }

  if (
    target.rawOnly &&
    norm(item.condition || '').includes('ungraded')
  ) {
    score += 0.03;
  }

  if (
    wanted &&
    title.includes(wanted)
  ) {
    score += 0.03;
  }

  score = Math.max(
    0,
    Math.min(1, score)
  );

  return {
    score,
    status:
      score >= 0.90
        ? 'accepted'
        : score >= 0.75
          ? 'review'
          : 'rejected',
    reasons
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const player =
      String(req.query.player || '').trim();

    const year =
      String(req.query.year || '').trim();

    const set =
      String(req.query.set || '').trim();

    const cardNumber =
      String(req.query.card_number || '').trim();

    const parallel =
      String(req.query.parallel || '').trim();

    const rawOnly =
      String(req.query.raw_only ?? 'true') !== 'false';

    if (!player) {
      return res.status(400).json({
        error: 'Missing player'
      });
    }

    const q = [
      year,
      set,
      player,
      cardNumber && '#' + cardNumber,
      parallel
    ]
      .filter(Boolean)
      .join(' ');

    const token = await getEbayToken();

    const params = new URLSearchParams({
      q,
      limit: '50'
    });

    const ebayResponse = await fetch(
      'https://api.ebay.com/buy/browse/v1/item_summary/search?' +
      params.toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
      }
    );

    const data = await ebayResponse.json();

    if (!ebayResponse.ok) {
      return res
        .status(ebayResponse.status)
        .json({
          error: 'eBay Browse request failed',
          details: data
        });
    }

    const target = {
      player,
      year,
      set,
      cardNumber,
      parallel,
      rawOnly
    };

    const evaluated =
      (data.itemSummaries || []).map(item => {
        const shipping =
          item.shippingOptions?.[0]?.shippingCost ||
          null;

        const price = money(item.price);
        const ship = money(shipping);

        const totalAsk =
          price &&
          ship &&
          price.currency === ship.currency
            ? price.value + ship.value
            : price?.value ?? null;

        const match =
          scoreExactMatch(item, target);

        return {
          itemId: item.itemId,
          legacyItemId:
            item.legacyItemId || null,

          title:
            item.title || null,

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

          itemCreationDate:
            item.itemCreationDate || null,

          itemEndDate:
            item.itemEndDate || null,

          image:
            item.image?.imageUrl || null,

          itemWebUrl:
            item.itemWebUrl || null,

          seller:
            item.seller || null,

          exactMatchConfidence:
            match.score,

          matchStatus:
            match.status,

          rejectionReasons:
            match.reasons
        };
      });

    const accepted =
      evaluated.filter(
        x =>
          x.matchStatus === 'accepted' &&
          x.exactMatchConfidence >= 0.90
      );

    const asks = accepted
      .map(x => x.totalAsk)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    const median =
      asks.length
        ? asks.length % 2
          ? asks[(asks.length - 1) / 2]
          : (
              asks[asks.length / 2 - 1] +
              asks[asks.length / 2]
            ) / 2
        : null;

    return res.status(200).json({
      source: 'ebay_browse_exact',
      marketplace: 'EBAY_US',
      query: q,
      target,

      rawReturned:
        evaluated.length,

      exactAccepted:
        accepted.length,

      market: {
        lowestAsk:
          asks[0] ?? null,

        medianAsk:
          median,

        exactActiveListings:
          accepted.length
      },

      accepted,

      rejected:
        evaluated.filter(
          x => x.matchStatus === 'rejected'
        ),

      review:
        evaluated.filter(
          x => x.matchStatus === 'review'
        )
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        'Unexpected error'
    });
  }
};
