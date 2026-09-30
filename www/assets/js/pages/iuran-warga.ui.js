/**
 * KATARNOLIMA — pages/iuran-warga.ui.js
 * Logika halaman «iuran-warga» — skrip UI.
 */

// --- PENANGANAN NAVIGASI BACK SISTEM HP & CAPACITOR ANDROID ---
const handleHardwareBackButtonPages = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

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

const btnBackHeader = document.getElementById('btnBackHeader');
if (btnBackHeader) {
  btnBackHeader.addEventListener('click', function(e) {
    e.preventDefault();
    handleHardwareBackButtonPages(e);
  });
}
