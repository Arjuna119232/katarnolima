/**
 * KATARNOLIMA — pages/admin/main.js
 * Titik masuk halaman admin. Hanya merangkai modul; logika ada di masing-masing berkas.
 *
 *   shared/     dialog, format, kompres gambar
 *   features/   satu berkas per tab/fitur (Firestore + tampilan tabel/kartu)
 *   ui.js · settings.js · auth-gate.js
 */
import "./shared/modal.js";
import "./settings.js";
import "./ui.js";
import { setupAuthGate } from "./auth-gate.js";
import { initKas } from "./features/kas.js";
import { initUpdateApp } from "./features/update-app.js";
import { initSembako } from "./features/sembako.js";
import { initKeamanan } from "./features/keamanan.js";
import { initLingkungan } from "./features/lingkungan.js";
import { initPosyandu } from "./features/posyandu.js";
import { initKegiatan } from "./features/kegiatan.js";
import { initIuran } from "./features/iuran.js";
import { initDiskusi } from "./features/diskusi.js";
import { initInfoSingkat } from "./features/info-singkat.js";
import { initBerita } from "./features/berita.js";
import { initStatistik } from "./features/statistik.js";
import { initAduan } from "./features/aduan.js";
import { initWarga } from "./features/warga.js";

let started = false;

function initAdmin() {
  if (started) return; // cegah listener ganda bila status login berubah
  started = true;
  initKas();
  initUpdateApp();
  initSembako();
  initKeamanan();
  initLingkungan();
  initPosyandu();
  initKegiatan();
  initIuran();
  initDiskusi();
  initInfoSingkat();
  initBerita();
  initStatistik();
  initAduan();
  initWarga();
}

setupAuthGate(initAdmin);
