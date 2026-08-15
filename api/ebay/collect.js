const MAX_CARDS_PER_RUN = 175;
const CONCURRENCY = 8;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  'https://tjqeuiqyjdhpjgzhfwev.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function sbHeaders(extra = {}) {
  if (!SUPABASE_KEY) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function sb(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: sbHeaders(
        options.headers || {}
      )
    }
  );

  const text =
    await response.text();

  let data = null;

  try {
    data =
      text
        ? JSON.parse(text)
        : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${
        typeof data === 'string'
          ? data
          : JSON.stringify(data)
      }`
    );
  }

  return data;
}

function getOrigin(req) {
  const proto =
    req.headers['x-forwarded-proto'] ||
    'https';

  const host =
    req.headers['x-forwarded-host'] ||
    req.headers.host;

  return `${proto}://${host}`;
}

function num(v) {
  if (
    v === null ||
    v === undefined ||
    v === ''
  ) {
    return null;
  }

  const n = Number(v);

  return Number.isFinite(n)
    ? n
    : null;
}

function median(values) {
  if (!values.length) {
    return null;
  }

  const sorted =
    [...values].sort(
      (a, b) => a - b
    );

  const middle =
    Math.floor(
      sorted.length / 2
    );

  return sorted.length % 2
    ? sorted[middle]
    : (
        sorted[middle - 1] +
        sorted[middle]
      ) / 2;
}

function calculateMarketConfidence(
  market,
  accepted
) {
  const count =
    Number(
      market?.robustListingCount ||
      0
    );

  if (!count) {
    return {
      confidence: 0.15,
      status: 'insufficient',
      flags: [
        'no_exact_active_listings'
      ]
    };
  }

  if (count === 1) {
    return {
      confidence: 0.45,
      status: 'insufficient',
      flags: [
        'single_listing'
      ]
    };
  }

  const p25 =
    num(market?.p25Ask);

  const p75 =
    num(market?.p75Ask);

  const robustMedian =
    num(
      market?.robustMedianAsk
    );

  let dispersion = null;

  if (
    p25 !== null &&
    p75 !== null &&
    robustMedian > 0
  ) {
    dispersion =
      (p75 - p25) /
      robustMedian;
  }

  let confidence;

  if (count >= 15) {
    confidence = 0.96;
  } else if (count >= 10) {
    confidence = 0.94;
  } else if (count >= 7) {
    confidence = 0.91;
  } else if (count >= 5) {
    confidence = 0.86;
  } else if (count >= 3) {
    confidence = 0.68;
  } else {
    confidence = 0.58;
  }

  const flags = [];

  if (
    dispersion !== null &&
    dispersion > 1
  ) {
    confidence -= 0.18;

    flags.push(
      'very_high_dispersion'
    );
  } else if (
    dispersion !== null &&
    dispersion > 0.55
  ) {
    confidence -= 0.10;

    flags.push(
      'high_dispersion'
    );
  }

  if (
    accepted.some(
      item =>
        Number(
          item?.seller
            ?.feedbackScore || 0
        ) < 10
    )
  ) {
    confidence -= 0.04;

    flags.push(
      'low_history_seller_present'
    );
  }

  const asks =
    accepted
      .map(
        item =>
          num(item.totalAsk)
      )
      .filter(
        value =>
          value !== null &&
          value > 0
      );

  const askMedian =
    median(asks);

  if (
    askMedian &&
    asks.some(
      value =>
        value <
        askMedian * 0.35
    )
  ) {
    flags.push(
      'extreme_low_possible_mislabel'
    );
  }

  confidence =
    Math.max(
      0.10,
      Math.min(
        0.98,
        confidence
      )
    );

  let status =
    'review';

  if (
    count >= 5 &&
    confidence >= 0.90
  ) {
    status =
      'usable';
  } else if (
    count < 2
  ) {
    status =
      'insufficient';
  }

  return {
    confidence,
    status,
    flags
  };
}

