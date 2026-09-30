/**
 * KATARNOLIMA — pages/admin/ui.js
 * Interaksi umum panel: pindah tab, sidebar, tutup modal, pilih ikon info, salin GPS.
 * Fungsi window.* dipakai oleh atribut onclick di admin.html. Berjalan saat modul dimuat.
 */

window.switchTab = function(tab){
  document.querySelectorAll('.menu-item').forEach(b=>b.classList.remove('active'));
  const targetBtn = document.querySelector(`[data-tab="${tab}"]`);
  if(targetBtn) targetBtn.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  const targetTab = document.getElementById('tab-'+tab);
  if(targetTab) targetTab.classList.add('active');
  const sidebar = document.getElementById('sidebar');
  if(sidebar) sidebar.classList.remove('open');
};

document.querySelectorAll('.menu-item[data-tab]').forEach(btn=>{
  btn.addEventListener('click', ()=>{ window.switchTab(btn.dataset.tab||'dashboard'); });
});

const hamburger = document.getElementById('hamburger');
if(hamburger) {
  hamburger.addEventListener('click', ()=>{
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.toggle('open');
  });
}

window.closeModal = function(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('show');
};

/* PILIHAN IKON INFO SINGKAT & RESET */
window.pilihIkon = function(el, symbol) {
  document.querySelectorAll('.icon-opt').forEach(opt => opt.classList.remove('selected'));
  if (el) el.classList.add('selected');
  const hiddenInput = document.getElementById('infoIkonVal');
  if (hiddenInput) hiddenInput.value = symbol;
};

window.resetIkonInfo = function() {
  const opts = document.querySelectorAll('.icon-opt');
  opts.forEach(opt => opt.classList.remove('selected'));
  if (opts[0]) opts[0].classList.add('selected');
  const hiddenInput = document.getElementById('infoIkonVal');
  if (hiddenInput) hiddenInput.value = '🔔';
};

/* SALIN KOORDINAT ATAU TEKS LOKASI GPS ADUAN */
window.salinGPS = function(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    window.showModal({ title: 'Tersalin!', desc: `Lokasi/Koordinat (${text}) telah disalin ke clipboard.`, icon: '📋' });
  }).catch(() => {
    window.showModal({ title: 'Info Lokasi', desc: `Lokasi: ${text}`, icon: '📍' });
  });
};
