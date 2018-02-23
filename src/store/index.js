import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import SecureLS from 'secure-ls';
import Cookies from 'js-cookie';
import moment from 'moment';

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
                let date = null;

                switch (moment().day()) {
                case 0:
                    date = moment().add(1, 'days').add(params.amount, 'days');
                    break;
                    
                case 6:
                    if (moment().hour() < 14) {
                        date = moment().add(params.amount, 'days');

                    } else {
                        date = moment().add(2, 'days').add(params.amount, 'days');
                    }
                    break;
                    
                default:
                    if (moment().hour() < 15) {
                        date = moment().add(params.amount, 'days');

                    } else {
                        date = moment().add(1, 'days').add(params.amount, 'days');
                    }
                    break;
                }

                fetch(`https://api.dnevnik.ru/mobile/v2/schedule?startDate=${date.year()}-${('0' + (date.month() + 1)).slice(-2)}-${('0' + date.date()).slice(-2)}&endDate=${date.year()}-${('0' + (date.month() + 1)).slice(-2)}-${('0' + date.date()).slice(-2)}&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
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
                let date = moment();

                fetch(`https://api.dnevnik.ru/mobile/v2/feed/?date=${date.year()}-${('0' + (date.month() + 1)).slice(-2)}-${('0' + date.date()).slice(-2)}&limit=1&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`, { credentials: 'same-origin' }).then((response) => {
                    if (response.ok) {
                        response.json().then((feedJson) => {
                            if (feedJson.hasOwnProperty('type') && feedJson['type'] === 'apiRequestLimit') {
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
            state.apiKey = Cookies.get('AccessToken');
            Cookies.remove('AccessToken');
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
