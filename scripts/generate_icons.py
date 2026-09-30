#!/usr/bin/env python3
"""
Membuat ikon launcher Android dari www/assets/img/katar-app-icon.png
untuk semua densitas (mdpi..xxxhdpi). Dijalankan CI setelah `npx cap add android`.

    python3 scripts/generate_icons.py
"""
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'www/assets/img/katar-app-icon.png'
RES = ROOT / 'android/app/src/main/res'
DENSITIES = {'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96,
             'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192}
LOGO_RATIO = 0.65   # ukuran logo relatif terhadap kanvas (ruang aman adaptive icon)

def main():
    if not SRC.exists():
        raise SystemExit(f'Ikon sumber tidak ditemukan: {SRC}')
    # Hapus adaptive icon bawaan Capacitor agar ikon PNG kita yang dipakai
    shutil.rmtree(RES / 'mipmap-anydpi-v26', ignore_errors=True)

    logo = Image.open(SRC).convert('RGBA')
    canvas = Image.new('RGBA', (2048, 2048), (255, 255, 255, 0))
    side = int(2048 * LOGO_RATIO)
    logo.thumbnail((side, side), Image.Resampling.LANCZOS)
    canvas.paste(logo, ((2048 - logo.width) // 2, (2048 - logo.height) // 2), logo)

    for folder, px in DENSITIES.items():
        target = RES / folder
        target.mkdir(parents=True, exist_ok=True)
        icon = canvas.resize((px, px), Image.Resampling.LANCZOS)
        for name in ('ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'):
            icon.save(target / name)
    print('Ikon launcher berhasil dibuat untuk semua densitas.')

if __name__ == '__main__':
    main()
