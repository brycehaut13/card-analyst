(() => {
  const css = document.createElement('style');

  css.textContent = `
    body.flipswide .app{max-width:1260px}
    body.flipswide .nav{width:min(1260px,100%)}

    .deskhero{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin:4px 0 12px}
    .deskhero h1{margin:0;font-size:28px;letter-spacing:-.7px}
    .deskhero p{margin:5px 0 0;color:var(--m);font-size:11px;line-height:1.4}

    .deskrefresh{border:1px solid var(--l);background:#14181b;color:#e8f7ec;border-radius:12px;padding:9px 11px;font-weight:900}

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

    .signalchip,.statechip{border-radius:999px;padding:5px 7px;font-weight:950;font-size:9px;white-space:nowrap}
    .signalchip{background:#17271d;color:#a8efbf;border:1px solid #2c4a39}
    .signalchip.research{background:#211e13;color:#efd27d;border-color:#4a4022}
    .signalchip.pass{background:#171c1e;color:#9ca6a1;border-color:#2f373b}
    .statechip{background:#152027;color:#9ed8ff;border:1px solid #2a3f4c}

    .deskbody{display:grid;grid-template-columns:88px 1fr;gap:9px;margin-top:9px}
    .cardimg{width:88px;height:116px;border-radius:11px;object-fit:cover;background:#0a0d0f;border:1px solid #222b30}
    .cardimgph{display:flex;align-items:center;justify-content:center;color:#77817d;font-size:9px}

    .cardname{font-size:12px;font-weight:860;line-height:1.28}
    .cardmeta{margin-top:3px;color:var(--m);font-size:8px;line-height:1.35}

    .metricgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:9px}
    .metric{background:#0b0f12;border:1px solid #1f2a30;border-radius:10px;padding:7px}
    .metric small{display:block;color:#73807d;font-size:7px;text-transform:uppercase;margin-bottom:3px}
    .metric b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}

    .pos{color:#9cf0b8}
    .neg{color:#ff9ca5}

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

    .desknotice{grid-column:1/-1;background:#0f1418;border:1px solid var(--l);border-radius:15px;padding:16px;color:var(--m);font-size:11px;line-height:1.45}

    @media(min-width:800px){.deskboard{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(min-width:1110px){.deskboard{grid-template-columns:repeat(4,minmax(0,1fr))}}
    @media(max-width:640px){
      .bankrollgrid{grid-template-columns:repeat(2,1fr)}
      .metricgrid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .deskbody{grid-template-columns:1fr}
      .cardimg,.cardimgph{width:100%;height:180px}
      .deskfoot{flex-direction:column}
      .actions{width:100%}
      .act{flex:1}
    }
  `;

  document.head.appendChild(css);

  if (typeof S === 'undefined' || typeof api !== 'function' || typeof view !== 'function') {
    return;
  }

  let savedPasses = {};
  try {
    savedPasses = JSON.parse(localStorage.getItem('flipPasses') || '{}') || {};
  } catch (_) {
    savedPasses = {};
  }

  S.tradingDesk = S.tradingDesk || {
    feed: [],
    orders: [],
    drafts: [],
    filter: 'all',
    passing: savedPasses
  };

  const STATES = [
    'SIGNAL',
    'APPROVED',
    'PURCHASED',
    'RECEIVED',
    'VERIFIED',
    'RESALE DRAFTED',
    'LISTED',
    'SOLD'
  ];

  const NEXT_STATE = {
    SIGNAL: 'APPROVED',
    APPROVED: 'PURCHASED',
    PURCHASED: 'RECEIVED',
    RECEIVED: 'VERIFIED',
    VERIFIED: 'RESALE DRAFTED',
    'RESALE DRAFTED': 'LISTED',
    LISTED: 'SOLD'
  };

  const SOLD_STATE = 'SOLD';
  const PILOT_BANKROLL = 250;

  const app = document.querySelector('.app');
  const nav = document.querySelector('.nav');

  if (!app || !nav) {
    return;
  }

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

    if (flipsPage) {
      flipsPage.classList.toggle('hidden', v !== 'flips');
    }

    if (v === 'flips') {
      const n = document.getElementById('flipnav');

      if (n) {
        n.classList.add('active');
      }

      loadFlips();
    }

    return out;
  };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);

  const num = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const cash = v => {
    const n = num(v);

    if (n == null) {
      return '—';
    }

    return '$' + n.toLocaleString(undefined, {
      minimumFractionDigits: Math.abs(n) < 100 ? 2 : 0,
      maximumFractionDigits: 2
    });
  };

  const pct = v => {
    const n = num(v);

    if (n == null) {
      return '—';
    }

    return (n * 100).toFixed(1) + '%';
  };

  const confidencePct = v => {
    const n = num(v);
    return n == null ? '—' : Math.round(n * 100) + '%';
  };

  const normState = v => {
    const s = String(v || '').trim().toUpperCase().replace(/_/g, ' ');
    return STATES.includes(s) ? s : 'SIGNAL';
  };

  const stateFromOrder = order => {
    if (!order) {
      return 'SIGNAL';
    }

    return normState(order.execution_state || order.order_state || order.state || order.status);
  };

  const listingKey = row => String(
    row.source_item_id ||
    row.listing_id ||
    row.ebay_item_id ||
    row.item_id ||
    row.source_listing_id ||
    row.id ||
    ''
  );

  const orderListingKey = order => String(
    order.source_item_id ||
    order.listing_id ||
    order.ebay_item_id ||
    order.item_id ||
    order.source_listing_id ||
    order.signal_listing_id ||
    order.feed_listing_id ||
    ''
  );

  const safeList = v => Array.isArray(v) ? v : (v ? [v] : []);

  function compileBlockers(row) {
    const blockers = [];

    safeList(row.execution_block_reasons).forEach(x => blockers.push(String(x)));
    safeList(row.block_reasons).forEach(x => blockers.push(String(x)));
    safeList(row.rejection_reasons).forEach(x => blockers.push(String(x)));
    safeList(row.quality_flags).forEach(x => blockers.push(String(x).replace(/_/g, ' ')));

    if (row.is_graded) {
      blockers.push('graded listing blocked for raw flip flow');
    }

    if (row.match_status && String(row.match_status).toLowerCase() !== 'accepted') {
      blockers.push('identity match not accepted');
    }

    if (/PASS|RESEARCH|VERIFY/.test(String(row.flip_tier || '').toUpperCase())) {
      blockers.push('signal is not in executable tier');
    }

    return [...new Set(blockers.map(x => x.trim()).filter(Boolean))].slice(0, 6);
  }

  function canApprove(row, order) {
    if (order) {
      const current = stateFromOrder(order);
      return !!NEXT_STATE[current];
    }

    const tier = String(row.flip_tier || '').toUpperCase();
    const explicit = row.execution_allowed === true || row.can_approve === true || row.allowed_for_execution === true;
    const exact = num(row.exact_match_confidence) ?? 0;
    const market = num(row.market_confidence) ?? 0;
    const acceptableTier = tier === 'BUY NOW' || tier === 'BEST OFFER' || tier === 'BUY';

    return (explicit || (acceptableTier && exact >= 0.9 && market >= 0.9)) && compileBlockers(row).length === 0;
  }

  function signalClass(tier) {
    const t = String(tier || '').toUpperCase();
    if (t.includes('PASS')) return 'pass';
    if (t.includes('RESEARCH') || t.includes('VERIFY')) return 'research';
    return '';
  }

  function byUpdatedDesc(a, b) {
    return new Date(
      b.updated_at || b.created_at || 0
    ) - new Date(
      a.updated_at || a.created_at || 0
    );
  }

  function orderByListing(orders) {
    const out = {};

    (orders || []).slice().sort(byUpdatedDesc).forEach(order => {
      const key = orderListingKey(order);

      if (key && !out[key]) {
        out[key] = order;
      }
    });

    return out;
  }

  function allInCost(order, row) {
    return num(
      order?.all_in_buy_cost ??
      order?.buy_cost_total ??
      order?.purchase_total ??
      order?.approved_buy_cost ??
      row?.all_in_buy_cost
    ) || 0;
  }

  function realizedProfit(order) {
    const direct = num(order?.realized_profit ?? order?.profit_realized ?? order?.net_profit);

    if (direct != null) {
      return direct;
    }

    const sold = num(order?.sale_total ?? order?.sale_price ?? order?.sold_price ?? order?.exit_price);
    const buy = num(order?.all_in_buy_cost ?? order?.buy_cost_total ?? order?.purchase_total);

    if (sold == null || buy == null) {
      return 0;
    }

    return sold - buy;
  }

  async function safeApi(path) {
    try {
      return (await api(path)) || [];
    } catch (e) {
      console.warn('Trading Desk source unavailable', path, e);
      return [];
    }
  }

  async function safeRpc(name, payload) {
    try {
      return await api('/rest/v1/rpc/' + name, {
        method: 'POST',
        body: JSON.stringify(payload || {})
      });
    } catch (error) {
      const message = String(error?.message || error || '');

      if (/does not exist|not found|404/i.test(message)) {
        return null;
      }

      throw error;
    }
  }

  function nextAllowedState(order) {
    return NEXT_STATE[stateFromOrder(order)] || null;
  }

  async function createExecutionOrder(row) {
    const key = listingKey(row);
    const sourceItemId = String(row?.source_item_id || '').trim();

    if (!key) {
      throw new Error('Missing listing id for this signal.');
    }

    if (!sourceItemId) {
      throw new Error('Missing source_item_id for this signal.');
    }

    if (orderByListing(S.tradingDesk.orders)[key]) {
      throw new Error('Execution order already exists for this listing.');
    }

    const payload = { p_source_item_id: sourceItemId };
    const rpcNames = [
      'create_flip_execution_order',
      'queue_flip_execution'
    ];

    for (const name of rpcNames) {
      const result = await safeRpc(name, payload);

      if (result !== null) {
        return result;
      }
    }

    throw new Error('Execution gate RPC not available for this environment.');
  }

  async function transitionOrder(order, toState) {
    const id = order.id;

    if (!id) {
      throw new Error('Order id missing; cannot transition.');
    }

    const expectedNext = NEXT_STATE[stateFromOrder(order)];

    if (!expectedNext || expectedNext !== toState) {
      throw new Error('Invalid state transition requested.');
    }

    const payload = {
      p_order_id: order.id,
      p_to_state: toState
    };

    const result = await safeRpc(
      'transition_flip_execution_order',
      payload
    );

    if (result !== null) {
      return result;
    }

    throw new Error('transition_flip_execution_order RPC not available for this environment.');
  }

  function pilotStats(feed, orders, drafts) {
    const dedup = [];
    const seen = new Set();

    (orders || []).slice().sort(byUpdatedDesc).forEach(order => {
      const id = String(order.id || orderListingKey(order));

      if (!id || seen.has(id)) {
        return;
      }

      seen.add(id);
      dedup.push(order);
    });

    const open = dedup.filter(order => stateFromOrder(order) !== SOLD_STATE);
    const sold = dedup.filter(order => stateFromOrder(order) === SOLD_STATE);

    const deployed = open.reduce((sum, order) => sum + allInCost(order), 0);
    const realized = sold.reduce((sum, order) => sum + realizedProfit(order), 0);

    return {
      pilot: PILOT_BANKROLL,
      deployed,
      available: PILOT_BANKROLL - deployed,
      openOrders: open.length,
      openPositions: open.filter(order => stateFromOrder(order) !== 'APPROVED' && stateFromOrder(order) !== 'SIGNAL').length,
      realized,
      resaleDrafts: (drafts || []).length,
      candidates: (feed || []).length
    };
  }

  function rowSignalState(row, order) {
    if (order) {
      return stateFromOrder(order);
    }

    return 'SIGNAL';
  }

  function rowFreshness(row) {
    if (row.freshness_label) {
      return row.freshness_label;
    }

    if (row.item_created_at) {
      const ageHours = Math.max(0, (Date.now() - new Date(row.item_created_at).getTime()) / 3600000);

      if (ageHours <= 24) {
        return 'new today';
      }

      if (ageHours <= 72) {
        return 'fresh';
      }
    }

    return '—';
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

  function compPrice(row) {
    return num(
      row.verified_raw_sold_comp_median ??
      row.raw_sold_comp_median ??
      row.recent_verified_raw_sold_comp_median ??
      row.median_verified_raw_sale ??
      row.fair_exit_price
    );
  }

  function filters() {
    return [
      ['all', 'All'],
      ['buy', 'BUY'],
      ['research', 'RESEARCH'],
      ['pass', 'PASS'],
      ['verify', 'VERIFY'],
      ['active', 'Open Orders']
    ];
  }

  function visibleRows(feed, orderMap) {
    const filter = S.tradingDesk.filter || 'all';

    return (feed || [])
      .map(row => ({
        row,
        key: listingKey(row),
        order: orderMap[listingKey(row)] || null,
        tier: String(row.flip_tier || '').toUpperCase(),
        state: rowSignalState(row, orderMap[listingKey(row)] || null),
        blocked: compileBlockers(row)
      }))
      .filter(item => {
        if (S.tradingDesk.passing[item.key]) {
          return false;
        }

        if (filter === 'buy') {
          return /BUY/.test(item.tier);
        }

        if (filter === 'research') {
          return /RESEARCH/.test(item.tier);
        }

        if (filter === 'pass') {
          return /PASS/.test(item.tier);
        }

        if (filter === 'verify') {
          return /VERIFY/.test(item.tier);
        }

        if (filter === 'active') {
          return !!item.order && item.state !== SOLD_STATE;
        }

        return true;
      })
      .sort((a, b) => (num(b.row.flip_score) || 0) - (num(a.row.flip_score) || 0));
  }

  function cardHtml(item) {
    const x = item.row;
    const key = item.key;
    const order = item.order;
    const state = item.state;
    const blockers = item.blocked;
    const eligible = canApprove(x, order);
    const next = order ? nextAllowedState(order) : 'APPROVED';
    const profit = num(x.expected_profit) || 0;
    const roi = num(x.expected_roi) || 0;
    const compN = compCount(x);

    const signal = esc(x.flip_tier || 'SIGNAL');
    const meta = [x.player_name, x.year, x.set_name, x.card_number ? '#' + x.card_number : null, x.parallel]
      .filter(Boolean)
      .map(esc)
      .join(' · ');

    return `
      <div class="deskcard">
        <div class="deskheader">
          <span class="signalchip ${signalClass(x.flip_tier)}">${signal}</span>
          <span class="statechip">${esc(state)}</span>
        </div>

        <div class="deskbody">
          ${
            x.image_url
              ? `<img class="cardimg" src="${esc(x.image_url)}" alt="${esc(x.display_name || 'card image')}" loading="lazy">`
              : `<div class="cardimg cardimgph">No image</div>`
          }

          <div>
            <div class="cardname">${esc(x.display_name || 'Unknown card')}</div>
            <div class="cardmeta">${meta || '—'}</div>

            <div class="metricgrid">
              <div class="metric"><small>Listing price</small><b>${cash(x.ask_price ?? x.price)}</b></div>
              <div class="metric"><small>Shipping</small><b>${cash(x.shipping)}</b></div>
              <div class="metric"><small>All-in buy cost</small><b>${cash(x.all_in_buy_cost)}</b></div>
              <div class="metric"><small>Verified raw sold comps</small><b>${cash(compPrice(x))}</b></div>
              <div class="metric"><small>Comp count</small><b>${compN == null ? '—' : compN}</b></div>
              <div class="metric"><small>Fair exit price</small><b>${cash(x.fair_exit_price)}</b></div>
              <div class="metric"><small>Max buy price</small><b>${cash(x.max_buy_price)}</b></div>
              <div class="metric"><small>Expected profit</small><b class="${profit >= 0 ? 'pos' : 'neg'}">${profit >= 0 ? '+' : ''}${cash(profit)}</b></div>
              <div class="metric"><small>Expected ROI</small><b class="${roi >= 0 ? 'pos' : 'neg'}">${pct(x.expected_roi)}</b></div>
              <div class="metric"><small>Exact-match confidence</small><b>${confidencePct(x.exact_match_confidence)}</b></div>
              <div class="metric"><small>Market confidence</small><b>${confidencePct(x.market_confidence)}</b></div>
              <div class="metric"><small>Listing freshness</small><b>${esc(rowFreshness(x))}</b></div>
            </div>
          </div>
        </div>

        ${
          blockers.length
            ? `<div class="reasons"><b>Blocked from approval</b><ul>${blockers.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`
            : ''
        }

        <div class="deskfoot">
          <div class="footmeta">
            Signal score ${Math.round(num(x.flip_score) || 0)} · Exact ${confidencePct(x.exact_match_confidence)} · Market ${confidencePct(x.market_confidence)}
          </div>

          <div class="actions">
            <button class="act primary" data-action="approve" data-key="${esc(key)}" ${eligible ? '' : 'disabled'}>${order ? `MOVE → ${esc(next || 'DONE')}` : 'APPROVE / CREATE ORDER'}</button>
            <button class="act warn" data-action="pass" data-key="${esc(key)}">PASS</button>
            <button class="act" data-action="open" data-url="${esc(x.item_url || '')}" ${x.item_url ? '' : 'disabled'}>OPEN ON EBAY</button>
          </div>
        </div>
      </div>
    `;
  }

  function draw() {
    const root = document.getElementById('flipcontent');

    if (!root) {
      return;
    }

    const feed = S.tradingDesk.feed || [];
    const orders = S.tradingDesk.orders || [];
    const drafts = S.tradingDesk.drafts || [];
    const orderMap = orderByListing(orders);
    const rows = visibleRows(feed, orderMap);
    const stats = pilotStats(feed, orders, drafts);

    root.innerHTML = `
      <div class="deskhero">
        <div>
          <h1>Trading Desk</h1>
          <p>Execution-backed raw flips with gating, identity checks, and state-safe order progression.</p>
        </div>
        <button id="deskrefresh" class="deskrefresh">Refresh</button>
      </div>

      <div class="bankrollgrid">
        <div class="bankcard"><small>Pilot bankroll</small><b>${cash(stats.pilot)}</b></div>
        <div class="bankcard"><small>Deployed capital</small><b>${cash(stats.deployed)}</b></div>
        <div class="bankcard"><small>Available bankroll</small><b>${cash(stats.available)}</b></div>
        <div class="bankcard"><small>Open positions / orders</small><b>${stats.openPositions} / ${stats.openOrders}</b></div>
        <div class="bankcard"><small>Realized pilot profit</small><b class="${stats.realized >= 0 ? 'pos' : 'neg'}">${stats.realized >= 0 ? '+' : ''}${cash(stats.realized)}</b></div>
      </div>

      <div class="deskfilters">
        ${filters().map(([k, t]) => `<button class="deskfilter ${S.tradingDesk.filter === k ? 'active' : ''}" data-filter="${k}">${t}</button>`).join('')}
      </div>

      <div class="deskboard">
        ${rows.length ? rows.map(cardHtml).join('') : '<div class="desknotice">No cards currently match this view. Blocked cards remain blocked until confidence and identity gates clear.</div>'}
      </div>
    `;

    const refresh = document.getElementById('deskrefresh');
    if (refresh) refresh.onclick = loadFlips;

    root.querySelectorAll('[data-filter]').forEach(button => {
      button.onclick = () => {
        S.tradingDesk.filter = button.dataset.filter || 'all';
        draw();
      };
    });

    root.querySelectorAll('[data-action="open"]').forEach(button => {
      button.onclick = () => {
        if (button.dataset.url) {
          window.open(button.dataset.url, '_blank', 'noopener');
        }
      };
    });

    root.querySelectorAll('[data-action="pass"]').forEach(button => {
      button.onclick = () => {
        const key = button.dataset.key;

        if (!key) {
          return;
        }

        S.tradingDesk.passing[key] = true;
        localStorage.setItem('flipPasses', JSON.stringify(S.tradingDesk.passing));
        draw();
      };
    });

    root.querySelectorAll('[data-action="approve"]').forEach(button => {
      button.onclick = async () => {
        const key = button.dataset.key;

        if (!key) {
          return;
        }

        const row = (S.tradingDesk.feed || []).find(x => listingKey(x) === key);
        const order = orderByListing(S.tradingDesk.orders)[key] || null;

        if (!row || !canApprove(row, order)) {
          return;
        }

        button.disabled = true;
        button.textContent = 'Working…';

        try {
          if (order) {
            const next = nextAllowedState(order);
            if (!next) {
              throw new Error('No valid transition from current state.');
            }
            await transitionOrder(order, next);
          } else {
            await createExecutionOrder(row);
          }

          await loadFlips();
        } catch (error) {
          console.error(error);
          alert(error.message || 'Could not update execution order.');
          button.disabled = false;
          button.textContent = order ? `MOVE → ${nextAllowedState(order) || 'DONE'}` : 'APPROVE / CREATE ORDER';
        }
      };
    });
  }

  async function loadFlips() {
    const [feed, orders, drafts] = await Promise.all([
      safeApi('/rest/v1/golden_goose_flips_feed?select=*&order=flip_score.desc&limit=250'),
      safeApi('/rest/v1/flip_execution_orders?select=*&order=updated_at.desc&limit=500'),
      safeApi('/rest/v1/flip_resale_drafts?select=*&order=updated_at.desc&limit=500')
    ]);

    S.tradingDesk.feed = Array.isArray(feed) ? feed : [];
    S.tradingDesk.orders = Array.isArray(orders) ? orders : [];
    S.tradingDesk.drafts = Array.isArray(drafts) ? drafts : [];

    draw();
  }

  window.loadFlips = loadFlips;
})();
