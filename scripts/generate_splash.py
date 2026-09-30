#!/usr/bin/env python3
"""
Mengganti splash screen NATIVE Android (yang tampil sebelum WebView siap) dengan logo aplikasi.
Dijalankan CI sesudah `npx cap add android` dan generate_icons.py:

    python3 scripts/generate_splash.py

Yang dilakukan:
  1. Semua res/drawable*/splash.png bawaan Capacitor diganti: latar putih + logo di tengah (ukuran tiap berkas dipertahankan).
  2. Membuat res/drawable/splash_icon.png (logo dengan ruang aman berbentuk lingkaran untuk Android 12+).
  3. Bila styles.xml memakai Theme.SplashScreen (Capacitor 7+), menambahkan windowSplashScreenBackground
     dan windowSplashScreenAnimatedIcon ke tema AppTheme.NoActionBarLaunch.
Bagian 3 hanya menambah bila belum ada; bila struktur tidak dikenali, skrip memberi peringatan dan TIDAK menggagalkan build.
Variabel lingkungan ANDROID_RES dapat dipakai untuk menguji di folder lain.
"""
import os, re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'www/assets/img/katar-app-icon.png'
RES = Path(os.environ.get('ANDROID_RES', ROOT / 'android/app/src/main/res'))
BG = (255, 255, 255, 255)
BG_HEX = '#FFFFFF'
LEGACY_RATIO = 0.40   # lebar logo relatif terhadap sisi terpendek layar (splash gambar penuh)
ICON_SIZE = 1152      # 288dp @ xxxhdpi — ukuran ikon splash Android 12+
ICON_RATIO = 0.62     # logo harus muat di lingkaran ±2/3 kanvas

def fit(logo, side):
    img = logo.copy()
    img.thumbnail((side, side), Image.Resampling.LANCZOS)
    return img

def make_legacy(logo, size):
    w, h = size
    canvas = Image.new('RGBA', size, BG)
    mark = fit(logo, int(min(w, h) * LEGACY_RATIO))
    canvas.paste(mark, ((w - mark.width) // 2, (h - mark.height) // 2), mark)
    return canvas.convert('RGB')

def patch_styles():
    styles = RES / 'values/styles.xml'
    if not styles.exists():
        print('PERINGATAN: values/styles.xml tidak ditemukan — tema splash Android 12+ dilewati.')
        return
    xml = styles.read_text(encoding='utf-8')
    m = re.search(r'(<style\s+name="AppTheme\.NoActionBarLaunch"\s+parent="([^"]*)"\s*>)(.*?)(</style>)', xml, re.S)
    if not m:
        print('PERINGATAN: tema AppTheme.NoActionBarLaunch tidak ada — tema splash dilewati.')
        return
    if 'Theme.SplashScreen' not in m.group(2):
        print(f'Catatan: tema launch memakai parent "{m.group(2)}" (bukan Theme.SplashScreen); hanya gambar splash.png yang diganti.')
        return
    body = m.group(3)
    add = ''
    if 'windowSplashScreenBackground' not in body:
        add += f'\n        <item name="windowSplashScreenBackground">{BG_HEX}</item>'
    if 'windowSplashScreenAnimatedIcon' not in body:
        add += '\n        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_icon</item>'
    if add:
        xml = xml[:m.start(3)] + body.rstrip() + add + '\n    ' + xml[m.end(3):]
        styles.write_text(xml, encoding='utf-8')
        print('styles.xml: ikon & latar splash Android 12+ ditambahkan.')
    else:
        print('styles.xml: sudah berisi pengaturan splash.')

def main():
    if not SRC.exists():
        raise SystemExit(f'Ikon sumber tidak ditemukan: {SRC}')
    if not RES.exists():
        raise SystemExit(f'Folder res Android tidak ditemukan: {RES} (jalankan `npx cap add android` dulu)')
    logo = Image.open(SRC).convert('RGBA')

    files = sorted(RES.glob('drawable*/splash.png'))
    for f in files:
        with Image.open(f) as old:
            size = old.size
        make_legacy(logo, size).save(f, optimize=True)
    print(f'{len(files)} berkas splash.png diganti dengan logo aplikasi.')

    icon = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    mark = fit(logo, int(ICON_SIZE * ICON_RATIO))
    icon.paste(mark, ((ICON_SIZE - mark.width) // 2, (ICON_SIZE - mark.height) // 2), mark)
    (RES / 'drawable').mkdir(parents=True, exist_ok=True)
    icon.save(RES / 'drawable/splash_icon.png', optimize=True)
    print('drawable/splash_icon.png dibuat.')

    patch_styles()

if __name__ == '__main__':
    main()
