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
            let localState = {};

            ls.getAllKeys().forEach((key) => {
                localState[key] = ls.get(key);
            });

            if (localState.isLoggedIn) {
                let promiseArray = [];

                promiseArray.push(
                    new Promise(() => {
                        let dateCurrent = new Date;
                        let dateFormatted = null;

                        switch (true) {
                        case isSunday(dateCurrent):
                            dateFormatted = addDays(dateCurrent, 1);
                            break;

                        case isSaturday(new Date):
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
                        let month = ('0' + (getMonth(dateCurrent) + 1)).slice(-2);
                        let year = getYear(dateFormatted);

                        fetch(`https://api.dnevnik.ru/mobile/v2/schedule?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}&personId=${localState.userData.personId}&groupId=${localState.userData.eduGroups[0].id_str}&access_token=${localState.apiKey}`, { credentials: 'same-origin' })
                            .then((response) => {
                                if (response.ok) {
                                    response.json().then((dnevnikJson) => {
                                        localState.offlineDnevnik, localState.dnevnikData = dnevnikJson;
                                        localState.dnevnikLoad = false;
                                    });

                                } else {
                                    localState.dnevnikData = localState.offlineDnevnik;
                                    localState.dnevnikLoad = false;
                                }

                            }, () => {
                                localState.dnevnikData = localState.offlineDnevnik;
                                localState.dnevnikLoad = false;
                            });
                    })
                );


                promiseArray.push(
                    fetch(`https://api.dnevnik.ru/mobile/v2/allMarks?personId=${localState.userData.personId}&groupId=${localState.userData.eduGroups[0].id_str}&access_token=${localState.apiKey}`, { credentials: 'same-origin' })
                        .then((response) => {
                            if (response.ok) {
                                response.json().then((statsJson) => {
                                    localState.statsData = statsJson;
                                    localState.statsLoad = false;
                                });

                            } else {
                                localState.statsLoad = false;
                            }

                        }, () => {
                            localState.statsLoad = false;
                        })
                );

                promiseArray.push(
                    new Promise(() => {
                        let dateCurrent = new Date;

                        let deauthChecker = (jsonData) => {
                            return ['invalidToken', 'apiRequestLimit'].some((elem) => {
                                return (jsonData.hasOwnProperty('type') && jsonData['type'] === elem);
                            });
                        };

                        let day = ('0' + getDate(dateCurrent)).slice(-2);
                        let month = ('0' + (getMonth(dateCurrent) + 1)).slice(-2);
                        let year = getYear(dateCurrent);

                        fetch(`https://api.dnevnik.ru/mobile/v2/feed/?date=${year}-${month}-${day}&limit=1&personId=${localState.userData.personId}&groupId=${localState.userData.eduGroups[0].id_str}&access_token=${localState.apiKey}`, { credentials: 'same-origin' })
                            .then((response) => {
                                if (response.ok) {
                                    response.json().then((feedJson) => {
                                        if (deauthChecker(feedJson)) {
                                            localState = defaultState;
                                            store.replaceState(defaultState);

                                        } else {
                                            localState.feedData = feedJson;
                                            localState.feedLoad = false;
                                        }
                                    });

                                } else {
                                    localState.feedLoad = false;
                                }

                            }, () => {
                                localState.feedLoad = false;
                            });
                    })
                );

                fetch(`https://api.dnevnik.ru/v1/users/me/context?access_token=${localState.apiKey}`, {
                    credentials: 'same-origin'
                }).then((response) => {
                    if (response.ok) {
                        response.json().then((userData) => {
                            localState.userData = userData;
                        });
                    }
                }).then(() => {
                    Promise.all(promiseArray);
                });

                for (let [key, value] of Object.entries(localState)) {
                    if (!['statsLoad', 'dnevnikLoad', 'feedLoad'].includes(key)) {
                        ls.set(key, value);

                    } else {
                        ls.set(key, true);
                    }
                }

                store.replaceState(localState);
            }
        },
        viewDnevnik(state, amount) {
            if (state.isLoggedIn) {
                let dateCurrent = new Date;
                let dateFormatted = null;

                switch (true) {
                case isSunday(dateCurrent):
                    dateFormatted = addDays(addDays(dateCurrent, 1), amount);
                    break;
                    
                case isSaturday(new Date):
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
                let month = ('0' + (getMonth(dateCurrent) + 1)).slice(-2);
                let year = getYear(dateFormatted);

                fetch(`https://api.dnevnik.ru/mobile/v2/schedule?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
                    if (response.ok) {
                        response.json().then((dnevnikJson) => {
                            state.dnevnikData = dnevnikJson;
                            state.dnevnikLoad = false;
                        });

                    } else {
                        state.dnevnikData = state.offlineDnevnik;
                        state.dnevnikLoad = false;
                    }
                    
                }, () => {
                    state.dnevnikData = state.offlineDnevnik;
                    state.dnevnikLoad = false;
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
                for (let [key, value] of Object.entries(defaultState)) {
                    ls.set(key, value);
                }

                store.replaceState(defaultState);
            }
        }
    }
});

export default store;
