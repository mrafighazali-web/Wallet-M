/* =========================================================
   STORAGE — load, save, export, import, reset
========================================================= */
const STORAGE_KEY = 'dompetsantri_v1';
const APP_VERSION = '1.1.0';

const defaultState = {
  accounts: {
    dompet:    { name: 'Dompet',           icon: '👛', color: 'var(--dompet)',    balance: 0 },
    dana:      { name: 'Dana',             icon: '💳', color: 'var(--dana)',      balance: 0 },
    shopeepay: { name: 'ShopeePay',        icon: '💳', color: 'var(--shopeepay)', balance: 0 },
    gopay:     { name: 'GoPay',            icon: '💳', color: 'var(--gopay)',     balance: 0 },
    atm:       { name: 'ATM',              icon: '🏦', color: 'var(--atm)',       balance: 0 },
    darurat:   { name: 'Tabungan Darurat', icon: '🆘', color: 'var(--darurat)',   balance: 0 }
  },
  transactions: [],
  debts: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(raw);
    parsed.accounts     = { ...defaultState.accounts, ...parsed.accounts };
    parsed.transactions = parsed.transactions || [];
    parsed.debts        = parsed.debts || [];
    return parsed;
  } catch (e) {
    console.warn('Gagal load state, pakai default', e);
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// state global
let state = loadState();

/* =========================================================
   EXPORT / IMPORT / RESET
========================================================= */

function buildExportObject() {
  return {
    app: 'DompetSantri',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      accounts: state.accounts,
      transactions: state.transactions,
      debts: state.debts
    }
  };
}

function exportData() {
  const payload = buildExportObject();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `dompetsantri-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload;
}

function validateImport(obj) {
  if (!obj || typeof obj !== 'object') return 'File tidak valid.';
  if (!obj.data || typeof obj.data !== 'object') return 'File tidak punya field "data".';
  const d = obj.data;
  if (!d.accounts || typeof d.accounts !== 'object') return 'Data "accounts" tidak ditemukan.';
  if (!Array.isArray(d.transactions)) return 'Data "transactions" harus array.';
  if (d.debts && !Array.isArray(d.debts)) return 'Data "debts" harus array.';
  return null;
}

function applyImport(obj, mode) {
  // mode: 'replace' | 'merge'
  const imported = obj.data;
  const importedAccounts     = { ...defaultState.accounts, ...(imported.accounts || {}) };
  const importedTransactions = imported.transactions || [];
  const importedDebts        = imported.debts || [];

  if (mode === 'replace') {
    state.accounts     = importedAccounts;
    state.transactions = importedTransactions;
    state.debts        = importedDebts;
  } else {
    // merge: akun pakai saldo dari file, transaksi & debt ditambah (hindari duplikat via id)
    state.accounts = importedAccounts;
    const txIds  = new Set(state.transactions.map(t => t.id));
    const debtIds = new Set(state.debts.map(d => d.id));
    importedTransactions.forEach(t => {
      if (t.id && txIds.has(t.id)) return;
      state.transactions.push(t);
    });
    importedDebts.forEach(d => {
      if (d.id && debtIds.has(d.id)) return;
      state.debts.push(d);
    });
  }

  saveState();
}

function resetData() {
  state = JSON.parse(JSON.stringify(defaultState));
  saveState();
                     }
