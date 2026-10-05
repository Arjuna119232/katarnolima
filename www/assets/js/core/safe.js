/**
 * KATARNOLIMA — core/safe.js
 * Pembescape data yang datang dari Firestore (atau input pengguna) SEBELUM
 * disisipkan ke innerHTML. Bersifat murni (tanpa DOM/Firebase) — mudah diuji.
 *
 * WAJIB dipakai untuk setiap nilai dinamis dari Firestore yang masuk ke
 * innerHTML: judul berita, isi, nama warga, komentar diskusi, URL foto, dan
 * nilai apa pun yang menempel di atribut onclick/href/src.
 * (Lihat docs/KEAMANAN.md.)
 */

/**
 * Melarikan karakter HTML agar data tampil sebagai teks, bukan markup.
 * Pakai untuk SEMUA nilai dinamis yang disisipkan ke innerHTML (teks & atribut).
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Argumen string yang aman untuk atribut onclick="fn(ARG)".
 * Hasilnya sudah berisi tanda kutip: jsArg('a"b') → &quot;a\&quot;b&quot;
 * Jangan diberi kutip lagi di template.
 */
export function jsArg(value) {
  return escapeHtml(JSON.stringify(String(value ?? '')));
}

/**
 * URL untuk src/href: hanya http(s), blob:, atau data gambar/video.
 * Selain itu (mis. javascript:) → ''. Hasilnya BELUM di-escape;
 * bungkus dengan escapeHtml() saat dipakai di template.
 */
export function safeUrl(value) {
  const url = String(value ?? '').trim();
  return /^(https?:\/\/|blob:|data:(image|video)\/)/i.test(url) ? url : '';
}