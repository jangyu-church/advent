/* 오프라인에서도 열리게 해 주는 파일입니다.
   인터넷이 되면 항상 새 내용을 먼저 받아 오므로, 글만 고쳤을 때는 이 파일을 건드리지 않아도 됩니다. */
const VERSION = 'advent-2026-v5';
const ASSETS = [
  './', './index.html', './style.css', './app.js', './cards.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon.svg',
  './img/candle-1.jpg', './img/candle-2.jpg', './img/candle-3.jpg', './img/candle-4.jpg',
  './fonts/gowun-batang-ko-700.woff2', './fonts/gowun-batang-latin-700.woff2', './fonts/nanum-brush-title.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 인터넷이 되면 새 내용을 먼저 받고(3초 안에), 안 되면 저장해 둔 것을 보여 준다.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const cacheKey = req.mode === 'navigate' ? new URL('./index.html', self.registration.scope).href : url.origin + url.pathname;

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const fromCache = () => cache.match(cacheKey, { ignoreSearch: true });
    const fromNet = fetch(req).then((res) => {
      if (res && res.ok) cache.put(cacheKey, res.clone()).catch(() => {});
      return res;
    });
    fromNet.catch(() => {});
    const timeout = new Promise((r) => setTimeout(() => r(null), 3000));
    try {
      const first = await Promise.race([fromNet, timeout]);
      if (first && first.ok) return first;
      const cached = await fromCache();
      if (cached) return cached;
      return (await fromNet) || Response.error();
    } catch (err) {
      const cached = await fromCache();
      return cached || Response.error();
    }
  })());
});
