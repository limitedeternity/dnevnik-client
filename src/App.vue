<template>
  <div id="app" style="display:flex;min-height:100vh;flex-direction:column;">
    <header class="navbar-fixed">
      <nav role="navigation">
        <div class="nav-wrapper">
          <router-link :to="{name: 'home'}" class="brand-logo left" replace>
            <i class="material-icons" style="margin-left:15px;">book</i>
          </router-link>
          <ul class="right" id="tabs">
            <div v-if="isLoggedIn">
              <li>
                <router-link :to="{name: 'dnevnik'}" replace>
                  <i class="material-icons">face</i>
                </router-link>
              </li>
              <li>
                <router-link :to="{name: 'stats'}" replace>
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
                <a href="https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo,Messages&redirect_uri=https://limitedeternity.github.io/dnevnik-client/">
                  <i class="material-icons">settings_power</i>
                </a>
              </li>
            </div>
          </ul>
        </div>
      </nav>
    </header>

    <main style="flex: 1 0 auto;">
      <div class="row">
        <keep-alive>
          <router-view :key="$route.fullPath"></router-view>
        </keep-alive>
      </div>
    </main>

    <footer class="page-footer">
      <div class="container">
        <div class="row">
          <div class="col l6 s12">
            <h5 class="white-text">DnevnikClient</h5>
            <p class="grey-text text-lighten-4">{{ footerText }}</p>
          </div>
          <div class="col l2 offset-l2 s6">
            <h6>О проекте</h6>
            <ul>
              <li><a href="https://github.com/limitedeternity/dnevnik-client/" rel="noopener" target="_blank" class="grey-text text-lighten-3">Репозиторий</a></li>
            </ul>
          </div>
          <div class="col l2 s6">
            <h6>Разработчик</h6>
            <ul>
              <li><a href="https://github.com/limitedeternity" rel="noopener" target="_blank" class="grey-text text-lighten-3">GitHub</a></li>
              <li><a href="https://vk.com/limitedeternity" rel="noopener" target="_blank" class="grey-text text-lighten-3">VK</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer-copyright">
        <div class="container">Made by @limitedeternity</div>
      </div>
    </footer>
  </div>
</template>

<script>
import { setRawCookie } from 'tiny-cookie';
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  computed: {
    ...mapGetters([
      'isLoggedIn',
      'userData'
    ])
  },
  data() {
    return {
      footerText: this.randomChoice(["Чистим вилкой то, что другие не могут очистить десятилетиями.", "Просто сделайте вид, что тут что-то интеллектуальное и революционное.", "Это приложение - как котенок в зоомагазине. Всем нравится, но никому нах*й не сдалось.", "ͰͱͳͷϏ҇ӻӼӽӾԖԘԙԚԟԡԢԤԥԦԧԪԫԬԭԮԯ؇ऀ॥ఁ෧กขbၗၘᄁᣞe᷿ḀẝỺỼỽỾỿἀₗₘₙₚₛₜ"])
    }
  },
  methods: {
    checkLoginSeq() {
      if (this.$route.fullPath.includes('access_token=')) {
        let accessToken = this.$route.fullPath.match(new RegExp('access_token=(.*)&state='))[1];

        fetch(`https://api.dnevnik.ru/v1/users/me/context?access_token=${accessToken}`, { credentials: 'same-origin' }).then((response) => {
          return response.json();
        }).then((userData) => {
          if (userData.roles !== undefined && userData.roles.includes('EduStudent')) {
            setRawCookie('AccessToken', accessToken, { secure: true });
            this.$store.commit('setLoginState');
            this.$store.commit('userDataUpdate');
            this.$router.replace({name: 'home'});
          }
        })
      }
    },
    randomChoice(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }
  },
  created() {
    this.$store.commit('userDataUpdate');
  },
  mounted() {
    this.checkLoginSeq();
  }
}
</script>
