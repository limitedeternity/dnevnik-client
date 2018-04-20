<template>
  <div id="app">
    <header>
      <nav role="navigation">
        <div class="nav-wrapper">
          <router-link :to="{name: 'home'}" class="brand-logo left" replace>
            <i class="material-icons">book</i>
          </router-link>
          <ul class="right" id="tabs">
            <template v-if="isLoggedIn">
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
            </template>
            <template v-else>
              <li>
                <a :href="'https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo&redirect_uri=' + getOrigin()">
                  <i class="material-icons">settings_power</i>
                </a>
              </li>
            </template>
          </ul>
        </div>
      </nav>
    </header>

    <main>
      <v-touch @swipeleft="onswipeLeft" @swiperight="onswipeRight" id="routerArea" class="row">
        <transition :name="transition">
          <keep-alive>
            <router-view></router-view>
          </keep-alive>
        </transition>
      </v-touch>
    </main>

    <footer class="page-footer">
      <div class="container">
        <div class="row">
          <div class="col l6 s12">
            <h5 class="white-text">DnevnikClient</h5>
            <p class="grey-text text-lighten-4" @click.once="footerText = 'Просто сделайте вид, что тут что-то интеллектуальное и революционное.'">{{ footerText }}</p>
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

<style>
#tabs a.router-link-exact-active {
    background-color: rgba(0, 0, 0, 0.1);
}

a.router-link-exact-active {
    border-bottom: 2px solid white;
    margin-top: -2px;
}

@media (hover: none) {
    nav ul a:hover {
        background-color: inherit;
    }
}

a.brand-logo.left {
    left: 0.5rem;
}

a.brand-logo.left > i {
    margin-left: 15px;
}

main {
    -webkit-box-flex: 1;
    -ms-flex: 1 0 auto;
    flex: 1 0 auto;
}

#app {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    min-height: 100vh;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    overflow-x: hidden;
}

#routerArea {
    -ms-touch-action: pan-y !important;
    touch-action: pan-y !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
}

.slide-left-enter {
    -webkit-transform: translate3d(25.1em, 0, 0);
    -ms-transform: translate3d(25.1em, 0, 0);
    transform: translate3d(25.1em, 0, 0);
    position: absolute;
    z-index: -100;
}

.slide-right-enter {
    -webkit-transform: translate3d(-25.1em, 0, 0);
    -ms-transform: translate3d(-25.1em, 0, 0);
    transform: translate3d(-25.1em, 0, 0);
    position: absolute;
    z-index: -100;
}

.slide-right-enter-active,
.slide-left-enter-active {
    -webkit-transition: all .4s ease;
    -o-transition: all .4s ease;
    transition: all .4s ease;
}

.slide-right-leave-active,
.slide-left-leave-active {
    -webkit-transition: all .4s cubic-bezier(1.0, 0.5, 0.8, 1.0);
    -o-transition: all .4s cubic-bezier(1.0, 0.5, 0.8, 1.0);
    transition: all .4s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}

.slide-right-leave-to,
.slide-left-leave-to {
    display: none;
}
</style>


<script>
import { mapGetters } from 'vuex';
import SecureLS from 'secure-ls';

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
      transition: 'slide-right',
      footerText: 'Версия: 2.0.0-beta2'
    }
  },
  watch: {
    '$route' (to, from) {
      if (from.name === "stats") {
        this.transition = 'slide-right';

      } else if (from.name === "dnevnik" && to.name === "home") {
        this.transition = 'slide-right';

      } else if (from.name === "dnevnik" && to.name === "stats") {
        this.transition = 'slide-left';

      } else if (from.name === "home") {
        this.transition = 'slide-left';
      }
    }
  },
  methods: {
    checkLoginSeq() {
      if (this.$route.fullPath.includes('access_token=')) {
        
        let accessToken = this.$route.fullPath.match(new RegExp('access_token=(.*)&state='))[1];
        const ls = new SecureLS({ encodingType: 'aes' });

        fetch(`https://api.dnevnik.ru/v1/users/me/context?access_token=${accessToken}`, { credentials: 'same-origin' }).then((response) => {
          return response.json();

        }).then((userData) => {
          if (userData.roles !== undefined && userData.roles.includes('EduStudent')) {

            this.$store.commit('setDefaultState');
            
            ls.set('apiKey', accessToken);
            ls.set('userData', userData);
            ls.set('isLoggedIn', true);

            this.$store.commit('fetchData');
            this.$router.replace({name: 'home'});
          }
        })
      }
    },
    getOrigin() {
      return location.origin;
    },
    onswipeRight() {
      switch (this.$route.name) {
      case 'stats':
        return this.$router.replace({name: 'dnevnik'});
      
      case 'dnevnik':
        return this.$router.replace({name: 'home'});
      
      default:
        return;
      }
    },
    onswipeLeft() {
      switch (this.$route.name) {
      case 'home':
        return this.$router.replace({name: 'dnevnik'});
      
      case 'dnevnik':
        return this.$router.replace({name: 'stats'});
      
      default:
        return;
      }
    }
  },
  created() {
    this.$store.commit('fetchData');
  },
  mounted() {
    document.getElementById('preloader').style.opacity = "0";
    setTimeout(() => {document.getElementById('preloader').remove()}, 1000);

    this.checkLoginSeq();
  }
}
</script>
