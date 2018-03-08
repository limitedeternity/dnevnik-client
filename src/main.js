import Vue from 'vue';
import App from './App';
import Router from './router';
import Store from './store';
import VueTouch from 'vue-touch';

Vue.use(VueTouch, { name: 'v-touch' });
Vue.config.productionTip = false;

new Vue({
    el: '#app',
    router: Router,
    store: Store,
    render (createElement) {
        return createElement(App);
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js', {
            scope: './'
        });
    });
}

HTMLDocument.prototype.__defineGetter__('write', () => { return null; });
