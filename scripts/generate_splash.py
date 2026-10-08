#!/usr/bin/env python3
"""
Mengganti splash screen NATIVE Android (yang tampil sebelum WebView siap) dengan
tampilan premium (2.3.10).

Dijalankan CI sesudah `npx cap add android` dan generate_icons.py:

    python3 scripts/generate_splash.py

Rancangan:
  1. Latar bergradasi NAVY dalam (bukan putih polos) + cahaya lembut berwarna
     merek (amber) di belakang logo + vignette di sudut supaya terasa punya
     kedalaman, bukan bidang datar.
  2. Logo diberi bentuk SQUIRCLE (superellipse, gaya ikon iOS/Android modern)
     dengan garis aksen tipis, bayangan jatuh, dan cahaya yang memelukinya.
  3. Nama aplikasi "KATARNOLIMA" + subjudul "RW 05" digambar di bawah logo.
     Font dicari di beberapa lokasi umum. Kalau TIDAK ada font yang bisa
     ditemukan, teks dilewati dan skrip hanya memberi catatan — hasil splash
     tetap benar, build tidak pernah gagal karena font.
  4. res/drawable/splash_background.xml (shape gradient) dipasang ke
     windowSplashScreenBackground, karena atribut itu hanya menerima satu warna
     solid (gradasi harus lewat drawable).
  5. res/drawable/splash_icon.png untuk ikon splash Android 12+.

Semua langkah bersifat menambal: struktur yang tidak dikenali menghasilkan
peringatan, bukan kegagalan build.
Variabel lingkungan ANDROID_RES dapat dipakai untuk menguji di folder lain.
"""
import os, re
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'www/assets/img/katar-app-icon.png'
RES = Path(os.environ.get('ANDROID_RES', ROOT / 'android/app/src/main/res'))

# Palet (lihat www/assets/css/base/theme.css, .btn-masuk & tombol tengah nav).
LATAR_ATAS = (8, 14, 30)        # #080E1E  navy indigo
LATAR_TENGAH = (13, 30, 54)    # #0D1E36  biru malam
LATAR_BAWAH = (11, 44, 55)     # #0B2C37  teal sangat gelap
CAHAYA = (255, 226, 138, 46)   # cahaya hangat lembut di belakang logo
INKA = (255, 255, 255)
INKA_MUDA = (255, 255, 255)

NAMA = 'KATARNOLIMA'
SUBJUDUL = 'RW 05'

LEGACY_RATIO = 0.36    # lebar logo relatif terhadap sisi terpendek layar
SQUIRCLE_N = 4.6       # eksponen superellipse (4 = kotak, ~5 = iOS squircle)
SQUIRCLE_RADIUS = 0.235  # rasio radius dalam kanvas squircle
ICON_SIZE = 1152       # 288dp @ xxxhdpi — ikon splash Android 12+
ICON_RATIO = 0.66      # logo di dalam kanvas ikon Android 12+

# Lokasi font yang mungkin ada (Ubuntu CI, Termux, Android). Teks dilewati kalau
# tidak ada satu pun yang cocok.
KANDIDAT_FONT = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    '/system/fonts/Roboto-Bold.ttf',
    '/system/fonts/DroidSans-Bold.ttf',
]
KANDIDAT_FONT_REGULER = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/TTF/DejaVuSans.ttf',
    '/system/fonts/Roboto-Regular.ttf',
]


# --------------------------------------------------------------- util warna

def gradien(size, atas, bawah, tengah=None):
    """Gradasi vertikal; opsional titik tengah untuk kesan lebih dalam."""
    w, h = size
    kolom = Image.new('RGB', (1, h))
    px = kolom.load()
    for y in range(h):
        t = y / max(1, h - 1)
        if tengah is not None and t < 0.5:
            u = t / 0.5
            a, b = atas, tengah
        elif tengah is not None:
            u = (t - 0.5) / 0.5
            a, b = tengah, bawah
        else:
            u = t
            a, b = atas, bawah
        px[0, y] = (
            int(a[0] + (b[0] - a[0]) * u),
            int(a[1] + (b[1] - a[1]) * u),
            int(a[2] + (b[2] - a[2]) * u),
        )
    return kolom.resize((w, h), Image.Resampling.BILINEAR)


