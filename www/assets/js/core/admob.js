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
  const ADMOB_BANNER_ID = 'ca-app-pub-2096155581034089/6715532215';

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

      // 3. Tampilkan banner di BAWAH layar
      await AdMob.showBanner({
        adId: ADMOB_BANNER_ID,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: false
      });

      console.log('✅ AdMob Banner berhasil dimuat!');

    } catch (err) {
      console.warn('⚠️ AdMob belum siap atau berjalan di Browser Web:', err);
    }
  }

  setTimeout(initAdMobNative, 1500);

});
