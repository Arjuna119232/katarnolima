/**
 * KATARNOLIMA — pages/home.ui.js
 * Logika halaman «home» — skrip UI.
 */

window.addEventListener('load', () => {
    const forceDismissSplash = () => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        splash.style.pointerEvents = 'none';
        setTimeout(() => { splash.style.display = 'none'; }, 300);
      }
    };
    setTimeout(forceDismissSplash, 1000);

    const savedKasSaldo = localStorage.getItem('rw05_manual_kas_saldo');
    const savedKasInfo = localStorage.getItem('rw05_manual_kas_info');
    if (savedKasSaldo && document.getElementById('manualSaldoKas')) document.getElementById('manualSaldoKas').textContent = savedKasSaldo;
    if (savedKasInfo && document.getElementById('manualInfoKas')) document.getElementById('manualInfoKas').textContent = savedKasInfo;

    const track = document.getElementById('sliderTrack');
    const dots = document.querySelectorAll('.slider-dots .dot');
    let currentIndex = 0;
    let slideInterval;

    function updateDots(index) {
      dots.forEach((dot, idx) => {
        if (idx === index) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    }

    function scrollToSlide(index) {
      if (!track) return;
      const slideWidth = track.clientWidth;
      track.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
      updateDots(index);
    }

    function startAutoSlide() {
      slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % dots.length;
        scrollToSlide(currentIndex);
      }, 3500);
    }

    function stopAutoSlide() { clearInterval(slideInterval); }

    if (track) {
      track.addEventListener('scroll', () => {
        const slideWidth = track.clientWidth;
        if (slideWidth > 0) {
          const newIndex = Math.round(track.scrollLeft / slideWidth);
          if (newIndex !== currentIndex && newIndex >= 0 && newIndex < dots.length) {
            currentIndex = newIndex;
            updateDots(currentIndex);
          }
        }
      });

      track.addEventListener('touchstart', stopAutoSlide);
      track.addEventListener('touchend', startAutoSlide);
      track.addEventListener('mouseenter', stopAutoSlide);
      track.addEventListener('mouseleave', startAutoSlide);
      startAutoSlide();
    }

    const fabContainer = document.getElementById('fabContainer');
    const fabMain = document.getElementById('fabMain');
    const fabClose = document.getElementById('fabClose');
    const fabOptions = document.getElementById('fabOptions');

    if (fabMain && fabContainer) {
        fabMain.addEventListener('click', () => {
            fabContainer.classList.add('active');
            if (fabOptions) fabOptions.style.display = 'flex';
            if (fabClose) fabClose.style.display = 'flex';
            fabMain.style.display = 'none';
        });
    }

    window.closeFabDarurat = function() {
        if (fabContainer && fabContainer.classList.contains('active')) {
            fabContainer.classList.remove('active');
            if (fabOptions) fabOptions.style.display = 'none';
            if (fabClose) fabClose.style.display = 'none';
            if (fabMain) fabMain.style.display = 'flex';
        }
    };

    if (fabClose) {
        fabClose.addEventListener('click', () => {
            window.closeFabDarurat();
        });
    }
});

function openSatpamModal() {
    const modal = document.getElementById('satpam-modal');
    if (!modal) return;
    const box = modal.querySelector('.satpam-box');
    if(modal && box) {
        modal.style.display = 'flex';
        setTimeout(() => { 
            modal.classList.add('show-overlay'); 
            box.classList.add('show'); 
        }, 10);
    }
}
function closeSatpamModal() {
    const modal = document.getElementById('satpam-modal');
    if (!modal) return;
    const box = modal.querySelector('.satpam-box');
    if(modal && box) {
        box.classList.remove('show'); modal.classList.remove('show-overlay');
        setTimeout(() => { modal.style.display = 'none'; }, 250);
    }
}

function openAmbulansModal() {
    if (typeof window.closeFabDarurat === 'function') window.closeFabDarurat();

    const modal = document.getElementById('ambulans-modal');
    if (!modal) return;
    const box = modal.querySelector('.ambulans-box');
    if(modal && box) {
        modal.style.display = 'flex';
        setTimeout(() => { 
            modal.classList.add('show-overlay'); 
            box.classList.add('show'); 
        }, 10);
    }
}
function closeAmbulansModal() {
    const modal = document.getElementById('ambulans-modal');
    if (!modal) return;
    const box = modal.querySelector('.ambulans-box');
    if(modal && box) {
        box.classList.remove('show'); modal.classList.remove('show-overlay');
        setTimeout(() => { modal.style.display = 'none'; }, 250);
    }
}

