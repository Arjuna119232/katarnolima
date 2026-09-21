// @ts-nocheck
document.addEventListener('DOMContentLoaded', function(){
  // ==========================================
  // 1. HILANGKAN SPLASH SCREEN OTOMATIS
  // ==========================================
  var splash = document.getElementById('splash-screen');
  if (splash) {
    setTimeout(function() {
      splash.classList.add('fade-out');
    }, 1500);
  }

  // ==========================================
  // 2. IZIN NOTIFIKASI OTOMATIS (WEB / PWA)
  // ==========================================
  function mintaIzinNotifikasiWeb() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
          console.log('Izin notifikasi Web/PWA diberikan oleh warga.');
        } else {
          console.log('Izin notifikasi ditolak atau diabaikan.');
        }
      });
    }
  }
  mintaIzinNotifikasiWeb();

  // ==========================================
  // 3. INDIKATOR DETEKSI KONEKSI INTERNET OFFLINE
  // ==========================================
  (function() {
    const netBanner = document.createElement('div');
    netBanner.id = 'netStatusBanner';
    netBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 440px;
      background: #ef4444;
      color: #ffffff;
      text-align: center;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 700;
      z-index: 99999;
      display: none;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    `;
    netBanner.innerHTML = '⚠️ Koneksi terputus. Memuat data offline...';
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

  // ==========================================
  // 4. LOGIKA PENCARIAN & FAB DARURAT
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
  
  document.addEventListener('click', function(e){
    if(!fabContainer) return;
    if(!fabContainer.contains(e.target)){
      fabContainer.classList.remove('active');
      if(fabOptions) fabOptions.style.display = 'none';
      if(fabClose) fabClose.style.display = 'none';
      if(fabMain) fabMain.style.display = 'flex';
    }
  });

  // ==========================================
  // 5. LOGIKA MODAL SERBAGUNA (TAMPILAN MODERN + IKON)
  // ==========================================
  var modal = document.getElementById('universal-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');
  
  var modalData = {
    sembako:{
      title:'🛒 Harga Sembako RW 05',
      body:`
        <div style="text-align:left">
          <p style="font-size:12px;color:#64748b;margin-bottom:12px">Update harga kebutuhan pokok di Warung RW 05 minggu ini:</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9">
              <span>🌾 <b>Beras Premium</b></span>
              <span style="color:#2563eb;font-weight:800;font-size:13px">Rp 12.500 /kg</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9">
              <span>🥚 <b>Telur Ayam</b></span>
              <span style="color:#2563eb;font-weight:800;font-size:13px">Rp 28.000 /kg</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9">
              <span>🪔 <b>Minyak Goreng</b></span>
              <span style="color:#2563eb;font-weight:800;font-size:13px">Rp 14.000 /L</span>
            </div>
          </div>
          <div style="margin-top:12px;padding:8px 12px;background:#eff6ff;color:#1d4ed8;border-radius:8px;font-size:11px;font-weight:600">
            📍 Lokasi: Warung Gotong Royong RW 05
          </div>
        </div>
      `
    },
    ronda:{
      title:'🛡️ Jadwal Ronda Malam',
      body:`
        <div style="text-align:left">
          <p style="font-size:12px;color:#64748b;margin-bottom:10px">Jam Operasional: <b>22:00 - 04:00 WIB</b></p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
            <div style="background:#f8fafc;padding:8px;border-radius:8px;border:1px solid #e2e8f0">🗓️ <b>Senin:</b> RT 01</div>
            <div style="background:#f8fafc;padding:8px;border-radius:8px;border:1px solid #e2e8f0">🗓️ <b>Selasa:</b> RT 02</div>
            <div style="background:#f8fafc;padding:8px;border-radius:8px;border:1px solid #e2e8f0">🗓️ <b>Rabu:</b> RT 03</div>
            <div style="background:#f8fafc;padding:8px;border-radius:8px;border:1px solid #e2e8f0">🗓️ <b>Kamis:</b> RT 04</div>
            <div style="background:#f8fafc;padding:8px;border-radius:8px;border:1px solid #e2e8f0">🗓️ <b>Jumat:</b> RT 05</div>
            <div style="background:#f8fafc;padding:8px;border-radius:8px;border:1px solid #e2e8f0">🗓️ <b>Sabtu:</b> RT 06</div>
          </div>
          <div style="margin-top:10px;padding:8px 12px;background:#fef3c7;color:#b45309;border-radius:8px;font-size:11px;font-weight:700">
            🚨 Minggu: Petugas Linmas & Regu Bantuan
          </div>
        </div>
      `
    },
    bersih:{
      title:'🧹 Kerja Bakti Lingkungan',
      body:`
        <div style="text-align:left">
          <div style="padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:10px">
            <p style="font-size:13px;color:#166534;font-weight:800">📅 Jadwal Rutin:</p>
            <p style="font-size:12px;color:#15803d;margin-top:2px">Setiap <b>Minggu Ke-3</b> pukul <b>07:00 WIB</b></p>
          </div>
          <p style="font-size:12px;color:#334155;line-height:1.5">
            <b>📍 Titik Kumpul:</b> Lapangan Utama RW 05<br>
            <b>🛠️ Peralatan:</b> Cangkul, sapu lidi, & karung sampah
          </p>
        </div>
      `
    },
    posyandu:{
      title:'👶 Layanan Posyandu',
      body:`
        <div style="text-align:left">
          <div style="padding:12px;background:#fdf2f8;border:1px solid #fbcfe8;border-radius:12px;margin-bottom:10px">
            <p style="font-size:13px;color:#9d174d;font-weight:800">🏥 Jadwal Pelayanan:</p>
            <p style="font-size:12px;color:#be185d;margin-top:2px">Minggu Ke-2 & Ke-3 pukul <b>08:30 - 11:30 WIB</b></p>
          </div>
          <p style="font-size:12px;color:#334155;line-height:1.5">
            <b>💉 Layanan:</b> Penimbangan balita, imunisasi, & vitamin gratis.<br>
            <b>📍 Lokasi:</b> Balai Serbaguna RW 05
          </p>
        </div>
      `
    },
    datawarga:{
      title:'📋 Layanan Data Warga',
      body:`
        <div style="text-align:left">
          <p style="font-size:12px;color:#334155;line-height:1.5;margin-bottom:10px">
            Pindahan baru, pembuatan surat pengantar, atau pembaruan KK/KTP wajib lapor ke Ketua RT setempat.
          </p>
          <a href="https://wa.me/6289673580756?text=Halo%20Admin%20Lapor%20Data%20Warga%20RW05" target="_blank" style="display:block;width:100%;background:#16a34a;color:#ffffff;text-align:center;padding:10px;border-radius:10px;font-weight:800;text-decoration:none;font-size:12px">
            💬 Hubungi Sekretaris RW via WA
          </a>
        </div>
      `
    },
    belajar:{
      title:'📚 Bimbel Belajar Bersama',
      body:`
        <div style="text-align:left">
          <div style="padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;margin-bottom:10px">
            <p style="font-size:13px;color:#1e40af;font-weight:800">🎓 Bimbel Gratis Karang Taruna:</p>
            <p style="font-size:12px;color:#1d4ed8;margin-top:2px">Setiap <b>Sabtu malam</b> pukul <b>19:00 WIB</b></p>
          </div>
          <p style="font-size:12px;color:#334155;line-height:1.5">
            <b>📍 Lokasi:</b> Balai RW 05<br>
            <b>✏️ Peserta:</b> SD & SMP (Materi Matematika & Bahasa Inggris)
          </p>
        </div>
      `
    },
    profil:{
      title:'👤 Profil RW 05',
      body:'Karang Taruna RW 05 Poncol Jaya - Guyub Rukun Maju Bersama.<br><br><a href="profil.html" style="display:block;margin-top:12px;padding:12px;background:#111;color:#fbbf24;text-align:center;border-radius:12px;font-weight:800;text-decoration:none">Buka Halaman Profil</a>'
    },
    kegiatan:{
      title:'📋 Kegiatan RW 05',
      body:'Daftar kegiatan Karang Taruna akan segera hadir.'
    },
    
    // DETAIL PETA BALAI SERBAGUNA RW 05
    petaBalai:{
      title:'📍 Balai Serbaguna RW 05',
      body:`
        <div style="text-align:left">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
            <img src="img/balai-1.jpg" style="width:100%;height:110px;object-fit:cover;border-radius:12px;border:1px solid #e2e8f0" alt="Papan Balai RW 05">
            <img src="img/balai-2.jpg" style="width:100%;height:110px;object-fit:cover;border-radius:12px;border:1px solid #e2e8f0" alt="Ruangan Dalam Balai RW 05">
          </div>
          <p style="font-size:12px;color:#334155;line-height:1.5;margin-bottom:14px;background:#f8fafc;padding:10px 12px;border-radius:10px;border:1px solid #f1f5f9">
            <b>📍 Alamat Lengkap:</b><br>
            Jl. Poncol Gg. XI No.15 8, RT.8/RW.5, Kuningan Bar., Kec. Mampang Prpt., Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12710
          </p>
          <a href="https://maps.app.goo.gl/qYc6rwZgjHvN3AWCA" target="_blank" style="display:block;width:100%;background:#2563eb;color:#ffffff;text-align:center;padding:12px;border-radius:12px;font-weight:800;text-decoration:none;font-size:13px;box-shadow:0 4px 12px rgba(37,99,235,0.25)">
            🗺️ Buka Navigasi Google Maps
          </a>
        </div>
      `
    }
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

  // ==========================================
  // 6. LOGIKA NAVIGASI BACK & HARDWARE BUTTON HP
  // ==========================================
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

  // ==========================================
  // 7. PUSH NOTIFICATIONS FIREBASE / CAPACITOR
  // ==========================================
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

  // ==========================================
  // 8. EFEK RIPPLE SAAT TOMBOL DIKLIK
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
