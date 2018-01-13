var CACHE = 'dnevnik-sw';
var precacheFiles = [
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
  ];

//Install stage sets up the cache-array to configure pre-cache content
self.addEventListener('install', function(evt) {
  evt.waitUntil(precache().then(function() {
      return self.skipWaiting();
  }));
});


//allow sw to control of current page
self.addEventListener('activate', function(event) {
  return self.clients.claim();
});

self.addEventListener('fetch', function(evt) {
  if (evt.request.url === self.location.origin + "/" || evt.request.url === self.location.origin + "/main") {
    evt.respondWith(fromServer(evt.request).catch(fromCache(evt.request))).catch();
    evt.waitUntil(update(evt.request).catch());

  } else if (evt.request.method == 'POST') {
    evt.respondWith(fromServer(evt.request));

  } else {
    evt.respondWith(fromCache(evt.request).catch(fromServer(evt.request))).catch();
    evt.waitUntil(update(evt.request).catch());
  }
});


function precache() {
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll(precacheFiles);
  });
}

function update(request) {
  //this is where we call the server to get the newest version of the
  //file to use the next time we show view
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response);
    });
  });
}

function fromCache(request) {
  //we pull files from the cache first thing so we can show them fast
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if(!matching || matching.status == 404) {
        return cache.match('/main');
      } else {
        return matching;
      }
    });
  });
}

function fromServer(request){
  //this is the fallback if it is not in the cache to go to the server and get it
  return fetch(request).then(function (response){return response});
}

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
