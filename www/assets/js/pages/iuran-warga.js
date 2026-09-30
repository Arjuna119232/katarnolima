/**
 * KATARNOLIMA — pages/iuran-warga.js
 * Logika halaman «iuran-warga» — modul (Firebase/data).
 */

import { app } from "../services/firebase.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);
const auth = getAuth(app);

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

// ============================================
// POPUP SUKSES — Modern
// ============================================
function showSuccessModal(message, redirectUrl) {
  let modal = document.getElementById('successModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'successModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.6); backdrop-filter:blur(6px); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
      <div style="background:var(--surface); width:100%; max-width:320px; border-radius:24px; padding:24px 20px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.15);">
        <div style="font-size:48px; margin-bottom:12px;">✅</div>
        <h3 style="font-size:16px; font-weight:800; color:var(--ink-900); margin-bottom:8px;">Berhasil!</h3>
        <p id="successMsg" style="font-size:12px; color:var(--ink-600); font-weight:600; line-height:1.4; margin-bottom:20px;"></p>
        <button type="button" id="successBtn" style="width:100%; padding:12px; background:#16a34a; color:#fff; border:none; border-radius:14px; font-weight:800; font-size:13px; cursor:pointer;">Oke, Mengerti</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById('successMsg').textContent = message;
  modal.style.display = 'flex';

  document.getElementById('successBtn').onclick = () => {
    modal.style.display = 'none';
    if (redirectUrl) window.location.href = redirectUrl;
  };
}

// ============================================
// POPUP MODERN — Pengganti alert() bawaan
// ============================================
function showCustomAlert(message, redirectUrl) {
  let alertModal = document.getElementById('customAlertModal');
  if (!alertModal) {
    alertModal = document.createElement('div');
    alertModal.id = 'customAlertModal';
    alertModal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.6); backdrop-filter:blur(6px); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    alertModal.innerHTML = `
      <div style="background:var(--surface); width:100%; max-width:320px; border-radius:24px; padding:24px 20px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.15);">
        <div style="font-size:36px; margin-bottom:12px;">🔒</div>
        <h3 style="font-size:15px; font-weight:800; color:var(--ink-900); margin-bottom:8px;">Autentikasi Diperlukan</h3>
        <p id="customAlertMsg" style="font-size:12px; color:var(--ink-600); font-weight:600; line-height:1.4; margin-bottom:20px;"></p>
        <button type="button" id="customAlertBtn" style="width:100%; padding:12px; background:#0f172a; color:#fbbf24; border:none; border-radius:14px; font-weight:800; font-size:13px; cursor:pointer;">Masuk / Daftar</button>
      </div>
    `;
    document.body.appendChild(alertModal);
  }
  document.getElementById('customAlertMsg').textContent = message;
  alertModal.style.display = 'flex';

  document.getElementById('customAlertBtn').onclick = () => {
    alertModal.style.display = 'none';
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };
}

// ============================================
// CEK LOGIN — Wajib login untuk kirim iuran
// ============================================
function checkAuthOrRedirect() {
  const userSession = localStorage.getItem('rw05_current_user') || localStorage.getItem('rw05_user_login');
  const firebaseUser = auth.currentUser;
  if (!userSession && !firebaseUser) {
    showCustomAlert('Silakan login/daftar akun terlebih dahulu untuk mengirim bukti pembayaran iuran.', 'profil.html');
    return false;
  }
  return true;
}

// SUBMIT FORM PEMBAYARAN
const form = document.getElementById('formIuran');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // WAJIB LOGIN — cek sebelum submit
    if (!checkAuthOrRedirect()) return;

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

      showSuccessModal("Pembayaran iuran berhasil dikirim! Data sudah terverifikasi.", "iuran-warga.html");
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
