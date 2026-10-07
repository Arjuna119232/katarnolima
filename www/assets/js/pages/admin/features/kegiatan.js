/**
 * KATARNOLIMA — pages/admin/features/kegiatan.js
 * Program belajar / kegiatan warga.
 */
import { db, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";

export function initKegiatan() {
  const formKegiatan = document.getElementById('formKegiatan');
  if(formKegiatan){
    formKegiatan.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const judul = document.getElementById('kegiatanJudul').value.trim();
      const jadwal = document.getElementById('kegiatanJadwal').value.trim();
      const pj = document.getElementById('kegiatanPJ').value.trim();
      const isi = document.getElementById('kegiatanIsi').value.trim();

      try {
        await addDoc(collection(db, "kegiatan_rw05"), {
          judul, jadwal, pj, isi, createdAt: serverTimestamp()
        });
        window.showModal({ title: 'Berhasil', desc: 'Program kegiatan belajar tersimpan!', icon: '🎓' });
        formKegiatan.reset();
      } catch(err) {
        window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
      }
    });
  }

  const listKegiatanAdmin = document.getElementById('listKegiatanAdmin');
  if(listKegiatanAdmin){
    onSnapshot(query(collection(db, "kegiatan_rw05"), orderBy("createdAt", "desc"), limit(20)), (snap)=>{
      let html = '';
      snap.forEach(docItem => {
        const d = docItem.data();
        html += `<div style="padding:14px;background:var(--bg-page);border-radius:12px;border:1px solid var(--border);margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:13px;font-weight:800;color:var(--ink-900)">${escapeHtml(d.judul||'-')}</div>
              <div style="font-size:11px;color:var(--link);font-weight:700;margin-top:2px">⏰ ${escapeHtml(d.jadwal||'-')} • 👤 PJ: ${escapeHtml(d.pj||'-')}</div>
            </div>
            <button class="btn btn-red btn-sm" onclick="window.hapusKegiatan(${jsArg(docItem.id)})">Hapus</button>
          </div>
          <div style="font-size:12px;color:var(--ink-600);margin-top:6px">${escapeHtml(d.isi||'-')}</div>
        </div>`;
      });
      listKegiatanAdmin.innerHTML = html || '<div style="font-size:11px;color:var(--ink-400)">Belum ada program belajar/kegiatan.</div>';
    });
  }

  window.hapusKegiatan = function(id) {
    window.showModal({
      title: 'Hapus Kegiatan',
      desc: 'Hapus program belajar / kegiatan warga ini?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => { await deleteDoc(doc(db, "kegiatan_rw05", id)); }
    });
  };
}
