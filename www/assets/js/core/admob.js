/**
 * KATARNOLIMA — core/admob.js
 * Banner Google AdMob yang menempel DI BAWAH LAYAR, tepat DI ATAS navigasi bawah.
 *
 * Plugin : @capacitor-community/admob (v8) — hanya jalan di APK Android.
 *
 * Kenapa baris paling bawah, bukan di dalam card (perubahan 2.3.8):
 *  Versi 2.3.4–2.3.7 memakai card iklan di dalam halaman beranda dan memindahkan
 *  banner mengikuti posisi card. Cara itu rapuh: banner adalah View Android yang
 *  melayang DI ATAS WebView, jadi begitu posisi card bergeser, banner ikut menutupi
 *  tombol dan ikon di bawahnya. complaints warga: "iklan menutupi tombol".
 *  Sekarang tidak ada card sama sekali. Banner hanya satu, di bawah, dan tinggi
 *  posisinya dihitung dari navigasi bawah yang benar-benar ada di halaman.
 *
 * Cara menentukan posisi (tidak menebak angka):
 *  1. Ukur tinggi `.jaki-nav` secara langsung dari DOM. Angka ini otomatis benar
 *     di HP mana pun, ukuran font berapa pun, dan aman untuk safe area.
 *  2. safe-area bawah ditambahkan supaya banner tidak menimpa navigasi yang sudah
 *     menjauh dari tepi layar (HP dengan tombol gesture / notch).
 *  3. Ruang kosong setinggi banner disisipkan di akhir halaman supaya konten
 *     terakhir tetap bisa di-scroll melewati banner — tanpa ini, tombol paling
 *     bawah tidak akan pernah bisa diklik.
 *
 * Status tampil (perbaikan 2.3.5, tetap dipertahankan):
 *  `showBanner()` hanya membuat View dan mengirim request; kreatifnya tiba lewat
 *  event `bannerAdLoaded`. Kalau banner dianggap tampil begitu `showBanner()`
 *  resolve, hasilnya ruang kosong yang tidak pernah berisi apa pun.
 *  Karena itu banner baru dianggap tampil setelah bannerAdLoaded.
 *
 * Pesan teknis hanya tampil di mode uji. ID iklan & mode uji dibaca dari
 * www/assets/js/admob.config.js (dihasilkan CI dari native/admob.config.json).
 */
