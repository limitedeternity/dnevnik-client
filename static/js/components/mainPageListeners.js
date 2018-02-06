(() => {
  "use strict";

  const serialize = (formElement) => {
    let object = {};
    let formdata = new FormData(formElement);

    formdata.forEach((value, key) => {
      object[key] = value;
    });

    return JSON.stringify(object);
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      if (!navigator.serviceWorker.controller) {
        navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        }).then(() => {
          location.reload();
        });
      }
    });
  }

  whenDomReady().then(() => {
    let themeChanged = localStorage.getItem("themeChanged");
    if (themeChanged) {
      localStorage.removeItem("themeChanged");
      location.reload(true);
    }

    document.getElementById("dnevnik-date").addEventListener("submit", (event) => {
      event.preventDefault();
      let form = event.target;

      isOnline().then((online) => {
        if (online) {
          document.getElementById("dnevnik-out").innerHTML = "<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>";

          fetch("/dnevnik", {
            method: 'POST',
            redirect: 'follow',
            headers: {
              'Content-Type': 'application/json'
            },
            body: serialize(form),
            credentials: 'same-origin'

          }).then((responseDnevnik) => {
            return responseDnevnik.json();

          }).then((jsonDnevnik) => {
            document.getElementById("dnevnik-out").innerHTML = jsonDnevnik;
          })
        }
      });
    });

    document.getElementById("dnevnik-settings").addEventListener("submit", (event) => {
      event.preventDefault();
      let form = event.target;

      isOnline().then((online) => {
        if (online) {
          fetch("/apply", {
            method: 'POST',
            redirect: 'follow',
            headers: {
              'Content-Type': 'application/json'
            },
            body: serialize(form),
            credentials: 'same-origin'

          }).then((response) => {
            return response.json();

          }).then(async (json) => {
            document.getElementById("error").innerHTML = json;

            if (json.includes("color:red;")) {
              await sleep(3000);
              document.getElementById("error").innerHTML = '';
              return;
            }

            await sleep(500);
            localStorage.setItem("themeChanged", "1");
            location.reload(true);
          });
        }
      });
    });

    document.getElementById("logout").addEventListener("click", (event) => {
      event.preventDefault();

      isOnline().then((online) => {
        if (online) {
          localforage.clear();
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              registrations.forEach((registration) => {
                registration.unregister();
              })
            });
          }
          location.replace("/logout");
        }
      });
    });

    document.getElementById("reset-storage").addEventListener("click", (event) => {
      event.preventDefault();

      isOnline().then((online) => {
        if (online) {
          localforage.clear();
          location.reload();
        }
      });
    });
  })
})();
