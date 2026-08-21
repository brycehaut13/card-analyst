(() => {
  'use strict';

  if (typeof S === 'undefined' || typeof api !== 'function' || typeof view !== 'function') {
    console.error('[Card Analyst] Missing S/api/view globals.');
    return;
  }

  const BUILD = 'FLIP4-20260821';
  const AUTO_REFRESH_MS = 4 * 60 * 1000;
  const PILOT_BANKROLL = 250;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[m]);

  const num = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const cash = v => {
    const n = num(v);
    return n == null ? '—' : '$' + n.toLocaleString(undefined, {
      minimumFractionDigits: Math.abs(n) < 100 ? 2 : 0,
      maximumFractionDigits: 2
    });
  };

  const pct = v => {
    const n = num(v);
    return n == null ? '—' : (n * 100).toFixed(0) + '%';
  };

  const conf = v => {
    const n = num(v);
    return n == null ? '—' : Math.round(n * 100) + '%';
  };

  const listingKey = r => String(r?.source_item_id || r?.listing_id || r?.item_id || r?.id || '');

  const css = document.createElement('style');
  css.textContent = `
    body.flipswide .app{max-width:1180px}
    body.flipswide .nav{width:min(1180px,100%)}
    .cahead{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin:2px 0 8px}
    .cahead h1{margin:0;font-size:27px;letter-spacing:-.7px}
    .cahead p{margin:4px 0 0;color:var(--m);font-size:11px}
    .caheadbtns{display:flex;gap:7px}
    .cabtn{border:1px solid var(--l);background:#14181b;color:#eef7f1;border-radius:11px;padding:9px 11px;font-weight:900;font-size:10px}
    .cabtn.primary{background:#e9f7ee;color:#07120a;border-color:#e9f7ee}
    .cabtn:disabled{opacity:.45}
    .castatus{display:flex;justify-content:space-between;gap:8px;color:var(--m);font-size:9px;margin:0 0 10px}
    .casubtabs,.cafilters{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;margin:9px 0 12px}
    .casubtabs::-webkit-scrollbar,.cafilters::-webkit-scrollbar{display:none}
    .catab,.cafilter{flex:0 0 auto;border:1px solid var(--l);background:#0e1215;color:#86928e;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:900}
    .catab.active,.cafilter.active{background:#e9f7ee;color:#07120a;border-color:#e9f7ee}
    .castats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0 13px}
    .castat{background:#101416;border:1px solid var(--l);border-radius:13px;padding:10px}
    .castat small{display:block;color:var(--m);font-size:8px;text-transform:uppercase;margin-bottom:5px}
    .castat b{font-size:15px}
    .cagrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .cacard{background:#0f1418;border:1px solid #263036;border-radius:16px;padding:11px;min-width:0}
    .catop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .cachip{border-radius:999px;padding:5px 7px;font-weight:950;font-size:9px;white-space:nowrap}
    .cachip.buy{background:#17271d;color:#a8efbf;border:1px solid #2c4a39}
    .cachip.research{background:#211e13;color:#efd27d;border:1px solid #4a4022}
    .cachip.pass{background:#171c1e;color:#9ca6a1;border:1px solid #2f373b}
    .cachip.rare{background:#251d11;color:#ffd28c;border:1px solid #534021}
    .cabody{display:grid;grid-template-columns:82px 1fr;gap:10px;margin-top:9px}
    .caimg{width:82px;height:110px;border-radius:10px;object-fit:cover;background:#0a0d0f;border:1px solid #222b30}
    .caimgph{display:flex;align-items:center;justify-content:center;color:#67716d;font-size:9px}
    .caname{font-size:12px;font-weight:900;line-height:1.28}
    .cameta{font-size:8px;color:var(--m);margin-top:4px;line-height:1.35}
    .caprices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:9px}
    .caprice{background:#0b0f12;border:1px solid #1f2a30;border-radius:10px;padding:7px}
    .caprice small{display:block;color:#73807d;font-size:7px;text-transform:uppercase;margin-bottom:3px}
    .caprice b{font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .capos{color:#9cf0b8}.caneg{color:#ff9ca5}
    .careason{margin-top:8px;padding:8px;border:1px solid #243038;border-radius:10px;background:#10161a;color:#dce6e1;font-size:9px;line-height:1.4}
    .careason b{display:block;color:#9ed8ff;font-size:8px;text-transform:uppercase;margin-bottom:3px}
    .cararity{margin-top:8px;padding:8px;border:1px solid #40341f;border-radius:10px;background:#18140e;color:#f4dcac;font-size:9px;line-height:1.4}
    .cacomps{margin-top:8px;border:1px solid #242d31;border-radius:10px;overflow:hidden}
    .cacomps summary{cursor:pointer;list-style:none;padding:8px 9px;font-size:9px;font-weight:900;background:#101416}
    .cacomps summary::-webkit-scrollbar{display:none}
    .compwrap{border-top:1px solid #242d31;padding:0 9px}
    .comprow{display:grid;grid-template-columns:1fr auto;gap:8px;padding:8px 0;border-bottom:1px solid #20282c}
    .comprow:last-child{border-bottom:0}
    .comprow b{font-size:10px}.comprow span{font-size:8px;color:var(--m);display:block;margin-top:2px}
    .caactions{display:flex;gap:6px;margin-top:9px}
    .caact{flex:1;border:1px solid #2e3b42;background:#13191d;color:#ecf5f0;border-radius:9px;padding:8px 7px;font-weight:900;font-size:9px}
    .caact.primary{background:#e9f7ee;color:#07120a;border-color:#e9f7ee}
    .caact:disabled{opacity:.4}
    .caempty{grid-column:1/-1;background:#0f1418;border:1px solid var(--l);border-radius:15px;padding:18px;color:var(--m);font-size:11px;line-height:1.5}
    .mitype{font-size:9px;color:#ffd28c;font-weight:900;margin-top:5px}
    @media(min-width:820px){.cagrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:640px){
      .castats{grid-template-columns:repeat(2,1fr)}
      .cagrid{grid-template-columns:1fr}
      .cabody{grid-template-columns:92px 1fr}
      .caimg{width:92px;height:124px}
      .cahead{align-items:flex-start}
      .caheadbtns{flex-direction:column}
    }
  `;
  document.head.appendChild(css);

  S.tradingDesk = S.tradingDesk || {};
  Object.assign(S.tradingDesk, {
    feed: S.tradingDesk.feed || [],
    rarity: S.tradingDesk.rarity || [],
    comps: S.tradingDesk.comps || [],
    misidentified: S.tradingDesk.misidentified || [],
    misidentifiedReview: S.tradingDesk.misidentifiedReview || [],
    filter: S.tradingDesk.filter || 'opportunities',
    subview: S.tradingDesk.subview || 'desk',
    misidFilter: S.tradingDesk.misidFilter || 'actionable',
    lastRefreshAt: S.tradingDesk.lastRefreshAt || null,
    loading: false,
    pushEnabled: false
  });

  const app = document.querySelector('.app');
  const nav = document.querySelector('.nav');
  if (!app || !nav) return;

  let page = document.getElementById('flips');
  if (!page) {
    page = document.createElement('section');
    page.id = 'flips';
    page.className = 'hidden';
    page.innerHTML = '<div id="flipcontent"></div>';
    app.appendChild(page);
  }

  if (!document.getElementById('flipnav')) {
    const b = document.createElement('button');
    b.id = 'flipnav';
    b.innerHTML = '<span class="navico">↗</span>Flips';
    b.onclick = () => view('flips');
    nav.appendChild(b);
    nav.style.gridTemplateColumns = 'repeat(5,1fr)';
  }

  const oldView = view;

  view = function(v) {
    document.body.classList.toggle('flipswide', v === 'flips');

    const out = oldView(v);

    page.classList.toggle('hidden', v !== 'flips');

    const n = document.getElementById('flipnav');

    if (n) {
      n.classList.toggle('active', v === 'flips');
    }

    if (v === 'flips') {
      loadFlips(false);
    }

    return out;
  };

  function currentUserId() {
    try {
      const p = JSON.parse(
        atob(
          (T().split('.')[1] || '')
            .replace(/-/g,'+')
            .replace(/_/g,'/')
        )
      );

      return p.sub || '';
    } catch {
      return '';
    }
  }

  function base64UrlToUint8Array(base64String) {
    const padding =
      '='.repeat(
        (4 - base64String.length % 4) % 4
      );

    const base64 =
      (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const raw =
      atob(base64);

    return Uint8Array.from(
      [...raw].map(
        c => c.charCodeAt(0)
      )
    );
  }

  async function refreshPushState() {
    try {
      if (
        !('serviceWorker' in navigator) ||
        !('PushManager' in window)
      ) {
        S.tradingDesk.pushEnabled = false;
        return;
      }

      const reg =
        await navigator.serviceWorker
          .getRegistration('/');

      const sub =
        reg
          ? await reg.pushManager
              .getSubscription()
          : null;

      S.tradingDesk.pushEnabled =
        !!sub &&
        Notification.permission === 'granted';

    } catch {
      S.tradingDesk.pushEnabled = false;
    }
  }

  async function enablePush() {
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      alert(
        'Push notifications are not supported in this browser. On iPhone, add Card Analyst to your Home Screen first.'
      );

      return;
    }

    const permission =
      await Notification
        .requestPermission();

    if (permission !== 'granted') {
      alert(
        'Notifications were not enabled.'
      );

      return;
    }

    const reg =
      await navigator.serviceWorker
        .register(
          '/sw.js',
          { scope: '/' }
        );

    await navigator.serviceWorker.ready;
    const publicKey =
      await api(
        '/rest/v1/rpc/site_push_public_key_v1',
        {
          method:'POST',
          body:JSON.stringify({})
        }
      );

    let sub =
      await reg.pushManager
        .getSubscription();

    if (!sub) {
      sub =
        await reg.pushManager
          .subscribe({
            userVisibleOnly:true,
            applicationServerKey:
              base64UrlToUint8Array(
                String(publicKey)
              )
          });
    }

    const json =
      sub.toJSON();

    const userId =
      currentUserId();

    if (!userId) {
      throw new Error(
        'Could not resolve signed-in user.'
      );
    }

    await api(
      '/rest/v1/site_push_subscriptions?on_conflict=endpoint',
      {
        method:'POST',

        headers:{
          Prefer:
            'resolution=merge-duplicates,return=minimal'
        },

        body:JSON.stringify({
          user_id:userId,
          endpoint:sub.endpoint,
          p256dh:
            json.keys?.p256dh,
          auth_key:
            json.keys?.auth,
          user_agent:
            navigator.userAgent,
          enabled:true,
          updated_at:
            new Date().toISOString()
        })
      }
    );

    S.tradingDesk.pushEnabled =
      true;

    draw();

    alert(
      'Card Analyst alerts are enabled on this device.'
    );
  }

  function rarityMap() {
    const out = {};

    (
      S.tradingDesk.rarity ||
      []
    ).forEach(r => {
      if (r.catalog_id) {
        out[
          String(
            r.catalog_id
          )
        ] = r;
      }
    });

    return out;
  }

  function compsMap() {
    const out = {};

    (
      S.tradingDesk.comps ||
      []
    ).forEach(c => {

      const id =
        String(
          c.catalog_id ||
          ''
        );

      if (!id) {
        return;
      }

      (
        out[id] =
          out[id] || []
      ).push(c);
    });

    return out;
  }

  function tierClass(tier) {
    const t =
      String(
        tier || ''
      ).toUpperCase();

    if (
      t.includes('BUY') ||
      t.includes('OFFER')
    ) {
      return 'buy';
    }

    if (
      t.includes('PASS')
    ) {
      return 'pass';
    }

    return 'research';
  }

  function shortReason(x) {
    const tier =
      String(
        x.flip_tier ||
        ''
      ).toUpperCase();

    const exact =
      num(
        x.exact_match_confidence
      ) || 0;

    const comps =
      num(
        x.recent_raw_sales_count
      ) || 0;

    const profit =
      num(
        x.expected_profit
      ) || 0;

    const roi =
      num(
        x.expected_roi
      ) || 0;

    if (
      tier.includes('BUY') ||
      tier.includes('OFFER')
    ) {
      return (
        `Exact identity ${conf(exact)} · ` +
        `${comps} recent exact sales · ` +
        `${cash(profit)} expected profit · ` +
        `${pct(roi)} ROI.`
      );
    }

    if (comps < 3) {
      return (
        `Needs more exact sold evidence. ` +
        `Only ${comps} recent exact comp` +
        `${comps === 1 ? '' : 's'} ` +
        `currently available.`
      );
    }

    if (profit <= 0) {
      return (
        'Not profitable at the current listing price after fees and shipping.'
      );
    }

    if (roi < .20) {
      return (
        'Expected ROI is below the execution threshold at the current ask.'
      );
    }

    return (
      'Not execution-ready under current identity, liquidity, or market-confidence gates.'
    );
  }

  function rarityHtml(x) {
    const r =
      rarityMap()[
        String(
          x.catalog_id ||
          ''
        )
      ];

    if (
      !r ||
      !r.is_rarity_card
    ) {
      return '';
    }

    const exact =
      num(
        r.median_90d
      );

    const benchmark =
      num(
        r.benchmark_median_90d
      );

    const multiple =
      num(
        r.rarity_value_multiple
      );

    return `
      <div class="cararity">

        <b>
          RARITY CHECK
        </b>

        <br>

        ${
          esc(
            r.parallel ||
            'Rare parallel'
          )
        }

        ${
          r.sales_90d
            ? ` · ${r.sales_90d} exact sales/90d`
            : ''
        }

        ${
          exact != null
            ? ` · exact median ${cash(exact)}`
            : ''
        }

        ${
          benchmark != null
            ? `
              <br>
              Liquid sibling
              ${
                esc(
                  r.benchmark_parallel ||
                  ''
                )
              }:
              ${cash(benchmark)}
            `
            : ''
        }

        ${
          multiple != null
            ? ` · ${multiple.toFixed(2)}× premium`
            : ''
        }

      </div>
    `;
  }

  function compsHtml(
    catalogId
  ) {
    const rows =
      (
        compsMap()[
          String(
            catalogId
          )
        ] || []
      )
        .slice(0,5);

    if (!rows.length) {
      return `
        <details class="cacomps">
          <summary>
            Recent exact comps · none verified yet
          </summary>
        </details>
      `;
    }

    return `
      <details class="cacomps">

        <summary>
          Recent exact comps ·
          ${rows.length}
          shown
        </summary>

        <div class="compwrap">

          ${
            rows
              .map(c => `
                <div class="comprow">

                  <div>
                    <b>
                      ${cash(
                        c.total_price
                      )}
                    </b>

                    <span>
                      ${
                        new Date(
                          c.sale_date
                        ).toLocaleDateString()
                      }
                      ·
                      ${
                        esc(
                          String(
                            c.provider_name ||
                            'verified'
                          )
                            .replace(
                              /_/g,
                              ' '
                            )
                        )
                      }
                      ·
                      ${
                        conf(
                          c.confidence_score
                        )
                      }
                    </span>
                  </div>

                  <div>
                    <b>
                      ${cash(
                        c.sale_price
                      )}
                    </b>

                    <span>
                      ${
                        num(
                          c.shipping_price
                        )
                          ? `+ ${cash(c.shipping_price)} ship`
                          : 'shipping included/unknown'
                      }
                    </span>
                  </div>

                </div>
              `)
              .join('')
          }

        </div>

      </details>
    `;
  }

  function visibleFeed() {
    const f =
      S.tradingDesk.filter;

    return (
      S.tradingDesk.feed ||
      []
    ).filter(x => {

      const tier =
        String(
          x.flip_tier ||
          ''
        ).toUpperCase();

      if (
        f === 'opportunities'
      ) {
        return (
          /BUY|BEST OFFER/.test(
            tier
          )
        );
      }

      if (
        f === 'research'
      ) {
        return (
          /RESEARCH|VERIFY/.test(
            tier
          )
        );
      }

      if (
        f === 'pass'
      ) {
        return (
          /PASS/.test(
            tier
          )
        );
      }

      if (
        f === 'rare'
      ) {
        return (
          !!rarityMap()[
            String(
              x.catalog_id ||
              ''
            )
          ]?.is_rarity_card
        );
      }

      return true;
    });
  }

  function flipCard(x) {
    const profit =
      num(
        x.expected_profit
      ) || 0;

    const roi =
      num(
        x.expected_roi
      ) || 0;

    const meta = [
      x.year,
      x.player_name,
      x.set_name,
      x.card_number
        ? '#' +
          x.card_number
        : null,
      x.parallel
    ]
      .filter(Boolean)
      .join(' · ');

    return `
      <div class="cacard">

        <div class="catop">

          <span class="cachip ${tierClass(x.flip_tier)}">
            ${
              esc(
                x.flip_tier ||
                'RESEARCH'
              )
            }
          </span>

          ${
            rarityMap()[
              String(
                x.catalog_id ||
                ''
              )
            ]?.is_rarity_card
              ? `
                <span class="cachip rare">
                  RARE / #
                </span>
              `
              : ''
          }

        </div>

        <div class="cabody">

          ${
            x.image_url
              ? `
                <img
                  class="caimg"
                  src="${esc(x.image_url)}"
                  loading="lazy"
                  alt="card"
                >
              `
              : `
                <div class="caimg caimgph">
                  No image
                </div>
              `
          }

          <div>

            <div class="caname">
              ${
                esc(
                  x.display_name ||
                  x.listing_title ||
                  'Card'
                )
              }
            </div>

            <div class="cameta">
              ${esc(meta)}
            </div>

            <div class="caprices">

              <div class="caprice">
                <small>BUY</small>
                <b>
                  ${cash(
                    x.ask_price
                  )}
                </b>
              </div>

              <div class="caprice">
                <small>FAIR EXIT</small>
                <b>
                  ${cash(
                    x.fair_exit_price
                  )}
                </b>
              </div>

              <div class="caprice">
                <small>MAX BUY</small>
                <b>
                  ${cash(
                    x.max_buy_price
                  )}
                </b>
              </div>

              <div class="caprice">
                <small>PROFIT</small>
                <b class="${profit >= 0 ? 'capos' : 'caneg'}">
                  ${
                    profit >= 0
                      ? '+'
                      : ''
                  }
                  ${cash(profit)}
                </b>
              </div>

              <div class="caprice">
                <small>ROI</small>
                <b class="${roi >= 0 ? 'capos' : 'caneg'}">
                  ${pct(roi)}
                </b>
              </div>

              <div class="caprice">
                <small>EXACT SALES</small>
                <b>
                  ${
                    x.recent_raw_sales_count ??
                    '—'
                  }
                </b>
              </div>

            </div>

          </div>
        </div>

        <div class="careason">
          <b>WHY</b>
          ${
            esc(
              shortReason(x)
            )
          }
        </div>

        ${
          rarityHtml(x)
        }

        ${
          compsHtml(
            x.catalog_id
          )
        }

        <div class="caactions">

          <button
            class="caact primary"
            data-open="${esc(x.item_url || '')}"
            ${x.item_url ? '' : 'disabled'}
          >
            OPEN EBAY
          </button>

        </div>

      </div>
    `;
  }

  function misidRows() {
    return (
      S.tradingDesk
        .misidFilter ===
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

  function misidCard(x) {
    const profit =
      num(
        x.estimated_profit_if_confirmed
      ) || 0;

    const roi =
      num(
        x.estimated_roi_if_confirmed
      ) || 0;

    const type =
      String(
        x.opportunity_type ||
        'IMAGE CONFIRM'
      )
        .replace(
          /_/g,
          ' '
        );

    return `
      <div class="cacard">

        <div class="catop">

          <span class="cachip buy">
            ${
              esc(
                x.action ||
                'CHECK IMAGE'
              )
            }
          </span>

          <span class="cachip rare">
            ${esc(type)}
          </span>

        </div>

        <div class="cabody">

          ${
            x.image_url
              ? `
                <img
                  class="caimg"
                  src="${esc(x.image_url)}"
                  loading="lazy"
                  alt="listing"
                >
              `
              : `
                <div class="caimg caimgph">
                  No image
                </div>
              `
          }

          <div>

            <div class="caname">
              ${
                esc(
                  x.target_identity ||
                  x.title ||
                  'Listing'
                )
              }
            </div>

            <div class="cameta">
              ${
                esc(
                  x.title ||
                  ''
                )
              }
            </div>

            <div class="caprices">

              <div class="caprice">
                <small>ASK</small>
                <b>
                  ${cash(
                    x.total_ask
                  )}
                </b>
              </div>

              <div class="caprice">
                <small>TARGET</small>
                <b>
                  ${cash(
                    x.reference_value
                  )}
                </b>
              </div>

              <div class="caprice">
                <small>MAX BUY</small>
                <b>
                  ${cash(
                    x.max_buy_if_confirmed
                  )}
                </b>
              </div>

              <div class="caprice">
                <small>PROFIT</small>
                <b class="${profit >= 0 ? 'capos' : 'caneg'}">
                  ${
                    profit >= 0
                      ? '+'
                      : ''
                  }
                  ${cash(profit)}
                </b>
              </div>

              <div class="caprice">
                <small>ROI</small>
                <b class="${roi >= 0 ? 'capos' : 'caneg'}">
                  ${pct(roi)}
                </b>
              </div>

              <div class="caprice">
                <small>EXACT SALES</small>
                <b>
                  ${
                    x.sales_90d ??
                    '—'
                  }
                </b>
              </div>

            </div>

          </div>
        </div>

        <div class="careason">
          <b>ACTION</b>

          Confirm the premium trait from the
          listing images before buying.
          Do not rely on the title alone.
        </div>

        <div class="caactions">

          <button
            class="caact primary"
            data-open="${esc(x.item_url || '')}"
            ${x.item_url ? '' : 'disabled'}
          >
            CHECK EBAY
          </button>

        </div>

      </div>
    `;
  }
  function drawDesk(root) {
    const rows =
      visibleFeed();

    const actionable =
      (
        S.tradingDesk.feed ||
        []
      ).filter(
        x =>
          /BUY|BEST OFFER/i.test(
            String(
              x.flip_tier ||
              ''
            )
          )
      ).length;

    const research =
      (
        S.tradingDesk.feed ||
        []
      ).filter(
        x =>
          /RESEARCH|VERIFY/i.test(
            String(
              x.flip_tier ||
              ''
            )
          )
      ).length;

    const rare =
      (
        S.tradingDesk.feed ||
        []
      ).filter(
        x =>
          rarityMap()[
            String(
              x.catalog_id ||
              ''
            )
          ]?.is_rarity_card
      ).length;

    root.innerHTML = `

      <div class="castats">

        <div class="castat">
          <small>Actionable</small>
          <b>${actionable}</b>
        </div>

        <div class="castat">
          <small>Research</small>
          <b>${research}</b>
        </div>

        <div class="castat">
          <small>Rare / #</small>
          <b>${rare}</b>
        </div>

        <div class="castat">
          <small>Bankroll</small>
          <b>${cash(PILOT_BANKROLL)}</b>
        </div>

      </div>

      <div class="cafilters">

        ${
          [
            ['opportunities','Opportunities'],
            ['rare','Rare / #'],
            ['research','Research'],
            ['pass','Pass'],
            ['all','All']
          ]
            .map(
              ([k,t]) => `
                <button
                  class="cafilter ${
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

      <div class="cagrid">

        ${
          rows.length
            ? rows
                .map(
                  flipCard
                )
                .join('')
            : `
              <div class="caempty">
                No cards match this view right now.
                That is better than filling the screen
                with weak signals.
              </div>
            `
        }

      </div>
    `;
  }

  function drawMisidentified(root) {
    const actionable =
      S.tradingDesk
        .misidentified ||
      [];

    const review =
      S.tradingDesk
        .misidentifiedReview ||
      [];

    const rows =
      misidRows();

    root.innerHTML = `

      <div class="castats">

        <div class="castat">
          <small>Actionable</small>
          <b>${actionable.length}</b>
        </div>

        <div class="castat">
          <small>Review</small>
          <b>${review.length}</b>
        </div>

        <div class="castat">
          <small>Image check</small>
          <b>Required</b>
        </div>

        <div class="castat">
          <small>Push alerts</small>
          <b>
            ${
              S.tradingDesk
                .pushEnabled
                ? 'ON'
                : 'OFF'
            }
          </b>
        </div>

      </div>

      <div class="cafilters">

        <button
          class="cafilter ${
            S.tradingDesk
              .misidFilter ===
            'actionable'
              ? 'active'
              : ''
          }"
          data-misfilter="actionable"
        >
          Actionable
        </button>

        <button
          class="cafilter ${
            S.tradingDesk
              .misidFilter ===
            'review'
              ? 'active'
              : ''
          }"
          data-misfilter="review"
        >
          Review Queue
        </button>

      </div>

      <div class="cagrid">

        ${
          rows.length
            ? rows
                .map(
                  misidCard
                )
                .join('')
            : `
              <div class="caempty">
                No strict misidentified
                opportunities right now.
              </div>
            `
        }

      </div>
    `;
  }

  function draw() {
    const root =
      document
        .getElementById(
          'flipcontent'
        );

    if (!root) {
      return;
    }

    const when =
      S.tradingDesk
        .lastRefreshAt
        ? new Date(
            S.tradingDesk
              .lastRefreshAt
          ).toLocaleTimeString(
            [],
            {
              hour:'numeric',
              minute:'2-digit'
            }
          )
        : '—';

    root.innerHTML = `

      <div class="cahead">

        <div>

          <h1>
            Trading Desk
          </h1>

          <p>
            Only the numbers needed
            to make a decision.
          </p>

        </div>

        <div class="caheadbtns">

          <button
            id="pushbtn"
            class="cabtn ${
              S.tradingDesk
                .pushEnabled
                ? ''
                : 'primary'
            }"
          >
            ${
              S.tradingDesk
                .pushEnabled
                ? 'Alerts On'
                : 'Enable Alerts'
            }
          </button>

          <button
            id="refreshbtn"
            class="cabtn"
            ${
              S.tradingDesk
                .loading
                ? 'disabled'
                : ''
            }
          >
            ${
              S.tradingDesk
                .loading
                ? 'Refreshing…'
                : 'Refresh'
            }
          </button>

        </div>

      </div>

      <div class="castatus">

  <span></span>

  <span>
    Updated ${esc(when)}
  </span>

</div>


      <div class="casubtabs">

        <button
          class="catab ${
            S.tradingDesk
              .subview ===
            'desk'
              ? 'active'
              : ''
          }"
          data-sub="desk"
        >
          Flips
        </button>

        <button
          class="catab ${
            S.tradingDesk
              .subview ===
            'misid'
              ? 'active'
              : ''
          }"
          data-sub="misid"
        >
          Misidentified
        </button>

      </div>

      <div id="deskbody"></div>
    `;

    const body =
      document
        .getElementById(
          'deskbody'
        );

    if (
      S.tradingDesk
        .subview ===
      'misid'
    ) {
      drawMisidentified(
        body
      );
    } else {
      drawDesk(
        body
      );
    }

    document
      .getElementById(
        'refreshbtn'
      )
      .onclick =
        () =>
          loadFlips(
            true
          );

    document
      .getElementById(
        'pushbtn'
      )
      .onclick =
        async () => {

          try {
            await enablePush();
          } catch(e) {
            alert(
              e?.message ||
              'Could not enable alerts.'
            );
          }
        };

    root
      .querySelectorAll(
        '[data-sub]'
      )
      .forEach(
        b =>
          b.onclick =
            () => {

              S.tradingDesk
                .subview =
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

              S.tradingDesk
                .filter =
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

              S.tradingDesk
                .misidFilter =
                b.dataset.misfilter;

              draw();
            }
      );

    root
      .querySelectorAll(
        '[data-open]'
      )
      .forEach(
        b =>
          b.onclick =
            () => {

              if (
                b.dataset.open
              ) {
                window.open(
                  b.dataset.open,
                  '_blank',
                  'noopener'
                );
              }
            }
      );
  }

  async function fetchAll() {
    const [
      feed,
      rarity,
      comps,
      misid,
      review
    ] =
      await Promise.all([

        api(
          '/rest/v1/golden_goose_flips_app_feed_v1?select=*&order=flip_score.desc&limit=250'
        )
          .catch(
            () => []
          ),

        api(
          '/rest/v1/flip_rarity_ladder_v1?select=*&order=sales_90d.desc&limit=1000'
        )
          .catch(
            () => []
          ),

        api(
          '/rest/v1/flip_recent_exact_comps_v1?select=*&recency_rank=lte.5&order=sale_date.desc&limit=1000'
        )
          .catch(
            () => []
          ),

        api(
          '/rest/v1/ebay_misidentified_actionable_v1?select=*&order=estimated_profit_if_confirmed.desc&limit=100'
        )
          .catch(
            () => []
          ),

        api(
          '/rest/v1/ebay_misidentified_opportunities_v2?select=*&order=estimated_profit_if_confirmed.desc&limit=150'
        )
          .catch(
            () => []
          )

      ]);

    S.tradingDesk.feed =
      Array.isArray(feed)
        ? feed
        : [];

    S.tradingDesk.rarity =
      Array.isArray(rarity)
        ? rarity
        : [];

    S.tradingDesk.comps =
      Array.isArray(comps)
        ? comps
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
      new Date()
        .toISOString();
  }

  async function loadFlips(
    force = false
  ) {
    if (
      S.tradingDesk
        .loading
    ) {
      return;
    }

    const age =
      S.tradingDesk
        .lastRefreshAt
        ? (
            Date.now() -
            new Date(
              S.tradingDesk
                .lastRefreshAt
            ).getTime()
          )
        : Infinity;

    if (
      !force &&
      age < 15000
    ) {
      draw();
      return;
    }

    S.tradingDesk
      .loading =
      true;

    draw();

    try {
      await Promise.all([
        fetchAll(),
        refreshPushState()
      ]);
    } finally {
      S.tradingDesk
        .loading =
        false;

      draw();
    }
  }

  setInterval(
    () => {

      if (
        !page.classList
          .contains(
            'hidden'
          ) &&
        document
          .visibilityState ===
        'visible'
      ) {
        loadFlips(
          true
        );
      }

    },
    AUTO_REFRESH_MS
  );

  document
    .addEventListener(
      'visibilitychange',
      () => {

        if (
          document
            .visibilityState ===
          'visible' &&
          !page.classList
            .contains(
              'hidden'
            )
        ) {
          const age =
            S.tradingDesk
              .lastRefreshAt
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

