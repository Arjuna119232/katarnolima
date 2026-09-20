// @ts-nocheck
document.addEventListener('DOMContentLoaded', function(){
  const goCari = document.getElementById('goCari');
  if(goCari){ goCari.addEventListener('click', function(e){ e.preventDefault(); window.location.href='cari-warga.html'; }); }

  // FAB MERAH + ANIMASI KEDIP
  const fabContainer = document.getElementById('fabContainer');
  const fabMain = document.getElementById('fabMain');
  const fabClose = document.getElementById('fabClose');
  if(fabMain && fabContainer){ fabMain.addEventListener('click', function(e){ e.stopPropagation(); fabContainer.classList.add('active'); }); }
  if(fabClose && fabContainer){ fabClose.addEventListener('click', function(e){ e.stopPropagation(); fabClose.classList.remove('active'); }); }
  document.addEventListener('click', function(e){ if(!fabContainer) return; const target = e.target; if(!fabContainer.contains(target)){ fabContainer.classList.remove('active'); } });

  // MODAL (Dideklarasikan di awal agar bisa diakses fungsi Back)
  const modal = document.getElementById('universal-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const modalData = { sembako:{title:'Harga Sembako RW 05',body:'Beras Rp 12.500, Telur Rp 28.000, Minyak Rp 14.000 di Warung RW'}, ronda:{title:'Jadwal Ronda',body:'Senin RT01, Selasa RT02, Rabu RT03, Kamis RT04, Jumat RT05, Sabtu RT06, Minggu Linmas. 22:00-04:00'}, bersih:{title:'Lingkungan Bersih',body:'Kerja Bakti Minggu ke-3 jam 07:00 di Lapangan'}, posyandu:{title:'Posyandu',body:'Minggu ke-2 & 3 di Balai'}, datawarga:{title:'Data Warga',body:'Wajib lapor RT kalau pindah'} };
  function openModal(t,b){ if(!modal||!modalTitle||!modalBody) return; modalTitle.innerHTML=t; modalBody.innerHTML=b; modal.classList.add('active'); document.body.style.overflow='hidden'; }
  function closeModal(){ if(!modal) return; modal.classList.remove('active'); document.body.style.overflow=''; }
  document.querySelectorAll('[data-modal]').forEach(function(el){ el.addEventListener('click', function(e){ e.preventDefault(); const k=this.getAttribute('data-modal'); const d=modalData[k]; if(d) openModal(d.title,d.body); }); });
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });

  // --- FIX BACK BUTTON ANDROID (CAPACITOR NATIVE) ---
  
  function goBackSafe(){
    if(window.history.length > 1){
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  }

  // Tombol back manual di UI
  document.querySelectorAll('.back, #backBtn').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      goBackSafe();
    });
  });

  // Deteksi Halaman Utama lebih akurat untuk WebView Android
  const currentPath = window.location.pathname;
  const isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '' || window.location.href.endsWith('/public/');

  let backPressedOnce = false;

  function handleExitApp() {
    if (backPressedOnce) {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.exitApp();
      }
    } else {
      backPressedOnce = true;
      const toast = document.createElement('div');
      toast.textContent = 'Tekan sekali lagi untuk keluar dari KATARNOLIMA';
      toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;z-index:10000;box-shadow:0 8px 22px rgba(0,0,0,0.3)';
      document.body.appendChild(toast);
      setTimeout(function(){ toast.remove(); backPressedOnce = false; }, 2000);
    }
  }

  // Penangkap tombol back Android
  const onHardwareBackButton = () => {
    // 1. Jika modal terbuka, tutup modal dulu
    if (modal && modal.classList.contains('active')) {
      closeModal();
      return;
    }

    // 2. Jika di Halaman Utama, jalankan konfirmasi 2x tekan
    if (isHomePage) {
      handleExitApp();
    } else {
      // 3. Jika di halaman lain (cari-warga, aduan-warga, dll)
      goBackSafe();
    }
  };

  // Registrasi event listener backButton
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('backButton', onHardwareBackButton);
  } else {
    document.addEventListener('backbutton', onHardwareBackButton, false);
  }

  // Fallback untuk browser / WebView biasa
  if (isHomePage) {
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', function(){
      handleExitApp();
      history.pushState(null, '', location.href);
    });
  }

  // --- REGISTRASI PUSH NOTIFICATION FIREBASE ---

  function setupPushNotifications() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
      const PushNotifications = window.Capacitor.Plugins.PushNotifications;

      // Minta izin notifikasi ke pengguna Android
      PushNotifications.requestPermissions().then(function(result) {
        if (result.receive === 'granted') {
          // Jika diizinkan, daftarkan HP ke Firebase
          PushNotifications.register();
        }
      });

      // Berhasil terdaftar & mendapat Token dari Firebase
      PushNotifications.addListener('registration', function(token) {
        console.log('Firebase Push Token:', token.value);
      });

      // Tangkap notifikasi yang masuk ketika aplikasi sedang dibuka
      PushNotifications.addListener('pushNotificationReceived', function(notification) {
        const toast = document.createElement('div');
        toast.textContent = (notification.title ? notification.title + ': ' : '') + (notification.body || 'Ada pesan baru');
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#e53935;color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;z-index:10000;box-shadow:0 8px 22px rgba(0,0,0,0.4);width:85%;max-width:360px;text-align:center;';
        document.body.appendChild(toast);
        setTimeout(function(){ toast.remove(); }, 4000);
      });
    }
  }

  // Jalankan setup push notification
  setupPushNotifications();
});
