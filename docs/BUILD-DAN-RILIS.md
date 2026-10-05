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
| `native/MainActivity.java` | Jembatan izin kamera/lokasi WebView (hanya untuk origin app sendiri) |
| `native/permissions.xml` | Izin & fitur yang disuntik ke manifest |
| `native/signing.gradle` | Signing rilis + R8 (minify/obfuscate) + pin versi library |
| `native/proguard-rules.pro` | Aturan R8 untuk kelas milik aplikasi sendiri |
| `native/admob.config.json` | **Satu-satunya** sumber ID AdMob (appId + bannerId) |
| `native/google-services.json` | Konfigurasi Firebase Android (dari GitHub Secrets) |
| `native/AndroidManifest.reference.xml` | Referensi saja (tidak dipakai CI) |

## Langkah `patch_android.py`

| Perintah | Kapan | Hasil |
|---|---|---|
| `firebase` | sebelum `cap sync` | salin `google-services.json` + pasang plugin Gradle |
| `activity` | setelah sync | salin `MainActivity.java` kustom |
| `permissions` | setelah sync | suntikkan izin dari `native/permissions.xml` |
| `harden` | setelah sync | `allowBackup=false`, `usesCleartextTraffic=false`, `fullBackupContent=false` |
| `admob` | setelah sync | tulis `www/assets/js/admob.config.js` + suntik App ID ke manifest |
| `cleanup` | **setelah** `npx cap copy` | buang `junit/`, `LICENSE-junit.txt`, `*.proto`, `DebugProbesKt.bin` dari assets |
| `version` | setelah sync | set `versionCode` / `versionName` |
| `signing` | sebelum `assembleRelease` | salin `signing.gradle` + `proguard-rules.pro` |

## R8 (minify) dan cara mematikan

Build rilis menjalankan R8 (`minifyEnabled` + `shrinkResources`). Kalau setelah
mengpasang APK baru aplikasi force-close atau ada fitur yang hilang (biasanya plugin
AdMob/FCM yang rusak oleh obfuscation), set di `.github/workflows/build-apk.yml`:

```yaml
env:
  MINIFY: false
```

Lalu push lagi. APK tetap tertandatangani, hanya lebih besar dan kode tidak
diringkas. **Selalu uji APK rilis di perangkat nyata** — R8 bisa merusak yang lolos build.

## Build lokal (opsional)

```bash
npm install --save-dev @capacitor/core @capacitor/cli @capacitor/android @capacitor/app \
  @capacitor/push-notifications @capacitor/camera @capacitor/geolocation
npx cap add android && python3 scripts/patch_android.py firebase && npx cap sync android
python3 scripts/patch_android.py activity && python3 scripts/patch_android.py permissions
python3 scripts/patch_android.py harden && python3 scripts/patch_android.py admob
npx cap copy android && python3 scripts/patch_android.py cleanup
python3 scripts/generate_icons.py && python3 scripts/generate_splash.py
```
