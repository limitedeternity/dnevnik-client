import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';
import SecureLS from 'secure-ls';
import Cookies from 'js-cookie';
import moment from 'moment';

Vue.use(Vuex);

const ls = new SecureLS({
    encodingType: 'aes'
});

/* eslint-disable no-unused-vars */
const vuexLocal = new VuexPersistence({
    restoreState: (key, storage) => ls.get(key),
    saveState: (key, state, storage) => ls.set(key, state)
});
/* eslint-enable no-unused-vars */

const store = new Vuex.Store({
    state: {
        dnevnikData: null,
        offlineDnevnik: null,
        statsData: null,
        feedData: null,
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
        isLoggedIn: (state) => state.isLoggedIn
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

                fetch(`https://api.dnevnik.ru/mobile/v2/schedule?startDate=${date.year()}-${('0' + (date.month() + 1)).slice(-2)}-${('0' + date.date()).slice(-2)}&endDate=${date.year()}-${('0' + (date.month() + 1)).slice(-2)}-${('0' + date.date()).slice(-2)}&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`).then((response) => {
                    if (response.ok) {
                        response.json().then((dnevnikJson) => {
                            if (params.shouldWrite) {
                                state.offlineDnevnik = dnevnikJson;
                            }
                            state.dnevnikData = dnevnikJson;
                        });

                    } else {
                        state.dnevnikData = state.offlineDnevnik;
                    }
                    
                }, () => {
                    state.dnevnikData = state.offlineDnevnik;
                });
            }
        },
        fetchStats(state) {
            if (state.isLoggedIn) {
                fetch(`https://api.dnevnik.ru/mobile/v2/allMarks?personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`).then((response) => {
                    if (response.ok) {
                        response.json().then((statsJson) => {
                            state.statsData = statsJson;
                        });
                    }
                });

            }
        },
        fetchFeed(state) {
            if (state.isLoggedIn) {
                let date = moment();

                fetch(`https://api.dnevnik.ru/mobile/v2/feed/?date=${date.year()}-${('0' + (date.month() + 1)).slice(-2)}-${('0' + date.date()).slice(-2)}&limit=1&personId=${state.userData.personId}&groupId=${state.userData.eduGroups[0].id_str}&access_token=${state.apiKey}`).then((response) => {
                    if (response.ok) {
                        response.json().then((feedJson) => {
                            if (feedJson.hasOwnProperty('type') && feedJson['type'] === 'apiRequestLimit') {
                                store.replaceState({});
                                
                            } else {
                                state.feedData = feedJson;
                            }
                        });
                    }
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
                fetch(`https://api.dnevnik.ru/v1/users/me/context?access_token=${state.apiKey}`).then((response) => {
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
        vuexLocal.plugin
    ]
});

export default store;