import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import SecureLS from 'secure-ls';
import { getRawCookie, removeCookie } from 'tiny-cookie';

import addDays from 'date-fns/add_days';
import getHours from 'date-fns/get_hours';
import isSaturday from 'date-fns/is_saturday';
import isSunday from 'date-fns/is_sunday';
import getMonth from 'date-fns/get_month';
import getYear from 'date-fns/get_year';
import getDate from 'date-fns/get_date';

Vue.use(Vuex);

const ls = new SecureLS({
    encodingType: 'aes'
});

const store = new Vuex.Store({
    state: {
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
    },
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
        fetchData(state) {
            if (state.isLoggedIn) {
                fetch(`https://api.dnevnik.ru/v1/users/me/context?access_token=${state.apiKey}`, {
                    credentials: 'same-origin'
                }).then((response) => {
                    if (response.ok) {
                        response.json().then((userData) => {
                            state.userData = userData;
                        });
                    }

                }).catch(() => {
                    console.log('Failed to fetch item: UserData'); // eslint-disable-line no-console

                }).then(() => {
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

                    fetch(`https://api.dnevnik.ru/mobile/v2/schedule?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
                        if (response.ok) {
                            response.json().then((dnevnikJson) => {
                                state.offlineDnevnik = dnevnikJson;
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

                }).catch(() => {
                    console.log('Failed to fetch item: Dnevnik'); // eslint-disable-line no-console

                }).then(() => {
                    fetch(`https://api.dnevnik.ru/mobile/v2/allMarks?personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
                        if (response.ok) {
                            response.json().then((statsJson) => {
                                state.statsData = statsJson;
                                state.statsLoad = false;
                            });

                        } else {
                            state.statsLoad = false;
                        }

                    }, () => {
                        state.statsLoad = false;
                    });

                }).catch(() => {
                    console.log('Failed to fetch item: Stats'); // eslint-disable-line no-console

                }).then(() => {
                    let dateCurrent = new Date;

                    let deauthChecker = (jsonData) => {
                        return ['invalidToken', 'apiRequestLimit'].some((elem) => {
                            return (jsonData.hasOwnProperty('type') && jsonData['type'] === elem);
                        });
                    };

                    let day = ('0' + getDate(dateCurrent)).slice(-2);
                    let month = ('0' + (getMonth(dateCurrent) + 1)).slice(-2);
                    let year = getYear(dateCurrent);

                    fetch(`https://api.dnevnik.ru/mobile/v2/feed/?date=${year}-${month}-${day}&limit=1&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
                        if (response.ok) {
                            response.json().then((feedJson) => {
                                if (deauthChecker(feedJson)) {
                                    store.replaceState({});

                                } else {
                                    state.feedData = feedJson;
                                    state.feedLoad = false;
                                }
                            });

                        } else {
                            state.feedLoad = false;
                        }

                    }, () => {
                        state.feedLoad = false;
                    });

                }).catch(() => {
                    console.log('Failed to fetch item: Feed'); // eslint-disable-line no-console

                }).then(() => {
                    console.log('Fetch operation finished.'); // eslint-disable-line no-console

                });
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
        setLoginState(state) {
            state.isLoggedIn = true;
            state.apiKey = getRawCookie('AccessToken');
            removeCookie('AccessToken');
        },
        resetLoginState() {
            if (navigator.onLine) {
                store.replaceState({});
            }
        }
    },
    plugins: [
        createPersistedState({
            storage: {
                getItem: (key) => ls.get(key),
                setItem: (key, value) => ls.set(key, value),
                removeItem: (key) => ls.remove(key)
            },
            paths: [
                'dnevnikData',
                'offlineDnevnik',
                'statsData',
                'feedData',
                'userData',
                'isLoggedIn',
                'apiKey'
            ]
        })
    ]
});

export default store;
