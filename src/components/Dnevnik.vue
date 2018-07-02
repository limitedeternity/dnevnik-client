<template>
  <div class="col s12 offset-m1 m10 offset-l2 l8 offset-xl4 xl4" v-if="isLoggedIn">
    <div class="card">
        <div class="card-image">
            <img src="../assets/images/office.jpg" alt>
        </div>
        <div class="card-content">
            <span class="card-title grey-text text-darken-4">Дневник</span>
            <template v-if="!dnevnikLoad">
                <p style="font-size: 110%">({{ dnevnikData.Days[0].Date.split("T")[0] }})</p>

                <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                <ul class="pagination center">
                    <li class="waves-effect">
                      <a @click="skipDays -= 1">
                        <i class="material-icons">chevron_left</i>
                      </a>
                    </li>
                    <li class="waves-effect">
                      <a @click="skipDays = 0">
                        <i class="material-icons">history</i>
                      </a>
                    </li>
                    <li class="waves-effect">
                      <a @click="skipDays += 1">
                        <i class="material-icons">chevron_right</i>
                      </a>
                    </li>
                </ul>
                <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                <ul class="collection" v-if="dnevnikData.Days.length && dnevnikData.Days[0].Schedule.length">
                      <template v-for="(lesson, index) in dnevnikData.Days[0].Schedule" v-if="lesson.Subject">
                              <li class="collection-item avatar z-depth-1" :key="`item-${index}`">

                                <i class="material-icons circle white" :style="{color: '#039be5', transform: 'scale(1.5)'}">format_list_bulleted</i>

                                <div :style="{display: 'block', clear: 'both', height: '8px'}"></div>
                                <a href="#">
                                 <span class="title">#{{ index }}. {{ lesson.Subject.Name }}</span>
                                </a>

                                <a class="secondary-content waves-effect" :style="{ marginTop: '-.5em'}" onclick="this.firstChild.innerHTML === 'close' ? (() => { this.parentNode.style.opacity=0.35; this.firstChild.innerHTML='refresh' })() : (() => { this.parentNode.style.opacity=1.0; this.firstChild.innerHTML='close' })()">
                                  <i class="material-icons">close</i>
                                </a>

                                <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>

                                <div v-for="(mark, index) in lesson.Marks" :key="index">
                                    <p v-if="mark.MarkType === 'LogEntry'" class="text-darken-4" :style="{ color: coloring(mark.Values[0].Value) }">Присутствие: {{ mark.MarkTypeText }}</p>
                                    <p v-else-if="mark.MarkType === 'Mark'" class="text-darken-4" v-for="(markValue, index) in mark.Values" :key="index" :style="{ color: coloring(markValue.Mood)}">Оценка: {{ markValue.Value }} ({{ mark.MarkTypeText }})</p>
                                </div>

                                <div v-if="lesson.Theme">
                                  <p :style="{ color: coloring() }">Урок: {{ lesson.Theme }}</p>
                                </div>

                                <div v-if="lesson.HomeworksText">
                                  <p :style="{ color: coloring() }" v-html="`Д/З: ${linkReplace(lesson.HomeworksText)}`"></p>
                                </div>
                                <div v-else>
                                  <p :style="{ color: coloring() }">Д/З: нет</p>
                                </div>

                                <div :style="{display: 'block', clear: 'both', height: '8px'}"></div>

                              </li>
                              <div :style="{display: 'block', clear: 'both', height: '3px'}" :key="`delimiter-${index}`"></div>
                      </template>
                </ul>
                <div v-else class="card-panel teal center">
                    <span class="white-text">Уроков нет.
                    </span>
                </div>
            </template>
            <template v-else>
              <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
              <div class="progress">
                  <div class="indeterminate"></div>
              </div>
            </template>
        </div>
    </div>
  </div>
  <div class="col s12 offset-m1 m10 offset-l2 l8 offset-xl4 xl4" v-else>
    <div class="card-panel red">
        <span class="white-text">Для просмотра этой страницы вам необходимо авторизоваться.
        </span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import anchorme from 'anchorme';
import ls from 'store';

export default {
  name: "Dnevnik",
  computed: {
    ...mapGetters([
      "isLoggedIn",
      "dnevnikData",
      "userData",
      "dnevnikLoad"
    ])
  },
  data() {
    return {
      skipDays: 0
    }
  },
  watch: {
    skipDays() {
      this.fetchData();
    }
  },
  methods: {
    fetchData() {
      this.$store.commit("viewDnevnik", this.skipDays);

      if (!navigator.onLine) {
        return setTimeout(() => {
          let isFailed = ls.get('switchFailed');

          if (isFailed) {
            window.M.toast({html: '<span>Упс, там ничего не нашлось...</span><button class="btn-flat toast-action" onclick="window.M.Toast.dismissAll();">ОК</button>', displayLength: 2000});
            ls.remove('switchFailed');
            this.skipDays = 0;
          }
        }, 100);
      }
    },
    coloring(mood) {
      switch (mood) {
        case "AllIsGood":
        case "Good":
          return "teal"

        case "О":
        case "Average":
          return "#FF5722"

        case "AllIsBad":
        case "Н":
        case "Bad":
          return "red"

        case "П":
        case "Б":
          return "#01579B"

        default:
          return "#212121"
      }
    },
    linkReplace(text) {
      let escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&apos;'
      };

      let escapedText = text.replace(/[&<>"']/g, (match) => { return escapeMap[match] });
      let replacedText = anchorme(escapedText, {
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
    }
  }
};
</script>
