// Regresi native/MainActivity.java — perbandingan origin WebView.
//
// Bug 2.3.6 (dilaporkan warga): "izin sudah diizinkan tapi kamera dan GPS tidak
// bisa dipakai".
//
// Penyebabnya BUKAN Android. Izin Android memang diberikan, tapi izin di level
// WebView selalu ditolak oleh isOwnOrigin() karena:
//
//   ALLOWED_ORIGINS  = "https://localhost"
//   Uri.toString()   = "https://localhost/"     <- ada garis miring di akhir
//   "https://localhost/".equalsIgnoreCase("https://localhost")  ->  false
//
// Ketiga origin yang benar-benar dipakai Capacitor (capacitor://localhost,
// http://localhost, https://localhost) semuanya berakhiran "/", jadi
// request.deny() berjalan tanpa pesan error sama sekali.
//
// Diuji dengan cara yang sama seperti verifikasi manual: algoritmanya
// ditiru persis di JS dan dicek hasilnya, PLUS dicek bahwa berkas Java-nya
// benar-benar menormalisasi sebelum membandingkan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('../native/MainActivity.java', import.meta.url), 'utf8');

// Salinan persis algoritma isOwnOrigin() versi 2.3.7.
const ALLOWED_ORIGINS = ['capacitor://localhost', 'http://localhost', 'https://localhost'];

function normalisasi(origin) {
  let bersih = origin.trim();
  while (bersih.endsWith('/')) bersih = bersih.slice(0, -1);
  return bersih;
}

function skemaHost(url) {
  const i = url.indexOf('://');
  if (i <= 0) return null;
  const skema = url.slice(0, i);
  let sisa = url.slice(i + 3);
  const j = sisa.indexOf('/');
  if (j >= 0) sisa = sisa.slice(0, j);
  return skema.toLowerCase() + '//' + sisa.toLowerCase();
}

function isOwnOrigin(origin) {
  if (origin === null) return false;
  const bersih = normalisasi(origin);
  for (const allowed of ALLOWED_ORIGINS) {
    if (allowed.toLowerCase() === bersih.toLowerCase()) return true;
    if (skemaHost(bersih) === skemaHost(allowed)) return true;
  }
  return false;
}

// Origin yang BENAR-BENAR dikirim Android WebView ke onPermissionRequest() dan
// onGeolocationPermissionsShowPrompt() — semuanya BERAKHIRAN garis miring.
const ORIGIN_ASLI = [
  'https://localhost/',
  'http://localhost/',
  'capacitor://localhost/'
];

test('MainActivity: origin asli Capacitor WAJIB diizinkan (kasus regressi)', () => {
  for (const o of ORIGIN_ASLI) {
    assert.equal(isOwnOrigin(o), true,
      `origin '${o}' harus diizinkan — inilah yang membuat kamera & GPS gagal sebelum diperbaiki`);
  }
});

test('MainActivity: versi lama benar-benar gagal (bukti akar masalah)', () => {
  const versiLama = (origin) => {
    if (origin === null) return false;
    return ALLOWED_ORIGINS.some((a) => a.toLowerCase() === origin.toLowerCase());
  };
  for (const o of ORIGIN_ASLI) {
    assert.equal(versiLama(o), false,
      `logika lama seharusnya gagal pada '${o}' — kalau lulus, akar masalahnya belum ketemu`);
  }
});

test('MainActivity: tanpa garis miring tetap diizinkan', () => {
  for (const o of ['https://localhost', 'http://localhost', 'capacitor://localhost']) {
    assert.equal(isOwnOrigin(o), true, `origin '${o}' harusnya tetap dikenali`);
  }
});

test('MainActivity: origin dari halaman dalam (punya path) tetap diizinkan', () => {
  assert.equal(isOwnOrigin('https://localhost/index.html'), true);
  assert.equal(isOwnOrigin('https://localhost/pages/aduan-warga.html'), true);
});

test('MainActivity: origin orang lain tetap DITOLAK (keamanan)', () => {
  const asing = [
    'https://situs-hacker.example.com/',
    'http://evil.example.com/',
    'https://localhost.evil.example.com/',   //_domain mirip, bukan domain kita
    'ftp://localhost/',
    'https://notlocalhost/',
    ''
  ];
  for (const o of asing) {
    assert.equal(isOwnOrigin(o), false, `origin '${o}' HARUS ditolak — jangan longgarkan`);
  }
  assert.equal(isOwnOrigin(null), false);
});

test('MainActivity: berkas Java benar-benar menormalisasi sebelum membandingkan', () => {
  // Penjaga supaya perbaikan ini tidak hilang saat file diedit lagi.
  assert.ok(/isOwnOrigin\s*\(String\s+origin\)/.test(SRC), 'isOwnOrigin(String) harus ada');
  assert.ok(SRC.includes('endsWith("/")') || SRC.includes("endsWith(\"/\")"),
    'origin harus dinormalisasi (buang garis miring akhir) sebelum dibandingkan');
  assert.ok(/akuSamaSkemaHost|getScheme\(\)|getHost\(\)/.test(SRC),
    'perbandingan tambahan di level skema + host harus ada');
  assert.ok(SRC.includes('ALLOWED_ORIGINS'),
    'daftar origin yang diizinkan harus tetap dipakai — jangan dihapus saat memperbaiki');
  // Tidak boleh ada perbandingan mentah terhadap origin apa adanya lagi.
  assert.ok(!/allowed\.equalsIgnoreCase\(origin\)/.test(SRC),
    'perbandingan string mentah "allowed.equalsIgnoreCase(origin)" adalah bug yang baru diperbaiki');
});