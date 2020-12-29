import Vue from "vue";
import Vuex from "vuex";
import ls from "store";

import addDays from "date-fns/add_days";
import getHours from "date-fns/get_hours";
import isSaturday from "date-fns/is_saturday";
import isSunday from "date-fns/is_sunday";
import getMonth from "date-fns/get_month";
import getYear from "date-fns/get_year";
import getDate from "date-fns/get_date";

Vue.use(Vuex);

const defaultState = {
  dnevnikData: null,
  offlineDnevnik: null,
  dnevnikLoad: true,
  statsData: null,
  statsLoad: true,
  feedData: null,
  feedLoad: true,
  userData: null,
  isLoggedIn: false,
  apiKey: null
};

let keyStampList = [];

(function() {
  let keyStampObj = {};
  let cachedKeysList = [];

  ls.each((value, key) => {
    if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
      cachedKeysList.push(key);
    }
  });

  let timeStampList = cachedKeysList.map(item => ls.get(`${item}:ts`));

  cachedKeysList.forEach((value, index) => {
    keyStampObj[value] = timeStampList[index];
  });

  for (let [key, value] of Object.entries(keyStampObj)) {
    keyStampList.push({ key: key, value: value });
  }

  keyStampList.sort((a, b) => {
    if (a.value > b.value) {
      return 1;
    } else if (a.value < b.value) {
      return -1;
    } else {
      return 0;
    }
  });
})();

function cacheClearCheck() {
  if (keyStampList.length > 4) {
    let oldEntry = keyStampList[0];
    let oldKey = oldEntry.key;
    let oldTS = `${oldKey}:ts`;

    ls.remove(oldKey);
    ls.remove(oldTS);
    keyStampList = keyStampList.slice(1);
  }
}

function getQuery(url) {
  let queryParams = {};

  url
    .split("?")[1]
    .split("&")
    .forEach(i => {
      queryParams[i.split("=")[0]] = i.split("=")[1];
    });

  return queryParams;
}

function cachedFetch(url, options) {
  let cacheKey = getQuery(url).startDate;
  let cached = ls.get(cacheKey);

  if (cached && navigator.onLine) {
    let cacheTimeStamp = ls.get(`${cacheKey}:ts`);
    let timeDifference = (Date.now() - cacheTimeStamp) / (1000 * 60);

    if (timeDifference >> 0 < 15) {
      let response = new Response(new Blob([cached]));
      return Promise.resolve(response);
    }
  } else if (cached && !navigator.onLine) {
    let response = new Response(new Blob([cached]));
    return Promise.resolve(response);
  } else if (!cached && !navigator.onLine) {
    let response = new Response(new Blob(["false"]));
    return Promise.resolve(response);
  }

  return fetch(url, options).then(response => {
    if (response.ok) {
      let ct = response.headers.get("Content-Type");

      if (ct && ct.match(/application\/json/i)) {
        response
          .clone()
          .text()
          .then(content => {
            let cacheTimeStamp = Date.now();

            ls.set(cacheKey, content);
            ls.set(`${cacheKey}:ts`, cacheTimeStamp);

            if (cached) {
              let existingKey = keyStampList.filter(
                item => item.key === cacheKey
              );
              let existingKeyIndex = keyStampList.indexOf(existingKey[0]);

              existingKey[0].value = cacheTimeStamp;
              keyStampList.splice(existingKeyIndex, 1);
              keyStampList.push(existingKey[0]);
            } else {
              keyStampList.push({ key: cacheKey, value: cacheTimeStamp });
              cacheClearCheck();
            }
          });
      }
    }

    return response;
  });
}

