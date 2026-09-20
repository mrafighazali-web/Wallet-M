/* =========================================================
   DEBTS — hutang & piutang
   hutang  = saya pinjam uang dari orang (uang masuk, saya wajib bayar)
   piutang = orang pinjam uang dari saya (uang keluar, orang wajib bayar)
========================================================= */

let debtTab = 'hutang'; // 'hutang' | 'piutang'

function setDebtTab(t) {
  debtTab = t;
  render();
}

function renderDebts() {
  pageTitle.textContent = 'Hutang & Piutang';
  backBtn.classList.add('hidden');

  const debts = state.debts || [];
  const hutangList  = debts.filter(d => d.type === 'hutang');
  const piutangList = debts.filter(d => d.type === 'piutang');

  const sisaHutang  = hutangList.reduce((s, d) => s + (d.amountTotal - d.amountPaid), 0);
  const sisaPiutang = piutangList.reduce((s, d) => s + (d.amountTotal - d.amountPaid), 0);

  const currentList = debtTab === 'hutang' ? hutangList : piutangList;
  const currentSisa = currentList.reduce((s, d) => s + (d.amountTotal - d.amountPaid), 0);

  // sort: aktif dulu, lalu jatuh tempo terdekat
  const sorted = [...currentList].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    return (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1;
  });

  const listHTML = sorted.length === 0
    ? `<div class="empty">Belum ada ${debtTab === 'hutang' ? 'hutang' : 'piutang'}</div>`
    : `<ul class="debt-list">${sorted.map(debtItemHTML).join('')}</ul>`;

  const tabHutangLabel  = `Hutang (${fmt(sisaHutang)})`;
  const tabPiutangLabel = `Piutang (${fmt(sisaPiutang)})`;

  app.innerHTML = `
    <div class="tabs">
      <button class="${debtTab === 'hutang' ? 'active' : ''}" onclick="setDebtTab('hutang')">${tabHutangLabel}</button>
      <button class="${debtTab === 'piutang' ? 'active' : ''}" onclick="setDebtTab('piutang')">${tabPiutangLabel}</button>
    </div>

    <div class="card">
      <div class="balance-label">
        Total ${debtTab === 'hutang' ? 'Hutang Saya' : 'Piutang Saya'} Belum Lunas
      </div>
      <div class="balance-big" style="color:${debtTab === 'hutang' ? 'var(--danger)' : 'var(--success)'}">
        ${fmt(currentSisa)}
      </div>
    </div>

    <button class="btn-block" onclick="openDebtModal('${debtTab}')">
      + Tambah ${debtTab === 'hutang' ? 'Hutang' : 'Piutang'}
    </button>

    <div class="card" style="margin-top:12px">
      <div class="balance-label" style="margin-bottom:8px">Daftar</div>
      ${listHTML}
    </div>
  `;
}

