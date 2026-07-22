/**
 * Service Worker - Ront Mobile Apps (PWA)
 *
 *  CATATAN PENTING (v7 - fix caching bug):
 *  Versi sebelumnya (v6) pakai cache-first untuk index.html, akibatnya
 *  setiap kali file index.html di-update & di-upload ulang ke hosting,
 *  HP yang sudah pernah buka app ini TETAP memuat versi LAMA dari cache,
 *  walau file di server sudah baru. Ini bikin perbaikan/bugfix kelihatan
 *  "tidak ngaruh" padahal sebenarnya HP-nya belum pernah ambil file baru.
 *
 *  Perbaikan di v7:
 *  1) index.html (app shell) sekarang NETWORK-FIRST: selalu coba ambil
 *     versi terbaru dari server dulu; cache cuma dipakai sebagai
 *     fallback kalau benar-benar offline/network gagal. Jadi update
 *     kode langsung kepakai begitu file baru di-upload, tanpa perlu
 *     uninstall PWA atau clear cache manual.
 *  2) Asset yang jarang berubah (manifest.json, icon) tetap cache-first
 *     supaya tetap hemat kuota & cepat dimuat.
 *  3) CACHE_NAME dinaikkan ke v7 supaya cache lama (v6) otomatis
 *     dibuang saat service worker baru ini pertama kali aktif.
 *
 *  Kalau nanti ganti isi file lain (misal Code.gs endpoint baru di
 *  index.html), TIDAK PERLU naikkan versi CACHE_NAME lagi karena
 *  strategi network-first di atas sudah otomatis ambil versi terbaru.
 *  Naikkan versi cuma kalau mau paksa buang SEMUA cache lama (jarang
 *  diperlukan).
 */
const CACHE_NAME = 'ront-apps-shell-v7';
const SHELL_FILES = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Jangan cache request ke API backend (GAS) - selalu ambil dari network.
  if (url.hostname.indexOf('script.google.com') !== -1) return;
  // Jangan cache request ke CDN library eksternal (ZXing, font, dsb).
  if (url.origin !== self.location.origin) return;

  const isHtmlShell =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('index.html');

  if (isHtmlShell) {
    // NETWORK-FIRST: selalu coba ambil versi terbaru dulu. Cache cuma
    // fallback kalau network benar-benar gagal (offline).
    event.respondWith(
      fetch(event.request)
        .then((fresh) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, fresh.clone()));
          return fresh;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Asset statis lain (manifest, icon): cache-first, fallback ke network.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
