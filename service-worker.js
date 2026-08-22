const CACHE_NAME = 'teduza-mars-v6';
const ASSETS = ['./', './index.html', './team/', './team/index.html', './founder/', './founder/index.html', './patents/', './patents/index.html', './profiles/', './profiles/index.html', './dudnik/', './dudnik/index.html', './cosmic-scene.js', './ru/', './ru/index.html', './ru/team/', './ru/team/index.html', './ru/founder/', './ru/founder/index.html', './ru/patents/', './ru/patents/index.html', './ru/profiles/', './ru/profiles/index.html', './ru/dudnik/', './ru/dudnik/index.html', './hy/', './hy/index.html', './hy/team/', './hy/team/index.html', './hy/founder/', './hy/founder/index.html', './hy/patents/', './hy/patents/index.html', './hy/profiles/', './hy/profiles/index.html', './hy/dudnik/', './hy/dudnik/index.html', './de/', './de/index.html', './de/team/', './de/team/index.html', './de/founder/', './de/founder/index.html', './de/patents/', './de/patents/index.html', './de/profiles/', './de/profiles/index.html', './de/dudnik/', './de/dudnik/index.html', './fr/', './fr/index.html', './fr/team/', './fr/team/index.html', './fr/founder/', './fr/founder/index.html', './fr/patents/', './fr/patents/index.html', './fr/profiles/', './fr/profiles/index.html', './fr/dudnik/', './fr/dudnik/index.html', './zh/', './zh/index.html', './zh/team/', './zh/team/index.html', './zh/founder/', './zh/founder/index.html', './zh/patents/', './zh/patents/index.html', './zh/profiles/', './zh/profiles/index.html', './zh/dudnik/', './zh/dudnik/index.html', './uk/', './uk/index.html', './uk/team/', './uk/team/index.html', './uk/founder/', './uk/founder/index.html', './uk/patents/', './uk/patents/index.html', './uk/profiles/', './uk/profiles/index.html', './uk/dudnik/', './uk/dudnik/index.html', './site.webmanifest', './favicon.ico', './favicon.svg', './favicon-96x96.png', './apple-touch-icon.png', './web-app-manifest-192x192.png', './web-app-manifest-512x512.png'];

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
