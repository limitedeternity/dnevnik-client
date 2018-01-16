/*jshint esversion: 6 */

(() => {
  "use strict";

  if (location.pathname == "/") {
      if (Cookies.get('AccessToken') !== undefined) {
          location.replace("/main");

      } else if (location.href.includes("#access_token=")) {
        Cookies.set('AccessToken_Temp', location.href.split("/")[location.href.split("/").length - 1].split("=")[location.href.split("/")[location.href.split("/").length - 1].split("=").length - 2].replace("&state", ""),  { expires: 2592000, secure: true });
        location.replace("/login");

      } else {

        whenDomReady().then(() => {
          document.querySelector("#button-login").addEventListener("click", (event) => {
              event.preventDefault();

              if (navigator.onLine) {
                  location.href = "https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo&redirect_uri=https://dnevnik-client.herokuapp.com/";

              } else {
                  document.querySelector("#error").innerHTML = '<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:red;">Оффлайн ¯\_(ツ)_/¯</p>';
              }
          });
        });
      }

  } else if (location.pathname == "/main") {
    let promiseChain = [];
    if (navigator.onLine) {

      promiseChain.push(
        new Promise((resolve) => (Cookies.set("Offset", -new Date().getTimezoneOffset() / 60) && resolve())).then(() => {
          fetch("/dnevnik", {method: 'POST', headers: {'Content-Type': 'application/json'}}).then((response) => {
              return response.json();
            }).then((json) => {
            localforage.setItem('dnevnik', json).then(() => {
              whenDomReady().then(() => {
                localforage.getItem('dnevnik').then((data) => {
                  document.querySelector("#dnevnik-out").innerHTML = data;
                });
              });
            });
          });
        })
      );

      promiseChain.push(
        fetch("/stats", {method: 'POST', headers: {'Content-Type': 'application/json'}}).then((response) => {
            return response.json();
          }).then((json) => {
          localforage.setItem('stats', json).then(() => {
            whenDomReady().then(() => {
              localforage.getItem('stats').then((data) => {
                document.querySelector("#stats-out").innerHTML = data;
              });
            });
          });
        })
      );

    } else {
      localforage.getItem('stats').then((data) => {
        if (data === null) {
          promiseChain.push(
            whenDomReady().then(() => {
              document.querySelector("#stats-out").innerHTML = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Вы в оффлайне :> </div>';
            })
          );

        } else {
          promiseChain.push(
            whenDomReady().then(() => {
              localforage.getItem('stats').then((data) => {
                document.querySelector("#stats-out").innerHTML = data;
              });
            })
          );

        }
      });

      localforage.getItem('dnevnik').then((data) => {
        if (data === null) {
          promiseChain.push(
            whenDomReady().then(() => {
              document.querySelector("#dnevnik-out").innerHTML = '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Вы в оффлайне :> </div>';
            })
          );

        } else {
          promiseChain.push(
            whenDomReady().then(() => {
              localforage.getItem('dnevnik').then((data) => {
                document.querySelector("#dnevnik-out").innerHTML = data;
              });
            })
          );
        }
      });
    }

    Promise.all(promiseChain).catch((error) => {console.log(error)});

    whenDomReady().then(() => {
      document.querySelector("#dnevnik-date").addEventListener("submit", (event) => {
          event.preventDefault();
          let form = event.target;

          if (!navigator.onLine) {return;}
          document.querySelector("#dnevnik-out").innerHTML = "<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>";

          new Promise((resolve) => (Cookies.set("Offset", -new Date().getTimezoneOffset() / 60) && resolve())).then(() => {
            fetch("/dnevnik", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: serialize(form)}).then((response) => {
                return response.json();
              }).then((json) => {
              localforage.setItem('dnevnik', json).then(() => {
                localforage.getItem('dnevnik').then((data) => {
                    document.querySelector("#dnevnik-out").innerHTML = data;
                    setTimeout(() => {form.submit()}, 1000 * 60 * 4);
                });
              });
            });
          });
      });

      document.querySelector("#dnevnik-stats").addEventListener("submit", (event) => {
          event.preventDefault();
          let form = event.target;

          if (!navigator.onLine) {return;}
          document.querySelector("#stats-out").innerHTML = "<h4 class='mdl-cell mdl-cell--12-col'>Статистика</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>";

          fetch("/stats", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: serialize(form)}).then((response) => {
              return response.json();
            }).then((json) => {
            localforage.setItem('stats', json).then(() => {
              localforage.getItem('stats').then((data) => {
                document.querySelector("#stats-out").innerHTML = data;
              });
            });
          });
      });

      document.querySelector("#dnevnik-settings").addEventListener("submit", (event) => {
          event.preventDefault();
          let form = event.target;

          if (!navigator.onLine) {return;}
          fetch("/apply", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: serialize(form)}).then((response) => {
              return response.json();
            }).then((json) => {
            document.querySelector("#error").innerHTML(json);
            setTimeout(() => {location.replace("/")}, 500);
          });
     });

     document.querySelector("#logout").addEventListener("click", (event) => {
         event.preventDefault();

         if (navigator.onLine) {
             localforage.clear();
             location.replace("/logout");
         }
     });

     document.querySelector("#reset-storage").addEventListener("click", (event) => {
         event.preventDefault();

         if (navigator.onLine) {
             localforage.clear();
             location.reload();
         }
     });

     document.querySelector("#reset-sw").addEventListener("click", (event) => {
         event.preventDefault();

         if (navigator.onLine) {
           if ('serviceWorker' in navigator) {
             navigator.serviceWorker.getRegistrations().then(function(t){t.forEach(function(t){t.unregister()})});
             localforage.clear();
             location.replace("/logout");
           }
         }
     });
   });
  }

  HTMLDocument.prototype.__defineGetter__("write", () => {
      return null;
  });

})();
