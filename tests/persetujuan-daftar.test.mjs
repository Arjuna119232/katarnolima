// Regresi persetujuan wajib saat pendaftaran + halaman legal.
//
// Permintaan warga: "buat kebijakan privasi dan halaman syarat dan ketentuan,
// taruh di saat daftar akun baru di atas card daftar akun dan kasih kolom harus
// di centang supaya bisa lanjut login akun baru".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WWW = new URL('../www/', import.meta.url).pathname;
const profil = readFileSync(join(WWW, 'pages/profil.html'), 'utf8');
const profilJs = readFileSync(join(WWW, 'assets/js/pages/profil.js'), 'utf8');
const privasi = readFileSync(join(WWW, 'pages/kebijakan-privasi.html'), 'utf8');
const syarat = readFileSync(join(WWW, 'pages/syarat-ketentuan.html'), 'utf8');

test('halaman legal: kebijakan privasi & syarat ketentuan sama-sama ada', () => {
  assert.ok(existsSync(join(WWW, 'pages/kebijakan-privasi.html')));
  assert.ok(existsSync(join(WWW, 'pages/syarat-ketentuan.html')));
  for (const [nama, teks] of [['privasi', privasi], ['syarat', syarat]]) {
    assert.ok(teks.includes('KATARNOLIMA RW 05'), `${nama}: judul aplikasi harus disebut`);
    assert.ok(teks.includes('com.katarnolima.rw05'), `${nama}: nama paket harus disebut (waibil Google Play)`);
    assert.ok(teks.includes('base/legal.css'), `${nama}: harus memakai CSS legal bersama`);
    assert.ok(!/<style[\s>]/.test(teks), `${nama}: tidak boleh ada <style> inline`);
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(teks), `${nama}: tidak boleh ada <script> inline`);
  }
});

test('halaman legal: isi dasar benar-benar ada, bukan halaman kosong', () => {
  for (const [nama, teks] of [['privasi', privasi], ['syarat', syarat]]) {
    const h2 = (teks.match(/<h2>/g) || []).length;
    assert.ok(h2 >= 8, `${nama}: minimal 8 bagian, ada ${h2}`);
    assert.ok(teks.includes('<ul>'), `${nama}: perlu daftar poin yang mudah dibaca`);
  }
  // Pokok yang wajib ada untuk Google Play.
  assert.ok(privasi.includes('Firebase'), 'privasi: harus menyebut penyedia data (Firebase)');
  assert.ok(privasi.includes('AdMob'), 'privasi: harus menyebut jaringan iklan');
  assert.ok(privasi.includes('Hapus Akun'), 'privasi: harus menjelaskan cara menghapus akun');
  assert.ok(syarat.includes('Pengurus'), 'syarat: harus menjelaskan peran pengelola');
});

test('privacy policy dan syarat saling tertaut', () => {
  assert.ok(syarat.includes('kebijakan-privasi.html'), 'syarat harus menaut ke kebijakan privasi');
  assert.ok(privasi.includes('syarat-ketentuan.html'), 'privasi harus menaut ke syarat & ketentuan');
});

test('daftar akun: blok persetujuan ada DI ATAS kolom isian', () => {
  const blokPersetujuan = profil.indexOf('daftar-persetujuan');
  const kolomNama = profil.indexOf('id="inputNamaDaftar"');
  assert.ok(blokPersetujuan > -1, 'blok persetujuan harus ada di halaman daftar');
  assert.ok(kolomNama > -1, 'kolom nama harus ada');
  assert.ok(blokPersetujuan < kolomNama,
    'blok persetujuan harus DI ATAS kolom isian, bukan di bawahnya');
});

test('daftar akun: dua tautan dokumen ikut tampil sebelum kolom isian', () => {
  const sebelum = profil.slice(profil.indexOf('daftar-persetujuan'), profil.indexOf('id="inputNamaDaftar"'));
  assert.ok(sebelum.includes('kebijakan-privasi.html'), 'tautan Kebijakan Privasi harus muncul');
  assert.ok(sebelum.includes('syarat-ketentuan.html'), 'tautan Syarat & Ketentuan harus muncul');
});

test('daftar akun: dua kotak centang, keduanya wajib', () => {
  assert.ok(profil.includes('id="setujuPrivasi"'), 'kotak centang Kebijakan Privasi');
  assert.ok(profil.includes('id="setujuKetentuan"'), 'kotak centang Syarat & Ketentuan');
  assert.equal((profil.match(/type="checkbox"/g) || []).length, 2,
    'tepat dua kotak centang di halaman daftar');
});

test('daftar akun: tombol Daftar mulai dalam keadaan terkunci', () => {
  const btn = profil.match(/<button[^>]*id="btnDaftar"[^>]*>/);
  assert.ok(btn, 'tombol Daftar harus ada');
  assert.ok(/disabled/.test(btn[0]),
    'tombol harus punya atribut disabled sejak awal — jangan hanya disables lewat JS');
});

test('daftar akun: logika mensyaratkan KEDUA centang, bukan salah satu', () => {
  assert.ok(/chkPrivasi\.checked\s*&&\s*chkKetentuan\.checked/.test(profilJs),
    'persetujuan hanya dianggap lengkap kalau kedua kotak dicentang');
  assert.ok(/btnDaftar\.disabled\s*=\s*!lengkap/.test(profilJs),
    'tombol harus mengikuti status persetujuan');
  // Penjaga kedua di dalam handler: tombol yang aktif tanpa persetujuan tetap ditolak.
  assert.ok(/if\s*\(\s*!persetujuanLengkap\(\)\s*\)/.test(profilJs),
    'handler pendaftaran wajib memeriksa persetujuan ulang, jangan hanya mengandalkan disabled');
});

test('daftar akun: tidak ada TDZ — btnDaftar dideklarasi sebelum dipakai', () => {
  const deklarasi = profilJs.indexOf("const btnDaftar = document.getElementById('btnDaftar')");
  const pemakaianAwal = profilJs.indexOf('segarkanTombolDaftar();');
  assert.ok(deklarasi > -1, 'btnDaftar harus dideklarasi');
  assert.ok(pemakaianAwal > -1, 'segarkanTombolDaftar harus dipanggil');
  assert.ok(deklarasi < pemakaianAwal,
    'btnDaftar harus dideklarasi SEBELUM segarkanTombolDaftar() dipanggil; '
    + 'kalau tidak, ReferenceError (TDZ) mematikan seluruh halaman termasuk login');
});

test('daftar akun: catatan untuk warga berubah setelah dicentang', () => {
  assert.ok(profilJs.includes('data-lengkap'), 'status persetujuan harus dicerminkan lewat atribut');
  assert.ok(profil.includes('daftarCatatanPersetujuan'), 'harus ada elemen catatan untuk warga');
});