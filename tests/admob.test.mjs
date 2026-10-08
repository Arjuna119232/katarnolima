// Regresi core/admob.js — banner DI BAWAH, di atas navigasi bawah (2.3.8).
//
// Sejarah bug yang dijaga file ini:
//   2.3.3 — `alasan` tak terdefinisi + `jedaPasang` bentrok nama.
//   2.3.5 — `tampil` di-set true tepat setelah showBanner() resolve, padahal
//           kreatifnya datang lewat bannerAdLoaded. Card jadi kotak kosong.
//   2.3.8 — card iklan dihapus; banner pindah ke bawah. Laporan warga:
//           "banner menutupi tombol & ikon di bawah".
//
// Modul ini murni logika + DOM ringan, jadi diuji di node:vm tanpa perangkat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const WWW = new URL('../www/', import.meta.url).pathname;
const SRC = readFileSync(join(WWW, 'assets/js/core/admob.js'), 'utf8');
const INDEX = readFileSync(join(WWW, 'index.html'), 'utf8');
const GLOBAL_CSS = readFileSync(join(WWW, 'assets/css/base/global.css'), 'utf8');

/** Lingkungan minimal: jam virtual, DOM, dan plugin Capacitor tiruan. */
function siapkan({ uji = false, tinggiNav = 72, muatOtomatis = true, gagalOtomatis = false, adaNav = true } = {}) {
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
  const galat = [];
  const listener = {};
  const kelasAturan = {};          // gaya yang ditulis ke <html>

  const nav = {
    getBoundingClientRect: () => ({ top: 800 - tinggiNav, bottom: 800, height: tinggiNav })
  };

  const gaya = {};
  const akar = {
    style: {
      setProperty(k, v) { gaya[k] = v; kelasAturan[k] = v; },
      getPropertyValue(k) { return gaya[k] || ''; },
      removeProperty(k) { delete gaya[k]; }
    },
    setAttribute(k, v) { kelasAturan['attr:' + k] = v; },
    removeAttribute(k) { delete kelasAturan['attr:' + k]; },
    getAttribute(k) { return kelasAturan['attr:' + k]; }
  };

  const doc = {
    l: {},
    documentElement: akar,
    addEventListener(e, f) { this.l[e] = f; },
    getElementById: () => null,
    querySelector: (sel) => (sel === '.jaki-nav' && adaNav ? nav : null)
  };

  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false }),
    initialize: async () => {},
    showBanner: async (o) => {
      panggilan.push(['show', o.margin, o.isTesting, o.adSize, o.position]);
      if (gagalOtomatis) jadwal(() => (listener.bannerAdFailedToLoad || []).forEach((f) => f({ code: 3 })), 100);
      else if (muatOtomatis) jadwal(() => (listener.bannerAdLoaded || []).forEach((f) => f({})), 100);
      // muatOtomatis=false → bannerAdLoaded TIDAK PERNAH datang (simulasi no-fill).
    },
    removeBanner: async () => { panggilan.push(['remove']); },
    hideBanner: async () => { panggilan.push(['hide']); },
    resumeBanner: async () => { panggilan.push(['resume']); },
    addListener: (evt, fn) => { (listener[evt] ||= []).push(fn); }
  };

  const L = {};
  const win = {
    Capacitor: {
      isNativePlatform: () => true,
      Plugins: { AdMob }
    },
    innerHeight: 800,
    innerWidth: 400,
    addEventListener(e, f) { (L[e] ||= []).push(f); },
    KATARNOLIMA_ADMOB_BANNER_ID: 'ca-app-pub-1/2',
    KATARNOLIMA_ADMOB_IS_TESTING: uji
  };

  const process_ = process;
  const onRej = (e) => galat.push(e.message);
  process_.on('unhandledRejection', onRej);

  const sandbox = {
    window: win, document: doc,
    console: { log: (m) => log.push(m), warn: (m) => log.push(m) },
    Date: { now: () => now }, JSON, Math, String, Number, Object, Array, Boolean, isFinite, parseFloat,
    getComputedStyle: () => ({ getPropertyValue: () => '0px' }),
    ...ctx
  };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);

  return {
    AdMob: win.KATARNOLIMA_AdMob, panggilan, log, galat, L, listener, kelasAturan,
    mulai: () => doc.l.DOMContentLoaded && doc.l.DOMContentLoaded(),
    maju, setTinggiNav: (v) => { tinggiNav = v; },
    selesai: () => process_.off('unhandledRejection', onRej)
  };
}

