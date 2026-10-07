// Regresi core/admob.js.
//
// Sejarah bug yang dijaga file ini:
//   2.3.3 — `alasan` tak terdefinisi + `jedaPasang` bentrok nama → banner terpasang
//           sekali lalu tidak pernah mengikuti card.
//   2.3.5 — `tampil` di-set true tepat setelah showBanner() resolve. Padahal
//           showBanner() hanya membuat View + mengirim request; kreatifnya datang
//           lewat bannerAdLoaded. Akibatnya card dikecilkan + teks "Memuat ikon…"
//           disembunyikan → pengguna melihat kotak kosong / "iklan memuat terus".
//           Diperbaiki: 'shown' hanya boleh setelah bannerAdLoaded, dan ada
//           watchdog bila event itu tidak pernah datang.
//
// Plugin & DOM disimulasikan dengan jam virtual, jadi tes ini cepat dan tidak
// butuh perangkat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../www/assets/js/core/admob.js', import.meta.url), 'utf8');

function siapkan({ uji = false, muatOtomatis = true, gagalOtomatis = false } = {}) {
  let now = 1000;
  const antrean = [];
  let seq = 0;
  const jadwal = (f, ms) => { const id = ++seq; antrean.push({ id, t: now + ms, f }); return id; };
  const ctx = {
    setTimeout: jadwal,
    clearTimeout: (id) => { const i = antrean.findIndex((x) => x.id === id); if (i >= 0) antrean.splice(i, 1); },
    setInterval: (f, ms) => { const id = ++seq; const ulang = () => antrean.push({ id, t: now + ms, f: () => { f(); ulang(); } }); ulang(); return id; },
  };
  async function maju(ms) {
    const akhir = now + ms;
    for (;;) {
      antrean.sort((a, b) => a.t - b.t);
      const n = antrean[0];
      if (!n || n.t > akhir) break;
      antrean.shift(); now = n.t; n.f();
      for (let i = 0; i < 30; i++) await Promise.resolve();
    }
    now = akhir;
  }
  const panggilan = [];
  const log = [];
  const listener = {};
  let top = 400;
  const kelas = new Set();
  const catatan = { textContent: '' };
  const style = { display: '', height: '' };
  const attr = {};
  const kartu = {
    style,
    classList: { add: (c) => kelas.add(c), remove: (c) => kelas.delete(c) },
    setAttribute: (k, v) => { attr[k] = v; },
    getAttribute: (k) => attr[k],
    querySelector: () => catatan,
    getBoundingClientRect: () => ({ top, bottom: top + 50 }),
  };
  const doc = { l: {}, addEventListener(e, f) { this.l[e] = f; }, getElementById: (id) => (id === 'admob-native-card' ? kartu : { textContent: '' }) };

  // Iklan "termuat" saat showBanner dipanggil, tapi event-nya menyusul lewat
  // antrean — meniru perilaku SDK: View dulu, kreatif kemudian.
  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false }),
    initialize: async () => {},
    showBanner: async (o) => {
      panggilan.push(['show', o.margin, o.isTesting]);
      if (gagalOtomatis) {
        jadwal(() => (listener.bannerAdFailedToLoad || []).forEach((f) => f({ code: 3 })), 100);
      } else if (muatOtomatis) {
        jadwal(() => (listener.bannerAdLoaded || []).forEach((f) => f({})), 100);
      }
      // muatOtomatis=false → bannerAdLoaded TIDAK PERNAH datang (simulasi no-fill).
    },
    removeBanner: async () => { panggilan.push(['remove']); },
    hideBanner: async () => { panggilan.push(['hide']); },
    resumeBanner: async () => { panggilan.push(['resume']); },
    addListener: (evt, fn) => { (listener[evt] ||= []).push(fn); },
  };
  const L = {};
  const win = {
    Capacitor: { Plugins: { AdMob } }, innerHeight: 800,
    addEventListener(e, f) { (L[e] ||= []).push(f); },
    KATARNOLIMA_ADMOB_BANNER_ID: 'ca-app-pub-1/2', KATARNOLIMA_ADMOB_IS_TESTING: uji,
  };
  const galat = [];
  const onRej = (e) => galat.push(e.message);
  process.on('unhandledRejection', onRej);
  const sandbox = { window: win, document: doc, console: { log: (m) => log.push(m) }, Date: { now: () => now }, JSON, Math, String, ...ctx };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);
  return {
    mulai: () => doc.l.DOMContentLoaded(), maju, panggilan, log, galat, catatan, L,
    setTop: (v) => { top = v; }, style, attr, kelas,
    selesai: () => process.off('unhandledRejection', onRej),
  };
}

const jmlShow = (s) => s.panggilan.filter((p) => p[0] === 'show').length;
const status = (s) => s.attr['data-admob'];
const disembunyikan = (s) => s.style.display === 'none';

test('admob: banner requesting di posisi card tanpa error tak tertangani', async () => {
  const s = siapkan();
  s.mulai(); await s.maju(2000);
  assert.deepEqual(s.galat, [], 'tidak boleh ada error (mis. "alasan is not defined")');
  assert.deepEqual(s.panggilan[0], ['show', 350, false], 'margin = tinggiLayar - top - tinggiBanner');
  s.selesai();
});

