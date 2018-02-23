<template>
<div v-if="isLoggedIn">
  <div class="col s12 offset-m4 m4">
    <div class="card">
        <div class="card-image">
            <img src="../assets/images/office.jpg">
        </div>
        <div class="card-content">
            <span class="card-title grey-text text-darken-4">Дневник</span>
            <div v-if="!dnevnikLoad">
                <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                <ul class="pagination center">
                    <li class="waves-effect">
                      <a @click="skipDays--">
                        <i class="material-icons">chevron_left</i>
                      </a>
                    </li>
                    <li class="waves-effect">
                      <a @click="skipDays = 0">
                        <i class="material-icons">cached</i>
                      </a>
                    </li>
                    <li class="waves-effect">
                      <a @click="skipDays++">
                        <i class="material-icons">chevron_right</i>
                      </a>
                    </li>
                </ul>
                <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
                <ul class="collection" v-if="dnevnikData.Days[0].Schedule.length">
                      <div v-for="(lesson, index) in dnevnikData.Days[0].Schedule" :key="index" v-if="lesson.Subject">
                              <li class="collection-item avatar z-depth-1">
                        
                                <i class="material-icons circle white" :style="{color: '#039be5', transform: 'scale(1.5)'}">format_list_bulleted</i>
                                
                                <div :style="{display: 'block', clear: 'both', height: '8px'}"></div>
                                <a :href="`https://schools.dnevnik.ru/lesson.aspx?school=${userData.schools[0].id}&lesson=${lesson.LessonId}`" target="_blank" rel="noopener">
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
                              <div :style="{display: 'block', clear: 'both', height: '3px'}"></div>
                      </div>
                </ul>
                <div v-else class="card-panel teal center">
                    <span class="white-text">Уроков нет.
                    </span>
                </div>
            </div>
            <div v-else>
              <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
              <div class="progress">
                  <div class="indeterminate"></div>
              </div>
            </div>
        </div>
    </div>
  </div>
</div>
<div v-else>
  <div class="col s12 m5">
        <div class="card-panel red">
            <span class="white-text">Для просмотра этой страницы вам необходимо авторизоваться.
            </span>
        </div>
    </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex'
import Autolinker from 'autolinker';

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
      this.fetchData(false);
    }
  },
  methods: {
    fetchData(write) {
      this.$store.commit("fetchDnevnik", {amount: this.skipDays, shouldWrite: write});
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
      return Autolinker.link(text, {
        replaceFn: (match) => {
          switch(match.getType()) {
            case 'url':
              return `<a href='${match.getUrl()}' rel='noopener' target='_blank'>[ссылка]</a>`
            
            case 'mention':
            case 'hashtag':
              return false;
              
            case 'phone':
            case 'email':
              return true;
          }
        }
      });
    }
  },
  mounted() {
    this.fetchData(true);
  }
};
</script>

