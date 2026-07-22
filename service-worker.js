/**
 * Service Worker - Ront Mobile Apps (PWA)
 * Hanya meng-cache app shell (HTML/manifest/icon) supaya PWA bisa
 * di-install dan tetap membuka layar terakhir saat koneksi terputus
 * sebentar. Data (login, presensi, order, dst) TETAP selalu request
 * langsung ke API_URL (Google Apps Script) - sengaja TIDAK di-cache
 * supaya data yang ditampilkan selalu paling baru.
 */
const CACHE_NAME = 'ront-apps-shell-v6';
const SHELL_FILES = [
  './',
  './index.html',
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

  // App shell: cache-first, fallback ke network.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
