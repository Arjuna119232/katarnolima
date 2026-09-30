/**
 * KATARNOLIMA — pages/admin/features/lingkungan.js
 * Agenda kebersihan lingkungan.
 */
import { db, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";

export function initLingkungan() {
  const formLingkungan = document.getElementById('formLingkungan');
  if(formLingkungan){
    formLingkungan.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const judul = document.getElementById('lingkunganJudul').value.trim();
      const tanggal = document.getElementById('lingkunganTanggal').value.trim();
      const lokasi = document.getElementById('lingkunganLokasi').value.trim();
      const isi = document.getElementById('lingkunganIsi').value.trim();

      try {
        await addDoc(collection(db, "lingkungan_rw05"), {
          judul, tanggal, lokasi, isi, createdAt: serverTimestamp()
        });
        window.showModal({ title: 'Berhasil', desc: 'Jadwal kerja bakti dipublikasikan!', icon: '🧹' });
        formLingkungan.reset();
      } catch(err) {
        window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
      }
    });
  }

  const listLingkunganAdmin = document.getElementById('listLingkunganAdmin');
  if(listLingkunganAdmin){
    onSnapshot(query(collection(db, "lingkungan_rw05"), orderBy("createdAt", "desc"), limit(20)), (snap)=>{
      let html = '';
      snap.forEach(docItem => {
        const d = docItem.data();
        html += `<div style="padding:14px;background:var(--bg-page);border-radius:12px;border:1px solid var(--border);margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:13px;font-weight:800;color:var(--ink-900)">${escapeHtml(d.judul||'-')}</div>
              <div style="font-size:11px;color:#2563eb;font-weight:700;margin-top:2px">📅 ${escapeHtml(d.tanggal||'-')} • 📍 ${escapeHtml(d.lokasi||'-')}</div>
            </div>
            <button class="btn btn-red btn-sm" onclick="window.hapusLingkungan(${jsArg(docItem.id)})">Hapus</button>
          </div>
          <div style="font-size:12px;color:var(--ink-600);margin-top:6px">${escapeHtml(d.isi||'-')}</div>
        </div>`;
      });
      listLingkunganAdmin.innerHTML = html || '<div style="font-size:11px;color:var(--ink-400)">Belum ada agenda kebersihan.</div>';
    });
  }

  window.hapusLingkungan = function(id) {
    window.showModal({
      title: 'Hapus Agenda',
      desc: 'Hapus agenda kebersihan lingkungan ini?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => { await deleteDoc(doc(db, "lingkungan_rw05", id)); }
    });
  };
}
