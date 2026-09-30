/**
 * KATARNOLIMA — pages/semua-layanan.ui.js
 * Logika halaman «semua-layanan» — skrip UI.
 */

// --- PENANGANAN NAVIGASI BACK SISTEM HP & CAPACITOR ANDROID ---
const handleHardwareBackButtonPages = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const modal = document.getElementById('universal-modal');

  // Jika modal universal sedang terbuka, tutup modalnya saja
  if (modal && modal.classList.contains('show-overlay')) {
    closeServiceModal(false);
    return;
  }

  if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
    window.history.back();
  } else {
    window.location.href = '../index.html';
  }
};

if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  window.Capacitor.Plugins.App.removeAllListeners();
  window.Capacitor.Plugins.App.addListener('backButton', handleHardwareBackButtonPages);
} else {
  document.removeEventListener('backbutton', handleHardwareBackButtonPages);
  document.addEventListener('backbutton', handleHardwareBackButtonPages, false);
}

const backBtn = document.getElementById('backBtn');
if (backBtn) {
  backBtn.addEventListener('click', function(e) {
    e.preventDefault();
    handleHardwareBackButtonPages(e);
  });
}

window.addEventListener('popstate', function(e) {
  const modal = document.getElementById('universal-modal');
  if (modal && modal.classList.contains('show-overlay')) {
    closeServiceModal(false);
  }
});
