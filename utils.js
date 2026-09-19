/* =========================================================
   UTILS — helper formatting & kalkulasi
========================================================= */

const fmt = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

const todayISO = () => new Date().toISOString().slice(0, 10);

function totalSaldo() {
  return Object.values(state.accounts).reduce((s, a) => s + a.balance, 0);
}

function monthSummary() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let income = 0, expense = 0;
  state.transactions.forEach(t => {
    if (!t.date.startsWith(ym)) return;
    if (t.type === 'income')  income  += t.amount;
    if (t.type === 'expense') expense += t.amount;
  });
  return { income, expense, balance: income - expense };
}

function txForAccount(key) {
  return state.transactions
    .filter(t => t.account === key || t.toAccount === key)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
