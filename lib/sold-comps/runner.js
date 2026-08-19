/**
 * Scheduled enrichment runner for the sold-comp ingestion pipeline.
 *
 * Built for short, resilient Vercel executions:
 *  - small batches
 *  - one card at a time
 *  - hard runtime budget
 *  - checkpoint after every card
 *  - graceful exit before Vercel timeout
 */

'use strict';

const ebayInsightsAdapter =
  require('./providers/ebay-insights');

const { ingestComps } =
  require('./ingest');

const {
  DEFAULT_BATCH_SIZE,
  getDueTargets,
  markQueueSuccess,
  markQueueFailure,
  createRunLog,
  finishRunLog
} = require('./queue');

const {
  PROVIDER_STATUS
} = require('./providers/base');

const {
  sb
} = require('./supabase-client');

// -------------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------------

const BATCH_SIZE = Math.min(
  Math.max(
    parseInt(
      process.env.SOLD_COMP_BATCH_SIZE ||
      String(DEFAULT_BATCH_SIZE || 8),
      10
    ) || 8,
    1
  ),
  12
);

/*
 * Keep this serial by default.
 *
 * Four cards at once was creating unnecessary pressure on Supabase
 * and made partial progress harder to checkpoint.
 */
const CONCURRENCY = 1;

/*
 * Vercel currently kills this function at roughly 60 seconds.
 * Stop voluntarily well before that.
 */
const MAX_RUNTIME_MS = Math.min(
  Math.max(
    parseInt(
      process.env.SOLD_COMP_RUNTIME_BUDGET_MS ||
      '43000',
      10
    ) || 43000,
    15000
  ),
  48000
);

const TARGET_SOFT_TIMEOUT_MS = 14000;

const BASE_RETRY_DELAY_MS = 1200;
const MAX_RETRIES = 1;

// Normal cards: once per day
const NORMAL_INTERVAL_MS =
  24 * 60 * 60 * 1000;

// Flips-related cards: every 6 hours
const FLIPS_INTERVAL_MS =
  6 * 60 * 60 * 1000;

// Failed cards: retry sooner
const FAILURE_RETRY_MS =
  60 * 60 * 1000;

const PROVIDER_ADAPTERS = [
  ebayInsightsAdapter
];

// -------------------------------------------------------------------------
// Runtime helpers
// -------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function remainingMs(deadline) {
  return deadline - Date.now();
}

function hasRuntime(deadline, reserveMs = 5000) {
  return remainingMs(deadline) > reserveMs;
}

function timeoutPromise(ms, label) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `${label || 'Operation'} exceeded ${ms}ms`
        )
      );
    }, ms);
  });
}

// -------------------------------------------------------------------------
// Provider backoff
// -------------------------------------------------------------------------

const providerBackoff = {};

function isProviderInBackoff(providerName) {
  const state =
    providerBackoff[providerName];

  return Boolean(
    state &&
    Date.now() < state.until
  );
}

function recordProviderBackoff(
  providerName,
  retryAfterMs
) {
  providerBackoff[providerName] = {
    until:
      Date.now() +
      Math.max(
        Number(retryAfterMs) || 60000,
        5000
      )
  };
}

// -------------------------------------------------------------------------
// Retry helper
// -------------------------------------------------------------------------

