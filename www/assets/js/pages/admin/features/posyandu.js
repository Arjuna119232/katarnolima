/**
 * KATARNOLIMA — pages/admin/features/posyandu.js
 * Jadwal Posyandu.
 */
import { db, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";

export function initPosyandu() {
  const formPosyandu = document.getElementById('formPosyandu');
  if(formPosyandu){
    formPosyandu.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const judul = document.getElementById('posyanduJudul').value.trim();
      const jadwal = document.getElementById('posyanduJadwal').value.trim();
      const lokasi = document.getElementById('posyanduLokasi').value.trim();
      const keterangan = document.getElementById('posyanduKeterangan').value.trim();

      try {
        await addDoc(collection(db, "posyandu_rw05"), {
          judul, jadwal, lokasi, keterangan, createdAt: serverTimestamp()
        });
        window.showModal({ title: 'Berhasil', desc: 'Jadwal Posyandu dipublikasikan!', icon: '👶' });
        formPosyandu.reset();
      } catch(err) {
        window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
      }
    });
  }

  const listPosyanduAdmin = document.getElementById('listPosyanduAdmin');
  if(listPosyanduAdmin){
    onSnapshot(query(collection(db, "posyandu_rw05"), orderBy("createdAt", "desc"), limit(20)), (snap)=>{
      let html = '';
      snap.forEach(docItem => {
        const d = docItem.data();
        html += `<div style="padding:14px;background:var(--bg-page);border-radius:12px;border:1px solid var(--border);margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:13px;font-weight:800;color:var(--ink-900)">${escapeHtml(d.judul||'-')}</div>
              <div style="font-size:11px;color:var(--success-text);font-weight:700;margin-top:2px">📅 ${escapeHtml(d.jadwal||'-')} • 📍 ${escapeHtml(d.lokasi||'-')}</div>
            </div>
            <button class="btn btn-red btn-sm" onclick="window.hapusPosyandu(${jsArg(docItem.id)})">Hapus</button>
          </div>
          <div style="font-size:12px;color:var(--ink-600);margin-top:6px">${escapeHtml(d.keterangan||'-')}</div>
        </div>`;
      });
      listPosyanduAdmin.innerHTML = html || '<div style="font-size:11px;color:var(--ink-400)">Belum ada jadwal Posyandu.</div>';
    });
  }

  window.hapusPosyandu = function(id) {
    window.showModal({
      title: 'Hapus Posyandu',
      desc: 'Hapus jadwal layanan posyandu ini?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => { await deleteDoc(doc(db, "posyandu_rw05", id)); }
    });
  };
}
