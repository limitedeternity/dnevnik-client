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
      path: '/',
      component: Home
    },
    {
      path: '/dnevnik',
      component: Dnevnik
    },
    {
      path: '/stats',
      component: Stats
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
