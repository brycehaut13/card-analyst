// Tests for resale draft preparation logic (mirrors flips.js client-side helpers).
// These pure functions are duplicated here for testability since flips.js runs as
// a browser IIFE. Any logic change in flips.js must be reflected here too.

const test = require('node:test');
const assert = require('node:assert/strict');

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const STATES = ['SIGNAL', 'APPROVED', 'PURCHASED', 'RECEIVED', 'VERIFIED', 'RESALE DRAFTED', 'LISTED', 'SOLD'];

function stateFromOrder(order) {
  if (!order) return 'SIGNAL';
  const s = String(
    order.execution_state || order.order_state || order.state || order.status || ''
  ).trim().toUpperCase().replace(/_/g, ' ');
  return STATES.includes(s) ? s : 'SIGNAL';
}

function draftByOrder(drafts) {
  const out = {};
  (drafts || []).forEach(d => {
    const id = String(d.execution_order_id || '');
    if (id && !out[id]) out[id] = d;
  });
  return out;
}

function draftTargetPrice(order, row) {
  return num(
    order?.resale_target_price ??
    order?.fair_exit_price ??
    row?.fair_exit_price ??
    row?.resale_target_price
  );
}

function validateDraftCreation(order, drafts) {
  const orderId = order?.id;
  if (!orderId) {
    throw new Error('Order id missing; cannot create resale draft.');
  }
  const state = stateFromOrder(order);
  if (state !== 'VERIFIED') {
    throw new Error('Resale draft can only be created for VERIFIED orders. Current state: ' + state);
  }
  const existing = draftByOrder(drafts || [])[String(orderId)];
  if (existing) {
    throw new Error('A resale draft already exists for this execution order.');
  }
}

// ── Invalid state rejection ──────────────────────────────────────────────────

test('rejects draft creation when order state is RECEIVED (not yet VERIFIED)', () => {
  const order = { id: 'order-1', execution_state: 'RECEIVED' };
  assert.throws(() => validateDraftCreation(order, []), /VERIFIED/);
});

test('rejects draft creation when order state is APPROVED', () => {
  const order = { id: 'order-1', execution_state: 'APPROVED' };
  assert.throws(() => validateDraftCreation(order, []), /VERIFIED/);
});

test('rejects draft creation when order state is PURCHASED', () => {
  const order = { id: 'order-1', execution_state: 'PURCHASED' };
  assert.throws(() => validateDraftCreation(order, []), /VERIFIED/);
});

test('rejects draft creation when order state is RESALE DRAFTED (already past VERIFIED)', () => {
  const order = { id: 'order-1', execution_state: 'RESALE DRAFTED' };
  assert.throws(() => validateDraftCreation(order, []), /VERIFIED/);
});

test('rejects draft creation when order state is LISTED', () => {
  const order = { id: 'order-1', execution_state: 'LISTED' };
  assert.throws(() => validateDraftCreation(order, []), /VERIFIED/);
});

test('rejects draft creation when order state is SOLD', () => {
  const order = { id: 'order-1', execution_state: 'SOLD' };
  assert.throws(() => validateDraftCreation(order, []), /VERIFIED/);
});

test('rejects draft creation when order id is missing', () => {
  const order = { execution_state: 'VERIFIED' };
  assert.throws(() => validateDraftCreation(order, []), /Order id missing/);
});

test('rejects draft creation when order is null', () => {
  assert.throws(() => validateDraftCreation(null, []), /Order id missing/);
});

// ── Duplicate draft rejection ─────────────────────────────────────────────────

test('rejects duplicate draft for the same execution order', () => {
  const order = { id: 'order-2', execution_state: 'VERIFIED' };
  const existingDraft = { execution_order_id: 'order-2', draft_status: 'pending' };
  assert.throws(() => validateDraftCreation(order, [existingDraft]), /already exists/);
});

test('allows draft when existing drafts belong to a different order', () => {
  const order = { id: 'order-3', execution_state: 'VERIFIED' };
  const otherDraft = { execution_order_id: 'order-99', draft_status: 'pending' };
  assert.doesNotThrow(() => validateDraftCreation(order, [otherDraft]));
});

test('allows draft creation when order is VERIFIED and no duplicate exists', () => {
  const order = { id: 'order-3', execution_state: 'VERIFIED' };
  assert.doesNotThrow(() => validateDraftCreation(order, []));
});

// ── Correct target-price source ───────────────────────────────────────────────

test('target price prefers order resale_target_price over all others', () => {
  const order = { resale_target_price: 55, fair_exit_price: 40 };
  const row = { fair_exit_price: 35, resale_target_price: 30 };
  assert.equal(draftTargetPrice(order, row), 55);
});

test('target price falls back to order fair_exit_price when resale_target_price is absent', () => {
  const order = { fair_exit_price: 40 };
  const row = { fair_exit_price: 35 };
  assert.equal(draftTargetPrice(order, row), 40);
});

test('target price falls back to row fair_exit_price when order has neither', () => {
  const order = {};
  const row = { fair_exit_price: 35 };
  assert.equal(draftTargetPrice(order, row), 35);
});

test('target price falls back to row resale_target_price as last resort', () => {
  const order = {};
  const row = { resale_target_price: 28 };
  assert.equal(draftTargetPrice(order, row), 28);
});

test('target price never uses ask_price (active listing median)', () => {
  const order = {};
  const row = { ask_price: 99, fair_exit_price: 35 };
  const price = draftTargetPrice(order, row);
  assert.equal(price, 35);
  assert.notEqual(price, 99);
});

test('target price never uses ask_median', () => {
  const order = {};
  const row = { ask_median: 120, fair_exit_price: 50 };
  const price = draftTargetPrice(order, row);
  assert.equal(price, 50);
  assert.notEqual(price, 120);
});

test('target price returns null when no price fields are available', () => {
  assert.equal(draftTargetPrice({}, {}), null);
});

// ── draftByOrder keying ───────────────────────────────────────────────────────

test('draftByOrder returns first draft when multiple drafts share an order id', () => {
  const d1 = { execution_order_id: 'x', draft_status: 'first' };
  const d2 = { execution_order_id: 'x', draft_status: 'second' };
  const map = draftByOrder([d1, d2]);
  assert.equal(map['x'].draft_status, 'first');
});

test('draftByOrder ignores entries with no execution_order_id', () => {
  const d = { draft_status: 'orphan' };
  const map = draftByOrder([d]);
  assert.deepEqual(Object.keys(map), []);
});
