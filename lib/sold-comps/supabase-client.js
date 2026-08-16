/**
 * Shared Supabase REST client helpers for the sold-comp pipeline.
 *
 * Centralised so that any future changes (common headers, error formatting,
 * URL overrides) only need to be made once.
 */

'use strict';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  'https://tjqeuiqyjdhpjgzhfwev.supabase.co';

function getKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
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

async function sb(path, options) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: sbHeaders((options && options.headers) || {})
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function sbRpc(fn, args) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(args)
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error(`Supabase RPC ${fn} ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { sb, sbRpc, SUPABASE_URL };
