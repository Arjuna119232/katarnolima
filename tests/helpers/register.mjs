// Mendaftarkan loader agar berkas ES Module di www/ (tanpa "type":"module") dan
// impor CDN Firebase (https://www.gstatic.com/...) bisa dijalankan di Node saat pengujian.
import { register } from 'node:module';
register('./stub-loader.mjs', import.meta.url);
