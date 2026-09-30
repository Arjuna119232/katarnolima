/**
 * KATARNOLIMA — core/haptics.js
 * Getaran (haptic) global — menghormati preferensi 'Getaran saat Menyentuh' di Pengaturan.
 * Menyediakan: window.katarVibrate(ms)
 */

// Helper getar global — menghormati preferensi "Getaran saat Menyentuh" di halaman Pengaturan.
// Default aktif jika belum pernah diatur pengguna.
window.katarVibrate = function(ms) {
  try {
    var pref = localStorage.getItem('katar_pref_haptic');
    if (pref === '0') return;
    if (navigator.vibrate) navigator.vibrate(ms || 10);
  } catch (e) {}
};
