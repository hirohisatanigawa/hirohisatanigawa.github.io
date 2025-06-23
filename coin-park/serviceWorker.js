const CACHE_NAME = 'coin-park-v20250624_042612';
const ASSETS_TO_CACHE = [
  '/coin-park/manifest.json',
  // アイコン類
  '/coin-park/icons/icon-16x16.png',
  '/coin-park/icons/icon-32x32.png',
  '/coin-park/icons/icon-72x72.png',
  '/coin-park/icons/icon-96x96.png',
  '/coin-park/icons/icon-128x128.png',
  '/coin-park/icons/icon-144x144.png',
  '/coin-park/icons/icon-152x152.png',
  '/coin-park/icons/icon-192x192.png',
  '/coin-park/icons/icon-384x384.png',
  '/coin-park/icons/icon-512x512.png',
  '/coin-park/icons/icon-base.svg'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - only ASSETS_TO_CACHEをキャッシュから返し、それ以外は常にネットワークから取得
self.addEventListener('fetch', (event) => {
  const urlPath = new URL(event.request.url).pathname;
  if (ASSETS_TO_CACHE.includes(urlPath)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync');
    // Handle background sync tasks here
  }
});

// Push notification support (for future features)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  // Handle push notifications here
});