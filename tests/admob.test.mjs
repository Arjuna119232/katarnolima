// Regresi core/admob.js (bug 2.3.3: `alasan` tak terdefinisi + `jedaPasang` bentrok nama →
// banner terpasang sekali lalu tidak pernah mengikuti card). Plugin & DOM disimulasikan
// dengan jam virtual, jadi tes ini cepat dan tidak butuh perangkat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../www/assets/js/core/admob.js', import.meta.url), 'utf8');

function siapkan({ uji = false } = {}) {
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
  let top = 400;
  const kelas = new Set();
  const catatan = { textContent: '' };
  const kartu = {
    style: {}, classList: { add: (c) => kelas.add(c), remove: (c) => kelas.delete(c) },
    setAttribute() {}, querySelector: () => catatan,
    getBoundingClientRect: () => ({ top, bottom: top + 50 }),
  };
  const doc = { l: {}, addEventListener(e, f) { this.l[e] = f; }, getElementById: (id) => (id === 'admob-native-card' ? kartu : { textContent: '' }) };
  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false }),
    initialize: async () => {},
    showBanner: async (o) => { panggilan.push(['show', o.margin, o.isTesting]); },
    removeBanner: async () => { panggilan.push(['remove']); },
    hideBanner: async () => { panggilan.push(['hide']); },
    resumeBanner: async () => { panggilan.push(['resume']); },
    addListener() {},
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
    setTop: (v) => { top = v; }, selesai: () => process.off('unhandledRejection', onRej),
  };
}

test('admob: banner terpasang di posisi card tanpa error tak tertangani', async () => {
  const s = siapkan();
  s.mulai(); await s.maju(2000);
  assert.deepEqual(s.galat, [], 'tidak boleh ada error (mis. "alasan is not defined")');
  assert.deepEqual(s.panggilan[0], ['show', 350, false], 'margin = tinggiLayar - top - tinggiBanner');
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
  assert.equal(s.panggilan.filter((p) => p[0] === 'show').length, 1, 'tidak boleh request iklan baru');
  assert.deepEqual(s.galat, []);
  s.selesai();
});

test('admob: request iklan baru dibatasi jaraknya & card di luar layar tidak memasang banner', async () => {
  const s = siapkan();
  s.mulai(); await s.maju(2000);
  s.setTop(300); s.L.scroll.forEach((f) => f());
  await s.maju(1000);
  assert.equal(s.panggilan.filter((p) => p[0] === 'show').length, 1, 'masih dalam jeda minimal → tidak boleh request lagi');
  await s.maju(20000);
  assert.equal(s.panggilan.filter((p) => p[0] === 'show').length, 2, 'setelah jeda → pasang di posisi baru');
  s.setTop(790); s.L.scroll.forEach((f) => f());
  await s.maju(1000);
  assert.equal(s.panggilan.filter((p) => p[0] === 'show').length, 2, 'card terpotong layar → jangan dipasang');
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
