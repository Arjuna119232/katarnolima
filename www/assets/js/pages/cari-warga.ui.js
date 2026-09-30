/**
 * KATARNOLIMA — pages/cari-warga.ui.js
 * Logika halaman «cari-warga» — skrip UI.
 */

// @ts-nocheck
// DATABASE KELENGKAPAN SELURUH LAYANAN APLIKASI KATARNOLIMA RW 05
const dataLayanan = [
  // LAPORAN & ADUAN
  {k:'Aduan Warga', d:'Lapor masalah fasilitas atau kejadian di RW 05', i:'📢', cat:'laporan', kw:'aduan lapor masalah aduan warga foto video lapor', link:'aduan-warga.html'},
  {k:'Kamera Lapor Langsung', d:'Ambil foto/video laporan langsung dari kamera', i:'📷', cat:'laporan', kw:'kamera foto bukti lapor foto langsung', link:'aduan-warga.html?autoOpen=1'},
  {k:'Keamanan & Satpam', d:'Informasi jadwal ronda, petugas satpam, & himbauan', i:'🛡️', cat:'laporan', kw:'keamanan satpam ronda jadwal pos jam jaga', link:'javascript:void(0)', isModal:'satpam'},
  {k:'Lingkungan Bersih', d:'Jadwal kerja bakti & pembersihan saluran', i:'🧹', cat:'laporan', kw:'lingkungan bersih kerja bakti gotong royong sampah', link:'javascript:void(0)', isModal:'lingkungan'},

  // IURAN & KEUANGAN
  {k:'Iuran Warga', d:'Cek & bayar iuran bulanan warga RW 05', i:'💰', cat:'iuran', kw:'iuran kas bayar tagihan bulanan transfer qris', link:'iuran-warga.html'},
  {k:'Kas Karang Taruna RW 05', d:'Rincian saldo kas & laporan keuangan terbuka', i:'💵', cat:'iuran', kw:'kas saldo uang rincian keuangan akumulasi', link:'kas-detail.html'},
  {k:'Harga Sembako', d:'Patokan harga bahan pokok di pasar setempat', i:'🛒', cat:'iuran', kw:'sembako harga pasar beras minyak telur toko', link:'javascript:void(0)', isModal:'sembako'},

  // BERITA & INFORMASI
  {k:'Berita RW 05', d:'Baca berita resmi & pengumuman warga bebas hoaks', i:'📰', cat:'berita', kw:'berita kabar pengumuman artikel informasi', link:'berita-rw.html'},
  {k:'Notifikasi & Info Singkat', d:'Pengumuman penting & pemadaman dari RW 05', i:'🔔', cat:'berita', kw:'notifikasi info pengumuman darurat listrik', link:'../info.html'},
  {k:'Forum Diskusi Warga', d:'Ruang obrolan & saran antar warga RW 05', i:'💬', cat:'berita', kw:'diskusi forum pesan obrolan masyarakat komplain', link:'../diskusi-rw.html'},
  {k:'Posyandu Balita & Lansia', d:'Jadwal layanan kesehatan & imunisasi', i:'👶', cat:'berita', kw:'posyandu bayi balita imunisasi lansia cek kesehatan', link:'javascript:void(0)', isModal:'posyandu'},
  {k:'Belajar Bersama & Kegiatan', d:'Bimbel anak & program Karang Taruna', i:'📚', cat:'berita', kw:'belajar bimbel kegiatan pemuda pelatihan anak', link:'javascript:void(0)', isModal:'belajar'},

  // DARURAT
  {k:'Panggilan Darurat 112', d:'Telepon darurat resmi bebas pulsa', i:'📞', cat:'darurat', kw:'darurat panggilan 112 telepon darurat pertolongan', link:'tel:112'},
  {k:'Ambulans RW 05', d:'Panggil ambulans 24 jam khusus RW 05', i:'🚑', cat:'darurat', kw:'ambulans sakit rumah sakit darurat medis', link:'https://wa.me/6289673580756?text=Butuh%20Ambulans%20RW05%20DARURAT'},
  {k:'Lapor Banjir RW 05', d:'Laporan genangan & siaga banjir', i:'🌊', cat:'darurat', kw:'banjir air hujan genangan pompa siaga', link:'https://wa.me/6289673580756?text=Lapor%20Banjir%20RW05'},

  // FASILITAS & WILAYAH
  {k:'Balai Serbaguna & Rumah Singgah', d:'Pinjam balai warga untuk acara / rumah singgah', i:'🏝️', cat:'fasilitas', kw:'balai gedung rumah singgah pinjam acara rapat', link:'berita-rw.html'},
  {k:'Peta Lokasi Balai RW 05', d:'Alamat & navigasi Google Maps Balai RW 05', i:'📍', cat:'fasilitas', kw:'peta balai alamat lokasi maps google peta', link:'javascript:void(0)', isModal:'petaBalai'},
  {k:'Panduan Warga Baru', d:'Lapor diri & pengurusan KK/KTP di RW 05', i:'👩‍🌾', cat:'fasilitas', kw:'warga baru lapor diri pendatang kk ktp', link:'semua-layanan.html'},
  {k:'Semua Layanan Katalog', d:'Lihat daftar lengkap seluruh fitur di RW 05', i:'⊞', cat:'fasilitas', kw:'semua layanan katalog fitur lengkap', link:'semua-layanan.html'},

  // PROFIL & AKUN
  {k:'Profil Saya & Data Warga', d:'Atur akun warga, RT, & nomor identitas', i:'👤', cat:'profil', kw:'profil akun data warga login register nama rt', link:'../profil.html'},
  {k:'Data Warga & Sekretaris RW', d:'Hubungi sekretaris RW untuk pengurusan dokumen', i:'📋', cat:'profil', kw:'data warga surat pengantar sekretaris wa', link:'javascript:void(0)', isModal:'datawarga'},
  {k:'Saran & Lapor Bug Aplikasi', d:'Kirim masukan / laporan error aplikasi ke admin', i:'💡', cat:'profil', kw:'saran bug error pesan usul admin', link:'https://wa.me/6289673580756?text=Saran%20Fitur%20RW05'}
];