test('admob 2.3.5: TIDAK boleh dianggap tampil sebelum bannerAdLoaded', async () => {
  // Inilah bug "iklan memuat terus": showBanner() resolve ≠ iklan terisi.
  const s = siapkan({ muatOtomatis: false });
  s.mulai(); await s.maju(2000);
  assert.equal(jmlShow(s), 1, 'request dikirim');
  assert.equal(status(s), 'loading', 'selama belum ada bannerAdLoaded status HARUS loading');
  assert.equal(s.style.height, '', 'card BELUM boleh dikecilkan jadi kotak kosong');
  assert.ok(!s.kelas.has('admob-fit'), 'kelas admob-fit baru boleh dipakai setelah iklannya ada');
  assert.equal(disembunyikan(s), false, 'card tetap terlihat supaya pengguna tahu sedang memuat');
  s.selesai();
});

test('admob 2.3.5: setelah bannerAdLoaded card jadi shown & dirapatkan', async () => {
  const s = siapkan();
  s.mulai(); await s.maju(2000);
  assert.equal(status(s), 'shown', 'bannerAdLoaded → shown');
  assert.ok(s.kelas.has('admob-fit'), 'card dirapatkan mengikuti tinggi banner');
  assert.equal(s.style.height, '50px');
  s.selesai();
});

test('admob 2.3.5: watchdog memicu lagi kalau bannerAdLoaded tidak pernah datang', async () => {
  const s = siapkan({ muatOtomatis: false });
  s.mulai(); await s.maju(2000);
  const awal = jmlShow(s);
  // Watchdog SELESAI_MUAT_MS (15s) + JEDA_LAGI_MS (5s) baru memicu request ulang.
  await s.maju(22000);
  assert.ok(jmlShow(s) > awal, 'watchdog harus memicu request ulang, bukan macet di "memuat"');
  assert.equal(disembunyikan(s), false, 'card tidak boleh disembunyikan hanya karena satu timeout');
  s.selesai();
});

test('admob 2.3.5: gagal terus → card disembunyikan, bukan lubang kosong', async () => {
  const s = siapkan({ gagalOtomatis: true });
  s.mulai();
  await s.maju(200000);           // cukup untuk 3 percobaan + watchdog
  assert.equal(status(s), 'failed', 'harus berakhir di status failed');
  assert.equal(disembunyikan(s), true, 'card disembunyikan supaya tidak ada ruang kosong');
  assert.deepEqual(s.galat, [], 'tidak boleh ada error tak tertangani');
  s.selesai();
});

test('admob: scroll menyembunyikan banner & listener posisi terpasang (jedaPasang berfungsi)', async () => {
  const s = siapkan();
  s.mulai(); await s.maju(2000);
  assert.ok(s.L.scroll && s.L.scroll.length >= 2, 'listener scroll harus terpasang (pantauPosisi)');
  s.L.scroll.forEach((f) => f());
  await s.maju(100);
  assert.ok(s.panggilan.some((p) => p[0] === 'hide'), 'banner harus disembunyikan saat scroll');
  await s.maju(600);
  assert.ok(s.panggilan.some((p) => p[0] === 'resume'), 'posisi sama → banner ditampilkan lagi tanpa request baru');
  assert.equal(jmlShow(s), 1, 'tidak boleh request iklan baru');
  assert.deepEqual(s.galat, []);
  s.selesai();
});

test('admob: request iklan baru dibatasi jaraknya & card di luar layar tidak memasang banner', async () => {
  const s = siapkan();
  s.mulai(); await s.maju(2000);
  s.setTop(300); s.L.scroll.forEach((f) => f());
  await s.maju(1000);
  assert.equal(jmlShow(s), 1, 'masih dalam jeda minimal → tidak boleh request lagi');
  await s.maju(20000);
  assert.equal(jmlShow(s), 2, 'setelah jeda → pasang di posisi baru');
  s.setTop(790); s.L.scroll.forEach((f) => f());
  await s.maju(1000);
  assert.equal(jmlShow(s), 2, 'card terpotong layar → jangan dipasang');
  s.selesai();
});

test('admob: pesan teknis hanya tampil di mode uji', async () => {
  const prod = siapkan({ uji: false });
  prod.mulai(); await prod.maju(2000);
  assert.equal(prod.catatan.textContent, '');
  prod.selesai();
});

test('admob: konfigurasi rilis memakai iklan sungguhan (isTesting=false)', () => {
  const cfg = JSON.parse(readFileSync(new URL('../native/admob.config.json', import.meta.url), 'utf8'));
  assert.equal(cfg.isTesting, false, 'rilis ke Play Store tidak boleh isTesting=true');
});

test('admob: app-ads.txt ada & publisher ID-nya cocok dengan appId AdMob', () => {
  const cfg = JSON.parse(readFileSync(new URL('../native/admob.config.json', import.meta.url), 'utf8'));
  const pub = (cfg.appId || '').split('~')[0].replace('ca-app-pub-', '');
  const raw = readFileSync(new URL('../www/app-ads.txt', import.meta.url), 'utf8');
  const baris = raw.split('\n').map((b) => b.trim())
    .filter((b) => b && !b.startsWith('#'));
  assert.ok(baris.length > 0, 'app-ads.txt harus punya minimal satu baris data');
  for (const b of baris) {
    assert.match(b, /^[a-z0-9.-]+, pub-\d+, (DIRECT|RESELLER), [0-9a-f]+$/,
      `baris app-ads.txt tidak sesuai format IAB: ${b}`);
  }
  assert.ok(baris.some((b) => b.includes(pub)),
    `publisher ID app-ads.txt harus memuat pub-${pub} dari appId AdMob`);
});
