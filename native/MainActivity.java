package com.katarnolima.rw05;

import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * Activity utama. Menjembatani izin kamera & lokasi dari WebView ke sistem Android.
 * Disalin CI ke android/app/src/main/java/com/katarnolima/rw05/ (lihat scripts/patch_android.py).
 */
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    this.bridge.getWebView().getSettings().setGeolocationEnabled(true);

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
