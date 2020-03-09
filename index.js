const { applyMiddleware } = require("micro-middleware");
const compress = require("micro-compress");
const handler = require("serve-handler");

let server = async (req, res) => {
  if (req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"] !== "https") {
    res.statusCode = 302;
    res.setHeader("Location", "https://" + req.headers.host + req.url);
    return res.end();
  }

  await handler(req, res, {
    public: "./dist/",
    directoryListing: false,
    rewrites: [
      {
        source: "/",
        destination: "/index.html"
      }
    ],
    headers: [
      {
        source: "*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Download-Options", value: "noopen" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Xss-Protection", value: "1; mode=block" }
        ]
      }
    ]
  });
};

module.exports = applyMiddleware(server, [compress]);
