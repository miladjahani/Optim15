const CACHE_NAME = 'cf-optimizor-pwa-v5.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.ico',
  './404.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Cache asset skip:', asset);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) {
        fetch(e.request).then((res) => {
          if (res.status === 200) caches.open(CACHE_NAME).then((c) => c.put(e.request, res));
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const cln = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, cln));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
