# Catatan Keamanan

Hasil pemeriksaan kode; **belum semuanya diperbaiki** karena mengubah perilaku aplikasi. Urut prioritas.

1. **Firestore/Storage Security Rules (paling penting).** Aplikasi berjalan di sisi klien, jadi semua pembatasan akses (hanya admin boleh menulis berita/kas, warga hanya membaca datanya sendiri) harus dipaksa oleh Rules di Firebase Console — bukan oleh kode halaman. Periksa terutama koleksi `users_profile` (memuat data warga), `kas_rw05`, `transaksi_kas`, `berita_rw05`.
2. **Sesi tersimpan di `localStorage`** (`rw05_admin_session`, `rw05_current_user`) hanya penanda UI; bisa diubah siapa pun. Jangan dijadikan dasar otorisasi.
3. **API key Firebase bersifat publik** (wajar), tetapi batasi di Google Cloud Console (Credentials → batasi ke package `com.katarnolima.rw05` / domain yang dipakai) dan aktifkan App Check bila memungkinkan.
4. **`MainActivity.java` memberi semua izin yang diminta WebView** (`request.grant(request.getResources())`). Lebih aman: batasi ke kamera/mikrofon yang benar-benar dipakai dan hanya untuk origin aplikasi.
5. **`android:allowBackup="true"`** pada manifest referensi memungkinkan data lokal ikut ter-backup; pertimbangkan `false` bila menyimpan data warga.
6. **`allowMixedContent: true`** ada di `capacitor.config.json` lama; sudah dihapus di konfigurasi baru (CI memang sudah menimpanya tanpa opsi itu).
7. **Rahasia:** jangan commit keystore/password (`.gitignore` sudah menolaknya). Jika keystore pernah ter-commit, buat yang baru.
8. **Tampilan:** `user-scalable=no` pada viewport menghalangi zoom bagi pengguna low-vision; pertimbangkan dihapus.
