/**
 * KATARNOLIMA — pages/admin/features/aduan.js
 * Aduan warga (status, GPS, hapus).
 */
import { db, collection, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, storage, ref, deleteObject } from "../firebase.js";
import { escapeHtml, jsArg, safeUrl } from "../shared/format.js";

export function initAduan() {
  const statAduan = document.getElementById('statAduan');
  const badgeAduan = document.getElementById('badgeAduan');
  const listAduanAdmin = document.getElementById('listAduanAdmin');

  onSnapshot(query(collection(db,"aduan_warga05"), orderBy("createdAt", "desc"), limit(30)), (snap)=>{
    if(statAduan) statAduan.textContent=snap.size;
    if(badgeAduan){ badgeAduan.textContent=snap.size; badgeAduan.style.display=(snap.size>0 && badgeAduan.dataset.forceHidden!=='1')?'inline-block':'none'; }
    if(listAduanAdmin){
      let html='';
      snap.forEach(docItem=>{
        const d=docItem.data()||{};
        const currentStatus = d.status || 'Menunggu Verifikasi';
        const isVideo = d.isVideo === true;
        const mediaUrl = d.fotoBase64 || '';

        let mediaPreview = '';
        if (mediaUrl) {
          if (isVideo) {
            mediaPreview = `<video src="${escapeHtml(safeUrl(mediaUrl))}" controls style="width:120px;height:80px;border-radius:10px;object-fit:cover;margin-bottom:8px;border:1px solid var(--border-strong);"></video>`;
          } else {
            mediaPreview = `<img src="${escapeHtml(safeUrl(mediaUrl))}" style="width:70px;height:70px;border-radius:10px;object-fit:cover;margin-bottom:8px;border:1px solid var(--border-strong);" />`;
          }
        }

        /* MULTI-FIELD DETEKSI LOKASI & KOORDINAT GPS ADUAN */
        let latVal = d.lat || d.latitude || null;
        let lngVal = d.lng || d.longitude || null;
        let lokasiTeks = d.lokasiGps || d.koordinat || d.lokasi || '';

        // Jika lokasi tersimpan dalam format string "lat,lng" (contoh: "-6.200000, 106.810000")
        if (!latVal && typeof lokasiTeks === 'string' && lokasiTeks.includes(',')) {
          const parts = lokasiTeks.split(',');
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            latVal = parseFloat(parts[0].trim());
            lngVal = parseFloat(parts[1].trim());
          }
        }

        let gpsHtml = '';
        if (latVal && lngVal) {
          const coordStr = `${latVal},${lngVal}`;
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordStr}`;
          gpsHtml = `
            <div class="gps-card-box">
              <div class="gps-info-text">
                📍 Lock GPS: ${escapeHtml(coordStr)}
              </div>
              <div class="gps-actions">
                <button class="btn btn-outline btn-sm" onclick="window.salinGPS(${jsArg(coordStr)})" title="Salin koordinat GPS">📋 Salin</button>
                <a href="${escapeHtml(mapsUrl)}" target="_blank" class="btn btn-blue btn-sm" style="text-decoration:none;" title="Buka di Google Maps">📍 Google Maps</a>
              </div>
            </div>
          `;
        } else if (lokasiTeks) {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lokasiTeks)}`;
          gpsHtml = `
            <div class="gps-card-box">
              <div class="gps-info-text">
                📍 Lokasi: ${escapeHtml(lokasiTeks)}
              </div>
              <div class="gps-actions">
                <button class="btn btn-outline btn-sm" onclick="window.salinGPS(${jsArg(lokasiTeks)})" title="Salin lokasi">📋 Salin</button>
                <a href="${escapeHtml(mapsUrl)}" target="_blank" class="btn btn-blue btn-sm" style="text-decoration:none;" title="Buka di Google Maps">📍 Google Maps</a>
              </div>
            </div>
          `;
        }

        html+=`<div style="padding:14px;background:var(--bg-page);border-radius:12px;border:1px solid var(--border);margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div>
              <div style="font-weight:800;font-size:13px;color:var(--ink-900);">${escapeHtml(d.judul || 'Aduan')} - ${escapeHtml(d.rt||'-')}</div>
              <div style="font-size:11px;color:var(--ink-500);margin-top:2px;">Pelapor: ${escapeHtml(d.nama||'-')} • ${escapeHtml(d.tanggal||'')}</div>
            </div>
            <span style="font-size:10px;font-weight:800;padding:3px 8px;border-radius:6px;background:var(--border);color:var(--ink-700);">${escapeHtml(currentStatus)}</span>
          </div>
          <div style="font-size:12px;margin:8px 0;color:var(--ink-700);line-height:1.4;">${escapeHtml(d.deskripsi||'-')}</div>
          ${gpsHtml}
          ${mediaPreview}
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
            <button class="btn btn-blue btn-sm" onclick="window.updateStatusAduan(${jsArg(docItem.id)}, 'Diproses')">Proses</button>
            <button class="btn btn-green btn-sm" onclick="window.updateStatusAduan(${jsArg(docItem.id)}, 'Selesai')">Selesai</button>
            <button class="btn btn-red btn-sm" onclick="window.hapusAduanAdmin(${jsArg(docItem.id)}, ${jsArg(mediaUrl)}, ${isVideo === true})">Hapus</button>
          </div>
        </div>`;
      });
      listAduanAdmin.innerHTML=html||'<div style="font-size:11px;color:var(--ink-400)">Belum ada aduan.</div>';
    }
  });

  window.updateStatusAduan = async function(id, statusNew) {
    try {
      await updateDoc(doc(db, "aduan_warga05", id), { status: statusNew });
      window.showModal({ title: 'Status Diperbarui', desc: `Status aduan diubah menjadi "${statusNew}".`, icon: '✅' });
    } catch(err) {
      window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
    }
  };

  window.hapusAduanAdmin = function(id, mediaUrl, isVideo) {
    window.showModal({
      title: 'Hapus Aduan',
      desc: 'Hapus laporan aduan warga ini dari database?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        try {
          if(isVideo && mediaUrl && mediaUrl.includes('firebasestorage.googleapis.com')) {
            try {
              const fileRef = ref(storage, mediaUrl);
              await deleteObject(fileRef);
            } catch(storageErr) {
              console.warn("File storage tidak ditemukan:", storageErr);
            }
          }

          await deleteDoc(doc(db, "aduan_warga05", id));
          window.showModal({ title: 'Terhapus', desc: 'Laporan aduan berhasil dihapus.', icon: '✅' });
        } catch(err) {
          window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
        }
      }
    });
  };
}