function listingRow(
  target,
  item,
  observedAt
) {
  const seller =
    item.seller || {};

  const title =
    String(
      item.title || ''
    );

  const condition =
    String(
      item.condition || ''
    );

  const isGraded =
    /^graded$/i.test(
      condition.trim()
    ) ||
    /\b(psa|bgs|sgc|cgc|gma)\b/i
      .test(title);

  return {
    catalog_id:
      target.catalog_id,

    source_item_id:
      String(
        item.legacyItemId ||
        item.itemId
      ),

    title:
      item.title || null,

    item_url:
      item.itemWebUrl || null,

    image_url:
      item.image || null,

    condition_text:
      item.condition || null,

    is_graded:
      isGraded,

    grader:
      null,

    grade:
      null,

    buying_options:
      item.buyingOptions || [],

    price:
      num(
        item.price?.value
      ),

    shipping:
      num(
        item.shipping?.value
      ),

    total_ask:
      num(
        item.totalAsk
      ),

    bid_count:
      item.bidCount ?? null,

    current_bid:
      num(
        item.currentBidPrice
          ?.value
      ),

    seller_username:
      seller.username || null,

    seller_feedback_pct:
      num(
        seller.feedbackPercentage
      ),

    seller_feedback_score:
      seller.feedbackScore ==
      null
        ? null
        : Number(
            seller.feedbackScore
          ),

    item_created_at:
      item.itemCreationDate ||
      null,

    item_end_at:
      item.itemEndDate ||
      null,

    observed_at:
      observedAt,

    exact_match_confidence:
      num(
        item.exactMatchConfidence
      ) || 0,

    match_status:
      item.matchStatus ||
      'rejected',

    rejection_reasons:
      item.rejectionReasons ||
      [],

    identity_payload: {
      player:
        target.player_name,

      year:
        target.year,

      set:
        target.set_name,

      cardNumber:
        target.card_number,

      parallel:
        target.parallel,

      serialTo:
        target.serial_to,

      isAutograph:
        target.require_autograph
    },

    raw_payload:
      item
  };
}

async function insertListings(
  rows
) {
  if (!rows.length) {
    return;
  }

  await sb(
    'ebay_active_listing_observations',
    {
      method: 'POST',

      headers: {
        Prefer:
          'return=minimal'
      },

      body:
        JSON.stringify(rows)
    }
  );
}

async function insertSnapshot(
  target,
  result,
  observedAt
) {
  const market =
    result.market || {};

  const accepted =
    result.accepted || [];

  const quality =
    calculateMarketConfidence(
      market,
      accepted
    );

  const p25 =
    num(market.p25Ask);

  const p75 =
    num(market.p75Ask);

  await sb(
    'ebay_market_snapshots',
    {
      method: 'POST',

      headers: {
        Prefer:
          'return=minimal'
      },

      body:
        JSON.stringify({
          catalog_id:
            target.catalog_id,

          observed_at:
            observedAt,

          source_name:
            'ebay_browse_hourly',

          exact_active_listings:
            Number(
              market
                .exactActiveListings ||
              0
            ),

          robust_listing_count:
            Number(
              market
                .robustListingCount ||
              0
            ),

          lowest_ask:
            num(
              market.lowestAsk
            ),

          median_ask:
            num(
              market.medianAsk
            ),

          robust_median_ask:
            num(
              market
                .robustMedianAsk
            ),

          p25_ask:
            p25,

          p75_ask:
            p75,

          iqr_ask:
            p25 !== null &&
            p75 !== null
              ? p75 - p25
              : null,

          market_confidence:
            quality.confidence,

          quality_status:
            quality.status,

          quality_flags:
            quality.flags,

          notes:
            `Hourly eBay collection. ` +
            `Raw=${result.rawReturned || 0}; ` +
            `accepted=${result.exactAccepted || 0}; ` +
            `review=${
              result.review?.length || 0
            }.`
        })
    }
  );
}

async function updateQueueSuccess(
  target,
  result,
  observedAt
) {
  const accepted =
    Number(
      result.exactAccepted ||
      0
    );

  const reviews =
    Array.isArray(
      result.review
    )
      ? result.review.length
      : 0;

  const status =
    accepted > 0
      ? 'matched'
      : reviews > 0
        ? 'needs_review'
        : 'pending';

  const emptyRuns =
    accepted === 0
      ? Number(
          target
            .consecutive_empty_runs ||
          0
        ) + 1
      : 0;

  const refreshMinutes =
    Number(
      target
        .effective_refresh_minutes ||
      target
        .refresh_interval_minutes ||
      60
    );

  const nextAttempt =
    new Date(
      Date.now() +
      refreshMinutes *
      60 *
      1000
    ).toISOString();

  await sb(
    `ebay_enrichment_queue?id=eq.${target.queue_id}`,
    {
      method: 'PATCH',

      headers: {
        Prefer:
          'return=minimal'
      },

      body:
        JSON.stringify({
          status,

          last_attempt_at:
            observedAt,

          last_success_at:
            observedAt,

          next_attempt_at:
            nextAttempt,

          attempt_count:
            Number(
              target.attempt_count ||
              0
            ) + 1,

          accepted_listing_count:
            accepted,

          last_listing_count:
            Number(
              result.rawReturned ||
              0
            ),

          consecutive_empty_runs:
            emptyRuns,

          last_error:
            null,

          updated_at:
            observedAt
        })
    }
  );
}

