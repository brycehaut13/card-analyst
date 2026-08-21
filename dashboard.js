(() => {
  const style = document.createElement('style');

  style.textContent = `
  body.researchwide .app{
    max-width:1180px
  }

  body.researchwide .nav{
    width:min(1180px,100%)
  }

  .ggsummary{
    display:grid;
    grid-template-columns:repeat(4,minmax(0,1fr));
    gap:8px;
    margin:12px 0 16px
  }

  .ggsum{
    background:#0e1112;
    border:1px solid var(--l);
    border-radius:14px;
    padding:11px
  }

  .ggsum small{
    display:block;
    color:var(--m);
    font-size:9px;
    margin-bottom:5px;
    text-transform:uppercase;
    letter-spacing:.45px
  }

  .ggsum b{
    font-size:17px
  }

  .ggsection{
    margin-top:20px
  }

  .ggsectionhead{
    display:flex;
    justify-content:space-between;
    align-items:end;
    margin-bottom:9px
  }

  .ggsectionhead h3{
    margin:0;
    font-size:17px
  }

  .ggsectionhead span{
    font-size:10px;
    color:var(--m)
  }

  .ggboard{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:9px
  }

  .ggtile{
    position:relative;
    min-width:0;
    background:#101416;
    border:1px solid var(--l);
    border-radius:16px;
    padding:12px;
    color:#fff;
    cursor:pointer;
    text-align:left
  }

  .ggtile:hover{
    border-color:#34413b
  }

  .ggtiletop{
    display:flex;
    justify-content:space-between;
    gap:7px;
    align-items:flex-start
  }

  .ggscore{
    font-size:10px;
    font-weight:950;
    border-radius:999px;
    padding:5px 7px;
    background:#17271d;
    color:#a8efbf;
    border:1px solid #284633;
    white-space:nowrap
  }

  .ggscore.high{
    background:#212016;
    color:#f2d98a;
    border-color:#4a4327
  }

  .ggscore.watch{
    background:#171c1e;
    color:#c2cbc7;
    border-color:#30383b
  }

  .ggscore.research{
    background:#15171a;
    color:#8e9894;
    border-color:#282d2f
  }

  .ggstar{
    border:0;
    background:none;
    color:#f4d06f;
    font-size:20px;
    line-height:1;
    padding:1px;
    cursor:pointer
  }

  .ggname{
    font-size:12px;
    font-weight:850;
    line-height:1.3;
    margin-top:9px;
    min-height:31px
  }

  .ggsub{
    font-size:9px;
    color:var(--m);
    line-height:1.35;
    margin-top:4px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis
  }

  .ggmetrics{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:6px;
    margin-top:10px
  }

  .ggmetric{
    background:#0c0f10;
    border:1px solid #202628;
    border-radius:11px;
    padding:8px;
    min-width:0
  }

  .ggmetric small{
    display:block;
    color:#737d79;
    font-size:8px;
    margin-bottom:3px;
    text-transform:uppercase
  }

  .ggmetric b{
    font-size:12px;
    display:block;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis
  }

  .ggmarket{
    margin-top:8px;
    padding-top:8px;
    border-top:1px solid #202628;
    display:flex;
    justify-content:space-between;
    gap:6px;
    align-items:center
  }

  .ggmarketleft{
    min-width:0
  }

  .ggmarketleft b{
    font-size:10px;
    display:block
  }

  .ggmarketleft span{
    font-size:8px;
    color:var(--m);
    display:block;
    margin-top:2px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis
  }

  .marketbadge{
    flex:0 0 auto;
    font-size:8px;
    font-weight:900;
    border-radius:999px;
    padding:4px 6px;
    border:1px solid #314038;
    color:#a8efbf;
    background:#142019
  }

  .marketbadge.review{
    color:#f2cf7c;
    background:#211e13;
    border-color:#4a4022
  }

  .marketbadge.none{
    color:#929b97;
    background:#15181a;
    border-color:#2a3033
  }

  .ggemptycat{
    grid-column:1/-1;
    color:var(--m);
    font-size:11px;
    padding:11px 3px
  }

  .ebayevidence{
    margin-top:10px;
    background:#0e1112;
    border:1px solid var(--l);
    border-radius:16px;
    padding:13px
  }

  .ebaygrid{
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:8px;
    margin-top:10px
  }

  .ebaystat{
    background:#0b0e0f;
    border:1px solid #202628;
    border-radius:12px;
    padding:9px
  }

  .ebaystat small{
    display:block;
    color:var(--m);
    font-size:9px;
    margin-bottom:4px
  }

  .ebaystat b{
    font-size:14px
  }

  .qualityflag{
    display:inline-block;
    margin:6px 5px 0 0;
    padding:4px 6px;
    border-radius:999px;
    background:#211e13;
    border:1px solid #40391f;
    color:#e7ca79;
    font-size:8px
  }

  @media(min-width:700px){
    .ggboard{
      grid-template-columns:repeat(3,minmax(0,1fr))
    }

    .ggtile{
      padding:13px
    }
  }

  @media(min-width:980px){
    .ggboard{
      grid-template-columns:repeat(4,minmax(0,1fr))
    }
  }

  @media(max-width:440px){
    .ggsummary{
      grid-template-columns:repeat(2,1fr)
    }

    .ggtile{
      padding:10px
    }

    .ggname{
      font-size:11px
    }

    .ggmetric b{
      font-size:11px
    }
  }`;

  document.head.appendChild(style);

  S.ebayMarket = S.ebayMarket || [];

  const oldView = view;

  view = function(v) {
    document.body.classList.toggle(
      'researchwide',
      v === 'goose' || v === 'watchlist'
    );

    return oldView(v);
  };

  function ebayRow(id) {
    return (
      S.ebayMarket || []
    ).find(
      x => x.catalog_id === id
    ) || null;
  }

  function moneyOrDash(v) {
    return v == null
      ? '—'
      : M(v);
  }

  function scoreNum(c) {
    const z =
      S.gooseScores[c.id];

    return z
      ? Math.round(
          +z.edge_score || 0
        )
      : null;
  }

  function categoryFor(c) {
    const n =
      scoreNum(c);

    if (n == null) {
      return 'research';
    }

    if (n >= 70) {
      return 'top';
    }

    if (n >= 60) {
      return 'high';
    }

    if (n >= 50) {
      return 'watch';
    }

    return 'research';
  }

  function marketBadge(e) {
    if (!e) {
      return `
        <span class="marketbadge none">
          eBay building
        </span>
      `;
    }

    if (e.allowed_into_goose) {
      return `
        <span class="marketbadge">
          ${Math.round(
            (+e.market_confidence || 0) *
            100
          )}% market
        </span>
      `;
    }

    return `
      <span class="marketbadge review">
        ${Math.round(
          (+e.market_confidence || 0) *
          100
        )}% review
      </span>
    `;
  }

  function tile(c, watch = false) {
    const z =
      S.gooseScores[c.id];

    const n =
      scoreNum(c);

    const cat =
      categoryFor(c);

    const e =
      ebayRow(c.id);

    const scoreClass =
      cat === 'top'
        ? ''
        : cat === 'high'
          ? 'high'
          : cat === 'watch'
            ? 'watch'
            : 'research';

    const raw =
      c.raw_market_value == null
        ? '—'
        : M(c.raw_market_value);

    const psa10 =
      c.psa_10_market_value == null
        ? '—'
        : M(c.psa_10_market_value);

    const profit =
      z
        ? M(z.expected_profit)
        : '—';

    const roi =
      z
        ? `${(
            +z.expected_roi *
            100
          ).toFixed(0)}%`
        : '—';

    const ask =
      e?.robust_median_ask == null
        ? '—'
        : M(
            e.robust_median_ask
          );

    const listings =
      e?.robust_listing_count ==
      null
        ? '—'
        : `${
            e.robust_listing_count
          } listing${
            +e.robust_listing_count ===
            1
              ? ''
              : 's'
          }`;

    return `
      <div
        class="ggtile ${
          watch
            ? 'watchpick'
            : 'goosepick'
        }"
        data-id="${c.id}"
      >

        <div class="ggtiletop">

          <span
            class="ggscore ${scoreClass}"
          >
            ${
              n == null
                ? 'RESEARCH'
                : 'GOOSE ' + n
            }
          </span>

          <button
            class="ggstar"
            onclick="toggleFav(
              '${c.id}',
              event
            )"
          >
            ${
              isFav(c.id)
                ? '★'
                : '☆'
            }
          </button>

        </div>

        <div class="ggname">
          ${C(c.display_name)}
        </div>

        <div class="ggsub">
          ${
            [
              c.year,
              c.sport,
              c.set_name
            ]
              .filter(Boolean)
              .join(' · ')
          }
        </div>

        <div class="ggmetrics">

          <div class="ggmetric">
            <small>Raw</small>
            <b>${raw}</b>
          </div>

          <div class="ggmetric">
            <small>PSA 10</small>
            <b>${psa10}</b>
          </div>

          <div class="ggmetric">
            <small>Exp. profit</small>
            <b>${profit}</b>
          </div>

          <div class="ggmetric">
            <small>Exp. ROI</small>
            <b>${roi}</b>
          </div>

        </div>

        <div class="ggmarket">

          <div class="ggmarketleft">

            <b>
              eBay ${ask}
            </b>

            <span>
              ${listings}
              · robust ask
            </span>

          </div>

          ${marketBadge(e)}

        </div>

      </div>
    `;
  }

  function summary(rows) {
    const scored =
      rows
        .map(
          c => scoreNum(c)
        )
        .filter(
          n => n != null
        );

    const top =
      scored.filter(
        n => n >= 70
      ).length;

    const high =
      scored.filter(
        n =>
          n >= 60 &&
          n < 70
      ).length;

    const usable =
      rows.filter(
        c =>
          ebayRow(c.id)
            ?.allowed_into_goose
      ).length;

    const avgConfRows =
      rows
        .map(
          c => ebayRow(c.id)
        )
        .filter(Boolean);

    const avgConf =
      avgConfRows.length
        ? Math.round(
            (
              avgConfRows.reduce(
                (a, x) =>
                  a +
                  (
                    +x.market_confidence ||
                    0
                  ),
                0
              ) /
              avgConfRows.length
            ) *
            100
          )
        : null;

    return `
      <div class="ggsummary">

        <div class="ggsum">
          <small>Top Geese</small>
          <b>${top}</b>
        </div>

        <div class="ggsum">
          <small>
            High conviction
          </small>
          <b>${high}</b>
        </div>

        <div class="ggsum">
          <small>eBay usable</small>
          <b>${usable}</b>
        </div>

        <div class="ggsum">
          <small>
            Market confidence
          </small>

          <b>
            ${
              avgConf == null
                ? '—'
                : avgConf + '%'
            }
          </b>
        </div>

      </div>
    `;
  }

  function board(
    rows,
    watch = false
  ) {
    const cats = [
      [
        'top',
        'Top Geese',
        '70+ · strongest current opportunities'
      ],
      [
        'high',
        'High Conviction',
        '60–69 · strong model edge'
      ],
      [
        'watch',
        'Watch',
        '50–59 · promising, needs more edge'
      ],
      [
        'research',
        'Researching',
        'Building price, population or liquidity evidence'
      ]
    ];

    return (
      summary(rows) +

      cats
        .map(
          ([
            key,
            title,
            copy
          ]) => {

            const a =
              rows
                .filter(
                  c =>
                    categoryFor(c) ===
                    key
                )
                .sort(
                  (x, y) =>
                    (
                      scoreNum(y) ??
                      -1
                    ) -
                    (
                      scoreNum(x) ??
                      -1
                    )
                );

            return `
              <div class="ggsection">

                <div
                  class="ggsectionhead"
                >

                  <div>
                    <h3>
                      ${title}
                    </h3>

                    <span>
                      ${copy}
                    </span>
                  </div>

                  <span>
                    ${a.length}
                    card${
                      a.length === 1
                        ? ''
                        : 's'
                    }
                  </span>

                </div>

                <div class="ggboard">

                  ${
                    a.length
                      ? a
                          .map(
                            c =>
                              tile(
                                c,
                                watch
                              )
                          )
                          .join('')
                      : `
                        <div
                          class="ggemptycat"
                        >
                          Nothing in this
                          category right
                          now.
                        </div>
                      `
                  }

                </div>

              </div>
            `;
          }
        )
        .join('')
    );
  }

  drawGoose =
  function() {
    const rows =
      gooseFiltered();

    $('ggr').innerHTML =
      rows.length
        ? board(
            rows,
            false
          )
        : `
          <div class="empty">
            No Goose-ready cards
            match these filters.
          </div>
        `;

    document
      .querySelectorAll(
        '.goosepick'
      )
      .forEach(
        x => {
          x.onclick =
          e => {

            if (
              !e.target.closest(
                '.ggstar'
              )
            ) {
              thesis(
                x.dataset.id
              );
            }

          };
        }
      );
  };

  drawWatchlist =
  function() {

    const rows =
      S.watch
        .map(
          w =>
            S.gg.find(
              c =>
                c.id ===
                w.catalog_id
            )
        )
        .filter(Boolean);

    $('watchr').innerHTML =
      rows.length
        ? board(
            rows,
            true
          )
        : `
          <div class="empty">
            Favorite a card in
            Goose to build your
            watchlist.
          </div>
        `;

    document
      .querySelectorAll(
        '.watchpick'
      )
      .forEach(
        x => {
          x.onclick =
          e => {

            if (
              !e.target.closest(
                '.ggstar'
              )
            ) {
              thesis(
                x.dataset.id
              );
            }

          };
        }
      );
  };

  const oldLoadGoose =
    loadGoose;

  loadGoose =
  async function() {

    await oldLoadGoose();

    try {

      S.ebayMarket =
        await api(
          '/rest/v1/ebay_market_model_input' +
          '?select=' +
          'catalog_id,' +
          'observed_at,' +
          'robust_median_ask,' +
          'p25_ask,' +
          'p75_ask,' +
          'robust_listing_count,' +
          'market_confidence,' +
          'quality_status,' +
          'quality_flags,' +
          'model_ask,' +
          'allowed_into_goose'
        );

    } catch (e) {

      console.warn(
        'eBay market dashboard data unavailable',
        e
      );

      S.ebayMarket = [];

    }

    drawGoose();
    drawWatchlist();
  };

  const oldThesis =
    thesis;

  thesis =
  async function(id) {

    await oldThesis(id);

    const e =
      ebayRow(id);

    const box =
      document.createElement(
        'div'
      );

    if (!e) {

      box.className =
        'ebayevidence';

      box.innerHTML = `
        <b>
          eBay Market Evidence
        </b>

        <div
          class="muted"
          style="
            font-size:11px;
            margin-top:6px;
            line-height:1.4
          "
        >
          Exact-match active
          market enrichment is
          still building for
          this card.
        </div>
      `;

    } else {

      const flags =
        Array.isArray(
          e.quality_flags
        )
          ? e.quality_flags
          : [];

      box.className =
        'ebayevidence';

      box.innerHTML = `

        <div
          style="
            display:flex;
            justify-content:
              space-between;
            gap:10px;
            align-items:center
          "
        >

          <b>
            eBay Market Evidence
          </b>

          ${marketBadge(e)}

        </div>

        <div class="ebaygrid">

          <div class="ebaystat">
            <small>
              Robust median ask
            </small>
            <b>
              ${
                moneyOrDash(
                  e.robust_median_ask
                )
              }
            </b>
          </div>

          <div class="ebaystat">
            <small>
              Exact listings
            </small>
            <b>
              ${
                e.robust_listing_count ??
                '—'
              }
            </b>
          </div>

          <div class="ebaystat">
            <small>
              25th percentile
            </small>
            <b>
              ${
                moneyOrDash(
                  e.p25_ask
                )
              }
            </b>
          </div>

          <div class="ebaystat">
            <small>
              75th percentile
            </small>
            <b>
              ${
                moneyOrDash(
                  e.p75_ask
                )
              }
            </b>
          </div>

        </div>

        <div
          class="muted"
          style="
            font-size:10px;
            margin-top:9px;
            line-height:1.4
          "
        >
          ${
            e.allowed_into_goose
              ? `
                This active-market
                signal passed the
                confidence gate and
                is allowed into
                Goose.
              `
              : `
                This market is
                visible for research
                but is not strong
                enough to influence
                Goose yet.
              `
          }
        </div>

        ${
          flags
            .map(
              f => `
                <span
                  class="qualityflag"
                >
                  ${
                    String(f)
                      .replace(
                        /_/g,
                        ' '
                      )
                  }
                </span>
              `
            )
            .join('')
        }
      `;
    }

    $('sheet').appendChild(
      box
    );
  };

  if (
    S.gg &&
    S.gg.length
  ) {

    api(
      '/rest/v1/ebay_market_model_input' +
      '?select=' +
      'catalog_id,' +
      'observed_at,' +
      'robust_median_ask,' +
      'p25_ask,' +
      'p75_ask,' +
      'robust_listing_count,' +
      'market_confidence,' +
      'quality_status,' +
      'quality_flags,' +
      'model_ask,' +
      'allowed_into_goose'
    )
      .then(
        x => {

          S.ebayMarket =
            x || [];

          drawGoose();
          drawWatchlist();

        }
      )
      .catch(
        () => {}
      );
  }

})();
/* ===== Showroom visual polish SAFE ===== */
(() => {
  const style = document.createElement('style');

  style.textContent = `
    #portfolio .coverage,
    #portfolio #chartmeta,
    #portfolio #trophycount{
      display:none!important;
    }

    #portfolio .trophytitle{
      margin-top:18px!important;
      margin-bottom:12px!important;
    }

    #portfolio .trophytitle h2{
      font-size:24px!important;
      letter-spacing:-.5px!important;
      margin:0!important;
    }

    #portfolio .trophyrail{
      gap:10px!important;
    }

    #portfolio .trophycard{
      flex:0 0 76%!important;
      max-width:250px!important;
      overflow:hidden!important;
    }

    #portfolio .cardframe{
      width:100%!important;
      height:320px!important;
      border-radius:18px!important;
      overflow:hidden!important;
      background:#090c0e!important;
    }

    #portfolio .cardframe img{
      width:100%!important;
      height:100%!important;
      object-fit:cover!important;
      object-position:center!important;
      display:block!important;
    }

    #portfolio .trophyname{
      font-size:14px!important;
      font-weight:900!important;
      margin-top:9px!important;
    }

    #portfolio .trophymeta{
      font-size:9px!important;
    }

    #portfolio .trophyprice{
      font-size:19px!important;
      font-weight:950!important;
    }

    #portfolio .chartcard{
      margin-top:10px!important;
      padding:11px!important;
    }

    @media(max-width:390px){
      #portfolio .cardframe{
        height:285px!important;
      }
    }
  `;

  document.head.appendChild(style);

  function polishShowroom() {
    const heading =
      document.querySelector(
        '#portfolio .trophytitle h2'
      );

    if (
      heading &&
      heading.textContent !== 'Showroom'
    ) {
      heading.textContent = 'Showroom';
    }
  }

  polishShowroom();

  setTimeout(polishShowroom, 500);
  setTimeout(polishShowroom, 1500);
})();
