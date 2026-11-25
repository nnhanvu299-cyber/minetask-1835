const CACHE_NAME = 'minetask-1835s-v48-no-false-update';
const VERSION_META_CACHE = 'minetask-1835s-version-meta';
const VERSION_META_KEY = './__sw_known_version__';

async function getStoredKnownVersion() {
  try {
    const cache = await caches.open(VERSION_META_CACHE);
    const res = await cache.match(VERSION_META_KEY);
    if (!res) return 0;
    const text = await res.text();
    const num = Number(text);
    return Number.isFinite(num) && num > 0 ? num : 0;
  } catch {
    return 0;
  }
}

async function setStoredKnownVersion(version) {
  const num = Number(version);
  if (!Number.isFinite(num) || num <= 0) return;
  try {
    const cache = await caches.open(VERSION_META_CACHE);
    await cache.put(VERSION_META_KEY, new Response(String(num)));
  } catch {}
}

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './minecraft-bg.jpg',
  './cherry-bg.jpg',
  './favicon.ico',
  './badge-96.png',
  './badge-chat-96.png',
  './icon-1835-v2-192.png',
  './icon-1835-v2-512.png',
  './icon-1835-v2.png',
  './fonts/minecraft-f2d-v1-42.otf'
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

// Activate: Automatically PURGE old caches without firing false update notifications
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const deletePromises = keys.map((key) => {
        if (key !== CACHE_NAME && key !== VERSION_META_CACHE) {
          console.log('[1835 SW] Auto-deleting old obsolete cache:', key);
          return caches.delete(key);
        }
      });
      return Promise.all(deletePromises);
    }).then(() => self.clients.claim())
  );
});

// Periodic Background Sync: Chỉ thông báo khi phiên bản trên máy chủ thực sự mới hơn phiên bản đã biết
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'minetask-check-update' || event.tag === 'check-updates') {
    event.waitUntil(
      (async () => {
        try {
          const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
          if (!res.ok) return;
          const data = await res.json();
          const serverVersion = Number(data && data.version);
          if (!Number.isFinite(serverVersion) || serverVersion <= 0) return;

          const knownVersion = await getStoredKnownVersion();
          if (knownVersion <= 0) {
            // Chưa có mốc phiên bản: lưu mốc hiện tại, không tự ý báo cập nhật
            await setStoredKnownVersion(serverVersion);
            return;
          }

          if (serverVersion > knownVersion && self.registration) {
            await setStoredKnownVersion(serverVersion);
            await self.registration.showNotification('🚀 MINETASK 1835s: BẢN CẬP NHẬT MỚI!', {
              body: 'Hệ thống vừa có bản cập nhật mới trên máy chủ. Chạm vào để cập nhật!',
              icon: './icon-1835-v2-192.png',
              badge: './badge-96.png',
              tag: 'minetask-1835-app-update',
              requireInteraction: true,
              data: { url: './' }
            });
          }
        } catch {}
      })()
    );
  }
});

// Web Push Event: Nhận thông báo đẩy từ máy chủ (ngay cả khi tắt màn hình)
self.addEventListener('push', (event) => {
  let title = '🚀 MINETASK 1835s: CÓ BẢN CẬP NHẬT MỚI!';
  let body = 'Hệ thống vừa có bản cập nhật mới. Chạm vào đây để mở ứng dụng!';
  let url = './';

  if (event.data) {
    try {
      const json = event.data.json();
      if (json.title) title = json.title;
      if (json.body) body = json.body;
      if (json.url) url = json.url;
    } catch {
      body = event.data.text() || body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: './icon-1835-v2-192.png',
      badge: './badge-96.png',
      tag: 'minetask-1835-push',
      requireInteraction: true,
      data: { url }
    })
  );
});

// Notification Click: Chạm vào thông báo để mở hoặc focus vào ứng dụng
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Message listener for instant skip-waiting, version sync & cache purge
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'SYNC_VERSION' && event.data.version) {
    event.waitUntil(
      (async () => {
        const incoming = Number(event.data.version);
        if (!Number.isFinite(incoming) || incoming <= 0) return;
        const known = await getStoredKnownVersion();
        if (incoming > known) {
          await setStoredKnownVersion(incoming);
        }
      })()
    );
  }
  if (event.data.type === 'PURGE_OLD_CACHES') {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== CACHE_NAME && key !== VERSION_META_CACHE) caches.delete(key);
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

  // 0. Always fetch version.json directly from network, NEVER serve stale cached version
  if (url.pathname.endsWith('version.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
    return;
  }

  // 0.1 Always fetch cache-busting update requests directly from network
  if (url.searchParams.has('v_sync') || url.searchParams.has('reload_ts') || url.searchParams.has('t')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
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
