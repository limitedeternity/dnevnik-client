importScripts('/js/cache-polyfill.js');

var CACHE = 'dnevnik-sw';
var precacheFiles = [
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
];

self.addEventListener('install', function(evt) {
    evt.waitUntil(precache().then(function() {
        return self.skipWaiting();

    }));
});


self.addEventListener('activate', function(event) {
    return self.clients.claim();

});

self.addEventListener('fetch', function(evt) {
    evt.respondWith(fromCache(evt.request).catch(fromServer(evt.request)));
    evt.waitUntil(update(evt.request));
});

function precache() {
    return caches.open(CACHE).then(function(cache) {
        return cache.addAll(precacheFiles);
    });
}


function fromCache(request) {
    return caches.open(CACHE).then(function(cache) {
        return cache.match(request).then(function(matching) {
            return matching || Promise.reject('no-match');
        });
    });
}


function update(request) {
    return caches.open(CACHE).then(function(cache) {
        return fetch(request).then(function(response) {
            return cache.put(request, response);
        });
    });
}

function fromServer(request) {
    return fetch(request).then(function(response) {
        return response;
    });
}
