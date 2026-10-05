/**
 * KATARNOLIMA — pages/home.js
 * Logika halaman «home» — modul (Firebase/data).
 */

import { app } from "../services/firebase.js";
import { escapeHtml } from "../core/safe.js";
import { getFirestore, doc, collection, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const db = getFirestore(app);

// REGISTRASI WEB FCM DENGAN VAPID KEY
const messaging = getMessaging(app);

function registerFCMWebToken() {
  getToken(messaging, { 
    vapidKey: 'BJysrR3HECiA25MjsMnYOzveFqDGyx7Q9EP_OTVhkODwfjqvMe0lwwul_1avP-Ck8ffoZVLYOO0NlERc0OB-0VA' 
  }).then((currentToken) => {
    if (currentToken) {
      console.log('✅ Token FCM Web Aktif:', currentToken);
      localStorage.setItem('rw05_fcm_token', currentToken);
    } else {
      console.warn('⚠️ Tidak ada token FCM yang tersedia.');
    }
  }).catch((err) => {
    console.error('❌ Error ambil Token FCM Web:', err);
  });
}

onMessage(messaging, (payload) => {
  console.log('📩 Notifikasi FCM Masuk:', payload);
  if (payload.notification) {
    if (typeof window.showCustomAlert === 'function') {
      window.showCustomAlert(payload.notification.title, payload.notification.body, '🔔');
    } else {
      alert(`🔔 ${payload.notification.title}\n\n${payload.notification.body}`);
    }
  }
});

registerFCMWebToken();

onSnapshot(doc(db, "sistem_app", "update_info"), (snap) => {
  const modal = document.getElementById('modalPushUpdateApp');
  if (!modal) return;
  const box = modal.querySelector('.modal-box');

  if (snap.exists()) {
    const data = snap.data();
    if (data.isAktif === true) {
      const elVersi = document.getElementById('appUpdateVersi');
      const elCatatan = document.getElementById('appUpdateCatatan');
      const elLink = document.getElementById('appUpdateLinkBtn');

      if (elVersi) elVersi.textContent = 'Versi ' + (data.versi || '');
      if (elCatatan) elCatatan.textContent = data.catatan || 'Perbaikan performa & peningkatan sistem.';
      if (elLink) elLink.href = data.linkDownload || '#';

      modal.style.display = 'flex';
      setTimeout(() => {
        modal.classList.add('show-overlay');
        if (box) box.classList.add('show');
      }, 10);
    } else {
      window.closePushUpdateModal();
    }
  } else {
    window.closePushUpdateModal();
  }
});

window.closePushUpdateModal = function() {
  const modal = document.getElementById('modalPushUpdateApp');
  if (!modal) return;
  const box = modal.querySelector('.modal-box');
  if (box) box.classList.remove('show');
  modal.classList.remove('show-overlay');
  setTimeout(() => { modal.style.display = 'none'; }, 250);
};

onSnapshot(doc(db, "kas_rw05", "saldo_utama"), (snap = null) => {
  if (snap && snap.exists()) {
    const data = snap.data();
    const total = data.total || 0;
    const elSaldo = document.getElementById('manualSaldoKas');
    const elInfo = document.getElementById('manualInfoKas');
    if (elSaldo) elSaldo.textContent = 'Rp ' + Number(total).toLocaleString('id-ID');
    if (elInfo && data.pesan) elInfo.textContent = data.pesan;
  }
});

onSnapshot(query(collection(db, "keamanan_rw05"), orderBy("createdAt", "desc"), limit(1)), (snap) => {
  const elJam = document.getElementById('info-jam-jaga');
  const elPetugas = document.getElementById('info-nama-petugas');
  const elHimbauan = document.getElementById('info-himbauan-keamanan');
  if (!snap.empty) {
    snap.forEach((docItem) => {
      const d = docItem.data();
      if (elJam) elJam.textContent = d.jadwal || 'Belum diatur admin';
      if (elPetugas) {
        const namaText = d.nama || '-';
        const phoneText = d.phone ? ` • 📞 ${d.phone}` : '';
        elPetugas.textContent = `${namaText}${phoneText}`;
      }
      if (elHimbauan) {
        elHimbauan.textContent = d.himbauan || 'Belum diatur admin';
      }
    });
  } else {
    if (elJam) elJam.textContent = 'Belum diatur admin';
    if (elPetugas) elPetugas.textContent = 'Belum diatur admin';
    if (elHimbauan) elHimbauan.textContent = 'Belum diatur admin';
  }
});

let unsubscribeModalIndex = null;

function renderEmptyStateIndex(modalBody, titleMsg) {
  modalBody.innerHTML = `
    <div style="text-align:center; padding:16px 12px; color:var(--ink-500);">
      <div style="font-size:48px; margin-bottom:14px;">📭</div>
      <div style="font-size:15px; font-weight:900; color:var(--ink-900); margin-bottom:6px;">Belum Ada Data dari Admin</div>
      <div style="font-size:12px; color:var(--ink-600); line-height:1.5;">${titleMsg}</div>
    </div>
  `;
}

window.openUniversalModalIndex = function(type) {
  const modal = document.getElementById('universal-modal');
  const box = modal.querySelector('.modal-box');
  const iconEl = document.getElementById('modal-icon-title');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');

  if(!modal || !box) return;
  if(unsubscribeModalIndex) { unsubscribeModalIndex(); unsubscribeModalIndex = null; }

  bodyEl.innerHTML = '<div style="text-align:center; font-size:12px; color:var(--ink-400); padding:24px 0;">Memuat data...</div>';
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show-overlay');
    box.classList.add('show');
  }, 10);

  if (type === 'sembako') {
    iconEl.textContent = '🛒'; titleEl.textContent = 'Harga Sembako RW 05';
    unsubscribeModalIndex = onSnapshot(query(collection(db, "sembako_rw05"), orderBy("createdAt", "desc"), limit(5)), (snap) => {
      if(snap.empty) { renderEmptyStateIndex(bodyEl, 'Harga sembako belum diupdate oleh pengurus RW 05.'); return; }
      let html = '<p style="font-size:12px;color:var(--ink-500);margin-bottom:12px;line-height:1.4;">Di Update Oleh Admin, Dan Harga Ini Hanyalah Patokan:</p>';
      let pasarLokasi = 'Warung Gotong Royong RW 05';
      snap.forEach((docItem) => {
        const d = docItem.data(); if(d.pasar) pasarLokasi = d.pasar;
        html += `<div style="background:var(--surface-warm); border:1.5px solid var(--ink-900); border-radius:12px; padding:10px 14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; font-weight:800; color:var(--ink-900);">🌾 ${escapeHtml(d.nama || 'Sembako')}</span>
          <span style="font-size:13px; font-weight:800; color:#2563eb;">Rp ${Number(d.harga||0).toLocaleString('id-ID')} /${escapeHtml(d.satuan||'Kg')}</span>
        </div>`;
      });
      html += `<div style="background:var(--tint-blue-50); border:1.5px solid #2563eb; border-radius:12px; padding:10px; font-size:11px; font-weight:800; color:#1e40af; margin-top:8px;">📍 Lokasi: ${escapeHtml(pasarLokasi)}</div>`;
      bodyEl.innerHTML = html;
    });
  } else if (type === 'lingkungan') {
    iconEl.textContent = '🧹'; titleEl.textContent = 'Lingkungan Bersih';
    unsubscribeModalIndex = onSnapshot(query(collection(db, "lingkungan_rw05"), orderBy("createdAt", "desc"), limit(1)), (snap) => {
      if(snap.empty) { renderEmptyStateIndex(bodyEl, 'Jadwal kerja bakti lingkungan belum diupdate oleh pengurus RW 05.'); return; }
      snap.forEach((docItem) => {
        const d = docItem.data();
        bodyEl.innerHTML = `<div style="background:var(--tint-green-50); border:1.5px solid #16a34a; border-radius:12px; padding:14px; margin-bottom:14px;"><div style="font-size:11px; font-weight:800; color:#166534; text-transform:uppercase; margin-bottom:4px;">🧹 ${escapeHtml(d.judul || 'Jadwal Kerja Bakti')}:</div><div style="font-size:14px; font-weight:800; color:#15803d;">${escapeHtml(d.tanggal || '-')}</div></div><div style="font-size:12px; color:var(--ink-700);">📍 <b>Titik Kumpul:</b> ${escapeHtml(d.lokasi || '-')}</div>`;
      });
    });
  } else if (type === 'posyandu') {
    iconEl.textContent = '👶'; titleEl.textContent = 'Layanan Posyandu';
    unsubscribeModalIndex = onSnapshot(query(collection(db, "posyandu_rw05"), orderBy("createdAt", "desc"), limit(1)), (snap) => {
      if(snap.empty) { renderEmptyStateIndex(bodyEl, 'Jadwal pelayanan posyandu belum diupdate oleh pengurus RW 05.'); return; }
      snap.forEach((docItem) => {
        const d = docItem.data();
        bodyEl.innerHTML = `<div style="background:var(--tint-red-50); border:1.5px solid #db2777; border-radius:12px; padding:14px; margin-bottom:14px;"><div style="font-size:11px; font-weight:800; color:#9d174d; text-transform:uppercase; margin-bottom:4px;">🏥 ${escapeHtml(d.judul || 'Jadwal Pelayanan')}:</div><div style="font-size:14px; font-weight:800; color:#be185d;">${escapeHtml(d.jadwal || '-')}</div></div><div style="font-size:12px; color:var(--ink-700);">💉 <b>Layanan:</b> ${escapeHtml(d.keterangan || '-')}</div>`;
      });
    });
  } else if (type === 'belajar') {
    iconEl.textContent = '📚'; titleEl.textContent = 'Belajar Bersama';
    unsubscribeModalIndex = onSnapshot(query(collection(db, "kegiatan_rw05"), orderBy("createdAt", "desc"), limit(1)), (snap) => {
      if(snap.empty) { renderEmptyStateIndex(bodyEl, 'Jadwal belajar bersama/bimbel belum diupdate oleh pengurus RW 05.'); return; }
      snap.forEach((docItem) => {
        const d = docItem.data();
        bodyEl.innerHTML = `<div style="background:var(--tint-blue-50); border:1.5px solid #2563eb; border-radius:12px; padding:14px; margin-bottom:14px;"><div style="font-size:11px; font-weight:800; color:#1e40af; text-transform:uppercase; margin-bottom:4px;">🎓 ${escapeHtml(d.judul || 'Bimbel')}:</div><div style="font-size:14px; font-weight:800; color:#1d4ed8;">${escapeHtml(d.jadwal || '-')}</div></div><div style="font-size:12px; color:var(--ink-700);">✏️ <b>Detail:</b> ${escapeHtml(d.isi || '-')}</div>`;
      });
    });
  } else if (type === 'datawarga') {
    iconEl.textContent = '📋'; titleEl.textContent = 'Data Warga';
    bodyEl.innerHTML = `
      <p style="font-size:13px; color:var(--ink-700); line-height:1.6; margin-bottom:18px;">Pindahan baru, pembuatan surat pengantar, atau pembaruan KK/KTP wajib lapor ke Ketua RT setempat.</p>
      <a href="https://wa.me/6289673580756?text=Halo%20Sekretaris%20RW05,%20saya%20ingin%20mengurus%20Data%20Warga" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; background:#16a34a; color:#fff; font-weight:700; font-size:13px; padding:12px 0; border-radius:12px; text-decoration:none; box-sizing:border-box;">💬 Hubungi Sekretaris RW via WA</a>
    `;
  } else if (type === 'petaBalai') {
    iconEl.textContent = '📍'; titleEl.textContent = 'Balai Serbaguna RW 05';
    bodyEl.innerHTML = `
      <div style="text-align:left">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <img src="assets/img/balai-1.jpg" style="width:100%;height:110px;object-fit:cover;border-radius:12px;border:1px solid var(--border)" alt="Papan Balai RW 05">
          <img src="assets/img/balai-2.jpg" style="width:100%;height:110px;object-fit:cover;border-radius:12px;border:1px solid var(--border)" alt="Ruangan Dalam Balai RW 05">
        </div>
        <p style="font-size:12px;color:var(--ink-700);line-height:1.5;margin-bottom:14px;background:var(--bg-page);padding:10px 12px;border-radius:10px;border:1px solid var(--surface-soft)">
          <b>📍 Alamat Lengkap:</b><br>
          Jl. Poncol Gg. XI No.15 8, RT.8/RW.5, Kuningan Bar., Kec. Mampang Prpt., Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12710
        </p>
        <a href="https://maps.app.goo.gl/qYc6rwZgjHvN3AWCA" target="_blank" style="display:block;width:100%;background:#2563eb;color:#ffffff;text-align:center;padding:12px;border-radius:12px;font-weight:800;text-decoration:none;font-size:13px;box-shadow:0 4px 12px rgba(37,99,235,0.25)">
          🗺️ Buka Navigasi Google Maps
        </a>
      </div>
    `;
  }
};

