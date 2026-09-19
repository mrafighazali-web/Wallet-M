/* =========================================================
   REPORTS — laporan bulanan + grafik
========================================================= */

let chartInstances = {};
let reportMonth = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
})();

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  const names = ['Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember'];
  return `${names[m - 1]} ${y}`;
}

function getTxInMonth(ym) {
  return state.transactions.filter(t => (t.date || '').startsWith(ym));
}

function destroyCharts() {
  Object.values(chartInstances).forEach(c => {
    try { c.destroy(); } catch (e) {}
  });
  chartInstances = {};
}

function changeReportMonth(delta) {
  reportMonth = shiftMonth(reportMonth, delta);
  renderReports();
}

function renderReports() {
  pageTitle.textContent = 'Laporan Bulanan';
  backBtn.classList.remove('hidden');

  const txs = getTxInMonth(reportMonth);
  const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  // kategori pengeluaran
  const expenseByCategory = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    const c = t.category || 'Lainnya';
    expenseByCategory[c] = (expenseByCategory[c] || 0) + t.amount;
  });

  // 6 bulan terakhir
  const last6 = [];
  for (let i = 5; i >= 0; i--) last6.push(shiftMonth(reportMonth, -i));
  const monthlyIncome  = last6.map(ym =>
    getTxInMonth(ym).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
  const monthlyExpense = last6.map(ym =>
    getTxInMonth(ym).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));

  // per akun
  const accountKeys = Object.keys(state.accounts);
  const accountNames = accountKeys.map(k => state.accounts[k].name);
  const accountBalances = accountKeys.map(k => state.accounts[k].balance);
  const colorMap = {
    dompet: '#16a34a', dana: '#2563eb', shopeepay: '#f97316',
    gopay: '#0ea5e9', atm: '#6b7280', darurat: '#dc2626'
  };
  const accountColors = accountKeys.map(k => colorMap[k] || '#888');

  // list transaksi bulan ini
  const txList = [...txs].sort((a, b) => (a.date < b.date ? 1 : -1));

  app.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <button class="btn-ghost" onclick="changeReportMonth(-1)">‹</button>
        <div style="font-weight:600;text-align:center;flex:1">${monthLabel(reportMonth)}</div>
        <button class="btn-ghost" onclick="changeReportMonth(1)">›</button>
      </div>
    </div>

    <div class="card">
      <div class="balance-label">Ringkasan Bulan Ini</div>
      <div class="summary-grid">
        <div class="item">
          <div class="label">Masuk</div>
          <div class="value" style="color:var(--success)">${fmt(income)}</div>
        </div>
        <div class="item">
          <div class="label">Keluar</div>
          <div class="value" style="color:var(--danger)">${fmt(expense)}</div>
        </div>
        <div class="item">
          <div class="label">Sisa</div>
          <div class="value">${fmt(net)}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">Pengeluaran per Kategori</div>
      ${Object.keys(expenseByCategory).length === 0
        ? '<div class="empty">Belum ada pengeluaran</div>'
        : '<div class="chart-wrap"><canvas id="chartCategory"></canvas></div>'}
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">6 Bulan Terakhir</div>
      <div class="chart-wrap"><canvas id="chartMonthly"></canvas></div>
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">Saldo Per Akun</div>
      <div class="chart-wrap"><canvas id="chartAccounts"></canvas></div>
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">Transaksi Bulan Ini</div>
      ${txList.length === 0
        ? '<div class="empty">Belum ada transaksi</div>'
        : `<ul class="tx-list">${txList.map(txItemHTML).join('')}</ul>`}
    </div>
  `;

  destroyCharts();

  if (typeof Chart === 'undefined') {
    console.warn('Chart.js tidak tersedia (offline?). Grafik dilewati.');
    return;
  }

  // ---------- Chart 1: Doughnut kategori ----------
  const catCtx = document.getElementById('chartCategory');
  if (catCtx && Object.keys(expenseByCategory).length) {
    chartInstances.category = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(expenseByCategory),
        datasets: [{
          data: Object.values(expenseByCategory),
          backgroundColor: [
            '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
            '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed)}` }
          }
        }
      }
    });
  }

  // ---------- Chart 2: Bar 6 bulan ----------
  const monthCtx = document.getElementById('chartMonthly');
  if (monthCtx) {
    chartInstances.monthly = new Chart(monthCtx, {
      type: 'bar',
      data: {
        labels: last6.map(ym => monthLabel(ym).split(' ')[0].slice(0, 3)),
        datasets: [
          { label: 'Masuk',  data: monthlyIncome,  backgroundColor: '#16a34a' },
          { label: 'Keluar', data: monthlyExpense, backgroundColor: '#dc2626' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` }
          }
        },
        scales: {
          y: { ticks: { callback: (v) => 'Rp ' + (v / 1000) + 'k', font: { size: 10 } } }
        }
      }
    });
  }

  // ---------- Chart 3: Bar horizontal saldo akun ----------
  const accCtx = document.getElementById('chartAccounts');
  if (accCtx) {
    chartInstances.accounts = new Chart(accCtx, {
      type: 'bar',
      data: {
        labels: accountNames,
        datasets: [{
          label: 'Saldo',
          data: accountBalances,
          backgroundColor: accountColors
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => fmt(ctx.parsed.x) } }
        },
        scales: {
          x: { ticks: { callback: (v) => 'Rp ' + (v / 1000) + 'k', font: { size: 10 } } }
        }
      }
    });
  }
}
