/**
 * KATARNOLIMA — core/network-status.js
 * Banner peringatan saat koneksi internet terputus.
 */

document.addEventListener('DOMContentLoaded', function () {
  // 5. DETEKSI KONEKSI INTERNET
  (function() {
    const netBanner = document.createElement('div');
    netBanner.id = 'netStatusBanner';
    netBanner.style.cssText = `
      position: fixed; top: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: 440px; background: #ef4444; color: #ffffff;
      text-align: center; padding: 8px 12px; font-size: 12px; font-weight: 700;
      z-index: 99999; display: none; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    `;
    netBanner.innerHTML = '⚠️ Koneksi terputus. Pastikan data/internet aktif...';
    document.body.appendChild(netBanner);

    function showOfflineBanner(show) { netBanner.style.display = show ? 'block' : 'none'; }

    async function verifyRealInternet() {
      if (!navigator.onLine) { showOfflineBanner(true); return; }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.gstatic.com/generate_204', { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        showOfflineBanner(false);
      } catch (err) {
        showOfflineBanner(true);
      }
    }
    verifyRealInternet();
    window.addEventListener('offline', () => showOfflineBanner(true));
    window.addEventListener('online', verifyRealInternet);
    setInterval(verifyRealInternet, 10000);
  })();
});
