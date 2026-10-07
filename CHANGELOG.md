# Changelog

## [2.3.6] — Satu splash & pop-up perizinan yang benar (2026-10-08)

Laporan warga: "splash screen ada dua masa" dan "popup perizinan APK-nya hilang
semua". Dua masalah terpisah, keduanya diperbaiki.

### 1. Dua splash screen
Aplikasi punya dua splash berurutan: **splash native Android** (tema
`AppTheme.NoActionBarLaunch`, dibuat `scripts/generate_splash.py`) yang tampil
sejak proses aplikasi mulai, lalu **overlay `#splash-screen`** di
`www/index.html` yang muncul 1 detik setelah DOM siap. Warga melihat dua kali
splash, plus 1 detik menunggu tanpa perlu.

- Overlay `#splash-screen` dihapus dari `index.html`; CSS-nya (`.splash-logo`,
  `.splash-text`, keyframes `zoomIn`/`fadeIn`) ikut dibuang dari `home.css`
  karena tidak dipakai halaman lain.
- `core/splash.js` sekarang hanya mengurus sapaan "Dynamic Island" — sapaan
  warga tetap ada, hanya mulai begitu aplikasi siap.
- `validate.py` menolak `#splash-screen` yang muncul lagi di halaman mana pun.

### 2. Popup perizinan hilang
Penyebabnya bukan Android, tapi kode yang salah sasaran:

- Izin **hanya diminta saat warga memakai fitur tertentu**, dan permintaannya
  ikut menanyakan **READ_MEDIA_IMAGES (`photos`)** — izin yang sudah dibuang dari
  manifest di 2.3.4. `checkPermissions()` lalu selalu melaporkan
  `photos != granted`, sehingga `requestPermissions()` dipanggil terus-menerus.
  Setelah warga menolak dua kali, **Android berhenti menampilkan dialog sama
  sekali** — dialog hilang total.
- Notifikasi di Android 13+ tidak pernah diminta otomatis, jadi pengumuman RW
  tidak pernah sampai ke warga.

**Perbaikan**

- `www/assets/js/core/permissions.js` (baru): sheet perizinan yang muncul
  **satu kali** saat warga pertama membuka aplikasi. Isinya: alasan setiap izin
  dalam bahasa warga *sebelum* dialog sistem muncul, tombol "Izinkan" dan
  "Nanti saja", serta status tiap izin yang ditampilkan jujur.
- Izin diminta **berurutan satu per satu** (notifikasi -> kamera -> lokasi),
  hanya yang statusnya belum diberikan — tidak menumpuk dialog Android.
- Hanya `camera` yang diminta untuk kamera. Aplikasi memotret lewat
  `navigator.mediaDevices.getUserMedia`, bukan `Camera.getPhoto`, jadi
  READ_MEDIA_IMAGES tidak pernah dibutuhkan (`home.ui.js`, `aduan-warga.js`).
- **Izin yang sudah ditolak permanen** tidak direquest lagi (dialognya memang
  tidak akan muncul). Warga diberi arahan membuka
  Pengaturan > Aplikasi > KATARNOLIMA > Izin lewat `App.openSettings()`.
- Halaman **Pengaturan** dapat bagian "Izin Aplikasi": ringkasan status +
  tombol "Atur Ulang Izin".
- Tidak ada yang diblokir. Kalau warga menolak, seluruh fitur aplikasi tetap
  bisa dipakai; hanya fungsi yang butuh izin itu yang tidak tersedia.
- `validate.py`: halaman yang memakai `window.KATARNOLIMA_Izin` tapi tidak
  memuat `core/permissions.js` → error; `requestPermissions({photos})` di mana
  pun → error.

### Test
`tests/permissions.test.mjs` (baru, 11 check): urutan & satu dialog per izin,
izin yang sudah granted tidak diganggu, hanya tampil sekali, tidak ada
permintaan di browser, status tidak mengarang "diizinkan", serta penjaga agar
`photos` dan splash overlay tidak bisa muncul lagi. Total suite: **42 check,
0 gagal**.

## [2.3.5] — Iklan akhirnya tampil & app-ads.txt (2026-10-08)

Laporan warga: "iklan memuat terus dan tidak muncul". Dua sebab, keduanya diperbaiki.

### 1. `app-ads.txt` tidak pernah ada (penyebab utama)
Tanpa `app-ads.txt` AdMob tidak menaruh iklan sama sekali — banner dipanggil tapi
tidak pernah berisi kreatif (*no fill*).

