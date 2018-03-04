/* eslint-disable */

module.exports = {
  globDirectory: '.',
  globPatterns: [
    'dist/*.jpg',
    'src/assets/**/*.{jpg,json,xml,png,ico}'
  ],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true,
  importWorkboxFrom: 'cdn',
  runtimeCaching: [
    {
      urlPattern: new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'),
      handler: 'cacheFirst',
      options: {
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: '/',
      handler: 'staleWhileRevalidate',
      options: {
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /src\/assets\/.+\/.+\.(?:css|js)(?:\.br|\.gz|)$/,
      handler: 'cacheFirst',
      options: {
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /dist\/.+\.js(?:\.gz|\.br|)$/,
      handler: 'staleWhileRevalidate',
      options: {
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
};