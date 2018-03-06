/* eslint-disable */

module.exports = {
    globDirectory: '.',
    globPatterns: [
        'src/assets/**/*.{jpg,json,xml,png,ico,js,css}'
    ],
    swDest: 'sw.js',
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