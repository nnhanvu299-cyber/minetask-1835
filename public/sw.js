const CACHE_NAME = 'minetask-1835s-v21-live';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './minecraft-bg.jpg',
  './cherry-bg.jpg',
  './favicon.ico',
  './icon-1835-v2-192.png',
  './icon-1835-v2-512.png',
  './icon-1835-v2.png'
];

// Install: Cache new core shell and immediately skip waiting to take over
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[1835 SW] Pre-cache warning:', err);
      });
    })
  );
});

// Activate: Automatically PURGE and DELETE all old caches from previous versions!
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[1835 SW] Auto-deleting old obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message listener for instant skip-waiting & cache purge
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'PURGE_OLD_CACHES') {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== CACHE_NAME) caches.delete(key);
      });
    });
  }
});

// Fetch: Network-First for Navigation, Cache fallback for offline (Never intercept localhost dev)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass service worker entirely for localhost development
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // 1. Navigation requests (Opening the site or reloading) - Network First with Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Server offline: Retrieve cached HTML
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return (await caches.match('./index.html')) || (await caches.match('./'));
        })
    );
    return;
  }

  // 2. Static Assets (Scripts, Styles, Images, Audio) - Stale-While-Revalidate with Auto Cache Refresh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      // Return cached version immediately if available, while refreshing in background
      return cachedResponse || fetchPromise;
    })
  );
});
