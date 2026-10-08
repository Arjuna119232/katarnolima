# Changelog

## [2.3.10] — Splash premium & tampilan Kamera Lapor (2026-10-08)

### Splash screen didesain ulang
Pengguna menilai hasil 2.3.8 "jelek banget". Perbaikan:

- **Latar gradasian 3 titik** (`#080E1E` → `#0D1E36` → `#0B2C37`) plus **vignette**
  di sudut, supaya terasa punya kedalaman.
- **Logo berbentuk squircle** (superellipse `|x|^4.6 + |y|^4.6 = 1`) — bentuk ikon
  iOS/Android modern, bukan lingkaran biasa.
- **Nama aplikasi tercetak**: "KATARNOLIMA" dengan letter-spacing + subjudul "RW 05".
  Pillow tidak punya letter-spacing, jadi teks digambar huruf demi huruf.
  Font dicari di 6 lokasi umum; kalau tidak ada, teks dilewati dan build tetap
  jalan (splash tetap benar, hanya tanpa nama).
- **Aura cahaya** lembut di belakang logo.

**Dua bug pada versi sebelumnya yang ditemukan lewat pengukuran piksel, bukan
perkiraan:**

1. `vignette()` memakai lingkaran dengan radius dalam piksel absolut, jadi
   radiusnya jauh melebihi ukuran gambar dan **seluruh kanvas ikut tergelap** —
   termasuk logo putih di tengah. Terukur: `#FEFEFE` menjadi `#6E6F72` (gelap
   56%). Diperbaiki dengan mask 64×64 yang dinormalisasi lalu diperbesar.
2. `radial()` menggambar lingkaran dari **kecil ke besar** padahal
   `ImageDraw.ellipse` **menimpa, bukan mencampur**. Akibatnya cahaya paling
   terang berada di **tepi**, dan di layar terbaca sebagai **lingkaran gelap
   mengelilingi logo**. Diperbaiki: gambar dari besar ke kecil.

### Kamera Lapor: tampilan baru
- Kendali atas & bawah memakai **gelas kaca** (latar transparan + blur + tepi
  putih tipis + bayangan), bukan tombol datar.
- **Bingkai bidik** (empat sudut tipis) sebagai penanda area yang akan diambil,
  dengan scrim gelap di luar bingkai.
- **Indikator langkah berupa pill** ("Langkah 1/5").
- Tombol rana dibesar (76px) dengan cincin putih dan inti bergradien.
- Animasi masuk halus; hormati `prefers-reduced-motion`.

**Bug pada versi lama yang ketahuan dari render mock:** posisi sudut bingkai
ditulis dalam **persen terhadap layar**, sedangkan tinggi bingkai ditentukan
`aspect-ratio` — keduanya tidak pernah ketemu pas, dan sudut bawah tertutup bar
kendali. Sekarang sudut menjadi anak `.camera-bidik-frame`, dan zona bidik
dibatasi `top`/`bottom` sehingga tidak menutupi bar kendali.

Semua `id` dan `onclick` sengaja dipertahankan agar `home.ui.js` tidak perlu
diubah — satu `id` yang hilang akan membuat tombolnya diam saja.

### Validasi
- `tests/kamera-tampilan.test.mjs` (baru, 9 check): id kamera utuh, handler
  utuh, bingkai berbatas, sudut menempel, tap target ≥44px, safe area, serta
  penjaga agar vignette & aura tidak lagi mengalahgelapkan logo.
- Total: **71 check, 0 gagal**.

## [2.3.8 / 2.3.9] — Banner bawah, splash, ID AdMob resmi (2026-10-08)

### ID AdMob & card dihapus
- ID resmi dari AdMob console dipakai sekarang:
  **App ID** `ca-app-pub-2096155581034089~4852943754`,
  **unit banner** `ca-app-pub-2096155581034089/6549270430`.
  ID sebelumnya (`~3671813314`, `/6715532215`, `/4236315324`) bukan milik app ini.
- `validate.py` kini menolak `appId` tanpa `~`, `bannerId` tanpa `/`, publisher
  yang tidak sama antara keduanya, dan `isTesting: true` yang akan ikut terkirim
  ke semua yang memasang APK.
- **Card iklan `#admob-native-card` dihapus dari beranda**, beserta markup dan
  CSS-nya (`.admob-card`, `.admob-note`, `.admob-label`, keyframes
  `admob-denyut`). Iklan sekarang hanya banner di bawah layar.

### Banner tidak lagi menutupi tombol & ikon bawah
Laporan warga: "banner menutupi tombol". Penyebabnya banner adalah View Android
yang melayang DI ATAS WebView, sementara posisi card ikut berubah saat halaman
di-scroll, sehingga banner ikut bergeser dan menutupi navigasi bawah.

- `core/admob.js` ditulis ulang: tidak lagi mengikuti posisi card, tetapi
  menempel tetap di bawah dengan margin yang **diukur** dari `.jaki-nav`
  (`getBoundingClientRect().height`), bukan angka tetap.
