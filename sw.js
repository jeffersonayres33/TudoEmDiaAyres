const CACHE_NAME = 'tudoemdia-v9';
const OFFLINE_URL = './index.html';

// Removido cdn.tailwindcss.com daqui para evitar erro de CORS no cache.add
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
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

  // Bloqueia domínios inválidos
  if (url.includes('cdn-icons-png.sh')) {
    event.respondWith(new Response(null, { status: 404 }));
    return;
  }

  // CORREÇÃO DE CORS: Se for o Tailwind CDN, não intercepta. 
  // Isso permite que o navegador carregue o script normalmente sem passar pelo fetch do SW.
  if (url.includes('tailwindcss.com')) {
    return; 
  }

  if (event.request.method !== 'GET' || !url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Só tenta cachear se for sucesso e não for o Tailwind (já filtrado acima)
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
    })
  );
});