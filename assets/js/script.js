// @ts-nocheck

/**
 * KATARNOLIMA RW 05 - Core Script (Pure Online Mode - Versi 2.1 Stabil)
 */

// 0. NONAKTIFKAN SERVICE WORKER AGAR TIDAK BENTROK DENGAN NATIVE APK
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

document.addEventListener('DOMContentLoaded', function(){
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

  // 3. PUSH NOTIFICATIONS CAPACITOR (MURNI GAYA VERSI 2.0 YANG STABIL)
  function setupPushNotifications() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
      var PushNotifications = window.Capacitor.Plugins.PushNotifications;
      PushNotifications.requestPermissions().then(function(result){ 
        if (result.receive === 'granted') { 
          PushNotifications.register(); 
        } 
      });
      PushNotifications.addListener('registration', function(token){ 
        console.log('Firebase Push Token:', token.value); 
        localStorage.setItem('rw05_fcm_token', token.value);
      });
      PushNotifications.addListener('pushNotificationReceived', function(notification){
        var toast = document.createElement('div');
        toast.textContent = (notification.title? notification.title + ': ' : '') + (notification.body || 'Ada pesan baru');
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#e53935;color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;z-index:10000;width:85%;max-width:360px;text-align:center;';
        document.body.appendChild(toast);
        setTimeout(function(){ toast.remove(); }, 4000);
      });
    }
  }
  setupPushNotifications();

  // 4. STANDAR WEB API: KAMERA & LOKASI
  window.requestCameraStream = async function() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      return stream;
    } catch (err) {
      console.error('Gagal membuka kamera:', err);
      alert('⚠️ Akses kamera ditolak/tidak diizinkan di perangkat ini.');
      return null;
    }
  };

  window.requestGeoLocation = function(callbackSuccess, callbackError) {
    if (!navigator.geolocation) {
      if (typeof callbackError === 'function') callbackError(new Error('GeoNotSupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (typeof callbackSuccess === 'function') callbackSuccess({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.warn('Gagal mendapat lokasi:', error);
        if (typeof callbackError === 'function') callbackError(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 5. DETEKSI INTERNET OFFLINE
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

    function updateOnlineStatus() {
      if (!navigator.onLine) {
        netBanner.style.display = 'block';
      } else {
        netBanner.style.display = 'none';
      }
    }
    updateOnlineStatus();
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('online', updateOnlineStatus);
  })();

  // 6. LOGIKA PENCARIAN & FAB DARURAT
  var goCari = document.getElementById('goCari');
  if(goCari){ 
    goCari.addEventListener('click', function(e){ 
      e.preventDefault(); 
      window.location.href = 'cari-warga.html';
    }); 
  }
  
  var fabContainer = document.getElementById('fabContainer');
  var fabMain = document.getElementById('fabMain');
  var fabClose = document.getElementById('fabClose');
  var fabOptions = document.getElementById('fabOptions');
  
  if(fabMain && fabContainer){
    fabMain.addEventListener('click', function(e){
      e.stopPropagation();
      fabContainer.classList.add('active');
      if(fabOptions) fabOptions.style.display = 'flex';
      fabMain.style.display = 'none';
      if(fabClose) fabClose.style.display = 'flex';
    });
  }
  
  if(fabClose && fabContainer){
    fabClose.addEventListener('click', function(e){
      e.stopPropagation();
      fabContainer.classList.remove('active');
      if(fabOptions) fabOptions.style.display = 'none';
      if(fabClose) fabClose.style.display = 'none';
      if(fabMain) fabMain.style.display = 'flex';
    });
  }

  // 7. LOGIKA NAVIGASI BACK & HARDWARE BUTTON HP (VERSI 2.0 AMAN)
  function goBackSafe(){ 
    if (document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  }

  document.querySelectorAll('.back, #backBtn, .btn-back-modern').forEach(function(el){ 
    el.addEventListener('click', function(e){ 
      e.preventDefault(); 
      goBackSafe(); 
    }); 
  });

  var currentPath = window.location.pathname;
  var isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '' || window.location.href.endsWith('/public/');
  var backPressedOnce = false;

  function handleExitApp() {
    if (backPressedOnce) {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) { 
        window.Capacitor.Plugins.App.exitApp(); 
      } else { 
        window.history.back(); 
      }
    } else {
      backPressedOnce = true;
      var toast = document.createElement('div');
      toast.textContent = 'Tekan sekali lagi untuk keluar dari KATARNOLIMA';
      toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;z-index:10000';
      document.body.appendChild(toast);
      setTimeout(function(){ 
        toast.remove(); 
        backPressedOnce = false; 
      }, 2000);
    }
  }

  var onHardwareBackButton = function(){
    if(fabContainer && fabContainer.classList.contains('active')){ 
      fabContainer.classList.remove('active'); 
      if(fabOptions) fabOptions.style.display='none'; 
      if(fabClose) fabClose.style.display='none'; 
      if(fabMain) fabMain.style.display='flex'; 
      return; 
    }
    if (isHomePage) { 
      handleExitApp(); 
    } else { 
      goBackSafe(); 
    }
  };

  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) { 
    window.Capacitor.Plugins.App.addListener('backButton', onHardwareBackButton); 
  } else { 
    document.addEventListener('backbutton', onHardwareBackButton, false); 
  }

  // 8. EFEK RIPPLE
  function addRippleEffect(e){
    var el = this;
    if(navigator.vibrate) navigator.vibrate(10);
    var rect = el.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.background = 'rgba(251,191,36,0.22)';
    var size = Math.max(rect.width, rect.height) * 1.2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    el.appendChild(ripple);
    setTimeout(function(){ ripple.remove(); }, 350);
  }

  document.querySelectorAll('.g8-item,.kat-card,.rekom-card,.jaki-item,.result-item,.menu-jaki.menu-item,.item-layanan').forEach(function(item){
    item.addEventListener('click', addRippleEffect);
  });
});
