importScripts('/js/uncompressed/localforage.min.js');

self.addEventListener('install', (event) => {
  console.log("Installing ServiceWorker...");
  event.waitUntil(preLoad());
  console.log("Installation finished.");
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

const fetchSync = (source) => {
  let promiseChain = [];

  promiseChain.push(
    fetch("/feed", {method: 'POST', redirect: 'follow', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({".": "1"}), credentials: 'same-origin'}).then((responseFeed) => {
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
    fetch("/dnevnik", {method: 'POST', redirect: 'follow', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({".": "1"}), credentials: 'same-origin'}).then((responseDnevnik) => {
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
    fetch("/stats", {method: 'POST', redirect: 'follow', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({".": "1"}), credentials: 'same-origin'}).then((responseStats) => {
      return responseStats.json();
    }).then((jsonStats) => {
      if (jsonStats.includes("¯\\_(ツ)_/¯")) {
        return localforage.setItem('statsError', jsonStats)
      } else {
        return localforage.setItem('stats', jsonStats)
      }
    })
  );

  return fetch('/up').then(() => {
    return Promise.all(promiseChain).then(() => {
      return localforage.getItem('pushSettings').then((data) => {
        return fetch('/push', {method: 'POST', redirect: 'follow', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"pushSettings": JSON.stringify(data)}), credentials: 'same-origin'}).then(() => {
          return new Promise((resolve, reject) => {
            resolve(source.postMessage("syncFinished"));
          });
        })
      })
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

  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then((clientList) => {
    for (let i = 0; i < clientList.length; i++) {
      let client = clientList[i];
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});

const preLoad = () => {
  return caches.open('dnevnik-sw').then((cache) => {
  return cache.addAll([
              '/',
              '/main',
              '/css/material.deep_orange-blue.min.css.br',
              '/css/styles-deep_orange.css.br',
              '/css/material.deep_purple-blue.min.css.br',
              '/css/styles-deep_purple.css.br',
              '/css/material.teal-blue.min.css.br',
              '/css/styles-teal.css.br',
              '/css/material.pink-blue.min.css.br',
              '/css/styles-pink.css.br',
              '/css/md_icons.css.br',
              '/css/Roboto.css.br',
              '/js/compressed.js.br',
              '/js/uncompressed/localforage.min.js',
              '/js/material.min.js.br',
              '/config/browserconfig.xml',
              '/config/manifest.json',
              '/fonts/md_icons.woff2',
              '/fonts/Medium/Roboto-Medium.woff2',
              '/fonts/Regular/Roboto-Regular.woff2'
    ]);
  });
};

self.addEventListener('fetch', (event) => {
  let checkFirstEndps = ["/up", "/login", "/main"];

  let isCheckFirst = (element) => {
    return event.request.url === self.location.origin + element;
  }

  if (checkFirstEndps.some(isCheckFirst) || event.request.method == 'POST') {
    event.respondWith(checkResponse(event.request).catch(() => {
      return returnFromCache(event.request);
    }));
  } else {
    event.respondWith(returnFromCache(event.request).catch(() => {
      return checkResponse(event.request);
    }));
  }

  event.waitUntil(addToCache(event.request));
});

const checkResponse = (request) => {
  return new Promise((fulfill, reject) => {
    fetch(request).then((response) => {
      if (response.status !== 404) {
        fulfill(response);
      } else {
        reject();
      }
    }, reject);
  });
};

const addToCache = (request) => {
  return caches.open('dnevnik-sw').then((cache) => {
    return fetch(request).then((response) => {
      return cache.put(request, response);
    });
  });
};

const returnFromCache = (request) => {
  return caches.open('dnevnik-sw').then((cache) => {
    return cache.match(request).then((matching) => {
     if(!matching || matching.status === 404) {
       return cache.match('/main');
     } else {
       return matching;
     }
    });
  });
};

self.addEventListener('activate', (event) => {
  let cacheWhitelist = [];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
