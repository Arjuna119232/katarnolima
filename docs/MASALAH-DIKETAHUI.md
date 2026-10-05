# Masalah yang Sudah Diketahui

Ditemukan saat restrukturisasi dan audit 2026-10-06.

## Sudah ditangani

| # | Masalah |Status |
|---|---|---|
| 1 | Tautan "Lihat Semua" menuju `aktivitas.html` yang tidak ada | **Selesai** — tautan dihapus di 2.2.0 |
| 2 | Gambar QRIS `qris-rw05.jpg` tidak ada | **Selesai** — blok QRIS disembunyikan, placeholder dipakai sementara |
| 3 | `cari-warga.html` memuat `../script.js` (path salah → 404) | **Selesai** — tag rusak dihapus |
| 4 | Aset `kegiatan-1..5.jpg` + `kegiatan.mp4` (± 6,9 MB) tidak dirujuk | **Selesai** — dipindah ke `assets-source/media-belum-dipakai/` (di luar APK) |
| 5 | ~1.160 baris `admin.js` | **Selesai** — dipecah jadi `js/pages/admin/` (14 modul fitur + shared) |
| 6 | Halaman warga menempelkan data Firestore ke `innerHTML` tanpa disaring | **Selesai** — kini memakai `core/safe.js` + ada tes regresi `tests/warga.xss.test.mjs` |
| 7 | Rujukan rusak yang lama sudah ada di `KNOWN_BROKEN` | **Selesai** — daftarnya dihapus, validate jadi 0 error / 0 peringatan |
| 8 | `test-viewport.html` (alat bantu dev) ikut terkirim di APK | **Selesai** — dipindah ke `assets-source/` |
| 9 | ID AdMob berbeda di 3 tempat | **Selesai** — `native/admob.config.json` jadi satu-satunya sumber |
| 10 | `junit/`, `LICENSE-junit.txt`, `*.proto` ikut di APK | **Selesai** — dibuang `scripts/patch_android.py cleanup` |
| 11 | Plugin AdMob tidak mendukung native ads; banner di semua halaman & card "Ruang Iklan" justru disembunyikan | **Selesai (2026-10-06)** — banner sekarang duduk persis di dalam `#admob-native-card` di beranda; UMP consent ditambahkan; `isTesting` dikendalikan dari `native/admob.config.json` |

## Belum ditangani — butuh keputusan pemilik

| # | Masalah | Lokasi | Saran |
|---|---|---|---|
| 11 | Ikon PNG 2,3 MB (2048×2048) = 15% ukuran APK | `www/assets/img/katar-app-icon.png` | Jangan sekadar diperkecil: `generate_icons.py` memakai ukuran asli sebagai kanvas. Ubah skripnya bersamaan, atau kompres PNG **tanpa mengubah dimensi** |
| 12 | `admin.css` (± 470 baris) masih satu berkas + banyak gaya inline di template HTML string | `css/pages/admin.css`, modul `admin/features/*` | Pecah CSS per tab; pindahkan gaya inline berulang ke kelas CSS |
| 13 | Tes otomatis hanya mencakup panel admin + 3 halaman warga | `tests/` | Perluas ke `home.js`, `aduan-warga.js`, `profil.js`, `iuran-warga.js` dengan pola stub yang sama |
| 14 | Versi library npm di CI tidak dipatok (selalu terbaru) | `build-apk.yml` | Patok versi + commit `package-lock.json` agar build dapat diulang |
| 15 | `native/AndroidManifest.reference.xml` perlu disinkronkan dengan output CI | `native/AndroidManifest.reference.xml` | Sudah dihapus tag AdMob yang salah. File ini hanya dokumentasi; jangan dijadikan sumber kebenaran |
| 16 | `media-belum-dipakai/` (± 6,9 MB) masih menumpuk lokal | `assets-source/` | Hapus permanen bila memang tidak akan dipakai, atau kompres lalu kembalikan ke `www/assets/img/` |
| 17 | `hapusWarga` hanya menghapus dokumen `users_profile`, bukan akun Firebase Auth | `admin/features/warga.js` | Butuh Cloud Function / Admin SDK. Putuskan alurnya |
| 18 | Repo GitHub **publik** berisi seluruh source + docs | GitHub | Pertimbangkan privat, atau pastikan tidak ada yang sensitif. API key Firebase Web memang publik by design — lindungi lewat App Check + pembatasan key |
| 20 | Kotlin dipatok `1.8.22` padahal Capacitor 8 butuh yang lebih baru | `native/signing.gradle` | Berisiko `NoSuchMethodError` saat runtime — harus diuji di perangkat nyata sebelum rilis |
| 22 | Hanya 1 tayangan iklan (1 banner di beranda) — pendapatan kecil | `www/assets/js/core/admob.js` | Tambahkan **interstitial** saat pindah halaman: `prepareInterstitial()` + `showInterstitial()`. Format paling dihargai AdMob dan didukung penuh plugin ini |
| 23 | Native ads butuh plugin Java sendiri (±200 baris) + ad unit "Native Advanced" baru | — | Baru dikerjakan setelah 2.3.0 stabil di perangkat |