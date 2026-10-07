# AGENTS.md — KATARNOLIMA RW 05

Aplikasi warga RW 05 (Karang Taruna KATARNOLIMA). Web HTML/CSS/JS + Firebase,
dibungkus jadi APK Android dengan Capacitor. Versi **2.3.4**, package
`com.katarnolima.rw05`, repo GitHub `Arjuna119232/katarnolima` (publik).

Detail lengkap ada di `README.md` + `docs/` — **baca itu dulu**, jangan
menebak. Ringkasan saja di sini.

## Aturan emas (tidak boleh dilanggar)

- **HTML hanya markup.** Tidak ada `<style>` atau `<script>` inline.
  CSS → `www/assets/css/`, JS → `www/assets/js/`.
- `scripts/validate.py` menegakkan ini. Kalau gagal, perbaiki filenya —
  jangan matikan validasinya.
- Satu CSS per halaman (`assets/css/pages/<halaman>.css`), satu
  `assets/js/pages/<halaman>.js` (modul Firebase, `type="module"`) +
  opsional `<halaman>.ui.js` (skrip UI klasik).
- Firebase dikonfigurasi **hanya** di `assets/js/services/firebase.js`
  (dan `assets/js/pages/admin/firebase.js` untuk panel admin). Jangan
  duplikat konfigurasi di file lain — `validate`/− `validate` mendeteksinya.
- JS hanya boleh memanggil `window.fn` yang punya definisi (ada test-nya).
- Teks dari Firestore selalu lewat `escapeHtml` / `jsArg` / `safeUrl`
  (lihat `assets/js/pages/admin/shared/`). Jangan pernah `innerHTML` mentah.

## Perintah

| Perintah | Guna |
|---|---|
| `npm run check` | **WAJIB sebelum commit** = `validate` + `test` |
| `npm run validate` | `scripts/validate.py`: rujukan file, import, sintaks, duplikasi Firebase |
| `npm test` | Uji otomatis panel admin (Node ≥ 20.6, tanpa dependensi) |
| `npm run serve` | `python3 -m http.server 8080 --directory www` → buka `http://localhost:8080` |

Halaman **harus** lewat HTTP server, bukan klik `index.html` (pakai ES Modules).

## Build & rilis

- **Jangan** `npx cap add android` lalu commit — `android/` ada di
  `.gitignore` dan dibangun bersih oleh CI.
- APK dibangun di GitHub Actions: push ke `main` → `.github/workflows/build-apk.yml`.
  Steps: validate → build Capacitor → patch dari `native/` → ikon & splash →
  sign → artefak + GitHub Release.
- Secrets (jangan pernah commit): `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
  `KEY_ALIAS`, `KEY_PASSWORD`. `google-services.json` juga di Secrets, CI
  me-restore-nya.
- Rilis: naikkan `version` di `package.json` (→ `versionName`). `versionCode`
  = `VERSION_CODE_BASE` di workflow + nomor run; naikkan BASE kalau Play Store
  menolak kode yang lebih kecil.
- Kustomisasi Android hanya lewat `native/` (MainActivity.java, permissions.xml,
  signing.gradle, google-services.json) — bukan mengedit workflow.

## Struktur penting

```
www/                 semua kode web (webDir Capacitor) ← tempat kerja 95%
native/              kustomisasi Android
scripts/             validate.py, patch_android.py, generate_icons.py, generate_splash.py
tests/               uji otomatis (Node bawaan)
docs/                PANDUAN-DEBUG · ARSITEKTUR · BUILD-DAN-RILIS · KEAMANAN · MASALAH-DIKETAHUI
assets-source/       sumber/cadangan, TIDAK ikut APK
```

Peta halaman → file ada di `README.md`. Struktur modul admin ada di
`www/assets/js/pages/admin/` (main.js titik masuk, features/ satu file per tab).

## Kalau ada bug

Baca `docs/PANDUAN-DEBUG.md` (gejala → file yang diperiksa) dan
`docs/MASALAH-DIKETAHUI.md` (utang teknis yang sudah terdata) **sebelum** menebak.