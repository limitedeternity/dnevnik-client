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
        Cookies.set('AccessToken_Temp', location.href.match(new RegExp("#access_token=(.*)&state="))[1], { expires: 2592000, secure: true });
        location.replace("/login");

      } else {
        fetch("/up").then((response) => {
          console.log(response.json());
          whenDomReady.resume();
        }).then(() => {
          document.getElementById("button-login").addEventListener("click", (event) => {
              event.preventDefault();

              if (navigator.onLine) {
                  alert("Если после того, как залогинились, ничего не произошло, просто несколько раз обновите страницу. Обновление страницы также поможет, если вдруг столкнетесь с чем-то непредвиденным.");
                  location.href = "https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo,Messages&redirect_uri=https://dnevnik-client.herokuapp.com/";

              } else {
                  alert("Оффлайн ¯\\_(ツ)_/¯");
              }
          });
        });
      }

  } else if (location.pathname == "/main") {

    let promiseChain = [];

    const serialize = (formElement) => {
      let object = {};
      let formdata = new FormData(formElement);

      formdata.forEach((value, key) => {
          object[key] = value;
      });

      return JSON.stringify(object);
    }

    const sleep = (ms) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    const urlBase64ToUint8Array = (base64String) => {
      let padding = '='.repeat((4 - base64String.length % 4) % 4);
      let base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      let rawData = window.atob(base64);
      let outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.pushManager) {
            registration.pushManager.getSubscription().then((subsc) => {
              if (!subsc) {
                registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array("BPA5TPpI1kBquobW2MAKz-JqG0AiaTbKLIa3IzFtC7tM-gg_fqOyyg9DlFXi7cg_CEPeUTWiK0tn_Zc7IcOWrD0")
                }).then(() => {
                  console.log("Successfully subscribed to notifications.");
                  registration.pushManager.getSubscription().then((subscription) => {
                    let subscrJSON = subscription.toJSON();
                    delete subscrJSON.expirationTime;
                    localforage.setItem("pushSettings", subscrJSON);
                  })
                })
              }
            })

            if (registration.periodicSync) {
              registration.periodicSync.getRegistrations().then((periodicReg) => {
                if (!periodicReg.length) {
                  registration.periodicSync.register({
                    tag: 'dnevnik-notif-periodic',
                    minPeriod: 60 * 1000 * 10,
                    powerState: 'auto',
                    networkState: 'any'
                  })
                }
              })
            } else if (registration.sync) {
              registration.sync.register('dnevnik-notif-sync')
            }
          }
        })
    }

    promiseChain.push(
      localforage.getItem('statsError').then(async (errStats) => {
        if (errStats) {
          document.getElementById("stats-out").innerHTML = errStats;
          localforage.removeItem('statsError')
          await sleep(2000);
        }
        return localforage.getItem('stats').then((dataStats) => {
          if (dataStats) {
            return document.getElementById("stats-out").innerHTML = dataStats;
          } else {
            return document.getElementById("stats-out").innerHTML = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные еще не загружены ¯\\_(ツ)_/¯</h5>Обновите страницу или вернитесь позднее :> </div>';
          }
        })
      })
    );

    promiseChain.push(
      localforage.getItem('dnevnikError').then(async (errDnevnik) => {
        if (errDnevnik) {
          document.getElementById("dnevnik-out").innerHTML = errDnevnik;
          localforage.removeItem('dnevnikError')
          await sleep(2000);
        }
        return localforage.getItem('dnevnik').then((dataDnevnik) => {
          if (dataDnevnik) {
            return document.getElementById("dnevnik-out").innerHTML = dataDnevnik;
          } else {
            return document.getElementById("dnevnik-out").innerHTML = '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные еще не загружены ¯\\_(ツ)_/¯</h5>Обновите страницу или вернитесь позднее :> </div>';
          }
        })
      })
    );

    promiseChain.push(
      localforage.getItem('feedError').then(async (errFeed) => {
        if (errFeed) {
          document.getElementById("feed-data").innerHTML = errFeed;
          localforage.removeItem('feedError')
          await sleep(2000);
        }
        return localforage.getItem('feed').then((dataFeed) => {
          if (dataFeed) {
            return document.getElementById("feed-data").innerHTML = dataFeed;
          } else {
            return document.getElementById("feed-data").innerHTML = '<h4>О проекте</h4>DnevnikClient - облегченная версия Дневник.Ру, расчитанная на просмотр данных, помещенная в рамки Material Design. Клиент предоставляет функционал ровно в такой мере, которая требуется ученикам. Без тяжелого обвеса вроде ReactJS, избыточных элементов интерфейса и функционала "соцсети". <br> Ничего лишнего. <br>Исходный код доступен в моем <a href="https://github.com/limitedeternity/dnevnik-client/" target="_blank" rel="noopener">репозитории GitHub</a>. <br>By <a href="https://github.com/limitedeternity/" target="_blank" rel="noopener">@limitedeternity</a>';
          }
        })
      })
    );

    whenDomReady().then(() => {
      return Promise.all(promiseChain).then(() => {
        document.getElementById("dnevnik-date").addEventListener("submit", (event) => {
            event.preventDefault();
            let form = event.target;

            if (!navigator.onLine) {
              return;
            }

            document.getElementById("dnevnik-out").innerHTML = "<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>";

            fetch("/dnevnik", {method: 'POST', redirect: 'follow', headers: {'Content-Type': 'application/json'}, body: serialize(form), credentials: 'same-origin'}).then((responseDnevnik) => {
                  return response.json();
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
               if ('serviceWorker' in navigator) {
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

       if (Notification.permission !== 'denied' || Notification.permission === "default") {
         Notification.requestPermission();
       }
      })
    });
  }

  HTMLDocument.prototype.__defineGetter__("write", () => {
      return null;
  });

})();
