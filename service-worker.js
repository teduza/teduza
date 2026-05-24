const CACHE_NAME = 'teduza-mars-v3';
const ASSETS = ['./', './index.html', './team/', './team/index.html', './founder/', './founder/index.html', './portrait-placeholder.svg', './ru/', './ru/index.html', './ru/team/', './ru/team/index.html', './ru/founder/', './ru/founder/index.html', './hy/', './hy/index.html', './hy/team/', './hy/team/index.html', './hy/founder/', './hy/founder/index.html', './de/', './de/index.html', './de/team/', './de/team/index.html', './de/founder/', './de/founder/index.html', './fr/', './fr/index.html', './fr/team/', './fr/team/index.html', './fr/founder/', './fr/founder/index.html', './zh/', './zh/index.html', './zh/team/', './zh/team/index.html', './zh/founder/', './zh/founder/index.html', './uk/', './uk/index.html', './uk/team/', './uk/team/index.html', './uk/founder/', './uk/founder/index.html', './site.webmanifest', './favicon.ico', './favicon.svg', './favicon-96x96.png', './apple-touch-icon.png', './web-app-manifest-192x192.png', './web-app-manifest-512x512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))));
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
