const CACHE_NAME = 'mainttrack-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS.map(asset => cache.add(asset))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Intercepta e mata imediatamente requisições para o domínio quebrado (.sh)
  if (url.includes('cdn-icons-png.sh')) {
    event.respondWith(
      new Response(null, { 
        status: 404, 
        statusText: 'Invalid Domain Blocked' 
      })
    );
    return;
  }

  // Apenas intercepta requisições HTTP/HTTPS
  if (!url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Se não está no cache, tenta buscar na rede
      return fetch(event.request)
        .then((networkResponse) => {
          // Verifica se a resposta é válida antes de tentar cachear
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.log('Fetch falhou para:', url, error);
          
          // Tratamento para falha de navegação (offline)
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          
          // Retorna uma resposta vazia com status de erro em vez de deixar a promessa rejeitar
          return new Response(null, { 
            status: 503, 
            statusText: 'Service Unavailable (Offline)' 
          });
        });
    })
  );
});