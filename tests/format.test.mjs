import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateTimeDetailed } from '../www/assets/js/pages/admin/shared/format.js';

test('tanpa nilai → "-"', () => assert.equal(formatDateTimeDetailed(null), '-'));
test('Timestamp Firestore & Date memakai format jam:menit WIB', () => {
  const d = new Date('2026-09-30T00:44:00Z');
  for (const v of [d, { toDate: () => d }, d.getTime()]) {
    assert.match(formatDateTimeDetailed(v), /\d{2}:\d{2} WIB$/);
  }
});

import { escapeHtml, jsArg, safeUrl } from '../www/assets/js/pages/admin/shared/format.js';

test('escapeHtml melarikan karakter berbahaya & aman untuk null', () => {
  assert.equal(escapeHtml(`<img src=x onerror="a()"> & '`), '&lt;img src=x onerror=&quot;a()&quot;&gt; &amp; &#39;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(0), '0');
});

test('jsArg menghasilkan argumen onclick yang tidak bisa keluar dari atribut', () => {
  const out = jsArg(`');alert(1);//"`);
  assert.ok(!/["'<>]/.test(out.replace(/&quot;|&#39;/g, '')), out);
  assert.ok(out.startsWith('&quot;') && out.endsWith('&quot;'));
});

test('safeUrl hanya meloloskan http(s), blob, data gambar/video', () => {
  assert.equal(safeUrl('https://a.b/c.jpg'), 'https://a.b/c.jpg');
  assert.equal(safeUrl('data:image/jpeg;base64,AA'), 'data:image/jpeg;base64,AA');
  for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:1', 'data:text/html,<script>', '//evil.com', '', null]) {
    assert.equal(safeUrl(bad), '', String(bad));
  }
});
