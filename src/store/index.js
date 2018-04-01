import Vue from 'vue';
import Vuex from 'vuex';
import SecureLS from 'secure-ls';

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

const ls = new SecureLS({ encodingType: 'aes' });

var cachedKeysList = Object.keys(localStorage).filter(item => item.match(/^[0-9]+$/));

const cacheClearCheck = () => {
    if (cachedKeysList.length > 4) {
        let oldEntry = cachedKeysList[0];
        ls.remove(oldEntry);
        cachedKeysList = cachedKeysList.slice(1);
    }
};

const genHash = (s) => {
    let hash = 0;

    if (s.length === 0) {
        return hash;
    }

    for (let i = 0; i < s.length; i++) {
        let char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    hash = Math.abs(hash);

    if (cachedKeysList.includes(hash)) {
        cachedKeysList = cachedKeysList.filter(item => item !== hash);
    }

    cachedKeysList.push(hash);
    cacheClearCheck();
    return hash;
};

const cachedFetch = (url, options) => {
    let cacheKey = genHash(url);
    let cached = ls.get(cacheKey);

    if (cached && !navigator.onLine) {
        let response = new Response(new Blob([cached]));
        return Promise.resolve(response);
    }
  
    return fetch(url, options).then((response) => {
        if (response.ok) {
            let ct = response.headers.get('Content-Type');

            if (ct && ct.match(/application\/json/i)) {
                response.clone().text().then((content) => {
                    ls.set(cacheKey, content);
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

            ls.getAllKeys().forEach((key) => {
                localState[key] = ls.get(key);
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
                            ls.clear();
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
                        if (deauthChecker(dnevnikJson)) {
                            ls.clear();
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
                ls.clear();
                store.replaceState({});
            }
        }
    }
});

export default store;
