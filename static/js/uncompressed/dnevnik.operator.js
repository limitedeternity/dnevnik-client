"use strict";

/*jshint esversion: 6 */

(() => {

  if (location.pathname == "/") {
      if (Cookies.get('Offset') === undefined) {
        Cookies.set("Offset", -new Date().getTimezoneOffset() / 60, { expires: 2592000, secure: true });
      }

      if (Cookies.get('AccessToken') !== undefined) {
        whenDomReady().then(() => {
          document.getElementById("nav").innerHTML = '<a href="#overview" class="mdl-layout__tab is-active">Загрузка...</a>';
          document.getElementById("text").innerHTML = "<div class='loader'>Loading...</div>";
          location.replace("/main");
        });

      } else if (location.href.includes("#access_token=")) {
        Cookies.set('AccessToken_Temp', location.href.split("/")[location.href.split("/").length - 1].split("=")[location.href.split("/")[location.href.split("/").length - 1].split("=").length - 2].replace("&state", ""), { expires: 2592000, secure: true });
        location.replace("/login");

      } else {

        whenDomReady().then(() => {
          document.getElementById("button-login").addEventListener("click", (event) => {
              event.preventDefault();

              if (navigator.onLine) {
                  alert("Если после того, как залогинились, ничего не произошло, просто несколько раз обновите страницу. Обновление страницы также поможет, если вдруг столкнетесь с чем-то непредвиденным.");
                  location.href = "https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo&redirect_uri=https://dnevnik-client.herokuapp.com/";

              } else {
                  alert("Оффлайн ¯\_(ツ)_/¯");
              }
          });
        });
      }

  } else if (location.pathname == "/main") {
    let promiseChain = [];

    const sleep = (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const serialize = (formElement) => {
      let object = {};
      let formdata = new FormData(formElement);

      formdata.forEach((value, key) => {
          object[key] = value;
      });

      return JSON.stringify(object);
    }

    if (navigator.onLine) {

      var dnevnikError = false;
      promiseChain.push(
        fetch("/dnevnik", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({".": "1"}), credentials: 'same-origin'}).then((response) => {
              return response.json();
            }).then((json) => {
              if (json.includes("¯\_(ツ)_/¯")) {
                localforage.setItem('dnevnikError', json)
                dnevnikError = true;
              } else {
                localforage.setItem('dnevnik', json)
              }
            }).then(() => {
              whenDomReady.resume();
            }).then(() => {
              if (dnevnikError) {
                localforage.getItem('dnevnikError').then((data) => {
                  document.getElementById("dnevnik-out").innerHTML = data;
                })
                localforage.removeItem('dnevnikError')
              } else {
                localforage.getItem('dnevnik').then((data) => {
                  document.getElementById("dnevnik-out").innerHTML = data;
                })
              }
            })
      );

      var statsError = false;
      promiseChain.push(
        fetch("/stats", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({".": "1"}), credentials: 'same-origin'}).then((response) => {
            return response.json();
          }).then((json) => {
            if (json.includes("¯\_(ツ)_/¯")) {
              localforage.setItem('statsError', json)
              statsError = true;
            } else {
              localforage.setItem('stats', json)
            }
          }).then(() => {
            whenDomReady.resume();
          }).then(() => {
            if (statsError) {
              localforage.getItem('statsError').then((data) => {
                document.getElementById("stats-out").innerHTML = data;
              })
              localforage.removeItem('statsError')
            } else {
              localforage.getItem('stats').then((data) => {
                document.getElementById("stats-out").innerHTML = data;
              })
            }
          })
      );

    } else {
      localforage.getItem('stats').then((data) => {
        if (data === null) {
          promiseChain.push(
            whenDomReady().then(() => {
              document.getElementById("stats-out").innerHTML = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Вы в оффлайне :> </div>';
            })
          );

        } else {
          promiseChain.push(
            whenDomReady().then(() => {
              localforage.getItem('stats').then((data) => {
                document.getElementById("stats-out").innerHTML = data;
              });
            })
          );

        }
      });

      localforage.getItem('dnevnik').then((data) => {
        if (data === null) {
          promiseChain.push(
            whenDomReady().then(() => {
              document.getElementById("dnevnik-out").innerHTML = '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Вы в оффлайне :> </div>';
            })
          );

        } else {
          promiseChain.push(
            whenDomReady().then(() => {
              localforage.getItem('dnevnik').then((data) => {
                document.getElementById("dnevnik-out").innerHTML = data;
              });
            })
          );
        }
      });
    }

    Promise.all(promiseChain).catch((error) => {console.log(error)});

    whenDomReady().then(() => {
      document.getElementById("dnevnik-date").addEventListener("submit", (event) => {
          event.preventDefault();
          let form = event.target;

          if (!navigator.onLine) {return;}
          document.getElementById("dnevnik-out").innerHTML = "<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>";

          fetch("/dnevnik", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: serialize(form), credentials: 'same-origin'}).then((response) => {
                return response.json();
              }).then((json) => {
                document.getElementById("dnevnik-out").innerHTML = json;
              })
      });

      document.getElementById("dnevnik-stats").addEventListener("submit", (event) => {
          event.preventDefault();
          let form = event.target;

          if (!navigator.onLine) {return;}
          document.getElementById("stats-out").innerHTML = "<h4 class='mdl-cell mdl-cell--12-col'>Статистика</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>";

          fetch("/stats", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: serialize(form), credentials: 'same-origin'}).then((response) => {
              return response.json();
            }).then((json) => {
              document.getElementById("stats-out").innerHTML = json;
            });
      });

      document.getElementById("dnevnik-settings").addEventListener("submit", (event) => {
          event.preventDefault();
          let form = event.target;

          if (!navigator.onLine) {return;}
          fetch("/apply", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: serialize(form), credentials: 'same-origin'}).then((response) => {
              return response.json();
            }).then(async (json) => {
            document.getElementById("error").innerHTML = json;

            if (json.includes("color:red;")) {
              await sleep(3000);
              document.getElementById("error").innerHTML = '';
              return;
            }

            setTimeout(() => {location.replace("/")}, 500);
          });
     });

     document.getElementById("logout").addEventListener("click", (event) => {
         event.preventDefault();

         if (navigator.onLine) {
             localforage.clear();
             if ('serviceWorker' in navigator) {
               navigator.serviceWorker.getRegistrations().then(function(t){t.forEach(function(t){t.unregister()})});
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
   });
  }

  HTMLDocument.prototype.__defineGetter__("write", () => {
      return null;
  });

})();
