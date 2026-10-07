/**
 * KATARNOLIMA — pages/admin/features/update-app.js
 * Notifikasi update aplikasi + riwayat.
 */
import { db, collection, doc, setDoc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { formatDateTimeDetailed, escapeHtml, jsArg, safeUrl } from "../shared/format.js";

export function initUpdateApp() {
  const formPushUpdate = document.getElementById('formPushUpdate');
  if (formPushUpdate) {
    formPushUpdate.addEventListener('submit', async (e) => {
      e.preventDefault();
      const versi = document.getElementById('appVersi').value.trim();
      const link = document.getElementById('appLinkDownload').value.trim();
      const catatan = document.getElementById('appCatatan').value.trim();
      const isAktif = document.getElementById('appStatusAktif').checked;

      try {
        await setDoc(doc(db, "sistem_app", "update_info"), {
          versi: versi,
          linkDownload: link,
          catatan: catatan,
          isAktif: isAktif,
          updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "riwayat_update_app"), {
          versi: versi,
          linkDownload: link,
          catatan: catatan,
          isAktif: isAktif,
          createdAt: serverTimestamp()
        });

        window.showModal({ title: 'Berhasil', desc: 'Notifikasi update dipublikasikan & tersimpan di riwayat!', icon: '🚀' });
      } catch (err) {
        window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
      }
    });
  }

  window.hapusPushUpdate = function() {
    window.showModal({
      title: 'Matikan Notifikasi Update',
      desc: 'Apakah Anda yakin ingin menghapus/mematikan notifikasi update aplikasi ini dari halaman warga?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        try {
          await setDoc(doc(db, "sistem_app", "update_info"), {
            isAktif: false,
            versi: "",
            linkDownload: "",
            catatan: "",
            updatedAt: serverTimestamp()
          });

          const form = document.getElementById('formPushUpdate');
          if (form) form.reset();

          window.showModal({ 
            title: 'Berhasil', 
            desc: 'Notifikasi update aplikasi berhasil dimatikan!', 
            icon: '✅' 
          });
        } catch (err) {
          window.showModal({ 
            title: 'Gagal', 
            desc: err.message, 
            icon: '❌' 
          });
        }
      }
    });
  };

  const listRiwayatUpdateAdmin = document.getElementById('listRiwayatUpdateAdmin');
  if (listRiwayatUpdateAdmin) {
    onSnapshot(query(collection(db, "riwayat_update_app"), orderBy("createdAt", "desc"), limit(20)), (snap) => {
      let html = '';
      snap.forEach((docItem) => {
        const d = docItem.data();
        const timeStr = formatDateTimeDetailed(d.createdAt);
        const statusBadge = d.isAktif 
          ? '<span style="color:var(--success-text);font-weight:800;font-size:10px;background:var(--tint-green-100);padding:2px 6px;border-radius:4px;">AKTIF</span>' 
          : '<span style="color:var(--ink-500);font-weight:700;font-size:10px;background:var(--surface-soft);padding:2px 6px;border-radius:4px;">NONAKTIF</span>';

        const safeData = JSON.stringify({
          versi: d.versi || '',
          linkDownload: d.linkDownload || '',
          catatan: d.catatan || ''
        });

        html += `<tr>
          <td style="font-weight:800;color:var(--ink-900);">${escapeHtml(d.versi || '-')}</td>
          <td style="white-space:pre-line;font-size:11px;max-width:200px;">${escapeHtml(d.catatan || '-')}</td>
          <td><a href="${escapeHtml(safeUrl(d.linkDownload) || '#')}" rel="noopener noreferrer" target="_blank" style="color:var(--link);font-size:11px;">Buka Link</a></td>
          <td style="font-size:11px;color:var(--ink-500);">${escapeHtml(timeStr)}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:nowrap;">
              <button class="btn btn-blue btn-sm" onclick="window.pushUlangUpdate(${escapeHtml(safeData)})" title="Push ulang notifikasi ini">🚀 Push</button>
              <button class="btn btn-red btn-sm" onclick="window.hapusRiwayatUpdate(${jsArg(docItem.id)})" title="Hapus riwayat">🗑️ Hapus</button>
            </div>
          </td>
        </tr>`;
      });
      listRiwayatUpdateAdmin.innerHTML = html || '<tr><td colspan="6" style="text-align:center;color:var(--ink-400)">Belum ada riwayat update.</td></tr>';
    });
  }

  window.pushUlangUpdate = function(data) {
    window.showModal({
      title: 'Push Ulang Notifikasi',
      desc: `Tampilkan kembali notifikasi update versi ${data.versi} ke halaman warga?`,
      icon: '🚀',
      type: 'confirm',
      onYes: async () => {
        try {
          await setDoc(doc(db, "sistem_app", "update_info"), {
            versi: data.versi,
            linkDownload: data.linkDownload,
            catatan: data.catatan,
            isAktif: true,
            updatedAt: serverTimestamp()
          });

          if (document.getElementById('appVersi')) document.getElementById('appVersi').value = data.versi;
          if (document.getElementById('appLinkDownload')) document.getElementById('appLinkDownload').value = data.linkDownload;
          if (document.getElementById('appCatatan')) document.getElementById('appCatatan').value = data.catatan;
          if (document.getElementById('appStatusAktif')) document.getElementById('appStatusAktif').checked = true;

          window.showModal({ 
            title: 'Berhasil Push Ulang', 
            desc: `Notifikasi update ${data.versi} berhasil dipublikasikan kembali ke warga!`, 
            icon: '✅' 
          });
        } catch (err) {
          window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
        }
      }
    });
  };

  window.hapusRiwayatUpdate = function(id) {
    window.showModal({
      title: 'Hapus Riwayat',
      desc: 'Hapus riwayat catatan update ini dari database?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        try {
          await deleteDoc(doc(db, "riwayat_update_app", id));
          window.showModal({ title: 'Terhapus', desc: 'Riwayat berhasil dihapus.', icon: '✅' });
        } catch (err) {
          window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
        }
      }
    });
  };
}
