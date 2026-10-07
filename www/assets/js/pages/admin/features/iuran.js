/**
 * KATARNOLIMA — pages/admin/features/iuran.js
 * Bukti iuran warga.
 */
import { db, collection, doc, deleteDoc, onSnapshot, query, orderBy, limit } from "../firebase.js";
import { formatDateTimeDetailed, escapeHtml, jsArg, safeUrl } from "../shared/format.js";

export function initIuran() {
  const listIuranWargaAdmin = document.getElementById('listIuranWargaAdmin');
  if(listIuranWargaAdmin) {
    onSnapshot(query(collection(db, "iuran_warga_rw05"), orderBy("createdAt", "desc"), limit(40)), (snap) => {
      let html = '';
      snap.forEach((docItem) => {
        const d = docItem.data();
        const detailTime = formatDateTimeDetailed(d.createdAt);
        const imgThumb = d.buktiUrl ? `<img src="${escapeHtml(safeUrl(d.buktiUrl))}" class="bukti-thumb" onclick="window.previewBuktiIuran(${jsArg(safeUrl(d.buktiUrl))})" title="Klik untuk memperbesar" />` : '<span style="font-size:10px;color:var(--ink-400)">Tanpa Bukti</span>';

        html += `<tr>
          <td style="font-family:monospace;font-weight:700;">${escapeHtml(d.nik || '-')}</td>
          <td style="font-weight:700;color:var(--ink-900);">${escapeHtml(d.bulan || '-')}</td>
          <td style="color:var(--success-text);font-weight:800;">Rp ${Number(d.nominal||0).toLocaleString('id-ID')}</td>
          <td><span style="background:var(--border);padding:2px 6px;border-radius:4px;font-weight:700;font-size:10px;">${escapeHtml(d.rt || '-')}</span></td>
          <td style="text-align:center;">${imgThumb}</td>
          <td style="font-size:11px;color:var(--ink-500);">${escapeHtml(detailTime)}</td>
          <td><button class="btn btn-red btn-sm" onclick="window.hapusIuranWarga(${jsArg(docItem.id)})">Hapus Data & Bukti</button></td>
        </tr>`;
      });
      listIuranWargaAdmin.innerHTML = html || '<tr><td colspan="7" style="text-align:center;color:var(--ink-400)">Belum ada bukti iuran masuk.</td></tr>';
    });
  }

  window.previewBuktiIuran = function(url) {
    const imgEl = document.getElementById('imgFullBukti');
    const modalPreview = document.getElementById('modalPreviewBukti');
    if (imgEl && modalPreview) {
      imgEl.src = url;
      modalPreview.classList.add('show');
    }
  };

  window.hapusIuranWarga = function(id) {
    window.showModal({
      title: 'Hapus Bukti Iuran',
      desc: 'Hapus data & file bukti transfer iuran ini dari database Firestore agar tidak membebani penyimpanan?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        try {
          await deleteDoc(doc(db, "iuran_warga_rw05", id));
          window.showModal({ title: 'Terhapus', desc: 'Data & bukti pembayaran berhasil dihapus dari database.', icon: '✅' });
        } catch(err) {
          window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
        }
      }
    });
  };
}