const store = new Vuex.Store({
  state: defaultState,
  getters: {
    dnevnikData: state => state.dnevnikData,
    offlineDnevnik: state => state.offlineDnevnik,
    statsData: state => state.statsData,
    feedData: state => state.feedData,
    userData: state => state.userData,
    isLoggedIn: state => state.isLoggedIn,
    dnevnikLoad: state => state.dnevnikLoad,
    statsLoad: state => state.statsLoad,
    feedLoad: state => state.feedLoad
  },
  mutations: {
    setDefaultState() {
      for (let [key, value] of Object.entries(defaultState)) {
        ls.set(key, value);
      }
    },
    resetState() {
      if (navigator.onLine) {
        ls.clearAll();
        store.replaceState({});
      }
    },
    applyStateFromStorage() {
      let localState = defaultState.valueOf();

      ls.each((value, key) => {
        if (localState.hasOwnProperty(key)) {
          localState[key] = value;
        }
      });

      store.replaceState(localState);
    }
  },
  actions: {
    login({ commit, state }, accessToken) {
      fetch(
        "https://api.dnevnik.ru/v2/users/me/context",
        {
          headers: { "Access-Token": accessToken },
          credentials: "same-origin"
        }
      ).then(response => {
        if (response.ok) {
          response.json().then(userData => {
            if (
              userData.roles !== undefined &&
              userData.roles.includes("EduStudent")
            ) {
              commit("setDefaultState");

              state["apiKey"] = accessToken;
              state["userData"] = userData;
              state["isLoggedIn"] = true;

              ls.set("apiKey", accessToken);
              ls.set("userData", userData);
              ls.set("isLoggedIn", true);
            }
          });
        }
      });
    },
    fetchUserData({ commit, state }, router) {
      if (!state.isLoggedIn) {
        return;
      }

      fetch(
        "https://api.dnevnik.ru/v2/users/me/context",
        {
          headers: { "Access-Token": state.apiKey },
          credentials: "same-origin"
        }
      ).then(response => {
        if (response.ok) {
          response.json().then(userData => {
            state["userData"] = userData;
            ls.set("userData", userData);
          });
        } else if ((response.status / 100) >> 0 === 4) {
          commit("resetState");
          router.replace({ name: "home" });
        }
      });
    },
    fetchStats({ state }) {
      if (!state.isLoggedIn) {
        return;
      }

      fetch(
        `https://api.dnevnik.ru/mobile/v2/allMarks?personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}`,
        {
          headers: { "Access-Token": state.apiKey },
          credentials: "same-origin"
        }
      ).then(
        response => {
          if (response.ok) {
            response.json().then(statsJson => {
              state["statsData"] = statsJson;
              state["statsLoad"] = false;

              ls.set("statsData", statsJson);
            });
          } else {
            state["statsLoad"] = false;
          }
        },
        () => {
          state["statsLoad"] = false;
        }
      );
    },
    fetchFeed({ state }) {
      if (!state.isLoggedIn) {
        return;
      }

      let dateCurrent = new Date();

      let day = ("0" + getDate(dateCurrent)).slice(-2);
      let month = ("0" + (getMonth(dateCurrent) + 1)).slice(-2);
      let year = getYear(dateCurrent);

      fetch(
        `https://api.dnevnik.ru/mobile/v2/feed/?date=${year}-${month}-${day}&limit=1&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}`,
        {
          headers: { "Access-Token": state.apiKey },
          credentials: "same-origin"
        }
      ).then(
        response => {
          if (response.ok) {
            response.json().then(feedJson => {
              state["feedData"] = feedJson;
              state["feedLoad"] = false;

              ls.set("feedData", feedJson);
            });
          } else {
            state["feedLoad"] = false;
          }
        },
        () => {
          state["feedLoad"] = false;
        }
      );
    },
    fetchDnevnik({ state }, amount) {
      if (!state.isLoggedIn) {
        return;
      }

      let dateCurrent = new Date();
      let dateFormatted = null;

      switch (true) {
        case isSunday(dateCurrent):
          dateFormatted = addDays(addDays(dateCurrent, 1), amount);
          break;

        case isSaturday(dateCurrent):
          if (getHours(dateCurrent) < 14) {
            dateFormatted = addDays(dateCurrent, amount);
          } else {
            dateFormatted = addDays(addDays(dateCurrent, 2), amount);
          }

          break;

        default:
          if (getHours(dateCurrent) < 15) {
            dateFormatted = addDays(dateCurrent, amount);
          } else {
            dateFormatted = addDays(addDays(dateCurrent, 1), amount);
          }

          break;
      }

      let day = ("0" + getDate(dateFormatted)).slice(-2);
      let month = ("0" + (getMonth(dateFormatted) + 1)).slice(-2);
      let year = getYear(dateFormatted);

      if (amount === 0) {
        fetch(
          `https://api.dnevnik.ru/mobile/v2/schedule?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}`,
          {
            headers: { "Access-Token": state.apiKey },
            credentials: "same-origin"
          }
        ).then(
          response => {
            if (response.ok) {
              response.json().then(dnevnikJson => {
                state["offlineDnevnik"] = dnevnikJson;
                state["dnevnikData"] = dnevnikJson;
                state["dnevnikLoad"] = false;

                ls.set("offlineDnevnik", dnevnikJson);
              });
            } else {
              state["dnevnikData"] = state["offlineDnevnik"];
              state["dnevnikLoad"] = false;
            }
          },
          () => {
            state["dnevnikData"] = state["offlineDnevnik"];
            state["dnevnikLoad"] = false;
          }
        );
      } else {
        cachedFetch(
          `https://api.dnevnik.ru/mobile/v2/schedule?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}`,
          {
            headers: { "Access-Token": state.apiKey },
            credentials: "same-origin"
          }
        ).then(
          response => {
            if (response.ok) {
              response.json().then(dnevnikJson => {
                if (!dnevnikJson) {
                  ls.set("switchFailed", true);
                  return;
                }

                state["dnevnikData"] = dnevnikJson;
                state["dnevnikLoad"] = false;
              });
            } else {
              state["dnevnikData"] = state["offlineDnevnik"];
              state["dnevnikLoad"] = false;
            }
          },
          () => {
            state["dnevnikData"] = state["offlineDnevnik"];
            state["dnevnikLoad"] = false;
          }
        );
      }
    }
  }
});

export default store;
