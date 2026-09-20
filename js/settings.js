/* =========================================================
   SETTINGS — halaman pengaturan, export, import, reset
========================================================= */

function renderSettings() {
  pageTitle.textContent = 'Pengaturan';
  backBtn.classList.remove('hidden');
  settingsBtn.classList.add('hidden');

  const txCount = (state.transactions || []).length;
  const debtCount = (state.debts || []).length;

  // hitung ukuran data di localStorage
  const raw = localStorage.getItem(STORAGE_KEY) || '';
  const sizeKB = (new Blob([raw]).size / 1024).toFixed(1);

  app.innerHTML = `
    <div class="card">
      <div class="balance-label">Ringkasan Data</div>
      <div class="setting-row">
        <span>Transaksi</span>
        <span>${txCount} entri</span>
      </div>
      <div class="setting-row">
        <span>Hutang / Piutang</span>
        <span>${debtCount} entri</span>
      </div>
      <div class="setting-row">
        <span>Ukuran data tersimpan</span>
        <span>${sizeKB} KB</span>
      </div>
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">Backup</div>
      <div class="setting-row">
        <div>
          <div>Export JSON</div>
          <div class="label">Simpan semua data ke file .json</div>
        </div>
        <button class="btn-primary" onclick="handleExport()">Export</button>
      </div>
      <div class="setting-row">
        <div>
          <div>Import JSON</div>
          <div class="label">Pulihkan data dari file backup</div>
        </div>
        <button class="btn-primary" onclick="triggerImport()">Import</button>
      </div>
      <input type="file" id="importFile" accept="application/json,.json" class="hidden" />
    </div>

    <div class="card">
      <div class="balance-label" style="margin-bottom:8px">Bahaya</div>
      <div class="setting-row">
        <div>
          <div>Reset Semua Data</div>
          <div class="label">Hapus semua saldo, transaksi, dan hutang</div>
        </div>
        <button class="btn-danger" onclick="handleReset()">Reset</button>
      </div>
    </div>

    <div class="card">
      <div class="balance-label">Tentang</div>
      <div class="setting-row">
        <span>Aplikasi</span>
        <span>DompetSantri v${APP_VERSION}</span>
      </div>
      <div class="setting-row">
        <span>Penyimpanan</span>
        <span>Lokal (localStorage)</span>
      </div>
    </div>
  `;

  // Attach file input listener
  document.getElementById('importFile').addEventListener('change', handleFileChosen);
}

/* ---------- EXPORT ---------- */
function handleExport() {
  try {
    exportData();
    showToast('Data berhasil diexport ✅', 'success');
  } catch (e) {
    console.error(e);
    showToast('Gagal export data', 'error');
  }
}

/* ---------- IMPORT ---------- */
function triggerImport() {
  const input = document.getElementById('importFile');
  input.value = '';
  input.click();
}

function handleFileChosen(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    let obj;
    try {
      obj = JSON.parse(ev.target.result);
    } catch (err) {
      showToast('File bukan JSON yang valid', 'error');
      return;
    }
    const err = validateImport(obj);
    if (err) { showToast(err, 'error'); return; }
    openImportConfirmModal(obj);
  };
  reader.onerror = () => showToast('Gagal membaca file', 'error');
  reader.readAsText(file);
}

function openImportConfirmModal(obj) {
  const d = obj.data;
  const txCount = (d.transactions || []).length;
  const debtCount = (d.debts || []).length;
  const accCount = Object.keys(d.accounts || {}).length;

  modalContent.innerHTML = `
    <h2>Import Data <button onclick="closeModal()">✕</button></h2>
    <div class="card" style="background:var(--bg);margin-bottom:12px">
      <div class="setting-row">
        <span>Diexport pada</span>
        <span>${obj.exportedAt ? obj.exportedAt.slice(0, 19).replace('T', ' ') : '-'}</span>
      </div>
      <div class="setting-row">
        <span>Versi</span>
        <span>${obj.version || '-'}</span>
      </div>
      <div class="setting-row">
        <span>Akun</span>
        <span>${accCount}</span>
      </div>
      <div class="setting-row">
        <span>Transaksi</span>
        <span>${txCount}</span>
      </div>
      <div class="setting-row">
        <span>Hutang/Piutang</span>
        <span>${debtCount}</span>
      </div>
    </div>

    <div class="form-group">
      <label>Mode Import</label>
      <select id="importMode">
        <option value="replace">Ganti semua data (replace)</option>
        <option value="merge">Gabung dengan data sekarang (merge)</option>
      </select>
    </div>

    <p style="font-size:12px;color:var(--muted);margin:8px 0">
      <b>Replace</b>: semua data lama akan ditimpa.<br>
      <b>Merge</b>: saldo akun dari file dipakai, transaksi & hutang ditambahkan (tanpa duplikat id).
    </p>

    <button class="submit" onclick="confirmImport()">IMPORT SEKARANG</button>
  `;
  modalBackdrop.classList.add('show');

  // simpan payload sementara
  window.__pendingImport = obj;
}

function confirmImport() {
  const obj = window.__pendingImport;
  if (!obj) { showToast('Tidak ada data untuk di-import', 'error'); return; }

  const mode = document.getElementById('importMode').value;
  try {
    applyImport(obj, mode);
    window.__pendingImport = null;
    closeModal();
    showToast(`Import berhasil (${mode}) ✅`, 'success');
    currentPage = 'dashboard';
    render();
  } catch (e) {
    console.error(e);
    showToast('Gagal import data', 'error');
  }
}

/* ---------- RESET ---------- */
function handleReset() {
  const ok = confirm(
    'Yakin ingin menghapus SEMUA data?\n\n' +
    'Semua saldo, transaksi, dan hutang akan hilang.\n' +
    'Disarankan export dulu sebagai backup.'
  );
  if (!ok) return;

  const ok2 = confirm('Konfirmasi sekali lagi: data tidak dapat dikembalikan. Lanjutkan?');
  if (!ok2) return;

  resetData();
  showToast('Data berhasil direset', 'success');
  currentPage = 'dashboard';
  render();
}

/* ---------- TOAST ---------- */
let toastTimer = null;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = 'toast' + (type ? ' ' + type : '');
  }, 2500);
}
