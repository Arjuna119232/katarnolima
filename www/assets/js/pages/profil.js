/**
 * KATARNOLIMA — pages/profil.js
 * Logika halaman «profil» — modul (Firebase/data).
 */

// @ts-nocheck
import { app } from "../services/firebase.js";
import { getFirestore, doc, getDoc, setDoc, getDocs, query, collection, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth(app);

// FUNGSI TOGGLE LIHAT PASSWORD (MATA)
window.togglePasswordVisibility = function(inputId, btnEl) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;
  if (inputEl.type === "password") {
    inputEl.type = "text";
    btnEl.textContent = "🙈";
  } else {
    inputEl.type = "password";
    btnEl.textContent = "👁️";
  }
};

window.showModal = function({ title = 'Info', desc = '', icon = '📢', type = 'alert', onYes = null }) {
  const modal = document.getElementById('appCustomModal');
  const elTitle = document.getElementById('modalTitle');
  const elDesc = document.getElementById('modalDesc');
  const elIcon = document.getElementById('modalIcon');
  const elBtns = document.getElementById('modalButtons');
  const btnCloseX = document.getElementById('modalCloseX');

  if(!modal) return;
  if(elTitle) elTitle.textContent = title;
  if(elDesc) elDesc.textContent = desc;
  if(elIcon) elIcon.textContent = icon;

  modal.classList.add('show');

  const closeIt = () => { modal.classList.remove('show'); };

  if(btnCloseX) btnCloseX.onclick = closeIt;
  modal.onclick = (e) => { if(e.target === modal) closeIt(); };

  if (type === 'confirm') {
    elBtns.innerHTML = `
      <button class="btn btn-outline" style="flex:1;" id="modalBtnNo">Tidak</button>
      <button class="btn btn-primary" style="flex:1;" id="modalBtnYes">Iya</button>
    `;
    const btnNo = document.getElementById('modalBtnNo');
    const btnYes = document.getElementById('modalBtnYes');
    if(btnNo) btnNo.onclick = closeIt;
    if(btnYes) btnYes.onclick = () => { closeIt(); if(onYes) onYes(); };
  } else {
    elBtns.innerHTML = `<button class="btn btn-primary" style="width:100%;" id="modalBtnOk">Siap, Mengerti</button>`;
    const btnOk = document.getElementById('modalBtnOk');
    if(btnOk) btnOk.onclick = closeIt;
  }
};

const loginView = document.getElementById('loginView');
const loggedView = document.getElementById('loggedView');
const formLogin = document.getElementById('formLogin');
const formDaftar = document.getElementById('formDaftar');
const judulForm = document.getElementById('judulForm');
const descForm = document.getElementById('descForm');

