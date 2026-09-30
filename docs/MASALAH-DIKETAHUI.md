# Masalah yang Sudah Diketahui

Ditemukan saat restrukturisasi. Tidak diubah otomatis agar perilaku aplikasi tetap sama; butuh keputusan pemilik.

| # | Masalah | Lokasi | Saran |
|---|---|---|---|
| 1 | Tautan "Lihat Semua" menuju `aktivitas.html` yang **tidak ada** | `pages/aduan-warga.html` | Buat halamannya atau hapus/ubah tautan |
| 2 | Gambar QRIS `assets/img/qris-rw05.jpg` **tidak ada** di proyek | `pages/iuran-warga.html` | Tambahkan gambar QRIS resmi |
| 3 | `cari-warga.html` dulu memuat `../script.js` (path salah → 404), jadi halaman ini **tidak** mendapat fitur core (splash, banner offline, dll.). Tag rusak dihapus; halaman punya handler Back sendiri | `pages/cari-warga.html` | Bila ingin fitur core, tambahkan tag core lalu **uji tombol Back** (bisa bentrok dengan handler sendiri) |
| 4 | ~~Aset tidak dirujuk kode~~ **Ditangani:** `kegiatan-1..5.jpg` dan `kegiatan.mp4` (≈ 6,9 MB) dipindah ke `assets-source/media-belum-dipakai/` (di luar APK) | `assets-source/` | Hapus permanen bila memang tidak akan dipakai, atau kompres lalu kembalikan ke `www/assets/` |
| 5 | Ikon PNG 2,3 MB (2048×2048) | `www/assets/img/katar-app-icon.png` | Jangan sekadar diperkecil: `generate_icons.py` memakai ukuran asli sebagai kanvas. Ubah skripnya bersamaan bila ikon dikecilkan (mis. kompres PNG tanpa mengubah dimensi) |
| 6 | Kode memanggil plugin AdMob, tetapi CI tidak memasang `@capacitor-community/admob`; ID iklan masih ID **uji**; manifest lama memuat App ID AdMob | `core/admob.js` | Putuskan: pasang plugin + ID resmi, atau hapus fitur |
| 7 | ~~`admin.js` ±1.160 baris~~ **Ditangani:** dipecah menjadi `js/pages/admin/` (14 modul fitur + shared). Sisa: `admin.css` (±470 baris) masih satu berkas, dan banyak gaya inline di template HTML string | `css/pages/admin.css` | Pecah CSS per tab; pindahkan gaya inline berulang ke kelas CSS |
| 8 | Tes otomatis baru mencakup panel admin (`tests/`) | `tests/` | Perluas ke halaman lain (`home.js`, `aduan-warga.js`, `profil.js`) dengan pola stub yang sama |
| 9 | Versi library npm di CI tidak dipatok (selalu terbaru) | `build-apk.yml` | Patok versi + commit `package-lock.json` agar build dapat diulang |
| 10 | **Sebagian ditangani:** panel admin kini memakai `escapeHtml`/`jsArg`/`safeUrl` (`admin/shared/format.js`) untuk semua data Firestore yang masuk ke `innerHTML`, dan diuji di `tests/`. **Sisa:** halaman warga masih menyisipkan data tanpa disaring | `js/pages/home.js`, `aduan-warga.js`, `berita-rw.js`, `detail-berita.js`, `diskusi-rw.js`, `info.js`, `iuran-warga.js`, `kas-detail.js`, `profil.js`, `cari-warga.ui.js` | Pindahkan helper ke `assets/js/core/` atau `services/` agar dipakai semua halaman, lalu terapkan dengan pola yang sama |
| 11 | `hapusWarga` hanya menghapus dokumen `users_profile`, bukan akun Firebase Auth-nya | `admin/features/warga.js` | Putuskan alur penghapusan akun (butuh Cloud Function / Admin SDK) |
