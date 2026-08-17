(() => {
  if (typeof api !== 'function' || typeof T !== 'function') {
    return;
  }

  const css = document.createElement('style');

  css.textContent = `
    .historysection{
      margin-top:28px;
    }

    .historyhead{
      display:flex;
      justify-content:space-between;
      align-items:flex-end;
      gap:12px;
      margin-bottom:10px;
    }

    .historyhead h2{
      margin:0;
      font-size:21px;
    }

    .historyhead span{
      color:var(--m);
      font-size:11px;
    }

    .historycard{
      display:grid;
      grid-template-columns:58px minmax(0,1fr) auto;
      gap:11px;
      align-items:center;
      padding:12px 0;
      border-bottom:1px solid var(--l);
    }

    .historycard:last-child{
      border-bottom:0;
    }

    .historyimg{
      width:58px;
      height:78px;
      border-radius:9px;
      object-fit:contain;
      background:#0b0d0e;
      border:1px solid #293033;
    }

    .historyph{
      width:58px;
      height:78px;
      border-radius:9px;
      background:#0b0d0e;
      border:1px solid #293033;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#56605c;
      font-size:11px;
      font-weight:900;
    }

    .historytype{
      display:inline-block;
      border:1px solid #34403a;
      border-radius:999px;
      padding:4px 7px;
      font-size:9px;
      font-weight:900;
      margin-bottom:5px;
    }

    .historytype.sale{
      color:#a8efbf;
      border-color:#284633;
      background:#17271d;
    }

    .historytype.trade{
      color:#9ed8ff;
      border-color:#2a3f4c;
      background:#152027;
    }

    .historyname{
      font-size:13px;
      font-weight:850;
      line-height:1.25;
    }

    .historymeta{
      margin-top:4px;
      color:var(--m);
      font-size:10px;
      line-height:1.4;
    }

    .historyright{
      text-align:right;
      min-width:88px;
    }

    .historyamount{
      font-size:16px;
      font-weight:900;
    }

    .historypnl{
      font-size:11px;
      font-weight:850;
      margin-top:4px;
    }

    .historydetails{
      color:var(--m);
      font-size:9px;
      margin-top:4px;
      line-height:1.35;
    }
  `;

  document.head.appendChild(css);

  const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const money = value =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(value) || 0);

  let historyRows = [];

  function historyImage(row) {
    if (row.image_url) {
      return `
        <img
          class="historyimg"
          src="${esc(row.image_url)}"
          alt="${esc(row.player_name || 'Card')}"
          loading="lazy"
        >
      `;
    }

    return `<div class="historyph">CA</div>`;
  }

  function drawHistory() {
    const root = document.getElementById('collectionhistory');

    if (!root) {
      return;
    }

    if (!historyRows.length) {
      root.innerHTML = `
        <div class="historyempty">
          No recorded sales or trades yet.
        </div>
      `;
      return;
    }

    root.innerHTML = historyRows.map(row => {
      const isTrade = row.transaction_type === 'trade_out';
      const pnl = Number(row.realized_pnl || 0);

      const meta = [
        row.year,
        row.set_name,
        row.card_number ? '#' + row.card_number : null,
        row.parallel,
        row.serial_numbered_to ? '/' + row.serial_numbered_to : null
      ].filter(Boolean).join(' · ');

      const date = row.occurred_at
        ? new Date(row.occurred_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : '—';

      return `
        <div class="historycard">
          ${historyImage(row)}

          <div>
            <span class="historytype ${isTrade ? 'trade' : 'sale'}">
              ${isTrade ? 'TRADE' : 'SOLD'}
            </span>

            <div class="historyname">
              ${esc(row.player_name || 'Card')}
            </div>

            <div class="historymeta">
              ${esc(meta || 'Card details unavailable')}
              <br>
              ${esc(date)}
              ${Number(row.quantity || 0) > 1
                ? ' · Qty ' + esc(row.quantity)
                : ''}
            </div>
          </div>

          <div class="historyright">
            <div class="historyamount">
              ${money(row.total_amount)}
            </div>

            <div class="historypnl ${pnl >= 0 ? 'pnlpos' : 'pnlneg'}">
              ${pnl >= 0 ? '+' : ''}${money(pnl)}
            </div>

            <div class="historydetails">
              ${money(row.price_per_unit)} each
              <br>
              Fees ${money(row.fees)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function loadCollectionHistory() {
    const root = document.getElementById('collectionhistory');

    if (root) {
      root.innerHTML = `
        <div class="historyempty">
          Loading sales & trades…
        </div>
      `;
    }

    try {
      const rows = await api(
        '/rest/v1/collection_exit_history' +
        '?select=transaction_id,transaction_type,quantity,price_per_unit,fees,total_amount,cost_basis_released,realized_pnl,occurred_at,year,set_name,player_name,card_number,parallel,serial_numbered_to,grade,grader,image_url' +
        '&order=occurred_at.desc' +
        '&limit=100'
      );

      historyRows = Array.isArray(rows) ? rows : [];
      drawHistory();

    } catch (error) {
      console.error('Collection history failed:', error);

      if (root) {
        root.innerHTML = `
          <div class="error">
            Could not load sales & trade history.
          </div>
        `;
      }
    }
  }

  function installHistorySection() {
    const portfolio = document.getElementById('portfolio');

    if (!portfolio || document.getElementById('collectionhistory')) {
      return;
    }

    const section = document.createElement('div');
    section.className = 'historysection';

    section.innerHTML = `
      <div class="historyhead">
        <div>
          <h2>Sales & Trade History</h2>
          <span>Realized collection activity</span>
        </div>

        <button
          id="historyrefresh"
          class="trophyarrow"
          aria-label="Refresh history"
        >
          ↻
        </button>
      </div>

      <div id="collectionhistory" class="card">
        <div class="historyempty">
          Loading sales & trades…
        </div>
      </div>
    `;

    portfolio.appendChild(section);

    document.getElementById('historyrefresh').onclick =
      loadCollectionHistory;
  }

  installHistorySection();

  const oldLoad = window.load;

  if (typeof oldLoad === 'function') {
    window.load = async function(...args) {
      const result = await oldLoad.apply(this, args);
      await loadCollectionHistory();
      return result;
    };
  }

  if (T()) {
    loadCollectionHistory();
  }

  window.loadCollectionHistory = loadCollectionHistory;
})();