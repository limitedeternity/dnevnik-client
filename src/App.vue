<template>
  <div id="app">
    <nav>
      <div class="nav-wrapper">
        <router-link to="/" class="brand-logo left" replace>
          <i class="material-icons" style="margin-left:15px;">book</i>
        </router-link>
        <ul class="right" id="tabs">
          <div v-if="isLoggedIn">
            <li>
              <router-link to="/dnevnik" replace>
                <i class="material-icons">face</i>
              </router-link>
            </li>
            <li>
              <router-link to="/stats" replace>
                <i class="material-icons">view_list</i>
              </router-link>
            </li>
            <li>
              <a href="#" @click="$store.commit('resetLoginState')">
                <i class="material-icons">exit_to_app</i>
              </a>
            </li>
          </div>
          <div v-else>
            <li>
              <a href="https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo,Messages&redirect_uri=http://localhost:8080/">
                <i class="material-icons">settings_power</i>
              </a>
            </li>
          </div>
        </ul>
      </div>
    </nav>
    <div class="row">
      <keep-alive>
        <router-view :key="$route.path"></router-view>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import Cookies from 'js-cookie'
import { mapGetters } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapGetters([
      "isLoggedIn",
      "userData"
    ])
  },
  methods: {
    checkLoginSeq() {
      if (this.$route.hash.includes("access_token=")) {
        fetch(`https://api.dnevnik.ru/v1/users/me/context?access_token=${this.$route.hash.match(new RegExp("access_token=(.*)&state="))[1]}`, { credentials: 'same-origin' }).then((response) => {
          return response.json();
        }).then((userData) => {
          if (userData.roles !== undefined && userData.roles.includes("EduStudent")) {
            Cookies.set('AccessToken', this.$route.hash.match(new RegExp("access_token=(.*)&state="))[1]);
            this.$store.commit('setLoginState');
            this.$store.commit("userDataUpdate");
          }
          this.$router.replace("/");
        })
      }
    }
  },
  created() {
    this.checkLoginSeq();
  }
}
</script>
