/* =========================================================
   TRANSACTIONS — modal form, submit, dan item list
========================================================= */

const INCOME_CATS  = ['Kiriman', 'Top Up', 'Lainnya'];
const EXPENSE_CATS = ['Makan', 'Jajan', 'Transport', 'SPP', 'Kuliah', 'Darurat', 'Lainnya'];

function catOptions(list, selected) {
  return list.map(c =>
    `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`
  ).join('');
}

function txItemHTML(t) {
  const isIncome  = t.type === 'income';
  const isExpense = t.type === 'expense';
  const sign = isIncome ? '+' : isExpense ? '-' : '⇄';
  const cls  = isIncome ? 'income' : isExpense ? 'expense' : '';
  const cat  = t.category && t.category !== 'Lainnya' ? ` • ${t.category}` : '';
  const title = t.note || t.category || (isIncome ? 'Pemasukan' : isExpense ? 'Pengeluaran' : 'Transfer');
  const sub = isIncome
    ? `Masuk ke ${state.accounts[t.account].name}`
    : isExpense
      ? `Dari ${state.accounts[t.account].name}`
      : `${state.accounts[t.account].name} → ${state.accounts[t.toAccount].name}`;
  return `
    <li>
      <div>
        <div>${title}</div>
        <div class="desc">${sub}${cat} • ${t.date}</div>
      </div>
      <div class="amount ${cls}">${sign}${fmt(t.amount)}</div>
    </li>
  `;
}

function accountOptions(selected) {
  return Object.entries(state.accounts).map(([k, a]) =>
    `<option value="${k}" ${k === selected ? 'selected' : ''}>${a.icon} ${a.name}</option>`
  ).join('');
}

function openTxModal(type, accountKey) {
  const isTransfer = type === 'transfer';
  const title = type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Transfer';

  const fromOrToLabel = type === 'income' ? 'Ke Akun' : 'Dari Akun';
  const defaultAcc = accountKey || 'dompet';
  const transferTo = Object.keys(state.accounts).find(k => k !== defaultAcc) || 'darurat';

  const catList = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  const catField = isTransfer ? '' : `
    <div class="form-group">
      <label>Kategori</label>
      <select id="category">${catOptions(catList, 'Lainnya')}</select>
    </div>
  `;

  modalContent.innerHTML = `
    <h2>${title} <button onclick="closeModal()">✕</button></h2>
    <div class="form-group">
      <label>${fromOrToLabel}</label>
      <select id="accFrom">${accountOptions(defaultAcc)}</select>
    </div>
    ${isTransfer ? `
    <div class="form-group">
      <label>Ke Akun</label>
      <select id="accTo">${accountOptions(transferTo)}</select>
    </div>` : ''}
    <div class="form-group">
      <label>Jumlah (Rp)</label>
      <input type="number" id="amount" min="0" placeholder="0" />
    </div>
    ${catField}
    <div class="form-group">
      <label>Tanggal</label>
      <input type="date" id="date" value="${todayISO()}" />
    </div>
    <div class="form-group">
      <label>Catatan (opsional)</label>
      <input type="text" id="note" placeholder="${isTransfer ? 'mis. Sisihkan darurat' : 'mis. Jajan bakso'}" />
    </div>
    <button class="submit" onclick="submitTx('${type}')">SIMPAN</button>
  `;
  modalBackdrop.classList.add('show');
}

function submitTx(type) {
  const amount = parseFloat(document.getElementById('amount').value);
  const date   = document.getElementById('date').value || todayISO();
  const note   = document.getElementById('note').value.trim();
  const accFrom = document.getElementById('accFrom').value;
  const catEl = document.getElementById('category');
  const category = catEl ? catEl.value : null;

  if (!amount || amount <= 0) {
    alert('Jumlah harus lebih dari 0');
    return;
  }

  if (type === 'income') {
    state.accounts[accFrom].balance += amount;
    state.transactions.push({ type, amount, account: accFrom, date, note, category });
  } else if (type === 'expense') {
    if (state.accounts[accFrom].balance < amount) {
      if (!confirm('Saldo tidak cukup. Lanjutkan?')) return;
    }
    state.accounts[accFrom].balance -= amount;
    state.transactions.push({ type, amount, account: accFrom, date, note, category });
  } else if (type === 'transfer') {
    const accTo = document.getElementById('accTo').value;
    if (accFrom === accTo) {
      alert('Akun asal dan tujuan tidak boleh sama');
      return;
    }
    if (state.accounts[accFrom].balance < amount) {
      if (!confirm('Saldo tidak cukup. Lanjutkan?')) return;
    }
    state.accounts[accFrom].balance -= amount;
    state.accounts[accTo].balance += amount;
    state.transactions.push({ type, amount, account: accFrom, toAccount: accTo, date, note });
  }

  saveState();
  closeModal();
  render();
}

/* ---------- Modal: Atur Saldo Awal ---------- */
function openSettingsModal() {
  const fields = Object.entries(state.accounts).map(([k, a]) => `
    <div class="form-group">
      <label>${a.icon} ${a.name}</label>
      <input type="number" id="set_${k}" value="${a.balance}" />
    </div>
  `).join('');

  modalContent.innerHTML = `
    <h2>Atur Saldo Awal <button onclick="closeModal()">✕</button></h2>
    ${fields}
    <button class="submit" onclick="saveSettings()">SIMPAN</button>
  `;
  modalBackdrop.classList.add('show');
}

function saveSettings() {
  Object.keys(state.accounts).forEach(k => {
    const v = parseFloat(document.getElementById('set_' + k).value) || 0;
    state.accounts[k].balance = v;
  });
  saveState();
  closeModal();
  render();
                                                 }
