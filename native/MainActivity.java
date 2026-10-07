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

  /**
   * Apakah origin ini memang aplikasi kita sendiri?
   *
   * PENTING (perbaikan 2.3.7): versi lama membandingkan string apa adanya:
   *
   *     "https://localhost/".equalsIgnoreCase("https://localhost")  -> false
   *
   * Android WebView selalu memberi origin dengan garis miring di akhir
   * (dari Uri.toString() maupun parameter onGeolocationPermissionsShowPrompt).
   * Akibatnya isOwnOrigin() selalu false, seluruh permintaan ditolak dengan
   * request.deny() / callback.invoke(origin, false, false) — tanpa pesan error.
   * Gejalanya persis seperti yang dilaporkan warga: izin Android sudah
   * "diizinkan", tapi kamera dan GPS tetap tidak bisa dipakai.
   *
   * Sekarang dinormalisasi lebih dulu: garis miring di akhir dibuang, lalu
   * dibandingkan pada level skema + host saja (path dan query diabaikan,
   * karena origin murni memang tidak punya keduanya).
   */
  private boolean isOwnOrigin(String origin) {
    if (origin == null) {
      return false;
    }
    String bersih = origin.trim();
    while (bersih.endsWith("/")) {
      bersih = bersih.substring(0, bersih.length() - 1);
    }
    for (String allowed : ALLOWED_ORIGINS) {
      if (allowed.equalsIgnoreCase(bersih)) {
        return true;
      }
      // Bandingkan skema + host juga, supaya "https://localhost/index.html"
      // tetap dikenali sebagai asal aplikasi ini.
      if (akuSamaSkemaHost(bersih, allowed)) {
        return true;
      }
    }
    return false;
  }

  /** Bandingkan skema + host dua URL. Host kosong (mis. "capacitor://") tetap dianggap sama. */
  private boolean akuSamaSkemaHost(String a, String b) {
    Uri ua = Uri.parse(a);
    Uri ub = Uri.parse(b);
    if (ua == null || ub == null || ua.getScheme() == null || ub.getScheme() == null) {
      return false;
    }
    if (!ua.getScheme().equalsIgnoreCase(ub.getScheme())) {
      return false;
    }
    String ha = ua.getHost() == null ? "" : ua.getHost();
    String hb = ub.getHost() == null ? "" : ub.getHost();
    return ha.equalsIgnoreCase(hb);
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