- `native/app-ads.txt` = sumber kebenaran, isi satu baris publisher ID
  `pub-2096155581034089` (cocok dengan `appId` di `native/admob.config.json`).
- Salinan juga ada di `www/app-ads.txt` supaya bisa diambil dari WebView.
- Perintah baru `python3 scripts/patch_android.py appads` menyalinnya ke
  `android/app/src/main/assets/app-ads.txt`.
  ⚠️ Jalur itu penting: `npx cap copy` menaruh `www/` di `assets/public/`, dan
  Google Mobile Ads SDK **tidak** membaca `assets/public/app-ads.txt`.
- Perintah menolak build (`exit 1`) kalau publisher ID di `app-ads.txt` tidak
  cocok dengan `appId`, atau file-nya kosong — supaya tidak rilis diam-diam.
- Langkah baru di workflow, dijalankan **setelah** `cap copy`.

Verifikasi penuh AdMob tetap perlu file yang sama di-domain resmi
(`https://<domain>/app-ads.txt`); statusnya di AdMob console jadi *Approved*
setelah Google meng-crawl (minimal 24 jam).

### 2. Kode menganggap iklan "tampil" terlalu cepat
`showBanner()` hanya **membuat View dan mengirim request**; kreatifnya tiba
terpisah lewat event `bannerAdLoaded`. Versi 2.3.4 menandai `tampil = true` dan
mengecilkan card tepat setelah `showBanner()` resolve — hasilnya teks
"Memuat iklan…" ikut tersembunyi, `data-admob` jadi `shown`, dan yang tersisa
**kotak kosong selamanya** karena tidak ada yang mau request ulang.

- Card hanya dianggap `shown` setelah `bannerAdLoaded` benar-benar datang.
- Empat status eksplisit lewat `data-admob`: `idle` → `loading` → `shown`,
  dan `failed` kalau memang tidak ada iklan.
- `rapatkanCard()` hanya boleh dipanggil saat status `SHOWN`.
- **Watchdog 15 detik**: kalau `bannerAdLoaded` tidak pernah datang, state
  direset dan request dicoba lagi. Tanpa ini satu request yang hilang membuat
  aplikasi selamanya menampilkan "memuat".
- Setelah `MAKS_COBA_ULANG` gagal → **card disembunyikan**, bukan dibiarkan
  jadi lubang kosong atau berputar tanpa akhir.
- CSS: denyut halus saat `loading`, dan hormati `prefers-reduced-motion`.
- `www/app-ads.txt` ikut divalidasi oleh `scripts/validate.py`.

### Test
`tests/admob.test.mjs` grew to 9 checks (from 5), including four new regressions
for 2.3.5: not-shown before `bannerAdLoaded`, shown+snapped after it, watchdog
retry, and hidden-after-exhausted-retries. Total suite: **31 check, 0 gagal**.

## [2.3.4] — Perbaikan AdMob, Mode Malam & Persiapan Play Store (2026-10-08)

### AdMob (iklan di card beranda)
- **Bug `alasan is not defined`** di `core/admob.js` (`notif(alas)` memakai `alasan`): setiap
  pemasangan banner melempar error *setelah* iklan tampil, sehingga pemantau scroll tidak
  pernah dipasang.
- **Bug `jedaPasang is not a function`**: `var jedaPasang` menimpa `function jedaPasang`,
  jadi reposisi banner tidak pernah berjalan. Banner menempel di posisi layar awal dan tidak
  ikut card saat di-scroll.
- Penulisan ulang alur posisi: banner disembunyikan seketika saat scroll, dipasang lagi setelah
  berhenti hanya bila card terlihat **penuh**; posisi sama → `resumeBanner` (tanpa request baru);
  request iklan baru dibatasi 20 detik; coba ulang maks. 3×; periksa posisi berkala.
- Pesan teknis ("Gagal: …") **hanya tampil di mode uji**. Teks "Dukung operasional…" dihapus
  dari card (kebijakan AdMob melarang ajakan klik).
- `native/admob.config.json`: `isTesting` → **false** (rilis memakai iklan sungguhan).
  Untuk build uji di HP sendiri set `true` sementara — jangan klik iklan sendiri.