(function () {
  'use strict';

  var JEDA_MULAI_MS = 1200;
  var JEDA_LAGI_MS = 5000;              // jeda sebelum mencoba ulang kalau gagal
  var JEDA_MINIMAL_REQUEST_MS = 20000;  // jarak minimal antar request iklan baru
  var SELESAI_MUAT_MS = 15000;          // watchdog: kalau bannerAdLoaded tak pernah datang
  var MAKS_COBA_ULANG = 3;
  var SELISIH_MARGIN_MIN = 4;           // abaikan perubahan margin yang sangat kecil
  var LOG = '[AdMob]';

  var PENYELAM_NASIONAL = '.jaki-nav';
  var AKAR = document.documentElement;
  var NAV = null;

  var tinggiBanner = 0;
  var marginDp = null;
  var bannerAda = false;
  var tampil = false;
  var sedangRequest = false;
  var sudahMulai = false;
  var sedangPasang = false;
  var percobaan = 0;
  var timerPasang = null;
  var timerWatchdog = null;
  var requestTerakhir = -Infinity;
  var modeUji = false;
  var nonPersonal = false;

  function log(pesan) { console.log(LOG + ' ' + pesan); }

  function plugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob
      ? window.Capacitor.Plugins.AdMob : null;
  }

  function diApk() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  /**
   * Margin bawah banner dalam dp = TINGGI NAVIGASI BAWAH yang terukur.
   *
   * Di UKUR dari DOM, bukan ditebak dari angka tetap: kalau navigasi berubah
   * (ikon baru, ukuran font layar, mode landscape) banner otomatis menyesuaikan.
   *
   * Safe area TIDAK ditambahkan di sini. Padding bawah navigasi (lihat
   * global.css .jaki-nav) sudah memakai env(safe-area-inset-bottom), jadi
   * getBoundingClientRect().height SUDAH termasuk jarak aman itu. Menambahkannya
   * lagi akan membuat banner terdorong terlalu jauh ke atas — itu sebabnya
   * perhitungan ulang ganda harus dihindari.
   */
  function hitungMargin() {
    var tinggiNav = 0;
    var el = NAV || document.querySelector(PENYELAM_NASIONAL);
    if (el) {
      var r = el.getBoundingClientRect();
      if (r && r.height) tinggiNav = r.height;
    }
    // Dibatasi supaya banner tidak terdorong terlalu tinggi di layar sangat pendek.
    var dasar = Math.round(tinggiNav);
    if (dasar < 0) dasar = 0;
    if (dasar > 220) dasar = 220;
    return dasar;
  }

  /** Sisipkan ruang kosong setinggi banner supaya konten terakhir bisa di-scroll. */
  function sisipkanRuang(tinggi) {
    if (!AKAR) return;
    if (tinggi > 0) {
      AKAR.style.setProperty('--admob-tinggi-banner', tinggi + 'px');
      AKAR.setAttribute('data-admob-aktif', 'ya');
    } else {
      AKAR.style.setProperty('--admob-tinggi-banner', '0px');
      AKAR.removeAttribute('data-admob-aktif');
    }
  }

  /** Sembunyikan banner tanpa mengubah posisi (mis. saat halaman tidak aktif). */
  async function sembunyi() {
    var AdMob = plugin();
    if (!AdMob || !tampil) return;
    tampil = false;
    try { await AdMob.hideBanner(); } catch (e) { /* abaikan */ }
  }

  function batalWatchdog() {
    if (timerWatchdog) { clearTimeout(timerWatchdog); timerWatchdog = null; }
  }

  function mulaiWatchdog() {
    batalWatchdog();
    timerWatchdog = setTimeout(function () {
      timerWatchdog = null;
      if (!sedangRequest) return;
      log('bannerAdLoaded tidak datang dalam ' + SELESAI_MUAT_MS + 'ms — reset');
      sedangRequest = false;
      bannerAda = false;
      tampil = false;
      if (percobaan < MAKS_COBA_ULANG) {
        percobaan += 1;
        jadwalkanPasang(JEDA_LAGI_MS);
      } else {
        sisipkanRuang(0);
      }
    }, SELESAI_MUAT_MS);
  }

  function jadwalkanPasang(ms) {
    if (timerPasang) clearTimeout(timerPasang);
    timerPasang = setTimeout(function () {
      timerPasang = null;
      pasang();
    }, ms);
  }

  async function pasang() {
    var AdMob = plugin();
    var adId = window.KATARNOLIMA_ADMOB_BANNER_ID;
    if (!AdMob || sedangPasang) return;
    if (!adId) { log('ID iklan belum diisi'); return; }
    // Halaman tanpa navigasi bawah (mis. popup/embed) tidak perlu banner.
    if (!NAV) { log('navigasi bawah tidak ditemukan — banner dilewati'); return; }

    sedangPasang = true;
    try {
      var m = hitungMargin();

      // Posisi sama & banner sudah berisi iklan → cukup tampilkan lagi.
      if (bannerAda && tampil && marginDp !== null && Math.abs(m - marginDp) < SELISIH_MARGIN_MIN) {
        return;
      }
      // Request sebelumnya masih berjalan → jangan kirim yang kedua.
      if (sedangRequest) return;

      // Hindari pergantian posisi terlalu sering (batas refresh AdMob).
      if (marginDp !== null && Math.abs(m - marginDp) < SELISIH_MARGIN_MIN && bannerAda) return;
      var sisa = JEDA_MINIMAL_REQUEST_MS - (Date.now() - requestTerakhir);
      if (sisa > 0) { jadwalkanPasang(sisa + 50); return; }

      if (bannerAda) { try { await AdMob.removeBanner(); } catch (e) { /* abaikan */ } }
      bannerAda = false;
      tampil = false;
      marginDp = m;
      requestTerakhir = Date.now();
      sedangRequest = true;
      mulaiWatchdog();

      await AdMob.showBanner({
        adId: adId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: m,
        isTesting: modeUji,
        npa: nonPersonal
      });
      bannerAda = true;
      log('request dikirim, margin ' + m + 'dp (nav bawah + safe area) — menunggu bannerAdLoaded');
    } catch (err) {
      sedangRequest = false;
      batalWatchdog();
      bannerAda = false;
      tampil = false;
      log('showBanner gagal: ' + err);
      if (percobaan < MAKS_COBA_ULANG) {
        percobaan += 1;
        jadwalkanPasang(JEDA_LAGI_MS);
      } else {
        marginDp = null;
        sisipkanRuang(0);
      }
    } finally {
      sedangPasang = false;
    }
  }

  function pantauPerubahan() {
    // Navigasi bawah berubah tinggi (rotate, font besar, keyboard) → hitung ulang.
    var cek = function () {
      if (!NAV) return;
      var baru = hitungMargin();
      if (marginDp !== null && Math.abs(baru - marginDp) >= SELISIH_MARGIN_MIN) {
        jadwalkanPasang(200);
      }
      if (tampil) sisipkanRuang(tinggiBanner);
    };
    ['resize', 'orientationchange'].forEach(function (evt) {
      window.addEventListener(evt, cek, { passive: true });
    });
    setInterval(cek, 3000);
  }

  async function mulai() {
    if (sudahMulai) return;
    sudahMulai = true;
    if (!diApk()) return;

    var AdMob = plugin();
    if (!AdMob) {
      log('plugin AdMob tidak terdaftar');
      return;
    }

    NAV = document.querySelector(PENYELAM_NASIONAL);
    modeUji = window.KATARNOLIMA_ADMOB_IS_TESTING === true;

    // UMP consent. Bila gagal/ditolak, lanjut dengan iklan non-personal supaya
    // aplikasi tidak ikut mati total.
    try {
      var info = await AdMob.requestConsentInfo();
      log('consent: status=' + info.status + ' form=' + info.isConsentFormAvailable);
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
        info = await AdMob.showConsentForm();
        log('consent form ditutup: status=' + info.status);
      }
      if (!info.canRequestAds) nonPersonal = true;
    } catch (err) {
      nonPersonal = true;
      log('consent gagal, lanjut non-personal: ' + err);
    }

    try {
      await AdMob.initialize({ initializeForTesting: false, testingDevices: [] });
    } catch (err) {
      log('initialize gagal: ' + err);
      return;
    }

    try {
      // Banner baru dianggap benar-benar tampil DI SINI.
      AdMob.addListener('bannerAdLoaded', function () {
        sedangRequest = false;
        batalWatchdog();
        percobaan = 0;
        tampil = true;
        bannerAda = true;
        if (window.innerHeight && window.innerWidth) {
          // ADAPTIVE_BANNER di potret: tinggi banner ≈ 50dp. Dipakai untuk
          // menyisipkan ruang bawah halaman.
          tinggiBanner = window.innerWidth >= window.innerHeight ? 60 : 50;
        } else {
          tinggiBanner = 50;
        }
        sisipkanRuang(tinggiBanner);
        log('iklan termuat, margin ' + marginDp + 'dp');
      });

      AdMob.addListener('bannerAdFailedToLoad', function (e) {
        sedangRequest = false;
        batalWatchdog();
        bannerAda = false;
        tampil = false;
        log('FailedToLoad: ' + JSON.stringify(e));
        if (percobaan < MAKS_COBA_ULANG) {
          percobaan += 1;
          jadwalkanPasang(JEDA_LAGI_MS);
        } else {
          // Berhenti berputar: jangan sisipkan ruang kosong untuk iklan yang
          // tidak akan pernah muncul.
          marginDp = null;
          sisipkanRuang(0);
        }
      });

      AdMob.addListener('bannerAdSizeChanged', function (size) {
        if (!size || !size.height) return;
        if (Math.abs(size.height - tinggiBanner) < 4) return;
        tinggiBanner = size.height;
        if (tampil) sisipkanRuang(tinggiBanner);
      });
    } catch (err) { log('gagal memasang listener: ' + err); }

    pantauPerubahan();
    await pasang();
  }

  function mulaiAman() {
    mulai().catch(function (err) { log('mulai() gagal: ' + err); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    NAV = document.querySelector(PENYELAM_NASIONAL);
    if (!NAV) return;
    ['pointerdown', 'touchstart', 'scroll'].forEach(function (evt) {
      window.addEventListener(evt, function () { setTimeout(mulaiAman, 0); }, { once: true, passive: true });
    });
    setTimeout(mulaiAman, JEDA_MULAI_MS);
  });

  // Dikembalikan agar halaman lain (atau test) bisa memeriksa/memaksa posisi.
  window.KATARNOLIMA_AdMob = {
    pasang: pasang,
    sembunyi: sembunyi,
    status: function () {
      return {
        tampil: tampil, bannerAda: bannerAda, marginDp: marginDp,
        tinggiBanner: tinggiBanner, sedangRequest: sedangRequest
      };
    },
    hitungMargin: hitungMargin
  };
})();