const CACHE_NAME = 'tudoemdia-v10';
const OFFLINE_URL = './index.html';

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
      // Usamos Promise.allSettled para garantir que um erro em um asset não quebre o cache dos outros
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

  // 1. BLOQUEIO DE DOMÍNIO INVÁLIDO
  if (url.includes('cdn-icons-png.sh')) {
    event.respondWith(new Response(null, { status: 404 }));
    return;
  }

  // 2. BYPASS DE TRANSPILAÇÃO (.tsx / .ts)
  // Deixamos o servidor/plataforma lidar com isso. O SW não deve cachear o código fonte puro.
  if (url.endsWith('.tsx') || url.endsWith('.ts')) {
    return;
  }

  // 3. BYPASS DE CORS (Tailwind)
  if (url.includes('tailwindcss.com')) {
    return; 
  }

  if (event.request.method !== 'GET' || !url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Só cacheia respostas válidas e que não sejam scripts de módulo (para evitar conflitos de MIME)
          if (response && response.status === 200 && !url.includes('.tsx')) {
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