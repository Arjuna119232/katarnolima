/**
 * KATARNOLIMA — pages/info.ui.js
 * Logika halaman «info» — skrip UI.
 */

// --- PENANGANAN NAVIGASI BACK SISTEM HP & CAPACITOR ANDROID ---
const handleHardwareBackButtonPages = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const modal = document.getElementById('notif-detail-modal');

  // Jika modal detail sedang terbuka, tutup modalnya terlebih dahulu
  if (modal && modal.classList.contains('show')) {
    closeNotifDetailModal(false);
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

window.addEventListener('popstate', function(e) {
  const modal = document.getElementById('notif-detail-modal');
  if (modal && modal.classList.contains('show')) {
    closeNotifDetailModal(false);
  }
});
