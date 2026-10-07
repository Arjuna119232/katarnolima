// Regresi core/permissions.js (baru di 2.3.6).
//
// Bug yang dijaga: aplikasi menanyakan READ_MEDIA_IMAGES ('photos') yang sudah
// dibuang dari manifest, sehingga checkPermissions() selalu "belum granted" dan
// requestPermissions() dipanggil tanpa henti. Setelah warga menolak 2x Android
// berhenti menampilkan dialog -> warga menganggap "popup izinnya hilang".
//
// Modul ini murni logika + DOM ringan, jadi diuji di node:vm tanpa perangkat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const WWW = new URL('../www/', import.meta.url).pathname;
const SRC = readFileSync(join(WWW, 'assets/js/core/permissions.js'), 'utf8');

/** Objek yang dibuat di dalam vm punya prototype realm berbeda, jadi deepStrictEqual
 *  selalu gagal walau isinya identik. Salin lewat JSON ke realm test. */
const dalam = (x) => JSON.parse(JSON.stringify(x));

/** Bangun lingkungan minimal: DOM, localStorage, dan plugin Capacitor tiruan. */
function siapkan({ native = true, granted = [], adaSheet = true } = {}) {
  const store = new Map();
  const panggilan = [];
  const log = [];
  const galat = [];

  // Status yang bisa dikembalikan plugin: 'granted' | 'denied' | 'prompt'.
  const status = {};
  for (const id of ['notifikasi', 'kamera', 'lokasi']) {
    status[id] = granted.includes(id) ? 'granted' : 'prompt';
  }

  function buatPlugin(id, kunci) {
    return {
      checkPermissions: async () => ({ [kunci]: status[id] }),
      requestPermissions: async (o) => {
        panggilan.push([id, o && o.permissions]);
        // Simulasikan warga menekan "Allow" pada dialog Android.
        status[id] = 'granted';
        return { [kunci]: 'granted' };
      }
    };
  }

  const nodes = {};
  function buatNode(id) {
    return {
      id,
      children: [],
      className: '',
      textContent: '',
      attrs: {},
      classList: { add() {}, remove() {} },
      setAttribute(k, v) { this.attrs[k] = v; },
      appendChild(c) { this.children.push(c); return c; },
      handlers: {},
      addEventListener(evt, fn) { (this.handlers[evt] ||= []).push(fn); },
      // Dipakai tes untuk menekan tombol seperti warga sungguhan.
      klik() { (this.handlers.click || []).forEach((f) => f()); },
      querySelector: () => null,
      querySelectorAll: () => []
    };
  }

  const win = {
    Capacitor: {
      isNativePlatform: () => native,
      Plugins: {
        PushNotifications: buatPlugin('notifikasi', 'receive'),
        Camera: buatPlugin('kamera', 'camera'),
        Geolocation: buatPlugin('lokasi', 'location')
      }
    },
    alert: (m) => log.push(['alert', m])
  };

  const doc = {
    l: {},
    addEventListener(e, f) { this.l[e] = f; },
    getElementById: (id) => {
      if (id === 'izin-sheet' && !adaSheet) return null;
      if (!nodes[id]) nodes[id] = buatNode(id);
      return nodes[id];
    },
    createElement: () => buatNode('baru'),
    querySelector: () => null,
    querySelectorAll: () => []
  };

  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };
  const sessionStorage = { getItem: () => null, setItem() {} };

  const sandbox = {
    window: win, document: doc, localStorage, sessionStorage,
    console: { log: (m) => log.push(m), warn: (m) => log.push(m) },
    Promise, JSON, Object, Array, String, Boolean, Math, Date, RegExp, setTimeout, clearTimeout,
    Element: function () {}
  };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);

  return {
    Izin: win.KATARNOLIMA_Izin, panggilan, log, galat, nodes, store,
    mulai: () => doc.l.DOMContentLoaded && doc.l.DOMContentLoaded(),
    // Tekan tombol "Izinkan" pada sheet, persis seperti warga.
    tekanIzinkan: () => nodes['izin-btn-izinkan'] && nodes['izin-btn-izinkan'].klik(),
    tekanNanti: () => nodes['izin-btn-nanti'] && nodes['izin-btn-nanti'].klik(),
    status
  };
}

test('izin: modul mengekspos API yang dipakai halaman lain', () => {
  const s = siapkan();
  assert.ok(s.Izin, 'window.KATARNOLIMA_Izin harus ada');
  for (const m of ['cek', 'cekSemua', 'minta', 'arahkanSistem', 'maybeTampilkan', 'reset', 'ringkas']) {
    assert.equal(typeof s.Izin[m], 'function', `API ${m}() harus ada`);
  }
  s.mulai();
});

test('izin: hanya tiga izin yang diminta, dan TIDAK PERNAH photos', () => {
  const s = siapkan();
  assert.equal(s.Izin.daftar.length, 3);
  const ids = dalam(s.Izin.daftar.map((d) => d.id));
  assert.deepEqual(dalam(ids), ['notifikasi', 'kamera', 'lokasi']);
  for (const d of s.Izin.daftar) {
    // Kunci izin = nama field yang dipakai plugin Capacitor, BUKAN nama lokal kita.
    const kunciHarus = { notifikasi: 'receive', kamera: 'camera', lokasi: 'location' }[d.id];
    assert.equal(d.kunciIzin, kunciHarus,
      `kunci izin untuk ${d.id} harus '${kunciHarus}' sesuai nama field plugin`);
    assert.ok(!JSON.stringify(d).includes('photos'),
      'READ_MEDIA_IMAGES tidak boleh diminta — tidak ada di manifest dan tidak dipakai');
  }
  s.mulai();
});

