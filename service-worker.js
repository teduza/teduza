const CACHE_NAME = 'teduza-mars-v1';
const ASSETS = [
  './',
  './index.html',
  './ru/',
  './ru/index.html',
  './hy/',
  './hy/index.html',
  './de/',
  './de/index.html',
  './fr/',
  './fr/index.html',
  './zh/',
  './zh/index.html',
  './uk/',
  './uk/index.html',
  './site.webmanifest',
  './favicon.ico',
  './favicon.svg',
  './favicon-96x96.png',
  './apple-touch-icon.png',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    fetch(request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
      return response;
    }).catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
  );
});
