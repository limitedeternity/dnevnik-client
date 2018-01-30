self.addEventListener('install', (event) => {
  event.waitUntil(preLoad());
});

const preLoad = () => {
  return caches.open('dnevnik-sw').then((cache) => {
  return cache.addAll([
              '/',
              '/main',
              '/css/material.deep_orange-blue.min.css.br',
              '/css/styles-deep_orange.css.br',
              '/css/material.deep_purple-blue.min.css.br',
              '/css/styles-deep_purple.css.br',
              '/css/material.teal-blue.min.css.br',
              '/css/styles-teal.css.br',
              '/css/material.pink-blue.min.css.br',
              '/css/styles-pink.css.br',
              '/css/md_icons.css.br',
              '/css/Roboto.css.br',
              '/js/compressed.js.br',
              '/js/material.min.js.br',
              '/config/browserconfig.xml',
              '/config/manifest.json',
              '/fonts/md_icons.woff2',
              '/fonts/Medium/Roboto-Medium.woff2',
              '/fonts/Regular/Roboto-Regular.woff2'
    ]);
  });
};

self.addEventListener('fetch', (event) => {
  if (event.request.url === self.location.origin + "/up" || event.request.url === self.location.origin + "/login" || event.request.method == 'POST') {
    event.respondWith(checkResponse(event.request).catch(() => {
      return returnFromCache(event.request);
    }));
  } else {
    event.respondWith(returnFromCache(event.request).catch(() => {
      return checkResponse(event.request);
    }));
  }

  event.waitUntil(addToCache(event.request));
});

const checkResponse = (request) => {
  return new Promise((fulfill, reject) => {
    fetch(request).then((response) => {
      if(response.status !== 404) {
        fulfill(response);
      } else {
        reject();
      }
    }, reject);
  });
};

var addToCache = (request) => {
  return caches.open('dnevnik-sw').then((cache) => {
    return fetch(request).then((response) => {
      return cache.put(request, response);
    });
  });
};

var returnFromCache = (request) => {
  return caches.open('dnevnik-sw').then((cache) => {
    return cache.match(request).then((matching) => {
     if(!matching || matching.status == 404) {
       return cache.match('/main');
     } else {
       return matching;
     }
    });
  });
};

self.addEventListener('activate', (event) => {
  var cacheWhitelist = [];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
