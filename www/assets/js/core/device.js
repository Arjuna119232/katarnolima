/**
 * KATARNOLIMA — core/device.js
 * Akses perangkat: kamera & lokasi (Capacitor + Web API).
 * Menyediakan: window.requestCameraStream(), window.requestGeoLocation(onOk, onErr)
 */

// 4. STANDAR WEB API: KAMERA & LOKASI
window.requestCameraStream = async function() {
  try {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
      const cameraPlugin = window.Capacitor.Plugins.Camera;
      let permStatus = await cameraPlugin.checkPermissions();
      if (permStatus.camera !== 'granted') {
        await cameraPlugin.requestPermissions({ permissions: ['camera'] });
      }
    }
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }, 
      audio: false 
    });
    return stream;
  } catch (err) {
    console.error('Gagal membuka kamera:', err);
    alert('⚠️ Akses kamera ditolak/tidak diizinkan di perangkat ini.');
    return null;
  }
};

window.requestGeoLocation = async function(callbackSuccess, callbackError) {
  if (!navigator.geolocation) {
    if (typeof callbackError === 'function') callbackError(new Error('GeoNotSupported'));
    return;
  }
  try {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
      const geoPlugin = window.Capacitor.Plugins.Geolocation;
      let permStatus = await geoPlugin.checkPermissions();
      if (permStatus.location !== 'granted') {
        await geoPlugin.requestPermissions();
      }
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
  } catch (err) {
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
  }
};
