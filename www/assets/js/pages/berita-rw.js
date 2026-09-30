/**
 * KATARNOLIMA — pages/berita-rw.js
 * Logika halaman «berita-rw» — modul (Firebase/data).
 */

// @ts-nocheck
import { app } from "../services/firebase.js";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);

// LOGIKA PENANGAAN BACK HARDWARE HP & TOMBOL HEADER
const handleHardwareBackButtonPages = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
    window.history.back();
  } else {
    window.location.href = '../index.html';
  }
};

if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  window.Capacitor.Plugins.App.removeAllListeners();
  window.Capacitor.Plugins.App.addListener('backButton', handleHardwareBackButtonPages);
} else {
  document.removeEventListener('backbutton', handleHardwareBackButtonPages);
  document.addEventListener('backbutton', handleHardwareBackButtonPages, false);
}

function renderBerita(list) {
  const container = document.getElementById('listBeritaRealtime');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="state-box">
        <span class="state-icon">📭</span>
        Belum ada berita atau informasi publikasi saat ini.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const isUrgent = item.prioritas === 'urgent';
    const ikonKat = item.ikon || '🌸';
    const katLabel = item.kategoriLabel || 'Kegiatan Warga';
    const detailUrl = item.id ? `detail-berita.html?id=${item.id}` : 'detail-berita.html';
    const thumbHtml = item.fotoBase64 
      ? `<div class="news-thumb-wrap"><img src="${item.fotoBase64}" class="news-card-thumb" alt="Foto Berita" loading="lazy"></div>` 
      : '';

    return `
      <div class="news-card-item ${isUrgent ? 'urgent' : ''}">
        ${thumbHtml}
        <div class="news-card-content">
          <span class="news-card-badge">${ikonKat} ${katLabel} ${isUrgent ? '• MENDESAK' : ''}</span>
          <div class="news-card-title">${item.judul || 'Tanpa Judul'}</div>
          <div class="news-card-desc">${item.isi || ''}</div>
          <div class="news-card-meta">
            <span>✍️ ${item.penulis || 'Pengurus RW 05'}</span>
            <span>📅 ${item.tanggal || '-'}</span>
          </div>
          <div style="margin-top: 14px; text-align: right;">
            <a href="${detailUrl}" class="btn-read-more">Baca Selengkapnya →</a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const btnBackHeader = document.getElementById('btnBackHeader');
  if (btnBackHeader) {
    btnBackHeader.addEventListener('click', (e) => {
      e.preventDefault();
      handleHardwareBackButtonPages(e);
    });
  }

  // KUOTA OPTIMIZATION: DIBATASI HANYA MEMUAT 10 BERITA TERBARU
  const qBerita = query(collection(db, "berita_rw05"), orderBy("createdAt", "desc"), limit(10));

  onSnapshot(qBerita, 
    (snap) => {
      let allBeritaData = [];
      snap.forEach(docSnap => {
        allBeritaData.push({ id: docSnap.id, ...docSnap.data() });
      });

      renderBerita(allBeritaData);
    },
    (error) => {
      console.error("Error Firestore:", error);
      renderBerita([]);
    }
  );
});
