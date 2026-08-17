// Tests for Trading Desk trend intelligence.
// These helpers mirror the client-side logic in flips.js so the approval gate
// and market-regime behavior can be validated in node:test.

const test = require('node:test');
const assert = require('node:assert/strict');

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function median(values) {
  const nums = (values || []).map(num).filter(v => v != null).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function pctDelta(recent, prior) {
  const a = num(recent);
  const b = num(prior);
  if (a == null || b == null || Math.abs(b) < 0.01) return null;
  return (a - b) / Math.abs(b);
}

function daysAgo(value) {
  const time = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(time)) return null;
  return Math.max(0, (Date.now() - time) / 86400000);
}

function round(value, digits = 4) {
  const n = num(value);
  if (n == null) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function splitHistoryWindow(rows, field, recentDays, maxDays) {
  const filtered = (rows || [])
    .filter(row => {
      const age = daysAgo(row[field]);
      return age != null && age <= maxDays;
    })
    .sort((a, b) => new Date(a[field]) - new Date(b[field]));

  if (filtered.length < 2) {
    return { recent: filtered, prior: [] };
  }

  const recent = filtered.filter(row => (daysAgo(row[field]) ?? Infinity) <= recentDays);
  const prior = filtered.filter(row => (daysAgo(row[field]) ?? Infinity) > recentDays);

  if (recent.length && prior.length) {
    return { recent, prior };
  }

  const split = Math.floor(filtered.length / 2);
  return {
    recent: filtered.slice(split),
    prior: filtered.slice(0, split)
  };
}

function latestDailySnapshots(rows) {
  const daily = {};
  (rows || [])
    .slice()
    .sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at))
    .forEach(row => {
      const day = new Date(row.observed_at).toISOString().slice(0, 10);
      if (!daily[day]) daily[day] = row;
    });
  return Object.values(daily).sort((a, b) => new Date(a.observed_at) - new Date(b.observed_at));
}

function analyzeSnapshotHistory(rows, row) {
  const dailyRows = latestDailySnapshots(rows);
  const { recent, prior } = splitHistoryWindow(dailyRows, 'observed_at', 7, 21);
  const recentAsk = median(recent.map(x => x.robust_median_ask));
  const priorAsk = median(prior.map(x => x.robust_median_ask));
  const recentP25 = median(recent.map(x => x.p25_ask));
  const priorP25 = median(prior.map(x => x.p25_ask));
  const recentSupply = median(recent.map(x => x.robust_listing_count));
  const priorSupply = median(prior.map(x => x.robust_listing_count));

  const deltas = [];
  const supplyDeltas = [];

  for (let i = 1; i < dailyRows.length; i++) {
    const prevAsk = num(dailyRows[i - 1].robust_median_ask ?? dailyRows[i - 1].lowest_ask);
    const nextAsk = num(dailyRows[i].robust_median_ask ?? dailyRows[i].lowest_ask);
    const askMove = pctDelta(nextAsk, prevAsk);
    if (askMove != null) deltas.push(askMove);

    const prevSupply = num(dailyRows[i - 1].robust_listing_count);
    const nextSupply = num(dailyRows[i].robust_listing_count);
    if (prevSupply != null && nextSupply != null) {
      supplyDeltas.push(nextSupply - prevSupply);
    }
  }

  const negativeCuts = deltas.filter(delta => delta < -0.01).map(delta => Math.abs(delta));
  const positiveSupplyAdds = supplyDeltas.filter(delta => delta > 0);

  return {
    askTrend: round(pctDelta(recentAsk, priorAsk)),
    p25Trend: round(pctDelta(recentP25, priorP25)),
    supplyTrend: round(pctDelta(recentSupply, priorSupply)),
    newListingVelocity: positiveSupplyAdds.length
      ? round(positiveSupplyAdds.reduce((sum, value) => sum + value, 0) / positiveSupplyAdds.length, 2)
      : null,
    priceCutFrequency: deltas.length ? round(negativeCuts.length / deltas.length) : null,
    avgPriceCutSize: negativeCuts.length
      ? round(negativeCuts.reduce((sum, value) => sum + value, 0) / negativeCuts.length)
      : null,
    undercutToFairValue: round(pctDelta(num(row.ask_price ?? row.all_in_buy_cost), num(row.fair_exit_price ?? row.max_buy_price))),
    snapshotCount: dailyRows.length
  };
}

function analyzeSoldHistory(rows) {
  const { recent, prior } = splitHistoryWindow(rows, 'sale_date', 21, 60);
  const recentMedian = median(recent.map(x => (num(x.sale_price) ?? 0) + (num(x.shipping_price) ?? 0)));
  const priorMedian = median(prior.map(x => (num(x.sale_price) ?? 0) + (num(x.shipping_price) ?? 0)));
  const sortedDesc = (rows || []).slice().sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
  const newestSale = sortedDesc[0]?.sale_date || null;
  return {
    soldPriceTrend: round(pctDelta(recentMedian, priorMedian)),
    recentCount: recent.length,
    totalCount: rows.length,
    stale: daysAgo(newestSale) == null || daysAgo(newestSale) > 21
  };
}

