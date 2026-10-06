/**
 * KATARNOLIMA — core/admob.js
 * Menampilkan iklan Google AdMob di dalam CARD IKLAN beranda (`#admob-native-card`).
 *
 * Plugin : @capacitor-community/admob (v8.2.0) — hanya jalan di APK Android.
 *
 * ⚠️ Kenapa tidak bisa sesederhana "taruh sekali lalu diam":
 * banner AdMob adalah View Android yang melayang DI ATAS WebView pada koordinat
 * layar tertentu (BOTTOM_CENTER + margin bawah). Card-nya ikut ter-scroll bersama
 * halaman. Jadi margin harus dihitung ulang setiap kali card berubah posisi.
 * Kalau tidak, banner akan nyangkut di layar bawah — bukan di dalam card.
 *
 * Alur yang dipakai:
 *   1. izin pelacakan (no-op di Android)
 *   2. UMP consent → hanya lanjut bila canRequestAds
 *   3. initialize()
 *   4. pasang banner tepat di posisi card; pindah lagi setelah user berhenti scroll
 *   5. sembunyikan saat card keluar layar, agar tidak menutupi konten lain
 *
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
  var alasan = '';

  function log(pesan) { console.log(LOG + ' ' + pesan); }
  function notif(alas) {
    alasan = alas || '';
    if (!kartu) return;
    kartu.setAttribute('data-admob', tampil ? 'shown' : 'idle');
    var ket = kartu.querySelector('.admob-note');
    if (ket) ket.textContent = alasan;
  }

  function plugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob
      ? window.Capacitor.Plugins.AdMob : null;
  }

  /**
   * Banner diposisikan dengan margin bawah. Margin = jarak dari tepi bawah layar ke
   * ATAS card, dikurangi tinggi banner. Hasilnya: banner duduk tepat di dalam card.
   */
  function marginButuh() {
    var r = kartu.getBoundingClientRect();
    return Math.max(0, Math.round(window.innerHeight - r.top - tinggiDp));
  }

  function setLabel(modeUji) {
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
    if (!AdMob || dalamPemasangan) return;
    dalamPemasangan = true;
    try {
      var modeUji = window.KATARNOLIMA_ADMOB_IS_TESTING === true;
      var adId = window.KATARNOLIMA_ADMOB_BANNER_ID;
      if (!adId) { notif('ID iklan belum diisi'); return; }

      rapatkanCard();
      var m = marginButuh();
      // Sudah benar posisinya → tidak perlu request ulang.
      if (tampil && marginTerpasang !== null && Math.abs(m - marginTerpasang) < 6) return;

      if (tampil) await AdMob.removeBanner().catch(function () {});
      tampil = false;

      await AdMob.showBanner({
        adId: adId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: m,
        isTesting: modeUji
      });
      tampil = true;
      marginTerpasang = m;
      setLabel(modeUji);
      notif('');
      log('banner terpasang di margin ' + m + 'dp (mode ' + (modeUji ? 'uji' : 'produksi') + ')');
    } catch (err) {
      tampil = false;
      log('gagal memasang banner: ' + err);
      notif('iklan gagal dimuat');
    } finally {
      dalamPemasangan = false;
    }
  }

  function jedaPasang() {
    if (jedaPasang) clearTimeout(jedaPasang);
    jedaPasang = setTimeout(function () {
      jedaPasang = null;
      var r = kartu.getBoundingClientRect();
      var diLayar = r.bottom > 0 && r.top < window.innerHeight;
      if (diLayar) pasang();
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
    if (!kartu) return;
    ['scroll', 'resize', 'orientationchange'].forEach(function (evt) {
      window.addEventListener(evt, jedaPasang, { passive: true });
    });
    if (typeof IntersectionObserver === 'undefined') return;
    var obs = new IntersectionObserver(function (entri) {
      if (entri[0].isIntersecting) jedaPasang();
      else sembunyikan();
    }, { threshold: 0.02 });
    obs.observe(kartu);
  }

  async function mulai() {
    if (sudahMulai) return;
    sudahMulai = true;
    var AdMob = plugin();
    if (!AdMob) { log('plugin tidak ada (browser) — dilewati'); return; }
    if (!kartu) return;

    try {
      if (typeof AdMob.requestTrackingAuthorization === 'function') {
        await AdMob.requestTrackingAuthorization();
      }

      var info = await AdMob.requestConsentInfo();
      log('consent: status=' + info.status + ' form=' + info.isConsentFormAvailable);
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
        info = await AdMob.showConsentForm();
        log('consent form ditutup: status=' + info.status);
      }
      if (!info.canRequestAds) {
        notif('menunggu persetujuan iklan');
        return;
      }

      await AdMob.initialize({ initializeForTesting: false, testingDevices: [] });

      AdMob.addListener('bannerAdLoaded', function () { notif(''); });
      AdMob.addListener('bannerAdFailedToLoad', function (e) {
        tampil = false;
        marginTerpasang = null;
        longgarkanCard();
        notif('iklan gagal dimuat');
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
        jedaPasang();   // tinggi berubah → margin ikut berubah
      });

      await pasang();
      pantauPosisi();
    } catch (err) {
      log('gagal menyiapkan: ' + err);
      notif('iklan tidak tersedia');
    }
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