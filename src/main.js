import Vue from "vue";
import App from "./App";
import Router from "./router";
import Store from "./store";
import VueTouch from "vue-touch";
import "./registerServiceWorker";

Vue.use(VueTouch, { name: "v-touch" });
Vue.config.productionTip = false;

const app = new Vue({
  el: "#app",
  router: Router,
  store: Store,
  ...App
});

window.addEventListener("keydown", event => {
  switch (event.key) {
    case "ArrowRight":
      app.onswipeLeft();
      break;

    case "ArrowLeft":
      app.onswipeRight();
      break;

    default:
      break;
  }
});
