// Setiap window.NAME(...) yang dipanggil dari HTML/template harus didefinisikan di modul admin.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../www/', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const adminJs = walk(join(ROOT, 'assets/js/pages/admin')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
const adminHtml = readFileSync(join(ROOT, 'pages/admin.html'), 'utf8');

test('semua window.fn yang dipanggil punya definisi', () => {
  const called = new Set([...(adminHtml + adminJs).matchAll(/window\.([A-Za-z_]\w*)\(/g)].map((m) => m[1]));
  const defined = new Set([...adminJs.matchAll(/window\.([A-Za-z_]\w*)\s*=/g)].map((m) => m[1]));
  const NATIVE = new Set(['matchMedia']); // API bawaan browser
  const missing = [...called].filter((n) => !defined.has(n) && !NATIVE.has(n));
  assert.deepEqual(missing, []);
});

test('admin.html memuat main.js sebagai modul', () => {
  assert.match(adminHtml, /<script type="module" src="\.\.\/assets\/js\/pages\/admin\/main\.js"><\/script>/);
});
