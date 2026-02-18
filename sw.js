const CACHE_NAME = 'tudoemdia-v8';
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

  // CORREÇÃO CRÍTICA: Bloqueia silenciosamente o domínio inválido para evitar TypeError no console
  if (url.includes('cdn-icons-png.sh')) {
    event.respondWith(new Response(null, { status: 404, statusText: 'Invalid Domain Blocked' }));
    return;
  }

  if (event.request.method !== 'GET' || !url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return response;
        })
        .catch(() => {
          // Se for navegação, retorna a página inicial offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          // Para outros recursos, retorna erro silencioso
          return new Response(null, { status: 408 });
        });
    })
  );
});