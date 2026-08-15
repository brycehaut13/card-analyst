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
    Date.now() +
    (Number(data.expires_in) || 7200) * 1000;

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
  'variation',
  'glitter',
  'silver glitter',
  'ssp',
  'super short print'
];

function scoreExactMatch(item, target) {
  const title = norm(item.title || '');
  const reasons = [];

  let score = 1.0;

  const playerTokens = norm(target.player || '')
    .split(' ')
    .filter(Boolean);

  if (
    playerTokens.some(
      token => !hasWord(title, token)
    )
  ) {
    reasons.push('player_mismatch');

    return {
      score: 0,
      status: 'rejected',
      reasons
    };
  }

  if (target.cardNumber) {
    const number = String(
      target.cardNumber
    ).replace(/^#/, '');

    const patterns = [
      ` ${number} `,
      ` #${number} `
    ];

    if (
      !patterns.some(
        pattern =>
          ` ${title} `.includes(pattern)
      )
    ) {
      score -= 0.22;

      reasons.push(
        'card_number_not_explicit'
      );
    }
  }

  const year = norm(target.year || '');

  if (
    year &&
    !title.includes(year) &&
    !title.includes(
      year.replace('-', ' ')
    )
  ) {
    score -= 0.12;

    reasons.push(
      'year_not_explicit'
    );
  }

  const setTokens = norm(
    target.set || ''
  )
    .split(' ')
    .filter(
      token =>
        token.length > 2 &&
        !['panini', 'topps'].includes(
          token
        )
    );

  if (
    setTokens.length &&
    setTokens.some(
      token =>
        !hasWord(title, token)
    )
  ) {
    score -= 0.12;

    reasons.push(
      'set_not_explicit'
    );
  }

  const wanted = norm(
    target.parallel || ''
  );

  if (wanted) {
    for (
      const conflict
      of PARALLEL_CONFLICTS
    ) {
      if (
        hasWord(title, conflict) &&
        !wanted.includes(
          norm(conflict)
        )
      ) {
        reasons.push(
          `wrong_parallel:${conflict}`
        );

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

      reasons.push(
        'silver_not_explicit'
      );
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
    gradedWords.some(
      word =>
        title.includes(norm(word))
    );

  const itemLooksGraded =
    /^graded$/i.test(
      String(
        item.condition || ''
      ).trim()
    ) ||
    titleLooksGraded;

  if (
    target.rawOnly &&
    itemLooksGraded
  ) {
    reasons.push('graded_copy');

    return {
      score: 0.2,
      status: 'rejected',
      reasons
    };
  }

  if (
    target.rawOnly &&
    norm(
      item.condition || ''
    ).includes('ungraded')
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

module.exports =
async function handler(req, res) {

  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({
        error:
          'Method not allowed'
      });
  }

  try {
    const player =
      String(
        req.query.player || ''
      ).trim();

    const year =
      String(
        req.query.year || ''
      ).trim();

    const set =
      String(
        req.query.set || ''
      ).trim();

    const cardNumber =
      String(
        req.query.card_number || ''
      ).trim();

    const parallel =
      String(
        req.query.parallel || ''
      ).trim();

    const rawOnly =
      String(
        req.query.raw_only ??
        'true'
      ) !== 'false';

    if (!player) {
      return res
        .status(400)
        .json({
          error:
            'Missing player'
        });
    }

    const searchQuery = [
      year,
      set,
      player,

      cardNumber &&
        '#' + cardNumber,

      parallel
    ]
      .filter(Boolean)
      .join(' ');

    const token =
      await getEbayToken();

    const params =
      new URLSearchParams({
        q: searchQuery,
        limit: '50'
      });

    const ebayResponse =
      await fetch(
        'https://api.ebay.com/buy/browse/v1/item_summary/search?' +
        params.toString(),
        {
          headers: {
            Authorization:
              `Bearer ${token}`,

            'X-EBAY-C-MARKETPLACE-ID':
              'EBAY_US'
          }
        }
      );

    const data =
      await ebayResponse.json();

    if (!ebayResponse.ok) {
      return res
        .status(
          ebayResponse.status
        )
        .json({
          error:
            'eBay Browse request failed',

          details:
            data
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
      (
        data.itemSummaries || []
      ).map(item => {

        const shipping =
          item
            .shippingOptions?.[0]
            ?.shippingCost ||
          null;

        const price =
          money(item.price);

        const ship =
          money(shipping);

        const totalAsk =
          price &&
          ship &&
          price.currency ===
            ship.currency
            ? price.value +
              ship.value
            : price?.value ??
              null;

        const match =
          scoreExactMatch(
            item,
            target
          );

        return {
          itemId:
            item.itemId,

          legacyItemId:
            item.legacyItemId ||
            null,

          title:
            item.title ||
            null,

          price,

          shipping:
            ship,

          totalAsk,

          buyingOptions:
            item.buyingOptions ||
            [],

          bidCount:
            item.bidCount ??
            null,

          currentBidPrice:
            money(
              item.currentBidPrice
            ),

          condition:
            item.condition ||
            null,

          itemCreationDate:
            item.itemCreationDate ||
            null,

          itemEndDate:
            item.itemEndDate ||
            null,

          image:
            item.image?.imageUrl ||
            null,

          itemWebUrl:
            item.itemWebUrl ||
            null,

          seller:
            item.seller ||
            null,

          itemLocation:
            item.itemLocation ||
            null,

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
        item =>
          item.matchStatus ===
            'accepted' &&
          item
            .exactMatchConfidence >=
            0.90
      );

    const asks =
      accepted
        .map(
          item =>
            item.totalAsk
        )
        .filter(
          Number.isFinite
        )
        .sort(
          (a, b) => a - b
        );

    const medianOf =
      array => {
        if (!array.length) {
          return null;
        }

        if (
          array.length % 2
        ) {
          return array[
            (array.length - 1) /
            2
          ];
        }

        return (
          array[
            array.length / 2 -
            1
          ] +
          array[
            array.length / 2
          ]
        ) / 2;
      };

    const median =
      medianOf(asks);

    const quantile =
      p => {
        if (!asks.length) {
          return null;
        }

        const index =
          (asks.length - 1) *
          p;

        const lower =
          Math.floor(index);

        const upper =
          Math.ceil(index);

        if (
          lower === upper
        ) {
          return asks[lower];
        }

        return (
          asks[lower] +
          (
            asks[upper] -
            asks[lower]
          ) *
          (index - lower)
        );
      };

    const p25 =
      quantile(0.25);

    const p75 =
      quantile(0.75);

    const iqr =
      p25 == null ||
      p75 == null
        ? null
        : p75 - p25;

    const lowerFence =
      iqr == null
        ? null
        : Math.max(
            0,
            p25 -
            1.5 * iqr
          );

    const upperFence =
      iqr == null
        ? null
        : p75 +
          1.5 * iqr;

    const robustAsks =
      asks.filter(
        value =>
          (
            lowerFence ==
              null ||
            value >=
              lowerFence
          ) &&
          (
            upperFence ==
              null ||
            value <=
              upperFence
          )
      );

    const robustMedianAsk =
      medianOf(
        robustAsks
      );

    return res
      .status(200)
      .json({
        source:
          'ebay_browse_exact',

        marketplace:
          'EBAY_US',

        query:
          searchQuery,

        target,

        rawReturned:
          evaluated.length,

        exactAccepted:
          accepted.length,

        market: {
          lowestAsk:
            asks[0] ??
            null,

          medianAsk:
            median,

          robustMedianAsk,

          p25Ask:
            p25,

          p75Ask:
            p75,

          robustListingCount:
            robustAsks.length,

          exactActiveListings:
            accepted.length
        },

        accepted,

        rejected:
          evaluated.filter(
            item =>
              item.matchStatus ===
              'rejected'
          ),

        review:
          evaluated.filter(
            item =>
              item.matchStatus ===
              'review'
          )
      });

  } catch (error) {
    console.error(error);

    return res
      .status(500)
      .json({
        error:
          error.message ||
          'Unexpected error'
      });
  }
};
