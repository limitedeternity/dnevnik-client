module.exports = {
  globDirectory: ".",
  globPatterns: [
    "dist/*.jpg",
    "src/assets/**/*.{jpg,json,xml,css,png,ico,js}"
  ],
  swDest: "sw.js",
  clientsClaim: true,
  skipWaiting: true,
  importWorkboxFrom: 'cdn',
  runtimeCaching: [
    {
      urlPattern: new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'),
      handler: 'staleWhileRevalidate',
      options: {
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: new RegExp("dnevnik-client/$"),
      handler: 'staleWhileRevalidate',
      options: {
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: new RegExp("dist\/.+\.js$"),
      handler: 'staleWhileRevalidate',
      options: {
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
};