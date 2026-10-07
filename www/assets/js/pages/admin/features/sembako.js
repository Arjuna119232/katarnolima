/**
 * KATARNOLIMA — pages/admin/features/sembako.js
 * Harga sembako.
 */
import { db, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";

export function initSembako() {
  const formSembako = document.getElementById('formSembako');
  if(formSembako){
    formSembako.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const nama = document.getElementById('sembakoNama').value.trim();
      const harga = Number(document.getElementById('sembakoHarga').value || 0);
      const pasar = document.getElementById('sembakoPasar').value.trim();
      const satuan = document.getElementById('sembakoSatuan').value.trim() || 'Kg';

      try {
        await addDoc(collection(db, "sembako_rw05"), {
          nama, harga, pasar, satuan,
          tanggalFormatted: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}),
          createdAt: serverTimestamp()
        });
        window.showModal({ title: 'Berhasil', desc: 'Harga sembako berhasil diperbarui!', icon: '🛒' });
        formSembako.reset();
      } catch(err) {
        window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
      }
    });
  }

  const listSembakoAdmin = document.getElementById('listSembakoAdmin');
  if(listSembakoAdmin){
    onSnapshot(query(collection(db, "sembako_rw05"), orderBy("createdAt", "desc"), limit(25)), (snap)=>{
      let html = '';
      snap.forEach(docItem => {
        const d = docItem.data();
        html += `<tr>
          <td><b>${escapeHtml(d.nama||'-')}</b></td>
          <td style="color:var(--link);font-weight:800">Rp ${Number(d.harga||0).toLocaleString('id-ID')} / ${escapeHtml(d.satuan||'Kg')}</td>
          <td>${escapeHtml(d.pasar||'-')}</td>
          <td><span style="font-size:10px;color:var(--ink-500)">${escapeHtml(d.tanggalFormatted||'-')}</span></td>
          <td><button class="btn btn-red btn-sm" onclick="window.hapusSembako(${jsArg(docItem.id)})">Hapus</button></td>
        </tr>`;
      });
      listSembakoAdmin.innerHTML = html || '<tr><td colspan="5" style="text-align:center;color:var(--ink-400)">Belum ada data sembako.</td></tr>';
    });
  }

  window.hapusSembako = function(id) {
    window.showModal({
      title: 'Hapus Sembako',
      desc: 'Hapus data komoditas sembako ini?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => { await deleteDoc(doc(db, "sembako_rw05", id)); }
    });
  };
}
