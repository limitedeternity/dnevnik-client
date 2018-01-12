importScripts('/js/cache-polyfill.js');

self.addEventListener('install', function(event) {
  event.waitUntil(preLoad());
});

var preLoad = function(){
  return caches.open('dnevnik-sw').then(function(cache) {

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

self.addEventListener('fetch', function(event) {
  event.respondWith(checkResponse(event.request).catch(function() {
    return returnFromCache(event.request);}
  ));
  event.waitUntil(addToCache(event.request));
});

var checkResponse = function(request){
  return new Promise(function(fulfill, reject) {
    fetch(request).then(function(response){
      if(response.status !== 404) {
        fulfill(response);
      } else {
        reject();
      }
    }, reject);
  });
};

var addToCache = function(request){
  return caches.open('dnevnik-sw').then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response);
    });
  });
};

var returnFromCache = function(request){
  return caches.open('dnevnik-sw').then(function (cache) {
    return cache.match(request).then(function (matching) {
     if(!matching || matching.status == 404) {
       return cache.match('/main');
     } else {
       return matching;
     }
    });
  });
};

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
