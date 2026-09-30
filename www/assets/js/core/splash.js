/**
 * KATARNOLIMA — core/splash.js
 * Splash screen + sapaan 'Dynamic Island' (sekali per sesi).
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. DYNAMIC ISLAND (SAPAAN WARGA)
  function initDynamicIslandAfterSplash() {
    if (sessionStorage.getItem('diShown')) return;
    sessionStorage.setItem('diShown', 'true');

    const diEl = document.getElementById('dynamic-island-greeting');
    if (!diEl) return;

    const iconEl = document.getElementById('di-icon');
    const textEl = document.getElementById('di-text');

    const hour = new Date().getHours();
    let greeting = 'Selamat pagi';
    let icon = '☀️';

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
    if (textEl) textEl.textContent = `${greeting}, Warga!`;

    setTimeout(() => { diEl.classList.add('show'); }, 300);
    setTimeout(() => { diEl.classList.remove('show'); }, 3800);
  }

  // 2. LOGIKA SPLASH SCREEN
  var splash = document.getElementById('splash-screen') || document.getElementById('splashScreen');
  if (splash) {
    if (sessionStorage.getItem('splashShown')) {
      splash.style.display = 'none';
      splash.style.pointerEvents = 'none';
      initDynamicIslandAfterSplash();
    } else {
      setTimeout(function() {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        splash.style.pointerEvents = 'none';
        splash.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
        sessionStorage.setItem('splashShown', 'true');
        setTimeout(function() {
          splash.style.display = 'none';
          initDynamicIslandAfterSplash();
        }, 300);
      }, 1000);
    }
  } else {
    initDynamicIslandAfterSplash();
  }
});
