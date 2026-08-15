(() => {
  const css = document.createElement('style');

  css.textContent = `
    body.flipswide .app{max-width:1180px}
    body.flipswide .nav{width:min(1180px,100%)}

    .fliphero{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:end;
      margin:4px 0 12px
    }

    .fliphero h1{
      margin:0;
      font-size:27px;
      letter-spacing:-.7px
    }

    .fliphero p{
      margin:5px 0 0;
      color:var(--m);
      font-size:11px;
      line-height:1.4
    }

    .fliprefresh{
      border:1px solid var(--l);
      background:#131719;
      color:#fff;
      border-radius:12px;
      padding:9px 11px;
      font-weight:850
    }

    .flipstats{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:8px;
      margin:12px 0
    }

    .flipstat{
      background:#0e1112;
      border:1px solid var(--l);
      border-radius:14px;
      padding:10px
    }

    .flipstat small{
      display:block;
      color:var(--m);
      font-size:8px;
      text-transform:uppercase;
      margin-bottom:5px
    }

    .flipstat b{font-size:16px}

    .flipfilters{
      display:flex;
      gap:7px;
      overflow-x:auto;
      margin:12px 0 16px;
      scrollbar-width:none
    }

    .flipfilters::-webkit-scrollbar{display:none}

    .flipfilter{
      flex:0 0 auto;
      border:1px solid var(--l);
      background:#0e1112;
      color:#87918d;
      border-radius:999px;
      padding:8px 11px;
      font-size:10px;
      font-weight:900
    }

    .flipfilter.active{
      background:#e9f7ee;
      color:#07120a;
      border-color:#e9f7ee
    }

    .flipboard{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:9px
    }

    .flipcard{
      background:#101416;
      border:1px solid var(--l);
      border-radius:16px;
      padding:11px;
      min-width:0
    }

    .fliptop{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:7px
    }

    .flipscore{
      border-radius:999px;
      padding:5px 7px;
      font-weight:950;
      font-size:10px;
      background:#17271d;
      color:#a8efbf;
      border:1px solid #284633
    }

    .flipscore.mid{
      background:#211e13;
      color:#efd27d;
      border-color:#4a4022
    }

    .flipscore.low{
      background:#171a1b;
      color:#9da6a2;
      border-color:#2c3235
    }

    .fliptier{
      font-size:8px;
      font-weight:950;
      border-radius:999px;
      padding:5px 6px;
      background:#16221b;
      color:#a9f2c4;
      white-space:nowrap
    }

    .fliptier.research{
      background:#211e13;
      color:#e7ca79
    }

    .fliptier.pass{
      background:#171a1b;
      color:#8e9894
    }

    .flipname{
      font-size:11px;
      font-weight:850;
      line-height:1.3;
      margin-top:9px;
      min-height:29px
    }

    .flipmeta{
      font-size:8px;
      color:var(--m);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      margin-top:3px
    }

    .flipgrid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:6px;
      margin-top:9px
    }

    .flipmetric{
      background:#0b0e0f;
      border:1px solid #202628;
      border-radius:10px;
      padding:7px
    }

    .flipmetric small{
      display:block;
      color:#737d79;
      font-size:7px;
      text-transform:uppercase;
      margin-bottom:3px
    }

    .flipmetric b{font-size:11px}

    .flipprofit{color:#9cf0b8}
    .flipneg{color:#ff9ca5}

    .flipbottom{
      display:flex;
      justify-content:space-between;
      gap:8px;
      align-items:center;
      border-top:1px solid #202628;
      margin-top:8px;
      padding-top:8px
    }

    .flipbottom span{
      font-size:8px;
      color:var(--m);
      line-height:1.35
    }

    .flipactions{
      display:flex;
      gap:5px;
      flex-wrap:wrap;
      justify-content:flex-end
    }

    .flipopen{
      border:0;
      background:#e9f7ee;
      color:#07120a;
      border-radius:9px;
      padding:7px 9px;
      font-weight:900;
      font-size:9px;
      white-space:nowrap
    }

    .flipcomps{
      background:#1b2224;
      color:#fff;
      border:1px solid #30393c
    }

    .flipnotice{
      grid-column:1/-1;
      background:#0e1112;
      border:1px solid var(--l);
      border-radius:15px;
      padding:16px;
      color:var(--m);
      font-size:11px;
      line-height:1.5
    }

    @media(min-width:700px){
      .flipboard{
        grid-template-columns:repeat(3,minmax(0,1fr))
      }
    }

    @media(min-width:980px){
      .flipboard{
        grid-template-columns:repeat(4,minmax(0,1fr))
      }
    }

    @media(max-width:440px){
      .flipstats{
        grid-template-columns:repeat(2,1fr)
      }

      .flipbottom{
        align-items:flex-start;
        flex-direction:column
      }

      .flipactions{
        width:100%
      }

      .flipopen{
        flex:1
      }
    }
  `;

  document.head.appendChild(css);

  if (
    typeof S === 'undefined' ||
    typeof api !== 'function' ||
    typeof view !== 'function'
  ) {
    return;
  }

  S.flips = S.flips || [];
  S.flipFilter = S.flipFilter || 'all';

  try {
    q = function(id) {
      return (S.q || [])
        .filter(
          x =>
            x.card_id === id &&
            x.market_value_per_unit != null
        )
        .sort((a, b) => {
          const ca =
            Number(a.confidence_score || 0);

          const cb =
            Number(b.confidence_score || 0);

          if (cb !== ca) {
            return cb - ca;
          }

          return (
            new Date(b.last_updated_at || 0) -
            new Date(a.last_updated_at || 0)
          );
        })[0] || null;
    };
  } catch (_) {}

  const app =
    document.querySelector('.app');

  const nav =
    document.querySelector('.nav');

  if (!app || !nav) {
    return;
  }

  let page =
    document.getElementById('flips');

  if (!page) {
    page =
      document.createElement('section');

    page.id = 'flips';
    page.className = 'hidden';

    page.innerHTML = `
      <div id="flipcontent">
        <div class="empty">
          Loading Flips…
        </div>
      </div>
    `;

    app.appendChild(page);
  }

  if (!document.getElementById('flipnav')) {
    const button =
      document.createElement('button');

    button.id = 'flipnav';

    button.innerHTML = `
      <span class="navico">↗</span>
      Flips
    `;

    button.onclick =
      () => view('flips');

    nav.appendChild(button);

    nav.style.gridTemplateColumns =
      'repeat(5,1fr)';
  }

  const oldView = view;

  view = function(v) {
    document.body.classList.toggle(
      'flipswide',
      v === 'flips'
    );

    const result =
      oldView(v);

    const flipsPage =
      document.getElementById('flips');

    if (flipsPage) {
      flipsPage.classList.toggle(
        'hidden',
        v !== 'flips'
      );
    }

    if (v === 'flips') {
      const n =
        document.getElementById('flipnav');

      if (n) {
        n.classList.add('active');
      }

      loadFlips();
    }

    return result;
  };

  const cash = v => {
    if (
      v == null ||
      !Number.isFinite(+v)
    ) {
      return '—';
    }

    return (
      '$' +
      Number(v).toLocaleString(
        undefined,
        {
          minimumFractionDigits:
            Math.abs(+v) < 100 ? 2 : 0,
          maximumFractionDigits: 2
        }
      )
    );
  };

  const pct = v => {
    if (
      v == null ||
      !Number.isFinite(+v)
    ) {
      return '—';
    }

    return (
      (Number(v) * 100).toFixed(0) +
      '%'
    );
  };

  const esc = s =>
    String(s ?? '')
      .replace(
        /[&<>"']/g,
        m =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          })[m]
      );

  const compUrl = x => {
    const query = [
      x.year,
      x.set_name,
      x.player_name,
      x.card_number
        ? ('#' + x.card_number)
        : null,
      x.parallel
    ]
      .filter(Boolean)
      .join(' ');

    return (
      'https://www.ebay.com/sch/i.html?_nkw=' +
      encodeURIComponent(query) +
      '&LH_Sold=1&LH_Complete=1'
    );
  };

  function rows() {
    const filter =
      S.flipFilter;

    return (S.flips || [])
      .filter(x => {
        if (filter === 'buy') {
          return x.flip_tier === 'BUY NOW';
        }

        if (filter === 'offer') {
          return x.flip_tier === 'BEST OFFER';
        }

        if (filter === 'new') {
          return !!x.freshness_label;
        }

        if (filter === 'watch') {
          return x.flip_tier === 'WATCH';
        }

        return x.flip_tier !== 'PASS';
      })
      .sort(
        (a, b) =>
          (+b.flip_score || 0) -
          (+a.flip_score || 0)
      );
  }

  function card(x) {
    const score =
      Math.round(+x.flip_score || 0);

    const scoreClass =
      score >= 75
        ? ''
        : score >= 55
          ? 'mid'
          : 'low';

    const tierClass =
      x.flip_tier === 'RESEARCH' ||
      x.flip_tier === 'VERIFY IMAGE'
        ? 'research'
        : x.flip_tier === 'PASS'
          ? 'pass'
          : '';

    const profit =
      +x.expected_profit || 0;

    const freshness =
      x.freshness_label
        ? `${x.freshness_label} · `
        : '';

    const depth =
      `${x.robust_listing_count || 0} exact · ` +
      `${Math.round((+x.market_confidence || 0) * 100)}% market`;

    return `
      <div class="flipcard">

        <div class="fliptop">
          <span class="flipscore ${scoreClass}">
            FLIP ${score}
          </span>

          <span class="fliptier ${tierClass}">
            ${esc(x.flip_tier)}
          </span>
        </div>

        <div class="flipname">
          ${esc(x.display_name)}
        </div>

        <div class="flipmeta">
          ${
            [
              x.year,
              x.sport,
              x.parallel
            ]
              .filter(Boolean)
              .map(esc)
              .join(' · ')
          }
        </div>

        <div class="flipgrid">

          <div class="flipmetric">
            <small>eBay ask</small>
            <b>${cash(x.ask_price)}</b>
          </div>

          <div class="flipmetric">
            <small>Max buy</small>
            <b>${cash(x.max_buy_price)}</b>
          </div>

          <div class="flipmetric">
            <small>Fair exit</small>
            <b>${cash(x.fair_exit_price)}</b>
          </div>

          <div class="flipmetric">
            <small>Net profit</small>
            <b class="${profit >= 0 ? 'flipprofit' : 'flipneg'}">
              ${profit >= 0 ? '+' : ''}${cash(profit)}
            </b>
          </div>

          <div class="flipmetric">
            <small>Net ROI</small>
            <b class="${profit >= 0 ? 'flipprofit' : 'flipneg'}">
              ${pct(x.expected_roi)}
            </b>
          </div>

          <div class="flipmetric">
            <small>All-in buy</small>
            <b>${cash(x.all_in_buy_cost)}</b>
          </div>

        </div>

        <div class="flipbottom">

          <span>
            ${freshness}${depth}
          </span>

          <div class="flipactions">

            <button
              class="flipopen flipcomps"
              data-url="${esc(compUrl(x))}"
            >
              Recent Comps
            </button>

            ${
              x.item_url
                ? `
                  <button
                    class="flipopen"
                    data-url="${esc(x.item_url)}"
                  >
                    View eBay
                  </button>
                `
                : ''
            }

          </div>

        </div>

      </div>
    `;
  }

  function draw() {
    const el =
      document.getElementById(
        'flipcontent'
      );

    if (!el) {
      return;
    }

    const all =
      S.flips || [];

    const visible =
      rows();

    const buys =
      all.filter(
        x =>
          x.flip_tier === 'BUY NOW'
      ).length;

    const offers =
      all.filter(
        x =>
          x.flip_tier === 'BEST OFFER'
      ).length;

    const fresh =
      all.filter(
        x =>
          x.freshness_label
      ).length;

    const best =
      all.length
        ? Math.max(
            ...all.map(
              x => +x.flip_score || 0
            )
          )
        : 0;

    el.innerHTML = `
      <div class="fliphero">
        <div>
          <h1>Flips</h1>
          <p>
            Buy raw on eBay → resell raw.
            No grading assumptions.
          </p>
        </div>

        <button
          class="fliprefresh"
          id="fliprefresh"
        >
          Refresh
        </button>
      </div>

      <div class="flipstats">
        <div class="flipstat">
          <small>Buy now</small>
          <b>${buys}</b>
        </div>

        <div class="flipstat">
          <small>Best offer</small>
          <b>${offers}</b>
        </div>

        <div class="flipstat">
          <small>New listings</small>
          <b>${fresh}</b>
        </div>

        <div class="flipstat">
          <small>Best score</small>
          <b>${Math.round(best)}</b>
        </div>
      </div>

      <div class="flipfilters">
        ${
          [
            ['all', 'Best'],
            ['buy', 'Buy Now'],
            ['offer', 'Best Offer'],
            ['new', 'New'],
            ['watch', 'Watch']
          ]
            .map(
              ([k, t]) => `
                <button
                  class="flipfilter ${
                    S.flipFilter === k
                      ? 'active'
                      : ''
                  }"
                  data-f="${k}"
                >
                  ${t}
                </button>
              `
            )
            .join('')
        }
      </div>

      <div class="flipboard">
        ${
          visible.length
            ? visible
                .map(card)
                .join('')
            : `
              <div class="flipnotice">
                No listing currently clears
                this filter.

                Flip Score includes acquisition
                cost, selling fees, shipping,
                market depth, exact-match
                confidence and conservative exit
                pricing.
              </div>
            `
        }
      </div>
    `;

    document
      .getElementById('fliprefresh')
      .onclick =
        loadFlips;

    el
      .querySelectorAll('[data-f]')
      .forEach(
        b =>
          b.onclick =
            () => {
              S.flipFilter =
                b.dataset.f;

              draw();
            }
      );

    el
      .querySelectorAll('.flipopen')
      .forEach(
        b =>
          b.onclick =
            () =>
              window.open(
                b.dataset.url,
                '_blank',
                'noopener'
              )
      );
  }

  async function loadFlips() {
    try {
      S.flips =
        await api(
          '/rest/v1/golden_goose_flips_feed?select=*&order=flip_score.desc&limit=200'
        );

      draw();

    } catch (e) {
      const el =
        document.getElementById(
          'flipcontent'
        );

      if (el) {
        el.innerHTML = `
          <div class="empty">
            Could not load Flips right now.
          </div>
        `;
      }

      console.error(
        'Flips load failed',
        e
      );
    }
  }

  window.loadFlips =
    loadFlips;
})();