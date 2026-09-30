/**
 * KATARNOLIMA — core/theme-init.js
 * Harus dimuat SINKRON di <head> (tanpa defer/async) agar tema terang/gelap
 * sudah terpasang sebelum halaman digambar → mencegah kilatan warna (FOUC).
 * Penerapan lanjutan & sinkronisasi antar-tab ada di core/theme.js.
 */
(function () {
  try {
    var pref = localStorage.getItem('katar-theme') || 'system';
    var dark = pref === 'dark' ||
      (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-pref', pref);
  } catch (e) { /* localStorage tidak tersedia: pakai tema default */ }
})();
