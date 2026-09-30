/**
 * KATARNOLIMA — services/firebase.js
 * SATU-SATUNYA tempat konfigurasi & inisialisasi Firebase untuk seluruh halaman.
 *
 * Cara pakai di modul halaman:
 *   import { app } from "../services/firebase.js";
 *   const db = getFirestore(app);
 *
 * Catatan keamanan: apiKey Firebase Web memang publik. Keamanan data bergantung
 * pada Firestore/Storage Security Rules dan pembatasan API key di Google Cloud Console
 * (lihat docs/KEAMANAN.md).
 */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCZtvImbyZmqoEoY1hYZcuCbUpIl3R1fhE",
  authDomain: "katarnolima-rw05.firebaseapp.com",
  projectId: "katarnolima-rw05",
  storageBucket: "katarnolima-rw05.firebasestorage.app",
  messagingSenderId: "965647612835",
  appId: "1:965647612835:web:b712367f0d8beb7c5bf816",
  measurementId: "G-ES4NX59PV9"
};

// Aman dipanggil berulang: memakai instance yang sudah ada bila tersedia.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
