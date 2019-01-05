/* eslint-disable no-console */

const micro = require('micro');
const handler = require('serve-handler');

const server = micro(async (req, res) => {
  await handler(req, res, {
    public: './dist/',
    directoryListing: false,
    rewrites: [
      {
        source: '/',
        destination: '/index.html'
      }
    ],
    headers: [
      {
        source: '*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Download-Options', value: 'noopen' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Xss-Protection', value: '1; mode=block' }
        ]
      }
    ]
  });
});

console.log(`Starting to listen on ${process.env.PORT || 8080}`);
server.listen(process.env.PORT || 8080);
