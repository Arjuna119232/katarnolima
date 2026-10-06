/**
 * KATARNOLIMA — core/admob.js
 * Menampilkan iklan Google AdMob di dalam CARD IKLAN beranda (`#admob-native-card`).
 *
 * Plugin : @capacitor-community/admob (v8.2.0) — hanya jalan di APK Android.
 *
 * ⚠️ Kenapa tidak bisa sesederhana "taruh sekali lalu diam":
 * banner AdMob adalah View Android yang melayang DI ATAS WebView pada koordinat
 * layar tertentu (BOTTOM_CENTER + margin bawah). Card-nya ikut ter-scroll bersama
 * halaman, jadi margin harus dihitung ulang setiap kali card berubah posisi.
 * Kalau tidak, banner akan nyangkut di tepi bawah layar — bukan di dalam card.
 *
 * Alur:
 *   1. izin pelacakan (no-op di Android)
 *   2. UMP consent → kalau gagal/ditolak, lanjut dengan iklan NON-PERSONAL
 *   3. initialize()
 *   4. pasang banner tepat di posisi card; pindah lagi setelah user berhenti scroll
 *   5. sembunyikan saat card keluar layar agar tidak menutupi konten lain
 *
 * Kalau ada masalah, alasannya ditulis DI DALAM card — bukan cuma di log.
 * ID iklan & mode uji dibaca dari www/assets/js/admob.config.js (dihasilkan CI dari
 * native/admob.config.json). Tidak ada ID yang ditulis manual di file ini.
 */