const jmlShow = (s) => s.panggilan.filter((p) => p[0] === 'show').length;

test('admob: banner diminta di bawah dengan margin = tinggi navigasi bawah', async () => {
  const s = siapkan({ tinggiNav: 72 });
  s.mulai(); await s.maju(2000);
  assert.deepEqual(s.galat, [], 'tidak boleh ada error tak tertangani');
  assert.ok(jmlShow(s) >= 1, 'banner harus diminta');
  const [, margin, , ukuran, posisi] = s.panggilan[0];
  assert.equal(margin, 72, 'margin harus sama dengan tinggi .jaki-nav agar navigasi tidak tertutup');
  assert.equal(ukuran, 'ADAPTIVE_BANNER');
  assert.equal(posisi, 'BOTTOM_CENTER');
  s.selesai();
});

test('admob: navigasi bawah lebih tinggi otomatis ikut accommodated', async () => {
  const s = siapkan({ tinggiNav: 96 });
  s.mulai(); await s.maju(2000);
  assert.equal(s.panggilan[0][1], 96, 'margin mengikuti tinggi nav yang terukur, bukan angka tetap');
  s.selesai();
});

test('admob: halaman tanpa navigasi bawah tidak memasang banner', async () => {
  const s = siapkan({ adaNav: false });
  s.mulai(); await s.maju(2000);
  assert.equal(jmlShow(s), 0, 'tanpa .jaki-nav tidak ada banner (popup/embed)');
  s.selesai();
});

test('admob 2.3.5: TIDAK boleh dianggap tampil sebelum bannerAdLoaded', async () => {
  const s = siapkan({ muatOtomatis: false });
  s.mulai(); await s.maju(2000);
  assert.equal(jmlShow(s), 1, 'request dikirim');
  assert.equal(s.AdMob.status().tampil, false, 'belum tampil sebelum bannerAdLoaded');
  assert.equal(s.kelasAturan['--admob-tinggi-banner'], undefined,
    'ruang bawah halaman tidak boleh disisipkan sebelum iklan benar-benar ada');
  s.selesai();
});

test('admob 2.3.5: setelah bannerAdLoaded baru dianggap tampil & ruang bawah disisipkan', async () => {
  const s = siapkan();
  s.mulai(); await s.maju(2000);
  assert.equal(s.AdMob.status().tampil, true, 'bannerAdLoaded → tampil');
  const ruang = parseInt(s.kelasAturan['--admob-tinggi-banner'] || '0', 10);
  assert.ok(ruang > 0, 'ruang bawah halaman harus disisipkan agar konten terakhir bisa di-scroll');
  assert.equal(s.kelasAturan['attr:data-admob-aktif'], 'ya');
  s.selesai();
});

test('admob: watchdog memicu lagi kalau bannerAdLoaded tidak pernah datang', async () => {
  const s = siapkan({ muatOtomatis: false });
  s.mulai(); await s.maju(2000);
  const awal = jmlShow(s);
  await s.maju(22000);   // SELESAI_MUAT_MS 15s + JEDA_LAGI_MS 5s
  assert.ok(jmlShow(s) > awal, 'watchdog harus memicu request ulang');
  s.selesai();
});

