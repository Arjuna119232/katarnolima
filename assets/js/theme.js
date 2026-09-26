/* KATARNOLIMA — theme.js
   Menerapkan mode Terang / Gelap / Ikuti Perangkat di seluruh halaman.
   Pengaturan mode tampilan sepenuhnya dikelola dari pages/pengaturan.html —
   file ini hanya bertugas MENERAPKAN preferensi yang tersimpan di localStorage. */
(function () {
  var STORAGE_KEY = "katar-theme";
  var mql = window.matchMedia("(prefers-color-scheme: dark)");

  function getPref() {
    try { return localStorage.getItem(STORAGE_KEY) || "system"; }
    catch (e) { return "system"; }
  }

  function resolve(pref) {
    if (pref === "dark") return "dark";
    if (pref === "light") return "light";
    return mql.matches ? "dark" : "light";
  }

  function apply(pref) {
    var resolved = resolve(pref);
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-pref", pref);
  }

  // react live if user memilih "Ikuti Perangkat" dan tema OS berubah
  mql.addEventListener ? mql.addEventListener("change", function () {
    if (getPref() === "system") apply("system");
  }) : mql.addListener(function () {
    if (getPref() === "system") apply("system");
  });

  // tetap terapkan tema meski inline snippet blocking sudah menerapkannya lebih dulu
  apply(getPref());

  // sinkron otomatis antar-tab/halaman jika preferensi diubah di tab lain
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) apply(getPref());
  });
})();
