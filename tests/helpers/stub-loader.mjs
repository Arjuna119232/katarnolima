// Hook resolve/load Node: (1) impor Firebase CDN -> stub lokal, (2) berkas .js di www/ dianggap ES Module.
const FIREBASE = /^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z]+)\.js$/;

export async function resolve(specifier, context, next) {
  const m = FIREBASE.exec(specifier);
  if (m) return { url: `stub:${m[1]}`, shortCircuit: true };
  return next(specifier, context);
}

const STUBS = {
  'firebase-app': `
    export const initializeApp = () => ({ stub: 'app' });
    export const getApps = () => [];
    export const getApp = () => ({ stub: 'app' });`,
  'firebase-firestore': `
    const g = globalThis.__fb ??= { snapshots: [], writes: [] };
    export const getFirestore = () => ({ stub: 'db' });
    export const collection = (_db, name) => ({ col: name });
    export const doc = (_db, col, id) => ({ col, id });
    export const query = (...a) => ({ q: a });
    export const orderBy = (...a) => a;
    export const limit = (n) => n;
    export const serverTimestamp = () => 'TS';
    export const onSnapshot = (target, cb) => { g.snapshots.push({ target, cb }); return () => {}; };
    export const getDoc = async () => ({ exists: () => true, data: () => ({ total: 1000, judul: 'J' }) });
    const w = (kind) => async (...a) => { g.writes.push([kind, ...a]); return { id: 'new' }; };
    export const setDoc = w('setDoc'), addDoc = w('addDoc'), updateDoc = w('updateDoc'), deleteDoc = w('deleteDoc');`,
  'firebase-auth': `
    const g = globalThis.__fb ??= { snapshots: [], writes: [] };
    export const getAuth = () => ({ stub: 'auth' });
    export const onAuthStateChanged = (_a, cb) => { g.authCb = cb; };
    export const signInWithEmailAndPassword = async () => ({});
    export const signOut = async () => {};`,
  'firebase-storage': `
    export const getStorage = () => ({ stub: 'storage' });
    export const ref = (_s, url) => ({ url });
    export const deleteObject = async () => {};`,
};

export async function load(url, context, next) {
  if (url.startsWith('stub:')) {
    return { format: 'module', source: STUBS[url.slice(5)], shortCircuit: true };
  }
  if (url.startsWith('file:') && url.includes('/www/') && url.endsWith('.js')) {
    return next(url, { ...context, format: 'module' });
  }
  return next(url, context);
}
