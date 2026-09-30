/**
 * KATARNOLIMA — pages/diskusi-rw.js
 * Logika halaman «diskusi-rw» — modul (Firebase/data).
 */

import { app } from "../services/firebase.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth(app);

// DATA WARGA AKTIF
const userSession = JSON.parse(localStorage.getItem('rw05_current_user') || 'null');
const currentUserName = userSession && userSession.nama ? userSession.nama : 'Warga';

// INISIAL AVATAR
function getTwoInitials(nama = '') {
  const parts = nama.trim().split(/\s+/);
  if (!parts[0]) return 'WG';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

const currentUserAvatar = (userSession && userSession.avatarEmoji) ? userSession.avatarEmoji : getTwoInitials(currentUserName);

// ELEMEN HEADER
const adminSwitchWrap = document.getElementById('adminSwitchWrap');
const wargaLimitBadge = document.getElementById('wargaLimitBadge');
const chkAdminMode = document.getElementById('chkAdminMode');
const roleLabel = document.getElementById('roleLabel');

let isSendingAsAdmin = false;

// CHECK STATUS AUTH FOR ADMIN SWITCH
onAuthStateChanged(auth, (user) => {
  if (user && user.email) {
    if (adminSwitchWrap) adminSwitchWrap.style.display = 'flex';
    if (wargaLimitBadge) wargaLimitBadge.style.display = 'none';
  } else {
    if (adminSwitchWrap) adminSwitchWrap.style.display = 'none';
    if (wargaLimitBadge) wargaLimitBadge.style.display = 'flex';
    isSendingAsAdmin = false;
  }
});

if (chkAdminMode) {
  chkAdminMode.addEventListener('change', (e) => {
    isSendingAsAdmin = e.target.checked;
    if (roleLabel) {
      roleLabel.textContent = isSendingAsAdmin ? 'MODE: ADMIN' : 'MODE: WARGA';
      roleLabel.style.color = isSendingAsAdmin ? '#22c55e' : '#fbbf24';
    }
    const inputPesan = document.getElementById('inputPesan');
    if (inputPesan) {
      inputPesan.placeholder = isSendingAsAdmin ? "Tulis pesan sebagai Admin RW..." : "Tulis komentar warga...";
    }
  });
}

function checkAuthOrRedirect() {
  const userSession = localStorage.getItem('rw05_current_user') || localStorage.getItem('rw05_user_login');
  const firebaseUser = auth.currentUser;
  if (!userSession && !firebaseUser) {
    showCustomAlert('⚠️ Silakan login/daftar akun terlebih dahulu untuk mengirim pesan diskusi warga.', 'profil.html');
    return false;
  }
  return true;
}

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

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

// FORMAT TANGGAL
function formatDateLabel(dateObj) {
  if (!dateObj) return 'HARI INI';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  if (targetDate.getTime() === today.getTime()) {
    return 'HARI INI';
  } else if (targetDate.getTime() === yesterday.getTime()) {
    return 'KEMARIN';
  } else {
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}

const chatArea = document.getElementById('chatArea');
const emptyChat = document.getElementById('emptyChat');

// REALTIME LISTENER CHAT (LIMIT 30)
const qDiskusi = query(collection(db, "diskusi_rw05"), orderBy("createdAt", "desc"), limit(30));

onSnapshot(qDiskusi, (snap) => {
  if (snap.empty) {
    if (emptyChat) emptyChat.textContent = "Belum ada diskusi. Mulai obrolan pertama!";
    return;
  }

  let messages = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    let timeStr = 'Baru saja';
    let rawDate = new Date();

    if (d.createdAt?.toDate) {
      rawDate = d.createdAt.toDate();
      timeStr = rawDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIB';
    }

    messages.push({
      id: docSnap.id,
      userName: d.userName || 'Warga',
      text: d.text || '',
      time: timeStr,
      rawDate: rawDate,
      dateKey: rawDate.toDateString(),
      isAdmin: d.isAdmin === true,
      userAvatar: d.userAvatar || getTwoInitials(d.userName || 'Warga')
    });
  });

  messages.reverse();

  let html = '';
  let lastDateKey = null;

  messages.forEach((m) => {
    if (m.dateKey !== lastDateKey) {
      const dateLabel = formatDateLabel(m.rawDate);
      html += `<div class="date-separator">${dateLabel}</div>`;
      lastDateKey = m.dateKey;
    }

    if (m.isAdmin) {
      html += `
        <div class="chat-row-admin">
          <div class="chat-bubble admin-msg">
            <div class="chat-user">
              <span class="badge-admin">ADMIN RW</span>
            </div>
            <div class="chat-text">${escapeHtml(m.text)}</div>
            <div class="chat-time">${m.time}</div>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="chat-row-user">
          <div class="chat-avatar">${m.userAvatar}</div>
          <div class="chat-bubble">
            <div class="chat-user">${escapeHtml(m.userName)}</div>
            <div class="chat-text">${escapeHtml(m.text)}</div>
            <div class="chat-time">${m.time}</div>
          </div>
        </div>
      `;
    }
  });

  if (chatArea) {
    chatArea.innerHTML = html;
    chatArea.scrollTop = chatArea.scrollHeight;
  }
});

// HANDLER KIRIM PESAN
const formDiskusi = document.getElementById('formDiskusi');
const inputPesan = document.getElementById('inputPesan');
const btnKirim = document.getElementById('btnKirim');

if (formDiskusi) {
  formDiskusi.addEventListener('submit', async (e) => {
    e.preventDefault();

    // CEK LOGIN DI AWAL
    if (!checkAuthOrRedirect()) return;

    const textVal = inputPesan.value.trim();
    if (!textVal) return;

    btnKirim.disabled = true;
    inputPesan.disabled = true;

    try {
      const senderName = isSendingAsAdmin ? "ADMIN RW" : currentUserName;

      await addDoc(collection(db, "diskusi_rw05"), {
        userName: senderName,
        text: textVal,
        isAdmin: isSendingAsAdmin,
        userAvatar: isSendingAsAdmin ? "" : currentUserAvatar,
        createdAt: serverTimestamp()
      });

      inputPesan.value = '';
    } catch (err) {
      console.error('Firestore Error:', err);
      alert('❌ Gagal mengirim pesan. Periksa koneksi internet Anda.');
    } finally {
      btnKirim.disabled = false;
      inputPesan.disabled = false;
      inputPesan.focus();
    }
  });
}
