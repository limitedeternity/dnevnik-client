importScripts('/js/cache-polyfill.js');

self.addEventListener('install', function(event) {
  event.waitUntil(preLoad());
});

var preLoad = function(){
  return caches.open('dnevnik-sw').then(function(cache) {

  return cache.addAll([
              '/',
              '/main',
              '/css/material.deep_orange-blue.min.css',
              '/css/styles-deep_orange.css',
              '/css/material.deep_purple-blue.min.css',
              '/css/styles-deep_purple.css',
              '/css/material.teal-blue.min.css',
              '/css/styles-teal.css',
              '/css/material.pink-blue.min.css',
              '/css/styles-pink.css',
              '/css/md_icons.css',
              '/css/Roboto.css',
              '/js/dnevnik.operator.js',
              '/js/js.cookie.min.js',
              '/js/jquery.min.js',
              '/js/material.min.js',
              '/js/jquery.longpress.js',
              '/config/browserconfig.xml',
              '/config/manifest.json',
              '/fonts/md_icons.woff2',
              '/fonts/Black/Roboto-Black.woff',
              '/fonts/Black/Roboto-Black.woff2',
              '/fonts/Bold/Roboto-Bold.woff',
              '/fonts/Bold/Roboto-Bold.woff2',
              '/fonts/BoldItalic/Roboto-BoldItalic.woff',
              '/fonts/BoldItalic/Roboto-BoldItalic.woff2',
              '/fonts/Light/Roboto-Light.woff',
              '/fonts/Light/Roboto-Light.woff2',
              '/fonts/Medium/Roboto-Medium.woff',
              '/fonts/Medium/Roboto-Medium.woff2',
              '/fonts/Regular/Roboto-Regular.woff',
              '/fonts/Regular/Roboto-Regular.woff2',
              '/fonts/Thin/Roboto-Thin.woff',
              '/fonts/Thin/Roboto-Thin.woff2'
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

