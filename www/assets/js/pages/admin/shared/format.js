/**
 * KATARNOLIMA — pages/admin/shared/format.js
 * Fungsi murni (tanpa DOM/Firebase) — mudah diuji, lihat tests/.
 *
 * escapeHtml/jsArg/safeUrl kini tinggal di core/safe.js supaya halaman warga
 * juga bisa memakainya. Di sini di-re-export agar modul admin & test lama
 * tidak perlu diubah.
 */

import { escapeHtml, jsArg, safeUrl } from "../../../core/safe.js";
export { escapeHtml, jsArg, safeUrl };

export function formatDateTimeDetailed(timestamp) {
  if (!timestamp) return '-';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace('.', ':') + ' WIB';
}
