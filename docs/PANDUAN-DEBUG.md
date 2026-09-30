# Panduan Debug — dari gejala ke file

## Langkah awal (selalu)

```bash
npm run check        # validate + uji otomatis (rujukan rusak, import rusak, sintaks JS, panel admin)
npm run serve        # jalankan lokal, buka Console browser (F12)
```

Console menampilkan nama file JS + nomor baris error — sekarang mengarah ke file per-halaman (mis. `iuran-warga.js:88`), bukan lagi ke tengah file HTML.

## Gejala → tempat memeriksa

| Gejala | Periksa |
|---|---|
| Tema terang/gelap salah, layar berkedip saat buka | `core/theme-init.js`, `core/theme.js`, `css/base/theme.css`, kunci `katar-theme` |
| Data tidak muncul / kosong di halaman X | `js/pages/X.js` (query Firestore), **Security Rules** Firestore, Console: `permission-denied`? |
| Semua halaman gagal memuat Firebase | `js/services/firebase.js`, koneksi, versi SDK di URL import |
| Tombol Back HP salah / tidak keluar | `core/app.js` (bagian "NAVIGASI BACK"), lalu handler khusus halaman |
| Splash NATIVE (sebelum aplikasi terbuka) bukan logo aplikasi | `scripts/generate_splash.py`, langkah CI "Terapkan kustomisasi native"; cek `android/app/src/main/res/values/styles.xml` |
| Splash web / sapaan tidak muncul | `core/splash.js` (`sessionStorage`: `splashShown`, `diShown`) |
| Notifikasi tidak masuk | `core/push-notifications.js`, izin di Android, `google-services.json`, `home.js` (token web) |
| Kamera / lokasi gagal | `core/device.js`, `native/MainActivity.java`, `native/permissions.xml` |
| Banner "koneksi terputus" salah | `core/network-status.js` |
| Getaran tidak jalan / tak bisa dimatikan | `core/haptics.js`, kunci `katar_pref_haptic` |
| Tampilan salah di satu halaman | `css/pages/X.css`; jika di banyak halaman → `css/base/global.css` |
| Login admin gagal | `js/pages/admin/auth-gate.js`, akun di Firebase Auth |
| Tombol/tab tertentu di panel admin rusak | `js/pages/admin/features/<tab>.js` (nama berkas = nama tab); pindah tab → `admin/ui.js` |
| Dialog (alert/konfirmasi) admin | `js/pages/admin/shared/modal.js` |
| Login/daftar warga bermasalah | `js/pages/profil.js`, koleksi `users_profile` |
| Ikon aplikasi salah | `scripts/generate_icons.py`, `www/assets/img/katar-app-icon.png` |
| Build APK gagal | log GitHub Actions; `docs/BUILD-DAN-RILIS.md` |

## Debug di HP (APK)

1. Aktifkan Opsi Pengembang + USB debugging, sambungkan HP.
2. Buka `chrome://inspect` di Chrome PC → pilih WebView aplikasi → **inspect**.
3. Lihat Console/Network/Application (localStorage) seperti di browser biasa.

## Membuat bug mudah dilacak

- Perbaiki di **satu tempat**: logika bersama di `core/`, logika halaman di `pages/`.
- Setelah mengubah file, jalankan `npm run validate` sebelum commit.
- Catat perubahan di `CHANGELOG.md`.
