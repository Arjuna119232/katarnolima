// @ts-nocheck
/**
 * KATARNOLIMA RW 05 - Core Script (Fixed for APK - Anti Force Close)
 * Fix: Push Notification tidak langsung request, pakai checkPermissions dulu
 */

// 0. NONAKTIFKAN SERVICE WORKER (tetap)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

document.addEventListener('DOMContentLoaded', function(){
  // 1. DYNAMIC ISLAND
  function initDynamicIslandAfterSplash() {
    if (sessionStorage.getItem('diShown')) return;
    sessionStorage.setItem('diShown', 'true');
    const diEl = document.getElementById('dynamic-island-greeting');
    if (!diEl) return;
    const iconEl = document.getElementById('di-icon');
    const textEl = document.getElementById('di-text');
    const hour = new Date().getHours();
    let greeting = 'Selamat pagi'; let icon = '☀️';
    if (hour >= 4 && hour < 11) { greeting = 'Selamat pagi'; icon = '☀️'; }
    else if (hour >= 11 && hour < 15) { greeting = 'Selamat siang'; icon = '🌤️'; }
    else if (hour >= 15 && hour < 18) { greeting = 'Selamat sore'; icon = '🌇'; }
    else { greeting = 'Selamat malam'; icon = '🌙'; }
    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = `${greeting}, Warga!`;
    setTimeout(() => { diEl.classList.add('show'); }, 300);
    setTimeout(() => { diEl.classList.remove('show'); }, 3800);
  }

  // 2. SPLASH
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
        setTimeout(function() { splash.style.display = 'none'; initDynamicIslandAfterSplash(); }, 300);
      }, 1000);
    }
  } else { initDynamicIslandAfterSplash(); }

  // 3. PUSH NOTIFICATIONS - FIX ANTI FC
  async function setupPushNotifications() {
    try {
      if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.PushNotifications) {
        console.log('PushNotifications plugin tidak tersedia di web');
        return;
      }
      const PushNotifications = window.Capacitor.Plugins.PushNotifications;
      
      // FIX: Cek permission dulu, jangan langsung request
      let perm = await PushNotifications.checkPermissions();
      console.log('Push perm status:', perm);

      if (perm.receive === 'prompt') {
        // Jangan auto-request di startup, tunggu user interaksi atau delay
        // perm = await PushNotifications.requestPermissions();
        console.log('Push permission masih prompt, skip auto-register untuk cegah FC');
        return;
      }

      if (perm.receive === 'granted') {
        await PushNotifications.register();
      }

      PushNotifications.addListener('registration', function(token){
        console.log('✅ FCM Token:', token.value);
        localStorage.setItem('rw05_fcm_token', token.value);
      });

      PushNotifications.addListener('registrationError', function(error){
        console.warn('⚠️ Error registrasi FCM:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', function(notification){
        console.log('📩 Notifikasi:', notification);
      });

    } catch (err) {
      console.warn('Push notification skipped (anti-FC):', err);
    }
  }

  // FIX: delay 5 detik, bukan 1.2 detik, dan hanya jalan di native
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    setTimeout(setupPushNotifications, 5000);
  } else {
    // kalau di browser, tetap coba tapi tanpa crash
    setTimeout(setupPushNotifications, 5000);
  }

  // 4. KAMERA & LOKASI (tetap, tapi dengan safe-check)
  window.requestCameraStream = async function() {
    try {
      if (window.Capacitor?.Plugins?.Camera) {
        const cameraPlugin = window.Capacitor.Plugins.Camera;
        try { await cameraPlugin.requestPermissions({ permissions: ['camera'] }); } catch(e){}
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      return stream;
    } catch (err) {
      console.error('Gagal kamera:', err);
      alert('⚠️ Akses kamera ditolak / tidak tersedia. Akan membuka galeri.');
      return null;
    }
  };

  window.requestGeoLocation = async function(callbackSuccess, callbackError) {
    if (!navigator.geolocation) {
      if (typeof callbackError === 'function') callbackError(new Error('GeoNotSupported'));
      return;
    }
    try {
      if (window.Capacitor?.Plugins?.Geolocation) {
        try { await window.Capacitor.Plugins.Geolocation.requestPermissions(); } catch(e){}
      }
      navigator.geolocation.getCurrentPosition(
        (position) => { if (typeof callbackSuccess === 'function') callbackSuccess({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }); },
        (error) => { if (typeof callbackError === 'function') callbackError(error); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (err) {
      navigator.geolocation.getCurrentPosition(
        (position) => { if (typeof callbackSuccess === 'function') callbackSuccess({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }); },
        (error) => { if (typeof callbackError === 'function') callbackError(error); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // 5. OFFLINE DETECTION (tetap)
  (function() {
    const netBanner = document.createElement('div');
    netBanner.id = 'netStatusBanner';
    netBanner.style.cssText = `position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 440px; background: #ef4444; color: #ffffff; text-align: center; padding: 8px 12px; font-size: 12px; font-weight: 700; z-index: 99999; display: none;`;
    netBanner.innerHTML = '⚠️ Koneksi terputus.';
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
      } catch (err) { showOfflineBanner(true); }
    }
    verifyRealInternet();
    window.addEventListener('offline', () => showOfflineBanner(true));
    window.addEventListener('online', verifyRealInternet);
    setInterval(verifyRealInternet, 10000);
  })();

  // 6,7,8 tetap sama seperti aslinya
  var goCari = document.getElementById('goCari');
  if(goCari){ goCari.addEventListener('click', function(e){ e.preventDefault(); var pathNow = window.location.pathname; if (pathNow.includes('/pages/')) { window.location.href = 'cari-warga.html'; } else { window.location.href = 'pages/cari-warga.html'; } }); }
  var fabContainer = document.getElementById('fabContainer');
  var fabMain = document.getElementById('fabMain');
  var fabClose = document.getElementById('fabClose');
  var fabOptions = document.getElementById('fabOptions');
  if(fabMain && fabContainer){ fabMain.addEventListener('click', function(e){ e.stopPropagation(); fabContainer.classList.add('active'); if(fabOptions) fabOptions.style.display = 'flex'; fabMain.style.display = 'none'; if(fabClose) fabClose.style.display = 'flex'; }); }
  if(fabClose && fabContainer){ fabClose.addEventListener('click', function(e){ e.stopPropagation(); fabContainer.classList.remove('active'); if(fabOptions) fabOptions.style.display = 'none'; if(fabClose) fabClose.style.display = 'none'; if(fabMain) fabMain.style.display = 'flex'; }); }
  function goBackSafe(){ if (window.history.length > 1 && document.referrer && document.referrer.indexOf(window.location.host) !== -1) { window.history.back(); } else { var pathNow = window.location.pathname; if (pathNow.includes('/pages/')) { window.location.replace('../index.html'); } else { window.location.replace('index.html'); } } }
  document.querySelectorAll('.back, #backBtn, .btn-back-modern, .btn-back-berita, .btn-back-link').forEach(function(el){ el.addEventListener('click', function(e){ e.preventDefault(); goBackSafe(); }); });
  function addRippleEffect(e){ var el = this; if(navigator.vibrate) navigator.vibrate(10); var rect = el.getBoundingClientRect(); var ripple = document.createElement('span'); ripple.className = 'ripple'; ripple.style.background = 'rgba(251,191,36,0.22)'; var size = Math.max(rect.width, rect.height) * 1.2; ripple.style.width = ripple.style.height = size + 'px'; ripple.style.left = (e.clientX - rect.left - size/2) + 'px'; ripple.style.top = (e.clientY - rect.top - size/2) + 'px'; el.appendChild(ripple); setTimeout(function(){ ripple.remove(); }, 350); }
  document.querySelectorAll('.g8-item,.kat-card,.rekom-card,.jaki-item,.result-item,.menu-jaki.menu-item,.item-layanan').forEach(function(item){ item.addEventListener('click', addRippleEffect); });
});