### Mode malam
- Token baru di `theme.css`: `--link`, `--success-text`, `--on-green/-blue/-red/-pink/-amber/-purple`,
  `--on-accent`, `--btn-solid-bg/-fg`, plus `color-scheme`. 97 warna teks hex diganti token.
- Teks yang dulu tak terbaca di mode malam: kartu pengguna & tombol utama di Pengaturan (1.1:1),
  logo "05" dan badge "SOON" (1.5:1), modal layanan/beranda (1.8–2.5:1), badge status aduan.
- `theme.css`: `transition` tidak lagi dipasang ke **semua** elemen `[class]` (membuat scroll berat).
- Tombol tengah navigasi memakai teal lebih gelap agar teks putih terbaca.

### Play Store
- Workflow membangun **AAB** (`bundleRelease`) selain APK — Play hanya menerima AAB.
- **Hapus Akun** di dalam aplikasi (Profil → Akun, Tampilan & Privasi) + **Ubah Password** (tautan reset email).
- Halaman **Kebijakan Privasi** penuh (`pages/kebijakan-privasi.html`).
- **Laporkan / Blokir** komentar di Diskusi Warga + panel "Laporan dari Warga" di admin
  (koleksi Firestore baru `laporan_konten`).
- Izin dirapikan: `READ_MEDIA_IMAGES/VIDEO` & izin storage dibuang; `POST_NOTIFICATIONS` dan `AD_ID` ditambahkan.

### Bug lain
- `push-notifications.js`: `import { auth }` dari modul yang tidak mengekspor `auth` → token FCM
  warga **tidak pernah tersimpan**. Diperbaiki.
- `admin/auth-gate.js`: cadangan sesi di `localStorage` (`rw05_admin_session`) bisa dipalsukan
  untuk membuka tampilan admin → dihapus; gerbang hanya percaya Firebase Auth.
- Versi disamakan ke 2.3.4 (`pengaturan.html`, `tentang.html`, `AGENTS.md` sebelumnya 2.2.0).
- Ikon 2,3 MB → 240 KB (dimensi tetap 2048×2048; asli disimpan di `assets-source/`).
- ±10 aturan CSS mati dihapus; `manifest.json` memakai ukuran ikon yang benar.
- Tes baru: `admob.test.mjs`, `theme.test.mjs` → total 26 tes.

## [2.3.0] — Audit Keamanan & Pembersihan

Audit menyeluruh atas source, konfigurasi build, dan isi APK (2026-10-06).

### Keamanan

- **Injeksi HTML (XSS) ditutup di halaman warga.** `berita-rw.js`, `info.js`,
  `diskusi-rw.js`, `detail-berita.js`, `home.js`, `aduan-warga.js`, `kas-detail.js`,
  dan `semua-layanan.js` sekarang melewati `escapeHtml` / `jsArg` / `safeUrl` untuk
  semua data dari Firestore. Sebelumnya `berita-rw.js` menempelkan judul, isi,
  penulis, ikon, tanggal, dan URL foto **apa adanya**.
- **Pembescape dipindah ke satu tempat:** `www/assets/js/core/safe.js`.
  Empat salinan `escapeHtml` yang duplikat dihapus. `admin/shared/format.js`
  meng-export ulang, jadi modul admin & tes lama tidak berubah.
- **`MainActivity.java` tidak lagi memberi izin tanpa batas.** Dulu
  `request.grant(request.getResources())` memberi kamera/mikrofon/lokasi ke origin
  mana pun. Sekarang hanya origin aplikasi sendiri dan hanya kamera/mikrofon;
  geolokasi hanya untuk origin sendiri. Konten campuran HTTP dan akses file-URL dimatikan.
- **Manifest dikeraskan:** `allowBackup=false`, `usesCleartextTraffic=false`,
  `fullBackupContent=false`. Data warga di perangkat tidak lagi ikut ter-backup,
  dan app hanya boleh bicara lewat HTTPS.
- **R8 aktif pada build rilis** (`minifyEnabled` + `shrinkResources`). Kode tak
  terpakai dibuang dari APK dan nama kelas/metode diacak. Aturan R8 ada di
  `native/proguard-rules.pro`. Matikan lewat `MINIFY=false` di workflow bila perlu.
- **ID AdMob kini satu sumber kebenaran.** `native/admob.config.json` → ditulis CI ke
  `www/assets/js/admob.config.js` dan ke AndroidManifest. Sebelumnya ada 3 ID berbeda.
