import Vue from 'vue';
import Vuex from 'vuex';
import ls from 'store';

import addDays from 'date-fns/add_days'; 
import getHours from 'date-fns/get_hours'; 
import isSaturday from 'date-fns/is_saturday'; 
import isSunday from 'date-fns/is_sunday'; 
import getMonth from 'date-fns/get_month'; 
import getYear from 'date-fns/get_year'; 
import getDate from 'date-fns/get_date';

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

var keyStampList = [];

(() => {
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
        keyStampList.push({key: key, value: value});
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

const cacheClearCheck = () => {
    if (keyStampList.length > 4) {
        let oldEntry = keyStampList[0];
        let oldKey = oldEntry.key;
        let oldTS = `${oldKey}:ts`;

        ls.remove(oldKey);
        ls.remove(oldTS);
        keyStampList = keyStampList.slice(1);
    }
};

const genKey = (s) => {
    let queryParams = {};

    s.split('?')[1]
        .split('&')
        .forEach((i) => {
            queryParams[i.split('=')[0]] = i.split('=')[1];
        });

    let key = queryParams.startDate;
    return key;
};

const cachedFetch = (url, options) => {
    let cacheKey = genKey(url);
    let cached = ls.get(cacheKey);

    if (cached && navigator.onLine) {
        let cacheTimeStamp = ls.get(`${cacheKey}:ts`);
        let timeDifference = (Date.now() - cacheTimeStamp) / (1000 * 60);
        
        if (( timeDifference >> 0 ) < 15) {
            let response = new Response(new Blob([cached]));
            return Promise.resolve(response);
        }

    } else if (cached && !navigator.onLine) {
        let response = new Response(new Blob([cached]));
        return Promise.resolve(response);

    } else if (!cached && !navigator.onLine) {
        let response = new Response(new Blob(['false']));
        return Promise.resolve(response);
    }
  
    return fetch(url, options).then((response) => {
        if (response.ok) {
            let ct = response.headers.get('Content-Type');

            if (ct && ct.match(/application\/json/i)) {
                response.clone().text().then((content) => {
                    let cacheTimeStamp = Date.now();

                    ls.set(cacheKey, content);
                    ls.set(`${cacheKey}:ts`, cacheTimeStamp);

                    if (cached) {
                        let existingKey = keyStampList.filter(item => item.key === cacheKey);
                        let existingKeyIndex = keyStampList.indexOf(existingKey[0]);

                        existingKey[0].value = cacheTimeStamp;
                        keyStampList.splice(existingKeyIndex, 1);
                        keyStampList.push(existingKey[0]);

                    } else {
                        keyStampList.push({key: cacheKey, value: cacheTimeStamp});
                        cacheClearCheck();
                    }
                });
            }
        }

        return response;
    });
};

const deauthChecker = (jsonData) => {
    return ['invalidToken', 'apiRequestLimit'].some((elem) => {
        return (jsonData.hasOwnProperty('type') && jsonData['type'] === elem);
    });
};

const store = new Vuex.Store({
    state: defaultState,
    getters: {
        dnevnikData: (state) => state.dnevnikData,
        offlineDnevnik: (state) => state.offlineDnevnik,
        statsData: (state) => state.statsData,
        feedData: (state) => state.feedData,
        userData: (state) => state.userData,
        isLoggedIn: (state) => state.isLoggedIn,
        dnevnikLoad: (state) => state.dnevnikLoad,
        statsLoad: (state) => state.statsLoad,
        feedLoad: (state) => state.feedLoad
    },
    mutations: {
        fetchData() {
            let localState = defaultState;

            ls.each((value, key) => {
                localState[key] = value;
            });

            if (localState.isLoggedIn) {
                let promiseArray = [];

                promiseArray.push(
                    new Promise(() => {
                        let dateCurrent = new Date();
                        let dateFormatted = null;

                        switch (true) {
                        case isSunday(dateCurrent):
                            dateFormatted = addDays(dateCurrent, 1);
                            break;

                        case isSaturday(dateCurrent):
                            if (getHours(dateCurrent) < 14) {
                                dateFormatted = dateCurrent;

                            } else {
                                dateFormatted = addDays(dateCurrent, 2);
                            }
                            break;

                        default:
                            if (getHours(dateCurrent) < 15) {
                                dateFormatted = dateCurrent;

                            } else {
                                dateFormatted = addDays(dateCurrent, 1);
                            }
                            break;
                        }

                        let day = ('0' + getDate(dateFormatted)).slice(-2);
                        let month = ('0' + (getMonth(dateFormatted) + 1)).slice(-2);
                        let year = getYear(dateFormatted);

                        fetch(`https://api.dnevnik.ru/mobile/v2/schedule?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}&personId=${localState.userData.personId}&groupId=${localState.userData.eduGroups[0].id_str}&access_token=${localState.apiKey}`, { credentials: 'same-origin' })
                            .then((response) => {
                                if (response.ok) {
                                    response.json().then((dnevnikJson) => {
                                        localState['offlineDnevnik'] = dnevnikJson;
                                        ls.set('offlineDnevnik', dnevnikJson);

                                        localState['dnevnikData'] = dnevnikJson;
                                        localState['dnevnikLoad'] = false;
                                    });

                                } else {
                                    localState['dnevnikData'] = localState['offlineDnevnik'];
                                    localState['dnevnikLoad'] = false;
                                }

                            }, () => {
                                localState['dnevnikData'] = localState['offlineDnevnik'];
                                localState['dnevnikLoad'] = false;
                            });
                    })
                );

                promiseArray.push(
                    new Promise(() => {
                        fetch(`https://api.dnevnik.ru/mobile/v2/allMarks?personId=${localState.userData.personId}&groupId=${localState.userData.eduGroups[0].id_str}&access_token=${localState.apiKey}`, { credentials: 'same-origin' })
                            .then((response) => {
                                if (response.ok) {
                                    response.json().then((statsJson) => {
                                        localState['statsData'] = statsJson;
                                        ls.set('statsData', statsJson);

                                        localState['statsLoad'] = false;
                                    });

                                } else {
                                    localState['statsLoad'] = false;
                                }

                            }, () => {
                                localState['statsLoad'] = false;
                            });
                    })
                );

                promiseArray.push(
                    new Promise(() => {
                        let dateCurrent = new Date();

                        let day = ('0' + getDate(dateCurrent)).slice(-2);
                        let month = ('0' + (getMonth(dateCurrent) + 1)).slice(-2);
                        let year = getYear(dateCurrent);

                        fetch(`https://api.dnevnik.ru/mobile/v2/feed/?date=${year}-${month}-${day}&limit=1&personId=${localState.userData.personId}&groupId=${localState.userData.eduGroups[0].id_str}&access_token=${localState.apiKey}`, { credentials: 'same-origin' })
                            .then((response) => {
                                if (response.ok) {
                                    response.json().then((feedJson) => {
                                        localState['feedData'] = feedJson;
                                        ls.set('feedData', feedJson);
    
                                        localState['feedLoad'] = false;
                                    });
                                    
                                } else {
                                    localState['feedLoad'] = false;
                                }

                            }, () => {
                                localState['feedLoad'] = false;
                            });
                    })
                );

                fetch(`https://api.dnevnik.ru/v1/users/me/context?access_token=${localState.apiKey}`, {
                    credentials: 'same-origin'
                }).then((response) => {
                    response.json().then((userData) => {
                        if (deauthChecker(userData)) {
                            ls.clearAll();
                            store.replaceState({});

                        } else {
                            if (response.ok) {
                                localState['userData'] = userData;
                                ls.set('userData', userData);

                                Promise.all(promiseArray).then(() => {
                                    store.replaceState(localState);
                                });
                            }
                        }
                    });
                });
            }
        },
        viewDnevnik(state, amount) {
            if (state.isLoggedIn) {
                if (amount === 0) {
                    state.dnevnikData = state.offlineDnevnik;
                    return true;
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

                let day = ('0' + getDate(dateFormatted)).slice(-2);
                let month = ('0' + (getMonth(dateFormatted) + 1)).slice(-2);
                let year = getYear(dateFormatted);

                cachedFetch(`https://api.dnevnik.ru/mobile/v2/schedule?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
                    response.json().then((dnevnikJson) => {
                        if (!dnevnikJson) {
                            return ls.set('switchFailed', true);
                        }

                        if (deauthChecker(dnevnikJson)) {
                            ls.clearAll();
                            store.replaceState({});

                        } else {
                            if (response.ok) {
                                state.dnevnikData = dnevnikJson;

                            } else {
                                state.dnevnikData = state.offlineDnevnik;
                            }
                        }
                    });
                    
                }, () => {
                    state.dnevnikData = state.offlineDnevnik;
                });
            }
        },
        setDefaultState() {
            for (let [key, value] of Object.entries(defaultState)) {
                ls.set(key, value);
            }
        },
        resetLoginState() {
            if (navigator.onLine) {
                ls.clearAll();
                store.replaceState({});
            }
        }
    }
});

export default store;