async function updateQueueFailure(
  target,
  error,
  observedAt
) {
  await sb(
    `ebay_enrichment_queue?id=eq.${target.queue_id}`,
    {
      method: 'PATCH',

      headers: {
        Prefer:
          'return=minimal'
      },

      body:
        JSON.stringify({
          last_attempt_at:
            observedAt,

          attempt_count:
            Number(
              target.attempt_count ||
              0
            ) + 1,

          last_error:
            String(
              error?.message ||
              error
            ).slice(
              0,
              1500
            ),

          updated_at:
            observedAt
        })
    }
  );
}

async function createRun(
  startedAt
) {
  const rows =
    await sb(
      'ebay_collection_runs',
      {
        method: 'POST',

        headers: {
          Prefer:
            'return=representation'
        },

        body:
          JSON.stringify({
            run_type:
              'hourly',

            started_at:
              startedAt,

            status:
              'running',

            cards_attempted:
              0,

            cards_succeeded:
              0,

            cards_failed:
              0,

            listings_observed:
              0,

            notes:
              `Hourly collector; max ${MAX_CARDS_PER_RUN}, concurrency ${CONCURRENCY}.`
          })
      }
    );

  return rows?.[0]?.id;
}

async function finishRun(
  runId,
  stats,
  status
) {
  if (!runId) {
    return;
  }

  await sb(
    `ebay_collection_runs?id=eq.${runId}`,
    {
      method: 'PATCH',

      headers: {
        Prefer:
          'return=minimal'
      },

      body:
        JSON.stringify({
          finished_at:
            new Date()
              .toISOString(),

          status,

          cards_attempted:
            stats.attempted,

          cards_succeeded:
            stats.succeeded,

          cards_failed:
            stats.failed,

          listings_observed:
            stats.listings,

          notes:
            `Hourly run: ` +
            `${stats.succeeded} succeeded, ` +
            `${stats.failed} failed, ` +
            `${stats.listings} observations saved.`
        })
    }
  );
}

async function getDueTargets() {
  return (
    await sb(
      'ebay_hourly_due_targets' +
      '?select=*' +
      '&order=priority.desc,last_checked_at.asc.nullsfirst' +
      `&limit=${MAX_CARDS_PER_RUN}`
    )
  ) || [];
}

async function searchCard(
  req,
  target
) {
  const params =
    new URLSearchParams();

  params.set(
    'player',
    target.player_name
  );

  if (target.year) {
    params.set(
      'year',
      target.year
    );
  }

  if (target.set_name) {
    params.set(
      'set',
      target.set_name
    );
  }

  if (target.card_number) {
    params.set(
      'card_number',
      target.card_number
    );
  }

  if (target.parallel) {
    params.set(
      'parallel',
      target.parallel
    );
  }

  if (target.serial_to) {
    params.set(
      'serial_to',
      String(
        target.serial_to
      )
    );
  }

  params.set(
    'is_autograph',
    target.require_autograph
      ? 'true'
      : 'false'
  );

  params.set(
    'raw_only',
    'true'
  );

  const response =
    await fetch(
      `${getOrigin(req)}/api/ebay/search?${params.toString()}`,
      {
        headers: {
          'User-Agent':
            'CardAnalyst-Collector/2.0'
        }
      }
    );

  const text =
    await response.text();

  let data;

  try {
    data =
      JSON.parse(text);
  } catch {
    throw new Error(
      `Search returned invalid JSON: ${
        text.slice(0, 250)
      }`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      `Search failed ${
        response.status
      }`
    );
  }

  return data;
}

