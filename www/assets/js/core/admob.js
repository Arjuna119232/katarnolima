/**
 * KATARNOLIMA — core/admob.js
 * Inisialisasi iklan Google AdMob (hanya aktif bila plugin AdMob terpasang di APK).
 */

document.addEventListener('DOMContentLoaded', function () {
  // 10. KONTROL IKLAN GOOGLE ADMOB (NATIVE CARD)
  async function initAdMobNative() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.initialize();

        const adCard = document.getElementById('admob-native-card');
        if (adCard) {
          await AdMob.showBanner({
            adId: 'ca-app-pub-3940256099942544/6300978111', // Sample Banner ID
            adSize: 'MEDIUM_RECTANGLE',
            position: 'CENTER',
            margin: 0
          });
          console.log('✅ AdMob Native berhasil dimuat!');
        }
      }
    } catch (err) {
      console.warn('⚠️ AdMob belum siap atau berjalan di Browser Web:', err);
    }
  }

  setTimeout(initAdMobNative, 1000);
});
