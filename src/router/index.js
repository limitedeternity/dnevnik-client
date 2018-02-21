import Vue from 'vue'
import Router from 'vue-router'
import Dnevnik from '../components/Dnevnik'
import Home from '../components/Home'
import Stats from '../components/Stats'
import NotFound from '../components/NotFound'
import Store from '../store'

Vue.use(Router)

export default new Router({
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
      name: 'error',
      component: NotFound
    }
  ]
})