(function () {
  'use strict';

  var ESTIMASI_TINGGI_DP = 50;   // tinggi ADAPTIVE_BANNER potret, sebelum SizeChanged
  var JEDA_MULAI_MS = 1500;
  var JEDA_REPASANG_MS = 350;    // tunggu user berhenti scroll
  var JEDA_LAGI_MS = 5000;       // jeda sebelum mencoba ulang kalau gagal
  var LOG = '[AdMob]';

  var kartu = null;
  var tinggiDp = ESTIMASI_TINGGI_DP;
  var marginTerpasang = null;    // margin banner yang sedang aktif
  var tampil = false;
  var sudahMulai = false;
  var dalamPemasangan = false;
  var sudahGagalSatuKali = false;
  var jedaPasang = null;
  var modeUji = false;
  var nonPersonal = false;

  function log(pesan) { console.log(LOG + ' ' + pesan); }

  function notif(alas) {
    if (!kartu) return;
    kartu.setAttribute('data-admob', tampil ? 'shown' : 'idle');
    var ket = kartu.querySelector('.admob-note');
    if (ket) ket.textContent = alasan || '';
  }

  function plugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob
      ? window.Capacitor.Plugins.AdMob : null;
  }

  /** Margin bawah (dp) agar banner duduk tepat di dalam card. */
  function marginButuh() {
    var r = kartu.getBoundingClientRect();
    return Math.max(0, Math.round(window.innerHeight - r.top - tinggiDp));
  }

  function setLabel() {
    var l = document.getElementById('admob-card-label');
    if (l) l.textContent = modeUji ? 'IKLAN UJI' : 'IKLAN';
  }

  /** Samakan tinggi/lebar card dengan banner supaya tidak ada celah. */
  function rapatkanCard() {
    kartu.style.margin = '0';
    kartu.style.padding = '0';
    kartu.style.height = tinggiDp + 'px';
    kartu.style.overflow = 'hidden';
    kartu.style.borderRadius = '0';
    var isi = kartu.querySelector('.rekom-img, .rekom-text');
    if (isi) isi.style.display = 'none';
  }

  function longgarkanCard() {
    kartu.style.height = '';
    kartu.style.padding = '';
    kartu.style.margin = '';
    kartu.style.borderRadius = '';
    var isi = kartu.querySelector('.rekom-img, .rekom-text');
    if (isi) isi.style.display = '';
  }

  async function pasang() {
    var AdMob = plugin();
    var adId = window.KATARNOLIMA_ADMOB_BANNER_ID;
    if (!AdMob || dalamPemasangan) return;
    if (!adId) { notif('ID iklan belum diisi'); return; }

    dalamPemasangan = true;
    try {
      rapatkanCard();
      var m = marginButuh();
      // Sudah pas posisinya → jangan request ulang (mengquotes kuota tayangan).
      if (tampil && marginTerpasang !== null && Math.abs(m - marginTerpasang) < 6) return;

      if (tampil) await AdMob.removeBanner().catch(function () {});
      tampil = false;

      await AdMob.showBanner({
        adId: adId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: m,
        isTesting: modeUji,
        npa: nonPersonal
      });
      tampil = true;
      marginTerpasang = m;
      setLabel();
      notif('');
      log('banner terpasang, margin ' + m + 'dp (mode ' + (modeUji ? 'uji' : 'produksi')
        + (nonPersonal ? ', non-personal' : '') + ')');
    } catch (err) {
      tampil = false;
      marginTerpasang = null;
      longgarkanCard();
      var pesan = (err && (err.message || err.toString())) || String(err);
      notif('Gagal: ' + String(pesan).slice(0, 70));
      log('showBanner gagal: ' + err);
    } finally {
      dalamPemasangan = false;
    }
  }

  function jedaPasang() {
    if (jedaPasang) clearTimeout(jedaPasang);
    jedaPasang = setTimeout(function () {
      jedaPasang = null;
      var r = kartu.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) pasang();
    }, JEDA_REPASANG_MS);
  }

  async function sembunyikan() {
    var AdMob = plugin();
    if (!AdMob || !tampil) return;
    tampil = false;
    marginTerpasang = null;
    await AdMob.hideBanner().catch(function () {});
    longgarkanCard();
    notif('');
  }

  function pantauPosisi() {
    ['scroll', 'resize', 'orientationchange'].forEach(function (evt) {
      window.addEventListener(evt, jedaPasang, { passive: true });
    });
    if (typeof IntersectionObserver === 'undefined') return;
    new IntersectionObserver(function (entri) {
      if (entri[0].isIntersecting) jedaPasang();
      else sembunyikan();
    }, { threshold: 0.02 }).observe(kartu);
  }

  function alasanGagal(langkah, err) {
    var pesan;
    try {
      pesan = (err && (err.message || err.toString())) || String(err || 'tidak diketahui');
    } catch (e) { pesan = 'tidak diketahui'; }
    return 'Gagal di ' + langkah + ': ' + String(pesan).slice(0, 70);
  }

  async function mulai() {
    if (sudahMulai) return;
    sudahMulai = true;
    if (!kartu) return;

    var AdMob = plugin();
    if (!AdMob) {
      // Di browser ini normal. Di APK berarti plugin gagal terdaftar.
      notif(window.Capacitor ? 'plugin AdMob tidak terdaftar' : '');
      log('plugin AdMob tidak ada');
      return;
    }

    modeUji = window.KATARNOLIMA_ADMOB_IS_TESTING === true;

    try {
      if (typeof AdMob.requestTrackingAuthorization === 'function') {
        await AdMob.requestTrackingAuthorization();
      }
    } catch (err) { log('requestTrackingAuthorization: ' + err); }

    // UMP. Di EEA/UK/CH wajib; di wilayah lain biasanya NOT_REQUIRED. Kalau gagal
    // (mis. pesan GDPR belum dipublikasikan di AdMob console) kita tetap lanjut
    // dengan iklan non-personal supaya aplikasi tidak ikut mati total.
    try {
      var info = await AdMob.requestConsentInfo();
      log('consent: status=' + info.status + ' form=' + info.isConsentFormAvailable);
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
        info = await AdMob.showConsentForm();
        log('consent form ditutup: status=' + info.status);
      }
      if (!info.canRequestAds) {
        nonPersonal = true;
        notif('iklan non-personal (menunggu persetujuan)');
      }
    } catch (err) {
      nonPersonal = true;
      notif(alasanGagal('consent', err));
      log('consent gagal, lanjut non-personal: ' + err);
    }

    try {
      await AdMob.initialize({ initializeForTesting: false, testingDevices: [] });
    } catch (err) {
      notif(alasanGagal('inisialisasi', err));
      log('initialize gagal: ' + err);
      return;
    }

    try {
      AdMob.addListener('bannerAdLoaded', function () { notif(''); });
      AdMob.addListener('bannerAdFailedToLoad', function (e) {
        tampil = false;
        marginTerpasang = null;
        longgarkanCard();
        var kode = '';
        try { kode = (e && (e.code || e.errorCode)) || ''; } catch (x) {}
        notif('iklan ditolak' + (kode ? ' (' + kode + ')' : ''));
        log('FailedToLoad: ' + JSON.stringify(e));
        if (!sudahGagalSatuKali) {
          sudahGagalSatuKali = true;
          setTimeout(function () { sudahGagalSatuKali = false; pasang(); }, JEDA_LAGI_MS);
        }
      });
      AdMob.addListener('bannerAdSizeChanged', function (size) {
        if (!size || !size.height) return;
        if (size.height === tinggiDp) return;
        tinggiDp = size.height;
        rapatkanCard();
        jedaPasang();
      });
    } catch (err) { log('gagal memasang listener: ' + err); }

    await pasang();
    pantauPosisi();
  }

  document.addEventListener('DOMContentLoaded', function () {
    kartu = document.getElementById('admob-native-card');
    if (!kartu) return;
    ['pointerdown', 'touchstart', 'scroll'].forEach(function (evt) {
      window.addEventListener(evt, function () { setTimeout(mulai, 0); }, { once: true, passive: true });
    });
    setTimeout(mulai, JEDA_MULAI_MS);
  });
})();