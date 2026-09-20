// @ts-nocheck
document.addEventListener('DOMContentLoaded', function(){
  // FIX CARI PINDAH HALAMAN
  /** @type {HTMLElement | null} */ const goCari = document.getElementById('goCari');
  if(goCari){ goCari.addEventListener('click', function(e){ e.preventDefault(); window.location.href='cari-warga.html'; }); }

  // FIX FAB MERAH - INI KUNCINYA BIAR MUNCUL LAGI
  /** @type {HTMLElement | null} */ const fabContainer = document.getElementById('fabContainer');
  /** @type {HTMLElement | null} */ const fabMain = document.getElementById('fabMain');
  /** @type {HTMLElement | null} */ const fabClose = document.getElementById('fabClose');

  if(fabMain && fabContainer){
    fabMain.addEventListener('click', function(e){
      e.stopPropagation();
      fabContainer.classList.add('active');
      console.log('FAB dibuka');
    });
  }
  if(fabClose && fabContainer){
    fabClose.addEventListener('click', function(e){
      e.stopPropagation();
      fabContainer.classList.remove('active');
      console.log('FAB ditutup');
    });
  }
  document.addEventListener('click', function(e){
    if(!fabContainer) return;
    /** @type {any} */ const target = e.target;
    if(!fabContainer.contains(target)){
      fabContainer.classList.remove('active');
    }
  });

  // MODAL
  const modal = document.getElementById('universal-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  /** @type {any} */ const modalData = { sembako:{title:'Harga Sembako RW 05',body:'Beras Rp 12.500, Telur Rp 28.000'}, ronda:{title:'Jadwal Ronda',body:'Senin RT01, Selasa RT02, Rabu RT03, Kamis RT04, Jumat RT05, Sabtu RT06, Minggu Linmas. 22:00-04:00'}, bersih:{title:'Lingkungan Bersih',body:'Kerja Bakti Minggu ke-3 jam 07:00 di Lapangan'}, pemuda:{title:'Pemuda KATAR',body:'34 anggota aktif'}, posyandu:{title:'Posyandu',body:'Minggu ke-2 & 3 di Balai'}, datawarga:{title:'Data Warga',body:'Wajib lapor RT'} };
  function openModal(/** @type {string} */ t, /** @type {string} */ b){ if(!modal||!modalTitle||!modalBody) return; modalTitle.innerHTML=t; modalBody.innerHTML=b; modal.classList.add('active'); document.body.style.overflow='hidden'; }
  function closeModal(){ if(!modal) return; modal.classList.remove('active'); document.body.style.overflow=''; }
  document.querySelectorAll('[data-modal]').forEach(function(/** @type {any} */ el){ el.addEventListener('click', function(/** @type {any} */ e){ e.preventDefault(); /** @type {string} */ const k=this.getAttribute('data-modal'); /** @type {any} */ const d=modalData[k]; if(d) openModal(d.title,d.body); }); });
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(/** @type {any} */ e){ if(e.target===modal) closeModal(); });
});
