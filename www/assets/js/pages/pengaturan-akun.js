/**
 * KATARNOLIMA — pages/pengaturan-akun.js
 * Logika halaman Pengaturan Akun (Tampilan Mode, Ubah Password, Hapus Akun).
 *
 * Hapus akun wajib ada di dalam aplikasi (kebijakan Google Play untuk aplikasi yang
 * membolehkan pembuatan akun). Alurnya: login ulang dengan password → hapus dokumen
 * users_profile/{uid} → hapus akun Firebase Auth → bersihkan data lokal.
 */
import { app } from "../services/firebase.js";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, deleteUser, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function () {

  // ============================================
  // TOMBOL BACK
  // ============================================
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => window.history.back());
  }

  // ============================================
  // TAMPILAN MODE (Terang / Gelap / Otomatis)
  // ============================================
  const THEME_KEY = 'katar-theme';
  const themeOverlay = document.getElementById('themeOverlay');
  const rowTampilan = document.getElementById('rowTampilan');
  const themeStatus = document.getElementById('themeStatus');
  const LABELS = { light: 'Terang', dark: 'Gelap', system: 'Otomatis' };

  function getThemePref() {
    return localStorage.getItem(THEME_KEY) || 'system';
  }

  function applyTheme(pref) {
    localStorage.setItem(THEME_KEY, pref);
    const root = document.documentElement;
    root.setAttribute('data-theme-pref', pref);

    if (themeStatus) themeStatus.textContent = LABELS[pref] || 'Otomatis';

    if (pref === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (pref === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }

  // Set status awal
  if (themeStatus) themeStatus.textContent = LABELS[getThemePref()] || 'Otomatis';

  // Buka modal tema
  if (rowTampilan) {
    rowTampilan.addEventListener('click', () => {
      if (!themeOverlay) return;
      themeOverlay.classList.add('show');
      const current = getThemePref();
      document.querySelectorAll('#themeOverlay .theme-opt').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.pref === current);
      });
    });
  }

  // Tutup modal saat klik overlay
  if (themeOverlay) {
    themeOverlay.addEventListener('click', (e) => {
      if (e.target === themeOverlay) themeOverlay.classList.remove('show');
    });
  }

  // Pilih tema
  document.querySelectorAll('#themeOverlay .theme-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      applyTheme(opt.dataset.pref);
      if (themeOverlay) themeOverlay.classList.remove('show');
    });
  });

  // ============================================
  // UBAH PASSWORD — kirim tautan reset ke email akun
  // ============================================
  const rowUbahPassword = document.getElementById('rowUbahPassword');
  if (rowUbahPassword) {
    rowUbahPassword.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user || !user.email) {
        alert('Silakan masuk ke akun Anda terlebih dahulu di halaman Profil.');
        return;
      }
      try {
        await sendPasswordResetEmail(auth, user.email);
        alert('Tautan ubah password sudah dikirim ke ' + user.email + '. Periksa kotak masuk / spam.');
      } catch (err) {
        console.error('Reset password gagal:', err);
        alert('Gagal mengirim tautan. Coba lagi beberapa saat lagi.');
      }
    });
  }

  // ============================================
  // HAPUS AKUN
  // ============================================
  const rowHapusAkun = document.getElementById('rowHapusAkun');
  const hapusOverlay = document.getElementById('hapusOverlay');
  const hapusPassword = document.getElementById('hapusPassword');
  const hapusStatus = document.getElementById('hapusStatus');
  const hapusYa = document.getElementById('hapusYa');
  const hapusBatal = document.getElementById('hapusBatal');

  function setStatus(teks, ok) {
    if (!hapusStatus) return;
    hapusStatus.textContent = teks || '';
    hapusStatus.classList.toggle('ok', !!ok);
  }

  function tutupHapus() {
    if (hapusOverlay) hapusOverlay.classList.remove('show');
    if (hapusPassword) hapusPassword.value = '';
    setStatus('');
  }

  if (rowHapusAkun) {
    rowHapusAkun.addEventListener('click', () => {
      if (!auth.currentUser) {
        alert('Silakan masuk ke akun Anda terlebih dahulu di halaman Profil.');
        return;
      }
      if (hapusOverlay) hapusOverlay.classList.add('show');
    });
  }
  if (hapusBatal) hapusBatal.addEventListener('click', tutupHapus);
  if (hapusOverlay) {
    hapusOverlay.addEventListener('click', (e) => { if (e.target === hapusOverlay) tutupHapus(); });
  }

  if (hapusYa) {
    hapusYa.addEventListener('click', async () => {
      const user = auth.currentUser;
      const pass = hapusPassword ? hapusPassword.value : '';
      if (!user || !user.email) { setStatus('Sesi login tidak ditemukan. Masuk ulang dulu.'); return; }
      if (!pass) { setStatus('Masukkan password untuk konfirmasi.'); return; }

      hapusYa.disabled = true;
      hapusBatal.disabled = true;
      setStatus('Memproses…', true);
      try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pass));
        const uid = user.uid;
        // Hapus profil dulu (aturan Firestore butuh sesi yang masih sah), baru akun Auth.
        await deleteDoc(doc(db, 'users_profile', uid));
        await deleteUser(user);
        ['rw05_current_user', 'rw05_user_login'].forEach((k) => localStorage.removeItem(k));
        setStatus('Akun berhasil dihapus.', true);
        setTimeout(() => { window.location.href = '../index.html'; }, 1200);
      } catch (err) {
        console.error('Hapus akun gagal:', err);
        const code = err && err.code ? err.code : '';
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') setStatus('Password salah.');
        else if (code === 'auth/too-many-requests') setStatus('Terlalu banyak percobaan. Coba lagi nanti.');
        else if (code === 'auth/network-request-failed') setStatus('Tidak ada koneksi internet.');
        else setStatus('Gagal menghapus akun. Hubungi admin RW bila berulang.');
        hapusYa.disabled = false;
        hapusBatal.disabled = false;
      }
    });
  }

});
