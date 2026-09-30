/**
 * KATARNOLIMA — core/app.js
 * Perilaku UI bersama: tombol cari, FAB darurat, modal, tombol Back HP / keluar aplikasi, efek ripple.
 */

document.addEventListener('DOMContentLoaded', function () {
  // 6. LOGIKA PENCARIAN & FAB DARURAT
  var goCari = document.getElementById('goCari');
  if(goCari){ 
    goCari.addEventListener('click', function(e){ 
      e.preventDefault(); 
      var pathNow = window.location.pathname;
      if (pathNow.includes('/pages/')) {
        window.location.href = 'cari-warga.html';
      } else {
        window.location.href = 'pages/cari-warga.html';
      }
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

  // 7. LOGIKA MODAL SERBAGUNA
  var modal = document.getElementById('universal-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');

  function openModal(t,b){ if(!modal||!modalTitle||!modalBody) return; modalTitle.innerHTML=t; modalBody.innerHTML=b; modal.classList.add('active'); document.body.style.overflow='hidden'; }
  function closeModal(){ if(!modal) return; modal.classList.remove('active'); document.body.style.overflow=''; }

  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });

  // 8. LOGIKA NAVIGASI BACK HP & KELUAR APLIKASI (FIXED)
  function goBackSafe(){ 
    if (window.history.length > 1) {
      window.history.back();
    } else {
      var pathNow = window.location.pathname;
      if (pathNow.includes('/pages/')) {
        window.location.replace('../index.html');
      } else {
        window.location.replace('index.html');
      }
    }
  }

  document.querySelectorAll('.back, #backBtn, .btn-back-modern, .btn-back, .btn-back-berita, .btn-back-link').forEach(function(el){ 
    el.addEventListener('click', function(e){ 
      e.preventDefault(); 
      goBackSafe(); 
    }); 
  });

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
      var toast = document.getElementById('exit-app-toast') || document.getElementById('exit-toast');
      if (toast) {
        toast.classList.add('show');
        setTimeout(function() {
          toast.classList.remove('show');
          backPressedOnce = false;
        }, 2000);
      } else {
        var newToast = document.createElement('div');
        newToast.id = 'exit-app-toast';
        newToast.innerHTML = '📱 Ketuk sekali lagi untuk keluar aplikasi';
        newToast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.92);color:#ffffff;padding:12px 22px;border-radius:999px;font-size:12px;font-weight:700;z-index:9999999;box-shadow:0 6px 16px rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(4px);transition:all 0.3s ease;';
        document.body.appendChild(newToast);
        
        setTimeout(function(){ 
          newToast.style.opacity = '0';
          setTimeout(function() { newToast.remove(); }, 300);
          backPressedOnce = false; 
        }, 2000);
      }
    }
  }

  function checkIsMainTab() {
    var path = window.location.pathname.toLowerCase();
    var fileName = path.substring(path.lastIndexOf('/') + 1);
    
    // Anggap Halaman Utama jika berada di index.html atau root path tanpa subfolder /pages/
    var isMainPage = (fileName === '' || fileName === 'index.html' || path.endsWith('/')) && !path.includes('/pages/');
    return isMainPage;
  }

  var onHardwareBackButton = function(e){
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    // 1. Cek Pop-up / Overlay
    if(fabContainer && fabContainer.classList.contains('active')){ 
      if (typeof window.closeFabDarurat === 'function') {
        window.closeFabDarurat(false);
      } else {
        fabContainer.classList.remove('active'); 
        if(fabOptions) fabOptions.style.display='none'; 
        if(fabClose) fabClose.style.display='none'; 
        if(fabMain) fabMain.style.display='flex'; 
      }
      return; 
    }

    if (modal && modal.classList.contains('active')) { 
      closeModal(); 
      return; 
    }

    var uniModal = document.getElementById('universal-modal');
    if (uniModal && (uniModal.style.display === 'flex' || uniModal.classList.contains('show-overlay'))) {
      if (typeof window.closeUniversalModal === 'function') window.closeUniversalModal();
      return;
    }

    var satpamModal = document.getElementById('satpam-modal');
    if (satpamModal && (satpamModal.style.display === 'flex' || satpamModal.classList.contains('show-overlay'))) {
      if (typeof window.closeSatpamModal === 'function') window.closeSatpamModal();
      return;
    }

    var ambulansModal = document.getElementById('ambulans-modal');
    if (ambulansModal && (ambulansModal.style.display === 'flex' || ambulansModal.classList.contains('show-overlay'))) {
      if (typeof window.closeAmbulansModal === 'function') window.closeAmbulansModal();
      return;
    }

    var cameraOverlay = document.getElementById('cameraOverlay');
    if (cameraOverlay && cameraOverlay.classList.contains('show')) {
      if (typeof window.closeCustomCamera === 'function') window.closeCustomCamera();
      return;
    }

    var customAlert = document.getElementById('custom-alert-modal');
    if (customAlert && (customAlert.style.display === 'flex' || customAlert.classList.contains('show-overlay'))) {
      if (typeof window.closeCustomAlert === 'function') window.closeCustomAlert();
      return;
    }

    // 2. Jika di Beranda Utama -> Minta Double Tap Exit. Jika di Sub-halaman -> Mundur Halaman (History Back)
    if (checkIsMainTab()) {
      handleExitApp();
    } else {
      goBackSafe();
    }
  };

  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) { 
    window.Capacitor.Plugins.App.removeAllListeners();
    window.Capacitor.Plugins.App.addListener('backButton', onHardwareBackButton); 
  } else { 
    document.removeEventListener('backbutton', onHardwareBackButton);
    document.addEventListener('backbutton', onHardwareBackButton, false); 
  }

  // 9. EFEK RIPPLE
  function addRippleEffect(e){
    var el = this;
    window.katarVibrate(10);
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
