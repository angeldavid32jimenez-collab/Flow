const VERSION = 'flow-v1.0.0';
const CACHE = VERSION;
const ASSETS = ['./habit-tracker.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => client.postMessage({ type: 'NEW_VERSION', version: VERSION }));
  });
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fresh = fetch(e.request).then(res => {
          if (res && res.status === 200) cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fresh;
      })
    )
  );
});
