/**
 * KATARNOLIMA — core/splash.js
 *
 * Splash screen TIDAK lagi dibuat di sini.
 *
 * Kenapa dihapus (2.3.6): aplikasi punya DUA splash. Yang pertama splash native
 * Android (tema AppTheme.NoActionBarLaunch, diatur scripts/generate_splash.py)
 * yang tampil sejak proses aplikasi mulai sampai WebView siap. Yang kedua
 * overlay #splash-screen di index.html, yang 등장 1 detik setelah DOM siap.
 * Akibatnya warga melihat dua splash berturut-turut — satu lagi 1 detik
 * sebelum aplikasi benar-benar siap.
 *
 * Sekarang hanya ada splash native, lalu langsung isi aplikasi. Sapaan
 * "Dynamic Island" tetap berjalan, hanya sekarang dimulai begitu aplikasi siap
 * (bukan setelah splash web yang sudah tidak ada).
 */

document.addEventListener('DOMContentLoaded', function () {
  // Sapaan warga: sekali per sesi, tidak mengganggu interaksi.
  if (sessionStorage.getItem('diShown')) return;

  var diEl = document.getElementById('dynamic-island-greeting');
  if (!diEl) return;
  sessionStorage.setItem('diShown', 'true');

  var iconEl = document.getElementById('di-icon');
  var textEl = document.getElementById('di-text');

  var hour = new Date().getHours();
  var greeting, icon;

  if (hour >= 4 && hour < 11) {
    greeting = 'Selamat pagi'; icon = '☀️';
  } else if (hour >= 11 && hour < 15) {
    greeting = 'Selamat siang'; icon = '🌤️';
  } else if (hour >= 15 && hour < 18) {
    greeting = 'Selamat sore'; icon = '🌇';
  } else {
    greeting = 'Selamat malam'; icon = '🌙';
  }

  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = greeting + ', Warga!';

  setTimeout(function () { diEl.classList.add('show'); }, 300);
  setTimeout(function () { diEl.classList.remove('show'); }, 3800);
});
