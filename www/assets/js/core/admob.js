/**
 * KATARNOLIMA — core/admob.js
 * Menampilkan iklan Google AdMob (banner adaptif) di dalam CARD IKLAN beranda
 * (`#admob-native-card`).
 *
 * Plugin : @capacitor-community/admob (v8) — hanya jalan di APK Android.
 *
 * Kenapa tidak sesederhana "taruh sekali lalu diam":
 * banner AdMob adalah View Android yang melayang DI ATAS WebView pada koordinat
 * layar tertentu (BOTTOM_CENTER + margin bawah). Card-nya ikut ter-scroll bersama
 * halaman, jadi posisi harus dihitung ulang setiap kali card berpindah.
 *
 * Alur:
 *   1. UMP consent → bila gagal/ditolak, lanjut dengan iklan NON-PERSONAL
 *   2. initialize()
 *   3. request banner, card tetap menampilkan "Memuat iklan…" (status loading)
 *   4. IKLAN baru dianggap tampil setelah event bannerAdLoaded benar-benar
 *      datang. showBanner() hanya membuat View + mengirim request; kreatifnya
 *      tiba terpisah. Kalau "tampil" diasumsikan begitu showBanner() resolve,
 *      card langsung dikecilkan jadi kotak kosong dan teks "Memuat ikon…"
 *      ikut hilang — gejalanya "iklan memuat terus" tanpa penjelasan.
 *   5. saat user scroll → banner yang SUDAH berisi kreatif disembunyikan; setelah
 *      scroll berhenti → ditampilkan lagi di posisi baru
 *   6. request iklan baru dibatasi (JEDA_MINIMAL_REQUEST_MS) supaya tidak melanggar
 *      batas refresh AdMob / memicu trafik tidak valid
 *   7. gagal terus (MAKS_COBA_ULANG) → card disembunyikan, bukan dibiarkan
 *      kosong berputar selamanya
 *
 * Pesan teknis ("Gagal: …") HANYA tampil di mode uji. Warga tidak pernah melihatnya.
 * ID iklan & mode uji dibaca dari www/assets/js/admob.config.js (dihasilkan CI dari
 * native/admob.config.json). Tidak ada ID yang ditulis manual di file ini.
 */

