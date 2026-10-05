// Regression test: halaman warga juga harus menyaring data Firestore sebelum masuk ke innerHTML.
// Aman dari injeksi HTML (bug #10 di docs/MASALAH-DIKETAHUI.md): data dari Firestore
// bisa menyisipkan markup aktif yang jalan di WebView — dan WebView punya izin kamera/lokasi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom, fakeSnapshot } from './helpers/fake-dom.mjs';

// Impor ulang modul dengan ?v=1 supaya setiap tes mengevaluasi ulang berkasnya
// (Node meng-cache modul, sedangkan tiap tes butuh DOM & listener yang baru).
let v = 0;
const muat = (nama) => import(`../www/assets/js/pages/${nama}.js?v=${++v}`);

const PAYLOAD = '<img src=x onerror="alert(1)">';
const PAYLOAD_TITLE = `Judul ${PAYLOAD} "onmouseover="alert(2)`;
const PAYLOAD_TERESCAPE = '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;';

// Data dari Firestore wajib masuk HTML dalam bentuk ter-escape: payload mentah
// tidak boleh muncul, dan tag yang dibuat payload harus hilang total.
function takAktif(html) {
  assert.doesNotMatch(html, /<script[\s>]/i, 'tag <script tidak boleh muncul dari data');
  assert.ok(!html.includes(PAYLOAD), 'payload mentah bocor ke HTML — escapeHtml belum dipakai');
  assert.ok(!html.includes(PAYLOAD_TITLE), 'judul berisi payload bocor apa adanya');
  assert.ok(html.includes(PAYLOAD_TERESCAPE), 'payload harus tampil dalam bentuk ter-escape');
}

test('halaman berita: data Firestore yang jahat tidak menjadi markup aktif', async () => {
  const { get } = installFakeDom();
  // Stub Firebase di-cache oleh Node, jadi jangan buat objek baru —
  // cukup kosongkan arraynya supaya listener tes ini yang tercatat.
  (globalThis.__fb ??= { snapshots: [], writes: [] }).snapshots.length = 0;

  await muat('berita-rw');
  document.dispatch('DOMContentLoaded');

  const snap = globalThis.__fb.snapshots.find(s => s.target?.q?.[0]?.col === 'berita_rw05');
  assert.ok(snap, 'berita-rw.js harus memasang listener realtime di koleksi berita_rw05');

  snap.cb(fakeSnapshot([{
    id: 'b1',
    judul: PAYLOAD_TITLE,
    isi: PAYLOAD,
    penulis: PAYLOAD,
    kategoriLabel: PAYLOAD,
    ikon: PAYLOAD,
    tanggal: PAYLOAD,
    fotoBase64: PAYLOAD,
  }]));

  const html = get('listBeritaRealtime').innerHTML;
  takAktif(html);
  // safeUrl() harus menolak fotoBase64 berisi payload → thumbnail tidak dirender.
  assert.ok(!html.includes('<img'), 'URL foto dari Firestore harus lewat safeUrl()');
});

test('halaman info: ikon, tanggal, dan id yang jahat tidak menjadi markup aktif', async () => {
  const { get } = installFakeDom();
  // Stub Firebase di-cache oleh Node, jadi jangan buat objek baru —
  // cukup kosongkan arraynya supaya listener tes ini yang tercatat.
  (globalThis.__fb ??= { snapshots: [], writes: [] }).snapshots.length = 0;

  await muat('info');

  const snap = globalThis.__fb.snapshots.find(s => s.target?.q?.[0]?.col === 'info_singkat');
  assert.ok(snap, 'info.js harus memasang listener realtime di koleksi info_singkat');

  snap.cb(fakeSnapshot([{
    id: PAYLOAD,
    judul: PAYLOAD_TITLE,
    isi: PAYLOAD,
    ikon: PAYLOAD,
    tanggal: PAYLOAD,
  }]));

  const html = get('notifList').innerHTML;
  takAktif(html);
});

test('halaman diskusi: nama & avatar warga yang jahat tidak menjadi markup aktif', async () => {
  const { get } = installFakeDom();
  // Stub Firebase di-cache oleh Node, jadi jangan buat objek baru —
  // cukup kosongkan arraynya supaya listener tes ini yang tercatat.
  (globalThis.__fb ??= { snapshots: [], writes: [] }).snapshots.length = 0;

  await muat('diskusi-rw');

  const snap = globalThis.__fb.snapshots.find(s => s.target?.q?.[0]?.col === 'diskusi_rw05');
  assert.ok(snap, 'diskusi-rw.js harus memasang listener realtime di koleksi diskusi_rw05');

  snap.cb(fakeSnapshot([{ id: 'd1', userName: PAYLOAD_TITLE, text: PAYLOAD, userAvatar: PAYLOAD }]));

  const html = get('chatArea').innerHTML;
  takAktif(html);
});

test('semua halaman warga memakai pembescape dari core/safe.js', async () => {
  const { readFile } = await import('node:fs/promises');
  const halaman = ['berita-rw', 'info', 'diskusi-rw', 'detail-berita', 'home',
                   'aduan-warga', 'kas-detail', 'semua-layanan'];
  for (const name of halaman) {
    const src = await readFile(new URL(`../www/assets/js/pages/${name}.js`, import.meta.url), 'utf8');
    assert.match(src, /from "\.\.\/core\/safe\.js"/, `${name}.js harus mengimpor escapeHtml dari core/safe.js`);
    assert.doesNotMatch(src, /function escapeHtml/, `${name}.js tidak boleh mendefinisikan escapeHtml sendiri — pakai core/safe.js`);
  }
});