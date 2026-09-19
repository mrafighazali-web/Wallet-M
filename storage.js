/* =========================================================
   STORAGE — load & save state ke localStorage
========================================================= */
const STORAGE_KEY = 'dompetsantri_v1';

const defaultState = {
  accounts: {
    dompet:    { name: 'Dompet',           icon: '👛', color: 'var(--dompet)',    balance: 0 },
    dana:      { name: 'Dana',             icon: '💳', color: 'var(--dana)',      balance: 0 },
    shopeepay: { name: 'ShopeePay',        icon: '💳', color: 'var(--shopeepay)', balance: 0 },
    gopay:     { name: 'GoPay',            icon: '💳', color: 'var(--gopay)',     balance: 0 },
    atm:       { name: 'ATM',              icon: '🏦', color: 'var(--atm)',       balance: 0 },
    darurat:   { name: 'Tabungan Darurat', icon: '🆘', color: 'var(--darurat)',   balance: 0 }
  },
  transactions: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(raw);
    parsed.accounts = { ...defaultState.accounts, ...parsed.accounts };
    parsed.transactions = parsed.transactions || [];
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
