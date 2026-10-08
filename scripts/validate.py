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
ROOT = WWW.parent
NATIVE = ROOT / 'native'
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

# 3b. app-ads.txt
# Tanpa file ini AdMob tidak menaruh iklan: banner dipanggil tapi tidak pernah
# berisi kreatif (no fill) — yang dilihat pengguna: "iklan memuat terus". Publisher ID
# harus cocok dengan appId di native/admob.config.json, kalau tidak AdMob
# menganggap inventori ini milik akun lain.
iab_re = re.compile(r'^[a-z0-9.-]+, pub-\d+, (DIRECT|RESELLER), [0-9a-f]+$')
for ads_src in (NATIVE / 'app-ads.txt', WWW / 'app-ads.txt'):
    if not ads_src.is_file():
        errors.append(f'{rel(ads_src)}: tidak ada — AdMob tidak akan menaruh iklan '
                      '(banner akan "memuat" tanpa pernah berisi)')
        continue
    baris = [b.strip() for b in ads_src.read_text(encoding='utf-8').splitlines()
             if b.strip() and not b.strip().startswith('#')]
    if not baris:
        errors.append(f'{rel(ads_src)}: tidak punya baris data (semua baris komentar)')
    for b in baris:
        if not iab_re.match(b):
            errors.append(f'{rel(ads_src)}: baris tidak sesuai format IAB → {b}')

cfg_path = NATIVE / 'admob.config.json'
if cfg_path.is_file() and (NATIVE / 'app-ads.txt').is_file():
    import json
    cfg = json.loads(cfg_path.read_text(encoding='utf-8'))
    pub = (cfg.get('appId', '') or '').split('~')[0].replace('ca-app-pub-', '')
    isi = (NATIVE / 'app-ads.txt').read_text(encoding='utf-8')
    if pub and pub not in isi:
        errors.append(f'native/app-ads.txt: publisher ID harus memuat pub-{pub} '
                      '(dari appId AdMob di native/admob.config.json)')

# 3c. Aturan splash & izin (regresi 2.3.6)
#  - Splash: aplikasi hanya boleh punya splash NATIVE Android. Overlay web
#    #splash-screen membuat dua splash berturut-turut dan menambah ~1 detik.
#  - Izin: core/permissions.js harus terdaftar di halaman yang memakainya, dan
#    READ_MEDIA_IMAGES ('photos') tidak boleh diminta — izin itu dibuang dari
#    manifest, jadi memintaWHMya membuat dialog tidak pernah muncul lagi.
for html in sorted(WWW.rglob('*.html')):
    teks = html.read_text(encoding='utf-8')
    if 'id="splash-screen"' in teks:
        errors.append(f'{rel(html)}: #splash-screen tidak boleh ada — aplikasi sudah punya '
                      'splash native Android; overlay web membuat dua splash')

izin_makai = False
for js in sorted((WWW / 'assets' / 'js').rglob('*.js')):
    if 'KATARNOLIMA_Izin' in js.read_text(encoding='utf-8'):
        izin_makai = True
        break
if izin_makai:
    # Hanya skrip yang benar-benar dimuat halaman itu yang diperiksa.
    src_re = re.compile(r'<script[^>]*\bsrc=["\']([^"\']+)["\']')
    for html in sorted(WWW.rglob('*.html')):
        teks = html.read_text(encoding='utf-8')
        skrip = []
        for s in src_re.findall(teks):
            p = (html.parent / s).resolve()
            if p.is_file():
                skrip.append(p)
        pakai_api = any('KATARNOLIMA_Izin' in p.read_text(encoding='utf-8') for p in skrip)
        if pakai_api and not any(p.name == 'permissions.js' for p in skrip):
            errors.append(f'{rel(html)}: skrip halaman memakai window.KATARNOLIMA_Izin '
                          'tapi core/permissions.js tidak dimuat — pemanggilnya jadi error '
                          'saat warga menekan tombolnya')

for js in sorted((WWW / 'assets' / 'js').rglob('*.js')):
    if re.search(r'requestPermissions\(\s*\{[^}]*photos', js.read_text(encoding='utf-8')):
        errors.append(f'{rel(js)}: meminta izin photos (READ_MEDIA_IMAGES) — izin itu sudah dibuang '
                      'dari manifest sehingga dialog tidak akan pernah muncul lagi')

# 3d. ID AdMob (regresi 2.3.8)
# Dua ID sering tertukar karena bentuknya mirip:
#   App ID  : ca-app-pub-<publisher>~<apps>      (tilde)
#   Unit ID : ca-app-pub-<publisher>/<unit>       (slash)
# Salah pasang = APPLICATION_ID ditolak Android, banner tidak pernah muncul, dan
# tidak ada pesan error yang jelas.
admob_cfg = NATIVE / 'admob.config.json'
if admob_cfg.is_file():
    import json as _json
    _cfg = _json.loads(admob_cfg.read_text(encoding='utf-8'))
    _app = _cfg.get('appId', '') or ''
    _unit = _cfg.get('bannerId', '') or ''
    if not re.fullmatch(r'ca-app-pub-\d+~\d+', _app):
        errors.append(f'native/admob.config.json: appId harus bentuk '
                      f'"ca-app-pub-<publisher>~<apps>", dapat "{_app}" '
                      '(unit ID tidak bisa dipakai sebagai APPLICATION_ID)')
    if not re.fullmatch(r'ca-app-pub-\d+/\d+', _unit):
        errors.append(f'native/admob.config.json: bannerId harus bentuk '
                      f'"ca-app-pub-<publisher>/<unit>", dapat "{_unit}"')
    _ap, _bagi, _unit_app = _app.partition('~')
    if _bagi and '/' in _unit and _unit.split('/')[0] != _ap:
        errors.append(f'native/admob.config.json: appId dan bannerId harus punya '
                      f'publisher yang sama ({_ap} vs {_unit.split("/")[0]})')
    if _cfg.get('isTesting'):
        errors.append('native/admob.config.json: isTesting=true akan ikut terkirim '
                      'ke semua yang memasang APK — hanya untuk build uji di HP sendiri')

for w in warnings:
    print('⚠️ ', w)
for e in errors:
    print('❌', e)
print(f'\nSelesai: {len(errors)} error, {len(warnings)} peringatan.')
sys.exit(1 if errors else 0)
