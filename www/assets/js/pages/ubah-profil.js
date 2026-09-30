/**
 * KATARNOLIMA — pages/ubah-profil.js
 * Logika halaman «ubah-profil» — modul (Firebase/data).
 */

// @ts-nocheck
import { app } from "../services/firebase.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth(app);

const inputNamaUbah = document.getElementById('inputNamaUbah');
const inputEmail = document.getElementById('inputEmail');
const inputUsername = document.getElementById('inputUsername');
const avatarBig = document.getElementById('editAvatarInit');
const inputPhone = document.getElementById('inputPhone');
const phoneStatusText = document.getElementById('phoneStatusText');
const btnVerifyPhone = document.getElementById('btnVerifyPhone');

let currentEmoji = '';

function getTwoInitials(nama = '') {
  const parts = nama.trim().split(/\s+/);
  if (!parts[0]) return 'WG';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

window.pickEmoji = function(e) {
  currentEmoji = e;
  renderAvatarDisplay();
};

function renderAvatarDisplay() {
  if (!avatarBig) return;
  if (currentEmoji) {
    avatarBig.textContent = currentEmoji;
  } else {
    const namaVal = inputNamaUbah ? inputNamaUbah.value : '';
    avatarBig.textContent = getTwoInitials(namaVal);
  }
}

function updatePhoneUIState(val, verified) {
  const cleanVal = (val || '').trim();
  if (verified) {
    if(phoneStatusText) {
      phoneStatusText.textContent = 'Terverifikasi';
      phoneStatusText.className = 'status-verified';
    }
    if(btnVerifyPhone) {
      btnVerifyPhone.style.display = 'block';
      btnVerifyPhone.textContent = 'Sudah Verifikasi';
      btnVerifyPhone.style.background = 'var(--border)';
      btnVerifyPhone.style.color = '#64748b';
      btnVerifyPhone.disabled = true;
    }
  } else if (cleanVal.length > 0) {
    if(phoneStatusText) {
      phoneStatusText.style.display = 'block';
      phoneStatusText.textContent = 'Belum Terverifikasi';
      phoneStatusText.className = 'status-unverified';
    }
    if(btnVerifyPhone) {
      btnVerifyPhone.style.display = 'block';
      btnVerifyPhone.textContent = 'Verifikasi';
      btnVerifyPhone.style.background = '#16a34a';
      btnVerifyPhone.style.color = '#ffffff';
      btnVerifyPhone.disabled = false;
    }
  } else {
    if(phoneStatusText) phoneStatusText.style.display = 'none';
    if(btnVerifyPhone) btnVerifyPhone.style.display = 'none';
  }
}

function applyUserData(data) {
  if (!data) return;
  if(inputNamaUbah) inputNamaUbah.value = data.nama || '';
  if(inputEmail) inputEmail.value = data.email || '';
  if(inputUsername) inputUsername.value = (data.nama ? data.nama.replace(/\s+/g, '_') : 'Warga') + '_RW05';
  if(inputPhone) inputPhone.value = data.phone || '';

  currentEmoji = data.avatarEmoji || '';
  renderAvatarDisplay();
  updatePhoneUIState(data.phone, data.phoneVerified);
}

if(inputNamaUbah) {
  inputNamaUbah.addEventListener('input', function() {
    renderAvatarDisplay();
  });
}

if(inputPhone) {
  inputPhone.addEventListener('input', function() {
    updatePhoneUIState(this.value, false);
  });
}

const localUser = JSON.parse(localStorage.getItem('rw05_current_user')||'null');
if(localUser) applyUserData(localUser);
else updatePhoneUIState('', false);

onAuthStateChanged(auth, async (user) => {
  if(user) {
    try {
      const snap = await getDoc(doc(db, "users_profile", user.uid));
      let merged = localUser || {};
      merged.email = user.email;
      if(snap.exists()) {
        const d = snap.data();
        merged.nama = d.nama || merged.nama;
        merged.rt = d.rt || merged.rt;
        merged.phone = d.phone || merged.phone;
        merged.phoneVerified = d.phoneVerified || merged.phoneVerified;
        merged.avatarEmoji = d.avatarEmoji || merged.avatarEmoji || '';
      }
      localStorage.setItem('rw05_current_user', JSON.stringify(merged));
      applyUserData(merged);
    } catch(e) {
      console.error('Gagal sync profile:', e);
    }
  }
});

if(btnVerifyPhone && inputPhone){
  btnVerifyPhone.addEventListener('click', function(){
    const currentPhoneVal = inputPhone.value.trim();
    if(!currentPhoneVal || currentPhoneVal.length < 9){
      alert('⚠️ Masukkan nomor handphone yang valid terlebih dahulu!');
      return;
    }
    const simulatedOtp = '54321';
    alert(`📲 Simulasi OTP terkirim ke WhatsApp/SMS ${currentPhoneVal}.\n(Kode uji coba Anda: ${simulatedOtp})`);
    const inputOtp = prompt('Masukkan 5 digit kode OTP yang dikirim:');
    if(inputOtp === simulatedOtp){
      updatePhoneUIState(currentPhoneVal, true);

      let currentData = JSON.parse(localStorage.getItem('rw05_current_user')||'{}');
      currentData.phoneVerified = true;
      currentData.phone = currentPhoneVal;
      localStorage.setItem('rw05_current_user', JSON.stringify(currentData));
      alert('✅ Nomor handphone berhasil diverifikasi!');
    } else if(inputOtp !== null) {
      alert('❌ Kode OTP salah!');
    }
  });
}

const btnSimpan = document.getElementById('btnSimpanProfil');
if(btnSimpan){
  btnSimpan.addEventListener('click', async function(){
    const newNama = inputNamaUbah ? inputNamaUbah.value.trim() : 'Warga';
    const newPhone = inputPhone ? inputPhone.value.trim() : '';
    const newEmail = inputEmail ? inputEmail.value.trim() : '';

    if(newNama.length < 3){
      alert('Nama lengkap minimal 3 karakter.');
      return;
    }

    btnSimpan.textContent = 'Menyimpan...';
    btnSimpan.disabled = true;

    try {
      let currentData = JSON.parse(localStorage.getItem('rw05_current_user')||'{}');
      const isVerified = newPhone ? (currentData?.phone === newPhone && currentData?.phoneVerified) : false;

      const updatedUser = {
        ...currentData,
        nama: newNama,
        email: newEmail,
        phone: newPhone,
        rt: currentData?.rt || 'RT 03 / RW 05',
        avatarEmoji: currentEmoji,
        phoneVerified: isVerified
      };

      localStorage.setItem('rw05_current_user', JSON.stringify(updatedUser));

      if(auth.currentUser) {
        try {
          await updateDoc(doc(db, "users_profile", auth.currentUser.uid), {
            nama: newNama,
            phone: newPhone,
            phoneVerified: isVerified,
            avatarEmoji: currentEmoji
          });
        } catch(e) {
          console.warn('Firestore update non-fatal:', e);
        }
      }

      alert('✅ Profil berhasil disimpan!');
      window.location.href = 'profil.html';
    } catch(err) {
      alert('❌ Gagal menyimpan profil: ' + err.message);
    } finally {
      btnSimpan.textContent = 'Simpan';
      btnSimpan.disabled = false;
    }
  });
}
