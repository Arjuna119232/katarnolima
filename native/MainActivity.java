package com.katarnolima.rw05;

import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * Activity utama. Menjembatani izin kamera & lokasi dari WebView ke sistem Android.
 * Disalin CI ke android/app/src/main/java/com/katarnolima/rw05/ (lihat scripts/patch_android.py).
 *
 * Konfigurasi WebView:
 * - Zoom dimatikan (biar tampilan tidak kebesaran).
 * - Text zoom dipaksa 100%.
 * - Wide viewport dimatikan (biar layout mobile tetap proporsional).
 */
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    WebSettings settings = this.bridge.getWebView().getSettings();

    // Izin geolokasi
    settings.setGeolocationEnabled(true);

    // === PERBAIKAN TAMPILAN KEBESARAN ===
    // Matikan zoom (biar user tidak bisa zoom in/out)
    settings.setSupportZoom(false);
    settings.setBuiltInZoomControls(false);
    settings.setDisplayZoomControls(false);

    // Paksa text zoom 100% (biar font tidak kebesaran)
    settings.setTextZoom(100);

    // Jangan pakai wide viewport (biar layout mobile tetap proporsional)
    settings.setUseWideViewPort(false);
    settings.setLoadWithOverviewMode(false);

    // Cache & rendering
    settings.setDomStorageEnabled(true);
    settings.setJavaScriptEnabled(true);

    // WebChromeClient untuk izin kamera & lokasi
    this.bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> request.grant(request.getResources()));
      }

      @Override
      public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        callback.invoke(origin, true, false);
      }
    });
  }
}
