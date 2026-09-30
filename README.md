# KATARNOLIMA RW 05

Aplikasi warga RW 05 — Karang Taruna KATARNOLIMA. Web (HTML/CSS/JS) + Firebase, dibungkus menjadi APK Android dengan Capacitor.

## Struktur proyek

```
katarnolima-rw05/
├── www/                      ← SEMUA kode web (webDir Capacitor)
│   ├── index.html            beranda
│   ├── manifest.json         PWA manifest
│   ├── pages/                satu file HTML per halaman (hanya markup)
│   └── assets/
│       ├── css/base/         theme.css (warna/tema), global.css (komponen bersama)
│       ├── css/pages/        satu CSS per halaman
│       ├── js/core/          fitur bersama semua halaman (tema, splash, back, notifikasi, …)
│       ├── js/services/      firebase.js (SATU-SATUNYA konfigurasi Firebase)
│       ├── js/pages/         logika per halaman (admin/ = folder modul, lihat di bawah)
│       └── img/
├── native/                   kustomisasi Android (MainActivity, izin, signing, google-services)
├── scripts/                  validate.py, patch_android.py, generate_icons.py, generate_splash.py
├── tests/                    uji otomatis (Node bawaan, tanpa dependensi)
├── assets-source/            berkas sumber/cadangan yang TIDAK ikut APK
├── docs/                     dokumentasi (mulai dari PANDUAN-DEBUG.md)
├── .github/workflows/        CI build APK
├── capacitor.config.json  package.json  CHANGELOG.md
```

Aturan emas: **HTML hanya markup. CSS di `assets/css`, JS di `assets/js`.** Tidak ada `<style>`/`<script>` inline.

## Menjalankan di komputer

```bash
npm run serve        # atau: python3 -m http.server 8080 --directory www
# buka http://localhost:8080
```

Harus lewat server HTTP (bukan klik dua kali `index.html`) karena halaman memakai ES Modules.

## Sebelum commit

```bash
npm run check        # = validate + test
npm run validate     # rujukan file, import, sintaks JS, duplikasi konfigurasi Firebase
npm test             # uji otomatis panel admin (butuh Node 20.6+)
```

## Struktur panel admin

`pages/admin.html` memuat satu modul: `assets/js/pages/admin/main.js`.

```
assets/js/pages/admin/
├── main.js            titik masuk: merangkai modul
├── firebase.js        satu pintu ke Firebase SDK (db, auth, storage)
├── auth-gate.js       login/logout admin
├── ui.js              tab, sidebar, tutup modal, pilih ikon, salin GPS
├── settings.js        tab Pengaturan
├── shared/            modal.js · format.js · image.js
└── features/          satu berkas per tab: kas, update-app, sembako, keamanan, lingkungan,
                       posyandu, kegiatan, iuran, diskusi, info-singkat, berita, statistik, aduan, warga
```

## Peta halaman → file

| Halaman | Fungsi | File khusus |
|---|---|---|
| `index.html` | Beranda: ringkasan kas, berita, layanan, FAB darurat | `css/pages/home.css`, `js/pages/home.js`, `js/pages/home.ui.js` |
| `pages/admin.html` | Panel admin (login Firebase Auth): kelola berita, kas, warga, iuran, aduan, sembako | `css/pages/admin.css`, `js/pages/admin/` (mulai dari `main.js`) |
| `pages/aduan-warga.html` | Form & daftar aduan warga (foto/lokasi) | `css/pages/aduan-warga.css`, `js/pages/aduan-warga.js` |
| `pages/berita-rw.html` | Daftar berita RW | `css/pages/berita-rw.css`, `js/pages/berita-rw.js` |
| `pages/cari-warga.html` | Pencarian data warga | `css/pages/cari-warga.css`, `js/pages/cari-warga.ui.js` |
| `pages/detail-berita.html` | Detail satu berita | `css/pages/detail-berita.css`, `js/pages/detail-berita.js`, `js/pages/detail-berita.ui.js` |
| `pages/diskusi-rw.html` | Forum diskusi warga | `css/pages/diskusi-rw.css`, `js/pages/diskusi-rw.js`, `js/pages/diskusi-rw.ui.js` |
| `pages/info.html` | Info singkat & pengumuman | `css/pages/info.css`, `js/pages/info.js`, `js/pages/info.ui.js` |
| `pages/iuran-warga.html` | Pembayaran iuran (QRIS, unggah bukti) | `css/pages/iuran-warga.css`, `js/pages/iuran-warga.js`, `js/pages/iuran-warga.ui.js` |
| `pages/kas-detail.html` | Rincian kas & transaksi | `css/pages/kas-detail.css`, `js/pages/kas-detail.js`, `js/pages/kas-detail.ui.js` |
| `pages/pengaturan.html` | Tema, getaran, keluar akun | `css/pages/pengaturan.css`, `js/pages/pengaturan.ui.js` |
| `pages/profil.html` | Login / daftar / profil warga | `css/pages/profil.css`, `js/pages/profil.js`, `js/pages/profil.ui.js` |
| `pages/semua-layanan.html` | Daftar seluruh layanan | `css/pages/semua-layanan.css`, `js/pages/semua-layanan.js`, `js/pages/semua-layanan.ui.js` |
| `pages/tentang.html` | Tentang aplikasi & organisasi | `css/pages/tentang.css`, `js/pages/tentang.ui.js` |
| `pages/ubah-profil.html` | Ubah data profil | `css/pages/ubah-profil.css`, `js/pages/ubah-profil.js`, `js/pages/ubah-profil.ui.js` |

`*.js` = modul Firebase/data (`type="module"`), `*.ui.js` = skrip UI klasik.

## Dokumentasi

- [`docs/PANDUAN-DEBUG.md`](docs/PANDUAN-DEBUG.md) — gejala bug → file yang diperiksa
- [`docs/ARSITEKTUR.md`](docs/ARSITEKTUR.md) — cara kerja, urutan pemuatan, cara menambah halaman/fitur
- [`docs/BUILD-DAN-RILIS.md`](docs/BUILD-DAN-RILIS.md) — build APK, secrets, versi, rilis
- [`docs/KEAMANAN.md`](docs/KEAMANAN.md) — catatan keamanan & yang perlu dicek
- [`docs/MASALAH-DIKETAHUI.md`](docs/MASALAH-DIKETAHUI.md) — bug/utang teknis yang sudah terdata
- [`CHANGELOG.md`](CHANGELOG.md)
