# Checklist Rilis ke Google Play

Yang sudah dikerjakan di kode (2.3.4) ada di `CHANGELOG.md`. Daftar ini adalah hal yang
**harus dilakukan pemilik** di luar kode. Syarat Play berubah-ubah — cek ulang di Play Console.

## Sebelum build rilis
- [ ] Naikkan `version` di `package.json`; samakan teks versi di `pengaturan.html` & `tentang.html`.
- [ ] `native/admob.config.json` → `"isTesting": false`. Jangan klik iklan sendiri.
- [ ] Secrets GitHub terisi: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`, `GOOGLE_SERVICES_JSON`.
- [ ] Simpan keystore di tempat aman (hilang = tidak bisa update aplikasi). Pertimbangkan Play App Signing.
- [ ] Unggah file **`.aab`** dari artefak CI (bukan `.apk`) ke Play Console.

## Firebase / Firestore (WAJIB, belum ada di repo)
- [ ] Aturan Firestore mengizinkan: warga login membuat dokumen `laporan_konten`; hanya admin membaca/menghapusnya.
- [ ] Aturan mengizinkan pemilik akun menghapus `users_profile/{uid}` miliknya (fitur Hapus Akun).
- [ ] Batasi API key di Google Cloud Console (paket `com.katarnolima.rw05` + SHA-1) dan aktifkan App Check.
- [ ] Pastikan hanya akun admin sah yang punya hak admin di aturan (tampilan admin bisa dibuka siapa saja; aturan yang melindungi data).

## Play Console
- [ ] **URL Kebijakan Privasi publik**: publikasikan `www/pages/kebijakan-privasi.html` (mis. GitHub Pages) dan isi URL-nya.
- [ ] **URL hapus akun** (Data safety → Akun): bisa memakai URL halaman yang sama; jelaskan langkah di dalam aplikasi.
- [ ] **Data safety**: nama, email, foto, lokasi, ID perangkat/iklan, konten pengguna, token notifikasi.
- [ ] **Deklarasi ID Iklan** = Ya (AdMob).
- [ ] Peringkat konten, kategori, kontak pengembang, tangkapan layar.
- [ ] Konten buatan pengguna: jelaskan mekanisme laporkan/blokir (ada di Diskusi Warga).
- [ ] Akun pengembang baru biasanya wajib **uji tertutup** dengan sejumlah penguji selama beberapa hari sebelum produksi — cek syarat terkini.
- [ ] Pastikan `targetSdk` memenuhi syarat Play terkini (default Capacitor 8 umumnya sudah sesuai; cek peringatan di Play Console).

## Uji di perangkat nyata (belum bisa diuji dari sini)
- [ ] Banner AdMob menempel di card & ikut saat scroll; muncul formulir UMP bila VPN/EEA.
- [ ] Mode malam: buka semua halaman, terutama modal di Beranda & Semua Layanan.
- [ ] Hapus Akun (akun uji), Laporkan & Blokir komentar, notifikasi push di Android 13+.
- [ ] Kotlin dipatok 1.8.22 di `native/signing.gradle` (masalah #20) — pastikan tidak crash saat runtime.
- [ ] Setelah stabil: `MINIFY: true` (R8) di workflow dan uji ulang AdMob/FCM.

## app-ads.txt
- [ ] Bila memakai situs pengembang, tambahkan `app-ads.txt` (AdMob → Aplikasi → Verifikasi).
