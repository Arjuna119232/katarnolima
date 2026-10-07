/**
 * KATARNOLIMA — pages/aduan-warga.js
 * Logika halaman «aduan-warga» — modul (Firebase/data).
 */

import { app } from "../services/firebase.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { escapeHtml, jsArg, safeUrl } from "../core/safe.js";

const db = getFirestore(app);
const auth = getAuth(app);

let globalReportsMap = {};
let rawReportsArray = [];
let currentActiveUserName = '';

let activeModalType = null;

/* HELPER CEK DAN PERMINTAAN IZIN NATIVE CAPACITOR
 *
 * CATATAN PENTING (perbaikan 2.3.6): izin 'photos' TIDAK lagi diminta.
 * Aplikasi memotret lewat navigator.mediaDevices.getUserMedia (WebView), bukan
 * Camera.getPhoto, jadi yang dibutuhkan hanya android.permission.CAMERA.
 * Sebelumnya kode ikut meminta 'photos' (READ_MEDIA_IMAGES) yang sudah dibuang
 * dari manifest — sehingga checkPermissions() selalu melaporkan photos != granted
 * dan requestPermissions() dipanggil terus-menerus. Setelah warga menolak 2x,
 * Android berhenti menampilkan dialog, jadi给人的 kesan "popup izinnya hilang".
 * Lihat core/permissions.js untuk alur onboarding yang benar. */
async function requestNativePermissions(type = 'camera') {
  if (window.Capacitor && window.Capacitor.Plugins) {
    try {
      if (type === 'camera' && window.Capacitor.Plugins.Camera) {
        const status = await window.Capacitor.Plugins.Camera.checkPermissions();
        if (status.camera !== 'granted') {
          await window.Capacitor.Plugins.Camera.requestPermissions({ permissions: ['camera'] });
        }
      } else if (type === 'location' && window.Capacitor.Plugins.Geolocation) {
        const status = await window.Capacitor.Plugins.Geolocation.checkPermissions();
        if (status.location !== 'granted') {
          await window.Capacitor.Plugins.Geolocation.requestPermissions({ permissions: ['location'] });
        }
      }
    } catch (e) {
      console.warn('Gagal meminta izin native:', e);
    }
  }
}

/* FUNGSI TAMPILKAN POP-UP MODAL KUSTOM MODERN */
window.showModernPopup = function({ title = 'Notifikasi', msg = '', type = 'warning', redirectUrl = null }) {
  const dialog = document.getElementById('modernDialog');
  const elTitle = document.getElementById('dialogTitle');
  const elMsg = document.getElementById('dialogMsg');
  const elIcon = document.getElementById('dialogIcon');
  const btnClose = document.getElementById('btnDialogClose');

  if (!dialog) return;

  if (elTitle) elTitle.textContent = title;
  if (elMsg) elMsg.textContent = msg;

  if (elIcon) {
    elIcon.className = `modern-dialog-icon ${type}`;
    if (type === 'warning') elIcon.textContent = '⚠️';
    else if (type === 'error') elIcon.textContent = '❌';
    else if (type === 'success') elIcon.textContent = '✅';
    else elIcon.textContent = 'ℹ️';
  }

  dialog.classList.add('show');

  if (btnClose) {
    btnClose.onclick = () => {
      dialog.classList.remove('show');
      if (redirectUrl) window.location.href = redirectUrl;
    };
  }
};

function openModalWithHistory(type) {
  activeModalType = type;
  window.history.pushState({ modalOpen: type }, '', window.location.href);
}

function closeModalWithoutHistory() {
  if (activeModalType) {
    activeModalType = null;
    window.history.back();
  }
}

const handleHardwareBackButtonPages = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const modalForm = document.getElementById('modalFormAduan');
  const modalDetail = document.getElementById('modalDetailAduan');
  const dialog = document.getElementById('modernDialog');

  if (dialog && dialog.classList.contains('show')) {
    dialog.classList.remove('show');
    return;
  }
  if (modalForm && modalForm.classList.contains('show')) {
    modalForm.classList.remove('show');
    activeModalType = null;
    return;
  }
  if (modalDetail && modalDetail.classList.contains('show')) {
    modalDetail.classList.remove('show');
    activeModalType = null;
    return;
  }

  if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
    window.history.back();
  } else {
    window.location.href = '../index.html';
  }
};

