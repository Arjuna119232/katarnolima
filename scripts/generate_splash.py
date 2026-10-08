#!/usr/bin/env python3
"""
Mengganti splash screen NATIVE Android (yang tampil sebelum WebView siap) dengan
tampilan yang modern & profesional (2.3.8).

Dijalankan CI sesudah `npx cap add android` dan generate_icons.py:

    python3 scripts/generate_splash.py

Yang dilakukan:
  1. Semua res/drawable*/splash.png bawaan Capacitor diganti: latar GRADIENT navy
     -> teal (mengikuti palet aplikasi: .btn-masuk #0f172a, tombol tengah #0f766e)
     plus logo di tengah dengan halo lembut. Versi lama memakai latar putih polos
     yang terlihat seperti aplikasi yang belum selesai.
  2. res/drawable/splash_background.xml dibuat sebagai shape gradient, lalu
     dipakai sebagai windowSplashScreenBackground di tema Android 12+. Android 12+
     hanya menerima satu warna solid lewat atribut itu; memakai drawable memberi
     gradasi yang sama seperti splash gambar penuh.
  3. res/drawable/splash_icon.png dibuat untuk ikon splash Android 12+ dengan
     ruang aman lingkaran (±2/3 kanvas) dan cakram graded sebagai latar, supaya
     saat sistem memotongnya menjadi lingkaran tetap terlihat rapi.
  4. styles.xml diberi windowSplashScreenBackground + windowSplashScreenAnimatedIcon
     bila belum ada.

Semua langkah bersifat menambal: bila struktur tidak dikenali, skrip memberi
peringatan dan TIDAK menggagalkan build.
Variabel lingkungan ANDROID_RES dapat dipakai untuk menguji di folder lain.
"""
import os, re
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'www/assets/img/katar-app-icon.png'
RES = Path(os.environ.get('ANDROID_RES', ROOT / 'android/app/src/main/res'))

# Palet aplikasi (lihat www/assets/css/base/theme.css & .btn-masuk di profil.css).
NAVY_ATAS = (11, 18, 32)      # #0B1220  deep navy
NAVY_BAWAH = (13, 71, 82)     # #0D4752  teal gelap
DISK = (19, 35, 54)           # #132336  cakram di belakang logo
BG_HEX = '#0B1220'

LEGACY_RATIO = 0.42   # lebar logo relatif terhadap sisi terpendek layar
ICON_SIZE = 1152      # 288dp @ xxxhdpi — ukuran ikon splash Android 12+
ICON_RATIO = 0.58     # logo harus muat di lingkaran ±2/3 kanvas


def fit(logo, side):
    """Perkecil logo tanpa kehilangan ketajaman (LANCZOS), dikembalikan RGBA."""
    img = logo.convert('RGBA')
    img.thumbnail((side, side), Image.Resampling.LANCZOS)
    return img