def radial(size, warna, ss=2):
    """Cahaya radial lembut di belakang logo.

    Aliasing: mask digambar pada kanvas ss-kali lalu diperbesar, jauh lebih
    murah daripada GaussianBlur pada kanvas besar.
    """
    w, h = size
    kecil = 96
    lapis = Image.new('L', (kecil, kecil), 0)
    d = ImageDraw.Draw(lapis)
    c = (kecil - 1) / 2
    # ImageDraw.ellipse MENIMPA, bukan mencampur. Jadi lingkaran harus digambar
    # dari YANG BESAR dulu (nilai redup) lalu makin keciL (nilai terang):
    # bagian tengah terakhir ditimpa paling terang, cincin luar tetap redup.
    # Urutan terbalik menghasilkan halo terbalik: cahaya hanya terang di tepi,
    # yang di layar terbaca sebagai lingkaran gelap mengelilingi logo.
    for i in range(12):
        k = i / 11
        rr = c * (0.94 - k * 0.80)
        d.ellipse((c - rr, c - rr, c + rr, c + rr),
                  fill=int(warna[3] * (k ** 1.7)))
    lapis = lapis.resize((w, h), Image.Resampling.BILINEAR)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(Image.new('RGBA', (w, h), warna[:3] + (255,)), (0, 0), lapis)
    return out


def vignette(size, kekuatan=70):
    """Sudut sedikit lebih gelap supaya pusat terlihat menonjol.

    PENTING: versi lama memakai lingkaran dengan radius dalam piksel absolut,
    jadi radiusnya jauh lebih besar dari gambar dan seluruh kanvas ikut
    tergelap — termasuk logo di tengah (terukur: logo putih #FEFFFFFF menjadi
    #6E6F72, gelap ~56%). Sekarang masanya dinormalisasi dan mask-nya dibuat di
    kanvas kecil lalu diperbesar, sehingga cepat dan hanya sudut yang gelap.
    """
    import math
    w, h = size
    kecil = 64
    topeng = Image.new('L', (kecil, kecil), 0)
    px = topeng.load()
    c = (kecil - 1) / 2
    maks = math.hypot(c, c)
    for y in range(kecil):
        for x in range(kecil):
            d = math.hypot(x - c, y - c) / maks
            # Mulai gelap hanya setelah 45% dari pusat.
            t = (d - 0.45) / 0.55
            t = 0.0 if t < 0 else (1.0 if t > 1 else t)
            px[x, y] = int((t ** 2.0) * kekuatan)
    topeng = topeng.resize((w, h), Image.Resampling.BILINEAR)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(Image.new('RGBA', (w, h), (2, 6, 14, 255)), (0, 0), topeng)
    return out


# ------------------------------------------------------------------- bentuk

def fit(logo, side):
    img = logo.convert('RGBA')
    img.thumbnail((side, side), Image.Resampling.LANCZOS)
    return img


def topeng_squircle(size, n=SQUIRCLE_N, ss=4):
    """Superellipse |x|^n + |y|^n = 1 -> bentuk ikon iOS/Android modern."""
    import math
    besar = size * ss
    topeng = Image.new('L', (besar, besar), 0)
    d = ImageDraw.Draw(topeng)
    c = besar / 2
    titik = 1440
    pts = []
    for i in range(titik):
        th = 2 * math.pi * i / titik
        ct, st = math.cos(th), math.sin(th)
        x = math.copysign(abs(ct) ** (2.0 / n), ct)
        y = math.copysign(abs(st) ** (2.0 / n), st)
        pts.append((c + x * c, c + y * c))
    d.polygon(pts, fill=255)
    return topeng.resize((size, size), Image.Resampling.LANCZOS)


