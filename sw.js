// public/sw.js
const CACHE_NAME = 'klaspro-v1';  // ← bumpé
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logoapp.png'
];

// Domaines à ne JAMAIS intercepter (Firebase + Google APIs)
const BYPASS_HOSTS = [
  'firebaseio.com',
  'firebasedatabase.app',
  'firebaseapp.com',
  'googleapis.com',
  'gstatic.com',
  'googleusercontent.com'
];

function shouldBypass(url) {
  try {
    const host = new URL(url).hostname;
    return BYPASS_HOSTS.some(h => host.endsWith(h));
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Écoute du bouton "Mettre à jour"
self.addEventListener('message', (event) => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // 0. Bypass total pour Firebase et APIs Google
  if (shouldBypass(event.request.url)) return;

  // 1. Network First pour la navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2. Cache First pour les assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (event.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      });
    })
  );
});
