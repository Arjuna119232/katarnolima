/**
 * KATARNOLIMA — pages/admin/settings.js
 * Tab Pengaturan: mode tampilan panel & toggle badge aduan. Berjalan saat modul dimuat.
 */

// --- Pengaturan: Mode Tampilan Panel Admin ---
(function(){
  var STORAGE_KEY = 'katar-theme';
  var picker = document.getElementById('adminThemePicker');
  if(!picker) return;
  var opts = picker.querySelectorAll('.admin-theme-opt');
  function getPref(){ try { return localStorage.getItem(STORAGE_KEY) || 'system'; } catch(e){ return 'system'; } }
  function applyPref(pref){
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    var resolved = pref === 'dark' ? 'dark' : pref === 'light' ? 'light' : (mql.matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', pref);
    try { localStorage.setItem(STORAGE_KEY, pref); } catch(e){}
  }
  function refresh(){ var p=getPref(); opts.forEach(function(el){ el.classList.toggle('selected', el.getAttribute('data-pref')===p); }); }
  opts.forEach(function(el){ el.addEventListener('click', function(){ applyPref(el.getAttribute('data-pref')); refresh(); }); });
  refresh();
})();

// --- Pengaturan: Toggle badge notifikasi aduan ---
(function(){
  var chk = document.getElementById('chkBadgeAduan');
  if(!chk) return;
  var KEY = 'katar_admin_badge_aduan';
  try { var saved = localStorage.getItem(KEY); if (saved !== null) chk.checked = saved === '1'; } catch(e){}
  function apply(){
    var badge = document.getElementById('badgeAduan');
    if(!badge) return;
    if(!chk.checked){ badge.dataset.forceHidden = '1'; badge.style.display = 'none'; }
    else { delete badge.dataset.forceHidden; }
  }
  chk.addEventListener('change', function(){ try { localStorage.setItem(KEY, chk.checked?'1':'0'); } catch(e){} apply(); });
  apply();
})();
