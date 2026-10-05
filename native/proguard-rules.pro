# Aturan R8/ProGuard untuk build rilis.
# Dipasang CI bersama native/signing.gradle. Capacitor, Firebase, dan Google Play
# Services sudah membawa aturan masing-masing; yang di bawah ini hanya untuk kelas
# milik aplikasi sendiri yang dipanggil lewat refleksi/JNI.

# MainActivitydipanggil sistem Android lewat nama di manifest.
-keep class com.katarnolima.rw05.MainActivity { *; }

# Jembatan izin kamera/lokasi dipanggil dari WebChromeClient.
-keepclassmembers class com.katarnolima.rw05.MainActivity$* {
    public void onPermissionRequest(android.webkit.PermissionRequest);
    public void onGeolocationPermissionsShowPrompt(java.lang.String, android.webkit.GeolocationPermissions$Callback);
}

# Pesan dari WebView ke Java (window.Capacitor / @JavascriptInterface).
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Abaikan peringatan R8 yang tidak berpengaruh pada build rilis.
-dontwarn org.jetbrains.annotations.**
-dontwarn javax.annotation.**