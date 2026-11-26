const CACHE = 'pawns-promotion-v3';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/pawn.svg'];

async function precacheBuiltAssets(cache) {
  await cache.addAll(SHELL);
  const html = await cache.match('/index.html');
  if (!html) return;
  const source = await html.text();
  const assets = [...source.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
  if (assets.length) await cache.addAll([...new Set(assets)]);
}

async function tellClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) client.postMessage(message);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(precacheBuiltAssets).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('pawns-promotion-') && key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim())
    .then(() => tellClients({ type: 'OFFLINE_READY' })));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CHECK_OFFLINE_READY') event.waitUntil(caches.open(CACHE).then((cache) => cache.keys()).then((keys) => {
    if (keys.length >= SHELL.length) event.source?.postMessage({ type: 'OFFLINE_READY' });
  }));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) { const copy = response.clone(); void caches.open(CACHE).then((cache) => cache.put(event.request, copy)); }
    return response;
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === 'navigate' ? (await caches.match('/index.html')) : Response.error())));
});
