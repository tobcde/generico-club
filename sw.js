// Service Worker - Sistema de Gestion Digital
// Un SW compartido que maneja las 3 apps por separado

const VERSION = 'sgd-v2';

// Detectar quÃ© app estÃ¡ usando este SW segÃºn el scope
const scope = self.registration.scope;
const APP = scope.includes('datos') ? 'datos' 
           : scope.includes('profes') ? 'profes' 
           : 'admin';

const CACHE_NAME = 'sgd-' + APP + '-v2';

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      var assets = [
        'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
      ];
      // Cachear el HTML correcto segÃºn la app
      if (APP === 'admin')  assets.push('./admin.html');
      if (APP === 'profes') assets.push('./profes.html');
      if (APP === 'datos')  assets.push('./datos.html');
      return cache.addAll(assets).catch(function(e) {
        console.log('Cache parcial:', e);
      });
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // No cachear llamadas al GAS
  if (e.request.url.includes('script.google.com')) return;
  if (e.request.url.includes('script.googleusercontent.com')) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function() {
        return cached;
      });
    })
  );
});
