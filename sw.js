
const CACHE_NAME = 'mainttrack-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos um array de promessas para que falhas em um arquivo não impeçam o cache dos outros
      return Promise.allSettled(
        ASSETS.map(asset => cache.add(asset))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora extensões de navegador e esquemas não suportados (chrome-extension, etc)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        // Retorno silencioso em caso de erro de rede para evitar erros no console do SW
        return new Response('Network error occurred', { status: 408, statusText: 'Network Error' });
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
});
