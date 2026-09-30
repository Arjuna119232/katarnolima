/**
 * KATARNOLIMA — pages/admin/features/kas.js
 * Kas RW: input transaksi, hapus transaksi, reset saldo.
 */
import { db, collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "../firebase.js";
import { formatDateTimeDetailed, escapeHtml, jsArg } from "../shared/format.js";

export function initKas() {
  window.resetSaldoKas = function() {
    window.showModal({
      title: 'Reset Saldo Kas',
      desc: 'Apakah Anda yakin ingin mereset total saldo kas RW 05 kembali menjadi Rp 0?',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        try {
          const saldoDocRef = doc(db, "kas_rw05", "saldo_utama");
          await setDoc(saldoDocRef, { 
            total: 0, 
            pesan: 'Di Reset Oleh Admin katarnolima', 
            updatedAt: serverTimestamp() 
          }, { merge: true });

          localStorage.setItem('rw05_manual_kas_saldo', 'Rp 0');

          window.showModal({ 
            title: 'Berhasil', 
            desc: 'Saldo kas telah berhasil di-reset menjadi Rp 0!', 
            icon: '✅' 
          });
        } catch (err) {
          window.showModal({ 
            title: 'Gagal', 
            desc: 'Gagal mereset saldo: ' + err.message, 
            icon: '❌' 
          });
        }
      }
    });
  };

  const formKasTransaksi = document.getElementById('formKasTransaksi');
  if(formKasTransaksi) {
    formKasTransaksi.addEventListener('submit', async (e) => {
      e.preventDefault();
      const jenis = document.getElementById('kasJenis').value;
      const jumlah = Number(document.getElementById('kasJumlah').value || 0);
      const keterangan = document.getElementById('kasKeterangan').value.trim();
      const btn = e.target.querySelector('button[type="submit"]');

      if(jumlah <= 0 || !keterangan) {
        window.showModal({ title: 'Input Tidak Valid', desc: 'Isi nominal yang benar dan keterangan transaksi!', icon: '⚠️' });
        return;
      }

      if(btn) { btn.textContent = 'Menyimpan...'; btn.setAttribute('disabled', 'true'); }
      try {
        const fullTimeStr = new Date().toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: false
        }).replace('.', ':') + ' WIB';

        await addDoc(collection(db, "transaksi_kas"), {
          jenis: jenis, jumlah: jumlah, keterangan: keterangan,
          tanggalFormatted: fullTimeStr, createdAt: serverTimestamp()
        });

        const saldoDocRef = doc(db, "kas_rw05", "saldo_utama");
        const snap = await getDoc(saldoDocRef);
        let currentTotal = snap.exists() ? (snap.data().total || 0) : 0;

        if(jenis === 'masuk') currentTotal += jumlah;
        else currentTotal -= jumlah;

        const infoNote = 'Di Update Oleh Admin katarnolima';

        await setDoc(saldoDocRef, { total: currentTotal, pesan: infoNote, updatedAt: serverTimestamp() }, { merge: true });
        localStorage.setItem('rw05_manual_kas_saldo', 'Rp ' + currentTotal.toLocaleString('id-ID'));
        localStorage.setItem('rw05_manual_kas_info', infoNote);

        window.showModal({ title: 'Berhasil', desc: 'Transaksi tersimpan! Saldo di Index otomatis terupdate.', icon: '✅' });
        formKasTransaksi.reset();
      } catch(err) {
        window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
      } finally {
        if(btn) { btn.textContent = '💾 Simpan Transaksi & Update Saldo Live'; btn.removeAttribute('disabled'); }
      }
    });
  }

  const listTransaksiKas = document.getElementById('listTransaksiKas');
  if(listTransaksiKas) {
    onSnapshot(query(collection(db, "transaksi_kas"), orderBy("createdAt", "desc"), limit(30)), (snap) => {
      let html = '';
      snap.forEach((docItem) => {
        const d = docItem.data();
        const badgeColor = d.jenis === 'masuk' ? '#16a34a' : '#dc2626';
        const sign = d.jenis === 'masuk' ? '+' : '-';
        const detailTime = d.tanggalFormatted || formatDateTimeDetailed(d.createdAt);
        html += `<tr>
          <td><span style="color:${badgeColor};font-weight:800">${d.jenis === 'masuk' ? 'MASUK' : 'KELUAR'}</span></td>
          <td style="color:${badgeColor};font-weight:700">${sign}Rp ${Number(d.jumlah||0).toLocaleString('id-ID')}</td>
          <td>${escapeHtml(d.keterangan||'-')}</td>
          <td style="font-size:11px;color:var(--ink-700);font-weight:600">${escapeHtml(detailTime)}</td>
          <td><button class="btn btn-red btn-sm" onclick="window.hapusTransaksiKas(${jsArg(docItem.id)}, ${jsArg(d.jenis)}, ${Number(d.jumlah) || 0})">Hapus</button></td>
        </tr>`;
      });
      listTransaksiKas.innerHTML = html || '<tr><td colspan="5" style="text-align:center;color:var(--ink-400)">Belum ada transaksi.</td></tr>';
    });
  }

  window.hapusTransaksiKas = function(id, jenis, jumlah) {
    window.showModal({
      title: 'Hapus Transaksi',
      desc: 'Apakah Anda yakin ingin menghapus transaksi ini? Saldo kas akan disesuaikan kembali.',
      icon: '🗑️',
      type: 'confirm',
      onYes: async () => {
        try {
          await deleteDoc(doc(db, "transaksi_kas", id));
          const saldoDocRef = doc(db, "kas_rw05", "saldo_utama");
          const snap = await getDoc(saldoDocRef);
          if(snap.exists()) {
            let currentTotal = snap.data().total || 0;
            if(jenis === 'masuk') currentTotal -= Number(jumlah);
            else currentTotal += Number(jumlah);
            await updateDoc(saldoDocRef, { total: currentTotal, updatedAt: serverTimestamp() });
            localStorage.setItem('rw05_manual_kas_saldo', 'Rp ' + currentTotal.toLocaleString('id-ID'));
          }
          window.showModal({ title: 'Terhapus', desc: 'Transaksi berhasil dihapus & saldo disesuaikan.', icon: '✅' });
        } catch(err) {
          window.showModal({ title: 'Gagal', desc: err.message, icon: '❌' });
        }
      }
    });
  };
}