window.addEventListener('popstate', () => {
  const modalForm = document.getElementById('modalFormAduan');
  const modalDetail = document.getElementById('modalDetailAduan');
  const dialog = document.getElementById('modernDialog');

  if (dialog && dialog.classList.contains('show')) {
    dialog.classList.remove('show');
  }
  if (modalForm && modalForm.classList.contains('show')) {
    modalForm.classList.remove('show');
    activeModalType = null;
  }
  if (modalDetail && modalDetail.classList.contains('show')) {
    modalDetail.classList.remove('show');
    activeModalType = null;
  }
});

if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  window.Capacitor.Plugins.App.removeAllListeners();
  window.Capacitor.Plugins.App.addListener('backButton', handleHardwareBackButtonPages);
} else {
  document.removeEventListener('backbutton', handleHardwareBackButtonPages);
  document.addEventListener('backbutton', handleHardwareBackButtonPages, false);
}

function checkAuthOrRedirect() {
  const userSession = localStorage.getItem('rw05_current_user') || localStorage.getItem('rw05_user_login');
  const firebaseUser = auth.currentUser;
  if (!userSession && !firebaseUser) {
    window.showModernPopup({
      title: 'Autentikasi Diperlukan',
      msg: 'Silakan login/daftar akun terlebih dahulu untuk membuat laporan aduan warga.',
      type: 'warning',
      redirectUrl: 'profil.html'
    });
    return false;
  }
  return true;
}

let compressedBase64 = null;
let isVideoType = false;
let latValue = null;
let lngValue = null;
let lokasiGpsText = '';

