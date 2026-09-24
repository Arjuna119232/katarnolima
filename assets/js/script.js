// @ts-nocheck

/**
 * KATARNOLIMA RW 05 - Core Script (Pure Online Mode)
 */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

document.addEventListener('DOMContentLoaded', function(){
  // Fungsi panggil Dynamic Island (hanya sekali per sesi, sapaan ke Warga)
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
      greeting = 'Selamat pagi';
      icon = '☀️';
    } else if (hour >= 11 && hour < 15) {
      greeting = 'Selamat siang';
      icon = '🌤️';
    } else if (hour >= 15 && hour < 18) {
      greeting = 'Selamat sore';
      icon = '🌇';
    } else {
      greeting = 'Selamat malam';
      icon = '🌙';
    }

    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = `${greeting}, Warga!`;

    setTimeout(() => {
      diEl.classList.add('show');
    }, 300);

    // Tampil 3.5 detik (total ~3.8 detik)
    setTimeout(() => {
      diEl.classList.remove('show');
    }, 3800);
  }

  // SPLASH SCREEN & SEQUENCE GREETING HANYA DI AWAL SESI
  var splash = document.getElementById('splash-screen') || document.getElementById('splashScreen');
  if (splash) {
    if (sessionStorage.getItem('splashShown')) {
      splash.style.display = 'none';
      initDynamicIslandAfterSplash();
    } else {
      setTimeout(function() {
        splash.style.opacity = '0';
        splash.style.transition = 'opacity 0.4s ease';
        sessionStorage.setItem('splashShown', 'true');
        setTimeout(function() {
          splash.style.display = 'none';
          initDynamicIslandAfterSplash();
        }, 400);
      }, 1500);
    }
  } else {
    initDynamicIslandAfterSplash();
  }

  // ==========================================
  // IZIN NOTIFIKASI OTOMATIS (CAPACITOR & WEB)
  // ==========================================
  async function mintaIzinNotifikasiNative() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
      const pushNotifications = window.Capacitor.Plugins.PushNotifications;
      
      let permStatus = await pushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await pushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        console.warn('Izin notifikasi ditolak oleh pengguna.');
      } else {
        console.log('Izin notifikasi diberikan!');
        pushNotifications.register();
      }
    } else {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(function(permission) {
          if (permission === 'granted') {
            console.log('Izin notifikasi Web/PWA diberikan oleh warga.');
          }
        });
      }
    }
  }
  mintaIzinNotifikasiNative();

  // ==========================================
  // STANDAR WEB API: KAMERA & LOKASI (GLOBAL)
  // ==========================================
  window.requestCameraStream = async function() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      return stream;
    } catch (err) {
      alert('⚠️ Akses kamera ditolak/tidak tersedia di perangkat ini.');
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
        if (typeof callbackError === 'function') callbackError(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ==========================================
  // INDIKATOR DETEKSI KONEKSI INTERNET
  // ==========================================
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

    function showOfflineBanner(show) { netBanner.style.display = show ? 'block' : 'none'; }

    async function verifyRealInternet() {
      if (!navigator.onLine) { showOfflineBanner(true); return; }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.gstatic.com/generate_204', { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        showOfflineBanner(false);
      } catch (err) {
        showOfflineBanner(true);
      }
    }
    verifyRealInternet();
    window.addEventListener('offline', () => showOfflineBanner(true));
    window.addEventListener('online', verifyRealInternet);
    setInterval(verifyRealInternet, 10000);
  })();

  // ==========================================
  // LOGIKA PENCARIAN & FAB DARURAT
  // ==========================================
  var goCari = document.getElementById('goCari');
  if(goCari){ goCari.addEventListener('click', function(e){ e.preventDefault(); window.location.href='cari-warga.html'; }); }
  
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

  // ==========================================
  // LOGIKA MODAL SERBAGUNA
  // ==========================================
  var modal = document.getElementById('universal-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');

  function openModal(t,b){ if(!modal||!modalTitle||!modalBody) return; modalTitle.innerHTML=t; modalBody.innerHTML=b; modal.classList.add('active'); document.body.style.overflow='hidden'; }
  function closeModal(){ if(!modal) return; modal.classList.remove('active'); document.body.style.overflow=''; }

  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });

  // ==========================================
  // LOGIKA NAVIGASI BACK & HARDWARE BUTTON HP
  // ==========================================
  window.navigateTo = function(url) {
    if (url.includes('index.html') || url === './' || url.endsWith('/')) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
  };

  function goBackSafe(){ 
    if (document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
      window.history.back();
    } else {
      window.location.replace('index.html');
    }
  }

  document.querySelectorAll('.back, #backBtn, .btn-back-modern').forEach(function(el){ 
    el.addEventListener('click', function(e){ e.preventDefault(); goBackSafe(); }); 
  });

  var mainTabs = ['index.html', 'diskusi-rw.html', 'info.html', 'profil.html'];
  var currentPath = window.location.pathname;
  var isMainTab = mainTabs.some(function(page) { return currentPath.endsWith(page); }) || currentPath.endsWith('/') || currentPath === '' || window.location.href.endsWith('/public/');
  var backPressedOnce = false;

  function handleExitApp() {
    if (backPressedOnce) {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) { 
        window.Capacitor.Plugins.App.exitApp(); 
      } else { 
        if (typeof window.close === 'function') window.close();
      }
    } else {
      backPressedOnce = true;
      var toast = document.createElement('div');
      toast.textContent = 'Ketuk sekali lagi untuk keluar aplikasi';
      toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.9);color:#fff;padding:10px 20px;border-radius:999px;font-size:12px;font-weight:700;z-index:9999999;box-shadow:0 4px 12px rgba(0,0,0,0.2)';
      document.body.appendChild(toast);
      setTimeout(function(){ toast.remove(); backPressedOnce = false; }, 2000);
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
    if (modal && modal.classList.contains('active')) { 
      closeModal(); 
      return; 
    }
    var pathCheck = window.location.pathname;
    var currentIsMain = mainTabs.some(function(page) { return pathCheck.endsWith(page); }) || pathCheck.endsWith('/') || pathCheck === '' || window.location.href.endsWith('/public/');
    if (currentIsMain) { handleExitApp(); } else { goBackSafe(); }
  };

  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) { 
    window.Capacitor.Plugins.App.addListener('backButton', onHardwareBackButton); 
  } else { 
    document.addEventListener('backbutton', onHardwareBackButton, false); 
  }

  if (isMainTab) { 
    history.replaceState({page: 'mainTab'}, '', location.href); 
    window.addEventListener('popstate', function(){ 
      var pathCheck = window.location.pathname;
      var currentIsMain = mainTabs.some(function(page) { return pathCheck.endsWith(page); }) || pathCheck.endsWith('/') || pathCheck === '' || window.location.href.endsWith('/public/');
      if (currentIsMain) { history.pushState({page: 'mainTab'}, '', location.href); handleExitApp(); }
    }); 
  }

  // ==========================================
  // EFEK RIPPLE SAAT TOMBOL DIKLIK
  // ==========================================
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