test('izin: onboarding meminta izin berurutan, satu dialog pada satu waktu', async () => {
  const s = siapkan({ granted: [] });
  const selesai = s.Izin.maybeTampilkan();
  s.tekanIzinkan();
  const hasil = await selesai;
  const ids = s.panggilan.map((p) => p[0]);
  assert.deepEqual(dalam(ids), ['notifikasi', 'kamera', 'lokasi'], 'harus berurutan: notifikasi dulu');
  for (const p of s.panggilan) {
    assert.equal(p[1].length, 1, `izin ${p[0]} harus satu per satu, bukan ditumpuk: ${JSON.stringify(p[1])}`);
  }
  assert.deepEqual(dalam(hasil), { notifikasi: 'granted', kamera: 'granted', lokasi: 'granted' });
});

test('izin: izin yang SUDAH diizinkan tidak diminta lagi', async () => {
  const s = siapkan({ granted: ['kamera'] });
  const selesai = s.Izin.maybeTampilkan();
  s.tekanIzinkan();
  await selesai;
  const ids = s.panggilan.map((p) => p[0]);
  assert.deepEqual(dalam(ids), ['notifikasi', 'lokasi'],
    'hanya yang statusnya prompt; kamera yang sudah granted jangan diganggu');
});

test('izin: hanya tampil SEKALI, tidak mengganggu warga di pemakaian berikutnya', async () => {
  const s = siapkan({ granted: [] });
  const selesai = s.Izin.maybeTampilkan();
  s.tekanIzinkan();
  await selesai;
  assert.equal(s.panggilan.length, 3, 'percobaan pertama meminta semua');
  const kedua = await s.Izin.maybeTampilkan();
  assert.equal(kedua, false, 'sudah pernah ditampilkan -> jangan tampilkan lagi');
  assert.equal(s.panggilan.length, 3, 'tidak boleh ada permintaan baru di percobaan kedua');
});

test('izin: di browser (bukan APK) tidak ada dialog yang diminta', async () => {
  const s = siapkan({ native: false });
  const tampil = await s.Izin.maybeTampilkan();
  assert.equal(tampil, false, 'di browser sheet tidak muncul');
  assert.equal(s.panggilan.length, 0, 'npm run serve tidak boleh memicu permintaan izin');
  // Status harus jujur 'prompt', bukan mengarang 'granted'.
  assert.deepEqual(dalam(await s.Izin.cekSemua()),
    { notifikasi: 'prompt', kamera: 'prompt', lokasi: 'prompt' });
});

test('izin: status di Pengaturan jujur — tidak mengarang "diizinkan"', async () => {
  const s = siapkan({ granted: ['notifikasi'] });
  const baris = await s.Izin.ringkas();
  assert.equal(baris.length, 3);
  assert.equal(baris.find((b) => b.id === 'notifikasi').status, 'granted');
  assert.equal(baris.find((b) => b.id === 'kamera').status, 'prompt');
  for (const b of baris) {
    assert.ok(b.judul && b.alasan, `${b.id} harus punya judul & alasan (Play wajib menjelaskan alasan)`);
  }
});

test('izin: tidak ada request yang bisa gagal diam-diam', async () => {
  const s = siapkan({ granted: [] });
  const hasil = await s.Izin.minta('kamera');
  assert.ok(['granted', 'denied', 'prompt'].includes(hasil),
    `status tak terduga akan membuat UI lie: ${hasil}`);
});

test('izin: CSS sheet ada di beranda DAN di Pengaturan', () => {
  const beranda = readFileSync(join(WWW, 'index.html'), 'utf8');
  const pengaturan = readFileSync(join(WWW, 'pages/pengaturan.html'), 'utf8');
  for (const [nama, teks] of [['index.html', beranda], ['pengaturan.html', pengaturan]]) {
    assert.ok(teks.includes('id="izin-sheet"'), `${nama} harus punya sheet izin (reset() butuh)`);
    assert.ok(teks.includes('izin.css'), `${nama} harus memuat CSS izin`);
    assert.ok(teks.includes('permissions.js'), `${nama} harus memuat core/permissions.js`);
  }
});

test('izin: tidak ada permintaan READ_MEDIA_IMAGES di halaman mana pun', () => {
  const jejak = [];
  const jalan = (d) => {
    for (const n of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, n.name);
      if (n.isDirectory()) jalan(p);
      else if (/\.(js|html)$/.test(n.name)) jejak.push([p, readFileSync(p, 'utf8')]);
    }
  };
  jalan(WWW);
  const salah = jejak
    .filter(([p, t]) => /requestPermissions\(\{[^}]*photos/.test(t))
    .map(([p]) => p.replace(WWW, ''));
  assert.deepEqual(salah, [], 'photos (READ_MEDIA_IMAGES) tidak ada di manifest — jangan diminta');
});

test('izin: halaman beranda tidak lagi punya splash overlay (cuma splash native)', () => {
  const beranda = readFileSync(join(WWW, 'index.html'), 'utf8');
  const splashJs = readFileSync(join(WWW, 'assets/js/core/splash.js'), 'utf8');
  assert.ok(!beranda.includes('id="splash-screen"'),
    'overlay #splash-screen harus dihapus — splash native saja');
  assert.ok(!/getElementById\(\s*'splash-screen'/.test(splashJs),
    'core/splash.js tidak lagi boleh mengelola overlay splash');
  // Sapaan warga harus tetap hidup.
  assert.ok(splashJs.includes('dynamic-island-greeting') || splashJs.includes('diShown'),
    'sapaan Dynamic Island tidak boleh ikut terhapus');
});
