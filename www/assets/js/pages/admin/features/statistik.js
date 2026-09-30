/**
 * KATARNOLIMA — pages/admin/features/statistik.js
 * Angka ringkasan dashboard (warga, berita, saldo).
 */
import { db, collection, doc, onSnapshot } from "../firebase.js";

export function initStatistik() {
  const statWarga = document.getElementById('statWarga');
  if(statWarga) onSnapshot(collection(db,"users_profile"), (snap)=>{statWarga.textContent=snap.size;});

  const statBerita = document.getElementById('statBerita');
  if(statBerita) onSnapshot(collection(db,"berita_rw05"), (snap)=>{statBerita.textContent=snap.size;});

  const statSaldo = document.getElementById('statSaldo');
  onSnapshot(doc(db,"kas_rw05","saldo_utama"), (snap)=>{
    if(snap.exists()){ const t=snap.data().total||0; if(statSaldo) statSaldo.textContent='Rp '+t.toLocaleString('id-ID'); }
  });
}
