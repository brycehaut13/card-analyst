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
  return ` ${norm(hay)} `.includes(
    ` ${norm(word)} `
  );
}

function money(x) {
  return x
    ? {
        value: Number(x.value),
        currency: x.currency
      }
    : null;
}

function containsNormalizedPhrase(hay, phrase) {
  const h = ` ${norm(hay)} `;
  const p = ` ${norm(phrase)} `;

  return p.trim() && h.includes(p);
}

function hasSerial(title, serialTo) {
  if (!serialTo) return false;

  const escaped =
    String(serialTo).replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

  return new RegExp(
    `/\\s*${escaped}(?:\\D|$)`,
    'i'
  ).test(String(title || ''));
}

function extractSerials(title) {
  return [
    ...String(title || '').matchAll(
      /\/\s*(\d{1,5})(?=\D|$)/g
    )
  ].map(m => Number(m[1]));
}

function looksLikeLot(title) {
  const t = norm(title);

  return (
    /(^| )(lot|bundle|set of)( |$)/.test(t) ||
    /(^| )x ?[2-9][0-9]*( |$)/.test(t) ||
    /(^| )[2-9][0-9]*x( |$)/.test(t)
  );
}

const PARALLEL_CONFLICTS = [
  'silver',
  'refractor',
  'holo',
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
  'super short print',
  'mini diamond',
  'mini-diamond',
  'superfractor',
  'super fractor',
  'aqua',
  'teal'
];

const BASE_PARALLEL_CONFLICTS = [
  ...PARALLEL_CONFLICTS,
  'pink cracked ice',
  'red white blue',
  'red/white/blue'
];

const SET_STOPWORDS = new Set([
  'topps',
  'panini',
  'baseball',
  'basketball',
  'football',
  'card',
  'cards',
  'trading',
  'autograph',
  'autographs'
]);