function showCustomAlert(title, message, icon = '⚠️') {
  const modal = document.getElementById('custom-alert-modal');
  if (!modal) return;
  const box = modal.querySelector('.custom-alert-box');
  document.getElementById('custom-alert-title').textContent = title;
  document.getElementById('custom-alert-msg').textContent = message;
  document.getElementById('custom-alert-icon').textContent = icon;

  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show-overlay');
    if (box) box.classList.add('show');
  }, 10);
}

function closeCustomAlert() {
  const modal = document.getElementById('custom-alert-modal');
  if (!modal) return;
  const box = modal.querySelector('.custom-alert-box');
  if (box) box.classList.remove('show');
  modal.classList.remove('show-overlay');
  setTimeout(() => { modal.style.display = 'none'; }, 250);
}

let currentStream = null;
let useFacingMode = "environment";
let isFlashOn = false;

async function openCustomCamera() {
  const cameraOverlay = document.getElementById('cameraOverlay');
  const videoEl = document.getElementById('cameraStream');
  if (!cameraOverlay || !videoEl) return;

  // MINTA IZIN NATIVE CAPACITOR CAMERA TERLEBIH DAHULU AGAR POP-UP PERIZINAN MUNCUL
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
    try {
      const cameraPlugin = window.Capacitor.Plugins.Camera;
      let permStatus = await cameraPlugin.checkPermissions();
      if (permStatus.camera !== 'granted' || permStatus.photos !== 'granted') {
        await cameraPlugin.requestPermissions({ permissions: ['camera', 'photos'] });
      }
    } catch (err) {
      console.warn('Izin native kamera ditolak/dilewati:', err);
    }
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCustomAlert('Fitur Kamera', 'Kamera tidak didukung di browser ini. Mengalihkan ke galeri...', '📷');
    setTimeout(() => triggerFileInputFallback(), 1500);
    return;
  }

  cameraOverlay.classList.add('show');
  await startCameraStream(useFacingMode);
}

async function startCameraStream(facing) {
  const videoEl = document.getElementById('cameraStream');
  isFlashOn = false;
  const flashBtn = document.getElementById('btnToggleFlash');
  if(flashBtn) flashBtn.classList.remove('active');

  if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); }
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    videoEl.srcObject = currentStream;
  } catch (err) {
    console.warn('Gagal akses kamera stream:', err);
    showCustomAlert('Akses Kamera', 'Izin kamera ditolak atau tidak tersedia. Membuka pemilih file galeri...', '⚠️');
    triggerFileInputFallback();
  }
}

async function toggleCameraFlash() {
  if (!currentStream) return;
  const track = currentStream.getVideoTracks()[0];
  if (!track) return;

  const capabilities = track.getCapabilities ? track.getCapabilities() : {};
  if (!capabilities.torch) {
    showCustomAlert('Flash Tidak Didukung', 'Kamera perangkat ini tidak mendukung fitur senter/flash lewat browser.', '⚡');
    return;
  }

  try {
    isFlashOn = !isFlashOn;
    await track.applyConstraints({
      advanced: [{ torch: isFlashOn }]
    });
    const flashBtn = document.getElementById('btnToggleFlash');
    if (flashBtn) {
      if (isFlashOn) flashBtn.classList.add('active');
      else flashBtn.classList.remove('active');
    }
  } catch (err) {
    console.warn('Gagal mengaktifkan torch/flash:', err);
    showCustomAlert('Gagal Flash', 'Gagal menyalakan senter kamera.', '⚠️');
  }
}

function toggleCameraFacing() {
  useFacingMode = (useFacingMode === "environment") ? "user" : "environment";
  startCameraStream(useFacingMode);
}

function closeCustomCamera() {
  const cameraOverlay = document.getElementById('cameraOverlay');
  if (cameraOverlay) cameraOverlay.classList.remove('show');
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  isFlashOn = false;
  const flashBtn = document.getElementById('btnToggleFlash');
  if(flashBtn) flashBtn.classList.remove('active');
}

function triggerFileInputFallback() {
  const fallbackInput = document.getElementById('fallbackFileInput');
  if(fallbackInput) fallbackInput.click();
}

function capturePhotoFromCamera() {
  const videoEl = document.getElementById('cameraStream');
  const canvas = document.getElementById('cameraCanvas');
  if (!videoEl || !canvas) return;

  const context = canvas.getContext('2d');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  const capturedBase64 = canvas.toDataURL('image/jpeg', 0.8);
  sessionStorage.setItem('temp_aduan_photo', capturedBase64);
  closeCustomCamera();
  window.location.href = 'pages/aduan-warga.html?autoOpen=1';
}
