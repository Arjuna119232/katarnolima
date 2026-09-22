// @ts-nocheck
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZtvImbyZmqoEoY1hYZcuCbUpIl3R1fhE",
  authDomain: "katarnolima-rw05.firebaseapp.com",
  projectId: "katarnolima-rw05",
  storageBucket: "katarnolima-rw05.firebasestorage.app",
  messagingSenderId: "965647612835",
  appId: "1:965647612835:web:b712367f0d8beb7c5bf816"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DATA DEFAULT (JIKA FIRESTORE BELUM ADA ISI / OFFLINE)
const defaultBerita = [
  {
    kategori: 'kegiatan',
    kategoriLabel: 'Kegiatan',
    ikon: '🌸',
    judul: 'Kerja Bakti Akbar RW 05 Minggu Ke-3 di Lapangan Poncol Jaya',
    isi: 'Diharapkan seluruh warga RW 05 hadir membawa peralatan kebersihan masing-masing.',
    tanggal: '20 Sep 2026',
    penulis: 'Balai Warga RW 05'
  },
  {
    kategori: 'pengumuman',
    kategoriLabel: 'Pengumuman',
    ikon: '📢',
    judul: 'Jadwal Ronda Malam Bulan Ini - RT 01 Sampai RT 07',
    isi: 'Petugas rondal harap hadir tepat waktu mulai pukul 22:00 WIB.',
    tanggal: '19 Sep 2026',
    penulis: '22:00 - 04:00 WIB'
  },
  {
    kategori: 'iuran',
    kategoriLabel: 'Iuran',
    ikon: '💰',
    judul: 'Laporan Transparansi Kas RW 05 Bulan Ini',
    isi: 'Rincian penerimaan dan pengeluaran kas bulanan dapat diakses secara terbuka.',
    tanggal: '18 Sep 2026',
    penulis: 'Bendahara RW 05'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const beritaList = document.getElementById('beritaList');
  const loadingBerita = document.getElementById('loadingBerita');

  function renderList(items) {
    if (loadingBerita) loadingBerita.style.display = 'none';
    if (!beritaList) return;

    if (!items || items.length === 0) {
      beritaList.innerHTML = '<div style="text-align:center; padding:30px; color:#94a3b8; font-size:12px;">Belum ada berita yang dipublikasikan.</div>';
      return;
    }

    let html = '';
    items.forEach((data) => {
      let catClass = 'cat-kegiatan';
      if (data.kategori === 'pengumuman') catClass = 'cat-pengumuman';
      if (data.kategori === 'iuran') catClass = 'cat-iuran';

      html += `<div class="berita-item" data-cat="${data.kategori || 'kegiatan'}">
        <div class="berita-thumb">${data.ikon || '📢'}</div>
        <div class="berita-content">
          <span class="berita-cat ${catClass}">${data.kategoriLabel || 'Info'}</span>
          <h3>${data.judul || ''}</h3>
          <div style="font-size:12px; color:#475569; margin-top:4px; line-height:1.4;">${data.isi || ''}</div>
          <div class="berita-meta">${data.tanggal || ''} • ${data.penulis || 'Pengurus RW 05'}</div>
        </div>
      </div>`;
    });

    beritaList.innerHTML = html;
  }

  // BACA REALTIME FIRESTORE (TANPA ORDER BY AGAR BEBAS INDEX ERROR)
  try {
    const q = query(collection(db, "berita_rw05"));
    onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const listData = [];
        snapshot.forEach((doc) => listData.push(doc.data()));
        renderList(listData);
      } else {
        // Jika koleksi di Firestore masih kosong, tampilkan data default
        renderList(defaultBerita);
      }
    }, (err) => {
      console.warn('Firestore Error, memuat data default:', err);
      renderList(defaultBerita);
    });
  } catch (e) {
    console.warn('Error init Firestore:', e);
    renderList(defaultBerita);
  }

  // LOGIKA TAB FILTER
  window.setFilter = function(cat, el) {
    document.querySelectorAll('.filter-light .f-tab').forEach((tab) => tab.classList.remove('active'));
    if (el) el.classList.add('active');

    document.querySelectorAll('#beritaList .berita-item').forEach((item) => {
      if (cat === 'semua' || item.getAttribute('data-cat') === cat) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  };

  // LOGIKA MODAL POPUP
  const bannerUpdate = document.getElementById('openUpdateModal');
  const modalUpdate = document.getElementById('updateModal');
  const closeBtn = document.getElementById('closeUpdateModal');
  const btnPaham = document.getElementById('btnPaham');

  if (bannerUpdate && modalUpdate) bannerUpdate.addEventListener('click', () => modalUpdate.classList.add('show'));
  if (closeBtn && modalUpdate) closeBtn.addEventListener('click', () => modalUpdate.classList.remove('show'));
  if (btnPaham && modalUpdate) btnPaham.addEventListener('click', () => modalUpdate.classList.remove('show'));
});
