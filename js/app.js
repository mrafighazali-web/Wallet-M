/* =========================================================
   APP — dashboard, navigasi, dan inisialisasi
========================================================= */

const app = document.getElementById('app');
const pageTitle = document.getElementById('pageTitle');
const backBtn = document.getElementById('backBtn');
const settingsBtn = document.getElementById('settingsBtn');

const modalBackdrop = document.getElementById('modalBackdrop');
const modalContent = document.getElementById('modalContent');

let currentPage = 'dashboard';
let digitalTab = 'dana';

/* ---------- Dashboard ---------- */
function renderDashboard() {
  pageTitle.textContent = 'DompetSantri';
  backBtn.classList.add('hidden');
  settingsBtn.classList.remove('hidden');

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

  const debts = state.debts || [];
  const sisaHutang  = debts.filter(d => d.type === 'hutang')
    .reduce((s, d) => s + (d.amountTotal - d.amountPaid), 0);
  const sisaPiutang = debts.filter(d => d.type === 'piutang')
    .reduce((s, d) => s + (d.amountTotal - d.amountPaid), 0);

  let dueWarning = '';
  const activeDebts = debts.filter(d => d.status === 'active' && d.dueDate);
  if (activeDebts.length) {
    const sorted = [...activeDebts].sort((a, b) => a.dueDate < b.dueDate ? -1 : 1);
    const top = sorted[0];
    const due = new Date(top.dueDate + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.round((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0)       dueWarning = `⚠ ${top.name} terlambat ${Math.abs(diff)} hari`;
    else if (diff <= 3) dueWarning = `⚠ ${top.name} jatuh tempo H-${diff}`;
  }

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
      <div class="balance-label">Hutang & Piutang</div>
      <div class="summary-grid">
        <div class="item">
          <div class="label">Hutang Saya</div>
          <div class="value" style="color:var(--danger)">${fmt(sisaHutang)}</div>
        </div>
        <div class="item">
          <div class="label">Piutang Saya</div>
          <div class="value" style="color:var(--success)">${fmt(sisaPiutang)}</div>
        </div>
        <div class="item">
          <div class="label">Jatuh Tempo</div>
          <div class="value" style="font-size:11px">${dueWarning || '—'}</div>
        </div>
      </div>
      <button class="btn-block" onclick="goToDebts()">🤝 Kelola Hutang / Piutang</button>
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
  document.querySelectorAll('nav.bottom button').forEach(b => {
    b.classList.toggle('active', b.dataset.nav === currentPage);
  });

  // default: sembunyikan tombol settings, tiap halaman bisa munculkan lagi
  settingsBtn.classList.add('hidden');

  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'dompet') renderAccount('dompet');
  else if (currentPage === 'digital') renderDigital();
  else if (currentPage === 'atm') renderAccount('atm');
  else if (currentPage === 'darurat') renderAccount('darurat');
  else if (currentPage === 'reports') renderReports();
  else if (currentPage === 'debts') renderDebts();
  else if (currentPage === 'settings') renderSettings();
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

function goToDebts() {
  currentPage = 'debts';
  render();
}

function goToSettings() {
  currentPage = 'settings';
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

settingsBtn.addEventListener('click', goToSettings);

/* ---------- Init ---------- */
render();
