#!/usr/bin/env python3
"""
Menyesuaikan proyek Android hasil `npx cap add android` (folder android/ tidak disimpan di Git).

    python3 scripts/patch_android.py firebase
    python3 scripts/patch_android.py activity
    python3 scripts/patch_android.py permissions
    python3 scripts/patch_android.py harden
    python3 scripts/patch_android.py cleanup
    python3 scripts/patch_android.py version <versionName> <versionCode>
    python3 scripts/patch_android.py signing

Semua isi kustomisasi ada di folder native/ — ubah file di sana, bukan di skrip ini.
"""
import re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NATIVE = ROOT / 'native'
ANDROID = ROOT / 'android'
MANIFEST = ANDROID / 'app/src/main/AndroidManifest.xml'
APP_GRADLE = ANDROID / 'app/build.gradle'
PROJECT_GRADLE = ANDROID / 'build.gradle'
PACKAGE_DIR = ANDROID / 'app/src/main/java/com/katarnolima/rw05'

def rel_www(p):
    """Path relatif terhadap root proyek — untuk pesan log."""
    try:
        return p.relative_to(ROOT)
    except ValueError:
        return p

def firebase():
    shutil.copy(NATIVE / 'google-services.json', ANDROID / 'app/google-services.json')
    proj = PROJECT_GRADLE.read_text()
    if 'com.google.gms:google-services' not in proj:
        proj = proj.replace('dependencies {', 'dependencies {\n        classpath "com.google.gms:google-services:4.4.1"', 1)
        PROJECT_GRADLE.write_text(proj)
    app = APP_GRADLE.read_text()
    if 'com.google.gms.google-services' not in app:
        APP_GRADLE.write_text(app.rstrip('\n') + "\napply plugin: 'com.google.gms.google-services'\n")
    print('Firebase (google-services) terpasang.')

def activity():
    PACKAGE_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy(NATIVE / 'MainActivity.java', PACKAGE_DIR / 'MainActivity.java')
    print('MainActivity.java kustom terpasang.')

def permissions():
    manifest = MANIFEST.read_text()
    wanted = [l for l in (NATIVE / 'permissions.xml').read_text().splitlines() if l.strip()]
    def key(line):
        m = re.search(r'android:name="([^"]+)"', line)
        return m.group(1) if m else line
    missing = [l for l in wanted if f'"{key(l)}"' not in manifest]
    if missing:
        manifest = manifest.replace('<application', '\n'.join(missing) + '\n\n    <application', 1)
        MANIFEST.write_text(manifest)
    print(f'{len(missing)} izin/fitur ditambahkan ke manifest.')

def harden():
    """Keraskan <application> di AndroidManifest.xml.

    - allowBackup=false          : data lokal (sesi, cache, berkas unggahan warga) tidak
                                   ikut ter-backup ke Google/cloud device yang mem-pasang APK.
    - usesCleartextTraffic=false:Izinkan hanya HTTPS. Menutup jalan data keluar lewat HTTP.
    - fullBackupContent=false    : adb backup tidak menyalin folder data aplikasi.
    Lihat docs/KEAMANAN.md.
    """
    manifest = MANIFEST.read_text()
    attrs = {
        'android:allowBackup': 'false',
        'android:usesCleartextTraffic': 'false',
        'android:fullBackupContent': 'false',
    }
    changed = []
    for attr, value in attrs.items():
        if re.search(rf'{re.escape(attr)}="[^"]*"', manifest):
            manifest = re.sub(rf'{re.escape(attr)}="[^"]*"', f'{attr}="{value}"', manifest, count=1)
            changed.append(f'{attr}={value}')
        else:
            manifest = re.sub(r'(<application\b)', rf'\1 {attr}="{value}"', manifest, count=1)
            changed.append(f'{attr}={value} (baru)')

    # Backup rules ditiadakan lewat flag di atas, jadi file XML tambahan tidak perlu.
    MANIFEST.write_text(manifest)
    print('✅ Manifest dikeraskan: ' + ', '.join(changed))


# Berkas sisa template Capacitor/Cordova yang tidak dipakai aplikasi tapi tetap
# ikut terkirim di dalam APK. Dihapus agar APK lebih ramping & tidak membocorkan
# detail toolchain ke pengguna.
JUNK_ASSETS = [
    'LICENSE-junit.txt',
    'junit',
    'DebugProbesKt.bin',
    'client_analytics.proto',
    'messaging_event.proto',
    'messaging_event_extension.proto',
]

def cleanup():
    """Hapus aset sisa template yang tidak dipakai (junit, .proto, artefak debug).

    Aset-aset ini BUKAN di folder app, melainkan di dalam modul plugin yang dibuat
    `npx cap add android` (capacitor-android, capacitor-community-admob, dll). Karena
    itu semua folder src/main/assets di bawah android/ ikut diperiksa — bukan hanya
    yang milik :app.
    """
    if not ANDROID.is_dir():
        print('⚠️ folder android/ tidak ada, skip cleanup.')
        return
    removed, diperiksa = [], 0
    for assets in sorted(ANDROID.rglob('src/main/assets')):
        if not assets.is_dir():
            continue
        diperiksa += 1
        for name in JUNK_ASSETS:
            target = assets / name
            if target.is_dir():
                shutil.rmtree(target)
                removed.append(f'{rel_www(target)}/')
            elif target.exists():
                target.unlink()
                removed.append(rel_www(target))
    if removed:
        print('✅ Aset tak terpakai dihapus (' + str(len(removed)) + '):')
        for r in removed:
            print('   -', r)
    else:
        print(f'ℹ️ Tidak ada aset tak terpakai untuk dihapus ({diperiksa} folder aset diperiksa).')


