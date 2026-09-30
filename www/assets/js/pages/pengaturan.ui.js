/**
 * KATARNOLIMA — pages/pengaturan.ui.js
 * Logika halaman «pengaturan» — skrip UI.
 */

// --- Kembali ---
document.getElementById('backBtn').addEventListener('click', function(){
  if (window.history.length > 1) window.history.back();
  else window.location.href = 'profil.html';
});

// --- Modal universal (pola sama dengan profil.html & admin.html) ---
window.showModal = function({ title = 'Info', desc = '', icon = 'ℹ️', type = 'alert', onYes = null }) {
  var modal = document.getElementById('appCustomModal');
  document.getElementById('modalIcon').textContent = icon;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalDesc').textContent = desc;
  var btns = document.getElementById('modalButtons');
  btns.innerHTML = '';
  if (type === 'confirm') {
    var no = document.createElement('button'); no.className = 'btn btn-outline'; no.style.flex = '1'; no.textContent = 'Batal';
    var yes = document.createElement('button'); yes.className = 'btn btn-primary'; yes.style.flex = '1'; yes.textContent = 'Ya, Lanjutkan';
    no.onclick = function(){ closeCustomModal(); };
    yes.onclick = function(){ closeCustomModal(); if (typeof onYes === 'function') onYes(); };
    btns.appendChild(no); btns.appendChild(yes);
  } else {
    var ok = document.createElement('button'); ok.className = 'btn btn-primary'; ok.style.width = '100%'; ok.textContent = 'Mengerti';
    ok.onclick = function(){ closeCustomModal(); };
    btns.appendChild(ok);
  }
  modal.classList.add('show');
};
function closeCustomModal(){ document.getElementById('appCustomModal').classList.remove('show'); }
document.getElementById('modalCloseX').addEventListener('click', closeCustomModal);
document.getElementById('appCustomModal').addEventListener('click', function(e){ if (e.target === this) closeCustomModal(); });

// --- Kartu akun singkat dari cache lokal (tanpa perlu memanggil ulang server) ---
(function(){
  try {
    var cached = JSON.parse(localStorage.getItem('rw05_current_user') || 'null');
    if (cached && cached.nama) {
      document.getElementById('setNama').textContent = cached.nama;
      document.getElementById('setSub').textContent = (cached.rt ? cached.rt + ' / RW 05' : 'Kelola akun & preferensi aplikasi kamu');
      var parts = cached.nama.trim().split(/\s+/);
      var initials = (parts[0][0] || 'W') + (parts[1] ? parts[1][0] : (parts[0][1]||'G'));
      document.getElementById('setAvatarInit').textContent = initials.toUpperCase();
    }
  } catch(e) {}
})();

// --- Pemilih Mode Tampilan (Terang/Gelap/Otomatis) ---
(function(){
  var STORAGE_KEY = 'katar-theme';
  var picker = document.getElementById('themePicker');
  var opts = picker.querySelectorAll('.theme-opt');

  function getPref(){ try { return localStorage.getItem(STORAGE_KEY) || 'system'; } catch(e){ return 'system'; } }

  function applyPref(pref){
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    var resolved = pref === 'dark' ? 'dark' : pref === 'light' ? 'light' : (mql.matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', pref);
    try { localStorage.setItem(STORAGE_KEY, pref); } catch(e){}
  }

  function refreshSelection(){
    var pref = getPref();
    opts.forEach(function(el){ el.classList.toggle('selected', el.getAttribute('data-pref') === pref); });
  }

  opts.forEach(function(el){
    el.addEventListener('click', function(){
      applyPref(el.getAttribute('data-pref'));
      refreshSelection();
    });
  });

  refreshSelection();
})();

// --- Toggle notifikasi & preferensi tersimpan di perangkat ---
(function(){
  document.querySelectorAll('input[type="checkbox"][data-pref]').forEach(function(chk){
    var key = 'katar_pref_' + chk.getAttribute('data-pref');
    try {
      var saved = localStorage.getItem(key);
      if (saved !== null) chk.checked = saved === '1';
    } catch(e){}
    chk.addEventListener('change', function(){
      try { localStorage.setItem(key, chk.checked ? '1' : '0'); } catch(e){}
      if (typeof window.katarVibrate === 'function') window.katarVibrate(8);
    });
  });
})();

// --- Bersihkan data lokal (preferensi & cache tampilan, TIDAK menghapus sesi login) ---
document.getElementById('btnClearCache').addEventListener('click', function(){
  window.showModal({
    title: 'Bersihkan Data Lokal?',
    desc: 'Preferensi tampilan, notifikasi, dan cache lokal di perangkat ini akan dihapus. Akun kamu tidak akan terpengaruh.',
    icon: '🧹',
    type: 'confirm',
    onYes: function(){
      Object.keys(localStorage).forEach(function(k){
        if (k.indexOf('katar_pref_') === 0) localStorage.removeItem(k);
      });
      window.showModal({ title: 'Selesai', desc: 'Data lokal berhasil dibersihkan.', icon: '✅' });
    }
  });
});

