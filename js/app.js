/* =========================================================
   APP — dashboard, navigasi, dan inisialisasi
========================================================= */

const app = document.getElementById('app');
const pageTitle = document.getElementById('pageTitle');
const backBtn = document.getElementById('backBtn');

const modalBackdrop = document.getElementById('modalBackdrop');
const modalContent = document.getElementById('modalContent');

let currentPage = 'dashboard';
let digitalTab = 'dana';

/* ---------- Dashboard ---------- */
function renderDashboard() {
  pageTitle.textContent = 'DompetSantri';
  backBtn.classList.add('hidden');

  const s = monthSummary();

  const accountsHTML = Object.entries(state.accounts).map(([key, a]) => `
    <li onclick="goToAccount('${key}')">
      <span class="name">
        <span class="dot" style="background:${a.color}"></span>
        ${a.icon} ${a.name}
      </span>
      <span class="amount">${fmt(a.balance)}</span>
    </li>
  `).join('');

  const recentTx = state.transactions.slice(-5).reverse();
  const recentHTML = recentTx.length === 0
    ? `<div class="empty">Belum ada transaksi</div>`
    : `<ul class="tx-list">${recentTx.map(txItemHTML).join('')}</ul>`;

  app.innerHTML = `
    <div class="card">
      <div class="balance-label">Uang di Dompet</div>
      <div class="balance-big" style="color:var(--dompet)">${fmt(state.accounts.dompet.balance)}</div>
      <div class="balance-label" style="margin-top:12px">Total Semua Saldo</div>
      <div class="balance-big">${fmt(totalSaldo())}</div>
    </div>

    <div class="card">
      <div class="balance-label">Ringkasan Bulan Ini</div>
      <div class="summary-grid">
        <div class="item">
          <div class="label">Masuk</div>
          <div class="value" style="color:var(--success)">${fmt(s.income)}</div>
        </div>
        <div class="item">
          <div class="label">Keluar</div>
          <div class="value" style="color:var(--danger)">${fmt(s.expense)}</div>
        </div>
        <div class="item">
          <div class="label">Sisa</div>
          <div class="value">${fmt(s.balance)}</div>
        </div>
      </div>
      <button class="btn-block" onclick="goToReports()">📊 Lihat Laporan Bulanan</button>
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">Saldo Per Akun</div>
      <ul class="account-list">${accountsHTML}</ul>
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">Aksi Cepat</div>
      <div class="quick-actions">
        <button onclick="openTxModal('income')">+ Pemasukan</button>
        <button onclick="openTxModal('expense')">- Pengeluaran</button>
        <button onclick="openTxModal('transfer')">⇄ Transfer</button>
        <button onclick="openSettingsModal()">⚙️ Atur Saldo Awal</button>
      </div>
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">Riwayat Terakhir</div>
      ${recentHTML}
    </div>
  `;
}

/* ---------- Router ---------- */
function render() {
  // update tab aktif di bottom nav
  document.querySelectorAll('nav.bottom button').forEach(b => {
    b.classList.toggle('active', b.dataset.nav === currentPage);
  });

  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'dompet') renderAccount('dompet');
  else if (currentPage === 'digital') renderDigital();
  else if (currentPage === 'atm') renderAccount('atm');
  else if (currentPage === 'darurat') renderAccount('darurat');
  else if (currentPage === 'reports') renderReports();
}

function goToAccount(key) {
  if (['dana', 'shopeepay', 'gopay'].includes(key)) {
    digitalTab = key;
    currentPage = 'digital';
  } else {
    currentPage = key;
  }
  render();
}

function goToReports() {
  currentPage = 'reports';
  render();
}

/* ---------- Modal util ---------- */
function closeModal() {
  modalBackdrop.classList.remove('show');
  modalContent.innerHTML = '';
}

modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

/* ---------- Event listener navigasi ---------- */
document.querySelectorAll('nav.bottom button').forEach(btn => {
  btn.addEventListener('click', () => {
    currentPage = btn.dataset.nav;
    render();
  });
});

backBtn.addEventListener('click', () => {
  currentPage = 'dashboard';
  render();
});

/* ---------- Init ---------- */
render();
