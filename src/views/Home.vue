<template>
  <div class="col s12 offset-m1 m10 offset-l2 l8 offset-xl4 xl4">
    <div class="card">
      <div class="card-image">
        <lazy-image
          :width="428"
          :height="321"
          :background-color="'#28342c'"
          :lazy-src="'/img/nature.jpg'"
        />
        <a
          class="btn-floating btn-large activator halfway-fab waves-effect waves-light red pulse"
          onclick="this.classList.remove('pulse')"
        >
          <i class="material-icons">mode_edit</i>
        </a>
      </div>
      <div class="card-content">
        <span class="card-title grey-text text-darken-4">Здравствуйте, {{ user }}!</span>
        <p>Нажмите на ручку, чтобы просмотреть важную информацию.</p>
      </div>
      <div class="card-reveal">
        <template v-if="isLoggedIn">
          <span class="card-title grey-text text-darken-4">
            Инфо
            <i class="material-icons right">close</i>
          </span>
          <template v-if="!feedLoad">
            <div v-if="feedData.Feed.Days.length && feedData.Feed.Days[0].MarkCards.length">
              <blockquote
                :style="{borderLeft: '5px solid ' + coloring(feedData.Feed.Days[0].DayEmotion)}"
              >Оценки за сегодня</blockquote>
              <ul class="collection">
                <template v-for="(card, indexCard) in feedData.Feed.Days[0].MarkCards">
                  <template v-for="(value, index) in card.Values">
                    <li
                      class="collection-item avatar z-depth-1"
                      :key="`item-mark-${indexCard}-${index}`"
                    >
                      <i
                        class="material-icons circle white"
                        :style="{color: coloring(value.Mood), transform: 'scale(1.5)'}"
                      >subject</i>
                      <div :style="{display: 'block', clear: 'both', height: '6px'}"></div>
                      <span class="title" :style="{color: coloring(value.Mood)}">{{ value.Value }}</span>
                      <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                      <p
                        class="grey-text text-darken-4"
                      >{{ card.Subject.Name }} - {{ card.WorkType.Kind }}</p>
                    </li>
                    <div
                      :style="{display: 'block', clear: 'both', height: '2px'}"
                      :key="`delimiter-mark-${indexCard}-${index}`"
                    ></div>
                  </template>
                </template>
              </ul>
              <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
            </div>
            <div v-if="feedData.Feed.Days.length && feedData.Feed.Days[0].ImportantWorks.length">
              <blockquote>Важные работы</blockquote>
              <ul class="collection">
                <template v-for="(work, index) in feedData.Feed.Days[0].ImportantWorks">
                  <li class="collection-item avatar z-depth-1" :key="`item-warn-${index}`">
                    <i
                      class="material-icons circle white"
                      :style="{color: 'orange', transform: 'scale(1.5)'}"
                    >warning</i>
                    <div :style="{display: 'block', clear: 'both', height: '6px'}"></div>
                    <span class="title" :style="{color: 'orange'}">{{ work.Subject.Name }}</span>
                    <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                    <p class="grey-text text-darken-4">{{ work.WorkType.Kind }}</p>
                  </li>
                  <div
                    :style="{display: 'block', clear: 'both', height: '2px'}"
                    :key="`delimiter-warn-${index}`"
                  ></div>
                </template>
              </ul>
              <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
            </div>
            <div
              v-if="feedData.Feed.Days.length && feedData.Feed.Days[0].Schedule.Notifications && feedData.Feed.Days[0].Schedule.Notifications.length"
            >
              <blockquote :style="{borderLeft: '5px solid #01579B'}">Объявления</blockquote>
              <ul class="collection">
                <template
                  v-for="(notification, index) in feedData.Feed.Days[0].Schedule.Notifications"
                >
                  <li class="collection-item avatar z-depth-1" :key="`item-notif-${index}`">
                    <i
                      class="material-icons circle white"
                      :style="{color: '#01579B', transform: 'scale(1.5)'}"
                    >message</i>
                    <div :style="{display: 'block', clear: 'both', height: '6px'}"></div>
                    <span class="title" :style="{color: '#01579B'}">{{ notification.Title }}</span>
                    <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                    <p v-html="linkReplace(notification.Text)"></p>
                    <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                  </li>
                  <div
                    :style="{display: 'block', clear: 'both', height: '2px'}"
                    :key="`delimiter-notif-${index}`"
                  ></div>
                </template>
              </ul>
              <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
            </div>
            <div>
              <p>
                Спасибо, что решили протестировать beta-версию DnevnikClient. Я очень это ценю.
                <br>Обо всех ошибках просьба сообщать, открывая Issue в
                <a
                  href="https://github.com/limitedeternity/dnevnik-client/"
                  target="_blank"
                  rel="noopener"
                >репозитории на GitHub</a>.
                <br>Надеюсь, вам нравится клиент, и вы довольны его функционалом и проделанной мной работой.
                <br>Напоминаю, что проект - Open Source, так что вы в любой момент можете помочь разработке.
                <br>By
                <a
                  href="https://github.com/limitedeternity/"
                  target="_blank"
                  rel="noopener"
                >@limitedeternity</a>
              </p>
            </div>
          </template>
          <template v-else>
            <div :style="{display: 'block', clear: 'both', height: '15px'}"></div>
            <div class="progress">
              <div class="indeterminate"></div>
            </div>
          </template>
        </template>
        <template v-else>
          <span class="card-title grey-text text-darken-4">
            Инфо
            <i class="material-icons right">close</i>
          </span>
          <p>
            Спасибо, что решили протестировать beta-версию DnevnikClient. Я очень это ценю.
            <br>Обо всех ошибках просьба сообщать, открывая Issue в
            <a
              href="https://github.com/limitedeternity/dnevnik-client/"
              target="_blank"
              rel="noopener"
            >репозитории на GitHub</a>.
            <br>Надеюсь, вам нравится клиент, и вы довольны его функционалом и проделанной мной работой.
            <br>Напоминаю, что проект - Open Source, так что вы в любой момент можете помочь разработке.
            <br>By
            <a
              href="https://github.com/limitedeternity/"
              target="_blank"
              rel="noopener"
            >@limitedeternity</a>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import LazyImage from "@/components/LazyImage";

import { mapGetters, mapActions } from "vuex";
import coloring from "./methods/coloring";
import linkReplace from "./methods/linkReplace";

export default {
  name: "Home",
  components: {
    LazyImage
  },
  computed: {
    ...mapGetters(["isLoggedIn", "userData", "feedData", "feedLoad"]),
    user() {
      return this.userData ? this.userData.firstName : "товарищ";
    }
  },
  methods: {
    ...mapActions(["fetchFeed"]),
    coloring,
    linkReplace
  },
  created() {
    this.fetchFeed();
    this.$store.watch(
      (state, getters) => getters.isLoggedIn,
      (newValue, oldValue) => {
        if (oldValue === false && newValue === true) {
          this.fetchFeed();
        }
      }
    );
  }
};
</script>