async function processTarget(
  req,
  target
) {
  const observedAt =
    new Date()
      .toISOString();

  try {
    const result =
      await searchCard(
        req,
        target
      );

    /*
     * Save EVERYTHING.
     *
     * Accepted, review and rejected
     * observations all become useful
     * historical training/research data.
     */
    const allItems = [
      ...(result.accepted || []),
      ...(result.review || []),
      ...(result.rejected || [])
    ];

    const rows =
      allItems.map(
        item =>
          listingRow(
            target,
            item,
            observedAt
          )
      );

    await insertListings(
      rows
    );

    await insertSnapshot(
      target,
      result,
      observedAt
    );

    await updateQueueSuccess(
      target,
      result,
      observedAt
    );

    return {
      success: true,
      listings:
        rows.length,

      catalogId:
        target.catalog_id
    };

  } catch (error) {
    console.error(
      'Collector target failed',
      target.catalog_id,
      error
    );

    try {
      await updateQueueFailure(
        target,
        error,
        observedAt
      );
    } catch (
      queueError
    ) {
      console.error(
        'Queue update also failed',
        queueError
      );
    }

    return {
      success: false,
      listings: 0,

      catalogId:
        target.catalog_id,

      error:
        String(
          error?.message ||
          error
        )
    };
  }
}

async function runInBatches(
  req,
  targets
) {
  const output = [];

  for (
    let i = 0;
    i < targets.length;
    i += CONCURRENCY
  ) {
    const batch =
      targets.slice(
        i,
        i + CONCURRENCY
      );

    const results =
      await Promise.all(
        batch.map(
          target =>
            processTarget(
              req,
              target
            )
        )
      );

    output.push(
      ...results
    );
  }

  return output;
}

module.exports =
async function handler(req, res) {
  if (
    req.method !== 'GET' &&
    req.method !== 'POST'
  ) {
    return res
      .status(405)
      .json({
        error:
          'Method not allowed'
      });
  }

  const cronSecret =
    process.env.CRON_SECRET;

  if (!cronSecret) {
    return res
      .status(500)
      .json({
        error:
          'CRON_SECRET is not configured'
      });
  }

  if (
    req.headers.authorization !==
    `Bearer ${cronSecret}`
  ) {
    return res
      .status(401)
      .json({
        error:
          'Unauthorized'
      });
  }

  const startedAt =
    new Date()
      .toISOString();

  let runId = null;

  const stats = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    listings: 0
  };

  try {
    runId =
      await createRun(
        startedAt
      );

    const targets =
      await getDueTargets();

    stats.attempted =
      targets.length;

    if (!targets.length) {
      await finishRun(
        runId,
        stats,
        'success'
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            'No cards currently due',

          runId,

          apiBudget: {
            maxPerRun:
              MAX_CARDS_PER_RUN,

            maxDailyAtFullHourlyUsage:
              MAX_CARDS_PER_RUN *
              24,

            ebayBrowseDailyLimit:
              5000
          }
        });
    }

    const results =
      await runInBatches(
        req,
        targets
      );

    for (
      const result
      of results
    ) {
      if (result.success) {
        stats.succeeded += 1;
      } else {
        stats.failed += 1;
      }

      stats.listings +=
        result.listings || 0;
    }

    const runStatus =
      stats.failed === 0
        ? 'success'
        : stats.succeeded > 0
          ? 'partial'
          : 'failed';

    await finishRun(
      runId,
      stats,
      runStatus
    );

    return res
      .status(200)
      .json({
        success:
          runStatus !== 'failed',

        runId,

        runStatus,

        cardsDue:
          targets.length,

        cardsSucceeded:
          stats.succeeded,

        cardsFailed:
          stats.failed,

        listingObservationsSaved:
          stats.listings,

        collector: {
          concurrency:
            CONCURRENCY,

          maxCardsPerRun:
            MAX_CARDS_PER_RUN
        },

        apiBudget: {
          maxDailyAtFullHourlyUsage:
            MAX_CARDS_PER_RUN *
            24,

          reservedDailyHeadroom:
            5000 -
            MAX_CARDS_PER_RUN *
            24,

          ebayBrowseDailyLimit:
            5000
        },

        finishedAt:
          new Date()
            .toISOString()
      });

  } catch (error) {
    console.error(
      'Hourly collector failed',
      error
    );

    try {
      await finishRun(
        runId,
        stats,
        'failed'
      );
    } catch {}

    return res
      .status(500)
      .json({
        success: false,

        error:
          error?.message ||
          'Collector failed'
      });
  }
};
