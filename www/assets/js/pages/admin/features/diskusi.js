/**
 * KATARNOLIMA — pages/admin/features/diskusi.js
 * Moderasi komentar forum diskusi.
 */
import { db, collection, doc, deleteDoc, onSnapshot, query, orderBy, limit } from "../firebase.js";
import { escapeHtml, jsArg } from "../shared/format.js";

export function initDiskusi() {
  const listDiskusiAdmin = document.getElementById('listDiskusiAdmin');
  if(listDiskusiAdmin) {
    onSnapshot(query(collection(db, "diskusi_rw05"), orderBy("createdAt", "desc"), limit(40)), (snap) => {
      let html = '';
      snap.forEach((docItem) => {
        const d = docItem.data();
        const timeStr = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString('id-ID') : '-';
        html += `<div style="padding:14px;background:var(--bg-page);border-radius:12px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:12px;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-weight:800;font-size:12px;color:var(--ink-900);">${escapeHtml(d.userName || 'Warga')}</span>
              <span style="font-size:10px;color:var(--ink-500);">• ${escapeHtml(timeStr)}</span>
            </div>
            <div style="font-size:12px;color:var(--ink-700);line-height:1.4;">${escapeHtml(d.text || '')}</div>
          </div>
          <button class="btn btn-red btn-sm" onclick="window.hapusDiskusiAdmin(${jsArg(docItem.id)})" style="flex-shrink:0;">Hapus</button>
        </div>`;
      });
      listDiskusiAdmin.innerHTML = html || '<div style="font-size:12px;color:var(--ink-400)">Belum ada komentar diskusi.</div>';
    });
  }

  // Laporan dari warga (tombol "Laporkan" di halaman Diskusi) — koleksi laporan_konten.
  const listLaporanAdmin = document.getElementById('listLaporanAdmin');
  if (listLaporanAdmin) {
    onSnapshot(query(collection(db, "laporan_konten"), orderBy("createdAt", "desc"), limit(30)), (snap) => {
      let html = '';
      snap.forEach((docItem) => {
        const d = docItem.data();
        const timeStr = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString('id-ID') : '-';
        html += `<div class="laporan-item">
          <div class="laporan-isi">
            <div class="laporan-head"><b>${escapeHtml(d.namaPengirim || 'Warga')}</b> <span>• dilaporkan ${escapeHtml(d.pelapor || 'warga')} • ${escapeHtml(timeStr)}</span></div>
            <div class="laporan-teks">${escapeHtml(d.teks || '')}</div>
          </div>
          <div class="laporan-aksi">
            <button class="btn btn-red btn-sm" onclick="window.hapusKomentarDilaporkan(${jsArg(docItem.id)}, ${jsArg(d.refId || '')})">Hapus komentar</button>
            <button class="btn btn-sm" onclick="window.tutupLaporan(${jsArg(docItem.id)})">Abaikan</button>
          </div>
        </div>`;
      });
      listLaporanAdmin.innerHTML = html || '<div class="laporan-kosong">Tidak ada laporan baru.</div>';
    });
  }

  window.tutupLaporan = async function(laporanId) {
    try {
      await deleteDoc(doc(db, "laporan_konten", laporanId));
    } catch(err) {
      window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
    }
  };

  window.hapusKomentarDilaporkan = function(laporanId, komentarId) {
    window.showModal({
      title: 'Hapus Komentar Dilaporkan',
      desc: 'Komentar akan dihapus dari forum dan laporan ini ditutup.',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        try {
          if (komentarId) await deleteDoc(doc(db, "diskusi_rw05", komentarId));
          await deleteDoc(doc(db, "laporan_konten", laporanId));
          window.showModal({ title: 'Selesai', desc: 'Komentar dihapus & laporan ditutup.', icon: '✅' });
        } catch(err) {
          window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
        }
      }
    });
  };

  window.hapusDiskusiAdmin = function(id) {
    window.showModal({
      title: 'Hapus Komentar',
      desc: 'Hapus komentar diskusi warga ini dari forum?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        try {
          await deleteDoc(doc(db, "diskusi_rw05", id));
          window.showModal({ title: 'Terhapus', desc: 'Komentar berhasil dihapus.', icon: '✅' });
        } catch(err) {
          window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
        }
      }
    });
  };
}
