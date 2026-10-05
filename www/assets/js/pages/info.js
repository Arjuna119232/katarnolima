/**
 * KATARNOLIMA — pages/info.js
 * Logika halaman «info» — modul (Firebase/data).
 */

// @ts-nocheck
import { app } from "../services/firebase.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { escapeHtml, jsArg } from "../core/safe.js";

const db = getFirestore(app);

const notifList = document.getElementById('notifList');
const loadingNotif = document.getElementById('loadingNotif');
const btnMenuDot = document.getElementById('btnMenuDot');
const popoverMenu = document.getElementById('popoverMenu');
const btnMarkAllRead = document.getElementById('btnMarkAllRead');

function getReadIds() {
  try {
    return JSON.parse(localStorage.getItem('rw05_read_notifs') || '[]');
  } catch {
    return [];
  }
}

function saveReadId(id) {
  const list = getReadIds();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem('rw05_read_notifs', JSON.stringify(list));
  }
}

function markAllReadIds(ids) {
  const list = getReadIds();
  ids.forEach(id => { if (!list.includes(id)) list.push(id); });
  localStorage.setItem('rw05_read_notifs', JSON.stringify(list));
}

if (btnMenuDot && popoverMenu) {
  btnMenuDot.addEventListener('click', (e) => {
    e.stopPropagation();
    popoverMenu.classList.toggle('show');
  });
  document.addEventListener('click', () => {
    popoverMenu.classList.remove('show');
  });
}

if (btnMarkAllRead) {
  btnMarkAllRead.addEventListener('click', () => {
    const allIds = Array.from(document.querySelectorAll('.notif-item')).map(el => el.dataset.id).filter(Boolean);
    markAllReadIds(allIds);
    document.querySelectorAll('.notif-item').forEach(el => el.classList.add('read'));
    if (popoverMenu) popoverMenu.classList.remove('show');
  });
}

window.openNotifDetail = function(el, title, content, timeStr) {
  el.classList.add('read');
  const id = el.getAttribute('data-id');
  if (id) saveReadId(id);

  const modal = document.getElementById('notif-detail-modal');
  const titleEl = document.getElementById('modalDetailTitle');
  const bodyEl = document.getElementById('modalDetailBody');
  if (titleEl) titleEl.textContent = title || 'Detail Notifikasi';
  if (bodyEl) bodyEl.innerHTML = `<div style="font-size:11px; font-weight:700; color:var(--ink-500); margin-bottom:12px;">🕒 ${escapeHtml(timeStr)}</div>${escapeHtml(content)}`;
  if (modal) {
    modal.classList.add('show');
    window.history.pushState({ modalOpen: true }, '', window.location.href);
  }
};

window.closeNotifDetailModal = function(shouldPopHistory = true) {
  const modal = document.getElementById('notif-detail-modal');
  if (modal && modal.classList.contains('show')) {
    modal.classList.remove('show');
    if (shouldPopHistory && window.history.state && window.history.state.modalOpen) {
      window.history.back();
    }
  }
};

onSnapshot(query(collection(db, "info_singkat"), orderBy("createdAt", "desc")), (snap) => {
  if (loadingNotif) loadingNotif.style.display = 'none';
  if (snap.empty) {
    if (notifList) {
      notifList.innerHTML = `
        <div class="state-box">
          <span class="state-icon">🔔</span>
          <div style="font-weight:800; color:var(--ink-900); margin-bottom:4px;">Belum Ada Notifikasi</div>
          <p>Belum ada pengumuman atau pemberitahuan dari Admin RW 05 saat ini.</p>
        </div>
      `;
    }
    return;
  }

  const readList = getReadIds();
  let html = '';

  snap.forEach((docItem) => {
    const id = docItem.id;
    const isRead = readList.includes(id);
    const d = docItem.data() || {};
    const timeStr = d.tanggal || 'Baru saja';
    const title = d.judul || 'Informasi RW';
    const content = d.isi || '';
    const iconBadge = d.ikon || '05';

    const argTitle = jsArg(title);
    const argContent = jsArg(content);
    const argTime = jsArg(timeStr);
    const cleanContentInline = escapeHtml(String(content).replace(/\n/g, ' '));
    const badge = String(iconBadge).length <= 2 ? escapeHtml(iconBadge) : '🔔';

    html += `
      <div class="notif-item ${isRead ? 'read' : ''}" data-id="${escapeHtml(id)}" onclick="openNotifDetail(this, ${argTitle}, ${argContent}, ${argTime})">
        <div class="notif-avatar">
          ${badge}
          <div class="notif-dot"></div>
        </div>
        <div class="notif-main">
          <div class="notif-sender-row">
            <span class="notif-sender">KATARNOLIMA / Admin RW 05</span>
            <span class="notif-time">${escapeHtml(timeStr)}</span>
          </div>
          <div class="notif-text">
            <span class="notif-title-inline">${escapeHtml(title)} - </span><span>${cleanContentInline}</span>
          </div>
        </div>
      </div>
    `;
  });

  if (notifList) notifList.innerHTML = html;
}, (err) => {
  console.error("Gagal load notifikasi:", err);
  if (loadingNotif) {
    loadingNotif.innerHTML = `
      <div class="state-box">
        <span class="state-icon">❌</span>
        <div style="font-weight:800; color:var(--ink-900); margin-bottom:4px;">Gagal Memuat Notifikasi</div>
        <p>Periksa koneksi internet Anda.</p>
      </div>
    `;
  }
});

const uniModalDetail = document.getElementById('notif-detail-modal');
if (uniModalDetail) {
  uniModalDetail.addEventListener('click', (e) => {
    if (e.target === uniModalDetail) closeNotifDetailModal(true);
  });
}