async function withRetry(
  fn,
  retries = MAX_RETRIES,
  baseDelay = BASE_RETRY_DELAY_MS,
  deadline
) {
  let lastError;

  for (
    let attempt = 0;
    attempt <= retries;
    attempt++
  ) {
    if (
      deadline &&
      !hasRuntime(deadline, 7000)
    ) {
      throw new Error(
        'Runtime budget nearly exhausted'
      );
    }

    try {
      return await fn();

    } catch (error) {
      lastError = error;

      if (attempt >= retries) {
        break;
      }

      const delay =
        baseDelay *
        Math.pow(2, attempt);

      if (
        deadline &&
        remainingMs(deadline) <
          delay + 7000
      ) {
        break;
      }

      console.warn(
        `[runner] retrying provider after error: ${
          error?.message || error
        }`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

// -------------------------------------------------------------------------
// Provider status logging
// -------------------------------------------------------------------------

async function recordProviderUnavailable(
  catalogId,
  providerName,
  message
) {
  try {
    await sb(
      'sold_comp_provider_status',
      {
        method: 'POST',

        headers: {
          Prefer:
            'return=minimal,resolution=merge-duplicates'
        },

        body: JSON.stringify({
          catalog_id: catalogId,
          provider_name:
            providerName,

          status:
            'unavailable',

          message:
            String(
              message || ''
            ).slice(0, 1000),

          recorded_at:
            new Date().toISOString()
        })
      }
    );

  } catch (error) {
    console.warn(
      '[runner] recordProviderUnavailable failed:',
      error.message
    );
  }
}

// -------------------------------------------------------------------------
// One target
// -------------------------------------------------------------------------

async function processTarget(
  target,
  deadline
) {
  const queueId =
    target.queue_id ||
    target.id ||
    null;

  const catalogId =
    target.catalog_id ||
    null;

  const isFlipsCohort =
    Boolean(
      target.is_flips_cohort ||
      target.flip_tier
    );

  const normalNextAttemptAt =
    new Date(
      Date.now() +
      (
        isFlipsCohort
          ? FLIPS_INTERVAL_MS
          : NORMAL_INTERVAL_MS
      )
    ).toISOString();

  const failureNextAttemptAt =
    new Date(
      Date.now() +
      FAILURE_RETRY_MS
    ).toISOString();

  const summary = {
    accepted: 0,
    review: 0,
    rejected: 0,
    duplicates: 0,
    errors: 0
  };

  let providerWorked = false;
  let providerAttempted = false;
  let lastProviderError = null;

  if (!catalogId) {
    if (queueId) {
      await markQueueFailure(
        queueId,
        'Missing catalog_id',
        failureNextAttemptAt
      );
    }

    return {
      success: false,
      catalogId,
      summary,
      error:
        'Missing catalog_id'
    };
  }

  for (
    const adapter of PROVIDER_ADAPTERS
  ) {
    if (
      !hasRuntime(deadline, 9000)
    ) {
      throw new Error(
        'Runtime budget exhausted before provider call'
      );
    }

    if (
      isProviderInBackoff(
        adapter.name
      )
    ) {
      console.info(
        `[runner] skipping ${adapter.name}; provider in backoff`
      );

      continue;
    }

    providerAttempted = true;

    let providerResult;

    try {
      const perTargetBudget =
        Math.min(
          TARGET_SOFT_TIMEOUT_MS,
          Math.max(
            remainingMs(deadline) -
            7000,
            3000
          )
        );

      providerResult =
        await Promise.race([
          withRetry(
            () =>
              adapter.fetchSoldComps(
                target,
                {
                  limit: 30,
                  dayLimit: 45
                }
              ),

            MAX_RETRIES,
            BASE_RETRY_DELAY_MS,
            deadline
          ),

          timeoutPromise(
            perTargetBudget,
            `Provider ${adapter.name}`
          )
        ]);

    } catch (error) {
      lastProviderError =
        error;

      summary.errors++;

      console.warn(
        `[runner] adapter ${adapter.name} failed for ${catalogId}:`,
        error.message
      );

      continue;
    }

    if (!providerResult) {
      summary.errors++;
      lastProviderError =
        new Error(
          `${adapter.name} returned no result`
        );

      continue;
    }

    if (
      providerResult.status ===
      PROVIDER_STATUS.RATE_LIMITED
    ) {
      recordProviderBackoff(
        adapter.name,
        providerResult.retryAfterMs
      );

      lastProviderError =
        new Error(
          providerResult.message ||
          `${adapter.name} rate limited`
        );

      console.warn(
        `[runner] ${adapter.name} rate-limited`
      );

      continue;
    }

    if (
      providerResult.status ===
      PROVIDER_STATUS.UNAVAILABLE
    ) {
      lastProviderError =
        new Error(
          providerResult.message ||
          `${adapter.name} unavailable`
        );

      console.info(
        `[runner] ${adapter.name} unavailable: ${
          providerResult.message || ''
        }`
      );

      await recordProviderUnavailable(
        catalogId,
        adapter.name,
        providerResult.message
      );

      continue;
    }

    if (
      providerResult.status ===
      PROVIDER_STATUS.ERROR
    ) {
      summary.errors++;

      lastProviderError =
        new Error(
          providerResult.message ||
          `${adapter.name} error`
        );

      console.warn(
        `[runner] ${adapter.name} provider error: ${
          providerResult.message || ''
        }`
      );

      continue;
    }

    /*
     * Provider returned successfully.
     */
    providerWorked = true;

    const comps =
      Array.isArray(
        providerResult.comps
      )
        ? providerResult.comps
        : [];

    try {
      const batchSummary =
        await ingestComps(
          target,
          adapter.name,
          comps
        );

      summary.accepted +=
        Number(
          batchSummary?.accepted
        ) || 0;

      summary.review +=
        Number(
          batchSummary?.review
        ) || 0;

      summary.rejected +=
        Number(
          batchSummary?.rejected
        ) || 0;

      summary.duplicates +=
        Number(
          batchSummary?.duplicates
        ) || 0;

      summary.errors +=
        Number(
          batchSummary?.errors
        ) || 0;

    } catch (error) {
      summary.errors++;

      lastProviderError =
        error;

      console.error(
        `[runner] ingest failed for ${catalogId}:`,
        error.message
      );
    }

    /*
     * Stop after one functioning provider.
     *
     * Later, when we add SCI/Card Ladder/etc.,
     * we can deliberately allow multiple sources.
     */
    break;
  }

  /*
   * Checkpoint queue state immediately.
   */
  if (queueId) {
    try {
      if (
        !providerWorked &&
        (
          providerAttempted ||
          lastProviderError
        )
      ) {
        await markQueueFailure(
          queueId,

          lastProviderError?.message ||
          'No sold-comp provider succeeded',

          failureNextAttemptAt
        );

      } else if (
        summary.errors > 0 &&
        summary.accepted === 0
      ) {
        await markQueueFailure(
          queueId,

          lastProviderError?.message ||
          `${summary.errors} ingestion errors`,

          failureNextAttemptAt
        );

      } else {
        await markQueueSuccess(
          queueId,
          summary,
          normalNextAttemptAt
        );
      }

    } catch (error) {
      console.warn(
        `[runner] queue checkpoint failed for ${queueId}:`,
        error.message
      );
    }
  }

  const success =
    providerWorked &&
    !(
      summary.errors > 0 &&
      summary.accepted === 0
    );

  return {
    success,
    catalogId,
    summary,
    error:
      success
        ? null
        : (
            lastProviderError?.message ||
            null
          )
  };
}

// -------------------------------------------------------------------------
// Controlled batch
// -------------------------------------------------------------------------

async function runBatch(
  targets,
  deadline
) {
  const results = [];

  /*
   * Intentionally sequential.
   *
   * We want successful checkpoints much more than
   * maximum throughput right now.
   */
  for (
    const target of targets
  ) {
    if (
      !hasRuntime(deadline, 9000)
    ) {
      console.warn(
        '[runner] stopping batch early to preserve runtime budget'
      );

      break;
    }

    try {
      const result =
        await processTarget(
          target,
          deadline
        );

      results.push(result);

    } catch (error) {
      console.error(
        '[runner] target processing failed:',
        error.message
      );

      results.push({
        success: false,
        catalogId:
          target?.catalog_id ||
          null,

        summary: {
          accepted: 0,
          review: 0,
          rejected: 0,
          duplicates: 0,
          errors: 1
        },

        error:
          error.message
      });

      /*
       * Try to checkpoint failure before moving on.
       */
      const queueId =
        target?.queue_id ||
        target?.id;

      if (
        queueId &&
        hasRuntime(
          deadline,
          4000
        )
      ) {
        try {
          await markQueueFailure(
            queueId,
            error.message,

            new Date(
              Date.now() +
              FAILURE_RETRY_MS
            ).toISOString()
          );

        } catch (
          checkpointError
        ) {
          console.warn(
            '[runner] failure checkpoint failed:',
            checkpointError.message
          );
        }
      }
    }
  }

  return results;
}

// -------------------------------------------------------------------------
// Public entry
// -------------------------------------------------------------------------

async function runEnrichment() {
  const runStarted =
    Date.now();

  const deadline =
    runStarted +
    MAX_RUNTIME_MS;

  const startedAt =
    new Date(
      runStarted
    ).toISOString();

  const providerName =
    PROVIDER_ADAPTERS
      .map(adapter =>
        adapter.name
      )
      .join(',');

  const stats = {
    cardsAttempted: 0,
    cardsSucceeded: 0,
    cardsFailed: 0,

    compsAccepted: 0,
    compsReview: 0,
    compsRejected: 0
  };

  let runId = null;

  try {
    /*
     * Logging is useful but must never prevent enrichment.
     */
    if (
      hasRuntime(
        deadline,
        12000
      )
    ) {
      runId =
        await createRunLog(
          providerName,
          startedAt
        );
    }

    if (
      !hasRuntime(
        deadline,
        12000
      )
    ) {
      throw new Error(
        'Runtime budget consumed before queue fetch'
      );
    }

    const targets =
      await getDueTargets(
        BATCH_SIZE
      );

    if (!targets.length) {
      await finishRunLog(
        runId,
        stats,
        'success'
      );

      return {
        runId,
        runStatus: 'success',
        message:
          'No cards currently due',
        stats,
        runtimeMs:
          Date.now() -
          runStarted
      };
    }

    console.info(
      `[runner] processing up to ${targets.length} due targets with ${MAX_RUNTIME_MS}ms runtime budget`
    );

    const results =
      await runBatch(
        targets,
        deadline
      );

    stats.cardsAttempted =
      results.length;

    for (
      const result of results
    ) {
      if (
        result.success
      ) {
        stats.cardsSucceeded++;

      } else {
        stats.cardsFailed++;
      }

      stats.compsAccepted +=
        Number(
          result.summary?.accepted
        ) || 0;

      stats.compsReview +=
        Number(
          result.summary?.review
        ) || 0;

      stats.compsRejected +=
        Number(
          result.summary?.rejected
        ) || 0;
    }

    /*
     * If we intentionally stopped early because
     * of runtime budget, that's a partial run,
     * not a failure.
     */
    let runStatus;

    if (
      results.length <
      targets.length
    ) {
      runStatus =
        'partial';

    } else if (
      stats.cardsFailed === 0
    ) {
      runStatus =
        'success';

    } else if (
      stats.cardsSucceeded > 0
    ) {
      runStatus =
        'partial';

    } else {
      runStatus =
        'failed';
    }

    if (
      hasRuntime(
        deadline,
        2500
      )
    ) {
      await finishRunLog(
        runId,
        stats,
        runStatus
      );
    }

    return {
      runId,
      runStatus,
      stats,

      queuedTargets:
        targets.length,

      processedTargets:
        results.length,

      stoppedForRuntime:
        results.length <
        targets.length,

      runtimeMs:
        Date.now() -
        runStarted,

      finishedAt:
        new Date().toISOString()
    };

  } catch (error) {
    console.error(
      '[runner] runEnrichment fatal error:',
      error
    );

    if (
      hasRuntime(
        deadline,
        2500
      )
    ) {
      await finishRunLog(
        runId,
        stats,
        'failed'
      );
    }

    throw error;
  }
}

module.exports = {
  runEnrichment
};
