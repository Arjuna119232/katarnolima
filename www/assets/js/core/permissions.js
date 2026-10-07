/**
 * KATARNOLIMA — core/permissions.js
 * Onboarding izin Android: pop-up perizinan yang muncul SATU KALI saat warga
 * pertama kali membuka aplikasi.
 *
 * Kenapa perlu (gejala 2.3.5, diperbaiki 2.3.6):
 *  - Izin dulu diminta hanya "on demand" saat warga memakai fitur tertentu, dan
 *    permintaannya ikut menanyakan READ_MEDIA_IMAGES ('photos') yang sudah
 *    dibuang dari manifest. Akibatnya checkPermissions() selalu melaporkan
 *    "belum granted" lalu requestPermissions() dipanggil terus-menerus.
 *    Setelah warga menolak dua kali, Android berhenti menampilkan dialog —
 *    warga menyimpulkan "popup izinnya hilang".
 *  - Android 13+ tidak memberi izin notifikasi otomatis; harus diminta
 *    eksplisit. Tanpa itu warga tidak pernah menerima pengumuman.
 *
 * Prinsip yang dipegang (agar lolos kebijakan Google Play):
 *  1. Jelaskan kegunaannya dalam bahasa warga SEBELUM dialog sistem muncul.
 *     Play menolak aplikasi yang meminta izin tanpa alasan.
 *  2. Satu izin satu dialog, berurutan — jangan menumpuk dialog Android.
 *  3. Tidak ada yang diblokir._unsigned pun aplikasi tetap jalan; hanya
 *     fiturnya yang tidak bisa dipakai.
 *  4. Settled: kalau warga menolak, tidak ditanyakan lagi di sesi berikutnya.
 *  5. Lokasi bersifat opsional — hanya untuk koordinat kejadian aduan.
 *
 * API (dipakai halaman lain):
 *   window.KATARNOLIMA_Izin.maybeTampilkan()  -> sudah pernah ditampilkan?
 *   window.KATARNOLIMA_Izin.cekSemua()        -> { notifikasi, kamera, lokasi }
 *   window.KATARNOLIMA_Izin.minta('kamera')   -> minta satu izin
 *   window.KATARNOLIMA_Izin.arahkanSistem(id)-> buka Pengaturan aplikasi
 *   window.KATARNOLIMA_Izin.reset()           -> tampilkan ulang (dipakai Pengaturan)
 */
