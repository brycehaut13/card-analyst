const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isPilotFlipsCohort,
  pilotBackfillScore,
  sortTargetsForPilotBackfill
} = require('./queue');

test('pilot flips cohort is detected in the $25-$50 range', () => {
  assert.equal(isPilotFlipsCohort({
    flip_tier: 'flip',
    fair_value: 37
  }), true);
});

test('pilot sparse high-depth cards outrank broader catalog backfill work', () => {
  const pilot = {
    catalog_id: 'pilot',
    priority: 10,
    flip_tier: 'flip',
    fair_value: 34,
    recent_verified_raw_sold_comp_count: 1,
    robust_listing_count: 12
  };
  const nonPilot = {
    catalog_id: 'non-pilot',
    priority: 200,
    fair_value: 80,
    recent_verified_raw_sold_comp_count: 4,
    robust_listing_count: 2
  };

  assert.ok(pilotBackfillScore(pilot) > pilotBackfillScore(nonPilot));
  assert.equal(sortTargetsForPilotBackfill([nonPilot, pilot])[0].catalog_id, 'pilot');
});

test('older pilot attempts are retried before newer pilot attempts when scores tie', () => {
  const older = {
    catalog_id: 'older',
    priority: 10,
    flip_tier: 'flip',
    fair_value: 40,
    recent_verified_raw_sold_comp_count: 2,
    robust_listing_count: 8,
    last_attempt_at: '2026-01-01T00:00:00.000Z'
  };
  const newer = {
    ...older,
    catalog_id: 'newer',
    last_attempt_at: '2026-06-01T00:00:00.000Z'
  };

  const ordered = sortTargetsForPilotBackfill([newer, older]);
  assert.equal(ordered[0].catalog_id, 'older');
});
