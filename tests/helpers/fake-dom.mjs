// DOM tiruan minimal: setiap getElementById mengembalikan elemen palsu yang mencatat listener.
export class FakeEl {
  constructor(id = '') {
    this.id = id; this.value = ''; this.checked = false; this.files = [];
    this.textContent = ''; this.innerHTML = ''; this.style = {}; this.dataset = {};
    this.listeners = {}; this.onclick = null;
    const set = new Set();
    this.classList = { add: (c) => set.add(c), remove: (c) => set.delete(c), toggle: (c) => set.has(c) ? set.delete(c) : set.add(c), contains: (c) => set.has(c) };
  }
  addEventListener(t, fn) { (this.listeners[t] ??= []).push(fn); }
  setAttribute() {} removeAttribute() {} getAttribute() { return null; } reset() {}
  querySelector() { return new FakeEl(); }
  querySelectorAll() { return []; }
}

export function installFakeDom() {
  const els = new Map();
  const get = (id) => { if (!els.has(id)) els.set(id, new FakeEl(id)); return els.get(id); };
  const store = new Map();
  const docListeners = {};
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.document = {
    getElementById: get,
    querySelector: () => new FakeEl(),
    querySelectorAll: () => [],
    documentElement: new FakeEl('html'),
    createElement: () => new FakeEl(),
    addEventListener: (type, fn) => { (docListeners[type] ??= []).push(fn); },
    removeEventListener: (type, fn) => {
      const arr = docListeners[type];
      if (arr) docListeners[type] = arr.filter(f => f !== fn);
    },
    // Jalankan semua listener yang terpasang (dipakai untuk mensimulasikan DOMContentLoaded).
    dispatch: (type) => { (docListeners[type] ?? []).forEach(fn => fn({ preventDefault() {} })); },
  };
  globalThis.window = globalThis;
  globalThis.location = { href: '' };
  globalThis.history = { length: 1, state: null, back() {}, pushState() {} };
  globalThis.matchMedia = () => ({ matches: false });
  return { els, get };
}

// Bangun objek snapshot tiruan untuk onSnapshot: snap.forEach(cb), snap.empty.
export function fakeSnapshot(docs = []) {
  return {
    empty: docs.length === 0,
    forEach: (cb) => docs.forEach(({ id, ...data }) => cb({ id, data: () => data })),
  };
}
