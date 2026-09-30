/**
 * KATARNOLIMA — pages/detail-berita.ui.js
 * Logika halaman «detail-berita» — skrip UI.
 */

// --- PENANGANAN NAVIGASI BACK HP & CAPACITOR ANDROID ---
function goToBeritaRW() {
    if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        window.location.href = 'berita-rw.html';
    }
}

const handleHardwareBackButtonPages = function(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    goToBeritaRW();
};

if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.removeAllListeners();
    window.Capacitor.Plugins.App.addListener('backButton', handleHardwareBackButtonPages);
} else {
    document.removeEventListener('backbutton', handleHardwareBackButtonPages);
    document.addEventListener('backbutton', handleHardwareBackButtonPages, false);
}
