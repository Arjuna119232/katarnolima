// firebase-config.js - V42 ONLINE
// @ts-nocheck
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCZtvImbyZmqoEoY1hYZcuCbUpIl3R1fhE",
  authDomain: "katarnolima-rw05.firebaseapp.com",
  projectId: "katarnolima-rw05",
  storageBucket: "katarnolima-rw05.firebasestorage.app",
  messagingSenderId: "965647612835",
  appId: "1:965647612835:web:b712367f0d8beb7c5bf816",
  measurementId: "G-ES4NX59PV9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function hashNIK(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}