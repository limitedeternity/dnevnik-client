importScripts('workbox-sw.prod.v2.1.2.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use workbox-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "dist/nature.jpg",
    "revision": "9206b4a6d4f3401326e0e6297dfdf8af"
  },
  {
    "url": "dist/office.jpg",
    "revision": "f642206b67707e549bd18159506c4ad5"
  },
  {
    "url": "dist/stats.jpg",
    "revision": "57a957ab773f069f322b866b2224832e"
  },
  {
    "url": "src/assets/config/browserconfig.xml",
    "revision": "dcab0d220edb7fb4f6074bb2ba2dd051"
  },
  {
    "url": "src/assets/config/manifest.json",
    "revision": "85999836855c584db3c15fdcf396de0d"
  },
  {
    "url": "src/assets/css/materialize.min.css",
    "revision": "23d8c4b88560b38f875706ec49711781"
  },
  {
    "url": "src/assets/images/icons/android-icon-144x144.png",
    "revision": "affd9237be0a5e91a493d9b754a472f2"
  },
  {
    "url": "src/assets/images/icons/android-icon-192x192.png",
    "revision": "5d243aab4786cfa26e64f757538262e7"
  },
  {
    "url": "src/assets/images/icons/android-icon-36x36.png",
    "revision": "da4ca9bb96ab1d5e52c1b8136b8c8cc5"
  },
  {
    "url": "src/assets/images/icons/android-icon-48x48.png",
    "revision": "60a9e69fee94943b5f91df2c788b210a"
  },
  {
    "url": "src/assets/images/icons/android-icon-72x72.png",
    "revision": "11f80c791242b0e0ce3925bc0a7e32ba"
  },
  {
    "url": "src/assets/images/icons/android-icon-96x96.png",
    "revision": "ae026957cd415a5265e7b7781b2b8d27"
  },
  {
    "url": "src/assets/images/icons/apple-icon-114x114.png",
    "revision": "88e637caef63c56c0365981a34f649ca"
  },
  {
    "url": "src/assets/images/icons/apple-icon-120x120.png",
    "revision": "c451affdf6ceeea6de6fa1a679ff36ed"
  },
  {
    "url": "src/assets/images/icons/apple-icon-144x144.png",
    "revision": "affd9237be0a5e91a493d9b754a472f2"
  },
  {
    "url": "src/assets/images/icons/apple-icon-152x152.png",
    "revision": "21e4a74bf2c7283cfab9127d421d4d2d"
  },
  {
    "url": "src/assets/images/icons/apple-icon-180x180.png",
    "revision": "4fce646a0c114c0934098642128ca2cb"
  },
  {
    "url": "src/assets/images/icons/apple-icon-57x57.png",
    "revision": "0d38caf8a48da799971b03279219b808"
  },
  {
    "url": "src/assets/images/icons/apple-icon-60x60.png",
    "revision": "b8e51f1c2bbb16090236bcd7a5658633"
  },
  {
    "url": "src/assets/images/icons/apple-icon-72x72.png",
    "revision": "11f80c791242b0e0ce3925bc0a7e32ba"
  },
  {
    "url": "src/assets/images/icons/apple-icon-76x76.png",
    "revision": "45887dba1157e60722c27836a2d4110b"
  },
  {
    "url": "src/assets/images/icons/apple-icon-precomposed.png",
    "revision": "732bdd27b8cd5c3903fba22bb48fda46"
  },
  {
    "url": "src/assets/images/icons/apple-icon.png",
    "revision": "732bdd27b8cd5c3903fba22bb48fda46"
  },
  {
    "url": "src/assets/images/icons/favicon-16x16.png",
    "revision": "ee47fc01e729b84f02fb5238b2defe88"
  },
  {
    "url": "src/assets/images/icons/favicon-32x32.png",
    "revision": "48968d2de141a61ace009858e65f859b"
  },
  {
    "url": "src/assets/images/icons/favicon-96x96.png",
    "revision": "ae026957cd415a5265e7b7781b2b8d27"
  },
  {
    "url": "src/assets/images/icons/favicon.ico",
    "revision": "bf68e424691acb1e4be896ad4183b34f"
  },
  {
    "url": "src/assets/images/icons/ms-icon-144x144.png",
    "revision": "affd9237be0a5e91a493d9b754a472f2"
  },
  {
    "url": "src/assets/images/icons/ms-icon-150x150.png",
    "revision": "50d5b9c11d19d1d578a5521ebd922e1d"
  },
  {
    "url": "src/assets/images/icons/ms-icon-310x310.png",
    "revision": "b00dc2fd1ef02a2f7e5f5f04ef78fd18"
  },
  {
    "url": "src/assets/images/icons/ms-icon-70x70.png",
    "revision": "bb8f28007d19c7a63886df6e718b88c4"
  },
  {
    "url": "src/assets/images/nature.jpg",
    "revision": "9206b4a6d4f3401326e0e6297dfdf8af"
  },
  {
    "url": "src/assets/images/office.jpg",
    "revision": "f642206b67707e549bd18159506c4ad5"
  },
  {
    "url": "src/assets/images/stats.jpg",
    "revision": "57a957ab773f069f322b866b2224832e"
  },
  {
    "url": "src/assets/js/materialize.min.js",
    "revision": "32c46071d1dfe74999e6eb0a2a86aff7"
  }
];

const workboxSW = new self.WorkboxSW({
  "skipWaiting": true,
  "clientsClaim": true
});
workboxSW.precache(fileManifest);
workboxSW.router.registerRoute(/https:\/\/fonts.(?:googleapis|gstatic).com\/(.*)$/, workboxSW.strategies.staleWhileRevalidate({
  "cacheableResponse": {
    "statuses": [
      0,
      200
    ]
  }
}), 'GET');
workboxSW.router.registerRoute(/https:\/\/limitedeternity.github.io\/dnevnik-client\/$/, workboxSW.strategies.staleWhileRevalidate({
  "cacheableResponse": {
    "statuses": [
      0,
      200
    ]
  }
}), 'GET');
workboxSW.router.registerRoute(/dist\/.+.js$/, workboxSW.strategies.staleWhileRevalidate({
  "cacheableResponse": {
    "statuses": [
      0,
      200
    ]
  }
}), 'GET');
