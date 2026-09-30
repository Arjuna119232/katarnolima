/**
 * KATARNOLIMA — pages/pengaturan-akun.js
 * Logika halaman Pengaturan Akun (Tampilan Mode, Ubah Password).
 */

document.addEventListener('DOMContentLoaded', function () {

  // ============================================
  // TOMBOL BACK
  // ============================================
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => window.history.back());
  }

  // ============================================
  // TAMPILAN MODE (Terang / Gelap / Otomatis)
  // ============================================
  const THEME_KEY = 'katar-theme';
  const themeOverlay = document.getElementById('themeOverlay');
  const rowTampilan = document.getElementById('rowTampilan');
  const themeStatus = document.getElementById('themeStatus');
  const LABELS = { light: 'Terang', dark: 'Gelap', system: 'Otomatis' };

  function getThemePref() {
    return localStorage.getItem(THEME_KEY) || 'system';
  }

  function applyTheme(pref) {
    localStorage.setItem(THEME_KEY, pref);
    const root = document.documentElement;
    root.setAttribute('data-theme-pref', pref);

    if (themeStatus) themeStatus.textContent = LABELS[pref] || 'Otomatis';

    if (pref === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (pref === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }

  // Set status awal
  if (themeStatus) themeStatus.textContent = LABELS[getThemePref()] || 'Otomatis';

  // Buka modal tema
  if (rowTampilan) {
    rowTampilan.addEventListener('click', () => {
      if (!themeOverlay) return;
      themeOverlay.classList.add('show');
      const current = getThemePref();
      document.querySelectorAll('#themeOverlay .theme-opt').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.pref === current);
      });
    });
  }

  // Tutup modal saat klik overlay
  if (themeOverlay) {
    themeOverlay.addEventListener('click', (e) => {
      if (e.target === themeOverlay) themeOverlay.classList.remove('show');
    });
  }

  // Pilih tema
  document.querySelectorAll('#themeOverlay .theme-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      applyTheme(opt.dataset.pref);
      if (themeOverlay) themeOverlay.classList.remove('show');
    });
  });

  // ============================================
  // UBAH PASSWORD (placeholder)
  // ============================================
  const rowUbahPassword = document.getElementById('rowUbahPassword');
  if (rowUbahPassword) {
    rowUbahPassword.addEventListener('click', () => {
      alert('Fitur Ubah Password akan segera hadir.');
    });
  }

});