function getTwoInitials(nama = '') {
  const parts = nama.trim().split(/\s+/);
  if (!parts[0]) return 'WG';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function renderLoggedUI(userObj){
  if(loginView) loginView.style.display='none';
  if(loggedView) loggedView.style.display='block';
  const elNama = document.getElementById('displayNama');
  const elRtFull = document.getElementById('rtFull');
  const elAvatar = document.getElementById('avatarInit');
  const namaVal = userObj.nama || 'Warga';

  if(elNama) elNama.textContent = namaVal;
  if(elRtFull) elRtFull.textContent = userObj.rt || 'RT 03 / RW 05';
  if(elAvatar) {
    if(userObj.avatarEmoji) {
      elAvatar.textContent = userObj.avatarEmoji;
    } else {
      elAvatar.textContent = getTwoInitials(namaVal);
    }
  }
}

function renderLoginUI(){
  if(loginView) loginView.style.display='block';
  if(loggedView) loggedView.style.display='none';
}

const initialUser = JSON.parse(localStorage.getItem('rw05_current_user')||'null');
if(initialUser){
  renderLoggedUI(initialUser);
} else {
  renderLoginUI();
}

onAuthStateChanged(auth, async (user) => {
  if(user){
    try {
      const userDoc = await getDoc(doc(db, "users_profile", user.uid));
      let profileData = {};
      if(userDoc.exists()){
        profileData = userDoc.data();
      } else {
        profileData = { nama: user.email ? user.email.split('@')[0] : 'Warga', rt: 'RT 03 / RW 05', email: user.email };
      }
      const currentPayload = {
        nama: profileData.nama,
        email: user.email,
        rt: profileData.rt,
        phone: profileData.phone || initialUser?.phone || '',
        avatarEmoji: profileData.avatarEmoji || initialUser?.avatarEmoji || '',
        uid: user.uid
      };
      localStorage.setItem('rw05_current_user', JSON.stringify(currentPayload));
      renderLoggedUI(currentPayload);
    } catch(err) {
      console.error("Gagal load profil:", err);
    }
  }
});

const btnMasuk = document.getElementById('btnMasuk');
if(btnMasuk){
  btnMasuk.addEventListener('click', async function(){
    const email = document.getElementById('inputEmailLogin')?.value.trim() || '';
    const pass = document.getElementById('inputPassLogin')?.value.trim() || '';
    if(!email || !pass){ 
      window.showModal({ title: 'Input Belum Lengkap', desc: 'Silakan masukkan email dan password terdaftar Anda.', icon: '⚠️' });
      return; 
    }
    btnMasuk.textContent = "Memverifikasi...";
    btnMasuk.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch(err) {
      window.showModal({ title: 'Gagal Masuk', desc: 'Kredensial (email/sandi) tidak cocok atau akun belum terdaftar.', icon: '❌' });
    } finally {
      btnMasuk.textContent = "Masuk Akun";
      btnMasuk.disabled = false;
    }
  });
}

const btnDaftar = document.getElementById('btnDaftar');
if(btnDaftar){
  btnDaftar.addEventListener('click', async function(){
    const nama = document.getElementById('inputNamaDaftar')?.value.trim() || '';
    const rt = document.getElementById('inputRT')?.value.trim() || 'RT 03 / RW 05';
    const email = document.getElementById('inputEmailDaftar')?.value.trim() || '';
    const pass = document.getElementById('inputPassDaftar')?.value.trim() || '';

    if(nama.length < 3){ 
      window.showModal({ title: 'Nama Terlalu Pendek', desc: 'Nama lengkap harus diisi minimal 3 karakter.', icon: '⚠️' });
      return; 
    }
    if(!email || pass.length < 6){ 
      window.showModal({ title: 'Input Tidak Valid', desc: 'Email wajib diisi dan password minimal 6 karakter.', icon: '⚠️' });
      return; 
    }

    btnDaftar.textContent = "Mendaftarkan...";
    btnDaftar.disabled = true;
    try {
      const cekNama = await getDocs(query(collection(db, "users_profile"), where("nama", "==", nama)));
      if(!cekNama.empty){
        window.showModal({ title: 'Nama Terpakai', desc: 'Nama lengkap ini sudah terdaftar atas akun lain.', icon: '❌' });
        return;
      }

      const cekEmail = await getDocs(query(collection(db, "users_profile"), where("email", "==", email)));
      if(!cekEmail.empty){
        window.showModal({ title: 'Email Terpakai', desc: 'Email ini sudah terdaftar di sistem.', icon: '❌' });
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;

      const newPayload = {
        nama: nama,
        rt: rt,
        email: email,
        uid: user.uid,
        avatarEmoji: '',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "users_profile", user.uid), newPayload);
      localStorage.setItem('rw05_current_user', JSON.stringify(newPayload));
      renderLoggedUI(newPayload);

      window.showModal({ title: 'Registrasi Berhasil', desc: 'Akun Anda berhasil dibuat. Selamat datang, ' + nama, icon: '✅' });
    } catch(err) {
      window.showModal({ title: 'Gagal Mendaftar', desc: err.message, icon: '❌' });
    } finally {
      btnDaftar.textContent = "Daftar Akun Baru";
      btnDaftar.disabled = false;
    }
  });
}

// Catatan: aksi "Keluar Akun" juga tersedia di halaman ini (menuKeluarProfil).

const linkDaftar = document.getElementById('linkDaftar');
const textBawah = document.getElementById('textBawah');
let isDaftar = false;

if(linkDaftar){
  linkDaftar.addEventListener('click', function(e){
    e.preventDefault();
    isDaftar = !isDaftar;
    if(isDaftar){
      if(formLogin) formLogin.style.display='none'; 
      if(formDaftar) formDaftar.style.display='block';
      if(judulForm) judulForm.textContent='Daftar Akun Warga'; 
      if(descForm) descForm.textContent='Daftarkan akun email dan password untuk akses RW 05.';
      if(textBawah) textBawah.textContent='Sudah punya akun?'; 
      linkDaftar.textContent='Masuk di sini';
    } else {
      if(formLogin) formLogin.style.display='block'; 
      if(formDaftar) formDaftar.style.display='none';
      if(judulForm) judulForm.textContent='Masuk Warga RW 05'; 
      if(descForm) descForm.textContent='Masuk menggunakan email dan password terdaftar.';
      if(textBawah) textBawah.textContent='Belum punya akun?'; 
      linkDaftar.textContent='Daftar di sini';
    }
  });
}
