<template>
  <div class="col s12 offset-m1 m10 offset-l2 l8 offset-xl4 xl4">
        <div class="card">
            <div class="card-image">
                <img src="../assets/images/nature.jpg" alt>
                <a @click="fetchFeed" class="btn-floating btn-large activator halfway-fab waves-effect waves-light red pulse" onclick="this.classList.remove('pulse')">
                    <i class="material-icons">mode_edit</i>
                </a>
            </div>
            <div class="card-content">
                <span class="card-title grey-text text-darken-4">Здравствуйте, {{ user }}!</span>
                <p>Нажмите на ручку, чтобы просмотреть важную информацию.</p>
            </div>
            <div class="card-reveal">
                <div v-if="isLoggedIn">
                    <span class="card-title grey-text text-darken-4">Инфо
                        <i class="material-icons right">close</i>
                    </span>
                    <div v-if="!feedLoad">
                        <div v-if="feedData.Feed.Days[0].MarkCards.length">
                            <blockquote :style="{borderLeft: '5px solid ' + coloring(feedData.Feed.Days[0].DayEmotion)}">Оценки за сегодня</blockquote>
                            <ul class="collection">
                              <div v-for="(card, index) in feedData.Feed.Days[0].MarkCards" :key="index">
                                  <div v-for="(value, index) in card.Values" :key="index">
                                      <li class="collection-item avatar z-depth-1">
                                          <i class="material-icons circle white" :style="{color: coloring(value.Mood), transform: 'scale(1.5)'}">subject</i>
                                          <div :style="{display: 'block', clear: 'both', height: '6px'}"></div>
                                          <span class="title" :style="{color: coloring(value.Mood)}">{{ value.Value }}</span>
                                          <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                                          <p class="grey-text text-darken-4">{{ card.Subject.Name }} - {{ card.WorkType.Kind }}</p>
                                      </li>
                                      <div :style="{display: 'block', clear: 'both', height: '2px'}"></div>
                                  </div>
                              </div>
                            </ul>
                            <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                        </div>
                        <div v-if="feedData.Feed.Days[0].ImportantWorks.length">
                            <blockquote>Важные работы</blockquote>
                            <ul class="collection">
                                <div v-for="(work, index) in feedData.Feed.Days[0].ImportantWorks" :key="index">
                                    <li class="collection-item avatar z-depth-1">
                                        <i class="material-icons circle white" :style="{color: 'orange', transform: 'scale(1.5)'}">warning</i>
                                        <div :style="{display: 'block', clear: 'both', height: '6px'}"></div>
                                        <span class="title" :style="{color: 'orange'}">{{ work.Subject.Name }}</span>
                                        <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                                        <p class="grey-text text-darken-4">{{ work.WorkType.Kind }}</p>
                                    </li>
                                    <div :style="{display: 'block', clear: 'both', height: '2px'}"></div>
                                </div>
                            </ul>
                            <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                        </div>
                        <div v-if="feedData.Feed.Days[0].Schedule.Notifications.length">
                            <blockquote :style="{borderLeft: '5px solid #01579B'}">Объявления</blockquote>
                            <ul class="collection">
                                <div v-for="(notification, index) in feedData.Feed.Days[0].Schedule.Notifications" :key="index">
                                    <li class="collection-item avatar z-depth-1">
                                        <i class="material-icons circle white" :style="{color: '#01579B', transform: 'scale(1.5)'}">message</i>
                                        <div :style="{display: 'block', clear: 'both', height: '6px'}"></div>
                                        <span class="title" :style="{color: '#01579B'}">{{ notification.Title }}</span>
                                        <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                                        <p v-html="linkReplace(notification.Text)"></p>
                                        <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                                    </li>
                                    <div :style="{display: 'block', clear: 'both', height: '2px'}"></div>
                                </div>
                            </ul>
                            <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                        </div>
                        <div v-else>
                            <p>Спасибо, что решили протестировать beta-версию DnevnikClient. Я очень это ценю. <br>Обо всех ошибках просьба сообщать, открывая Issue в <a href="https://github.com/limitedeternity/dnevnik-client/" target="_blank" rel="noopener">репозитории на GitHub</a>. <br>Надеюсь, вам нравится клиент, и вы довольны его функционалом и проделанной мной работой. <br>Напоминаю, что проект - Open Source, так что вы в любой момент можете помочь разработке. <br>By <a href="https://github.com/limitedeternity/" target="_blank" rel="noopener">@limitedeternity</a></p>
                        </div>
                    </div>
                    <div v-else>
                        <div :style="{display: 'block', clear: 'both', height: '15px'}"></div>
                        <div class="progress">
                          <div class="indeterminate"></div>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <span class="card-title grey-text text-darken-4">Инфо
                        <i class="material-icons right">close</i>
                    </span>
                    <p>Спасибо, что решили протестировать beta-версию DnevnikClient. Я очень это ценю. <br>Обо всех ошибках просьба сообщать, открывая Issue в <a href="https://github.com/limitedeternity/dnevnik-client/" target="_blank" rel="noopener">репозитории на GitHub</a>. <br>Надеюсь, вам нравится клиент, и вы довольны его функционалом и проделанной мной работой. <br>Напоминаю, что проект - Open Source, так что вы в любой момент можете помочь разработке. <br>By <a href="https://github.com/limitedeternity/" target="_blank" rel="noopener">@limitedeternity</a></p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import anchorme from "anchorme";

export default {
  name: 'Home',
  computed: {
    ...mapGetters([
      'isLoggedIn',
      'userData',
      'feedData',
      'feedLoad'
    ]),
    user() {
      return this.userData ? this.userData.firstName : 'товарищ'
    }
  },
  methods: {
    coloring(mood) {
      switch (mood) {
        case 'AllIsGood':
        case 'Good':
          return 'teal'
        
        case 'О':
        case 'Average':
          return '#FF5722'
        
        case 'AllIsBad':
        case 'Н':
        case 'Bad':
          return 'red'
        
        case 'П':
        case 'Б':
          return '#01579B'
        
        default:
          return '#212121'
      } 
    },
    linkReplace(text) {
        let replacedText = anchorme(text, {
            emails: false,
	        attributes: [
		        {
			        name: "target",
			        value: "_blank"
		        },
                {
                    name:"rel",
                    value:"noopener"
                }
	        ]
        });
        let parsedText = (new DOMParser()).parseFromString(replacedText, "text/html");
        Array.from(parsedText.getElementsByTagName('a')).forEach(link => link.innerText = "[ссылка]");
        return parsedText.querySelector("body").innerHTML;
    },
    fetchFeed() {
        if (this.feedLoad) {
            this.$store.commit('fetchFeed');
        }
    }
  }
}
</script>