def terapkan_bentuk(img, n=SQUIRCLE_N):
    """Berikan alpha berbentuk squircle pada logo."""
    w, h = img.size
    sisi = max(w, h)
    kanvas = Image.new('RGBA', (sisi, sisi), (0, 0, 0, 0))
    kanvas.paste(img, ((sisi - w) // 2, (sisi - h) // 2))
    topeng = topeng_squircle(sisi, n)
    alpha = ImageChops.multiply(kanvas.split()[3], topeng)
    hasil = kanvas.copy()
    hasil.putalpha(alpha)
    return hasil


def cincin_aksen(sisi, ketebalan, warna=(255, 255, 255, 46)):
    """Garis tipis yang mengikuti tepi squircle."""
    topeng = topeng_squircle(sisi)
    dalam = Image.new('L', topeng.size, 0)
    d = ImageDraw.Draw(dalam)
    d.rectangle((ketebalan, ketebalan,
                 topeng.size[0] - ketebalan, topeng.size[1] - ketebalan), fill=255)
    cincin = ImageChops.subtract(topeng, dalam)
    cincin = cincin.filter(ImageFilter.GaussianBlur(max(1, ketebalan * 0.35)))
    out = Image.new('RGBA', (sisi, sisi), (0, 0, 0, 0))
    out.paste(Image.new('RGBA', (sisi, sisi), warna[:3] + (255,)), (0, 0), cincin)
    return out


def bayangan(img, jarak, blur, alpha=140):
    w, h = img.size
    kanvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    lapis = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    lapis.paste((0, 4, 10, alpha), (0, 0), img.split()[3])
    lapis = lapis.filter(ImageFilter.GaussianBlur(blur))
    kanvas.alpha_composite(lapis, (0, jarak))
    kanvas.alpha_composite(img, (0, 0))
    return kanvas


# --------------------------------------------------------------------- font

def cari_font(daftar, ukuran_px):
    for p in daftar:
        if Path(p).is_file():
            try:
                return ImageFont.truetype(p, ukuran_px)
            except Exception:
                continue
    return None


def teks_berjarak(d, xy, teks, font, fill, jarak):
    """Gambar teks huruf demi huruf dengan jarak tambahan.

    Pillow tidak punya letter-spacing, dan teks nama aplikasi tanpa jarak
    terlihat menyempit/kurang "~premium". Jarak tracking halus Ini yang bikin
    nama produk terbaca lebih mahal.
    """
    x, y = xy
    for ch in teks:
        d.text((x, y), ch, font=font, fill=fill)
        adv = d.textlength(ch, font=font)
        x += adv + jarak
    return x


def teks_splash(ukuran_teks, ukuran_sub):
    """Nama aplikasi + subjudul. None kalau font tidak ditemukan."""
    f1 = cari_font(KANDIDAT_FONT, ukuran_teks)
    f2 = cari_font(KANDIDAT_FONT_REGULER, ukuran_sub)
    if not f1 or not f2:
        return None, False

    probe = ImageDraw.Draw(Image.new('RGBA', (8, 8)))
    jarak1 = max(2, int(ukuran_teks * 0.16))
    jarak2 = max(1, int(ukuran_sub * 0.30))
    lebar1 = sum(probe.textlength(c, font=f1) for c in NAMA) + jarak1 * (len(NAMA) - 1)
    lebar2 = sum(probe.textlength(c, font=f2) for c in SUBJUDUL) + jarak2 * (len(SUBJUDUL) - 1)

    pad = 30
    w = int(max(lebar1, lebar2)) + pad * 2
    tinggi = int(ukuran_teks * 2.9)
    img = Image.new('RGBA', (w, tinggi), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    b1 = probe.textbbox((0, 0), NAMA, font=f1)
    b2 = probe.textbbox((0, 0), SUBJUDUL, font=f2)
    y1 = 10
    y2 = 10 + (b1[3] - b1[1]) + int(ukuran_teks * 0.42)
    teks_berjarak(d, (pad, y1), NAMA, f1, INKA + (255,), jarak1)
    teks_berjarak(d, (pad + 1, y2), SUBJUDUL, f2, (255, 255, 255, 165), jarak2)
    return img, True


# ------------------------------------------------------------------ splash

def make_legacy(logo, size):
    w, h = size
    tengah = LATAR_TENGAH
    canvas = gradien(size, LATAR_ATAS, LATAR_BAWAH, tengah=tengah).convert('RGBA')

    sisi = int(min(w, h) * LEGACY_RATIO)

    # Aura merek di belakang logo (dipasang DITENGAH ke logo — kalau di pojok
    # hasilnya terlihat seperti noda, bukan cahaya).
    g = int(sisi * 2.9)
    aura = radial((g, g), CAHAYA)
    cx, cy = w // 2, int(h * 0.44)
    canvas.alpha_composite(aura, (cx - g // 2, cy - g // 2))

    mark = terapkan_bentuk(fit(logo, sisi))
    cincin = cincin_aksen(max(mark.size), max(2, sisi // 44))
    mark_full = Image.new('RGBA', mark.size, (0, 0, 0, 0))
    mark_full.alpha_composite(mark)
    mark_full.alpha_composite(cincin)

    bay = bayangan(mark_full, jarak=max(3, sisi // 26), blur=max(4, sisi // 16))
    pos = (cx - bay.width // 2, cy - bay.height // 2)
    canvas.alpha_composite(bay, pos)

    # Nama aplikasi di bawah logo.
    ukuran_teks = max(16, int(sisi * 0.20))
    ukuran_sub = max(11, int(sisi * 0.105))
    blok, ada_font = teks_splash(ukuran_teks, ukuran_sub)
    if blok is not None:
        canvas.alpha_composite(
            blok,
            (cx - blok.width // 2, pos[1] + bay.height + int(sisi * 0.26)),
        )

    canvas.alpha_composite(vignette(size))
    return canvas.convert('RGB'), ada_font


def make_icon(logo):
    """Ikon splash Android 12+: logo squircle.

    Sistem hanya menampilkan bagian tengah ±2/3 kanvas, jadi logo dibuat
    proporsional kecil. Bentuk squircle berarti pemotongan lingkaran oleh
    sistem tidak merusak tampilan.
    """
    kanvas = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    mark = terapkan_bentuk(fit(logo, int(ICON_SIZE * ICON_RATIO)))
    kanvas.alpha_composite(mark, ((ICON_SIZE - mark.width) // 2, (ICON_SIZE - mark.height) // 2))
    return kanvas


BACKGROUND_XML = """<?xml version="1.0" encoding="utf-8"?>
<!-- Dijalankan otomatis oleh scripts/generate_splash.py. Jangan diedit manual.
     Latar gradasian untuk splash Android 12+ (windowSplashScreenBackground hanya
     menerima satu warna solid, jadi gradasi harus lewat drawable). -->
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:startColor="#070C17"
        android:centerColor="#0B1B2A"
        android:endColor="#0C2B36"
        android:angle="270"
        android:type="linear" />
</shape>
"""


def tulis_background():
    d = RES / 'drawable'
    d.mkdir(parents=True, exist_ok=True)
    (d / 'splash_background.xml').write_text(BACKGROUND_XML, encoding='utf-8')
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
    ada_font = True
    for f in files:
        with Image.open(f) as old:
            size = old.size
        hasil, ok = make_legacy(logo, size)
        ada_font = ada_font and ok
        hasil.save(f, optimize=True)
    print(f'{len(files)} berkas splash.png diganti: gradasian navy + squircle logo + nama aplikasi.')
    if not ada_font:
        print('Catatan: font tidak ditemukan di runner ini — nama aplikasi dilewati. '
              'Tambahkan satu berkas .ttf ke repo bila ingin teks selalu tampil.')

    (RES / 'drawable').mkdir(parents=True, exist_ok=True)
    make_icon(logo).save(RES / 'drawable/splash_icon.png', optimize=True)
    print('drawable/splash_icon.png dibuat (squircle, aman untuk lingkaran Android 12+).')

    tulis_background()
    patch_styles()


if __name__ == '__main__':
    main()
