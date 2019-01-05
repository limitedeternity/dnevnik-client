module.exports = {
  runtimeCompiler: true,
  productionSourceMap: false,

  css: {
    extract: false
  },

  pwa: {
    name: 'DnevnikClient',
    themeColor: 'transparent',
    msTileColor: '#DA532C',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'transparent',
    iconPaths: {
      favicon16: 'img/icons/favicon-16x16.png',
      favicon32: 'img/icons/favicon-32x32.png',
      appleTouchIcon: 'img/icons/apple-touch-icon.png',
      maskIcon: 'img/icons/safari-pinned-tab.svg',
      msTileImage: '/img/icons/mstile-150x150.png'
    },
    workboxOptions: {
      swDest: './service-worker.js',
      clientsClaim: true,
      skipWaiting: true,
      importWorkboxFrom: 'cdn',
      runtimeCaching: [
        {
          urlPattern: /\/(#.+)?$/,
          handler: 'cacheOnly',
          options: {
            plugins: [
              {
                cachedResponseWillBeUsed: () => {
                  let response = caches.match('/index.html');

                  if (response) {
                    return response;

                  } else {
                    return false;
                  }
                }
              }
            ]
          }
        },
        {
          urlPattern: /^https:\/\/(?:cdn|qa)\.polyfill\.io\/(.*)/,
          handler: 'staleWhileRevalidate',
          options: {
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  }
};