(function () {
  'use strict';

  var ESTIMASI_TINGGI_DP = 50;          // tinggi ADAPTIVE_BANNER potret, sebelum SizeChanged
  var JEDA_MULAI_MS = 1500;
  var JEDA_REPASANG_MS = 400;           // tunggu user berhenti scroll
  var JEDA_LAGI_MS = 5000;              // jeda sebelum mencoba ulang kalau gagal
  var JEDA_MINIMAL_REQUEST_MS = 20000;  // jarak minimal antar request iklan baru
  var MAKS_COBA_ULANG = 3;
  var SELESAI_MUAT_MS = 15000;          // watchdog: kalau bannerAdLoaded tak pernah datang
  var PERIKSA_POSISI_MS = 2000;         // mendeteksi card bergeser tanpa scroll (data dimuat)
  var LOG = '[AdMob]';

  // Status kartu. 'shown' HANYA boleh dipakai kalau banner benar-benar berisi
  // kreatif (event bannerAdLoaded). Selain itu card menampilkan status memuat,
  // atau disembunyikan kalau memang tidak ada iklan — tidak pernah kotak kosong.
  var IDLE = 'idle', LOADING = 'loading', SHOWN = 'shown', FAILED = 'failed';

  var kartu = null;
  var tinggiDp = ESTIMASI_TINGGI_DP;
  var marginTerpasang = null;           // margin banner yang SUDAH berisi iklan
  var marginPending = null;             // margin request yang masih berjalan
  var adaBanner = false;                // View banner sudah dibuat di sisi native
  var tampil = false;                   // banner benar-benar berisi kreatif & terlihat
  var statusIklan = IDLE;
  var dalamRequest = false;             // request sudah dikirim, menunggu bannerAdLoaded
  var sudahMulai = false;
  var dalamPemasangan = false;
  var cobaUlang = 0;
  var timerPasang = null;
  var timerWatchdog = null;
  var requestTerakhir = -Infinity;       // belum pernah meminta iklan
  var modeUji = false;
  var nonPersonal = false;

  function log(pesan) { console.log(LOG + ' ' + pesan); }

  /** Status di elemen card = attr data-admob (dipakai CSS untuk tiap tampilan). */
  function notif(alasan) {
    if (!kartu) return;
    kartu.setAttribute('data-admob', statusIklan);
    var ket = kartu.querySelector('.admob-note');
    if (ket) ket.textContent = (modeUji && alasan) ? alasan : '';
  }

  /** Card disembunyikan total saat tidak ada iklan — lebih baik daripada lubang kosong. */
  function sembunyikanCard() {
    if (kartu) kartu.style.display = 'none';
  }

  function tampilkanCard() {
    if (kartu) kartu.style.display = '';
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

  /** Card harus terlihat penuh; kalau tidak, banner akan menutupi konten lain. */
  function kartuTerlihatPenuh() {
    var r = kartu.getBoundingClientRect();
    return r.top >= 0 && (r.top + tinggiDp) <= window.innerHeight;
  }

  function setLabel() {
    var l = document.getElementById('admob-card-label');
    if (l) l.textContent = modeUji ? 'IKLAN UJI' : 'IKLAN';
  }

  /** Samakan tinggi card dengan banner supaya tidak ada celah. */
  function rapatkanCard() {
    if (!kartu) return;
    kartu.classList.add('admob-fit');
    kartu.style.height = tinggiDp + 'px';
  }

  function longgarkanCard() {
    if (!kartu) return;
    kartu.classList.remove('admob-fit');
    kartu.style.height = '';
  }

  /** Reset semua state request. Dipakai sebelum request baru & saat gagal. */
  function resetRequest() {
    dalamRequest = false;
    marginPending = null;
    marginTerpasang = null;
    adaBanner = false;
    tampil = false;
    batalWatchdog();
  }

  /**
   * Watchdog: kalau bannerAdLoaded tidak pernah datang dalam SELESAI_MUAT_MS,
   * state dikembalikan supaya request berikutnya boleh jalan. Tanpa ini satu
   * request yang "hilang" membuat aplikasi selamanya menampilkan "memuat".
   */
  function mulaiWatchdog() {
    batalWatchdog();
    timerWatchdog = setTimeout(function () {
      timerWatchdog = null;
      if (!dalamRequest) return;
      log('bannerAdLoaded tidak datang dalam ' + SELESAI_MUAT_MS + 'ms — reset');
      resetRequest();
      longgarkanCard();
      if (cobaUlang < MAKS_COBA_ULANG) {
        cobaUlang += 1;
        statusIklan = LOADING;
        notif('timeout memuat');
        tampilkanCard();
        jadwalkanPasang(JEDA_LAGI_MS);
      } else {
        statusIklan = FAILED;
        notif('iklan tidak merespons');
        sembunyikanCard();
      }
    }, SELESAI_MUAT_MS);
  }

  function batalWatchdog() {
    if (timerWatchdog) { clearTimeout(timerWatchdog); timerWatchdog = null; }
  }

  function jadwalkanPasang(ms) {
    if (timerPasang) clearTimeout(timerPasang);
    timerPasang = setTimeout(function () {
      timerPasang = null;
      pasang();
    }, ms);
  }

  /** Sembunyikan banner untuk sementara (mis. saat scroll). Layout card tidak diubah. */
  async function sembunyikanSementara() {
    var AdMob = plugin();
    if (!AdMob || !tampil) return;
    tampil = false;
    try { await AdMob.hideBanner(); } catch (e) { /* abaikan */ }
  }

  async function pasang() {
    var AdMob = plugin();
    var adId = window.KATARNOLIMA_ADMOB_BANNER_ID;
    if (!AdMob || !kartu || dalamPemasangan) return;
    if (!adId) { notif('ID iklan belum diisi'); return; }

    if (!kartuTerlihatPenuh()) { await sembunyikanSementara(); return; }

    dalamPemasangan = true;
    try {
      var m = marginButuh();

      // Sudah ada banner BERISI kreatif di posisi yang sama → cukup tampilkan lagi.
      // Syarat status SHOWN itu penting: kalau masih LOADING, banner belum punya
      // isi sehingga tidak boleh dianggap sudah terpasang.
      if (adaBanner && statusIklan === SHOWN && marginTerpasang !== null
          && Math.abs(m - marginTerpasang) < 6) {
        if (!tampil && typeof AdMob.resumeBanner === 'function') {
          await AdMob.resumeBanner();
          tampil = true;
          setLabel();
          notif('');
        }
        return;
      }

      // Request sebelumnya masih menunggu bannerAdLoaded → jangan kirim yang kedua.
      // Kalau card sudah bergeser, penurunan posisi ditangani oleh pemeriksaan
      // berkala (pantauPosisi) setelah iklannya benar-benar termuat.
      if (dalamRequest) return;

      // Posisi berubah → butuh banner baru, tapi jangan terlalu sering meminta iklan.
      var sisa = JEDA_MINIMAL_REQUEST_MS - (Date.now() - requestTerakhir);
      if (sisa > 0) { jadwalkanPasang(sisa + 50); return; }

      if (adaBanner) { try { await AdMob.removeBanner(); } catch (e) { /* abaikan */ } }
      resetRequest();
      requestTerakhir = Date.now();

      // PENTING: showBanner() hanya membuat View + mengirim request; kreatifnya
      // datang terpisah lewat bannerAdLoaded. Jadi card TIDAK dikecilkan di sini
      // — kalau dikecilkan sekarang, teks "Memuat iklan…" ikut hilang dan yang
      // tersisa kotak kosong selamanya (bug "iklan memuat terus").
      statusIklan = LOADING;
      marginPending = m;
      dalamRequest = true;
      setLabel();
      tampilkanCard();
      notif('memuat iklan');
      mulaiWatchdog();

      await AdMob.showBanner({
        adId: adId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: m,
        isTesting: modeUji,
        npa: nonPersonal
      });
      adaBanner = true;
      log('request dikirim, margin ' + m + 'dp (mode ' + (modeUji ? 'uji' : 'produksi')
        + (nonPersonal ? ', non-personal' : '') + ') — menunggu bannerAdLoaded');
      // Belum tampil: menunggu bannerAdLoaded.
    } catch (err) {
      resetRequest();
      longgarkanCard();
      var pesan = (err && (err.message || err.toString())) || String(err);
      notif('Gagal: ' + String(pesan).slice(0, 70));
      log('showBanner gagal: ' + err);
      if (cobaUlang < MAKS_COBA_ULANG) {
        cobaUlang += 1;
        statusIklan = LOADING;
        jadwalkanPasang(JEDA_LAGI_MS);
      } else {
        statusIklan = FAILED;
        sembunyikanCard();
      }
    } finally {
      dalamPemasangan = false;
    }
  }

  function pantauPosisi() {
    // Saat scroll: sembunyikan seketika agar banner tidak "terbang" di atas konten lain.
    window.addEventListener('scroll', function () {
      if (tampil) sembunyikanSementara();
      jadwalkanPasang(JEDA_REPASANG_MS);
    }, { passive: true });
    ['resize', 'orientationchange'].forEach(function (evt) {
      window.addEventListener(evt, function () { jadwalkanPasang(JEDA_REPASANG_MS); }, { passive: true });
    });
    // Card bisa bergeser tanpa scroll (data beranda selesai dimuat) → periksa berkala.
    setInterval(function () {
      if (!tampil || dalamPemasangan || marginTerpasang === null) return;
      if (!kartuTerlihatPenuh() || Math.abs(marginButuh() - marginTerpasang) >= 6) {
        jadwalkanPasang(JEDA_REPASANG_MS);
      }
    }, PERIKSA_POSISI_MS);
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

    // UMP. Di EEA/UK/CH wajib; di wilayah lain biasanya NOT_REQUIRED. Kalau gagal tetap
    // lanjut dengan iklan non-personal supaya aplikasi tidak ikut mati total.
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
      // Iklan baru dianggap benar-benar tampil DI SINI. showBanner() yang
      // resolve bukan bukti banner terisi — kreatifnya tiba lewat event ini.
      AdMob.addListener('bannerAdLoaded', function () {
        dalamRequest = false;
        batalWatchdog();
        cobaUlang = 0;
        statusIklan = SHOWN;
        tampil = true;
        adaBanner = true;
        marginTerpasang = marginPending !== null ? marginPending : marginTerpasang;
        marginPending = null;
        rapatkanCard();
        setLabel();
        notif('');
        log('iklan termuat, margin ' + marginTerpasang + 'dp, tinggi ' + tinggiDp + 'dp');
      });

      AdMob.addListener('bannerAdFailedToLoad', function (e) {
        dalamRequest = false;
        batalWatchdog();
        resetRequest();
        longgarkanCard();
        var kode = '';
        try { kode = (e && (e.code || e.errorCode)) || ''; } catch (x) { /* abaikan */ }
        log('FailedToLoad: ' + JSON.stringify(e));
        if (cobaUlang < MAKS_COBA_ULANG) {
          cobaUlang += 1;
          statusIklan = LOADING;
          notif('iklan ditolak' + (kode ? ' (' + kode + ')' : '') + ', coba lagi');
          jadwalkanPasang(JEDA_LAGI_MS);
        } else {
          // Berhenti berputar: card disembunyikan supaya tidak ada lubang kosong
          // atau "memuat" yang tidak akan pernah selesai.
          statusIklan = FAILED;
          notif('iklan ditolak' + (kode ? ' (' + kode + ')' : ''));
          sembunyikanCard();
        }
      });

      AdMob.addListener('bannerAdSizeChanged', function (size) {
        if (!size || !size.height) return;
        if (Math.abs(size.height - tinggiDp) < 4) return;
        tinggiDp = size.height;
        // Tingginya sudah pasti ada iklannya, jadi aman dirapatkan.
        if (statusIklan === SHOWN) rapatkanCard();
        jadwalkanPasang(JEDA_REPASANG_MS);
      });
    } catch (err) { log('gagal memasang listener: ' + err); }

    pantauPosisi();
    await pasang();
  }

  function mulaiAman() {
    mulai().catch(function (err) { log('mulai() gagal: ' + err); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    kartu = document.getElementById('admob-native-card');
    if (!kartu) return;
    ['pointerdown', 'touchstart', 'scroll'].forEach(function (evt) {
      window.addEventListener(evt, function () { setTimeout(mulaiAman, 0); }, { once: true, passive: true });
    });
    setTimeout(mulaiAman, JEDA_MULAI_MS);
  });
})();
