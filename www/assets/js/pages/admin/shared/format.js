/**
 * KATARNOLIMA — pages/admin/shared/format.js
 * Fungsi murni (tanpa DOM/Firebase) — mudah diuji, lihat tests/.
 */

export function formatDateTimeDetailed(timestamp) {
  if (!timestamp) return '-';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace('.', ':') + ' WIB';
}

/**
 * Melarikan karakter HTML agar data dari Firestore tampil sebagai teks, bukan markup.
 * Pakai untuk SEMUA nilai dinamis yang disisipkan ke innerHTML (teks maupun atribut).
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
 * URL untuk src/href: hanya http(s), blob:, atau data gambar/video. Selain itu (mis. javascript:) → ''.
 * Hasilnya BELUM di-escape; bungkus dengan escapeHtml() saat dipakai di template.
 */
export function safeUrl(value) {
  const url = String(value ?? '').trim();
  return /^(https?:\/\/|blob:|data:(image|video)\/)/i.test(url) ? url : '';
}
