/**
 * KATARNOLIMA — pages/admin/firebase.js
 * Satu pintu ke Firebase SDK untuk seluruh modul admin (versi SDK ditulis sekali di sini).
 * Konfigurasi proyek tetap hanya ada di services/firebase.js.
 */
import { app } from "../../services/firebase.js";
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage, ref, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp };
export { signInWithEmailAndPassword, onAuthStateChanged, signOut };
export { ref, deleteObject };
