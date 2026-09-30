#!/usr/bin/env python3
"""
Validasi struktur proyek KATARNOLIMA — jalankan sebelum commit:

    python3 scripts/validate.py

Yang diperiksa:
  1. Semua href/src/import lokal di HTML & JS menunjuk ke file yang ada
  2. Tidak ada <style>/<script> inline yang tertinggal di HTML
  3. Sintaks setiap file JS valid (butuh Node.js; dilewati bila tidak ada)
  4. Konfigurasi Firebase tidak diduplikasi di luar services/firebase.js
Keluar dengan kode 1 bila ada masalah (cocok untuk CI).
"""
import re, shutil, subprocess, sys, tempfile
from pathlib import Path

WWW = Path(__file__).resolve().parent.parent / 'www'
errors, warnings = [], []

# Rujukan rusak yang SUDAH ADA sejak versi 2.1.247 dan belum diputuskan solusinya
# (lihat docs/MASALAH-DIKETAHUI.md). Hapus baris dari sini setelah diperbaiki.
KNOWN_BROKEN = {
    ('pages/aduan-warga.html', 'aktivitas.html'),
    ('pages/iuran-warga.html', '../assets/img/qris-rw05.jpg'),
}

def rel(p):
    return p.relative_to(WWW.parent)

# 1 + 2. HTML
ref_re = re.compile(r'''(?:href|src)=["']([^"'#?]+)''')
for html in sorted(WWW.rglob('*.html')):
    text = html.read_text(encoding='utf-8')
    for m in ref_re.finditer(text):
        ref = m.group(1)
        if re.match(r'^(https?:|//|data:|mailto:|tel:|javascript:|\$\{|#)', ref) or '${' in ref or ref in ('', '#'):
            continue
        if not (html.parent / ref).resolve().exists():
            if (html.relative_to(WWW).as_posix(), ref) in KNOWN_BROKEN:
                warnings.append(f'{rel(html)}: rujukan rusak (sudah diketahui) → {ref}')
            else:
                errors.append(f'{rel(html)}: rujukan rusak → {ref}')
    if re.search(r'<style[\s>]', text):
        warnings.append(f'{rel(html)}: masih ada <style> inline')
    if re.search(r'<script(?![^>]*\bsrc=)[^>]*>\s*\S', text):
        warnings.append(f'{rel(html)}: masih ada <script> inline')

# 1b. import relatif di JS
imp_re = re.compile(r'''(?:from\s+|import\s*\(\s*)["'](\.{1,2}/[^"']+)["']''')
for js in sorted(WWW.rglob('*.js')):
    text = js.read_text(encoding='utf-8')
    for m in imp_re.finditer(text):
        if not (js.parent / m.group(1)).resolve().exists():
            errors.append(f'{rel(js)}: import rusak → {m.group(1)}')
    # 4. konfigurasi Firebase ganda
    if 'apiKey:' in text and js.name != 'firebase.js':
        errors.append(f'{rel(js)}: konfigurasi Firebase terduplikasi (pakai services/firebase.js)')

# 3. sintaks JS
node = shutil.which('node')
if node:
    with tempfile.TemporaryDirectory() as tmp:
        for js in sorted(WWW.rglob('*.js')):
            text = js.read_text(encoding='utf-8')
            is_module = bool(re.search(r'^\s*(import|export)\s', text, re.M)) or 'await import(' in text
            tmpf = Path(tmp) / (js.stem.replace('.', '_') + ('.mjs' if is_module else '.js'))
            tmpf.write_text(text, encoding='utf-8')
            r = subprocess.run([node, '--check', str(tmpf)], capture_output=True, text=True)
            if r.returncode != 0:
                errors.append(f'{rel(js)}: sintaks JS tidak valid\n    ' + r.stderr.strip().splitlines()[0:4].__str__())
else:
    warnings.append('Node.js tidak ditemukan — pemeriksaan sintaks JS dilewati')

for w in warnings:
    print('⚠️ ', w)
for e in errors:
    print('❌', e)
print(f'\nSelesai: {len(errors)} error, {len(warnings)} peringatan.')
sys.exit(1 if errors else 0)
