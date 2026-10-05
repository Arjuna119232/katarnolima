# Catatan Keamanan

Hasil pemeriksaan kode. Status per poin diperbarui **2026-10-06**.

## Sudah diperbaiki

- **Injeksi HTML (XSS) di halaman warga.** Semua nilai dari Firestore yang masuk
  `innerHTML` kini melewati `escapeHtml` / `jsArg` / `safeUrl` dari
  `www/assets/js/core/safe.js`. Sebelumnya `berita-rw.js` dan `diskusi-rw.js`
  menempelkan data mentah. Ada tes regresi (`tests/warga.xss.test.mjs`) dan
  `scripts/validate.py` sekarang menolak halaman modul yang menempelkan data
  dinamis tanpa mengimpor `core/safe.js`.
  **Penting:** ini hanya menutup akibat, bukan penyebab. Sumbernya adalah
  Firestore Rules.
- **`MainActivity.java` tidak lagi memberi izin tanpa batas.** Dulu
  `request.grant(request.getResources())` memberi kamera/mikrofon/lokasi ke
  origin mana pun yang memintanya. Sekarang hanya origin aplikasi sendiri
  (`capacitor://localhost`, `http(s)://localhost`) dan hanya resource
  kamera/mikrofon yang diizinkan; geolokasi hanya untuk origin sendiri.
  Konten campuran HTTP juga dimatikan, dan akses dari file-URL dimatikan.
- **Manifest dikeraskan** oleh `scripts/patch_android.py harden`:
  `android:allowBackup="false"`, `android:usesCleartextTraffic="false"`,
  `android:fullBackupContent="false"`. Data warga di perangkat tidak lagi ikut
  ter-backup, dan app hanya boleh bicara lewat HTTPS.
- **R8 aktif pada build rilis** (`minifyEnabled` + `shrinkResources`, aturan di
  `native/proguard-rules.pro`). Kode yang tidak terpakai dibuang dari APK dan
  nama kelas/metode diacak. Matikan sementara lewat `MINIFY=false` di
  `.github/workflows/build-apk.yml` bila ada plugin yang ikut rusak.
- **Aset sisa template dibuang dari APK** (`patch_android.py cleanup`):
  `LICENSE-junit.txt`, `junit/`, `DebugProbesKt.bin`, `*.proto`.
- **ID AdMob punya satu sumber kebenaran.** Dulu ada tiga ID berbeda (satu lagi di
  `AndroidManifest.reference.xml`, satu lagi ditulis manual di `core/admob.js`).
  Sekarang CI menyalin `native/admob.config.json` ke
  `www/assets/js/admob.config.js`.
- **Persetujuan UMP (consent) ditambahkan.** Dulu `requestConsentInfo()` tidak pernah
  dipanggil — di wilayah EEA/Asia iklan bisa ditolak total dan akun berisiko kena flag.
  Sekarang alurnya: `requestTrackingAuthorization()` → `requestConsentInfo()` →
  `showConsentForm()` bila `REQUIRED` → hanya tampil kalau `canRequestAds`.
- **Mode uji iklan ada.** `native/admob.config.json` punya `isTesting`. Selama `true`,
  yang muncul adalah iklan DEMO Google — klik di perangkat sendiri **tidak** dihitung
  sebagai invalid traffic yang bisa membuat akun kena flag. Jangan diubah ke `false`
  sebelum kamu yakin tidak akan klik iklanmu sendiri.
- **Ikon 2,3 MB masih dipakai** (`katar-app-icon.png`) karena `generate_icons.py`
  memakai ukuran aslinya sebagai kanvas. Belum diperkecil.

## Kenapa iklan memakai BANNER, bukan "Native Advanced"

`@capacitor-community/admob` **tidak mendukung native ads sama sekali**. API resminya
hanya 5 format: Banner, Interstitial, Rewarded, Rewarded Interstitial, dan App Open.
Tidak ada `NativeAdvanced`, `UnifiedNativeAd`, maupun `NativeAdView`.

Ditambah secara teknis: iklan native adalah `NativeAdView` (View Android asli) yang
berada **di luar** DOM WebView — jadi tidak mungkin diletakkan "di dalam" card HTML.
Kalau native ads benar-benar dibutuhkan, harus menulis plugin Capacitor sendiri dalam
Java (±200 baris) plus membuat ad unit "Native Advanced" baru di AdMob Console.


## Masih perlu perhatian (di luar kode)

1. **Firestore/Storage Security Rules — prioritas tertinggi.** Aplikasi berjalan di
   sisi klien, jadi semua pembatasan akses hanya bisa dipaksa dari Rules di
   Firebase Console. Periksa terutama `users_profile` (memuat data warga),
   `kas_rw05`, `transaksi_kas`, `berita_rw05`, `diskusi_rw05`. Kalau Rules-nya
   longgar, siapa pun bisa menulis; seluruh perbaikan di atas hanya menahan dampaknya.
2. **API key Firebase.** Ada di `www/assets/js/services/firebase.js` dan repo ini
   **publik**. API key Firebase Web memang dimaksudkan publik, jadi tidak bisa
   dihapus dari source. Yang perlu: batasi key di Google Cloud Console (package
   `com.katarnolima.rw05` + domain web yang dipakai) dan aktifkan **App Check**
   agar pemanggilan dari aplikasi atau klon lain ditolak.
3. **App Check belum terpasang.** Butuh plugin native; pasang dan uji dulu sebelum
   dipakai di produksi.
4. **AdMob baru pakai satu banner di beranda.** Tayangan jadi lebih sedikit
   dibanding banner di semua halaman (yang sebelumnya). Kalau pendapatan jadi
   prioritas, tambahkan **interstitial** saat pindah halaman — format yang paling
   dihargai AdMob dan tetap tersedia di plugin ini.
5. **Kotlin dipatok ke 1.8.22** di `native/signing.gradle` (dari upaya menyelesaikan
    konflik Gradle sebelumnya). Capacitor 8 dikompilasi dengan Kotlin yang lebih
   baru; menurunkan pustaka standar ini berisiko `NoSuchMethodError` saat runtime.
   Belum diubah — harus diuji di perangkat nyata.
6. **Sesi login di `localStorage`** (`rw05_admin_session`, `rw05_current_user`)
   hanyalah penanda UI dan bisa diubah siapa pun. Jangan dijadikan dasar
   otorisasi; yang menentukan kebolehan menulis data tetap Firebase Auth + Rules.