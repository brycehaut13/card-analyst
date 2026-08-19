/**
 * Shared Supabase REST client helpers for the sold-comp pipeline.
 *
 * Hardened against temporary Supabase/PostgREST outages so a brief 503
 * does not kill the entire sold-comp worker.
 */

'use strict';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  'https://tjqeuiqyjdhpjgzhfwev.supabase.co';

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

function getKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return key;
}

function sbHeaders(extra) {
  const key = getKey();

  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    ...extra
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTransient(status, data) {
  const text =
    typeof data === 'string'
      ? data
      : JSON.stringify(data || {});

  return (
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /PGRST002|schema cache|temporarily unavailable|timeout/i.test(text)
  );
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request(url, options, label, allowRetry) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (response.ok) {
        return data;
      }

      const transient = isTransient(response.status, data);

      const error = new Error(
        `${label} ${response.status}: ${
          typeof data === 'string'
            ? data
            : JSON.stringify(data)
        }`
      );

      if (
        !allowRetry ||
        !transient ||
        attempt === MAX_RETRIES
      ) {
        throw error;
      }

      lastError = error;

    } catch (error) {
      const aborted = error && error.name === 'AbortError';

      if (
        !allowRetry ||
        (!aborted && !/fetch failed|timeout|network/i.test(String(error))) ||
        attempt === MAX_RETRIES
      ) {
        throw error;
      }

      lastError = error;
    }

    const delay =
      400 * Math.pow(2, attempt) +
      Math.floor(Math.random() * 250);

    console.warn(
      `[sold-comps] ${label} temporary failure; retry ${
        attempt + 1
      }/${MAX_RETRIES} in ${delay}ms`
    );

    await sleep(delay);
  }

  throw lastError || new Error(`${label} failed`);
}

async function sb(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();

  /*
   * GET/HEAD are automatically safe to retry.
   *
   * Writes are NOT automatically retried because we do not want
   * accidental duplicate inserts/updates. A caller may explicitly set
   * retrySafe:true when the operation is known to be idempotent.
   */
  const allowRetry =
    method === 'GET' ||
    method === 'HEAD' ||
    options.retrySafe === true;

  const {
    retrySafe,
    ...fetchOptions
  } = options;

  return request(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...fetchOptions,
      headers: sbHeaders(fetchOptions.headers || {})
    },
    'Supabase',
    allowRetry
  );
}

async function sbRpc(fn, args) {
  /*
   * RPC retry is deliberately limited to failures where PostgREST
   * clearly could not access its schema cache. This avoids blindly
   * repeating RPCs that may perform writes.
   */
  const url = `${SUPABASE_URL}/rest/v1/rpc/${fn}`;

  let attempt = 0;

  while (true) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: sbHeaders({
          Prefer: 'return=representation'
        }),
        body: JSON.stringify(args || {})
      });

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (response.ok) {
        return data;
      }

      const message =
        typeof data === 'string'
          ? data
          : JSON.stringify(data);

      const schemaCacheFailure =
        response.status === 503 &&
        /PGRST002|schema cache/i.test(message);

      if (
        schemaCacheFailure &&
        attempt < MAX_RETRIES
      ) {
        const delay =
          400 * Math.pow(2, attempt) +
          Math.floor(Math.random() * 250);

        attempt++;

        console.warn(
          `[sold-comps] RPC ${fn} schema cache unavailable; retry ${attempt}/${MAX_RETRIES}`
        );

        await sleep(delay);
        continue;
      }

      throw new Error(
        `Supabase RPC ${fn} ${response.status}: ${message}`
      );

    } catch (error) {
      if (
        error &&
        error.name === 'AbortError'
      ) {
        throw new Error(
          `Supabase RPC ${fn} request timed out after ${REQUEST_TIMEOUT_MS}ms`
        );
      }

      throw error;
    }
  }
}

module.exports = {
  sb,
  sbRpc,
  SUPABASE_URL
};