/* REVERSE GEOCODING NAMA TEMPAT */
async function fetchLocationName(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'id-ID,id' }
    });
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
      const village = addr.village || addr.suburb || addr.city_district || '';
      const city = addr.city || addr.town || addr.regency || '';

      let formattedName = [road, village, city].filter(Boolean).join(', ');
      return formattedName || data.display_name;
    }
  } catch(e) {
    console.warn('Gagal ambil nama lokasi:', e);
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function renderReports(filterKeyword = '') {
  const containerMy = document.getElementById('dynamicMyReports');
  const containerAll = document.getElementById('dynamicAllReports');
  const cleanKeyword = filterKeyword.toLowerCase().trim();

  if (rawReportsArray.length === 0) {
    if (containerMy) containerMy.innerHTML = `<div style="background:var(--surface); border-radius:20px; margin:0 20px; padding:20px; text-align:center; font-size:12px; color:var(--ink-400); border:1px dashed var(--border-strong);">Belum ada laporan aktif milikmu. Buat laporan di atas!</div>`;
    if (containerAll) containerAll.innerHTML = `<div style="background:var(--surface); border-radius:20px; margin:0 20px; padding:20px; text-align:center; font-size:12px; color:var(--ink-400); border:1px dashed var(--border-strong);">Belum ada laporan warga.</div>`;
    return;
  }

  let myHtml = '';
  let allHtml = '';
  let myCount = 0;
  let allCount = 0;

  rawReportsArray.forEach((item) => {
    const matchJudul = item.judul.toLowerCase().includes(cleanKeyword);
    const matchDesc = item.deskripsi.toLowerCase().includes(cleanKeyword);
    const matchRt = item.rt.toLowerCase().includes(cleanKeyword);
    const matchNama = item.nama.toLowerCase().includes(cleanKeyword);

    if (cleanKeyword && !matchJudul && !matchDesc && !matchRt && !matchNama) {
      return;
    }

    const fotoUrl = safeUrl(item.foto);
    let mediaThumb = fotoUrl ? `<img src="${escapeHtml(fotoUrl)}" class="active-report-thumb" alt="Thumb">` : '';
    if (fotoUrl && item.isVideo) {
      mediaThumb = `
        <div style="position:relative; width:84px; height:84px; flex-shrink:0;">
          <video src="${escapeHtml(fotoUrl)}" class="active-report-thumb"></video>
          <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:14px; color:#fff; font-size:20px;">▶</div>
        </div>
      `;
    }

    const cardHtml = `
      <div class="active-report-card" onclick="openDetailReportModal(${jsArg(item.id)})">
        ${mediaThumb}
        <div class="active-report-info">
          <div>
            <span class="badge-kat">${escapeHtml(item.rt)}</span>
            <div class="report-title-text" style="margin-top:4px;">${escapeHtml(item.judul)}</div>
            <div class="report-meta-text" style="margin-top:2px;">${escapeHtml(item.nama)} • ${escapeHtml(item.tanggal)}</div>
          </div>
          <div class="badge-status-dinamis ${escapeHtml(item.statusClass)}">${escapeHtml(item.status)}</div>
        </div>
      </div>
    `;

    if (item.isOwner) {
      myHtml += cardHtml;
      myCount++;
    }

    allHtml += cardHtml;
    allCount++;
  });

  if (containerMy) {
    containerMy.innerHTML = myCount > 0 ? myHtml : `
      <div style="background:var(--surface); border-radius:20px; margin:0 20px; padding:20px; text-align:center; font-size:12px; color:var(--ink-400); border:1px dashed var(--border-strong);">
        ${cleanKeyword ? 'Tidak ada laporan milikmu yang cocok.' : 'Belum ada laporan aktif milikmu. Buat laporan di atas!'}
      </div>
    `;
  }

  if (containerAll) {
    containerAll.innerHTML = allCount > 0 ? allHtml : `
      <div style="background:var(--surface); border-radius:20px; margin:0 20px; padding:20px; text-align:center; font-size:12px; color:var(--ink-400); border:1px dashed var(--border-strong);">
        Tidak ada laporan warga yang cocok dengan pencarian "${escapeHtml(filterKeyword)}".
      </div>
    `;
  }
}

function syncUserReportsRealtime(currentUserName) {
  const qAduan = query(collection(db, "aduan_warga05"), orderBy("createdAt", "desc"), limit(20));

  onSnapshot(qAduan, (snap) => {
    rawReportsArray = [];
    globalReportsMap = {};

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const docId = docSnap.id;

      let dateStr = 'Baru saja';
      if (d.createdAt?.toDate) {
        const dt = d.createdAt.toDate();
        const datePart = dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        const timePart = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
        dateStr = `${datePart} • ${timePart} WIB`;
      }

      const statusVal = d.status || 'Menunggu Verifikasi';
      const statusClass = statusVal.replace(/\s+/g, '');
      const foto = d.fotoBase64 || '../assets/img/logo-resmi-karang-taruna.jpg';
      const isVideo = d.isVideo === true;

      const isAnonim = d.isAnonim === true;
      const namaPelapor = isAnonim ? 'Warga Anonim (Privasi)' : (d.nama || 'Warga');

      const rtVal = d.rt || 'RT -';
      const judulVal = d.judul || 'Tanpa Judul';
      const descVal = d.deskripsi || '-';

      const localIds = JSON.parse(localStorage.getItem('rw05_user_report_ids') || '[]');
      const isOwnerByName = currentUserName && d.nama && d.nama.toLowerCase() === currentUserName.toLowerCase();
      const isOwnerById = localIds.includes(docId);

      const reportObj = {
        id: docId,
        nama: namaPelapor,
        rt: rtVal,
        judul: judulVal,
        deskripsi: descVal,
        foto: foto,
        isVideo: isVideo,
        tanggal: dateStr,
        status: statusVal,
        statusClass: statusClass,
        isOwner: isOwnerByName || isOwnerById
      };

      globalReportsMap[docId] = reportObj;
      rawReportsArray.push(reportObj);
    });

    const searchInput = document.getElementById('inputSearchQuery');
    renderReports(searchInput ? searchInput.value : '');
  });
}

