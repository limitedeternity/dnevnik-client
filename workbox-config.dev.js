/* eslint-disable */

module.exports = {
    globDirectory: '.',
    globPatterns: [
        'src/assets/**/*.{json,xml,png,ico,js,css,woff2}'
    ],
    swDest: 'sw.js',
    clientsClaim: true,
    skipWaiting: true,
    importWorkboxFrom: 'cdn',
    runtimeCaching: [
        {
            urlPattern: '/',
            handler: 'networkFirst',
            options: {
                cacheableResponse: {
                    statuses: [0, 200]
                }
            }
        },
        {
            urlPattern: /dist\/.+$/,
            handler: 'networkFirst',
            options: {
                cacheableResponse: {
                    statuses: [0, 200]
                }
            }
        }
    ]
};