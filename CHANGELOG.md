# Changelog

## [2.2.0] — Update Notifikasi & Perbaikan

### Fitur
- **Notifikasi push (FCM)**: token perangkat kini otomatis disimpan ke Firestore di `users_profile/{uid}/fcmTokens` setelah izin diberikan, sehingga admin dapat mengirim notifikasi ke perangkat warga melalui Firebase Console.
- **Keamanan**: `google-services.json` dikeluarkan dari repositori dan disimpan di GitHub Secrets; CI otomatis me-restore-nya saat build APK.

### Perbaikan
- Hapus tautan "Lihat Semua" di `aduan-warga.html` yang mengarah ke `aktivitas.html` (halaman tidak ada).
- Sembunyikan blok QRIS di `iuran-warga.html` karena gambar `qris-rw05.jpg` belum tersedia; metode transfer bank tetap tampil.

### Catatan
- API Key Firebase dan VAPID Key telah melalui audit; API Key perlu dibatasi di Google Cloud Console (lihat `docs/KEAMANAN.md`).
- Folder `assets-source/media-belum-dipakai/` dikecualikan dari Git untuk menjaga ukuran repositori (tetap tersimpan lokal).


## [Restrukturisasi tahap 2]

### Struktur
- `js/pages/admin.js` (1.160 baris) dipecah menjadi folder `js/pages/admin/`: `main.js` (titik masuk), `firebase.js`, `auth-gate.js`, `ui.js`, `settings.js`, `shared/` (modal, format, image) dan 14 modul di `features/` (satu per tab). Kode fitur dipindahkan tanpa perubahan isi; `pages/admin.html` kini memuat `admin/main.js`.
- `kegiatan-1..5.jpg` dan `kegiatan.mp4` (tidak dirujuk kode, ±6,9 MB) dipindah ke `assets-source/media-belum-dipakai/` — di luar `www/`, jadi APK lebih kecil. Tidak ada berkas yang dihapus.

### Tooling
- `tests/` (Node bawaan, tanpa dependensi): uji asap panel admin dengan Firebase & DOM tiruan, uji kelengkapan handler `window.*`, uji fungsi format. Skrip baru: `npm test`, `npm run check`.
- Job `validate` di CI kini juga menjalankan `npm test`.
- `package.json`: tambah `engines` (Node ≥ 20.6).

### Perbaikan
- Splash screen native Android kini memakai logo aplikasi (`scripts/generate_splash.py`, dijalankan CI). Sebelumnya tidak pernah diganti, sehingga memakai gambar bawaan Capacitor.
- Keamanan (panel admin): data Firestore yang disisipkan ke `innerHTML` kini disaring dengan `escapeHtml`; argumen `onclick` memakai `jsArg`; URL gambar/tautan memakai `safeUrl` (menolak `javascript:`). Diuji otomatis, termasuk uji dengan data jahat.
- `initAdmin()` dijaga agar hanya berjalan sekali (sebelumnya bisa menggandakan listener Firestore bila status login berubah).

### Tidak berubah
- Tampilan dan logika fitur admin; halaman lain.

## [Restrukturisasi] — dari 2.1.247

### Struktur
- Seluruh kode web dipindah ke `www/` (sesuai `webDir` Capacitor; tidak perlu lagi `rsync` di CI).
- CSS/JS inline di 15 halaman dipindah ke `assets/css/pages/*.css` dan `assets/js/pages/*.js`; HTML kini hanya markup.
- `script.js` (434 baris) dipecah menjadi 7 modul di `assets/js/core/` dengan urutan eksekusi yang sama.
- Konfigurasi Firebase yang terduplikasi di 13 tempat dipusatkan ke `assets/js/services/firebase.js`.
- `style.css` → `css/base/global.css`, `theme.css` → `css/base/theme.css`; `theme.js` → `js/core/theme.js`; snippet tema inline → `js/core/theme-init.js`.
- Ikon duplikat (`icon.png` di root) dihapus; satu sumber di `www/assets/img/katar-app-icon.png`.

### Tooling
- `scripts/validate.py` (rujukan, import, sintaks, duplikasi Firebase) dan job `validate` di CI.
- Kode Java/Gradle/izin/Python yang tertanam di YAML dipindah ke `native/` dan `scripts/`.
- Workflow: `versionCode` kini naik otomatis (`VERSION_CODE_BASE + run number`), `versionName` dari `package.json`; `softprops/action-gh-release` v1 → v2.
- Ditambahkan `.gitignore`, `.editorconfig`, `package.json`, dokumentasi di `docs/`.

### Perbaikan
- Tag `../script.js` salah path di `cari-warga.html` dihapus (lihat MASALAH-DIKETAHUI #3).
- Atribut tidak valid `stroke="false"` pada manifest referensi diperbaiki.
- `allowMixedContent` dihapus dari konfigurasi Capacitor (CI memang sudah menimpanya tanpa opsi itu).
- `hashNIK` di `firebase-config.js` lama tidak dipakai di mana pun sehingga dihapus bersama file tersebut.

### Tidak berubah
- Logika, tampilan, dan urutan eksekusi kode aplikasi.