function scoreExactMatch(item, target) {
  const rawTitle =
    String(item.title || '');

  const title =
    norm(rawTitle);

  const targetSet =
    norm(target.set || '');

  const wanted =
    norm(target.parallel || '');

  const wantedGrader =
    norm(target.grader || '');

  const wantedGrade =
    norm(target.grade || '');

  const reasons = [];

  let score = 1.0;

  const playerTokens =
    norm(target.player || '')
      .split(' ')
      .filter(Boolean);

  if (
    playerTokens.some(
      token => !hasWord(title, token)
    )
  ) {
    return {
      score: 0,
      status: 'rejected',
      reasons: ['player_mismatch']
    };
  }

  if (looksLikeLot(rawTitle)) {
    return {
      score: 0.1,
      status: 'rejected',
      reasons: ['multi_card_or_lot']
    };
  }

  if (target.cardNumber) {
    const cardPhrase =
      norm(
        String(target.cardNumber)
          .replace(/^#/, '')
      );

    if (
      !containsNormalizedPhrase(
        title,
        cardPhrase
      )
    ) {
      score -= 0.26;

      reasons.push(
        'card_number_not_explicit'
      );
    }
  }

  const yearTokens =
    norm(target.year || '')
      .split(' ')
      .filter(Boolean);

  if (
    yearTokens.length &&
    yearTokens.some(
      y => !hasWord(title, y)
    )
  ) {
    score -= 0.10;

    reasons.push(
      'year_not_explicit'
    );
  }

  const setTokens =
    targetSet
      .split(' ')
      .filter(
        token =>
          token.length > 2 &&
          !SET_STOPWORDS.has(token)
      );

  if (
    setTokens.length &&
    setTokens.some(
      token =>
        !hasWord(title, token)
    )
  ) {
    score -= 0.10;

    reasons.push(
      'set_not_explicit'
    );
  }

  const parallelConflicts =
    wanted
      ? PARALLEL_CONFLICTS
      : BASE_PARALLEL_CONFLICTS;

  for (
    const conflict
    of parallelConflicts
  ) {
    const conflictNorm =
      norm(conflict);

    const conflictIsSetWord =
      targetSet.includes(
        conflictNorm
      );

    const conflictIsWanted =
      wanted.includes(
        conflictNorm
      );

    if (
      hasWord(title, conflict) &&
      !conflictIsWanted &&
      !conflictIsSetWord
    ) {
      return {
        score: 0.25,
        status: 'rejected',
        reasons: [
          `wrong_parallel:${conflict}`
        ]
      };
    }
  }

  if (wanted) {

    const wantedTokens =
      wanted
        .split(' ')
        .filter(
          token =>
            token.length > 2 &&
            ![
              'prizm',
              'refractor'
            ].includes(token)
        );

    if (
      wantedTokens.length &&
      wantedTokens.some(
        token =>
          !hasWord(title, token)
      )
    ) {
      score -= 0.18;

      reasons.push(
        'parallel_not_explicit'
      );
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

  if (target.serialTo) {
    const serials =
      extractSerials(rawTitle);

    if (
      serials.length &&
      !serials.includes(
        Number(target.serialTo)
      )
    ) {
      return {
        score: 0.15,
        status: 'rejected',
        reasons: [
          `wrong_serial:/${serials.join(',/')}`
        ]
      };
    }

    if (
      !hasSerial(
        rawTitle,
        target.serialTo
      )
    ) {
      score -= 0.22;

      reasons.push(
        'serial_not_explicit'
      );
    }
  }

  if (target.isAutograph) {
    const autoExplicit =
      /(^| )(auto|autograph|autographs)( |$)/
        .test(title);

    if (!autoExplicit) {
      return {
        score: 0.45,
        status: 'rejected',
        reasons: [
          'autograph_not_explicit'
        ]
      };
    }
  } else if (
    /(^| )(auto|autograph|autographs)( |$)/
      .test(title)
  ) {
    return {
      score: 0.25,
      status: 'rejected',
      reasons: [
        'unexpected_autograph'
      ]
    };
  }

  const gradedWords = [
    'psa',
    'bgs',
    'sgc',
    'cgc',
    'graded',
    'gem mint',
    'mint 10'
  ];

  const titleLooksGraded =
    gradedWords.some(
      word =>
        containsNormalizedPhrase(
          title,
          word
        )
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
    return {
      score: 0.2,
      status: 'rejected',
      reasons: [
        ...reasons,
        'graded_copy'
      ]
    };
  }

  const titleGraderMatch =
    String(rawTitle).match(
      /\b(psa|bgs|sgc|cgc|gma|beckett)\b/i
    );

  const titleGradeMatch =
    String(rawTitle).match(
      /\b(?:psa|bgs|sgc|cgc|gma|beckett)\s*(\d{1,2}(?:\.\d)?)\b/i
    );

  const titleGrader =
    norm(
      titleGraderMatch?.[1] || ''
    );

  const titleGrade =
    norm(
      titleGradeMatch?.[1] || ''
    );

  if (wantedGrader) {
    if (
      titleGrader &&
      !(
        titleGrader === wantedGrader ||
        (
          wantedGrader ===
            'beckett' &&
          titleGrader === 'bgs'
        ) ||
        (
          wantedGrader === 'bgs' &&
          titleGrader ===
            'beckett'
        )
      )
    ) {
      return {
        score: 0.2,
        status: 'rejected',
        reasons: [
          `wrong_grader:${titleGrader}`
        ]
      };
    }

    if (
      !hasWord(title, wantedGrader) &&
      !(
        wantedGrader ===
          'beckett' &&
        hasWord(title, 'bgs')
      ) &&
      !(
        wantedGrader === 'bgs' &&
        hasWord(title, 'beckett')
      )
    ) {
      score -= 0.22;

      reasons.push(
        'grader_not_explicit'
      );
    }
  }

  if (wantedGrade) {
    if (
      titleGrade &&
      titleGrade !== wantedGrade
    ) {
      return {
        score: 0.2,
        status: 'rejected',
        reasons: [
          `wrong_grade:${titleGrade}`
        ]
      };
    }

    if (
      !containsNormalizedPhrase(
        title,
        wantedGrade
      )
    ) {
      score -= 0.22;

      reasons.push(
        'grade_not_explicit'
      );
    }
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
    containsNormalizedPhrase(
      title,
      wanted
    )
  ) {
    score += 0.03;
  }

  if (
    target.serialTo &&
    hasSerial(
      rawTitle,
      target.serialTo
    )
  ) {
    score += 0.03;
  }

  if (
    target.isAutograph &&
    /(^| )(auto|autograph|autographs)( |$)/
      .test(title)
  ) {
    score += 0.02;
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

    const serialTo =
      req.query.serial_to
        ? Number(
            req.query.serial_to
          )
        : null;

    const isAutograph =
      String(
        req.query.is_autograph ??
        'false'
      ) === 'true';

    const rawOnly =
      String(
        req.query.raw_only ??
        'true'
      ) !== 'false';

    const grade =
      String(
        req.query.grade || ''
      ).trim();

    const grader =
      String(
        req.query.grader || ''
      ).trim();

    if (!player) {
      return res
        .status(400)
        .json({
          error:
            'Missing player'
        });
    }

    if (
      req.query.serial_to &&
      (
        !Number.isFinite(
          serialTo
        ) ||
        serialTo <= 0
      )
    ) {
      return res
        .status(400)
        .json({
          error:
            'serial_to must be a positive number'
        });
    }

    const searchQuery = [
      year,
      set,
      player,

      cardNumber &&
        `#${cardNumber}`,

      parallel,

      serialTo &&
        `/${serialTo}`,

      isAutograph &&
        'Auto',

      grader,

      grade
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
      serialTo,
      isAutograph,
      rawOnly,
      grade,
      grader
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
          (a, b) =>
            a - b
        );

    const medianOf =
      array => {
        if (!array.length) {
          return null;
        }

        return (
          array.length % 2
            ? array[
                (
                  array.length -
                  1
                ) / 2
              ]
            : (
                array[
                  array.length /
                  2 -
                  1
                ] +
                array[
                  array.length /
                  2
                ]
              ) /
              2
        );
      };

    const quantile =
      p => {
        if (!asks.length) {
          return null;
        }

        const index =
          (
            asks.length -
            1
          ) * p;

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
          (
            index -
            lower
          )
        );
      };

    const medianAsk =
      medianOf(asks);

    const p25Ask =
      quantile(0.25);

    const p75Ask =
      quantile(0.75);

    const iqr =
      p25Ask == null ||
      p75Ask == null
        ? null
        : p75Ask -
          p25Ask;

    const lowerFence =
      iqr == null
        ? null
        : Math.max(
            0,
            p25Ask -
            1.5 * iqr
          );

    const upperFence =
      iqr == null
        ? null
        : p75Ask +
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

    return res
      .status(200)
      .json({
        source:
          'ebay_browse_exact_v2',

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

          medianAsk,

          robustMedianAsk:
            medianOf(
              robustAsks
            ),

          p25Ask,

          p75Ask,

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

if (process.env.NODE_ENV === 'test') {
  module.exports._test = {
    scoreExactMatch
  };
}
