# Build & Rilis APK

## Otomatis (GitHub Actions)

Push ke `main` (atau jalankan manual lewat tab **Actions**) → workflow `build-apk.yml`:

1. **validate** — `scripts/validate.py`
2. **build** — Capacitor membuat proyek Android bersih, menerapkan kustomisasi dari `native/`, membuat ikon, menandatangani APK, mengunggah artefak & GitHub Release.

### Secrets wajib (Settings → Secrets and variables → Actions)

| Secret | Isi |
|---|---|
| `KEYSTORE_BASE64` | Keystore `.p12` yang di-encode base64 (`base64 -w0 release.p12`) |
| `KEYSTORE_PASSWORD` | Password keystore |
| `KEY_ALIAS` | Alias kunci |
| `KEY_PASSWORD` | Password kunci |

Simpan cadangan keystore di tempat aman (di luar repo). **Kehilangan keystore = tidak bisa memperbarui aplikasi di Play Store.**

## Versi

- `versionName` = `version` di `package.json` (ubah di sana untuk rilis baru).
- `versionCode` = `VERSION_CODE_BASE` (di workflow) + nomor run. Naikkan BASE bila Play Store menolak karena kode lebih kecil dari unggahan sebelumnya.

## Kustomisasi Android

Ubah file di `native/` — bukan di dalam workflow:

| File | Fungsi |
|---|---|
| `native/MainActivity.java` | Jembatan izin kamera/lokasi WebView |
| `native/permissions.xml` | Izin & fitur yang disuntik ke manifest |
| `native/signing.gradle` | Signing rilis + pin versi library |
| `native/google-services.json` | Konfigurasi Firebase Android |
| `native/AndroidManifest.reference.xml` | Referensi saja (tidak dipakai CI) |

## Build lokal (opsional)

```bash
npm install --save-dev @capacitor/core @capacitor/cli @capacitor/android @capacitor/app \
  @capacitor/push-notifications @capacitor/camera @capacitor/geolocation
npx cap add android && python3 scripts/patch_android.py firebase && npx cap sync android
python3 scripts/patch_android.py activity && python3 scripts/patch_android.py permissions
python3 scripts/generate_icons.py && python3 scripts/generate_splash.py
```
