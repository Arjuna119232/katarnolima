package com.katarnolima.rw05;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Activity utama. Menjembatani izin kamera & lokasi dari WebView ke sistem Android.
 * Disalin CI ke android/app/src/main/java/com/katarnolima/rw05/ (lihat scripts/patch_android.py).
 *
 * Keamanan:
 *  - Izin WebView HANYA diberikan ke origin aplikasi sendiri. Halaman web lain yang
 *    dimuat di WebView (mis. lewat tautan/redirect) tidak boleh memakai kamera atau lokasi.
 *  - Hanya resource yang benar-benar dipakai aplikasi yang diizinkan (kamera & mikrofon).
 *    Versi lama memakai request.grant(request.getResources()) yang memberi izin apa pun
 *    yang diminta siapa pun — lihat docs/KEAMANAN.md.
 */
public class MainActivity extends BridgeActivity {

  /** Origin aplikasi Capacitor (WebView dimuat dari server lokal, bukan internet). */
  private static final String[] ALLOWED_ORIGINS = {
    "capacitor://localhost",
    "http://localhost",
    "https://localhost"
  };

  /** Resource WebView yang boleh diminta aplikasi: kamera untuk foto aduan & bukti iuran. */
  private static final List<String> ALLOWED_RESOURCES = Arrays.asList(
    PermissionRequest.RESOURCE_VIDEO_CAPTURE,
    PermissionRequest.RESOURCE_AUDIO_CAPTURE
  );

  private boolean isOwnOrigin(String origin) {
    if (origin == null) {
      return false;
    }
    for (String allowed : ALLOWED_ORIGINS) {
      if (allowed.equalsIgnoreCase(origin)) {
        return true;
      }
    }
    return false;
  }

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    this.bridge.getWebView().getSettings().setGeolocationEnabled(true);
    // Jangan biarkan halaman web mana pun memuat konten campuran lewat HTTP.
    this.bridge.getWebView().getSettings().setMixedContentMode(
        android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
    );
    this.bridge.getWebView().getSettings().setAllowFileAccessFromFileURLs(false);
    this.bridge.getWebView().getSettings().setAllowUniversalAccessFromFileURLs(false);

    this.bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        final Uri origin = request.getOrigin();
        final String[] requested = request.getResources();   // getResources() → String[]

        List<String> granted = new ArrayList<>();
        if (isOwnOrigin(origin == null ? null : origin.toString())) {
          for (String resource : requested) {
            if (ALLOWED_RESOURCES.contains(resource)) {
              granted.add(resource);
            }
          }
        }

        if (granted.isEmpty()) {
          request.deny();
          return;
        }
        runOnUiThread(() -> request.grant(granted.toArray(new String[0])));
      }

      @Override
      public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        callback.invoke(origin, isOwnOrigin(origin), false);
      }
    });
  }
}