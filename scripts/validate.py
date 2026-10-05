#!/usr/bin/env python3
"""
Validasi struktur proyek KATARNOLIMA — jalankan sebelum commit:

    python3 scripts/validate.py

Yang diperiksa:
  1. Semua href/src/import lokal di HTML & JS menunjuk ke file yang ada
  2. Tidak ada <style>/<script> inline yang tertinggal di HTML
  3. Sintaks setiap file JS valid (butuh Node.js; dilewati bila tidak ada)
  4. Konfigurasi Firebase tidak diduplikasi di luar services/firebase.js
  5. Halaman modul wajib mengimpor pembescape dari core/safe.js (anti injeksi HTML)
Keluar dengan kode 1 bila ada masalah (cocok untuk CI).
"""
import re, shutil, subprocess, sys, tempfile
from pathlib import Path

WWW = Path(__file__).resolve().parent.parent / 'www'
errors, warnings = [], []

# Catatan 2026-10-06: daftar KNOWN_BROKEN dihapus. Dua rujukan yang dulu rusak
# (aktivitas.html di aduan-warga.html dan qris-rw05.jpg di iuran-warga.html)
# sudah diperbaiki di 2.2.0, jadi validate sekarang 0 error / 0 peringatan.
# Kalau salah satunya muncul lagi, itu error — bukan peringatan.

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
    # 5. halaman modul yang menempelkan data dinamis ke innerHTML wajib memakai
    #    pembescape dari core/safe.js. Template yang sepenuhnya statis (tanpa
    #    interpolasi ${...}) tidak wajib — isinya bukan data pengguna.
    #    *.ui.js dikecualikan: skrip UI klasik dimuat sebagai <script> biasa sehingga
    #    tidak bisa mengimpor modul ES; isinya juga bukan data Firestore.
    is_ui = js.name.endswith('.ui.js')
    if not is_ui and js.parent.name == 'pages' and 'innerHTML' in text and 'core/safe.js' not in text:
        for pos in [m.end() for m in re.finditer(r'innerHTML', text)]:
            chunk = text[pos:pos + 800]
            if '${' in chunk.split(';')[0] or re.search(r'`[^`]*\$\{', chunk):
                errors.append(
                    f'{rel(js)}: menempel data dinamis ke innerHTML tanpa mengimpor '
                    'core/safe.js — data Firestore bisa masuk apa adanya (lihat docs/KEAMANAN.md)')
                break

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
