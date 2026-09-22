// Service Worker for AI-Powered Multilingual Public Awareness Platform PWA
const CACHE_NAME = 'awareness-pwa-v1';

// Static App Shell assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon-512.png',
  '/icons/apple-touch-icon.png'
];

// Sensitive API routes that must NEVER be cached (Network-Only)
const SENSITIVE_API_PATTERNS = [
  '/auth',
  '/recipients',
  '/audiences',
  '/segments',
  '/campaigns',
  '/ai',
  '/analytics',
  '/master',
  '/broadcasts'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Never cache non-GET requests (POST, PUT, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Sensitive API requests: Network-Only (do not cache tokens or PII)
  const isSensitiveApi = SENSITIVE_API_PATTERNS.some((pattern) => url.pathname.startsWith(pattern));
  if (isSensitiveApi) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'NetworkOffline',
            message: 'You are currently offline. Please check your internet connection to sync live data.',
            isOffline: true
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Navigation requests (HTML SPA shell): Network-First, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // 4. Static assets (JS, CSS, images, fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Web Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'New Platform Notification', body: 'You have a new campaign update.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Campaign Alert', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || data.message || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data.url || '/dashboard',
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Awareness Platform', options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