function compCount(row) {
  return num(
    row.verified_raw_sold_comp_count ??
    row.raw_sold_comp_count ??
    row.recent_verified_raw_sold_comp_count ??
    row.exact_sales_count ??
    row.robust_listing_count
  );
}

function buildTrendSummary(row, snapshotRows, soldRows) {
  const snapshot = analyzeSnapshotHistory(snapshotRows, row);
  const sold = analyzeSoldHistory(soldRows);
  const hasSnapshotHistory = snapshot.snapshotCount > 0;
  const hasSoldHistory = sold.totalCount > 0;
  const observedRecentCompCount = sold.recentCount || (compCount(row) ?? 0);

  let bearish = 0;
  let bullish = 0;

  if ((sold.soldPriceTrend ?? 0) <= -0.08) bearish += 2;
  else if ((sold.soldPriceTrend ?? 0) >= 0.04) bullish += 2;
  if ((snapshot.askTrend ?? 0) <= -0.06) bearish++;
  else if ((snapshot.askTrend ?? 0) >= 0.03) bullish++;
  if ((snapshot.p25Trend ?? 0) <= -0.08) bearish++;
  else if ((snapshot.p25Trend ?? 0) >= 0.03) bullish++;
  if ((snapshot.supplyTrend ?? 0) >= 0.2) bearish++;
  else if ((snapshot.supplyTrend ?? 0) <= -0.1) bullish++;
  if ((snapshot.priceCutFrequency ?? 0) >= 0.4 && (snapshot.avgPriceCutSize ?? 0) >= 0.05) bearish++;
  if (observedRecentCompCount >= 3 && !sold.stale) bullish++;
  if (observedRecentCompCount < 3 || (hasSoldHistory && sold.stale)) bearish++;

  let regime = 'INSUFFICIENT DATA';
  const availableSignals = [snapshot.askTrend, snapshot.p25Trend, snapshot.supplyTrend, sold.soldPriceTrend].filter(v => v != null).length;
  if (availableSignals >= 2 || observedRecentCompCount >= 3) {
    if (bearish >= 2) regime = 'FALLING';
    else if (bullish >= 2 && bearish === 0) regime = 'RISING';
    else regime = 'STABLE';
  }

  const blockers = [];
  if ((num(row.exact_match_confidence) ?? 0) < 0.98) blockers.push('exact identity confidence below 98%');
  if (observedRecentCompCount < 3) blockers.push('fewer than 3 recent verified raw eBay sales');
  if (hasSoldHistory && sold.stale) blockers.push('sold comps are stale');
  if (hasSoldHistory && (sold.soldPriceTrend ?? 0) <= -0.08) blockers.push('sold prices declining materially');
  if (hasSnapshotHistory && ((snapshot.askTrend ?? 0) <= -0.06 || (snapshot.p25Trend ?? 0) <= -0.08)) blockers.push('median ask falling rapidly');
  if (hasSnapshotHistory && ((snapshot.supplyTrend ?? 0) >= 0.2 || (snapshot.newListingVelocity ?? 0) >= 1.5)) blockers.push('supply expanding rapidly');
  if ((num(row.market_confidence) ?? 0) < 0.65) blockers.push('market confidence below gate');
  if ((num(row.all_in_buy_cost) ?? 0) > (num(row.max_buy_price) ?? Infinity)) blockers.push('all-in buy cost exceeds max buy');
  if ((num(row.expected_profit) ?? 0) <= 0) blockers.push('expected profit is not positive');
  if ((num(row.expected_roi) ?? 0) <= 0) blockers.push('expected ROI is not positive');
  if (regime === 'FALLING' && hasSnapshotHistory && (snapshot.undercutToFairValue ?? 0) < -0.08) {
    blockers.push('below-fair listing is likely stale fair value in a falling market');
  }

  return {
    market_regime: regime,
    trend_blockers: [...new Set(blockers)]
  };
}

function compileBlockers(row) {
  const blockers = [];
  (row.trend_blockers || []).forEach(x => blockers.push(String(x)));
  if (/PASS|RESEARCH|VERIFY/.test(String(row.flip_tier || '').toUpperCase())) {
    blockers.push('signal is not in executable tier');
  }
  return [...new Set(blockers)];
}

