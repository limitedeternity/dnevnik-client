(() => {
  "use strict";

  var sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  var serialize = (formElement) => {
    let object = {};
    let formdata = new FormData(formElement);

    formdata.forEach((value, key) => {
        object[key] = value;
    });

    return JSON.stringify(object);
  }

  whenDomReady().then(() => {
    document.getElementById("dnevnik-date").addEventListener("submit", (event) => {
        event.preventDefault();
        let form = event.target;

        if (!navigator.onLine) {return;}

        document.getElementById("dnevnik-out").innerHTML = "<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>";

        fetch("/dnevnik", {method: 'POST', redirect: 'follow', headers: {'Content-Type': 'application/json'}, body: serialize(form), credentials: 'same-origin'}).then((responseDnevnik) => {
              return responseDnevnik.json();
            }).then((jsonDnevnik) => {
              document.getElementById("dnevnik-out").innerHTML = jsonDnevnik;
            })
    });

    document.getElementById("dnevnik-settings").addEventListener("submit", (event) => {
        event.preventDefault();
        let form = event.target;

        if (!navigator.onLine) {return;}

        fetch("/apply", {method: 'POST', redirect: 'follow', headers: {'Content-Type': 'application/json'}, body: serialize(form), credentials: 'same-origin'}).then((response) => {
            return response.json();
          }).then(async (json) => {
          document.getElementById("error").innerHTML = json;

          if (json.includes("color:red;")) {
            await sleep(3000);
            document.getElementById("error").innerHTML = '';
            return;
          }

          await sleep(500);
          location.replace("/");
        });
   });

   document.getElementById("logout").addEventListener("click", (event) => {
       event.preventDefault();
       if (navigator.onLine) {
           localforage.clear();
           if (navigator.serviceWorker.controller) {
             navigator.serviceWorker.getRegistrations().then((t) => {t.forEach((k) => {k.unregister()})});
           }
           location.replace("/logout");
       }
   });

   document.getElementById("reset-storage").addEventListener("click", (event) => {
       event.preventDefault();
       if (navigator.onLine) {
           localforage.clear();
           location.reload();
       }
   });
  })
})();
