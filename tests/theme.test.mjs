// Regresi mode malam: token teks harus terbaca di atas latar gelap, dan warna teks tidak
// boleh kembali ditulis sebagai hex (hex tidak ikut berganti saat tema berubah).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WWW = new URL('../www/', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const theme = readFileSync(join(WWW, 'assets/css/base/theme.css'), 'utf8');

const lum = (h) => {
  h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const kontras = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function token(blok) {
  const t = {};
  for (const m of blok.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) t[m[1]] = m[2];
  return t;
}
const gelap = token(theme.slice(theme.indexOf('html[data-theme="dark"]')));
const terang = token(theme.slice(0, theme.indexOf('html[data-theme="dark"]')));

test('theme: token teks berwarna terbaca (>= 4.5:1) di semua latar gelap', () => {
  const latar = ['--surface', '--surface-soft', '--bg-page', '--tint-blue-50', '--tint-green-50', '--tint-amber-50', '--tint-red-50', '--tint-purple-50'];
  for (const t of ['--link', '--success-text', '--on-green', '--on-blue', '--on-red', '--on-pink', '--on-amber', '--on-purple']) {
    assert.ok(gelap[t], `${t} harus punya nilai mode malam`);
    for (const l of latar) assert.ok(kontras(gelap[t], gelap[l]) >= 4.5, `${t} di atas ${l} (malam): ${kontras(gelap[t], gelap[l]).toFixed(1)}:1`);
  }
});

test('theme: tombol solid & teks di atas aksen terbaca di kedua mode', () => {
  for (const [nama, set] of [['terang', terang], ['malam', gelap]]) {
    assert.ok(kontras(set['--btn-solid-bg'], set['--btn-solid-fg']) >= 4.5, `tombol solid (${nama})`);
  }
  assert.ok(kontras('#fbbf24', gelap['--on-accent']) >= 4.5, 'teks di atas kuning aksen');
});

test('theme: transition tidak dipasang ke semua elemen [class]', () => {
  assert.doesNotMatch(theme, /\[class\]\s*\{/);
  assert.match(theme, /color-scheme:\s*dark/);
});

test('theme: warna teks hijau/biru/merah/dst tidak ditulis sebagai hex', () => {
  const dilarang = /(?<![-\w])color\s*:\s*#(2563eb|1d4ed8|1e40af|16a34a|166534|15803d|b91c1c|991b1b|be123c|dc2626|9d174d|be185d|b45309|d97706|0284c7|0369a1|059669|4f46e5|9333ea|db2777|e11d48)\b/i;
  const berkas = [...walk(join(WWW, 'assets')), ...walk(join(WWW, 'pages')), join(WWW, 'index.html')]
    .filter((f) => /\.(css|js|html)$/.test(f) && !f.endsWith('theme.css'));
  const salah = berkas.filter((f) => dilarang.test(readFileSync(f, 'utf8'))).map((f) => f.replace(WWW, ''));
  assert.deepEqual(salah, [], 'pakai var(--link|--on-green|--on-red|…) dari theme.css');
});