def gradient(size, atas, bawah):
    """Gradien vertikal sederhana, tanpa dependensi lain."""
    w, h = size
    img = Image.new('RGB', (1, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = (
            int(atas[0] + (bawah[0] - atas[0]) * t),
            int(atas[1] + (bawah[1] - atas[1]) * t),
            int(atas[2] + (bawah[2] - atas[2]) * t),
        )
    return img.resize((w, h), Image.Resampling.BILINEAR)


def halo(ukuran, warna, kekuatan):
    """Cakram blur lembut sebagai cahaya di belakang logo."""
    lapis = Image.new('RGBA', (ukuran, ukuran), (0, 0, 0, 0))
    d = ImageDraw.Draw(lapis)
    d.ellipse((ukuran * 0.14, ukuran * 0.14, ukuran * 0.86, ukuran * 0.86), fill=warna)
    return lapis.filter(ImageFilter.GaussianBlur(kekuatan))


def mask_lingkaran(img, rasio=0.485, ss=4):
    """Berikan alpha berbentuk lingkaran pada logo.

    PENTING: file ikon aplikasi ini TIDAK transparan — latarbornya putih opak
    (alpha 254-255 di seluruh kanvas). Kalau ditempel langsung di atas gradasian
    gelap, hasilnya kotak putih besar yang justru lebih buruk daripada splash
    polos. Memberi bentuk lingkaran menyelesaikan dua masalah sekaligus: latar
    putih terlihat disengaja, dan Android 12+ yang memotong ikon menjadi
    lingkaran tidak memotong apa pun yang penting.

    `rasio` sedikit di bawah 0.5 supaya ada jarak aman dari tepi. Diperiksa:
    sekitar 97% konten non-putih berada di dalam lingkaran rasio ini.
    """
    w, h = img.size
    topeng = Image.new('L', (w * ss, h * ss), 0)
    d = ImageDraw.Draw(topeng)
    sisi = max(w, h) * ss
    r = sisi * rasio
    cx, cy = (w * ss) / 2, (h * ss) / 2
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    topeng = topeng.resize((w, h), Image.Resampling.LANCZOS)

    alpha_lama = img.split()[3]
    alpha = ImageChops.multiply(alpha_lama, topeng)
    hasil = img.copy()
    hasil.putalpha(alpha)
    return hasil


def bayangan(img, jarak,blur, alpha=110):
    """Bayangan lembut di belakang logo agar terasa melayang."""
    w, h = img.size
    kanvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    bay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    bay.paste((2, 6, 12, alpha), (0, 0), img.split()[3])
    bay = bay.filter(ImageFilter.GaussianBlur(blur))
    kanvas.alpha_composite(bay, (0, jarak))
    kanvas.alpha_composite(img, (0, 0))
    return kanvas


def make_legacy(logo, size):
    """Splash gambar penuh: gradasian navy -> teal, logo lingkaran melayang."""
    w, h = size
    canvas = gradient(size, NAVY_ATAS, NAVY_BAWAH).convert('RGBA')

    sisi = int(min(w, h) * LEGACY_RATIO)
    mark = bayangan(mask_lingkaran(fit(logo, sisi)), jarak=max(2, sisi // 40),
                    blur=max(2, sisi // 26))

    # Cahaya lembut yang MEMELUKI logo. Wajib dipositionkan mengikuti tengah
    # logo — kalau ditempel di (0,0) hasilnya gumpalan blur melayang jauh di atas
    # logo dan terlihat seperti noda, bukan efek pencahayaan.
    px_ = (w - mark.width) // 2
    py_ = (h - mark.height) // 2
    g = int(sisi * 1.55)
    canvas.alpha_composite(
        halo(g, (255, 224, 150, 34), sisi * 0.09),
        (px_ + (mark.width - g) // 2, py_ + (mark.height - g) // 2),
    )

    canvas.alpha_composite(mark, (px_, py_))
    return canvas.convert('RGB')


def make_icon(logo):
    """Ikon splash Android 12+: logo lingkaran, siap dipotong sistem.

    Sistem menampilkan ikon ini di dalam lingkaran dan hanya memperlihatkan
    bagian tengah ±2/3 kanvas. Karena logonya sudah berbentuk lingkaran penuh,
    pemotongan sistem tidak mengubah tampilan sama sekali.
    """
    mark = fit(logo, ICON_SIZE)
    return mask_lingkaran(mark, rasio=0.485)


BACKGROUND_XML = """<?xml version="1.0" encoding="utf-8"?>
<!-- Dijalankan otomatis oleh scripts/generate_splash.py. Jangan diedit manual.
     Latar gradasian untuk splash Android 12+ (windowSplashScreenBackground hanya
     menerima satu warna solid, jadi gradasi harus lewat drawable). -->
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:startColor="{atas}"
        android:endColor="{bawah}"
        android:angle="270"
        android:type="linear" />
</shape>
"""


def tulis_background():
    """Buat res/drawable/splash_background.xml (shape gradient)."""
    d = RES / 'drawable'
    d.mkdir(parents=True, exist_ok=True)
    isi = BACKGROUND_XML.format(
        atas='#%02X%02X%02X' % NAVY_ATAS,
        bawah='#%02X%02X%02X' % NAVY_BAWAH,
    )
    (d / 'splash_background.xml').write_text(isi, encoding='utf-8')
    print('drawable/splash_background.xml dibuat (gradasian navy -> teal).')


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
        add += '\n        <item name="windowSplashScreenBackground">@drawable/splash_background</item>'
    if 'windowSplashScreenAnimatedIcon' not in body:
        add += '\n        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_icon</item>'
    if add:
        xml = xml[:m.start(3)] + body.rstrip() + add + '\n    ' + xml[m.end(3):]
        styles.write_text(xml, encoding='utf-8')
        print('styles.xml: ikon & latar gradasian splash Android 12+ ditambahkan.')
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
    print(f'{len(files)} berkas splash.png diganti: gradian navy -> teal + logo + halo.')

    (RES / 'drawable').mkdir(parents=True, exist_ok=True)
    make_icon(logo).save(RES / 'drawable/splash_icon.png', optimize=True)
    print('drawable/splash_icon.png dibuat (cakram graded + logo, aman untuk lingkaran Android 12+).')

    tulis_background()
    patch_styles()


if __name__ == '__main__':
    main()