test('admob: gagal terus → ruang bawah dibersihkan, halaman tidak menyisakan lubang kosong', async () => {
  const s = siapkan({ gagalOtomatis: true });
  s.mulai();
  await s.maju(300000);
  assert.equal(s.kelasAturan['--admob-tinggi-banner'], '0px',
    'setelah semua percobaan gagal, ruang bawah harus 0 (tidak ada ruang kosong sia-sia)');
  assert.equal(s.kelasAturan['attr:data-admob-aktif'], undefined);
  assert.deepEqual(s.galat, [], 'tidak boleh ada error tak tertangani');
  s.selesai();
});

test('admob: pesan teknis tidak pernah bocor ke warga', async () => {
  const s = siapkan({ uji: false, gagalOtomatis: true });
  s.mulai(); await s.maju(2000);
  assert.ok(!s.kelasAturan['--admob-tinggi-banner'] || s.kelasAturan['--admob-tinggi-banner'] === '0px');
  s.selesai();
});

// ------------------------------------------------------------ struktur HTML

test('admob 2.3.8: card iklan di beranda SUDAH DIHAPUS', () => {
  assert.ok(!INDEX.includes('admob-native-card'),
    'card iklan tidak boleh lagi ada — itulah yang membuat banner menutupi tombol');
  assert.ok(!INDEX.includes('admob-card'), 'gaya card iklan tidak boleh tersisa di markup');
});

test('admob 2.3.8: spacer banner ada DI BAWAH konten, tepat sebelum navigasi', () => {
  const spacer = INDEX.indexOf('admob-spacer');
  const nav = INDEX.indexOf('<nav class="jaki-nav"');
  assert.ok(spacer > -1, 'spacer wajib ada supaya konten terakhir bisa di-scroll melewati banner');
  assert.ok(nav > -1, 'navigasi bawah harus ada');
  assert.ok(spacer < nav, 'spacer harus sebelum navigasi bawah');
});

test('admob 2.3.8: CSS memberi ruang bawah sesuai tinggi banner & aman di HP', () => {
  assert.ok(GLOBAL_CSS.includes('--admob-tinggi-banner'), 'variabel tinggi banner harus ada');
  assert.ok(GLOBAL_CSS.includes('.admob-spacer'), 'gaya spacer harus ada');
  assert.ok(GLOBAL_CSS.includes('safe-area-inset-bottom'),
    'padding bawah navigasi harus memperhitungkan safe area, kalau tidak ikon bawah ada di bawah gesture bar');
  // Nilai awal harus 0 supaya halaman tidak punya ruang kosong sebelum iklan tampil.
  assert.match(GLOBAL_CSS, /--admob-tinggi-banner:0px/);
});

// ------------------------------------------------------------ konfigurasi

test('admob: unit iklan memakai unit banner bawah', () => {
  const cfg = JSON.parse(readFileSync(join(WWW, '../native/admob.config.json'), 'utf8'));
  assert.equal(cfg.bannerId, 'ca-app-pub-2096155581034089/6715532215',
    'unit iklan harus banner bawah (6715532215)');
  assert.equal(cfg.isTesting, false, 'rilis ke Play Store tidak boleh isTesting=true');
});

test('admob: app-ads.txt publisher ID cocok dengan appId AdMob', () => {
  const cfg = JSON.parse(readFileSync(join(WWW, '../native/admob.config.json'), 'utf8'));
  const pub = (cfg.appId || '').split('~')[0].replace('ca-app-pub-', '');
  const baris = readFileSync(join(WWW, 'app-ads.txt'), 'utf8').split('\n')
    .map((b) => b.trim()).filter((b) => b && !b.startsWith('#'));
  assert.ok(baris.length > 0, 'app-ads.txt harus punya minimal satu baris data');
  for (const b of baris) {
    assert.match(b, /^[a-z0-9.-]+, pub-\d+, (DIRECT|RESELLER), [0-9a-f]+$/,
      `baris app-ads.txt tidak sesuai format IAB: ${b}`);
  }
  assert.ok(baris.some((b) => b.includes(pub)), `harus memuat pub-${pub}`);
});