const inputCari = document.getElementById('inputCari');
const btnClearInput = document.getElementById('btnClearInput');
const hasilCari = document.getElementById('hasilCari');
const chipRow = document.getElementById('chipRow');
let filterAktif = 'semua';

function renderHasil(query){
  const q = query.toLowerCase().trim();

  if(btnClearInput) {
    btnClearInput.style.display = q.length > 0 ? 'flex' : 'none';
  }

  let filtered = dataLayanan.filter(function(item){
    const matchQ = item.k.toLowerCase().includes(q) || 
                   item.d.toLowerCase().includes(q) || 
                   (item.kw && item.kw.toLowerCase().includes(q));

    if(filterAktif !== 'semua'){ 
      return item.cat === filterAktif && (q === '' || matchQ); 
    }
    return q === '' ? true : matchQ;
  });

  if(filtered.length === 0){
    hasilCari.innerHTML = `
      <div class="state-box">
        <span class="state-icon">📭</span>
        <div class="state-title">Tidak Ada Hasil</div>
        <div class="state-desc">Tidak ditemukan layanan untuk kata kunci "${escapeHtml(query)}".</div>
      </div>
    `;
    return;
  }

  hasilCari.innerHTML = filtered.map(function(item){
    const onclickAttr = item.isModal 
      ? `onclick="triggerModalParent('${item.isModal}')"` 
      : '';

    return `
      <a href="${item.link}" ${onclickAttr} class="result-item">
        <div class="result-icon cat-${item.cat}">${item.i}</div>
        <div class="result-info">
          <div class="result-title">${escapeHtml(item.k)}</div>
          <div class="result-desc">${escapeHtml(item.d)}</div>
        </div>
        <span class="result-arrow">➔</span>
      </a>
    `;
  }).join('');
}

function triggerModalParent(type) {
  if (window.opener && typeof window.opener.openUniversalModalIndex === 'function') {
    window.opener.openUniversalModalIndex(type);
    window.close();
  } else if (parent && typeof parent.openUniversalModalIndex === 'function') {
    parent.openUniversalModalIndex(type);
  } else {
    window.location.href = `../index.html?openModal=${type}`;
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

inputCari.addEventListener('input', function(){ renderHasil(this.value); });

if(btnClearInput) {
  btnClearInput.addEventListener('click', function(){
    inputCari.value = '';
    inputCari.focus();
    renderHasil('');
  });
}

chipRow.addEventListener('click', function(e){
  if(e.target.classList.contains('chip')){
    document.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); });
    e.target.classList.add('active');
    filterAktif = e.target.getAttribute('data-filter');
    renderHasil(inputCari.value);
  }
});

renderHasil('');

// --- PENANGANAN NAVIGASI BACK SISTEM HP AGAR KE INDEX.HTML ---
function goToIndex() {
  window.location.href = '../index.html';
}

// Menahan riwayat halaman saat dibuka agar gesture back menangkap event popstate
window.history.pushState({ page: 'cari-warga' }, '', window.location.href);

window.addEventListener('popstate', function(e) {
  goToIndex();
});

document.getElementById('backBtn').addEventListener('click', function(e){
  e.preventDefault();
  goToIndex();
});
