/**
 * KATARNOLIMA — pages/admin/features/keamanan.js
 * Jadwal satpam & himbauan keamanan.
 */
import { db, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";

export function initKeamanan() {
  const formKeamanan = document.getElementById('formKeamanan');
  if(formKeamanan){
    formKeamanan.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const nama = document.getElementById('satpamNama').value.trim();
      const jadwal = document.getElementById('satpamJadwal').value.trim();
      const phone = document.getElementById('satpamPhone').value.trim();
      const himbauan = document.getElementById('satpamHimbauan').value.trim();

      try {
        await addDoc(collection(db, "keamanan_rw05"), {
          nama, jadwal, phone, himbauan, createdAt: serverTimestamp()
        });
        window.showModal({ title: 'Berhasil', desc: 'Jadwal & himbauan keamanan tersimpan!', icon: '🛡️' });
        formKeamanan.reset();
      } catch(err) {
        window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
      }
    });
  }

  const listKeamananAdmin = document.getElementById('listKeamananAdmin');
  if(listKeamananAdmin){
    onSnapshot(query(collection(db, "keamanan_rw05"), orderBy("createdAt", "desc"), limit(20)), (snap)=>{
      let html = '';
      snap.forEach(docItem => {
        const d = docItem.data();
        html += `<div style="padding:12px;background:var(--bg-page);border-radius:12px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div>
            <div style="font-size:13px;font-weight:800;color:var(--ink-900)">${escapeHtml(d.nama||'-')}</div>
            <div style="font-size:11px;color:var(--ink-500);margin-top:2px">Shift/Jam Jaga: ${escapeHtml(d.jadwal||'-')} • HP: ${escapeHtml(d.phone||'-')}</div>
            <div style="font-size:11px;color:#be123c;margin-top:4px"><b>Himbauan:</b> ${escapeHtml(d.himbauan||'-')}</div>
          </div>
          <button class="btn btn-red btn-sm" onclick="window.hapusKeamanan(${jsArg(docItem.id)})">Hapus</button>
        </div>`;
      });
      listKeamananAdmin.innerHTML = html || '<div style="font-size:11px;color:var(--ink-400)">Belum ada data keamanan.</div>';
    });
  }

  window.hapusKeamanan = function(id) {
    window.showModal({
      title: 'Hapus Petugas',
      desc: 'Hapus data jadwal satpam/pos keamanan ini?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => { await deleteDoc(doc(db, "keamanan_rw05", id)); }
    });
  };
}
