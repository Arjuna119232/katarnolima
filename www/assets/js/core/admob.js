/**
 * KATARNOLIMA — core/admob.js
 * Inisialisasi iklan Google AdMob (hanya aktif bila plugin AdMob terpasang di APK).
 *
 * Menggunakan plugin resmi: @capacitor-community/admob
 * Dokumentasi: https://github.com/capacitor-community/admob
 */

document.addEventListener('DOMContentLoaded', function () {

  // KONFIGURASI ADMOB
  // GANTI dua ID di bawah dengan ID dari AdMob Console Anda.
  // App ID juga harus dipasang di AndroidManifest.xml (lihat docs).
  const ADMOB_APP_ID = 'ca-app-pub-2096155581034089~3671813314';
  const ADMOB_BANNER_ID = 'ca-app-pub-2096155581034089/8774507310';

  async function initAdMobNative() {
    try {
      // Cek apakah plugin AdMob terpasang (hanya di APK, tidak di web)
      if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.AdMob) {
        console.log('ℹ️ AdMob hanya aktif di APK Android (bukan di web browser).');
        return;
      }

      const { AdMob, BannerAdPosition, BannerAdSize } = window.Capacitor.Plugins;

      // 1. Inisialisasi AdMob
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: [],
        initializeForTesting: false
      });

      // 2. Sembunyikan card placeholder "Ruang Iklan" di halaman Beranda
      const adCard = document.getElementById('admob-native-card');
      if (adCard) {
        adCard.style.display = 'none';
      }

      // 3. Tampilkan banner di BAWAH layar (DIMATIKAN SEMENTARA)
      // await AdMob.showBanner({
      //   adId: ADMOB_BANNER_ID,
      //   adSize: 'ADAPTIVE_BANNER',
      //   position: 'BOTTOM_CENTER',
      //   margin: 0,
      //   isTesting: false
      // });

      console.log('ℹ️ AdMob init saja (banner dimatikan sementara).');

      // 4. Sembunyikan banner saat user masuk halaman tertentu (opsional)
      // await AdMob.hideBanner();

    } catch (err) {
      console.warn('⚠️ AdMob belum siap atau berjalan di Browser Web:', err);
    }
  }

  // Jalankan setelah 1.5 detik (beri waktu app init)
  setTimeout(initAdMobNative, 1500);

});
