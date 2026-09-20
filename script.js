// @ts-nocheck
document.addEventListener('DOMContentLoaded', function(){
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
  document.addEventListener('click', function(e){
    if(!fabContainer) return;
    if(!fabContainer.contains(e.target)){
      fabContainer.classList.remove('active');
      if(fabOptions) fabOptions.style.display = 'none';
      if(fabClose) fabClose.style.display = 'none';
      if(fabMain) fabMain.style.display = 'flex';
    }
  });
  var modal = document.getElementById('universal-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');
  var modalData = {
    sembako:{title:'Harga Sembako RW 05',body:'Beras Rp 12.500, Telur Rp 28.000, Minyak Rp 14.000 di Warung RW'},
    ronda:{title:'Jadwal Ronda',body:'Senin RT01, Selasa RT02, Rabu RT03, Kamis RT04, Jumat RT05, Sabtu RT06, Minggu Linmas. 22:00-04:00'},
    bersih:{title:'Lingkungan Bersih',body:'Kerja Bakti Minggu ke-3 jam 07:00 di Lapangan'},
    posyandu:{title:'Posyandu',body:'Minggu ke-2 & 3 di Balai'},
    datawarga:{title:'Data Warga',body:'Wajib lapor RT kalau pindah'},
    belajar:{title:'Belajar Bersama',body:'Bimbel gratis tiap Sabtu jam 19:00 di Balai RW 05'},
    profil:{title:'Profil RW 05',body:'Karang Taruna RW 05 Poncol Jaya - Guyub Rukun Maju Bersama.<br><br><a href="profil.html" style="display:block;margin-top:12px;padding:12px;background:#111;color:#fbbf24;text-align:center;border-radius:12px;font-weight:800;text-decoration:none">Buka Halaman Profil</a>'},
    kegiatan:{title:'Kegiatan RW 05',body:'Daftar kegiatan Karang Taruna akan segera hadir.'}
  };
  function openModal(t,b){ if(!modal||!modalTitle||!modalBody) return; modalTitle.innerHTML=t; modalBody.innerHTML=b; modal.classList.add('active'); document.body.style.overflow='hidden'; }
  function closeModal(){ if(!modal) return; modal.classList.remove('active'); document.body.style.overflow=''; }
  document.querySelectorAll('[data-modal]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      var k=this.getAttribute('data-modal');
      var d=modalData[k];
      if(d) openModal(d.title,d.body);
      else if(k==='profil'){ window.location.href='profil.html'; }
    });
  });
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  function goBackSafe(){ if(window.history.length > 1){ window.history.back(); } else { window.location.href = 'index.html'; } }
  document.querySelectorAll('.back, #backBtn').forEach(function(el){ el.addEventListener('click', function(e){ e.preventDefault(); goBackSafe(); }); });
  var currentPath = window.location.pathname;
  var isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '' || window.location.href.endsWith('/public/');
  var backPressedOnce = false;
  function handleExitApp() {
    if (backPressedOnce) {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) { window.Capacitor.Plugins.App.exitApp(); }
      else { window.history.back(); }
    } else {
      backPressedOnce = true;
      var toast = document.createElement('div');
      toast.textContent = 'Tekan sekali lagi untuk keluar dari KATARNOLIMA';
      toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;z-index:10000';
      document.body.appendChild(toast);
      setTimeout(function(){ toast.remove(); backPressedOnce = false; }, 2000);
    }
  }
  var onHardwareBackButton = function(){
    if(fabContainer && fabContainer.classList.contains('active')){ fabContainer.classList.remove('active'); if(fabOptions) fabOptions.style.display='none'; if(fabClose) fabClose.style.display='none'; if(fabMain) fabMain.style.display='flex'; return; }
    if (modal && modal.classList.contains('active')) { closeModal(); return; }
    if (isHomePage) { handleExitApp(); } else { goBackSafe(); }
  };
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) { window.Capacitor.Plugins.App.addListener('backButton', onHardwareBackButton); }
  else { document.addEventListener('backbutton', onHardwareBackButton, false); }
  if (isHomePage) { history.pushState(null, '', location.href); window.addEventListener('popstate', function(){ handleExitApp(); history.pushState(null, '', location.href); }); }
  function setupPushNotifications() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
      var PushNotifications = window.Capacitor.Plugins.PushNotifications;
      PushNotifications.requestPermissions().then(function(result){ if (result.receive === 'granted') { PushNotifications.register(); } });
      PushNotifications.addListener('registration', function(token){ console.log('Firebase Push Token:', token.value); });
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
  document.querySelectorAll('.g8-item,.kat-card,.rekom-card,.jaki-item,.result-item,.menu-jaki.menu-item').forEach(function(item){
    item.addEventListener('click', addRippleEffect);
  });
});