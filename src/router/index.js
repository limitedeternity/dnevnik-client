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
    window.requestAnimFrame = (() => {
        return window.requestAnimationFrame || 
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame;
    })();

    var scrollToY = (scrollPosY, speedParam, easingParam) => {

        var scrollY = window.scrollY || document.documentElement.scrollTop,
            scrollTargetY = scrollPosY || 0,
            speed = speedParam || 2000,
            easing = easingParam || 'easeOutSine',
            currentTime = 0;

        var time = Math.max(0.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, 0.8));

        var easingEquations = {
            easeOutSine: (pos) => {
                return Math.sin(pos * (Math.PI / 2));
            },
            easeInOutSine: (pos) => {
                return (-0.5 * (Math.cos(Math.PI * pos) - 1));
            },
            easeInOutQuint: (pos) => {
                if ((pos /= 0.5) < 1) {
                    return 0.5 * Math.pow(pos, 5);
                }
                return 0.5 * (Math.pow((pos - 2), 5) + 2);
            }
        };

        var tick = () => {
            currentTime += 1 / 60;

            var p = currentTime / time;
            var t = easingEquations[easing](p);

            if (p < 1) {
                window.requestAnimFrame(tick);
                window.scrollTo(0, scrollY + ((scrollTargetY - scrollY) * t));

            } else {
                window.scrollTo(0, scrollTargetY);
            }
        };

        tick();
    };

    scrollToY(0, 400, 'easeInOutQuint');
});

export default router;
