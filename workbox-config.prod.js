/* eslint-disable */

module.exports = {
  globDirectory: '.',
  globPatterns: [
    'dist/*.{jpg,js}',
    'src/assets/**/*.{json,xml,png,ico,js,css,woff2}'
  ],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true,
  importWorkboxFrom: 'cdn',
  runtimeCaching: [
    {
      urlPattern: /\/(#.+)?$/,
      handler: 'cacheFirst',
      options: {
        cacheName: 'main',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 7 * 24 * 60 * 60
        },
        cacheableResponse: {
          statuses: [0, 200]
        },
        plugins: [
          {cachedResponseWillBeUsed: ({ cache, request, cachedResponse }) => {
            var response = caches.match('/');
            if (response) {
              return response;

            } else {
              return false;
            }
          }}
        ]
      }
    }
  ]
};