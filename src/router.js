import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home";

Vue.use(Router);

const router = new Router({
  mode: "hash",
  routes: [
    {
      path: "/",
      name: "home",
      component: Home
    },
    {
      path: "/dnevnik",
      name: "dnevnik",
      component: () => import("./views/Dnevnik")
    },
    {
      path: "/stats",
      name: "stats",
      component: () => import("./views/Stats")
    },
    {
      path: "*",
      component: () => import("./views/NotFound")
    }
  ]
});

router.afterEach(() => {
  window.requestAnimFrame = (function() {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame
    );
  })();

  function scrollToY(scrollPosY, speedParam, easingParam) {
    let scrollY = window.scrollY || document.documentElement.scrollTop;
    let scrollTargetY = scrollPosY || 0;
    let speed = speedParam || 2000;
    let easing = easingParam || "easeOutSine";
    let currentTime = 0;
    let time = Math.max(
      0.1,
      Math.min(Math.abs(scrollY - scrollTargetY) / speed, 0.8)
    );

    let easingEquations = {
      easeOutSine: pos => {
        return Math.sin(pos * (Math.PI / 2));
      },
      easeInOutSine: pos => {
        return -0.5 * (Math.cos(Math.PI * pos) - 1);
      },
      easeInOutQuint: pos => {
        if ((pos /= 0.5) < 1) {
          return 0.5 * Math.pow(pos, 5);
        } else {
          return 0.5 * (Math.pow(pos - 2, 5) + 2);
        }
      }
    };

    (function tick() {
      currentTime += 1 / 60;

      let p = currentTime / time;
      let t = easingEquations[easing](p);

      if (p < 1) {
        window.requestAnimFrame(tick);
        window.scrollTo(0, scrollY + (scrollTargetY - scrollY) * t);
      } else {
        window.scrollTo(0, scrollTargetY);
      }
    })();
  }

  scrollToY(0, 400, "easeInOutQuint");
});

export default router;
