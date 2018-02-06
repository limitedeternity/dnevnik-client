(() => {
  "use strict";

  var isOnline = () => {
    return new Promise((resolve, reject) => {
      return fetch("/up").then(() => {
        resolve(true)
      }, () => {
        resolve(false)
      });
    });
  }

  var sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    });
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    switch (event.data) {
      case "syncFinished":
        let nextPromiseChain = [];
        nextPromiseChain.push(
          whenDomReady().then(() => {
            localforage.getItem('statsError').then(async (errStats) => {
              if (errStats) {
                document.getElementById("stats-out").innerHTML = errStats;
                localforage.removeItem('statsError')
                await sleep(2000);
              }
              localforage.getItem('stats').then((dataStats) => {
                if (dataStats) {
                  document.getElementById("stats-out").innerHTML = dataStats;
                } else {
                  document.getElementById("stats-out").innerHTML = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные еще не загружены ¯\\_(ツ)_/¯</h5>Обновите страницу или вернитесь позднее :> </div>';
                }
              })
            })
          })
        );
        nextPromiseChain.push(
          whenDomReady().then(() => {
            localforage.getItem('dnevnikError').then(async (errDnevnik) => {
              if (errDnevnik) {
                document.getElementById("dnevnik-out").innerHTML = errDnevnik;
                localforage.removeItem('dnevnikError')
                await sleep(2000);
              }
              localforage.getItem('dnevnik').then((dataDnevnik) => {
                if (dataDnevnik) {
                  document.getElementById("dnevnik-out").innerHTML = dataDnevnik;
                } else {
                  document.getElementById("dnevnik-out").innerHTML = '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные еще не загружены ¯\\_(ツ)_/¯</h5>Обновите страницу или вернитесь позднее :> </div>';
                }
              })
            })
          })
        );
        nextPromiseChain.push(
          whenDomReady().then(() => {
            localforage.getItem('feedError').then(async (errFeed) => {
              if (errFeed) {
                document.getElementById("feed-data").innerHTML = errFeed;
                localforage.removeItem('feedError')
                await sleep(2000);
              }
              localforage.getItem('feed').then((dataFeed) => {
                if (dataFeed) {
                  document.getElementById("feed-data").innerHTML = dataFeed;
                } else {
                  document.getElementById("feed-data").innerHTML = '<h4>О проекте</h4>DnevnikClient - облегченная версия Дневник.Ру, расчитанная на просмотр данных, помещенная в рамки Material Design. Клиент предоставляет функционал ровно в такой мере, которая требуется ученикам. Без тяжелого обвеса вроде ReactJS, избыточных элементов интерфейса и функционала "соцсети". <br> Ничего лишнего. <br>Исходный код доступен в моем <a href="https://github.com/limitedeternity/dnevnik-client/" target="_blank" rel="noopener">репозитории GitHub</a>. <br>By <a href="https://github.com/limitedeternity/" target="_blank" rel="noopener">@limitedeternity</a>';
                }
              })
            })
          })
        );
        Promise.all(nextPromiseChain);
        break;

      default:
        break;
    }
  });

  if (navigator.serviceWorker.controller) {
    isOnline().then((online) => {
      if (online) {
        navigator.serviceWorker.controller.postMessage("startSync");

      } else {
        navigator.serviceWorker.controller.postMessage("restoreData");
      }
    });
  }
})();
