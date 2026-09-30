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

  onAuthStateChanged(auth, (user)=>{
    if(user){
      localStorage.setItem('rw05_admin_session', JSON.stringify({email:user.email, uid:user.uid, loginAt:Date.now()}));
      hideGate();
      if(adminEmailLabel) adminEmailLabel.textContent = user.email || 'Admin';
      onReady();
    }else{
      const sess = JSON.parse(localStorage.getItem('rw05_admin_session')||'null');
      if(sess && Date.now()-sess.loginAt < 24*60*60*1000){
        hideGate();
        if(adminEmailLabel) adminEmailLabel.textContent = sess.email || 'Admin';
        onReady();
      }else{
        showGate();
      }
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
        localStorage.removeItem('rw05_admin_session'); 
        window.location.href='profil.html';
      }
    });
  });
}
