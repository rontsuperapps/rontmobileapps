/**
 * Service Worker - Ront Mobile Apps (PWA)
 * P0 PATCH: fix Response.clone() race on NETWORK-FIRST app shell.
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
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_FILES);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ============================================================
  // PENTING:
  // API Google Apps Script JANGAN dicache oleh Service Worker.
  // Data order tetap mengambil data terbaru dari backend.
  // ============================================================
  if (url.hostname.indexOf('script.google.com') !== -1) {
    return;
  }

  // Jangan cache CDN / external origin.
  if (url.origin !== self.location.origin) {
    return;
  }

  // ============================================================
  // APP SHELL / HTML
  // NETWORK-FIRST
  // ============================================================
  const isHtmlShell =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('index.html');

  if (isHtmlShell) {
    event.respondWith(
      fetch(event.request)
        .then((fresh) => {

          // PENTING:
          // clone HARUS dibuat segera sebelum Response asli
          // dikonsumsi oleh browser.
          const cacheCopy = fresh.clone();

          // Update cache tanpa mengganggu response utama.
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => {
                return cache.put(event.request, cacheCopy);
              })
              .catch((err) => {
                console.warn(
                  '[RONT SW] cache update gagal:',
                  err
                );
              })
          );

          // Response asli langsung diberikan ke browser.
          return fresh;
        })
        .catch(() => {
          // Kalau network gagal, gunakan cache.
          return caches.match(event.request);
        })
    );

    return;
  }

  // ============================================================
  // STATIC ASSETS
  // CACHE-FIRST
  // ============================================================
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {

        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .catch(() => cached);
      })
  );
});
