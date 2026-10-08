// Penjaga tampilan Kamera Lapor (2.3.10).
//
// Permintaan warga: "ubah tampilan halaman jika user klik lapor ikon kamera,
// tampilannya terbaik, modern dan profesional".
//
// Yang dijaga file ini:
//  1. Semua id & handler yang dipakai home.ui.js MASIH ADA. Redesign tampilan
//     tidak boleh memutus fungsi: begitu satu id hilang, tombolnya diam saja.
//  2. Bingkai bidik tidak menutupi bar kendali di bawah.
//  3. Tidak ada CSS/JS inline, dan tap target tetap nyaman.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WWW = new URL('../www/', import.meta.url).pathname;
const index = readFileSync(join(WWW, 'index.html'), 'utf8');
const homeCss = readFileSync(join(WWW, 'assets/css/pages/home.css'), 'utf8');
const homeJs = readFileSync(join(WWW, 'assets/js/pages/home.ui.js'), 'utf8');

// Semua id yang dibaca home.ui.js untuk fitur kamera.
const ID_KAMERA = [
  'cameraOverlay', 'cameraStream', 'cameraCanvas', 'fallbackFileInput',
  'btnToggleFlash', 'btnToggleCamFacing'
];

test('kamera: semua id yang dibaca home.ui.js masih ada di beranda', () => {
  for (const id of ID_KAMERA) {
    assert.ok(index.includes(`id="${id}"`), `id "${id}" hilang — tombolnya akan diam saja`);
  }
});

test('kamera: semua handler yang dipanggil lewat onclick masih ada', () => {
  const perlu = [
    'closeCustomCamera',    // tombol kembali
    'toggleCameraFlash',    // senter
    'capturePhotoFromCamera', // rana
    'triggerFileInputFallback', // galeri
    'toggleCameraFacing'    // ganti kamera
  ];
  for (const fn of perlu) {
    assert.ok(index.includes(`onclick="${fn}()`), `onclick ${fn}() hilang dari markup`);
    assert.ok(homeJs.includes(`function ${fn}`), `fungsi ${fn} tidak ada di home.ui.js`);
  }
});

test('kamera: kelas struktural yang dipakai CSS ada di markup', () => {
  for (const c of ['camera-overlay', 'camera-header', 'camera-viewport-wrap',
    'camera-controls-bar', 'btn-shutter-outer', 'btn-shutter-inner', 'btn-cam-side']) {
    assert.ok(index.includes(c), `kelas "${c}" hilang dari markup`);
    assert.ok(homeCss.includes(`.${c}`), `kelas "${c}" tidak ada di CSS`);
  }
});

test('kamera: bingkai bidik TERBATAS zona aman, tidak menutupi bar kendali', () => {
  // .camera-bidik tidak boleh inset:0 (versi lama = setinggi layar penuh,
  // sudut bawahnya tertutup bar kendali).
  const blok = homeCss.slice(homeCss.indexOf('.camera-bidik {'),
    homeCss.indexOf('.camera-bidik-frame {'));
  assert.ok(!/inset:\s*0/.test(blok),
    '.camera-bidik tidak boleh inset:0 — harus dibatasi bar atas & bawah');
  assert.ok(/top:\s*calc\(/.test(blok) && /bottom:\s*calc\(/.test(blok),
    'zona bidik harus punya batas atas DAN bawah yang memperhitungkan bar kendali');
});

test('kamera: sudut bidik adalah anak bingkai, jadi pasti menempel', () => {
  assert.ok(index.includes('camera-bidik-frame'),
    'bingkai harus punya elemen sendiri');
  assert.ok(index.includes('camera-sudut'), 'sudut bidik harus ada');
  // Sudut memakai top/right/bottom/left absolut relatif ke bingkai, bukan
  // persentase terhadap layar (versi lama selalu meleset dari bingkai).
  for (const s of ['camera-sudut-a', 'camera-sudut-b', 'camera-sudut-c', 'camera-sudut-d']) {
    assert.ok(homeCss.includes(`.${s} {`), `gaya .${s} hilang`);
  }
  assert.ok(/\.camera-sudut-a\s*\{[^}]*top:/.test(homeCss),
    'sudut harus diposisikan relatif ke bingkai (top/left), bukan persen layar');
});

test('kamera: tap target minimal 44px & aman untuk gesture bar', () => {
  assert.ok(/\.cam-glass-btn\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/.test(homeCss),
    'tombol kaca harus minimal 44x44px');
  assert.ok(/\.btn-shutter-outer\s*\{[^}]*width:\s*7\dpx/.test(homeCss),
    'tombol rana harus besar (>=70px) supaya mudah ditekan');
  assert.ok(homeCss.includes('safe-area-inset-bottom'),
    'bar bawah harus memperhitungkan gesture bar');
  assert.ok(homeCss.includes('prefers-reduced-motion'),
    'animasi harus menghormati preferensi pengguna');
});

test('kamera: tidak ada style/script inline di beranda', () => {
  assert.ok(!/<style[\s>]/.test(index), 'tidak boleh ada <style> inline');
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(index), 'tidak boleh ada <script> inline');
});

test('splash 2.3.10: generator memakai gradasian, squircle, dan nama aplikasi', () => {
  const src = readFileSync(join(WWW, '../scripts/generate_splash.py'), 'utf8');
  assert.ok(src.includes('squircle') || src.includes('superellipse'),
    'logo splash harus memakai bentuk squircle (gaya ikon modern)');
  assert.ok(src.includes('KATARNOLIMA'), 'nama aplikasi harus digambar di splash');
  assert.ok(src.includes('vignette'), 'vignette memberi kesan kedalaman');
  assert.ok(src.includes('LATAR_TENGAH') || src.includes('tengah='),
    'gradasian harus punya titik tengah agar tidak terlihat datar');
  // Font bersifat opsional: kalau runner tidak punya font, build tetap jalan.
  assert.ok(src.includes('KANDIDAT_FONT'), 'harus ada daftar kandidat font');
  assert.ok(src.includes('if not ada_font') || src.includes('ada_font'),
    'kegagalan mencari font harus hanya jadi catatan, bukan error build');
});

test('splash: vignette & aura tidak boleh mengalah gelapkan logo', () => {
  const src = readFileSync(join(WWW, '../scripts/generate_splash.py'), 'utf8');
  // Vignette harus berbasis mask ternormalisasi, bukan lingkaran radius absolut
  // (versi lama menggelapkan SELURUH gambar termasuk logo putih di tengah).
  const v = src.slice(src.indexOf('def vignette('), src.indexOf('# --------------------------------------------- bentuk'));
  assert.ok(/kecil\s*=\s*\d+/.test(v) || /Image\.new\('L', \(kecil/.test(v),
    'vignette harus memakai mask kecil yang diperbesar, bukan gambar seukuran layar');
  // Aura digambar dari besar ke kecil supaya pusatnya paling terang.
  const r = src.slice(src.indexOf('def radial('), src.indexOf('def vignette('));
  const iAwal = r.indexOf('rr = c * (0.94');
  const iAkhir = r.indexOf('k ** 1.7');
  assert.ok(iAwal > -1 && iAkhir > -1 && iAwal < iAkhir,
    'aura harus digambar dari lingkaran besar ke kecil (nilai meredup ke terang)');
});