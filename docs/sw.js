// ENSv1 Cache Buster & Service Worker Uninstaller
// This script purges any stale service worker caches and deregisters itself.

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            console.log('[ENSv1] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(function () {
        return self.registration.unregister();
      })
      .then(function () {
        return self.clients.claim();
      })
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (clientList) {
        clientList.forEach(function (client) {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url);
          }
        });
      })
  );
});

// Network-only fallback: never intercept or cache requests
self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});
