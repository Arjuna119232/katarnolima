#!/usr/bin/env python3
"""
Menyesuaikan proyek Android hasil `npx cap add android` (folder android/ tidak disimpan di Git).

    python3 scripts/patch_android.py firebase
    python3 scripts/patch_android.py activity
    python3 scripts/patch_android.py permissions
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
    print('Konfigurasi signing ditambahkan.')
def admob():
    """Tambahkan meta-data App ID AdMob ke AndroidManifest.xml.
    App ID dibaca dari native/admob.config.json (satu sumber kebenaran)."""
    import json
    config_path = NATIVE / 'admob.config.json'
    if not config_path.exists():
        print('⚠️ native/admob.config.json tidak ditemukan, skip AdMob.')
        return
    config = json.loads(config_path.read_text())
    app_id = config.get('appId', '')
    if not app_id or '3940256099942544' in app_id:
        print('⚠️ App ID AdMob belum diisi di native/admob.config.json, skip.')
        return
    manifest = MANIFEST.read_text()
    meta = f'        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="{app_id}"/>'
    if 'com.google.android.gms.ads.APPLICATION_ID' not in manifest:
        manifest = manifest.replace('<application', meta + '\n\n    <application', 1)
        MANIFEST.write_text(manifest)
        print('✅ Meta-data AdMob ditambahkan ke AndroidManifest.xml.')
    else:
        print('ℹ️ Meta-data AdMob sudah ada (skip).')


if __name__ == '__main__':
    cmd, args = (sys.argv[1] if len(sys.argv) > 1 else ''), sys.argv[2:]
    actions = {'firebase': firebase, 'activity': activity, 'permissions': permissions,
               'version': lambda: version(*args), 'signing': signing, 'admob': admob}
    if cmd not in actions:
        raise SystemExit(__doc__)
    actions[cmd]()
