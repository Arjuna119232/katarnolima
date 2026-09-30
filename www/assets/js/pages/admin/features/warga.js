/**
 * KATARNOLIMA — pages/admin/features/warga.js
 * Daftar akun warga.
 */
import { db, collection, doc, deleteDoc, onSnapshot, query, orderBy, limit } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";

export function initWarga() {
  const listWargaAdmin = document.getElementById('listWargaAdmin');
  if(listWargaAdmin){
    onSnapshot(query(collection(db,"users_profile"),orderBy("createdAt","desc"), limit(50)), (snap)=>{
      let html='';
      snap.forEach((docItem)=>{
        const d=docItem.data()||{};
        html+=`<tr>
          <td><b>${escapeHtml(d.nama||'-')}</b></td>
          <td>${escapeHtml(d.rt||'-')}</td>
          <td style="font-family:monospace;font-size:11px">${escapeHtml(d.email||'-')}</td>
          <td><button class="btn btn-red btn-sm" onclick="window.hapusWarga(${jsArg(docItem.id)})">Hapus Akun</button></td>
        </tr>`;
      });
      listWargaAdmin.innerHTML=html||'<tr><td colspan="4" style="text-align:center;color:var(--ink-400)">Belum ada akun warga mendaftar.</td></tr>';
    });
  }

  window.hapusWarga = function(id){ 
    window.showModal({
      title: 'Hapus Akun Warga',
      desc: 'Apakah Anda yakin ingin menghapus akun warga ini dari database?',
      icon: '⚠️',
      type: 'confirm',
      onYes: async () => {
        await deleteDoc(doc(db,"users_profile",id));
        window.showModal({ title: 'Terhapus', desc: 'Akun warga berhasil dihapus.', icon: '✅' });
      }
    });
  };
}
