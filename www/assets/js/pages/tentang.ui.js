/**
 * KATARNOLIMA — pages/tentang.ui.js
 * Logika halaman «tentang» — skrip UI.
 */

function playSuccessSound() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('Norek BCA berhasil disalin');
    utterance.lang = 'id-ID';
    utterance.pitch = 1.1;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function salinNorekBCA() {
  navigator.clipboard.writeText('2100172502');
  playSuccessSound();
  showCustomModal('☕', 'Berhasil Disalin!', 'Norek BCA berhasil disalin.');
}

function showCustomModal(icon, title, desc) {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-icon').textContent = icon;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent = desc;

  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('show-overlay');
    }, 10);
  }
}

function closeCustomModal() {
  const modal = document.getElementById('custom-modal');
  if (modal) {
    modal.classList.remove('show-overlay');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 200);
  }
}

// --- PENANGANAN NAVIGASI BACK SISTEM HP & CAPACITOR ANDROID ---
const handleHardwareBackButtonPages = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const modal = document.getElementById('custom-modal');

  // Jika modal custom sedang terbuka, tutup modalnya terlebih dahulu
  if (modal && modal.classList.contains('show-overlay')) {
    closeCustomModal();
    return;
  }

  if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
    window.history.back();
  } else {
    window.location.href = 'profil.html';
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

window.addEventListener('popstate', function(e) {
  const modal = document.getElementById('custom-modal');
  if (modal && modal.classList.contains('show-overlay')) {
    closeCustomModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('custom-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCustomModal();
    });
  }
});