(function () {
  'use strict';

  var KUNCI = 'rw05_izin_v1';
  var JEDA_ANTAR_DIALOG_MS = 500;
  var jumlahDialog = 0;

  // Urutan TIDAK boleh diacak: notifikasi dulu (paling sering terlewat),
  // baru kamera, lalu lokasi (opsional).
  var DAFTAR = [
    {
      id: 'notifikasi',
      ikon: '📅',
      judul: 'Pengumuman masuk',
      alasan: 'Agar warga tahu pengumuman kas, iuran, dan kegiatan RW tanpa perlu membuka aplikasi.',
      plugin: 'PushNotifications',
      kunciIzin: 'receive'
    },
    {
      id: 'kamera',
      ikon: '📷',
      judul: 'Foto aduan & bukti',
      alasan: 'Untuk melampirkan foto aduan warga dan bukti pembayaran iuran.',
      plugin: 'Camera',
      kunciIzin: 'camera'
    },
    {
      id: 'lokasi',
      ikon: '📍',
      judul: 'Lokasi kejadian (opsional)',
      alasan: 'Hanya dipakai bila warga melaporkan kejadian dengan titik lokasi. Boleh dilewati.',
      plugin: 'Geolocation',
      kunciIzin: 'location'
    }
  ];

  function plugin(nama) {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[nama]
      ? window.Capacitor.Plugins[nama]
      : null;
  }

  function defUntuk(id) {
    for (var i = 0; i < DAFTAR.length; i++) {
      if (DAFTAR[i].id === id) return DAFTAR[i];
    }
    return null;
  }

  function diApk() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  function tunggu(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function catatan() {
    try {
      return JSON.parse(localStorage.getItem(KUNCI) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function simpan(data) {
    try { localStorage.setItem(KUNCI, JSON.stringify(data)); } catch (e) { /* abaikan */ }
  }

  function el(id) { return document.getElementById(id); }

  function labelStatus(st) {
    if (st === 'granted') return 'Diizinkan';
    if (st === 'denied') return 'Ditolak';
    return 'Belum diizinkan';
  }

  /**
   * Status satu izin: 'granted' | 'prompt' | 'denied'.
   * Di browser (npm run serve) selalu 'prompt' supaya alurnya bisa diuji.
   */
  async function cek(id) {
    var def = defUntuk(id);
    if (!def || !diApk()) return 'prompt';
    var p = plugin(def.plugin);
    if (!p || typeof p.checkPermissions !== 'function') return 'prompt';
    try {
      var s = await p.checkPermissions();
      var st = s && s[def.kunciIzin];
      if (id === 'lokasi' && st !== 'granted' && s && s.coarseLocation === 'granted') st = 'granted';
      return st || 'prompt';
    } catch (e) {
      return 'prompt';
    }
  }

  async function cekSemua() {
    var hasil = {};
    for (var i = 0; i < DAFTAR.length; i++) {
      hasil[DAFTAR[i].id] = await cek(DAFTAR[i].id);
    }
    return hasil;
  }

  /** Minta satu izin, kembalikan status akhirnya. */
  async function minta(id) {
    var def = defUntuk(id);
    if (!def || !diApk()) return 'prompt';
    var p = plugin(def.plugin);
    if (!p || typeof p.requestPermissions !== 'function') return 'prompt';
    try {
      var s = await p.requestPermissions({ permissions: [def.kunciIzin] });
      return (s && s[def.kunciIzin]) || (await cek(id));
    } catch (e) {
      console.warn('[Izin] requestPermissions ' + id + ' gagal:', e);
      return cek(id);
    }
  }

  /**
   * Android berhenti menampilkan dialog setelahPhencess denied dua kali.
   * Memanggil requestPermissions() lagi hanya sia-sia — dialog tidak akan
   * pernah muncul. Satu-satunya jalan: buka Pengaturan sistem.
   */
  async function arahkanSistem(id) {
    var def = defUntuk(id);
    if (!def) return;
    var ket = catatan();
    ket[id + '_tanyaSistem'] = true;
    simpan(ket);

    var dibuka = false;
    var app = plugin('App');
    if (app && typeof app.openSettings === 'function') {
      try {
        await app.openSettings();
        dibuka = true;
      } catch (e) { /* coba cara lain */ }
    }
    if (!dibuka) {
      try { window.location.href = 'app-settings:'; } catch (e) { /* abaikan */ }
    }
    window.alert(
      'Izin "' + def.judul + '" sudah dimatikan untuk aplikasi ini.\n\n' +
      'Buka Pengaturan > Aplikasi > KATARNOLIMA > Izin, lalu nyalakan lagi.'
    );
  }

  // ------------------------------------------------------------------ UI

  function tutupSheet() {
    var s = el('izin-sheet');
    if (!s) return;
    s.classList.remove('show');
    s.setAttribute('aria-hidden', 'true');
  }

  function bukaSheet() {
    var s = el('izin-sheet');
    if (!s) return;
    s.classList.add('show');
    s.setAttribute('aria-hidden', 'false');
  }

  function baris(def, status) {
    var li = document.createElement('li');
    li.className = 'izin-item';
    li.setAttribute('data-id', def.id);
    li.setAttribute('data-status', status);

    var ikon = document.createElement('span');
    ikon.className = 'izin-ikon';
    ikon.setAttribute('aria-hidden', 'true');
    ikon.textContent = def.ikon;

    var teks = document.createElement('span');
    teks.className = 'izin-teks';
    var judul = document.createElement('strong');
    judul.textContent = def.judul;
    var alasan = document.createElement('span');
    alasan.className = 'izin-alasan';
    alasan.textContent = def.alasan;
    teks.appendChild(judul);
    teks.appendChild(alasan);

    var badge = document.createElement('span');
    badge.className = 'izin-status';
    badge.textContent = labelStatus(status);

    li.appendChild(ikon);
    li.appendChild(teks);
    li.appendChild(badge);
    return li;
  }

  function perbaruiBaris(id, status) {
    var li = document.querySelector('#izin-daftar .izin-item[data-id="' + id + '"]');
    if (!li) return;
    li.setAttribute('data-status', status);
    var badge = li.querySelector('.izin-status');
    if (badge) badge.textContent = labelStatus(status);
  }

  async function gambarDaftar() {
    var wadah = el('izin-daftar');
    if (!wadah) return;
    wadah.innerHTML = '';
    for (var i = 0; i < DAFTAR.length; i++) {
      var def = DAFTAR[i];
      wadah.appendChild(baris(def, await cek(def.id)));
    }
  }

  /** Minta izin berurutan: hanya yang statusnya 'prompt'. */
  async function mintaBerturut() {
    jumlahDialog = 0;
    for (var i = 0; i < DAFTAR.length; i++) {
      var def = DAFTAR[i];
      var st = await cek(def.id);
      if (st === 'granted') continue;
      // Sudah pernah diarahkan ke Pengaturan? Jangan bother dialog yang tidak akan muncul.
      if (catatan()[def.id + '_tanyaSistem']) continue;
      if (jumlahDialog > 0) await tunggu(JEDA_ANTAR_DIALOG_MS);
      jumlahDialog++;
      perbaruiBaris(def.id, await minta(def.id));
    }
  }

  async function jalankan(onSelesai) {
    await gambarDaftar();
    await mintaBerturut();
    var ket = catatan();
    ket.sudahDitampilkan = true;
    ket.selesaiPada = new Date().toISOString();
    simpan(ket);
    tutupSheet();
    if (typeof onSelesai === 'function') onSelesai(await cekSemua());
  }

  /**
   * Tampilkan HANYA SEKALI. Setelah itu warga tidak diganggu lagi, kecuali
   * warga sendiri menekan "Atur ulang" di halaman Pengaturan.
   */
  function maybeTampilkan() {
    if (!diApk()) return Promise.resolve(false);
    if (catatan().sudahDitampilkan) return Promise.resolve(false);
    if (!el('izin-sheet')) return Promise.resolve(false);

    return new Promise(function (resolve) {
      var sudahJalan = false;
      function mulai() {
        if (sudahJalan) return;
        sudahJalan = true;
        jalankan(resolve);
      }
      function lewati() {
        var ket = catatan();
        ket.sudahDitampilkan = true;
        ket.dilewati = true;
        ket.selesaiPada = new Date().toISOString();
        simpan(ket);
        tutupSheet();
        resolve(false);
      }
      bukaSheet();
      var ya = el('izin-btn-izinkan');
      var nanti = el('izin-btn-nanti');
      if (ya) ya.addEventListener('click', mulai, { once: true });
      if (nanti) nanti.addEventListener('click', lewati, { once: true });
    });
  }

  // ------------------------------------------------------------- PUBLIK
  window.KATARNOLIMA_Izin = {
    daftar: DAFTAR,
    cek: cek,
    cekSemua: cekSemua,
    minta: minta,
    arahkanSistem: arahkanSistem,
    maybeTampilkan: maybeTampilkan,
    reset: function () {
      try { localStorage.removeItem(KUNCI); } catch (e) { /* abaikan */ }
      jumlahDialog = 0;
      return maybeTampilkan();
    },
    ringkas: async function () {
      var s = await cekSemua();
      var out = [];
      for (var i = 0; i < DAFTAR.length; i++) {
        var def = DAFTAR[i];
        out.push({
          id: def.id,
          judul: def.judul,
          alasan: def.alasan,
          ikon: def.ikon,
          status: s[def.id]
        });
      }
      return out;
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var s = el('izin-sheet');
    if (s) {
      s.setAttribute('aria-hidden', 'true');
      var tutup = s.querySelector('[data-izin-tutup]');
      if (tutup) tutup.addEventListener('click', tutupSheet);
    }

    // Muncul sedikit setelah app siap supaya tidak menumpuk dengan dialog lain.
    setTimeout(function () {
      if (catatan().sudahDitampilkan) return;
      setTimeout(maybeTampilkan, 1200);
    }, 400);
  });
})();
