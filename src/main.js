import Vue from 'vue';
import App from './App';
import Router from './router';
import Store from './store';

Vue.config.productionTip = false;

new Vue({
    el: '#app',
    router: Router,
    store: Store,
    render: h => h(App)
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', {
            scope: '/dnevnik-client/'
        });
    });
}

HTMLDocument.prototype.__defineGetter__('write', () => { return null; });
