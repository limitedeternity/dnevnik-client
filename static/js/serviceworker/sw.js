importScripts('/js/libs/localforage.min.js', 'https://storage.googleapis.com/workbox-cdn/releases/3.0.0-beta.0/workbox-sw.js');

workbox.core.setLogLevel(workbox.core.LOG_LEVELS.warn);
workbox.routing.registerRoute(
  new RegExp('\/js\/(?:libs|ui)\/.*\.js'),
  workbox.strategies.cacheFirst({
    cacheName: 'js-deps',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
    cacheableResponse: {
      statuses: [0, 200]
    }
  })
);

workbox.routing.registerRoute(
  new RegExp('\/css\/.*\.css'),
  workbox.strategies.cacheFirst({
    cacheName: 'styles',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 4,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
    cacheableResponse: {
      statuses: [0, 200]
    }
  })
);

workbox.routing.registerRoute(
  new RegExp('\/images\/.*\.(?:png|ico)'),
  workbox.strategies.cacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 5,
      }),
    ],
    cacheableResponse: {
      statuses: [0, 200]
    }
  })
);

workbox.routing.registerRoute(
  new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'),
  workbox.strategies.cacheFirst({
    cacheName: 'fonts',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 5,
      }),
    ],
    cacheableResponse: {
      statuses: [0, 200]
    }
  })
);

workbox.routing.registerRoute(
  new RegExp('\/js\/components\/.*\.js'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'js-components',
    cacheableResponse: {
      statuses: [0, 200]
    }
  })
);

workbox.routing.registerRoute(
  new RegExp('\/(?:main|home)'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'routes',
    cacheableResponse: {
      statuses: [0, 200]
    }
  })
);

workbox.routing.registerRoute(
  new RegExp('\/config\/.*'),
  workbox.strategies.cacheFirst({
    cacheName: 'manifests',
    cacheableResponse: {
      statuses: [0, 200]
    }
  })
);

workbox.routing.registerRoute(
  new RegExp('\/(?:dnevnik|stats|feed|login|logout|up|apply)'),
  workbox.strategies.networkOnly(),
);

self.addEventListener('install', (event) => {
  return self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  /* console.log(event); */
});

self.addEventListener('message', (event) => {
  switch (event.data) {
    case "startSync":
      event.waitUntil(fetchSync(event.source));
      break;

    case "restoreData":
      event.source.postMessage("syncFinished");
      break;

    default:
      break;
  }
});

const fetchSync = (source, send=true) => {
  let promiseChain = [];

  promiseChain.push(
    fetch("/feed", {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ".": "1"
      }),
      credentials: 'same-origin'

    }).then((responseFeed) => {
      return responseFeed.json();

    }).then((jsonFeed) => {
      if (jsonFeed.includes("¯\\_(ツ)_/¯")) {
        return localforage.setItem('feedError', jsonFeed)
      } else {
        return localforage.setItem('feed', jsonFeed)
      }
    })
  );

  promiseChain.push(
    fetch("/dnevnik", {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ".": "1"
      }),
      credentials: 'same-origin'

    }).then((responseDnevnik) => {
      return responseDnevnik.json();

    }).then((jsonDnevnik) => {
      if (jsonDnevnik.includes("¯\\_(ツ)_/¯")) {
        return localforage.setItem('dnevnikError', jsonDnevnik)
      } else {
        return localforage.setItem('dnevnik', jsonDnevnik)
      }
    })
  );

  promiseChain.push(
    fetch("/stats", {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ".": "1"
      }),
      credentials: 'same-origin'

    }).then((responseStats) => {
      return responseStats.json();

    }).then((jsonStats) => {
      if (jsonStats.includes("¯\\_(ツ)_/¯")) {
        return localforage.setItem('statsError', jsonStats)
      } else {
        return localforage.setItem('stats', jsonStats)
      }
    })
  );

  return Promise.all(promiseChain).then(() => {
    return localforage.getItem('pushSettings').then((data) => {
      if (data) {
        fetch('/push', {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "pushSettings": JSON.stringify(data)
          }),
          credentials: 'same-origin'
        });
      }
      
      if (send) {
        return new Promise((resolve, reject) => {
          resolve(source.postMessage("syncFinished"));
        });
      }
    })
  })
}

self.addEventListener('push', (event) => {
  localforage.getItem("pushData").then((data) => {
    if (!(data === event.data.text())) {
      let title = 'Сводка';
      let options = {
        body: event.data.text(),
        icon: '/images/android-icon-96x96.png',
        badge: '/images/android-icon-96x96.png',
        vibrate: [200, 400],
      };
      localforage.setItem("pushData", event.data.text())
      event.waitUntil(self.registration.showNotification(title, options));
    }
  })
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
