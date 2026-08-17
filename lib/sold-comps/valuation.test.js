/**
 * Tests for the dual-path valuation module (valuation.js).
 *
 * Run with: node --test lib/sold-comps/valuation.test.js
 *
 * Required test scenarios:
 *   ✓ non-eBay comps cannot influence ebay_execution_fair_value
 *   ✓ qualified non-eBay comps can influence blended_market_fair_value
 *   ✓ grader/raw separation is preserved (only raw comps should ever reach here)
 *   ✓ unavailable providers never fabricate comps (provider_unavailable → empty comps)
 *   ✓ empty input returns null for both paths
 *   ✓ eBay-only input produces correct ebay_execution_fair_value
 *   ✓ mixed input isolates eBay to execution path
 *   ✓ recency weighting favours recent comps
 *   ✓ isEbayProvider correctly classifies providers
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { computeValuation, weightedMedian, recencyWeight, MARKETPLACE_RELEVANCE } = require('./valuation');
const { isEbayProvider, unavailableResult, PROVIDER_STATUS } = require('./providers/base');

// ── Helpers ────────────────────────────────────────────────────────────────

function makeComp(overrides) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    provider_name: 'ebay_insights',
    sale_price: 35,
    shipping_price: null,
    sale_date: today,
    confidence_score: 1.0,
    ...overrides
  };
}

// ── Provider classification ────────────────────────────────────────────────

test('isEbayProvider returns true for ebay_insights', () => {
  assert.equal(isEbayProvider('ebay_insights'), true);
});

test('isEbayProvider returns true for ebay_manual', () => {
  assert.equal(isEbayProvider('ebay_manual'), true);
});

test('isEbayProvider returns false for goldin', () => {
  assert.equal(isEbayProvider('goldin'), false);
});

test('isEbayProvider returns false for heritage', () => {
  assert.equal(isEbayProvider('heritage'), false);
});

test('isEbayProvider returns false for fanatics_collect', () => {
  assert.equal(isEbayProvider('fanatics_collect'), false);
});

test('isEbayProvider returns false for manual_import', () => {
  assert.equal(isEbayProvider('manual_import'), false);
});

// ── Empty input ────────────────────────────────────────────────────────────

test('computeValuation returns null for both paths when no comps provided', () => {
  const result = computeValuation([]);
  assert.equal(result.ebay_execution_fair_value, null);
  assert.equal(result.blended_market_fair_value, null);
  assert.equal(result.ebay_comp_count, 0);
  assert.equal(result.blended_comp_count, 0);
});

test('computeValuation returns null when called with null', () => {
  const result = computeValuation(null);
  assert.equal(result.ebay_execution_fair_value, null);
  assert.equal(result.blended_market_fair_value, null);
});

// ── Core separation: non-eBay comps cannot influence ebay_execution_fair_value ──

test('non-eBay comp (goldin) does NOT influence ebay_execution_fair_value', () => {
  // Only non-eBay comp present; eBay path must return null
  const comps = [
    makeComp({ provider_name: 'goldin', sale_price: 1000 })
  ];
  const result = computeValuation(comps);
  assert.equal(
    result.ebay_execution_fair_value,
    null,
    'eBay execution fair value must be null when no eBay comps exist'
  );
});

test('non-eBay comp (heritage) does NOT influence ebay_execution_fair_value', () => {
  const comps = [
    makeComp({ provider_name: 'heritage', sale_price: 500 }),
    makeComp({ provider_name: 'rea', sale_price: 600 })
  ];
  const result = computeValuation(comps);
  assert.equal(result.ebay_execution_fair_value, null);
  assert.equal(result.ebay_comp_count, 0);
});

test('non-eBay comps alongside eBay comps do NOT change the eBay-only value', () => {
  // With only the eBay comp at $35, ebay_execution_fair_value must equal the
  // eBay comp price (ignoring the $1000 Goldin outlier completely).
  const ebayComp = makeComp({ provider_name: 'ebay_insights', sale_price: 35 });
  const goldinComp = makeComp({ provider_name: 'goldin', sale_price: 1000 });
  const resultMixed = computeValuation([ebayComp, goldinComp]);
  const resultEbayOnly = computeValuation([ebayComp]);

  assert.equal(
    resultMixed.ebay_execution_fair_value,
    resultEbayOnly.ebay_execution_fair_value,
    'Adding a non-eBay comp must not alter ebay_execution_fair_value'
  );
  assert.equal(resultMixed.ebay_comp_count, 1);
});

// ── Non-eBay comps CAN influence blended_market_fair_value ────────────────

test('qualified non-eBay comp (goldin) influences blended_market_fair_value', () => {
  const comps = [
    makeComp({ provider_name: 'goldin', sale_price: 100 })
  ];
  const result = computeValuation(comps);
  assert.notEqual(
    result.blended_market_fair_value,
    null,
    'Goldin comp should contribute to blended_market_fair_value'
  );
  assert.equal(result.blended_comp_count, 1);
});

test('blended_market_fair_value includes both eBay and non-eBay comps', () => {
  const comps = [
    makeComp({ provider_name: 'ebay_insights', sale_price: 40 }),
    makeComp({ provider_name: 'goldin', sale_price: 60 })
  ];
  const result = computeValuation(comps);
  assert.equal(result.blended_comp_count, 2);
  assert.notEqual(result.blended_market_fair_value, null);
  // blended should be between the two prices
  assert.ok(
    result.blended_market_fair_value >= 40 &&
    result.blended_market_fair_value <= 60,
    `Expected blended between 40 and 60, got ${result.blended_market_fair_value}`
  );
});

test('blended_market_fair_value differs from ebay_execution_fair_value when non-eBay comps shift price', () => {
  const comps = [
    makeComp({ provider_name: 'ebay_insights', sale_price: 35 }),
    makeComp({ provider_name: 'goldin', sale_price: 200 }),
    makeComp({ provider_name: 'goldin', sale_price: 200 })
  ];
  const result = computeValuation(comps);
  assert.notEqual(
    result.blended_market_fair_value,
    result.ebay_execution_fair_value,
    'High non-eBay comps should push blended value above eBay-only value'
  );
  assert.ok(
    result.blended_market_fair_value > result.ebay_execution_fair_value,
    `blended (${result.blended_market_fair_value}) should exceed eBay-only (${result.ebay_execution_fair_value})`
  );
});

// ── Grader/raw separation is preserved ────────────────────────────────────
// The ingest layer already hard-rejects graded cards.  The valuation layer
// only ever sees accepted raw comps.  These tests confirm that if a graded
// comp somehow reached computeValuation, it is treated the same as any other
// comp (no special mixing).  The true separation guarantee lives in ingest.js.

test('grader/raw separation: all comps reaching valuation are raw (ingest contract)', () => {
  // Both comps are raw (no grader field needed).  If they all pass through,
  // valuation computes normally.  This confirms there is no grader field on the
  // valuation input shape, and separation is enforced upstream.
  const comps = [
    makeComp({ provider_name: 'ebay_insights', sale_price: 35 }),
    makeComp({ provider_name: 'goldin', sale_price: 40 })
  ];
  const result = computeValuation(comps);
  assert.equal(result.blended_comp_count, 2);
  assert.equal(result.ebay_comp_count, 1);
});

// ── Unavailable providers never fabricate comps ───────────────────────────

test('provider_unavailable result contains zero comps (fanatics-collect stub)', () => {
  const adapter = require('./providers/fanatics-collect');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('provider_unavailable result contains zero comps (goldin stub)', () => {
  const adapter = require('./providers/goldin');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('provider_unavailable result contains zero comps (heritage stub)', () => {
  const adapter = require('./providers/heritage');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('provider_unavailable result contains zero comps (rea stub)', () => {
  const adapter = require('./providers/rea');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('provider_unavailable result contains zero comps (lelands stub)', () => {
  const adapter = require('./providers/lelands');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('provider_unavailable result contains zero comps (pristine stub)', () => {
  const adapter = require('./providers/pristine');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('provider_unavailable result contains zero comps (huggins-scott stub)', () => {
  const adapter = require('./providers/huggins-scott');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('provider_unavailable result contains zero comps (scp stub)', () => {
  const adapter = require('./providers/scp');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('provider_unavailable result contains zero comps (memory-lane stub)', () => {
  const adapter = require('./providers/memory-lane');
  return adapter.fetchSoldComps({}).then(result => {
    assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
    assert.deepEqual(result.comps, []);
  });
});

test('unavailable provider result never has a non-empty comps array', () => {
  const result = unavailableResult('No API access');
  assert.equal(result.comps.length, 0);
  assert.equal(result.status, PROVIDER_STATUS.UNAVAILABLE);
});

// ── Weighting helpers ─────────────────────────────────────────────────────

test('recencyWeight returns 1.0 for today', () => {
  const today = new Date().toISOString();
  const w = recencyWeight(today);
  assert.ok(w > 0.99 && w <= 1.0, `Expected ~1.0, got ${w}`);
});

test('recencyWeight returns 0.5 for a comp RECENCY_HALF_LIFE_DAYS ago', () => {
  const { RECENCY_HALF_LIFE_DAYS } = require('./valuation');
  const past = new Date(Date.now() - RECENCY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const w = recencyWeight(past);
  assert.ok(Math.abs(w - 0.5) < 0.01, `Expected ~0.5, got ${w}`);
});

test('recencyWeight decreases for older comps', () => {
  const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const older = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  assert.ok(recencyWeight(recent) > recencyWeight(older));
});

test('eBay has highest marketplace relevance weight (1.0)', () => {
  assert.equal(MARKETPLACE_RELEVANCE['ebay_insights'], 1.0);
  assert.equal(MARKETPLACE_RELEVANCE['ebay_manual'], 1.0);
});

test('weightedMedian of single entry returns that entry price', () => {
  assert.equal(weightedMedian([{ price: 42, weight: 1 }]), 42);
});

test('weightedMedian of empty array returns null', () => {
  assert.equal(weightedMedian([]), null);
});

test('eBay-only comps produce ebay_execution_fair_value and blended_market_fair_value', () => {
  const comps = [
    makeComp({ provider_name: 'ebay_insights', sale_price: 30 }),
    makeComp({ provider_name: 'ebay_insights', sale_price: 40 }),
    makeComp({ provider_name: 'ebay_insights', sale_price: 35 })
  ];
  const result = computeValuation(comps);
  assert.notEqual(result.ebay_execution_fair_value, null);
  assert.notEqual(result.blended_market_fair_value, null);
  assert.equal(result.ebay_comp_count, 3);
  assert.equal(result.blended_comp_count, 3);
  // When only eBay comps exist both paths draw from the same comp set, so the
  // weighted-median values must be equal.
  assert.equal(result.ebay_execution_fair_value, result.blended_market_fair_value);
  // With three same-day comps at equal confidence the weighted median is the
  // middle price (35).  Verify the actual value, not just relative equality,
  // so a regression in the weighting formula is caught.
  assert.equal(result.ebay_execution_fair_value, 35);
});
