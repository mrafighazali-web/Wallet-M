/* =========================================================
   ACCOUNTS — render halaman akun (Dompet / ATM / Darurat)
              dan halaman Dompet Digital
========================================================= */

function renderAccount(key) {
  const a = state.accounts[key];
  pageTitle.textContent = a.name;
  backBtn.classList.remove('hidden');

  const txs = txForAccount(key);
  const listHTML = txs.length === 0
    ? `<div class="empty">Belum ada transaksi</div>`
    : `<ul class="tx-list">${txs.map(txItemHTML).join('')}</ul>`;

  app.innerHTML = `
    <div class="card">
      <div class="balance-label">Saldo ${a.name}</div>
      <div class="balance-big" style="color:${a.color}">${fmt(a.balance)}</div>
    </div>

    <div class="quick-actions">
      <button onclick="openTxModal('income','${key}')">+ Pemasukan</button>
      <button onclick="openTxModal('expense','${key}')">- Pengeluaran</button>
      <button onclick="openTxModal('transfer','${key}')">⇄ Transfer</button>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="balance-label" style="margin-bottom:8px">Riwayat</div>
      ${listHTML}
    </div>
  `;
}

function renderDigital() {
  pageTitle.textContent = 'Dompet Digital';
  backBtn.classList.add('hidden');

  const tabs = ['dana', 'shopeepay', 'gopay'];
  const tabHTML = tabs.map(t => `
    <button class="${t === digitalTab ? 'active' : ''}" onclick="setDigitalTab('${t}')">
      ${state.accounts[t].name}
    </button>
  `).join('');

  const a = state.accounts[digitalTab];
  const txs = txForAccount(digitalTab);
  const listHTML = txs.length === 0
    ? `<div class="empty">Belum ada transaksi</div>`
    : `<ul class="tx-list">${txs.map(txItemHTML).join('')}</ul>`;

  app.innerHTML = `
    <div class="tabs">${tabHTML}</div>

    <div class="card">
      <div class="balance-label">Saldo ${a.name}</div>
      <div class="balance-big" style="color:${a.color}">${fmt(a.balance)}</div>
    </div>

    <div class="quick-actions">
      <button onclick="openTxModal('income','${digitalTab}')">+ Pemasukan</button>
      <button onclick="openTxModal('expense','${digitalTab}')">- Pengeluaran</button>
      <button onclick="openTxModal('transfer','${digitalTab}')">⇄ Transfer</button>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="balance-label" style="margin-bottom:8px">Riwayat</div>
      ${listHTML}
    </div>
  `;
}

function setDigitalTab(t) {
  digitalTab = t;
  render();
}
