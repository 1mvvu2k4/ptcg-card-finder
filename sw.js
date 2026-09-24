const CACHE_NAME = 'ptcg-7b537b6106cf';
const SHELL = ['./', './index.html', './manifest.webmanifest', './assets/app-icon-192.png', './assets/app-icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
const cacheFirst = async request => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
  return response;
};
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(async response => {
      if (response.ok) (await caches.open(CACHE_NAME)).put('./index.html', response.clone());
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.pathname.includes('/cards-index.json') || url.pathname.includes('/series-data/') || url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(event.request));
  }
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'warm-index' || !event.data.url) return;
  const request = new Request(new URL(event.data.url, self.location.href));
  event.waitUntil(cacheFirst(request));
});
