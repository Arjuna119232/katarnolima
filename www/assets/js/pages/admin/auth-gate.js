/**
 * KATARNOLIMA — pages/admin/auth-gate.js
 * Gerbang login admin (Firebase Auth) dan tombol keluar.
 * onReady() dipanggil ketika sesi admin sah, untuk memulai semua fitur panel.
 */
import { auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "./firebase.js";

export function setupAuthGate(onReady) {
  const adminGate = document.getElementById('adminGate');
  const gateEmail = document.getElementById('gateEmail');
  const gatePass = document.getElementById('gatePass');
  const gateError = document.getElementById('gateError');
  const btnGateLogin = document.getElementById('btnGateLogin');
  const adminEmailLabel = document.getElementById('adminEmailLabel');

  function showGate(){ if(adminGate) adminGate.style.display='flex'; }
  function hideGate(){ if(adminGate) adminGate.style.display='none'; }

  // Gerbang hanya terbuka bila Firebase Auth benar-benar punya sesi. Dulu ada cadangan
  // "rw05_admin_session" di localStorage — itu bisa dipalsukan siapa saja dan membuka
  // tampilan admin tanpa login. Keamanan data tetap ditegakkan Firestore Rules.
  onAuthStateChanged(auth, (user)=>{
    if(user){
      hideGate();
      if(adminEmailLabel) adminEmailLabel.textContent = user.email || 'Admin';
      onReady();
    }else{
      showGate();
    }
  });

  if(btnGateLogin){
    btnGateLogin.addEventListener('click', async ()=>{
      const email=gateEmail ? gateEmail.value.trim() : '';
      const pass=gatePass ? gatePass.value.trim() : '';
      if(!email||!pass){ if(gateError){gateError.textContent='Isi email & password!';gateError.style.display='block';} return; }
      btnGateLogin.textContent='Memverifikasi...'; btnGateLogin.setAttribute('disabled', 'true');
      try{
        await signInWithEmailAndPassword(auth,email,pass);
        hideGate();
      }catch(e){if(gateError){gateError.textContent='❌ Email / password salah!';gateError.style.display='block';}}
      finally{if(btnGateLogin){btnGateLogin.textContent='Masuk Admin';btnGateLogin.removeAttribute('disabled');}}
    });
  }

  const btnLogout = document.getElementById('btnLogout');
  if(btnLogout) btnLogout.addEventListener('click', ()=>{
    window.showModal({
      title: 'Keluar Admin',
      desc: 'Apakah Anda yakin ingin keluar dari sesi panel admin ini?',
      icon: '🚪',
      type: 'confirm',
      onYes: async () => {
        await signOut(auth); 
        window.location.href='profil.html';
      }
    });
  });
}
