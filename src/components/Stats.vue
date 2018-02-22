<template>
  <div v-if="isLoggedIn">
    <div class="col s12 offset-m4 m4">
      <div class="card">
        <div class="card-image">
            <img src="../assets/images/stats.jpg">
        </div>
        <div class="card-content">
          <span class="card-title grey-text text-darken-4">Статистика</span>
            <div v-if="statsData">
              <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
              <ul class="collection">
                 <div v-for="(subjectData, index) in statsData.AllMarks[0].SubjectMarks" v-if="subjectData.Marks.length" :key="index">
                     <li class="collection-item avatar z-depth-1">
                       <i class="material-icons circle white" :style="{color: 'blue', transform: 'scale(1.5)'}">timeline</i>

                       <div :style="{display: 'block', clear: 'both', height: '6px'}"></div>

                       <span class="title" :style="{color: 'blue'}">{{ subjectData.Name }}</span>

                       <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>

                       <div v-for="(markConstruct, index) in Counter(subjectData.Marks)" :key="index">
                         <p :style="{color: coloring(markConstruct.value[1])}">{{ markConstruct.value[0] }} : {{ markConstruct.count }}</p>
                       </div>

                       <p :style="{color: coloring()}">Среднее значение: {{ subjectData.Avg.Value }}</p>
                       <p v-if="subjectData.FinalMark" :style="{color: coloring(subjectData.FinalMark.Values[0].Mood)}">Итоговое значение: {{ subjectData.FinalMark.Values[0].Value }}</p>
                     </li>
                     <div :style="{display: 'block', clear: 'both', height: '3px'}"></div>
                 </div>
              </ul>
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
import { mapGetters } from 'vuex';

export default {
  name: 'Stats',
  computed: {
    ...mapGetters([
      'isLoggedIn',
      'statsData'
    ])
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
    Counter(obj) {
      var compressArray = (original) => {
	        var compressed = [];
          var copy = original.slice(0);
          for (let i = 0; i < original.length; i++) {
		          var myCount = 0;	
		          for (let w = 0; w < copy.length; w++) {
			            if (JSON.stringify(original[i]) === JSON.stringify(copy[w])) {
				              myCount++;
				              delete copy[w];
			            }
		          }
 
		          if (myCount > 0) {
			            var a = new Object();
			            a.value = original[i];
			            a.count = myCount;
			            compressed.push(a);
		          }
	        }
	        return compressed;
      }

      var array = [];

      for (let i = 0; i < obj.length; i++) {
        for (let j = 0; j < obj[i].Values.length; j++) {
          array.push(new Array(obj[i].Values[j].Value, obj[i].Values[j].Mood))
        }
      }

      array = array.sort().reverse();
      return compressArray(array);
    }
  },
  mounted() {
    this.$store.commit('fetchStats');
  }
}
</script>