- `.jaki-nav` diberi `padding-bottom: calc(12px + env(safe-area-inset-bottom))`
  supaya ikon navigasi tidak berada di bawah gesture bar / notch.
- Spacer `.admob-spacer` disisipkan sebelum navigasi; `--admob-tinggi-banner`
  diisi core/admob.js **hanya setelah `bannerAdLoaded`**, jadi konten paling
  bawah tetap bisa di-scroll melewati banner dan tidak ada ruang kosong sia-sia.
- Safe area **tidak** ditambah lagi ke margin: tinggi nav yang terukur sudah
  memastikannya. Menjumlahkannya dua kali membuat banner terdorong terlalu tinggi.
- Perilaku "tampil hanya setelah `bannerAdLoaded`" dari 2.3.5 tetap dipertahankan.

### Splash lebih modern
- Latar **gradasian navy `#0B1220` → teal `#0D4752`** (mengikuti palet aplikasi:
  `.btn-masuk #0f172a`, tombol tengah nav `#0f766e`), bukan putih polos.
- Logo diberi bentuk **lingkaran** + bayangan lembut + cahaya yang memelukinya.
  ⚠️ Alasan: file ikon aplikasi **tidak transparan** (latar putih opak,
  alpha 254–255). Ditempel di atas gradasian gelap tanpa bentuk, hasilnya kotak
  putih besar — lebih buruk daripada splash polos. Sekaligus ini membuat ikon
  Android 12+ (yang dipotong sistem menjadi lingkaran) tidak memotong apa pun.
- `res/drawable/splash_background.xml` dibuat sebagai shape gradient dan dipasang
  ke `windowSplashScreenBackground` — atribut itu hanya menerima satu warna solid,
  jadi gradasi harus lewat drawable.
- Ikon `drawable/splash_icon.png` memakai `ImageChops.multiply` untuk mask
  lingkaran (jauh lebih cepat daripada loop per-piksel di CI).

### Validasi
- `tests/admob.test.mjs` ditulis ulang: 13 check, termasuk margin = tinggi nav
  yang terukur, halaman tanpa nav tidak memasang banner, tidak ada ruang bawah
  sebelum iklan termuat, dan ruang bawah dibersihkan setelah percobaan gagal.
- Total: **61 check, 0 gagal**.

## [2.3.7] — Kamera & GPS, syarat & ketentuan (2026-10-08)

### Kamera & GPS tidak bisa dipakai meski izin sudah diizinkan
Penyebabnya **bukan Android**. Izin Android memang diberikan, tapi izin di
level WebView selalu ditolak oleh `MainActivity.isOwnOrigin()`:

```
ALLOWED_ORIGINS  = "https://localhost"
Uri.toString()   = "https://localhost/"      <- ada garis miring di akhir
"https://localhost/".equalsIgnoreCase("https://localhost")  ->  false
```

Ketiga origin yang benar-benar dipakai Capacitor (`capacitor://localhost`,
`http://localhost`, `https://localhost`) semuanya berakhiran `/`, jadi
`request.deny()` berjalan tanpa pesan error sama sekali. Gejalanya persis seperti
laporan warga: izin sudah "diizinkan", fitur tetap tidak bisa dipakai.

- `isOwnOrigin()` kini menormalisasi origin (buang garis miring di akhir) lalu
  membandingkan skema + host. Origin dengan path (`https://localhost/index.html`)
  juga dikenali.
- Asing tetap ditolak: `https://localhost.evil.example.com/`,
  `http://evil.example.com/`, `ftp://localhost/`, `null`, dan string kosong.
- Verifikasi manual: `native/MainActivity.java` dikompilasi dengan `javac`
  terhadap stub Android, lalu `isOwnOrigin()` dijalankan sungguhan untuk 11
  kasus. Logika versi lama dijalankan juga sebagai pembanding dan terbukti
  menolak ketiga origin asli.

### Persetujuan wajib saat pendaftaran
- Halaman baru **Syarat & Ketentuan** (`pages/syarat-ketentuan.html`): ruang
  lingkup, peran, akun, kewajiban warga, aduan & foto, diskusi, iuran & kas,
  iklan, penegakan, hapus akun, perubahan, kontak.
- **Kebijakan Privasi** diperluas: bagian perizinan Android, masa simpan data,
  persetujuan & penolakan, dan tautan ke Syarat & Ketentuan.
- Gaya kedua halaman dipindah ke `assets/css/base/legal.css` agar konsisten.
- Di halaman daftar akun, blok persetujuan tampil **di atas** kolom isian, memuat
  tautan ke kedua dokumen dan dua kotak centang. Tombol "Daftar Akun Baru"
  terkunci sampai **keduanya** dicentang; ada penjaga kedua di dalam handler
  (tombol yang dipaksa aktif tetap ditolak).
- Tautan Syarat & Ketentuan ditambahkan di menu Privasi & Data.

### Validasi
- `tests/mainactivity-origin.test.mjs` (baru, 6 check) dan
  `tests/persetujuan-daftar.test.mjs` (baru, 10 check).
- Total: **58 check, 0 gagal**.

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
