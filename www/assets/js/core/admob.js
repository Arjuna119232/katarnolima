/**
 * KATARNOLIMA — core/admob.js
 * Menampilkan iklan Google AdMob di dalam CARD IKLAN yang sudah disiapkan di
 * halaman beranda (`#admob-native-card`), bukan banner lepas di bawah layar.
 *
 * Plugin : @capacitor-community/admob (v8.2.0)
 * Hanya jalan di APK Android. Di browser dilewati diam-diam.
 *
 * Alur (WAJIB ikut urutan di bawah — lihat docs/KEAMANAN.md):
 *   1. minta izin pelacakan (iOS; di Android no-op)
 *   2. UMP: requestConsentInfo() → showConsentForm() bila REQUIRED
 *   3. initialize()
 *   4. showBanner() dengan margin dihitung agar banner duduk PERSIS di dalam card
 *
 * ID iklan & mode uji TIDAK ditulis di sini — semuanya dibaca dari
 * www/assets/js/admob.config.js yang ditulis CI dari native/admob.config.json.
 */

(function () {
  'use strict';

  var BANNER_ESTIMASI_DP = 50;   // tinggi ADAPTIVE_BANNER saat potret (sebelum SizeChanged)
  var MULAI_OTOMATIS_MS = 4000;   // jeda maksimal sebelum consent tetap diminta
  var LOG = '[AdMob]';

  var sudahMulai = false;
  var bannerTampil = false;
  var tinggiBannerDp = BANNER_ESTIMASI_DP;
  var kartu = null;

  function $(id) { return document.getElementById(id); }

  function plugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob
      ? window.Capacitor.Plugins.AdMob
      : null;
  }

  /** Hitung margin bawah (dp) agar banner persis berada di dalam kartu. */
  function marginUntukKartu() {
    if (!kartu) return 0;
    var kotak = kartu.getBoundingClientRect();
    var jarakDariBawah = window.innerHeight - kotak.top - tinggiBannerDp;
    return Math.max(0, Math.round(jarakDariBawah));
  }

  function setLabelIkan(tampil, ket) {
    // Label "IKLAN" tetap dipertahankan walau iklan gagal — House Rules AdMob
    // mewajibkan iklan bisa dikenali oleh pengguna.
    var label = $('admob-card-label');
    if (label) label.textContent = ket || 'IKLAN';
    kartu.setAttribute('data-admob', tampil ? 'shown' : 'idle');
  }

  /** Samakan tinggi & lebar kartu dengan banner supaya tidak ada celah. */
  function samakanKartu() {
    if (!kartu) return;
    kartu.style.margin = '0';
    kartu.style.padding = '0';
    kartu.style.height = tinggiBannerDp + 'px';
    kartu.style.overflow = 'hidden';
    kartu.style.borderRadius = '0';
    // Isi placeholder disembunyikan, tapi kartu tetap punya tinggi supaya
    // halaman tidak melompat. Label IKLAN tetap terlihat.
    var isi = kartu.querySelector('.rekom-img, .rekom-text');
    if (isi) isi.style.display = 'none';
  }

  function sembunyikanBanner(Alas) {
    var AdMob = plugin();
    if (!AdMob || !bannerTampil) return;
    bannerTampil = false;
    AdMob.hideBanner().catch(function () { /* banner sudah hilang */ });
    setLabelIkan(false, Alas || 'IKLAN');
    kartu.style.height = '';
    kartu.style.padding = '';
    kartu.style.margin = '';
    kartu.style.borderRadius = '';
    var isi = kartu.querySelector('.rekom-img, .rekom-text');
    if (isi) isi.style.display = '';
  }

  async function tampilkanBanner() {
    var AdMob = plugin();
    var adId = window.KATARNOLIMA_ADMOB_BANNER_ID;
    var modeUji = window.KATARNOLIMA_ADMOB_IS_TESTING === true;

    if (!adId) {
      console.log(LOG + 'ID banner belum diisi (native/admob.config.json) — iklan dilewati.');
      return;
    }

    samakanKartu();

    try {
      await AdMob.showBanner({
        adId: adId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: marginUntukKartu(),
        // Mode uji = true memakai ID demo Google. WAJIB true saat kamu sendiri
        // memakai HP-nya, supaya klikmu tidak dihitung sebagai invalid traffic
        // (yang bisa membuat akun AdMob kena flag).
        isTesting: modeUji
      });
      bannerTampil = true;
      setLabelIkan(true, modeUji ? 'IKLAN UJI' : 'IKLAN');
      console.log(LOG + (modeUji ? 'Banner UJI (tidak menghasilkan uang).' : 'Banner produksi dimuat.'));
    } catch (err) {
      console.warn(LOG + 'Banner gagal dimuat:', err);
      sembunyikanBanner('IKLAN');
    }
  }

  /** Dengarkan perubahan ukuran banner lalu kunci posisinya persis di kartu. */
  function dengarkanUkuran(AdMob) {
    AdMob.addListener('bannerAdSizeChanged', function (size) {
      if (!size || !size.height) return;              // 0 = banner tersembunyi/gagal
      if (size.height === tinggiBannerDp) return;     // sudah pas
      tinggiBannerDp = size.height;
      samakanKartu();
      // Banner yang sudah tampil digeser ke posisi baru.
      AdMob.removeBanner()
        .then(function () { bannerTampil = false; return tampilkanBanner(); })
        .catch(function () { /* biarkan banner tetap di posisi lama */ });
    });

    AdMob.addListener('bannerAdFailedToLoad', function (err) {
      console.warn(LOG + 'Iklan gagal dimuat:', err);
      sembunyikanBanner('IKLAN');
    });

    AdMob.addListener('bannerAdLoaded', function () {
      setLabelIkan(true, window.KATARNOLIMA_ADMOB_IS_TESTING === true ? 'IKLAN UJI' : 'IKLAN');
    });
  }

  /** Jangan biarkan banner melayang di tengah layar saat halaman di-scroll. */
  function dantingaiScroll(AdMob) {
    if (!kartu || typeof IntersectionObserver === 'undefined') return;
    var pengamat = new IntersectionObserver(function (entri) {
      var terlihat = entri[0].isIntersecting;
      if (!bannerTampil) return;
      if (terlihat) {
        AdMob.resumeBanner().catch(function () {});
      } else {
        AdMob.hideBanner().catch(function () {});
      }
    }, { threshold: 0.05 });
    pengamat.observe(kartu);
  }

  async function mulai() {
    if (sudahMulai) return;
    sudahMulai = true;

    var AdMob = plugin();
    if (!AdMob) {
      console.log(LOG + 'Plugin AdMob tidak ada — dilewati (browser).');
      return;
    }
    if (!kartu) return;  // hanya di halaman beranda

    try {
      // 1. Izin pelacakan (di Android fungsi no-op; tetap dipanggil agar iOS aman)
      if (typeof AdMob.requestTrackingAuthorization === 'function') {
        await AdMob.requestTrackingAuthorization();
      }

      // 2. UMP — ini yang bikin iklan BOLEH tayang. Tanpa langkah ini,
      //    `canRequestAds` = false dan akun bisa kena flag oleh Google.
      var info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
        info = await AdMob.showConsentForm();
      }
      if (!info.canRequestAds) {
        console.log(LOG + 'Persetujuan belum diberikan — iklan tidak ditayangkan.');
        setLabelIkan(false, 'IKLAN');
        return;
      }

      // 3. Inisialisasi SDK
      await AdMob.initialize({ initializeForTesting: false, testingDevices: [] });

      // 4. Tampilkan
      dengarkanUkuran(AdMob);
      await tampilkanBanner();
      dantingaiScroll(AdMob);
    } catch (err) {
      console.warn(LOG + 'Gagal menyiapkan iklan:', err);
      setLabelIkan(false, 'IKLAN');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    kartu = $('admob-native-card');
    if (!kartu) return;                 // bukan beranda → tidak ada iklan
    var label = $('admob-card-label');
    if (label) label.id = 'admob-card-label';

    // Iklan sebaiknya diminta setelah pengguna berinteraksi (anjuran Google),
    // tapi tetap dijalankan lewat jeda agar tidak menggantung.
    var jalankanSekali = function () { mulai(); };
    ['pointerdown', 'touchstart', 'scroll'].forEach(function (evt) {
      window.addEventListener(evt, jalankanSekali, { once: true, passive: true });
    });
    setTimeout(jalankanSekali, MULAI_OTOMATIS_MS);
  });
})();
