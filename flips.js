(() => {
  'use strict';

  // Card Analyst Trading Desk + Misidentified
  // Full replacement for /flips.js
  // Build: FLIP3-20260821
  // Depends on globals from index.html: S, api, view

  if (typeof S === 'undefined' || typeof api !== 'function' || typeof view !== 'function') {
    console.error('[Card Analyst] flips.js could not initialize: missing S/api/view globals.');
    return;
  }

  const BUILD = 'FLIP3-20260821';
  const AUTO_REFRESH_MS = 4 * 60 * 1000;
  const PILOT_BANKROLL = 250;

  const css = document.createElement('style');
  css.textContent = `
    body.flipswide .app{max-width:1260px}
    body.flipswide .nav{width:min(1260px,100%)}
    .deskhero{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin:4px 0 12px}
    .deskhero h1{margin:0;font-size:28px;letter-spacing:-.7px}
    .deskhero p{margin:5px 0 0;color:var(--m);font-size:11px;line-height:1.4}
    .deskrefresh{border:1px solid var(--l);background:#14181b;color:#e8f7ec;border-radius:12px;padding:9px 11px;font-weight:900}
    .deskrefresh:disabled{opacity:.5}
    .desksubtabs{display:flex;gap:7px;margin:10px 0 13px;overflow-x:auto;scrollbar-width:none}
    .desksubtabs::-webkit-scrollbar{display:none}
    .desksubtab{flex:0 0 auto;border:1px solid var(--l);background:#0e1215;color:#8d9895;border-radius:999px;padding:9px 12px;font-size:10px;font-weight:900}
    .desksubtab.active{background:#e9f7ee;color:#09130d;border-color:#e9f7ee}
    .deskstatusline{display:flex;justify-content:space-between;gap:10px;align-items:center;color:var(--m);font-size:9px;margin:-4px 0 11px}
    .bankrollgrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:10px 0 14px}
    .bankcard{background:#0f1316;border:1px solid var(--l);border-radius:14px;padding:10px}
    .bankcard small{display:block;color:var(--m);font-size:8px;text-transform:uppercase;margin-bottom:6px;letter-spacing:.4px}
    .bankcard b{font-size:16px}
    .deskfilters{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;margin:10px 0 14px}
    .deskfilters::-webkit-scrollbar{display:none}
    .deskfilter{flex:0 0 auto;border:1px solid var(--l);background:#0e1215;color:#8d9895;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:900}
    .deskfilter.active{background:#e9f7ee;color:#09130d;border-color:#e9f7ee}
    .deskboard{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .deskcard{background:#0f1418;border:1px solid #263036;border-radius:16px;padding:11px;min-width:0}
    .deskheader{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
    .signalchip,.statechip,.raritychip,.reviewchip{border-radius:999px;padding:5px 7px;font-weight:950;font-size:9px;white-space:nowrap}
    .signalchip{background:#17271d;color:#a8efbf;border:1px solid #2c4a39}
    .signalchip.research{background:#211e13;color:#efd27d;border-color:#4a4022}
    .signalchip.pass{background:#171c1e;color:#9ca6a1;border-color:#2f373b}
    .statechip{background:#152027;color:#9ed8ff;border:1px solid #2a3f4c}
    .raritychip{background:#251d11;color:#ffd28c;border:1px solid #534021}
    .reviewchip{background:#24191d;color:#ffb2bc;border:1px solid #523039}
    .deskbody{display:grid;grid-template-columns:88px 1fr;gap:9px;margin-top:9px}
    .cardimg{width:88px;height:116px;border-radius:11px;object-fit:cover;background:#0a0d0f;border:1px solid #222b30}
    .cardimgph{display:flex;align-items:center;justify-content:center;color:#77817d;font-size:9px}
    .cardname{font-size:12px;font-weight:860;line-height:1.28}
    .cardmeta{margin-top:3px;color:var(--m);font-size:8px;line-height:1.35}
    .metricgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:9px}
    .metric{background:#0b0f12;border:1px solid #1f2a30;border-radius:10px;padding:7px}
    .metric small{display:block;color:#73807d;font-size:7px;text-transform:uppercase;margin-bottom:3px}
    .metric b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
    .pos{color:#9cf0b8}.neg{color:#ff9ca5}.warntext{color:#efd27d}
    .deskfoot{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;border-top:1px solid #233038;margin-top:9px;padding-top:9px}
    .footmeta{font-size:8px;color:var(--m);line-height:1.45}
    .actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
    .act{border:1px solid #2e3b42;background:#13191d;color:#ecf5f0;border-radius:9px;padding:7px 9px;font-weight:900;font-size:9px;white-space:nowrap}
    .act.primary{background:#e9f7ee;color:#07120a;border-color:#e9f7ee}
    .act.warn{background:#211e13;color:#efd27d;border-color:#4a4022}
    .act:disabled{opacity:.45;cursor:not-allowed}
    .reasons{margin-top:8px;background:#171f24;border:1px solid #2d3b43;border-radius:10px;padding:7px}
    .reasons b{font-size:8px;display:block;margin-bottom:5px;color:#ffcf98;text-transform:uppercase;letter-spacing:.35px}
    .reasons ul{margin:0;padding:0 0 0 14px;color:#ffcf98;font-size:8px;line-height:1.45}
    .decisionreason{margin-top:8px;background:#10161a;border:1px solid #223038;border-radius:10px;padding:8px;color:#d9e4df;font-size:9px;line-height:1.5}
    .decisionreason b{display:block;margin-bottom:4px;font-size:8px;color:#9ed8ff;text-transform:uppercase;letter-spacing:.35px}
    .raritybox{margin-top:8px;background:#18140e;border:1px solid #40341f;border-radius:10px;padding:8px;color:#f4dcac;font-size:9px;line-height:1.5}
    .raritybox b{display:block;margin-bottom:4px;font-size:8px;color:#ffd28c;text-transform:uppercase;letter-spacing:.35px}
    .desknotice{grid-column:1/-1;background:#0f1418;border:1px solid var(--l);border-radius:15px;padding:16px;color:var(--m);font-size:11px;line-height:1.45}
    .misidstats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 14px}
    .misidcard{background:#0f1418;border:1px solid #263036;border-radius:16px;padding:11px}
    .misidtitle{font-size:12px;font-weight:860;line-height:1.3;margin-top:8px}
    .misidtarget{font-size:9px;color:#9ed8ff;line-height:1.4;margin-top:5px}
    .misidwhy{margin-top:8px;padding:8px;border-radius:10px;background:#17130d;border:1px solid #3b3120;color:#f5d597;font-size:9px;line-height:1.45}
    @media(min-width:800px){.deskboard{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(min-width:1110px){.deskboard{grid-template-columns:repeat(4,minmax(0,1fr))}}
    @media(max-width:640px){
      .bankrollgrid,.misidstats{grid-template-columns:repeat(2,1fr)}
      .metricgrid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .deskbody{grid-template-columns:1fr}
      .cardimg,.cardimgph{width:100%;height:180px}
      .deskfoot{flex-direction:column}.actions{width:100%}.act{flex:1}
    }
  `;
  document.head.appendChild(css);

  const STATES = ['SIGNAL','APPROVED','PURCHASED','RECEIVED','VERIFIED','RESALE DRAFTED','LISTED','SOLD'];
  const NEXT_STATE = {
    SIGNAL:'APPROVED', APPROVED:'PURCHASED', PURCHASED:'RECEIVED', RECEIVED:'VERIFIED',
    VERIFIED:'RESALE DRAFTED', 'RESALE DRAFTED':'LISTED', LISTED:'SOLD'
  };

  let savedPasses = {};
  try { savedPasses = JSON.parse(localStorage.getItem('flipPasses') || '{}') || {}; } catch (_) {}

  S.tradingDesk = S.tradingDesk || {};
  Object.assign(S.tradingDesk, {
    feed: S.tradingDesk.feed || [],
    orders: S.tradingDesk.orders || [],
    drafts: S.tradingDesk.drafts || [],
    rarity: S.tradingDesk.rarity || [],
    misidentified: S.tradingDesk.misidentified || [],
    misidentifiedReview: S.tradingDesk.misidentifiedReview || [],
    filter: S.tradingDesk.filter || 'all',
    subview: S.tradingDesk.subview || 'desk',
    misidFilter: S.tradingDesk.misidFilter || 'actionable',
    passing: savedPasses,
    lastRefreshAt: S.tradingDesk.lastRefreshAt || null,
    loading: false
  });

  const app = document.querySelector('.app');
  const nav = document.querySelector('.nav');
  if (!app || !nav) return;

  let page = document.getElementById('flips');
  if (!page) {
    page = document.createElement('section');
    page.id = 'flips';
    page.className = 'hidden';
    page.innerHTML = '<div id="flipcontent"><div class="empty">Loading Trading Desk…</div></div>';
    app.appendChild(page);
  }

  if (!document.getElementById('flipnav')) {
    const button = document.createElement('button');
    button.id = 'flipnav';
    button.innerHTML = '<span class="navico">↗</span>Flips';
    button.onclick = () => view('flips');
    nav.appendChild(button);
    nav.style.gridTemplateColumns = 'repeat(5,1fr)';
  }

  const oldView = view;
  view = function(v) {
    document.body.classList.toggle('flipswide', v === 'flips');
    const out = oldView(v);
    const flipsPage = document.getElementById('flips');
    if (flipsPage) flipsPage.classList.toggle('hidden', v !== 'flips');
    const flipNav = document.getElementById('flipnav');
    if (flipNav) flipNav.classList.toggle('active', v === 'flips');
    if (v === 'flips') loadFlips(false);
    return out;
  };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[m]);

  const num = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const cash = v => {
    const n = num(v);
    return n == null
      ? '—'
      : '$' + n.toLocaleString(undefined,{
          minimumFractionDigits:Math.abs(n)<100?2:0,
          maximumFractionDigits:2
        });
  };

  const pct = v => {
    const n = num(v);
    return n == null ? '—' : (n*100).toFixed(1)+'%';
  };

  const conf = v => {
    const n = num(v);
    return n == null ? '—' : Math.round(n*100)+'%';
  };

  const listingKey = r =>
    String(r?.source_item_id || r?.listing_id || r?.item_id || r?.id || '');

  const orderKey = r =>
    String(r?.source_item_id || r?.listing_id || r?.item_id || r?.signal_listing_id || '');

  const stateFromOrder = o => {
    if (!o) return 'SIGNAL';

    const s = String(
      o.execution_state ||
      o.order_state ||
      o.state ||
      o.status ||
      ''
    ).trim().toUpperCase().replace(/_/g,' ');

    return STATES.includes(s) ? s : 'SIGNAL';
  };

  const byUpdatedDesc = (a,b) =>
    new Date(b.updated_at || b.created_at || 0) -
    new Date(a.updated_at || a.created_at || 0);

  const orderByListing = orders => {
    const out = {};

    (orders || [])
      .slice()
      .sort(byUpdatedDesc)
      .forEach(o => {
        const k = orderKey(o);
        if (k && !out[k]) out[k] = o;
      });

    return out;
  };

  const draftByOrder = drafts => {
    const out = {};

    (drafts || []).forEach(d => {
      const k = String(d.execution_order_id || '');
      if (k && !out[k]) out[k] = d;
    });

    return out;
  };

  const safeList = v =>
    Array.isArray(v) ? v : (v ? [v] : []);

  const compCount = row =>
    num(
      row.recent_raw_sales_count ??
      row.verified_raw_sold_comp_count ??
      row.raw_sold_comp_count ??
      row.exact_sales_count
    );

  const compPrice = row =>
    num(
      row.recent_raw_sales_median ??
      row.verified_raw_sold_comp_median ??
      row.raw_sold_comp_median ??
      row.fair_exit_price
    );

  function compileBlockers(row) {
    const blockers = [];

    safeList(row.execution_block_reasons)
      .forEach(x => blockers.push(String(x)));
    safeList(row.block_reasons)
      .forEach(x => blockers.push(String(x)));

    safeList(row.rejection_reasons)
      .forEach(x => blockers.push(String(x)));

    safeList(row.quality_flags)
      .forEach(x => blockers.push(String(x).replace(/_/g,' ')));

    if (row.is_graded) {
      blockers.push('graded listing blocked for raw flip flow');
    }

    if (
      row.match_status &&
      String(row.match_status).toLowerCase() !== 'accepted'
    ) {
      blockers.push('identity match not accepted');
    }

    if ((num(row.exact_match_confidence) ?? 0) < .98) {
      blockers.push('exact identity confidence below 98%');
    }

    if ((compCount(row) ?? 0) < 3) {
      blockers.push('fewer than 3 recent verified raw sold comps');
    }

    if ((num(row.market_confidence) ?? 0) < .65) {
      blockers.push('market confidence below gate');
    }

    if ((num(row.expected_profit) ?? 0) <= 0) {
      blockers.push('expected profit is not positive');
    }

    if ((num(row.expected_roi) ?? 0) <= 0) {
      blockers.push('expected ROI is not positive');
    }

    return [
      ...new Set(
        blockers
          .map(x => x.trim())
          .filter(Boolean)
      )
    ].slice(0,8);
  }

  function canApprove(row, order) {
    if (order) {
      const state = stateFromOrder(order);

      if (state === 'VERIFIED') {
        return false;
      }

      return !!NEXT_STATE[state];
    }

    const tier = String(row.flip_tier || '').toUpperCase();

    const executableTier =
      tier === 'BUY NOW' ||
      tier === 'BEST OFFER' ||
      tier === 'BUY';

    return executableTier &&
      compileBlockers(row).length === 0;
  }

  async function safeRpc(name, payload = {}) {
    try {
      return await api('/rest/v1/rpc/' + name, {
        method:'POST',
        body:JSON.stringify(payload)
      });
    } catch(e) {
      if (
        /does not exist|not found|404/i.test(
          String(e?.message || e)
        )
      ) {
        return null;
      }

      throw e;
    }
  }

  async function createExecutionOrder(row) {
    const id = String(
      row?.source_item_id || ''
    ).trim();

    if (!id) {
      throw new Error(
        'Missing source_item_id for this listing.'
      );
    }

    const payload = {
      p_source_item_id:id
    };

    for (const name of [
      'create_flip_execution_order',
      'queue_flip_execution'
    ]) {
      const r = await safeRpc(name, payload);

      if (r !== null) {
        return r;
      }
    }

    throw new Error(
      'Execution RPC is unavailable.'
    );
  }

  async function transitionOrder(order, toState) {
    if (!order?.id) {
      throw new Error('Order id missing.');
    }

    const expected =
      NEXT_STATE[stateFromOrder(order)];

    if (!expected || expected !== toState) {
      throw new Error(
        'Invalid state transition.'
      );
    }

    const r = await safeRpc(
      'transition_flip_execution_order',
      {
        p_order_id:order.id,
        p_to_state:toState
      }
    );

    if (r !== null) {
      return r;
    }

    throw new Error(
      'Transition RPC unavailable.'
    );
  }

  async function createResaleDraft(order) {
    if (
      !order?.id ||
      stateFromOrder(order) !== 'VERIFIED'
    ) {
      throw new Error(
        'Order must be VERIFIED first.'
      );
    }

    const r = await safeRpc(
      'create_flip_resale_draft',
      {
        p_execution_order_id:order.id
      }
    );

    if (r !== null) {
      return r;
    }

    throw new Error(
      'Resale draft RPC unavailable.'
    );
  }

  function rarityMap() {
    const out = {};

    (S.tradingDesk.rarity || [])
      .forEach(r => {
        if (r.catalog_id) {
          out[String(r.catalog_id)] = r;
        }
      });

    return out;
  }

  function rarityInsight(row) {
    const r =
      rarityMap()[String(row.catalog_id || '')];

    if (!r) {
      return null;
    }

    const exactMedian =
      num(r.median_90d);

    const benchmark =
      num(r.benchmark_median_90d);

    const ask =
      num(
        row.all_in_buy_cost ??
        row.ask_price ??
        row.price
      );

    const multiple =
      num(r.rarity_value_multiple);

    const exactSales =
      num(r.sales_90d) || 0;

    const benchmarkSales =
      num(r.benchmark_sales_90d) || 0;

    let relativeDiscount = null;

    if (
      ask != null &&
      benchmark != null &&
      benchmark > 0 &&
      multiple != null &&
      multiple > 0
    ) {
      const implied =
        benchmark * multiple;

      relativeDiscount =
        implied > 0
          ? 1 - ask / implied
          : null;
    }

    return {
      ...r,
      exactMedian,
      benchmark,
      ask,
      multiple,
      exactSales,
      benchmarkSales,
      relativeDiscount
    };
  }

  function rarityBox(row) {
    const r = rarityInsight(row);

    if (
      !r ||
      (
        !r.is_rarity_card &&
        r.rarity_evidence_status === 'STANDARD'
      )
    ) {
      return '';
    }

    const label =
      r.rarity_evidence_status ===
      'EXACT_RARITY_SUPPORTED'
        ? 'Exact rarity supported'
        : 'Rarity reference only';

    const multipleText =
      r.multiple != null
        ? `${r.multiple.toFixed(2)}× benchmark`
        : 'premium still building';

    const reference = [
      r.benchmark_parallel ||
        'liquid sibling',

      r.benchmark != null
        ? cash(r.benchmark)
        : null,

      r.benchmarkSales
        ? `${r.benchmarkSales} sales/90d`
        : null
    ]
      .filter(Boolean)
      .join(' · ');

    const exact = [
      r.exactMedian != null
        ? cash(r.exactMedian)
        : null,

      r.exactSales
        ? `${r.exactSales} exact sales/90d`
        : null
    ]
      .filter(Boolean)
      .join(' · ');

    const rel =
      r.relativeDiscount != null
        ? ` · listing is ${
            (
              r.relativeDiscount *
              100
            ).toFixed(1)
          }% below rarity-implied value`
        : '';

    return `
      <div class="raritybox">
        <b>
          Rarity ladder · ${esc(label)}
        </b>

        Exact rare-card market:
        ${
          esc(
            exact ||
            'insufficient exact rarity comps'
          )
        }

        <br>

        Benchmark:
        ${
          esc(
            reference ||
            'no liquid sibling benchmark yet'
          )
        }

        <br>

        ${esc(multipleText)}
        ${esc(rel)}
      </div>
    `;
  }

  function pilotStats(feed, orders) {
    const unique = [];
    const seen = new Set();

    (orders || [])
      .slice()
      .sort(byUpdatedDesc)
      .forEach(o => {
        const k =
          String(
            o.id ||
            orderKey(o)
          );

        if (
          k &&
          !seen.has(k)
        ) {
          seen.add(k);
          unique.push(o);
        }
      });

    const open =
      unique.filter(
        o =>
          stateFromOrder(o) !== 'SOLD'
      );

    const sold =
      unique.filter(
        o =>
          stateFromOrder(o) === 'SOLD'
      );

    const deployed =
      open.reduce(
        (s,o) =>
          s +
          (
            num(
              o.all_in_buy_cost ??
              o.buy_cost_total ??
              o.purchase_total
            ) || 0
          ),
        0
      );

    const realized =
      sold.reduce(
        (s,o) => {
          const direct =
            num(
              o.realized_profit ??
              o.net_profit
            );

          if (direct != null) {
            return s + direct;
          }

          const sell =
            num(
              o.sale_total ??
              o.sale_price ??
              o.sold_price
            );

          const buy =
            num(
              o.all_in_buy_cost ??
              o.buy_cost_total ??
              o.purchase_total
            );

          return (
            s +
            (
              sell != null &&
              buy != null
                ? sell - buy
                : 0
            )
          );
        },
        0
      );

    return {
      pilot:PILOT_BANKROLL,
      deployed,
      available:
        PILOT_BANKROLL -
        deployed,
      openOrders:open.length,
      realized,
      candidates:
        (feed || []).length
    };
  }

  function signalClass(tier) {
    const t =
      String(
        tier || ''
      ).toUpperCase();

    if (
      t.includes('PASS')
    ) {
      return 'pass';
    }

    if (
      t.includes('RESEARCH') ||
      t.includes('VERIFY')
    ) {
      return 'research';
    }

    return '';
  }

  function visibleRows(feed, orders) {
    const map =
      orderByListing(orders);

    const f =
      S.tradingDesk.filter ||
      'all';

    return (
      feed || []
    )
      .map(row => ({
        row,
        key:
          listingKey(row),
        order:
          map[
            listingKey(row)
          ] || null,
        tier:
          String(
            row.flip_tier ||
            ''
          ).toUpperCase()
      }))
      .filter(x => {
        if (
          S.tradingDesk
            .passing[x.key]
        ) {
          return false;
        }

        if (f === 'buy') {
          return /BUY/.test(
            x.tier
          );
        }

        if (f === 'research') {
          return /RESEARCH/.test(
            x.tier
          );
        }

        if (f === 'pass') {
          return /PASS/.test(
            x.tier
          );
        }

        if (f === 'verify') {
          return /VERIFY/.test(
            x.tier
          );
        }

        if (f === 'rare') {
          return !!rarityInsight(
            x.row
          )?.is_rarity_card;
        }

        if (f === 'active') {
          return (
            !!x.order &&
            stateFromOrder(
              x.order
            ) !== 'SOLD'
          );
        }

        return true;
      })
      .sort(
        (a,b) =>
          (
            num(
              b.row.flip_score
            ) || 0
          ) -
          (
            num(
              a.row.flip_score
            ) || 0
          )
      );
  }

  function flipCard(item) {
    const x =
      item.row;

    const order =
      item.order;

    const state =
      stateFromOrder(order);

    const blockers =
      compileBlockers(x);

    const eligible =
      canApprove(
        x,
        order
      );

    const next =
      order
        ? NEXT_STATE[state]
        : 'APPROVED';

    const profit =
      num(
        x.expected_profit
      ) || 0;

    const roi =
      num(
        x.expected_roi
      ) || 0;

    const cc =
      compCount(x);

    const draft =
      order
        ? draftByOrder(
            S.tradingDesk.drafts
          )[
            String(order.id)
          ]
        : null;

    const meta = [
      x.player_name,
      x.year,
      x.set_name,
      x.card_number
        ? '#' +
          x.card_number
        : null,
      x.parallel
    ]
      .filter(Boolean)
      .map(esc)
      .join(' · ');

    const trend =
      num(
        x.product_research_momentum_30v90 ??
        x.combined_market_momentum_score ??
        x.market_momentum_score
      );

    return `
      <div class="deskcard">

        <div class="deskheader">
          <span class="signalchip ${signalClass(x.flip_tier)}">
            ${esc(x.flip_tier || 'SIGNAL')}
          </span>

          <span class="statechip">
            ${esc(state)}
          </span>
        </div>

        <div class="deskbody">

          ${
            x.image_url
              ? `
                <img
                  class="cardimg"
                  src="${esc(x.image_url)}"
                  alt="card"
                  loading="lazy"
                >
              `
              : `
                <div class="cardimg cardimgph">
                  No image
                </div>
              `
          }

          <div>

            <div class="cardname">
              ${
                esc(
                  x.display_name ||
                  x.title ||
                  'Unknown card'
                )
              }
            </div>

            <div class="cardmeta">
              ${meta || '—'}
            </div>

            <div class="metricgrid">

              <div class="metric">
                <small>Listing</small>
                <b>
                  ${cash(
                    x.ask_price ??
                    x.price
                  )}
                </b>
              </div>

              <div class="metric">
                <small>All-in</small>
                <b>
                  ${cash(
                    x.all_in_buy_cost
                  )}
                </b>
              </div>

              <div class="metric">
                <small>Comp median</small>
                <b>
                  ${cash(
                    compPrice(x)
                  )}
                </b>
              </div>

              <div class="metric">
                <small>Exact comps</small>
                <b>
                  ${
                    cc == null
                      ? '—'
                      : cc
                  }
                </b>
              </div>

              <div class="metric">
                <small>Fair exit</small>
                <b>
                  ${cash(
                    x.fair_exit_price
                  )}
                </b>
              </div>

              <div class="metric">
                <small>Max buy</small>
                <b>
                  ${cash(
                    x.max_buy_price
                  )}
                </b>
              </div>

              <div class="metric">
                <small>Profit</small>
                <b class="${profit >= 0 ? 'pos' : 'neg'}">
                  ${
                    profit >= 0
                      ? '+'
                      : ''
                  }
                  ${cash(profit)}
                </b>
              </div>

              <div class="metric">
                <small>ROI</small>
                <b class="${roi >= 0 ? 'pos' : 'neg'}">
                  ${pct(roi)}
                </b>
              </div>

              <div class="metric">
                <small>Exact conf.</small>
                <b>
                  ${conf(
                    x.exact_match_confidence
                  )}
                </b>
              </div>

              <div class="metric">
                <small>Market conf.</small>
                <b>
                  ${conf(
                    x.market_confidence
                  )}
                </b>
              </div>

              <div class="metric">
                <small>PR momentum</small>
                <b class="${(trend || 0) >= 0 ? 'pos' : 'neg'}">
                  ${
                    trend == null
                      ? '—'
                      : trend.toFixed(2)
                  }
                </b>
              </div>

              <div class="metric">
                <small>90d sales</small>
                <b>
                  ${
                    x.recent_raw_sales_count ??
                    x.sales_90d ??
                    '—'
                  }
                </b>
              </div>

            </div>
          </div>
        </div>

        ${rarityBox(x)}

        <div class="decisionreason">
          <b>
            ${
              eligible
                ? 'Execution-ready'
                : 'Current decision'
            }
          </b>

          ${
            esc(
              x.decision_reason ||
              (
                blockers.length
                  ? blockers
                      .slice(0,3)
                      .join('; ')
                  : 'Existing identity, comp, market, profit and ROI gates determine the action.'
              )
            )
          }
        </div>

        ${
          blockers.length
            ? `
              <div class="reasons">
                <b>Blocked</b>
                <ul>
                  ${
                    blockers
                      .map(
                        r =>
                          `<li>${esc(r)}</li>`
                      )
                      .join('')
                  }
                </ul>
              </div>
            `
            : ''
        }

        <div class="deskfoot">

          <div class="footmeta">
            Score
            ${Math.round(
              num(
                x.flip_score
              ) || 0
            )}
            ·
            ${BUILD}

            ${
              draft
                ? `
                  <br>
                  Draft:
                  ${
                    esc(
                      draft.draft_status ||
                      draft.status ||
                      'PENDING'
                    )
                  }
                `
                : ''
            }
          </div>

          <div class="actions">

            <button
              class="act primary"
              data-action="approve"
              data-key="${esc(item.key)}"
              ${eligible ? '' : 'disabled'}
            >
              ${
                order
                  ? `MOVE → ${esc(next || 'DONE')}`
                  : 'APPROVE / CREATE ORDER'
              }
            </button>

            ${
              state === 'VERIFIED' &&
              order &&
              !draft
                ? `
                  <button
                    class="act primary"
                    data-action="draft"
                    data-key="${esc(item.key)}"
                  >
                    PREPARE RESALE DRAFT
                  </button>
                `
                : ''
            }

            <button
              class="act warn"
              data-action="pass"
              data-key="${esc(item.key)}"
            >
              PASS
            </button>

            <button
              class="act"
              data-action="open"
              data-url="${esc(x.item_url || '')}"
              ${x.item_url ? '' : 'disabled'}
            >
              OPEN ON EBAY
            </button>

          </div>
        </div>
      </div>
    `;
  }

  function misidentifiedRows() {
    return (
      S.tradingDesk.misidFilter ===
      'actionable'
        ? (
            S.tradingDesk
              .misidentified ||
            []
          )
        : (
            S.tradingDesk
              .misidentifiedReview ||
            []
          )
    );
  }

  function opportunityLabel(x) {
    const type =
      String(
        x.opportunity_type ||
        ''
      )
        .replace(/_/g,' ')
        .trim();

    if (type) {
      return type.toUpperCase();
    }

    if (x.serial_to) {
      return (
        `SERIAL /${x.serial_to} ` +
        'POSSIBLY OMITTED'
      );
    }

    if (x.target_is_autograph) {
      return (
        'AUTOGRAPH ' +
        'POSSIBLY OMITTED'
      );
    }

    return (
      `${x.target_parallel || 'PARALLEL'} ` +
      'POSSIBLY OMITTED'
    ).toUpperCase();
  }
function misidCard(x) {
    const profit =
      num(
        x.estimated_profit_if_confirmed
      ) || 0;

    const roi =
      num(
        x.estimated_roi_if_confirmed
      ) || 0;

    const why = [
      opportunityLabel(x),

      x.review_priority
        ? `priority ${x.review_priority}`
        : null,

      x.rejection_reasons?.length
        ? x.rejection_reasons.join(', ')
        : null
    ]
      .filter(Boolean)
      .join(' · ');

    return `
      <div class="misidcard">

        <div class="deskheader">
          <span class="reviewchip">
            ${esc(
              x.action ||
              'CHECK IMAGE'
            )}
          </span>

          <span class="raritychip">
            ${esc(
              opportunityLabel(x)
            )}
          </span>
        </div>

        <div class="deskbody">

          ${
            x.image_url
              ? `
                <img
                  class="cardimg"
                  src="${esc(x.image_url)}"
                  alt="listing"
                  loading="lazy"
                >
              `
              : `
                <div class="cardimg cardimgph">
                  No image
                </div>
              `
          }

          <div>

            <div class="misidtitle">
              ${
                esc(
                  x.title ||
                  'eBay listing'
                )
              }
            </div>

            <div class="misidtarget">
              Target identity:
              ${
                esc(
                  x.target_identity ||
                  [
                    x.year,
                    x.set_name,
                    x.player_name,
                    x.card_number,
                    x.target_parallel
                  ]
                    .filter(Boolean)
                    .join(' · ')
                )
              }
            </div>

            <div class="metricgrid">

              <div class="metric">
                <small>Ask</small>
                <b>
                  ${cash(x.total_ask)}
                </b>
              </div>

              <div class="metric">
                <small>Target value</small>
                <b>
                  ${cash(
                    x.reference_value
                  )}
                </b>
              </div>

              <div class="metric">
                <small>90d target sales</small>
                <b>
                  ${x.sales_90d ?? '—'}
                </b>
              </div>

              <div class="metric">
                <small>Target median</small>
                <b>
                  ${cash(
                    x.sold_median_90d
                  )}
                </b>
              </div>

              <div class="metric">
                <small>Profit if confirmed</small>
                <b class="${profit >= 0 ? 'pos' : 'neg'}">
                  ${
                    profit >= 0
                      ? '+'
                      : ''
                  }
                  ${cash(profit)}
                </b>
              </div>

              <div class="metric">
                <small>ROI if confirmed</small>
                <b class="${roi >= 0 ? 'pos' : 'neg'}">
                  ${pct(roi)}
                </b>
              </div>

              <div class="metric">
                <small>Max buy</small>
                <b>
                  ${cash(
                    x.max_buy_if_confirmed
                  )}
                </b>
              </div>

              <div class="metric">
                <small>Market conf.</small>
                <b>
                  ${conf(
                    x.market_confidence
                  )}
                </b>
              </div>

            </div>
          </div>
        </div>

        <div class="misidwhy">
          <b>Why it was flagged</b>
          <br>
          ${esc(why)}

          <br><br>

          <b>
            Do not buy from title alone.
          </b>

          Confirm the premium trait from the
          listing images before purchase.
        </div>

        <div class="deskfoot">

          <div class="footmeta">
            Reference:
            ${
              esc(
                x.reference_basis ||
                'verified sold comps'
              )
            }
          </div>

          <div class="actions">

            <button
              class="act primary"
              data-action="openmis"
              data-url="${esc(x.item_url || '')}"
              ${x.item_url ? '' : 'disabled'}
            >
              CHECK ON EBAY
            </button>

          </div>
        </div>
      </div>
    `;
  }

  function drawDesk(root) {
    const feed =
      S.tradingDesk.feed || [];

    const orders =
      S.tradingDesk.orders || [];

    const stats =
      pilotStats(
        feed,
        orders
      );

    const rows =
      visibleRows(
        feed,
        orders
      );

    root.innerHTML = `

      <div class="bankrollgrid">

        <div class="bankcard">
          <small>Pilot bankroll</small>
          <b>${cash(stats.pilot)}</b>
        </div>

        <div class="bankcard">
          <small>Deployed</small>
          <b>${cash(stats.deployed)}</b>
        </div>

        <div class="bankcard">
          <small>Available</small>
          <b>${cash(stats.available)}</b>
        </div>

        <div class="bankcard">
          <small>Open orders</small>
          <b>${stats.openOrders}</b>
        </div>

        <div class="bankcard">
          <small>Realized profit</small>
          <b class="${stats.realized >= 0 ? 'pos' : 'neg'}">
            ${
              stats.realized >= 0
                ? '+'
                : ''
            }
            ${cash(stats.realized)}
          </b>
        </div>

      </div>

      <div class="deskfilters">

        ${
          [
            ['all','All'],
            ['buy','BUY'],
            ['research','RESEARCH'],
            ['verify','VERIFY'],
            ['rare','Rare / #'],
            ['pass','PASS'],
            ['active','Open Orders']
          ]
            .map(
              ([k,t]) =>
                `
                  <button
                    class="deskfilter ${
                      S.tradingDesk.filter === k
                        ? 'active'
                        : ''
                    }"
                    data-filter="${k}"
                  >
                    ${t}
                  </button>
                `
            )
            .join('')
        }

      </div>

      <div class="deskboard">

        ${
          rows.length
            ? rows
                .map(flipCard)
                .join('')
            : `
              <div class="desknotice">
                No cards match this view.
                Cards remain blocked until exact identity,
                comp coverage, market confidence,
                and economics clear the gates.
              </div>
            `
        }

      </div>
    `;
  }

  function drawMisidentified(root) {
    const actionable =
      S.tradingDesk.misidentified || [];

    const review =
      S.tradingDesk.misidentifiedReview || [];

    const rows =
      misidentifiedRows();

    root.innerHTML = `

      <div class="misidstats">

        <div class="bankcard">
          <small>Actionable now</small>
          <b>${actionable.length}</b>
        </div>

        <div class="bankcard">
          <small>Review candidates</small>
          <b>${review.length}</b>
        </div>

        <div class="bankcard">
          <small>Minimum exact sales</small>
          <b>5 / 90d</b>
        </div>

        <div class="bankcard">
          <small>Image confirmation</small>
          <b>Required</b>
        </div>

      </div>

      <div class="deskfilters">

        <button
          class="deskfilter ${
            S.tradingDesk.misidFilter ===
            'actionable'
              ? 'active'
              : ''
          }"
          data-misfilter="actionable"
        >
          Actionable
        </button>

        <button
          class="deskfilter ${
            S.tradingDesk.misidFilter ===
            'review'
              ? 'active'
              : ''
          }"
          data-misfilter="review"
        >
          Review Queue
        </button>

      </div>

      <div class="deskboard">

        ${
          rows.length
            ? rows
                .map(misidCard)
                .join('')
            : `
              <div class="desknotice">
                <b>
                  No strict misidentified buys right now.
                </b>

                <br><br>

                That is a valid result.
                Card Analyst will surface candidates only
                when the economics and identity evidence
                justify image review; it will not manufacture
                arbitrage opportunities.
              </div>
            `
        }

      </div>
    `;
  }

  function draw() {
    const root =
      document.getElementById(
        'flipcontent'
      );

    if (!root) {
      return;
    }

    const when =
      S.tradingDesk.lastRefreshAt
        ? new Date(
            S.tradingDesk.lastRefreshAt
          ).toLocaleTimeString(
            [],
            {
              hour:'numeric',
              minute:'2-digit',
              second:'2-digit'
            }
          )
        : '—';

    root.innerHTML = `

      <div class="deskhero">

        <div>
          <h1>
            Trading Desk
          </h1>

          <p>
            Exact-match flips,
            rarity-relative value,
            and misidentified-card arbitrage.
          </p>
        </div>

        <button
          id="deskrefresh"
          class="deskrefresh"
          ${
            S.tradingDesk.loading
              ? 'disabled'
              : ''
          }
        >
          ${
            S.tradingDesk.loading
              ? 'Refreshing…'
              : 'Refresh'
          }
        </button>

      </div>

      <div class="desksubtabs">

        <button
          class="desksubtab ${
            S.tradingDesk.subview ===
            'desk'
              ? 'active'
              : ''
          }"
          data-sub="desk"
        >
          Trading Desk
        </button>

        <button
          class="desksubtab ${
            S.tradingDesk.subview ===
            'misid'
              ? 'active'
              : ''
          }"
          data-sub="misid"
        >
          Misidentified
        </button>

      </div>

      <div class="deskstatusline">

        <span>
          Auto-refresh:
          every 4 min
        </span>

        <span>
          Last updated:
          ${esc(when)}
          ·
          ${BUILD}
        </span>

      </div>

      <div id="deskbody"></div>
    `;

    const body =
      document.getElementById(
        'deskbody'
      );

    if (
      S.tradingDesk.subview ===
      'misid'
    ) {
      drawMisidentified(body);
    } else {
      drawDesk(body);
    }

    document.getElementById(
      'deskrefresh'
    ).onclick =
      () => loadFlips(true);

    root
      .querySelectorAll(
        '[data-sub]'
      )
      .forEach(
        b =>
          b.onclick =
            () => {
              S.tradingDesk.subview =
                b.dataset.sub;

              draw();
            }
      );

    root
      .querySelectorAll(
        '[data-filter]'
      )
      .forEach(
        b =>
          b.onclick =
            () => {
              S.tradingDesk.filter =
                b.dataset.filter;

              draw();
            }
      );

    root
      .querySelectorAll(
        '[data-misfilter]'
      )
      .forEach(
        b =>
          b.onclick =
            () => {
              S.tradingDesk.misidFilter =
                b.dataset.misfilter;

              draw();
            }
      );

    root
      .querySelectorAll(
        '[data-action="open"],[data-action="openmis"]'
      )
      .forEach(
        b =>
          b.onclick =
            () => {
              if (
                b.dataset.url
              ) {
                window.open(
                  b.dataset.url,
                  '_blank',
                  'noopener'
                );
              }
            }
      );

    root
      .querySelectorAll(
        '[data-action="pass"]'
      )
      .forEach(
        b =>
          b.onclick =
            () => {
              const k =
                b.dataset.key;

              if (!k) {
                return;
              }

              S.tradingDesk
                .passing[k] =
                true;

              localStorage.setItem(
                'flipPasses',
                JSON.stringify(
                  S.tradingDesk.passing
                )
              );

              draw();
            }
      );

    root
      .querySelectorAll(
        '[data-action="draft"]'
      )
      .forEach(
        b =>
          b.onclick =
            async () => {

              const k =
                b.dataset.key;

              const row =
                (
                  S.tradingDesk.feed ||
                  []
                )
                  .find(
                    x =>
                      listingKey(x) ===
                      k
                  );

              const order =
                orderByListing(
                  S.tradingDesk.orders
                )[k];

              if (
                !row ||
                !order
              ) {
                return;
              }

              b.disabled = true;

              b.textContent =
                'Preparing…';

              try {

                await createResaleDraft(
                  order
                );

                await loadFlips(
                  true
                );

              } catch(e) {

                alert(
                  e?.message ||
                  'Could not prepare resale draft.'
                );

                draw();
              }
            }
      );

    root
      .querySelectorAll(
        '[data-action="approve"]'
      )
      .forEach(
        b =>
          b.onclick =
            async () => {

              const k =
                b.dataset.key;

              const row =
                (
                  S.tradingDesk.feed ||
                  []
                )
                  .find(
                    x =>
                      listingKey(x) ===
                      k
                  );

              const order =
                orderByListing(
                  S.tradingDesk.orders
                )[k] ||
                null;

              if (
                !row ||
                !canApprove(
                  row,
                  order
                )
              ) {
                return;
              }

              b.disabled =
                true;

              b.textContent =
                'Working…';

              try {

                if (order) {

                  const next =
                    NEXT_STATE[
                      stateFromOrder(
                        order
                      )
                    ];

                  if (!next) {
                    throw new Error(
                      'No valid next state.'
                    );
                  }

                  await transitionOrder(
                    order,
                    next
                  );

                } else {

                  await createExecutionOrder(
                    row
                  );
                }

                await loadFlips(
                  true
                );

              } catch(e) {

                alert(
                  e?.message ||
                  'Could not update execution order.'
                );

                draw();
              }
            }
      );
  }

  async function fetchAll() {

    const [
      feed,
      orders,
      drafts,
      rarity,
      misid,
      review
    ] =
      await Promise.all([

         api(
           '/rest/v1/golden_goose_flips_app_feed_v1?select=*&order=flip_score.desc&limit=250'
         )
          .catch(
            e => {
              console.error(
                '[Trading Desk] feed',
                e
              );

              return [];
            }
          ),

        api(
          '/rest/v1/flip_execution_orders?select=*&order=updated_at.desc&limit=500'
        )
          .catch(
            () => []
          ),

        api(
          '/rest/v1/flip_resale_drafts?select=*&order=updated_at.desc&limit=500'
        )
          .catch(
            () => []
          ),

        api(
          '/rest/v1/flip_rarity_ladder_v1?select=*&order=sales_90d.desc&limit=1000'
        )
          .catch(
            e => {
              console.warn(
                '[Trading Desk] rarity ladder unavailable',
                e
              );

              return [];
            }
          ),

        api(
          '/rest/v1/ebay_misidentified_actionable_v1?select=*&order=estimated_profit_if_confirmed.desc&limit=100'
        )
          .catch(
            e => {
              console.warn(
                '[Misidentified] actionable unavailable',
                e
              );

              return [];
            }
          ),

        api(
          '/rest/v1/ebay_misidentified_opportunities_v2?select=*&order=estimated_profit_if_confirmed.desc&limit=150'
        )
          .catch(
            e => {
              console.warn(
                '[Misidentified] review unavailable',
                e
              );

              return [];
            }
          )

      ]);

    S.tradingDesk.feed =
      Array.isArray(feed)
        ? feed
        : [];

    S.tradingDesk.orders =
      Array.isArray(orders)
        ? orders
        : [];

    S.tradingDesk.drafts =
      Array.isArray(drafts)
        ? drafts
        : [];

    S.tradingDesk.rarity =
      Array.isArray(rarity)
        ? rarity
        : [];

    S.tradingDesk.misidentified =
      Array.isArray(misid)
        ? misid
        : [];

    S.tradingDesk.misidentifiedReview =
      Array.isArray(review)
        ? review
        : [];

    S.tradingDesk.lastRefreshAt =
      new Date().toISOString();
  }

  async function loadFlips(
    force = false
  ) {

    if (
      S.tradingDesk.loading
    ) {
      return;
    }

    if (
      !force &&
      S.tradingDesk.lastRefreshAt &&
      (
        Date.now() -
        new Date(
          S.tradingDesk.lastRefreshAt
        ).getTime()
      ) < 15000
    ) {

      draw();
      return;
    }

    S.tradingDesk.loading =
      true;

    draw();

    try {

      await fetchAll();

    } finally {

      S.tradingDesk.loading =
        false;

      draw();
    }
  }

  // Auto-refresh only while the Flips page is open.
  // This keeps the UI fresh without unnecessary REST traffic.
  setInterval(
    () => {

      const p =
        document.getElementById(
          'flips'
        );

      if (
        p &&
        !p.classList.contains(
          'hidden'
        ) &&
        document.visibilityState ===
        'visible'
      ) {

        loadFlips(
          true
        );
      }

    },
    AUTO_REFRESH_MS
  );

  document.addEventListener(
    'visibilitychange',
    () => {

      const p =
        document.getElementById(
          'flips'
        );

      if (
        document.visibilityState ===
        'visible' &&
        p &&
        !p.classList.contains(
          'hidden'
        )
      ) {

        const age =
          S.tradingDesk.lastRefreshAt
            ? (
                Date.now() -
                new Date(
                  S.tradingDesk
                    .lastRefreshAt
                ).getTime()
              )
            : Infinity;

        if (
          age >
          AUTO_REFRESH_MS
        ) {

          loadFlips(
            true
          );
        }
      }
    }
  );

  window.loadFlips =
    loadFlips;

  window.CARD_ANALYST_FLIPS_BUILD =
    BUILD;

})();