- Tes regresi baru: `tests/warga.xss.test.mjs` (4 tes). Total **17 tes, semua lulus**.
- `scripts/validate.py` sekarang menolak halaman modul yang menempelkan data dinamis
  ke `innerHTML` tanpa mengimpor `core/safe.js`.

### Pembersihan

- `junit/`, `LICENSE-junit.txt`, `DebugProbesKt.bin`, dan `*.proto` — sisa template
  Capacitor yang ikut terkirim di APK — dibuang saat build (`patch_android.py cleanup`).
- `www/test-viewport.html` (alat bantu dev, tidak dirujuk) dipindah ke `assets-source/`
  sehingga tidak lagi ikut APK. Validate kini **0 error, 0 peringatan**.
- Daftar rujukan rusak `KNOWN_BROKEN` di `validate.py` dihapus — rujukan yang dulu
  rusak sudah diperbaiki, jadi sekarang jadi error kalau muncul lagi.
- Duplikasi paket npm di workflow build dihapus.
- Tag AdMob yang salah (ID lama) di `native/AndroidManifest.reference.xml` dihapus;
  minSdk/targetSdk diselaraskan dengan `native/signing.gradle`.

### Iklan AdMob

- **Banner sekarang duduk DI DALAM card "Ruang Iklan"** (`#admob-native-card` di
  beranda), bukan banner lepas di bawah layar. Posisi dihitung dari koordinat card,
  dikoreksi lagi saat `bannerAdSizeChanged` memberi tinggi sebenarnya, lalu dikunci.
- **Card ikut menyesuaikan diri**: tinggi, margin, dan radius-nya disamakan dengan
  banner supaya tidak ada celah dan halaman tidak melompat. Label `IKLAN` tetap
  tampak (AdMob mewajibkan iklan bisa dikenali), dan berubah jadi `IKLAN UJI` saat mode uji.
- **Banner disembunyikan saat card di-scroll keluar layar** (`IntersectionObserver`),
  supaya tidak melayang menutupi konten lain.
- **Persetujuan UMP ditambahkan** — ini yang sebelumnya hilang total. Alurnya:
  `requestTrackingAuthorization()` → `requestConsentInfo()` → `showConsentForm()`
  bila `REQUIRED` → iklan hanya ditayangkan bila `canRequestAds`.
  Tanpa ini, di wilayah EEA/Asia iklan ditolak dan akun bisa kena flag Google.
- **Dua bug diperbaiki:** `initialize({ requestTrackingAuthorization: true })` —
  properti itu tidak ada di `AdMobInitializationOptions` (harusnya method terpisah);
  dan permintaan iklan nyata dikirim dari HP kamu sendiri, yang berisiko jadi
  *invalid traffic* dan membuat akun kena flag.
- **Mode uji dikendalikan dari `native/admob.config.json`** (`isTesting`, default `true`).
  Selama `true`, yang muncul iklan DEMO Google — klik sendiri tidak dihitung sebagai
  traffic invalid. Jangan diubah ke `false` sebelum kamu yakin tidak akan klik iklanmu.
- **Iklan hanya di beranda.** Script AdMob dilepas dari 13 halaman lain karena slot
  iklannya hanya ada di beranda. Tayangan jadi lebih sedikit — kalau pendapatan jadi
  prioritas, tambahkan interstitial saat pindah halaman.
- **Kenapa bukan "Native Advanced":** `@capacitor-community/admob` tidak mendukung
  native ads sama sekali (API resminya hanya Banner, Interstitial, Rewarded,
  Rewarded Interstitial, App Open). Secara teknis iklan native juga tidak bisa
  diletakkan di dalam card HTML karena itu View Android di luar DOM WebView.

### Catatan

- APK yang ada sekarang **15,3 MB**. Menambah ukuran tanpa konten nyata hanya
  memperlambat unduhan warga — lihat `docs/MASALAH-DIKETAHUI.md` #11 (ikon 2,3 MB)
  dan `assets-source/media-belum-dipakai/` (± 6,9 MB) sebagai kandidat isi.
- **Belum selesai dan perlu attention:** Firestore Security Rules (prioritas
  tertinggi), pembatasan API key + App Check, persetujuan UMP untuk AdMob, dan
  patokan Kotlin 1.8.22. Lihat `docs/KEAMANAN.md`.
- **Penting:** APK dengan R8 baru **wajib diuji di perangkat** setelah build —
  R8 bisa merusak fitur yang lolos proses build.

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
