/* eslint-disable */

module.exports = {
  globDirectory: '.',
  globPatterns: [
    'dist/*.{jpg,js}',
    'src/assets/**/*.{jpg,json,xml,png,ico,js,css}'
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
      handler: 'cacheFirst',
      options: {
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
};