const CACHE_NAME = 'tudoemdia-v7';
const OFFLINE_URL = './index.html';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn-icons-png.flaticon.com/512/3596/3596091.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tenta adicionar cada asset individualmente para não quebrar o cache se um falhar
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignorar domínios inválidos conhecidos para evitar erros no console
  if (url.includes('cdn-icons-png.sh')) return;

  // Apenas processa GET e protocolos http/https
  if (event.request.method !== 'GET' || !url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') return caches.match(OFFLINE_URL);
          return null;
        });

      return cached || networkFetch;
    })
  );
});