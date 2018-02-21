import Vue from 'vue'
import Router from 'vue-router'
import Dnevnik from '../components/Dnevnik'
import Home from '../components/Home'
import Stats from '../components/Stats'
import Store from '../store'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/dnevnik-client/',
      name: 'home',
      pathToRegexpOptions: { strict: true },
      component: Home
    },
    {
      path: '/dnevnik-client/dnevnik',
      name: 'dnevnik',
      component: Dnevnik
    },
    {
      path: '/dnevnik-client/stats',
      name: 'stats',
      component: Stats
    },
    {
      path: '*',
      redirect: '/dnevnik-client/'
    }
  ]
})
