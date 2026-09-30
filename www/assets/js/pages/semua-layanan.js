/**
 * KATARNOLIMA — pages/semua-layanan.js
 * Logika halaman «semua-layanan» — modul (Firebase/data).
 */

import { app } from "../services/firebase.js";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);

let unsubscribeModal = null;

function renderEmptyState(modalBody, titleMsg) {
  modalBody.innerHTML = `
    <div style="text-align:center; padding:20px 12px; color:var(--ink-500);">
      <div style="font-size:40px; margin-bottom:10px;">📭</div>
      <div style="font-size:14px; font-weight:800; color:var(--ink-900); margin-bottom:4px;">Belum Ada Data dari Admin</div>
      <div style="font-size:12px; color:var(--ink-500); line-height:1.5;">${titleMsg}</div>
    </div>
  `;
}

window.openServiceModal = function(type) {
  const modal = document.getElementById('universal-modal');
  const box = modal ? modal.querySelector('.modal-box') : null;
  const modalIcon = document.getElementById('modal-icon-title');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  if(!modal || !box) return;
  if (unsubscribeModal) { unsubscribeModal(); unsubscribeModal = null; }

  modalBody.innerHTML = '<div style="text-align:center; font-size:12px; color:var(--ink-400); padding:20px 0;">Memuat data...</div>';
  modal.style.display = 'flex';
  setTimeout(() => { 
    modal.classList.add('show-overlay'); 
    window.history.pushState({ modalOpen: true }, '', window.location.href);
  }, 10);

  if (type === 'sembako') {
    modalIcon.textContent = '🛒'; modalTitle.textContent = 'Harga Sembako RW 05';
    unsubscribeModal = onSnapshot(query(collection(db, "sembako_rw05"), orderBy("createdAt", "desc"), limit(5)), (snap) => {
      if(snap.empty) { renderEmptyState(modalBody, 'Harga sembako belum diupdate oleh pengurus RW 05.'); return; }
      let html = '<p style="font-size:12px; color:var(--ink-500); margin-bottom:12px;">Patokan harga komoditas pasar setempat:</p>';
      let pasarLokasi = 'Warung Gotong Royong RW 05';
      snap.forEach((docItem) => {
        const d = docItem.data(); if(d.pasar) pasarLokasi = d.pasar;
        html += `<div style="background:var(--bg-page); border:1px solid var(--border); border-radius:14px; padding:12px 14px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; font-weight:800; color:var(--ink-900);">🌾 ${d.nama || 'Sembako'}</span>
            <span style="font-size:13px; font-weight:800; color:#2563eb;">Rp ${Number(d.harga||0).toLocaleString('id-ID')} /${d.satuan||'Kg'}</span>
          </div>`;
      });
      html += `<div style="background:var(--tint-blue-50); border:1px solid var(--tint-blue-200); border-radius:12px; padding:10px 12px; font-size:11px; font-weight:700; color:#1e40af; margin-top:10px;">📍 Lokasi: ${pasarLokasi}</div>`;
      modalBody.innerHTML = html;
    });
  } else if (type === 'keamanan') {
    modalIcon.textContent = '🛡️'; modalTitle.textContent = 'Info Keamanan Satpam';
    unsubscribeModal = onSnapshot(query(collection(db, "keamanan_rw05"), orderBy("createdAt", "desc"), limit(1)), (snap) => {
      if(snap.empty) {
        renderEmptyState(modalBody, 'Info keamanan belum diatur oleh pengurus RW 05.');
        return;
      }
      snap.forEach((docItem) => {
        const d = docItem.data();
        modalBody.innerHTML = `
          <div style="background:var(--bg-page); border:1px solid var(--border); border-radius:14px; padding:14px; margin-bottom:10px;">
            <div style="font-size:10px; font-weight:800; color:var(--ink-500); text-transform:uppercase; margin-bottom:4px;">Jam Jaga Pos</div>
            <div style="font-size:13px; font-weight:800; color:var(--ink-900);">${d.jadwal || '-'}</div>
          </div>
          <div style="background:var(--bg-page); border:1px solid var(--border); border-radius:14px; padding:14px; margin-bottom:10px;">
            <div style="font-size:10px; font-weight:800; color:var(--ink-500); text-transform:uppercase; margin-bottom:4px;">Petugas Berjaga</div>
            <div style="font-size:14px; font-weight:800; color:#2563eb;">${d.nama || '-'}</div>
            ${d.phone ? `<div style="font-size:11px; color:#16a34a; font-weight:800; margin-top:4px;">📞 Call/WA: ${d.phone}</div>` : ''}
          </div>
          <div style="background:var(--tint-red-50); border:1px solid var(--tint-red-100); border-radius:14px; padding:14px;">
            <div style="font-size:11px; font-weight:800; color:#b91c1c; margin-bottom:4px;">🚨 Himbauan Keamanan</div>
            <p style="font-size:12px; color:#991b1b; margin:0; line-height:1.5;">${d.himbauan || '-'}</p>
          </div>
        `;
      });
    });
  } else if (type === 'lingkungan') {
    modalIcon.textContent = '🧹'; modalTitle.textContent = 'Lingkungan Bersih';
    unsubscribeModal = onSnapshot(query(collection(db, "lingkungan_rw05"), orderBy("createdAt", "desc"), limit(1)), (snap) => {
      if(snap.empty) { renderEmptyState(modalBody, 'Jadwal kerja bakti belum diupdate oleh pengurus RW 05.'); return; }
      snap.forEach((docItem) => {
        const d = docItem.data();
        modalBody.innerHTML = `<div style="background:var(--tint-green-50); border:1px solid var(--tint-green-200); border-radius:14px; padding:14px; margin-bottom:10px;"><div style="font-size:10px; font-weight:800; color:#166534; text-transform:uppercase; margin-bottom:4px;">🧹 ${d.judul || 'Jadwal Kerja Bakti'}:</div><div style="font-size:14px; font-weight:800; color:#15803d;">${d.tanggal || '-'}</div></div><div style="font-size:12px; color:var(--ink-700);">📍 <b>Titik Kumpul:</b> ${d.lokasi || '-'}</div>`;
      });
    });
  } else if (type === 'posyandu') {
    modalIcon.textContent = '👶'; modalTitle.textContent = 'Layanan Posyandu';
    unsubscribeModal = onSnapshot(query(collection(db, "posyandu_rw05"), orderBy("createdAt", "desc"), limit(1)), (snap) => {
      if(snap.empty) { renderEmptyState(modalBody, 'Jadwal pelayanan posyandu belum diupdate oleh pengurus RW 05.'); return; }
      snap.forEach((docItem) => {
        const d = docItem.data();
        modalBody.innerHTML = `<div style="background:var(--tint-red-50); border:1px solid var(--tint-red-50); border-radius:14px; padding:14px; margin-bottom:10px;"><div style="font-size:10px; font-weight:800; color:#9d174d; text-transform:uppercase; margin-bottom:4px;">🏥 ${d.judul || 'Jadwal Pelayanan'}:</div><div style="font-size:14px; font-weight:800; color:#be185d;">${d.jadwal || '-'}</div></div><div style="font-size:12px; color:var(--ink-700);">💉 <b>Layanan:</b> ${d.keterangan || '-'}</div>`;
      });
    });
  } else if (type === 'belajar') {
    modalIcon.textContent = '📚'; modalTitle.textContent = 'Belajar Bersama';
    unsubscribeModal = onSnapshot(query(collection(db, "kegiatan_rw05"), orderBy("createdAt", "desc"), limit(1)), (snap) => {
      if(snap.empty) { renderEmptyState(modalBody, 'Jadwal belajar bersama belum diupdate oleh pengurus RW 05.'); return; }
      snap.forEach((docItem) => {
        const d = docItem.data();
        modalBody.innerHTML = `<div style="background:var(--tint-blue-50); border:1px solid var(--tint-blue-200); border-radius:14px; padding:14px; margin-bottom:10px;"><div style="font-size:10px; font-weight:800; color:#1e40af; text-transform:uppercase; margin-bottom:4px;">🎓 ${d.judul || 'Bimbel'}:</div><div style="font-size:14px; font-weight:800; color:#1d4ed8;">${d.jadwal || '-'}</div></div><div style="font-size:12px; color:var(--ink-700);">✏️ <b>Detail:</b> ${d.isi || '-'}</div>`;
      });
    });
  } else if (type === 'datawarga') {
    modalIcon.textContent = '📋'; modalTitle.textContent = 'Data Warga & Administrasi';
    modalBody.innerHTML = `
      <p style="font-size:12.5px; color:var(--ink-600); line-height:1.6; margin-bottom:16px;">Pengurusan surat pengantar, lapor warga baru pendatang, atau perbaikan data KK/KTP dilakukan melalui Sekretaris RW 05.</p>
      <a href="https://wa.me/6289673580756?text=Halo%20Sekretaris%20RW05,%20saya%20ingin%20mengurus%20Data%20Warga" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; background:#16a34a; color:#ffffff; font-weight:800; font-size:13px; padding:12px 0; border-radius:14px; text-decoration:none;">💬 Hubungi Sekretaris RW via WA</a>
    `;
  } else if (type === 'petaBalai') {
    modalIcon.textContent = '📍'; modalTitle.textContent = 'Balai Serbaguna RW 05';
    modalBody.innerHTML = `
      <div style="text-align:left">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px">
          <img src="../assets/img/balai-1.jpg" style="width:100%; height:105px; object-fit:cover; border-radius:12px; border:1px solid var(--border)" alt="Balai RW 05">
          <img src="../assets/img/balai-2.jpg" style="width:100%; height:105px; object-fit:cover; border-radius:12px; border:1px solid var(--border)" alt="Dalam Balai RW 05">
        </div>
        <p style="font-size:11.5px; color:var(--ink-600); line-height:1.5; margin-bottom:14px; background:var(--bg-page); padding:10px 12px; border-radius:12px; border:1px solid var(--border)">
          <b>📍 Alamat Lengkap:</b><br>
          Jl. Poncol Gg. XI No.15 8, RT.8/RW.5, Kuningan Barat, Mampang Prapatan, Jakarta Selatan 12710
        </p>
        <a href="https://maps.app.goo.gl/qYc6rwZgjHvN3AWCA" target="_blank" style="display:block; width:100%; background:#2563eb; color:#ffffff; text-align:center; padding:12px; border-radius:14px; font-weight:800; text-decoration:none; font-size:13px; box-shadow:0 4px 14px rgba(37,99,235,0.2)">
          🗺️ Navigasi Google Maps
        </a>
      </div>
    `;
  }
};

window.closeServiceModal = function(shouldPopHistory = true) {
  const modal = document.getElementById('universal-modal');
  if(!modal) return;
  modal.classList.remove('show-overlay');
  setTimeout(() => { modal.style.display = 'none'; }, 200);
  if (unsubscribeModal) { unsubscribeModal(); unsubscribeModal = null; }

  if (shouldPopHistory && window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const serviceModal = document.getElementById('universal-modal');
  if(serviceModal) {
    serviceModal.addEventListener('click', (e) => {
      if(e.target === serviceModal) closeServiceModal(true);
    });
  }
});