window.openDetailReportModal = function(docId) {
  const item = globalReportsMap[docId];
  if (!item) return;

  const modalDetail = document.getElementById('modalDetailAduan');
  const detailFoto = document.getElementById('detailFoto');
  const detailVideo = document.getElementById('detailVideo');
  const detailJudul = document.getElementById('detailJudul');
  const detailMeta = document.getElementById('detailMeta');
  const detailDesc = document.getElementById('detailDesc');
  const detailRtBadge = document.getElementById('detailRtBadge');
  const detailStatusBadge = document.getElementById('detailStatusBadge');

  if (item.isVideo) {
    if (detailFoto) detailFoto.style.display = 'none';
    if (detailVideo) {
      detailVideo.src = item.foto;
      detailVideo.style.display = 'block';
    }
  } else {
    if (detailVideo) detailVideo.style.display = 'none';
    if (detailFoto) {
      detailFoto.src = item.foto;
      detailFoto.style.display = 'block';
    }
  }

  if (detailJudul) detailJudul.textContent = item.judul;
  if (detailMeta) detailMeta.textContent = `Pelapor: ${item.nama} • ${item.tanggal}`;
  if (detailDesc) detailDesc.textContent = item.deskripsi;
  if (detailRtBadge) detailRtBadge.textContent = item.rt;
  if (detailStatusBadge) {
    detailStatusBadge.textContent = item.status;
    detailStatusBadge.className = `badge-status-dinamis ${item.statusClass}`;
  }

  if (modalDetail) {
    modalDetail.classList.add('show');
    openModalWithHistory('detail');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('rw05_current_user') || 'null');
  const inputNama = document.getElementById('aduanNama');
  currentActiveUserName = currentUser && currentUser.nama ? currentUser.nama : '';
  if (currentActiveUserName && inputNama) {
    inputNama.value = currentActiveUserName;
  }

  syncUserReportsRealtime(currentActiveUserName);

  const btnToggleSearch = document.getElementById('btnToggleSearch');
  const searchBarContainer = document.getElementById('searchBarContainer');
  const inputSearchQuery = document.getElementById('inputSearchQuery');
  const btnClearSearch = document.getElementById('btnClearSearch');

  if (btnToggleSearch && searchBarContainer && inputSearchQuery) {
    btnToggleSearch.addEventListener('click', () => {
      searchBarContainer.classList.toggle('show');
      if (searchBarContainer.classList.contains('show')) {
        inputSearchQuery.focus();
      } else {
        inputSearchQuery.value = '';
        if (btnClearSearch) btnClearSearch.style.display = 'none';
        renderReports('');
      }
    });

    inputSearchQuery.addEventListener('input', (e) => {
      const queryVal = e.target.value;
      if (btnClearSearch) {
        btnClearSearch.style.display = queryVal.length > 0 ? 'block' : 'none';
      }
      renderReports(queryVal);
    });
  }

  if (btnClearSearch && inputSearchQuery) {
    btnClearSearch.addEventListener('click', () => {
      inputSearchQuery.value = '';
      btnClearSearch.style.display = 'none';
      inputSearchQuery.focus();
      renderReports('');
    });
  }

  const modalForm = document.getElementById('modalFormAduan');
  const modalDetail = document.getElementById('modalDetailAduan');
  const btnTriggerFoto = document.getElementById('btnTriggerFoto');
  const btnTriggerVideo = document.getElementById('btnTriggerVideo');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');

  const btnAmbilFotoOnly = document.getElementById('btnAmbilFotoOnly');
  const btnAmbilVideoOnly = document.getElementById('btnAmbilVideoOnly');
  const inputFoto = document.getElementById('inputFoto');
  const imgPreview = document.getElementById('imgPreview');
  const videoPreview = document.getElementById('videoPreview');
  const previewContainer = document.getElementById('previewContainer');
  const previewStatusText = document.getElementById('previewStatusText');
  const btnRemoveMedia = document.getElementById('btnRemoveMedia');
  const btnGPS = document.getElementById('btnGPS');
  const coordsText = document.getElementById('coordsText');
  const gpsInfo = document.getElementById('gpsInfo');
  const formAduan = document.getElementById('formAduan');
  const btnKirimAduan = document.getElementById('btnKirimAduan');
  const chkAnonim = document.getElementById('chkAnonim');

  if (btnRemoveMedia) {
    btnRemoveMedia.addEventListener('click', () => {
      compressedBase64 = null;
      isVideoType = false;
      if (inputFoto) inputFoto.value = '';
      if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; }
      if (videoPreview) { videoPreview.src = ''; videoPreview.style.display = 'none'; }
      if (previewContainer) previewContainer.style.display = 'none';
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const isAutoOpen = urlParams.get('autoOpen') === '1';
  const tempPhoto = sessionStorage.getItem('temp_aduan_photo');

  if (tempPhoto || isAutoOpen) {
    if (tempPhoto) {
      compressedBase64 = tempPhoto;
      isVideoType = false;

      if (videoPreview) videoPreview.style.display = 'none';
      if (imgPreview) {
        imgPreview.src = tempPhoto;
        imgPreview.style.display = 'block';
      }
      if (previewStatusText) previewStatusText.textContent = '✅ Foto dari kamera siap dikirim';
      if (previewContainer) previewContainer.style.display = 'block';

      sessionStorage.removeItem('temp_aduan_photo');
    }
    if (modalForm) {
      modalForm.classList.add('show');
      openModalWithHistory('form');
    }
  }

  if (btnTriggerFoto) {
    btnTriggerFoto.addEventListener('click', async () => {
      if (!checkAuthOrRedirect()) return;
      await requestNativePermissions('camera');
      if (modalForm) {
        modalForm.classList.add('show');
        openModalWithHistory('form');
      }
      if (inputFoto) {
        inputFoto.setAttribute('accept', 'image/*');
        inputFoto.click();
      }
    });
  }

  if (btnTriggerVideo) {
    btnTriggerVideo.addEventListener('click', async () => {
      if (!checkAuthOrRedirect()) return;
      await requestNativePermissions('camera');
      if (modalForm) {
        modalForm.classList.add('show');
        openModalWithHistory('form');
      }
      if (inputFoto) {
        inputFoto.setAttribute('accept', 'video/*');
        inputFoto.click();
      }
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      if (modalForm) {
        modalForm.classList.remove('show');
        closeModalWithoutHistory();
      }
    });
  }

  if (btnCloseDetailModal) {
    btnCloseDetailModal.addEventListener('click', () => {
      if (modalDetail) {
        modalDetail.classList.remove('show');
        closeModalWithoutHistory();
      }
    });
  }

  if (btnAmbilFotoOnly && inputFoto) {
    btnAmbilFotoOnly.addEventListener('click', async () => {
      await requestNativePermissions('camera');
      inputFoto.setAttribute('accept', 'image/*');
      inputFoto.click();
    });
  }

  if (btnAmbilVideoOnly && inputFoto) {
    btnAmbilVideoOnly.addEventListener('click', async () => {
      await requestNativePermissions('camera');
      inputFoto.setAttribute('accept', 'video/*');
      inputFoto.click();
    });
  }

  if (inputFoto) {
    inputFoto.addEventListener('change', (e) => {
      const target = e.target;
      const file = target.files && target.files[0];
      if (!file) return;

      if (file.type.startsWith('video/')) {
        if (file.size > 800 * 1024) {
          window.showModernPopup({
            title: 'Ukuran Video Terlalu Besar',
            msg: 'Maksimal ukuran file video adalah 800 KB (durasi singkat ~3–5 detik).',
            type: 'warning'
          });
          inputFoto.value = '';
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (evt) => {
          compressedBase64 = evt.target.result;
          isVideoType = true;

          if (imgPreview) imgPreview.style.display = 'none';
          if (videoPreview) {
            videoPreview.src = compressedBase64;
            videoPreview.style.display = 'block';
          }
          if (previewStatusText) previewStatusText.textContent = '✅ Video singkat siap dikirim';
          if (previewContainer) previewContainer.style.display = 'block';
        };

      } else {
        isVideoType = false;
        compressImage(file, 800, 0.7, (base64Result) => {
          compressedBase64 = base64Result;
          if (videoPreview) videoPreview.style.display = 'none';
          if (imgPreview) {
            imgPreview.src = base64Result;
            imgPreview.style.display = 'block';
          }
          if (previewStatusText) previewStatusText.textContent = '✅ Foto siap dikirim';
          if (previewContainer) previewContainer.style.display = 'block';
        });
      }
    });
  }

  /* MEREKAM LOKASI GPS & POP-UP MODERN JIKA TERJADI ERROR */
  if (btnGPS) {
    btnGPS.addEventListener('click', async (e) => {
      if (e && e.preventDefault) e.preventDefault();

      await requestNativePermissions('location');
      btnGPS.textContent = '📍 Merekam...';

      const successHandler = async (position) => {
        const lat = position.coords ? position.coords.latitude : position.lat;
        const lng = position.coords ? position.coords.longitude : position.lng;

        latValue = lat;
        lngValue = lng;
        btnGPS.textContent = '⏳ Mencari Tempat...';

        lokasiGpsText = await fetchLocationName(latValue, lngValue);

        if (coordsText) coordsText.textContent = `${lokasiGpsText} (${latValue.toFixed(5)}, ${lngValue.toFixed(5)})`;
        if (gpsInfo) gpsInfo.style.display = 'block';
        btnGPS.textContent = '✅ GPS Terkunci';
      };

      const errorHandler = (err) => {
        console.warn('GPS Error:', err);
        btnGPS.textContent = '📍 Lock GPS';

        window.showModernPopup({
          title: 'Gagal Merekam GPS',
          msg: 'Pastikan fitur lokasi/GPS di HP kamu sudah aktif dan diizinkan untuk aplikasi browser ini.',
          type: 'error'
        });
      };

      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      if (window.requestGeoLocation && typeof window.requestGeoLocation === 'function') {
        window.requestGeoLocation(
          (pos) => successHandler({ lat: pos.lat, lng: pos.lng }),
          errorHandler
        );
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          successHandler,
          errorHandler,
          geoOptions
        );
      } else {
        btnGPS.textContent = '📍 Lock GPS';
        window.showModernPopup({
          title: 'GPS Tidak Didukung',
          msg: 'Fitur lokasi GPS tidak tersedia pada perangkat/browser kamu.',
          type: 'warning'
        });
      }
    });
  }

  if (formAduan) {
    formAduan.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!checkAuthOrRedirect()) return;
      if (!compressedBase64) {
        window.showModernPopup({
          title: 'Lampiran Diperlukan',
          msg: 'Silakan ambil/lampirkan foto atau video bukti laporan terlebih dahulu.',
          type: 'warning'
        });
        return;
      }

      if (btnKirimAduan) {
        btnKirimAduan.disabled = true;
        btnKirimAduan.textContent = '⏳ Mengirim Laporan...';
      }

      try {
        const payloadNama = document.getElementById('aduanNama').value;
        const payloadRt = document.getElementById('aduanRT').value;
        const payloadJudul = document.getElementById('aduanJudul').value;
        const payloadDesc = document.getElementById('aduanDesc').value;
        const isAnonimChecked = chkAnonim ? chkAnonim.checked : false;

        const docRef = await addDoc(collection(db, "aduan_warga05"), {
          nama: payloadNama,
          isAnonim: isAnonimChecked,
          rt: payloadRt,
          judul: payloadJudul,
          deskripsi: payloadDesc,
          fotoBase64: compressedBase64,
          isVideo: isVideoType,
          lat: latValue || null,
          lng: lngValue || null,
          latitude: latValue || null,
          longitude: lngValue || null,
          lokasiGps: lokasiGpsText || (latValue ? `${latValue}, ${lngValue}` : ''),
          status: "Menunggu Verifikasi",
          createdAt: serverTimestamp()
        });

        const localIds = JSON.parse(localStorage.getItem('rw05_user_report_ids') || '[]');
        if (!localIds.includes(docRef.id)) {
          localIds.push(docRef.id);
          localStorage.setItem('rw05_user_report_ids', JSON.stringify(localIds));
        }

        window.showModernPopup({
          title: 'Berhasil Dikirim',
          msg: 'Laporan aduan warga berhasil dikirim ke pengurus RW 05!',
          type: 'success'
        });

        formAduan.reset();
        if (currentUser && currentUser.nama && inputNama) inputNama.value = currentUser.nama;
        if (previewContainer) previewContainer.style.display = 'none';
        if (gpsInfo) gpsInfo.style.display = 'none';
        compressedBase64 = null;
        isVideoType = false;
        latValue = null;
        lngValue = null;
        lokasiGpsText = '';
        btnGPS.textContent = '📍 Lock GPS';

        if (modalForm) {
          modalForm.classList.remove('show');
          closeModalWithoutHistory();
        }
      } catch (err) {
        console.error('Firestore Error:', err);
        window.showModernPopup({
          title: 'Pengiriman Gagal',
          msg: 'Gagal mengirim laporan. Ukuran file terlalu besar atau periksa koneksi internet.',
          type: 'error'
        });
      } finally {
        if (btnKirimAduan) {
          btnKirimAduan.disabled = false;
          btnKirimAduan.textContent = 'Kirim Laporan Warga';
        }
      }
    });
  }
});

function compressImage(file, maxWidth, quality, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    if (event.target && typeof event.target.result === 'string') {
      img.src = event.target.result;
    }
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      callback(canvas.toDataURL('image/jpeg', quality));
    };
  };
}
