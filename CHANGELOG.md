# Changelog

## [2.3.6] — Splash tunggal & pop-up perizinan (2026-10-08)

### Splash
- Hapus splash kedua (overlay web). Kini hanya splash native Android.

### Perizinan
- **Bug:** popup izin tidak muncul karena kode meminta izin foto yang sudah
  dibuang dari manifest, sehingga permintaan berulang sampai Android berhenti
  menampilkan dialog.
- `core/permissions.js` (baru): halaman izin sekali saat pertama buka, berisi
  alasan tiap izin dalam bahasa warga sebelum dialog sistem muncul.
- Izin diminta berurutan satu per satu (notifikasi → kamera → lokasi).
- Hanya izin `camera` yang diminta — aplikasi memotret lewat `getUserMedia`,
  jadi `READ_MEDIA_IMAGES` tidak diperlukan.
- Izin yang ditolak permanen diarahkan ke Pengaturan aplikasi via
  `App.openSettings()`.
- Halaman Pengaturan: ringkasan status izin + tombol atur ulang.
- Menolak izin tidak membatasi fitur lain.

### Validasi
- `tests/permissions.test.mjs` (baru, 11 check).
- `validate.py`: tolak `#splash-screen`, tolak `requestPermissions({photos})`,
  wajibkan `permissions.js` termuat di halaman yang memakainya.
- Total: **42 check, 0 gagal**.

## [2.3.5] — Iklan tampil & app-ads.txt (2026-10-08)

### Penyebab utama: app-ads.txt tidak pernah ada
Tanpa `app-ads.txt` AdMob tidak menaruh iklan (*no fill*).

- `native/app-ads.txt` = sumber kebenaran, publisher ID `pub-2096155581034089`
  (cocok dengan `appId` di `native/admob.config.json`); salinan di
  `www/app-ads.txt`.
- `patch_android.py appads` menyalin ke `android/app/src/main/assets/app-ads.txt`.
  ⚠️ Jalur itu wajib: `cap copy` menaruh `www/` di `assets/public/`, dan SDK
  **tidak** membaca `assets/public/app-ads.txt`.
- Build `exit 1` bila publisher ID tidak cocok atau file kosong.
- `validate.py` mengecek kedua file, format IAB, dan kecocokan ID.
- Langkah baru di workflow, dijalankan setelah `cap copy`.

Verifikasi penuh tetap perlu `https://<domain>/app-ads.txt`; status *Approved*
setelah Google meng-crawl (minimal 24 jam).

### Status iklan lebih jujur
`showBanner()` hanya membuat View + mengirim request; kreatifnya datang lewat
`bannerAdLoaded`. Versi 2.3.4 menandai tampil sebelum itu, jadi teks "Memuat
iklan…" ikut hilang dan tersisa kotak kosong selamanya.

- Status `shown` hanya setelah `bannerAdLoaded`.
- Empat status: `idle` → `loading` → `shown`, plus `failed`.
- `rapatkanCard()` hanya saat status `SHOWN`.
- Watchdog 15 detik; setelah `MAKS_COBA_ULANG` gagal card disembunyikan.
- CSS denyut saat `loading` + hormati `prefers-reduced-motion`.

### Validasi
- `tests/admob.test.mjs` 5 → 9 check. Total: **31 check, 0 gagal**.

## [2.3.4] — Perbaikan AdMob, mode malam, persiapan Play Store (2026-10-08)

### AdMob
- Bug `alasan is not defined` dan `jedaPasang is not a function` di
  `core/admob.js`.
- Banner disembunyikan saat scroll, dipasang lagi hanya saat card terlihat
  penuh; posisi sama → `resumeBanner` tanpa request baru.
- Pesan teknis hanya di mode uji; teks ajakan klik dibuang dari card.
- `isTesting: false` = iklan sungguhan (build uji di HP sendiri → `true`).

### Mode malam
- Token warna teks baru di `theme.css`; 97 hex diganti token.
- Teks yang dulu tak terbaca diperbaiki (kartu pengguna, tombol utama, logo
  05, badge, modal).
- `transition` tidak lagi dipasang ke semua elemen `[class]`.

### Play Store
- Workflow ikut membangun AAB (`bundleRelease`).
- Hapus Akun + Ubah Password di dalam aplikasi.
- Halaman Kebijakan Privasi.
- Laporan/Blokir komentar Diskusi + panel Laporan dari Warga di admin.
- Izin dirapikan: storage dibuang, `POST_NOTIFICATIONS` + `AD_ID` ditambahkan.

### Bug
- `push-notifications.js`: token FCM warga tidak pernah tersimpan.
- `admin/auth-gate.js`: cadangan sesi `localStorage` yang bisa dipalsukan dihapus.

### Validasi
- Total: **26 check, 0 gagal**.
