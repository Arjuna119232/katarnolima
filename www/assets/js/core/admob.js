/**
 * KATARNOLIMA — core/admob.js
 * Inisialisasi iklan Google AdMob (hanya aktif bila plugin AdMob terpasang di APK).
 *
 * Menggunakan plugin resmi: @capacitor-community/admob
 * Dokumentasi: https://github.com/capacitor-community/admob
 *
 * Konfigurasi AdMob (App ID + Ad Unit ID) dibaca dari native/admob.config.json
 * oleh patch_android.py dan dipasang ke AndroidManifest.xml.
 */

document.addEventListener('DOMContentLoaded', function () {

  // Ad Unit ID (dari AdMob Console) — GANTI di sini jika perlu
  const ADMOB_BANNER_ID = '__BANNER_ID_PLACEHOLDER__';

  async function initAdMobNative() {
    try {
      if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.AdMob) {
        console.log('ℹ️ AdMob hanya aktif di APK Android (bukan di web browser).');
        return;
      }

      const { AdMob } = window.Capacitor.Plugins;

      // 1. Inisialisasi AdMob
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: [],
        initializeForTesting: false
      });

      console.log('✅ AdMob berhasil diinisialisasi!');

      // 2. Sembunyikan card placeholder "Ruang Iklan" di halaman Beranda
      const adCard = document.getElementById('admob-native-card');
      if (adCard) {
        adCard.style.display = 'none';
      }

      // 3. Banner dimatikan sementara untuk testing
      // await AdMob.showBanner({ ... });

    } catch (err) {
      console.warn('⚠️ AdMob belum siap atau berjalan di Browser Web:', err);
    }
  }

  setTimeout(initAdMobNative, 1500);

});
