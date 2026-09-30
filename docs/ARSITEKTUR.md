# Arsitektur

## Gambaran

Aplikasi statis (tanpa backend sendiri): halaman HTML memuat CSS/JS dari `www/assets`, data dari **Firebase** (Firestore, Auth, Storage, Messaging). Untuk Android, folder `www/` dibungkus **Capacitor** menjadi APK.

## Urutan pemuatan sebuah halaman

1. `<head>`: `core/theme-init.js` (sinkron — pasang tema sebelum halaman tampil) → font → `base/theme.css` → `base/global.css` → `pages/<halaman>.css`
2. Akhir `<body>`, berurutan:
   1. `pages/<halaman>.js` (modul, ditunda otomatis oleh browser)
   2. `core/haptics.js` → `device.js` → `splash.js` → `push-notifications.js` → `network-status.js` → `app.js` → `admob.js`
   3. `pages/<halaman>.ui.js` (skrip UI klasik)
   4. `core/theme.js` (sinkronisasi tema antar-tab)

## Modul `core/`

| File | Tanggung jawab | Menyediakan |
|---|---|---|
| `theme-init.js` | Pasang tema awal (anti-kedip) | — |
| `theme.js` | Terapkan/pantau tema terang·gelap·ikuti perangkat | — |
| `haptics.js` | Getaran, hormati preferensi pengguna | `window.katarVibrate(ms)` |
| `device.js` | Kamera & lokasi (Capacitor + Web API) | `window.requestCameraStream()`, `window.requestGeoLocation(ok, err)` |
| `splash.js` | Splash + sapaan Dynamic Island | — |
| `push-notifications.js` | Izin & token FCM | menyimpan `rw05_fcm_token` |
| `network-status.js` | Banner offline | — |
| `app.js` | Tombol cari, FAB darurat, modal, tombol Back HP/keluar, ripple | — |
| `admob.js` | Iklan AdMob (bila plugin ada) | — |

`services/firebase.js` mengekspor `app` (instance Firebase). **Konfigurasi Firebase hanya boleh ada di file ini.**

## Panel admin (`js/pages/admin/`)

Satu modul per tanggung jawab; `main.js` hanya merangkai.

- `auth-gate.js` memanggil `initAdmin()` (di `main.js`) saat sesi admin sah. `initAdmin` dijaga agar hanya berjalan sekali.
- `features/<nama>.js` mengekspor `initNama()` — mendaftarkan form, listener Firestore (`onSnapshot`), dan handler `window.hapusX` untuk satu tab.
- `firebase.js` adalah satu-satunya tempat versi SDK Firebase untuk admin ditulis; fitur mengimpor `db`, `collection`, `addDoc`, dst. dari sana.
- `shared/format.js` berisi fungsi murni (mudah diuji); `shared/modal.js` menyediakan `window.showModal`.

Menambah tab admin baru: tambahkan `<div class="tab-content" id="tab-x">` + tombol menu di `admin.html`, buat `features/x.js` (`export function initX()`), lalu impor dan panggil di `main.js`. Handler yang dipanggil dari `onclick` harus dipasang ke `window`.

## Pengujian

`npm test` menjalankan uji Node bawaan (tanpa dependensi) di `tests/`. Firebase dan DOM diganti stub (`tests/helpers/`), sehingga panel admin dijalankan penuh: semua fitur diinisialisasi, semua callback data dirender, semua form dikirim, semua handler `window.*` dipanggil. Uji juga memastikan tiap `window.fn(...)` di HTML/template punya definisi. Tambahkan berkas `*.test.mjs` baru di `tests/` untuk fungsi murni lain.

## Data yang dipakai

Koleksi Firestore (dari kode): `users_profile`, `berita_rw05`, `kas_rw05`, `transaksi_kas`, `sembako_rw05`, `posyandu_rw05`, `lingkungan_rw05`, `kegiatan_rw05`, `keamanan_rw05`, `aduan_warga05`, `diskusi_rw05`, `info_singkat`, `iuran_warga_rw05`, `sistem_app`, `riwayat_update_app`.

Penyimpanan browser: `localStorage` — `katar-theme`, `katar_pref_haptic`, `rw05_current_user`, `rw05_user_login`, `rw05_admin_session`, `rw05_fcm_token`, `rw05_read_notifs`, `rw05_user_report_ids`, `rw05_manual_kas_saldo`, `rw05_manual_kas_info`, `temp_aduan_photo`; `sessionStorage` — `splashShown`, `diShown`.

## Cara menambah halaman baru

1. Salin halaman yang mirip ke `www/pages/nama.html`.
2. Buat `assets/css/pages/nama.css` dan (bila perlu) `assets/js/pages/nama.js` (modul) / `nama.ui.js`.
3. Salin susunan tag `<link>`/`<script>` dari halaman lain (urutan di atas).
4. Di modul Firebase cukup: `import {{ app }} from "../services/firebase.js";`
5. Jalankan `npm run validate`.

## Cara menambah fitur bersama

Buat file baru di `assets/js/core/`, satu tanggung jawab per file, lalu tambahkan tag `<script>` di halaman yang membutuhkan (dan daftarkan di tabel di atas).

## Konvensi

- Nama file: huruf kecil, pemisah `-`.
- Data dinamis di template `innerHTML` WAJIB lewat `escapeHtml()`; argumen `onclick="fn(...)"` lewat `jsArg()`; `src`/`href` lewat `safeUrl()` (semua di `admin/shared/format.js`).
- Fungsi yang dipanggil dari atribut HTML (`onclick="…"`) harus dipasang ke `window` bila berada di dalam modul.
- Jangan menaruh kunci rahasia (keystore, password) di repo — lihat `KEAMANAN.md`.
