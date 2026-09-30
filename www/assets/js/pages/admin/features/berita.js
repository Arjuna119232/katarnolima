/**
 * KATARNOLIMA — pages/admin/features/berita.js
 * Berita RW (tambah, ubah, hapus).
 */
import { db, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";
import { compressImageToBase64 } from "../shared/image.js";

export function initBerita() {
  const formBerita = document.getElementById('formBerita');
  if(formBerita) formBerita.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const katParts = (document.getElementById('beritaKat') ? document.getElementById('beritaKat').value : 'kegiatan|🌸|Kegiatan Warga').split('|');
    const fileInput = document.getElementById('beritaFoto');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    const fotoBase64 = await compressImageToBase64(file, 800, 0.7);

    await addDoc(collection(db,"berita_rw05"),{
      kategori: katParts[0], ikon: katParts[1], kategoriLabel: katParts[2],
      judul: document.getElementById('beritaJudul') ? document.getElementById('beritaJudul').value : '',
      isi: document.getElementById('beritaIsi') ? document.getElementById('beritaIsi').value : '',
      fotoBase64: fotoBase64 || '',
      tanggal: new Date().toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}),
      penulis: "Pengurus RW 05", createdAt: serverTimestamp()
    });
    window.showModal({ title: 'Berhasil', desc: 'Berita panjang berhasil dipublikasikan!', icon: '📰' });
    e.target.reset();
  });

  const listBeritaAdmin = document.getElementById('listBeritaAdmin');
  if(listBeritaAdmin){
    onSnapshot(query(collection(db,"berita_rw05"),orderBy("createdAt","desc"), limit(20)), (snap)=>{
      let html='';
      snap.forEach((docItem)=>{
        const d=docItem.data()||{};
        html+=`<div style="padding:12px;background:var(--bg-page);border-radius:12px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div><div style="font-size:12px;font-weight:800">${escapeHtml(d.ikon||'📰')} ${escapeHtml(d.judul||'')}</div><div style="font-size:10px;color:var(--ink-500)">${escapeHtml(d.tanggal||'-')}</div></div>
          <div style="display:flex;gap:6px"><button class="btn btn-outline btn-sm" onclick="window.editBerita(${jsArg(docItem.id)})">Edit</button><button class="btn btn-red btn-sm" onclick="window.hapusBerita(${jsArg(docItem.id)})">Hapus</button></div>
        </div>`;
      });
      listBeritaAdmin.innerHTML=html||'<div style="font-size:11px;color:var(--ink-400)">Belum ada berita.</div>';
    });
  }

  window.editBerita = async function(id){
    const snap=await getDoc(doc(db,"berita_rw05",id));
    if(!snap.exists()) return;
    const d=snap.data()||{};
    document.getElementById('editBeritaId').value=id;
    document.getElementById('editBeritaJudul').value=d.judul||'';
    document.getElementById('editBeritaIsi').value=d.isi||'';
    document.getElementById('modalEditBerita').classList.add('show');
  };

  const btnSimpanEditBerita = document.getElementById('btnSimpanEditBerita');
  if(btnSimpanEditBerita) btnSimpanEditBerita.addEventListener('click', async ()=>{
    const id=document.getElementById('editBeritaId') ? document.getElementById('editBeritaId').value : '';
    const judul=document.getElementById('editBeritaJudul') ? document.getElementById('editBeritaJudul').value : '';
    const isi=document.getElementById('editBeritaIsi') ? document.getElementById('editBeritaIsi').value : '';
    if(id){
      await updateDoc(doc(db,"berita_rw05",id),{judul, isi});
      window.closeModal('modalEditBerita');
      window.showModal({ title: 'Berhasil', desc: 'Berita berhasil diupdate!', icon: '✅' });
    }
  });

  window.hapusBerita = function(id){
    window.showModal({
      title: 'Hapus Berita',
      desc: 'Yakin ingin menghapus berita ini?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        await deleteDoc(doc(db,"berita_rw05",id));
        window.showModal({ title: 'Terhapus', desc: 'Berita berhasil dihapus.', icon: '✅' });
      }
    });
  };
}
