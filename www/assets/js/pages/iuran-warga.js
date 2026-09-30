/**
 * KATARNOLIMA — pages/iuran-warga.js
 * Logika halaman «iuran-warga» — modul (Firebase/data).
 */

import { app } from "../services/firebase.js";
import { getFirestore, doc, onSnapshot, setDoc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);

// FALLBACK QRIS IMAGE
const imgEl = document.getElementById('qrisImg');
if (imgEl) {
  imgEl.addEventListener('error', function() {
    this.src = 'https://via.placeholder.com/170?text=QRIS+RW+05';
  });
}

window.salinRekening = function() {
  const rekText = document.getElementById('rekNum')?.textContent || '1234567890';
  navigator.clipboard.writeText(rekText.replace(/-/g, ''));
  alert("✅ Nomor rekening berhasil disalin!");
};

// KOMPRESI GAMBAR OTOMATIS
function compressImage(file, maxWidth = 600, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// LOGIKA UPLOAD & PREVIEW BUKTI TRANSFER
const buktiInput = document.getElementById('bukti');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
let base64Bukti = "";

if (buktiInput) {
  buktiInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
      try {
        base64Bukti = await compressImage(file, 600, 0.6);
        previewImage.src = base64Bukti;
        previewContainer.style.display = 'block';
      } catch (err) {
        alert("⚠️ Gagal memproses gambar bukti transfer.");
      }
    }
  });
}

window.hapusBuktiTransfer = function() {
  if (buktiInput) buktiInput.value = "";
  base64Bukti = "";
  if (previewContainer) previewContainer.style.display = 'none';
  if (previewImage) previewImage.src = "";
};

// LISTEN SALDO LIVE FIRESTORE
const saldoRef = doc(db, "kas_rw05", "saldo_utama");
onSnapshot(saldoRef, (snap) => {
  if (snap.exists()) {
    const data = snap.data();
    const total = data ? data.total || 0 : 0;
    const saldoEl = document.getElementById('saldoVal');
    if (saldoEl) saldoEl.textContent = "Rp " + total.toLocaleString('id-ID');
  }
});

// SUBMIT FORM PEMBAYARAN
const form = document.getElementById('formIuran');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nikEl = document.getElementById('nik');
    const bulanEl = document.getElementById('bulan');
    const nominalEl = document.getElementById('nominal');
    const rtEl = document.getElementById('rt');

    const nik = nikEl ? nikEl.value.trim() : '';
    const bulan = bulanEl ? bulanEl.value.trim() : '';
    const nominal = nominalEl ? parseInt(nominalEl.value) || 0 : 0;
    const rt = rtEl ? rtEl.value : '';

    if (nik.length !== 16) {
      alert("⚠️ NIK harus berjumlah tepat 16 digit!");
      if (nikEl) nikEl.focus();
      return;
    }

    if (!base64Bukti) {
      alert("⚠️ Silakan unggah foto bukti transfer terlebih dahulu.");
      return;
    }

    const btn = document.getElementById('btnBayar');
    if (btn) {
      btn.disabled = true;
      btn.textContent = "⏳ Memproses Pembayaran...";
    }

    try {
      // 1. UPDATE SALDO KAS
      const sfDoc = await getDoc(saldoRef);
      let newTotal = nominal;
      if (sfDoc.exists()) {
        const oldData = sfDoc.data();
        newTotal = (oldData ? oldData.total || 0 : 0) + nominal;
      }
      await setDoc(saldoRef, { total: newTotal, updatedAt: serverTimestamp() }, { merge: true });

      // 2. SIMPAN DOKUMEN TRANSAKSI KE COLLECTION "iuran_warga_rw05"
      await addDoc(collection(db, "iuran_warga_rw05"), {
        nik: nik,
        bulan: bulan,
        nominal: nominal,
        rt: rt,
        buktiUrl: base64Bukti,
        status: "Berhasil",
        createdAt: serverTimestamp()
      });

      alert("✅ Pembayaran iuran berhasil dikirim! Data sudah terverifikasi.");
      form.reset();
      window.hapusBuktiTransfer();

    } catch (err) {
      console.error("Gagal simpan:", err);
      alert("❌ Terjadi kesalahan saat memproses pembayaran:\n" + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Kirim Bukti Pembayaran";
      }
    }
  });
}
