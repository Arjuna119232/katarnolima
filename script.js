// @ts-nocheck
document.addEventListener('DOMContentLoaded', function(){
  const goCari = document.getElementById('goCari');
  if(goCari){ goCari.addEventListener('click', function(e){ e.preventDefault(); window.location.href='cari-warga.html'; }); }

  // FAB MERAH + ANIMASI KEDIP
  const fabContainer = document.getElementById('fabContainer');
  const fabMain = document.getElementById('fabMain');
  const fabClose = document.getElementById('fabClose');
  if(fabMain && fabContainer){ fabMain.addEventListener('click', function(e){ e.stopPropagation(); fabContainer.classList.add('active'); }); }
  if(fabClose && fabContainer){ fabClose.addEventListener('click', function(e){ e.stopPropagation(); fabContainer.classList.remove('active'); }); }
  document.addEventListener('click', function(e){ if(!fabContainer) return; const target = e.target; if(!fabContainer.contains(target)){ fabContainer.classList.remove('active'); } });

  // --- FIX BACK BUTTON ANDROID (CAPACITOR & WEB HISTORY) ---
  
  function goBackSafe(){
    if(window.history.length > 1){
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  }

  // Pasang ke semua tombol back manual di UI (misal ikon panah kembali)
  document.querySelectorAll('.back, #backBtn').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      goBackSafe();
    });
  });

  // Logika 2x tekan back khusus di Halaman Utama (index.html)
  let backPressedOnce = false;
  const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

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

  // Intersepsi tombol Back fisik / Navbar Android melalui Capacitor Native
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('backButton', function() {
      // Jika modal sedang terbuka, tutup modalnya dulu
      if (modal && modal.classList.contains('active')) {
        closeModal();
        return;
      }

      // Jika di halaman utama, jalankan konfirmasi 2x tekan
      if (isHomePage) {
        handleExitApp();
      } else {
        // Jika di halaman lain, mundur safe ke halaman sebelumnya
        goBackSafe();
      }
    });
  }

  // Backup fallback untuk browser / WebView non-native
  if (isHomePage) {
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', function(){
      handleExitApp();
      history.pushState(null, '', location.href);
    });
  }

  // MODAL
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
});
