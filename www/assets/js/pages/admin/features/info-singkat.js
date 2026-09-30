/**
 * KATARNOLIMA — pages/admin/features/info-singkat.js
 * Info singkat untuk warga.
 */
import { db, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";

export function initInfoSingkat() {
  const formInfoSingkat = document.getElementById('formInfoSingkat');
  if(formInfoSingkat){
    formInfoSingkat.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const judulEl = document.getElementById('infoJudul');
      const isiEl = document.getElementById('infoIsi');
      const ikonInput = document.getElementById('infoIkonVal');
      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const judul = judulEl ? judulEl.value.trim() : '';
      const isi = isiEl ? isiEl.value.trim() : '';
      const symbolIkon = ikonInput ? ikonInput.value : '🔔';

      if(!judul || !isi){ 
        window.showModal({ title: 'Peringatan', desc: 'Mohon isi judul dan pesan singkat terlebih dahulu!', icon: '⚠️' });
        return; 
      }
      if(btnSubmit){ btnSubmit.textContent = 'Menyimpan...'; btnSubmit.setAttribute('disabled', 'true'); }
      try {
        await addDoc(collection(db,"info_singkat"),{
          judul: judul, isi: isi,
          tanggal: new Date().toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}),
          ikon: symbolIkon, createdAt: serverTimestamp()
        });
        window.showModal({ title: 'Berhasil', desc: 'Info singkat berhasil terkirim ke warga!', icon: '✅' });
        if(judulEl) judulEl.value = '';
        if(isiEl) isiEl.value = '';
        window.resetIkonInfo();
      } catch(err){
        window.showModal({ title: 'Gagal', desc: 'Gagal mengirim info singkat.', icon: '❌' });
      } finally {
        if(btnSubmit){ btnSubmit.textContent = '🚀 Kirim Info ke Warga'; btnSubmit.removeAttribute('disabled'); }
      }
    });
  }

  const listInfoSingkatAdmin = document.getElementById('listInfoSingkatAdmin');
  if(listInfoSingkatAdmin){
    onSnapshot(query(collection(db,"info_singkat"),orderBy("createdAt","desc"), limit(20)), (snap)=>{
      let html='';
      snap.forEach((docItem)=>{
        const d=docItem.data()||{};
        html+=`<div style="padding:12px;background:var(--bg-page);border-radius:10px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div><div style="font-size:12px;font-weight:800">${escapeHtml(d.ikon||'🔔')} ${escapeHtml(d.judul||'')}</div><div style="font-size:10px;color:var(--ink-500)">${escapeHtml(d.tanggal||'-')}</div></div>
          <button class="btn btn-red btn-sm" onclick="window.hapusInfoSingkat(${jsArg(docItem.id)})">Hapus</button>
        </div>`;
      });
      listInfoSingkatAdmin.innerHTML=html||'<div style="font-size:11px;color:var(--ink-400)">Belum ada info singkat.</div>';
    });
  }

  window.hapusInfoSingkat = function(id){
    window.showModal({
      title: 'Hapus Info',
      desc: 'Hapus info singkat ini dari aplikasi warga?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        await deleteDoc(doc(db,"info_singkat",id));
        window.showModal({ title: 'Terhapus', desc: 'Info singkat berhasil dihapus.', icon: '✅' });
      }
    });
  };
}