window.closeUniversalModal = function() {
  const modal = document.getElementById('universal-modal');
  if(!modal) return;
  const box = modal.querySelector('.modal-box');
  if(box) box.classList.remove('show');
  modal.classList.remove('show-overlay');
  setTimeout(() => { modal.style.display = 'none'; }, 250);
  if(unsubscribeModalIndex) { unsubscribeModalIndex(); unsubscribeModalIndex = null; }
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-modal]').forEach(item => {
    item.addEventListener('click', () => {
      const modalType = item.getAttribute('data-modal');
      if (modalType) {
        openUniversalModalIndex(modalType);
      }
    });
  });

  const uniModal = document.getElementById('universal-modal');
  if(uniModal) {
    uniModal.addEventListener('click', (e) => {
      if(e.target === uniModal) closeUniversalModal();
    });
  }

  const ambModal = document.getElementById('ambulans-modal');
  if(ambModal) {
    ambModal.addEventListener('click', (e) => {
      if(e.target === ambModal) closeAmbulansModal();
    });
  }

  const pushModal = document.getElementById('modalPushUpdateApp');
  if(pushModal) {
    pushModal.addEventListener('click', (e) => {
      if(e.target === pushModal) closePushUpdateModal();
    });
  }

  const fallbackInput = document.getElementById('fallbackFileInput');
  if(fallbackInput) {
    fallbackInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (evt) => {
        sessionStorage.setItem('temp_aduan_photo', evt.target.result);
        closeCustomCamera();
        window.location.href = 'pages/aduan-warga.html?autoOpen=1';
      };
    });
  }
});