function debtItemHTML(d) {
  const remaining = d.amountTotal - d.amountPaid;
  const isPaid = remaining <= 0;

  const statusBadge = isPaid
    ? '<span class="badge badge-paid">✅ Lunas</span>'
    : d.amountPaid > 0
      ? '<span class="badge badge-partial">Sebagian</span>'
      : '<span class="badge badge-active">Aktif</span>';

  let dueInfo = '';
  if (!isPaid && d.dueDate) {
    const due = new Date(d.dueDate + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.round((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0)       dueInfo = `<div class="debt-due due-over">⚠ Terlambat ${Math.abs(diff)} hari</div>`;
    else if (diff <= 3) dueInfo = `<div class="debt-due due-soon">⚠ Jatuh tempo H-${diff}</div>`;
    else                dueInfo = `<div class="debt-due">Jatuh tempo: ${d.dueDate}</div>`;
  }

  const actionLabel = d.type === 'hutang' ? 'Bayar' : 'Terima';

  return `
    <li class="debt-item">
      <div class="debt-header">
        <div>
          <div class="debt-name">${escapeHtml(d.name)}</div>
          <div class="debt-amount">
            ${fmt(remaining)} <span class="muted">dari ${fmt(d.amountTotal)}</span>
          </div>
          ${dueInfo}
        </div>
        <div>${statusBadge}</div>
      </div>
      <div class="debt-actions">
        ${!isPaid ? `<button class="btn-sm" onclick="openPaymentModal('${d.id}')">${actionLabel}</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deleteDebt('${d.id}')">Hapus</button>
      </div>
    </li>
  `;
}

/* ---------- Form: Tambah Hutang/Piutang ---------- */
function openDebtModal(type) {
  const isHutang = type === 'hutang';
  const title = isHutang ? 'Tambah Hutang' : 'Tambah Piutang';
  const accLabel = isHutang ? 'Uang Masuk Ke' : 'Uang Keluar Dari';

  modalContent.innerHTML = `
    <h2>${title} <button onclick="closeModal()">✕</button></h2>
    <div class="form-group">
      <label>Nama Orang</label>
      <input type="text" id="debtName" placeholder="mis. Andi" />
    </div>
    <div class="form-group">
      <label>Jumlah (Rp)</label>
      <input type="number" id="debtAmount" min="0" placeholder="0" />
    </div>
    <div class="form-group">
      <label>${accLabel}</label>
      <select id="debtAccount">${accountOptions('dompet')}</select>
    </div>
    <div class="form-group">
      <label>Tanggal Pinjam</label>
      <input type="date" id="debtDate" value="${todayISO()}" />
    </div>
    <div class="form-group">
      <label>Jatuh Tempo (opsional)</label>
      <input type="date" id="debtDue" />
    </div>
    <div class="form-group">
      <label>Catatan (opsional)</label>
      <input type="text" id="debtNote" placeholder="mis. buat beli buku" />
    </div>
    <button class="submit" onclick="submitDebt('${type}')">SIMPAN</button>
  `;
  modalBackdrop.classList.add('show');
}

function submitDebt(type) {
  const name     = document.getElementById('debtName').value.trim();
  const amount   = parseFloat(document.getElementById('debtAmount').value);
  const account  = document.getElementById('debtAccount').value;
  const date     = document.getElementById('debtDate').value || todayISO();
  const dueDate  = document.getElementById('debtDue').value || '';
  const note     = document.getElementById('debtNote').value.trim();

  if (!name) { alert('Nama harus diisi'); return; }
  if (!amount || amount <= 0) { alert('Jumlah harus lebih dari 0'); return; }

  const isHutang = type === 'hutang';

  if (!isHutang && state.accounts[account].balance < amount) {
    if (!confirm('Saldo tidak cukup. Lanjutkan?')) return;
  }

  // Update saldo akun
  if (isHutang) state.accounts[account].balance += amount;
  else          state.accounts[account].balance -= amount;

  // Buat debt dulu supaya id bisa dipakai di transaksi
  const newDebt = {
    id: 'd_' + Date.now(),
    type,
    name,
    amountTotal: amount,
    amountPaid: 0,
    date,
    dueDate,
    note,
    status: 'active',
    payments: []
  };
  state.debts.push(newDebt);

  // Catat transaksi utama
  state.transactions.push({
    type: isHutang ? 'income' : 'expense',
    amount,
    account,
    date,
    note: `${isHutang ? 'Pinjam dari' : 'Pinjamkan ke'} ${name}`,
    category: isHutang ? 'Hutang' : 'Piutang',
    refDebtId: newDebt.id
  });

  saveState();
  closeModal();
  render();
}

/* ---------- Form: Bayar / Terima ---------- */
function openPaymentModal(debtId) {
  const d = (state.debts || []).find(x => x.id === debtId);
  if (!d) return;

  const remaining = d.amountTotal - d.amountPaid;
  const isHutang = d.type === 'hutang';
  const title = isHutang ? `Bayar Hutang - ${d.name}` : `Terima Piutang - ${d.name}`;
  const accLabel = isHutang ? 'Bayar Dari Akun' : 'Terima Ke Akun';
  const btnLabel = isHutang ? 'BAYAR' : 'TERIMA';

  modalContent.innerHTML = `
    <h2>${title} <button onclick="closeModal()">✕</button></h2>
    <div class="card" style="margin-bottom:12px">
      <div class="balance-label">Sisa</div>
      <div style="font-size:20px;font-weight:700">${fmt(remaining)}</div>
    </div>
    <div class="form-group">
      <label>Jumlah (Rp)</label>
      <input type="number" id="payAmount" min="0" max="${remaining}" value="${remaining}" />
    </div>
    <div class="form-group">
      <label>${accLabel}</label>
      <select id="payAccount">${accountOptions('dompet')}</select>
    </div>
    <div class="form-group">
      <label>Tanggal</label>
      <input type="date" id="payDate" value="${todayISO()}" />
    </div>
    <div class="form-group">
      <label>Catatan (opsional)</label>
      <input type="text" id="payNote" />
    </div>
    <button class="submit" onclick="submitPayment('${debtId}')">${btnLabel}</button>
  `;
  modalBackdrop.classList.add('show');
}

function submitPayment(debtId) {
  const d = (state.debts || []).find(x => x.id === debtId);
  if (!d) return;

  const amount  = parseFloat(document.getElementById('payAmount').value);
  const account = document.getElementById('payAccount').value;
  const date    = document.getElementById('payDate').value || todayISO();
  const note    = document.getElementById('payNote').value.trim();
  const remaining = d.amountTotal - d.amountPaid;

  if (!amount || amount <= 0) { alert('Jumlah harus lebih dari 0'); return; }
  if (amount > remaining)     { alert('Jumlah melebihi sisa'); return; }

  const isHutang = d.type === 'hutang';

  if (isHutang && state.accounts[account].balance < amount) {
    if (!confirm('Saldo tidak cukup. Lanjutkan?')) return;
  }

  // update saldo akun
  if (isHutang) state.accounts[account].balance -= amount;
  else          state.accounts[account].balance += amount;

  // update debt
  d.amountPaid += amount;
  if (d.amountPaid >= d.amountTotal) d.status = 'paid';
  d.payments = d.payments || [];
  d.payments.push({
    id: 'p_' + Date.now(),
    date, amount, account, note
  });

  // catat transaksi utama
  state.transactions.push({
    type: isHutang ? 'expense' : 'income',
    amount,
    account,
    date,
    note: `${isHutang ? 'Bayar hutang ke' : 'Terima piutang dari'} ${d.name}`,
    category: isHutang ? 'Hutang' : 'Piutang',
    refDebtId: d.id
  });

  saveState();
  closeModal();
  render();
}

/* ---------- Hapus ---------- */
function deleteDebt(debtId) {
  const d = (state.debts || []).find(x => x.id === debtId);
  if (!d) return;
  const label = d.type === 'hutang' ? 'hutang' : 'piutang';
  if (!confirm(`Hapus ${label} dengan ${d.name}?\nTransaksi terkait tetap ada di riwayat.`)) return;
  state.debts = state.debts.filter(x => x.id !== debtId);
  saveState();
  render();
}

/* ---------- Util ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