def version(name, code):
    gradle = APP_GRADLE.read_text()
    if 'versionCode' in gradle:
        gradle = re.sub(r'versionCode\s+\d+', f'versionCode {code}', gradle)
        gradle = re.sub(r'versionName\s+"[^"]*"', f'versionName "{name}"', gradle)
    else:
        gradle = gradle.replace('defaultConfig {', f'defaultConfig {{\n        versionCode {code}\n        versionName "{name}"', 1)
    APP_GRADLE.write_text(gradle)
    print(f'Versi diset: {name} (code {code}).')

def signing():
    APP_GRADLE.write_text(APP_GRADLE.read_text() + (NATIVE / 'signing.gradle').read_text())
    shutil.copy(NATIVE / 'proguard-rules.pro', ANDROID / 'app/proguard-rules.pro')
    print('Konfigurasi signing + aturan R8 ditambahkan.')
def admob():
    """Tambahkan meta-data App ID AdMob ke AndroidManifest.xml (DI DALAM <application>).
    App ID dibaca dari native/admob.config.json (satu sumber kebenaran)."""
    import json, re
    config_path = NATIVE / 'admob.config.json'
    if not config_path.exists():
        print('⚠️ native/admob.config.json tidak ditemukan, skip AdMob.')
        return
    config = json.loads(config_path.read_text())
    app_id = config.get('appId', '')
    if not app_id or '3940256099942544' in app_id:
        print('⚠️ App ID AdMob belum diisi di native/admob.config.json, skip.')
        return
    banner_id = config.get('bannerId', '')
    is_testing = bool(config.get('isTesting', False))

    # 0. Satu sumber kebenaran untuk ID banner: tulis ke www/ agar core/admob.js
    #    tidak perlu menulis ID secara manual (dulunya ada 2 ID yang berbeda).
    #    isTesting ikut ditulis supaya mode uji bisa dikendalikan dari satu tempat.
    if banner_id:
        www_admob = ROOT / 'www/assets/js/admob.config.js'
        www_admob.write_text(
            '/* DIHASILKAN OTOMATIS oleh scripts/patch_android.py admob — jangan diedit manual.\n'
            ' * Sumber kebenaran: native/admob.config.json\n'
            ' * isTesting = true memakai iklan DEMO Google (tidak menghasilkan uang).\n'
            ' * Set false hanya setelah kamu yakin tidak akan klik iklanmu sendiri. */\n'
            f'window.KATARNOLIMA_ADMOB_BANNER_ID = "{banner_id}";\n'
            f'window.KATARNOLIMA_ADMOB_IS_TESTING = {"true" if is_testing else "false"};\n',
            encoding='utf-8'
        )
        print(f'✅ Konfigurasi AdMob ditulis ke {rel_www(www_admob)} (isTesting={is_testing})')
    manifest = MANIFEST.read_text()

    # 1. Hapus meta-data AdMob yang salah tempat (di luar <application>)
    manifest = re.sub(
        r'\s*<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[^/]*/>\s*',
        '\n',
        manifest
    )

    # 2. Sisipkan meta-data DI DALAM <application> (setelah tag pembuka)
    meta = f'\n        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="{app_id}"/>'
    
    # Cari tag <application ...> (pembuka) dan sisipkan setelah >
    pattern = r'(<application\b[^>]*>)'
    if re.search(pattern, manifest):
        manifest = re.sub(pattern, r'\1' + meta, manifest, count=1)
        MANIFEST.write_text(manifest)
        print('✅ Meta-data AdMob ditambahkan DI DALAM <application>.')
    else:
        print('❌ Tag <application> tidak ditemukan di manifest.')

    # 3. Verifikasi
    if 'com.google.android.gms.ads.APPLICATION_ID' in manifest:
        # Cek apakah di dalam application
        app_match = re.search(r'<application\b[^>]*>.*?</application>', manifest, re.DOTALL)
        if app_match and 'com.google.android.gms.ads.APPLICATION_ID' in app_match.group(0):
            print('✅ Verifikasi: meta-data berada DI DALAM <application>.')
        else:
            print('⚠️ Verifikasi: meta-data mungkin masih di luar <application>.')


if __name__ == '__main__':
    cmd, args = (sys.argv[1] if len(sys.argv) > 1 else ''), sys.argv[2:]
    actions = {'firebase': firebase, 'activity': activity, 'permissions': permissions,
               'harden': harden, 'cleanup': cleanup,
               'version': lambda: version(*args), 'signing': signing, 'admob': admob}
    if cmd not in actions:
        raise SystemExit(__doc__)
    actions[cmd]()
