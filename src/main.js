import Vue from 'vue'
import App from './App'
import Router from './router'
import Store from './store'

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router: Router,
  store: Store,
  render: h => h(App)
})

HTMLDocument.prototype.__defineGetter__("write", () => { return null; });
