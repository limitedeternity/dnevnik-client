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
        fetchDnevnik(state, params) {
            if (state.isLoggedIn) {
                let dateCurrent = new Date;
                let dateFormatted = null;

                switch (true) {
                case isSunday(dateCurrent):
                    dateFormatted = addDays(addDays(dateCurrent, 1), params.amount);
                    break;
                    
                case isSaturday(new Date):
                    if (getHours(dateCurrent) < 14) {
                        dateFormatted = addDays(dateCurrent, params.amount);

                    } else {
                        dateFormatted = addDays(addDays(dateCurrent, 2), params.amount);
                    }
                    break;
                    
                default:
                    if (getHours(dateCurrent) < 15) {
                        dateFormatted = addDays(dateCurrent, params.amount);

                    } else {
                        dateFormatted = addDays(addDays(dateCurrent, 1), params.amount);
                    }
                    break;
                }

                let day = ('0' + getDate(dateFormatted)).slice(-2);
                let month = ('0' + (getMonth(dateCurrent) + 1)).slice(-2);
                let year = getYear(dateFormatted);

                fetch(`https://api.dnevnik.ru/mobile/v2/schedule?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
                    if (response.ok) {
                        response.json().then((dnevnikJson) => {
                            if (params.shouldWrite) {
                                state.offlineDnevnik = dnevnikJson;
                            }
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
        fetchStats(state) {
            if (state.isLoggedIn) {
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
            }
        },
        fetchFeed(state) {
            if (state.isLoggedIn) {
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
        },
        userDataUpdate(state) {
            if (state.isLoggedIn) {
                fetch(`https://api.dnevnik.ru/v1/users/me/context?access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
                    if (response.ok) {
                        response.json().then((userData) => {
                            state.userData = userData;
                        });
                    }
                });
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
