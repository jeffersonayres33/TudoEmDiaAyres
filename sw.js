// Service Worker v11 - Limpeza de Cache de MIME Types
const CACHE_NAME = 'tudoemdia-reset-v11';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Deixa o navegador lidar com as requisições diretamente para evitar erros de MIME type no ambiente de desenvolvimento
self.addEventListener('fetch', (event) => {
  return;
});