function canApprove(row) {
  const tier = String(row.flip_tier || '').toUpperCase();
  const explicit = row.execution_allowed === true || row.can_approve === true || row.allowed_for_execution === true;
  const exact = num(row.exact_match_confidence) ?? 0;
  const market = num(row.market_confidence) ?? 0;
  const acceptableTier = tier === 'BUY NOW' || tier === 'BEST OFFER' || tier === 'BUY';
  return (explicit || (acceptableTier && exact >= 0.98 && market >= 0.65)) && compileBlockers(row).length === 0;
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function baseRow() {
  return {
    flip_tier: 'BUY',
    exact_match_confidence: 0.99,
    market_confidence: 0.8,
    expected_profit: 12,
    expected_roi: 0.22,
    all_in_buy_cost: 28,
    max_buy_price: 30,
    fair_exit_price: 39,
    ask_price: 27,
    recent_verified_raw_sold_comp_count: 3
  };
}

test('rising market regime stays eligible when core gates and trend checks pass', () => {
  const row = baseRow();
  const snapshots = [
    { observed_at: daysAgoIso(18), robust_median_ask: 33, p25_ask: 31, robust_listing_count: 7 },
    { observed_at: daysAgoIso(15), robust_median_ask: 34, p25_ask: 32, robust_listing_count: 6 },
    { observed_at: daysAgoIso(5), robust_median_ask: 37, p25_ask: 35, robust_listing_count: 5 },
    { observed_at: daysAgoIso(2), robust_median_ask: 38, p25_ask: 36, robust_listing_count: 4 }
  ];
  const sold = [
    { sale_date: daysAgoIso(30), sale_price: 31, shipping_price: 0 },
    { sale_date: daysAgoIso(26), sale_price: 32, shipping_price: 0 },
    { sale_date: daysAgoIso(12), sale_price: 35, shipping_price: 0 },
    { sale_date: daysAgoIso(8), sale_price: 36, shipping_price: 0 },
    { sale_date: daysAgoIso(3), sale_price: 37, shipping_price: 0 }
  ];

  const summary = buildTrendSummary(row, snapshots, sold);
  const decorated = { ...row, ...summary };

  assert.equal(summary.market_regime, 'RISING');
  assert.equal(canApprove(decorated), true);
});

test('flat market regime remains stable with enough recent verified sales', () => {
  const row = baseRow();
  const snapshots = [
    { observed_at: daysAgoIso(17), robust_median_ask: 35, p25_ask: 33, robust_listing_count: 5 },
    { observed_at: daysAgoIso(12), robust_median_ask: 35.5, p25_ask: 33.5, robust_listing_count: 5 },
    { observed_at: daysAgoIso(5), robust_median_ask: 35.2, p25_ask: 33.1, robust_listing_count: 5 },
    { observed_at: daysAgoIso(1), robust_median_ask: 35.1, p25_ask: 33.2, robust_listing_count: 5 }
  ];
  const sold = [
    { sale_date: daysAgoIso(33), sale_price: 35, shipping_price: 0 },
    { sale_date: daysAgoIso(24), sale_price: 35.5, shipping_price: 0 },
    { sale_date: daysAgoIso(10), sale_price: 35.4, shipping_price: 0 },
    { sale_date: daysAgoIso(6), sale_price: 35.2, shipping_price: 0 },
    { sale_date: daysAgoIso(2), sale_price: 35.3, shipping_price: 0 }
  ];

  const summary = buildTrendSummary(row, snapshots, sold);

  assert.equal(summary.market_regime, 'STABLE');
  assert.equal(summary.trend_blockers.includes('sold prices declining materially'), false);
});

test('falling market cannot be promoted to BUY just because a listing is below old fair value', () => {
  const row = {
    ...baseRow(),
    ask_price: 26,
    all_in_buy_cost: 26,
    fair_exit_price: 40,
    max_buy_price: 29
  };
  const snapshots = [
    { observed_at: daysAgoIso(18), robust_median_ask: 44, p25_ask: 42, robust_listing_count: 4 },
    { observed_at: daysAgoIso(14), robust_median_ask: 42, p25_ask: 40, robust_listing_count: 5 },
    { observed_at: daysAgoIso(5), robust_median_ask: 37, p25_ask: 35, robust_listing_count: 7 },
    { observed_at: daysAgoIso(1), robust_median_ask: 36, p25_ask: 34, robust_listing_count: 8 }
  ];
  const sold = [
    { sale_date: daysAgoIso(35), sale_price: 41, shipping_price: 0 },
    { sale_date: daysAgoIso(28), sale_price: 40, shipping_price: 0 },
    { sale_date: daysAgoIso(12), sale_price: 35, shipping_price: 0 },
    { sale_date: daysAgoIso(7), sale_price: 34, shipping_price: 0 },
    { sale_date: daysAgoIso(2), sale_price: 33, shipping_price: 0 }
  ];

  const summary = buildTrendSummary(row, snapshots, sold);
  const decorated = { ...row, ...summary };

  assert.equal(summary.market_regime, 'FALLING');
  assert.equal(summary.trend_blockers.includes('sold prices declining materially'), true);
  assert.equal(summary.trend_blockers.includes('below-fair listing is likely stale fair value in a falling market'), true);
  assert.equal(canApprove(decorated), false);
});
