/**
 * KATARNOLIMA — pages/kas-detail.js
 * Logika halaman «kas-detail» — modul (Firebase/data).
 */

// @ts-nocheck
import { app } from "../services/firebase.js";
import { getFirestore, doc, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

// LISTEN SALDO UTAMA REALTIME
onSnapshot(doc(db, "kas_rw05", "saldo_utama"), (snap) => {
  if (snap.exists()) {
    const total = snap.data().total || 0;
    const el = document.getElementById('detailTotalSaldo');
    if (el) el.textContent = 'Rp ' + Number(total).toLocaleString('id-ID');
  }
});

// LISTEN RIWAYAT TRANSAKSI REALTIME
const listContainer = document.getElementById('listDetailTransaksi');
onSnapshot(query(collection(db, "transaksi_kas"), orderBy("createdAt", "desc")), (snap) => {
  if (!listContainer) return;
  if (snap.empty) {
    listContainer.innerHTML = `
      <div class="state-box">
        <span class="state-icon">📭</span>
        Belum ada catatan transaksi kas masuk atau keluar saat ini.
      </div>
    `;
    return;
  }

  let html = '';
  snap.forEach(docItem => {
    const d = docItem.data();
    const isMasuk = d.jenis === 'masuk';
    const sign = isMasuk ? '+' : '-';
    const cls = isMasuk ? 'masuk' : 'keluar';
    const iconSymbol = isMasuk ? '📈' : '📉';

    html += `
      <div class="trans-item">
        <div class="trans-left-group">
          <div class="trans-icon ${cls}">${iconSymbol}</div>
          <div class="trans-info">
            <b>${escapeHtml(d.keterangan || 'Transaksi Kas')}</b>
            <span>${escapeHtml(d.tanggalFormatted || '-')}</span>
          </div>
        </div>
        <div class="trans-right ${cls}">${sign}Rp ${Number(d.jumlah || 0).toLocaleString('id-ID')}</div>
      </div>
    `;
  });

  listContainer.innerHTML = html;
}, (err) => {
  console.error("Gagal load transaksi kas:", err);
  if (listContainer) {
    listContainer.innerHTML = `
      <div class="state-box">
        <span class="state-icon">❌</span>
        Gagal memuat transaksi kas. Periksa koneksi internet Anda.
      </div>
    `;
  }
});
