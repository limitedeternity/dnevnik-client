import Vue from 'vue';
import Router from 'vue-router';
import Dnevnik from '../components/Dnevnik';
import Home from '../components/Home';
import Stats from '../components/Stats';
import NotFound from '../components/NotFound';

Vue.use(Router);

const router = new Router({
    mode: 'hash',
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/dnevnik',
            name: 'dnevnik',
            component: Dnevnik
        },
        {
            path: '/stats',
            name: 'stats',
            component: Stats
        },
        {
            path: '*',
            component: NotFound
        }
    ]
});

router.afterEach(() => {
    window.scrollTo(0, 0);
});

export default router;
