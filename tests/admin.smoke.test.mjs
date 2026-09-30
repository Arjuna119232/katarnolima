// Uji asap panel admin: memuat main.js dengan Firebase & DOM tiruan, lalu menjalankan
// semua fitur, semua callback data, semua form, dan semua handler window.* agar
// kesalahan seperti ReferenceError / impor hilang / salah ketik langsung terlihat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers/fake-dom.mjs';

const dom = installFakeDom();
const fb = (globalThis.__fb = { snapshots: [], writes: [] });
const modals = [];

await import('../www/assets/js/pages/admin/main.js');
window.showModal = (opts) => modals.push(opts); // tangkap dialog; dipanggil saat runtime

const fakeDoc = (id, data) => ({ id, data: () => data });
const richData = {
  judul: 'Judul', isi: 'Isi', nama: 'Warga', rt: '01', email: 'a@b.c', harga: 1000, satuan: 'Kg', pasar: 'Pasar',
  jenis: 'masuk', jumlah: 5000, keterangan: 'ket', nik: '123', bulan: 'Januari', nominal: 20000, buktiUrl: 'x.jpg',
  userName: 'U', text: 'komentar', deskripsi: 'desc', lat: -6.2, lng: 106.8, versi: '1.0', linkDownload: 'http://x',
  catatan: 'c', isAktif: true, createdAt: { toDate: () => new Date('2026-09-30T00:44:00Z') }, fotoBase64: 'data:image/jpeg;base64,AA',
};

test('memulai semua fitur saat admin login, tanpa error', () => {
  assert.equal(typeof fb.authCb, 'function', 'onAuthStateChanged harus terdaftar');
  fb.authCb({ email: 'admin@x.id', uid: 'u1' });
  assert.ok(fb.snapshots.length >= 15, `hanya ${fb.snapshots.length} listener terdaftar`);
});

test('init kedua tidak menggandakan listener', () => {
  const before = fb.snapshots.length;
  fb.authCb({ email: 'admin@x.id', uid: 'u1' });
  assert.equal(fb.snapshots.length, before);
});

test('setiap callback data merender tanpa error', () => {
  for (const { cb } of fb.snapshots) {
    cb({ size: 1, forEach: (fn) => fn(fakeDoc('id1', richData)), exists: () => true, data: () => richData });
    cb({ size: 0, forEach: () => {}, exists: () => false, data: () => ({}) });
  }
  const rendered = [...dom.els.values()].filter((e) => /^list/.test(e.id) && e.innerHTML.length > 0);
  assert.ok(rendered.length >= 10, `hanya ${rendered.length} daftar yang terisi`);
});

const gagal = () => modals.filter((m) => m.icon === '❌').map((m) => m.desc);

test('setiap form submit berjalan tanpa error', async () => {
  modals.length = 0;
  for (const el of dom.els.values()) {
    for (const fn of el.listeners.submit ?? []) {
      await fn({ preventDefault() {}, target: el });
    }
  }
  assert.ok(fb.writes.length > 0, 'harus ada penulisan ke Firestore');
  assert.deepEqual(gagal(), [], 'ada form yang gagal (ReferenceError tertelan try/catch?)');
});

test('semua handler window.* berjalan (termasuk konfirmasi ya)', async () => {
  const calls = {
    resetSaldoKas: [], hapusPushUpdate: [], pushUlangUpdate: [{ versi: '1', linkDownload: 'l', catatan: 'c' }],
    hapusRiwayatUpdate: ['i'], hapusSembako: ['i'], hapusKeamanan: ['i'], hapusLingkungan: ['i'],
    hapusPosyandu: ['i'], hapusKegiatan: ['i'], hapusTransaksiKas: ['i', 'masuk', 1000], previewBuktiIuran: ['x.jpg'],
    hapusIuranWarga: ['i'], hapusDiskusiAdmin: ['i'], hapusInfoSingkat: ['i'], editBerita: ['i'], hapusBerita: ['i'],
    updateStatusAduan: ['i', 'Selesai'], hapusAduanAdmin: ['i', 'https://firebasestorage.googleapis.com/x', true],
    hapusWarga: ['i'], pilihIkon: [null, '🔔'], resetIkonInfo: [], salinGPS: [''], switchTab: ['dashboard'], closeModal: ['m'],
  };
  for (const [name, args] of Object.entries(calls)) {
    assert.equal(typeof window[name], 'function', `window.${name} tidak terdefinisi`);
    modals.length = 0;
    await window[name](...args);
    for (const m of [...modals]) if (m.type === 'confirm' && m.onYes) await m.onYes();
    assert.deepEqual(gagal(), [], `window.${name} menampilkan dialog gagal`);
  }
});

test('XSS: data jahat dari Firestore tidak menjadi markup aktif di daftar admin', () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const evilData = {
    ...richData, judul: evil, nama: evil, keterangan: evil, isi: evil, userName: evil, text: evil, deskripsi: evil,
    jadwal: evil, lokasi: evil, phone: evil, himbauan: evil, pasar: evil, satuan: evil, email: evil, nik: evil, bulan: evil,
    catatan: evil, versi: evil, pj: evil, ikon: evil, tanggal: evil, rt: evil, status: evil,
    lokasiGps: evil, lat: null, lng: null, jenis: `x');alert(3);//`, jumlah: '1);alert(4);//',
    buktiUrl: 'javascript:alert(5)', linkDownload: 'javascript:alert(6)', fotoBase64: 'javascript:alert(7)',
  };
  for (const el of dom.els.values()) if (/^list/.test(el.id)) el.innerHTML = '';
  for (const { cb } of fb.snapshots) {
    cb({ size: 1, forEach: (fn) => fn(fakeDoc('a"b\'c', evilData)), exists: () => true, data: () => evilData });
  }
  const html = [...dom.els.values()].filter((e) => /^list/.test(e.id)).map((e) => e.innerHTML).join('\n');
  assert.ok(html.length > 500, 'daftar harus terisi');
  assert.ok(!/<script/i.test(html), '<script> lolos');
  assert.ok(!/<img src=x onerror/i.test(html), 'tag img jahat lolos');
  assert.ok(!/(href|src)="javascript:/i.test(html), 'URL javascript: lolos');
  assert.ok(!/onclick="[^"]*[^&;\w]'\);alert/.test(html), 'kutip dari data memecah onclick');
});
