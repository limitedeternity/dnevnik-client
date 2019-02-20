<template>
  <div class="col s12 offset-m1 m10 offset-l2 l8 offset-xl4 xl4" v-if="isLoggedIn">
    <div class="card">
      <div class="card-image">
        <lazy-image
          :width="428"
          :height="321"
          :background-color="'#0d2969'"
          :lazy-src="'/img/stats.jpg'"
        />
      </div>
      <div class="card-content">
        <span class="card-title grey-text text-darken-4">Статистика</span>
        <template v-if="!statsLoad">
          <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>
          <ul
            class="collection"
            v-if="statsData.AllMarks.length && statsData.AllMarks[0].SubjectMarks.length"
          >
            <template v-for="(subjectData, subjectIndex) in statsData.AllMarks[0].SubjectMarks">
              <li class="collection-item avatar z-depth-1" :key="`item-${subjectIndex}`">
                <i
                  class="material-icons circle white"
                  :style="{color: 'blue', transform: 'scale(1.5)'}"
                >timeline</i>

                <div :style="{display: 'block', clear: 'both', height: '6px'}"></div>

                <span class="title" :style="{color: 'blue'}">{{ subjectData.Name }}</span>

                <div :style="{display: 'block', clear: 'both', height: '5px'}"></div>

                <div v-if="subjectData.Marks.length">
                  <template v-for="(markConstruct, markIndex) in Counter(subjectData.Marks)">
                    <p
                      :key="`mark-${subjectIndex}-${markIndex}`"
                      :style="{color: coloring(markConstruct.value[1])}"
                    >{{ markConstruct.value[0] }} : {{ markConstruct.count }}</p>
                  </template>
                </div>
                <div v-else>
                  <p style="color: teal;">Оценки: нет</p>
                </div>

                <p
                  v-if="subjectData.Avg && subjectData.Avg.Value"
                  :style="{color: coloring()}"
                >Среднее значение: {{ subjectData.Avg.Value }}</p>
                <p
                  v-if="subjectData.FinalMark"
                  :style="{color: coloring(subjectData.FinalMark.Values[0].Mood)}"
                >Итоговое значение: {{ subjectData.FinalMark.Values[0].Value }}</p>
              </li>
              <div
                :style="{display: 'block', clear: 'both', height: '3px'}"
                :key="`delimiter-${subjectIndex}`"
              ></div>
            </template>
          </ul>
          <div v-else class="card-panel teal center">
            <span class="white-text">Статистика пуста.</span>
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
      <span class="white-text">Для просмотра этой страницы вам необходимо авторизоваться.</span>
    </div>
  </div>
</template>

<script>
import LazyImage from "@/components/LazyImage";

import { mapGetters, mapActions } from "vuex";
import coloring from "./methods/coloring";

export default {
  name: "Stats",
  components: {
    LazyImage
  },
  computed: {
    ...mapGetters(["isLoggedIn", "statsData", "statsLoad"])
  },
  methods: {
    ...mapActions(["fetchStats"]),
    coloring,
    Counter(obj) {
      function compressArray(original) {
        let compressed = [];
        let copy = original.slice(0);

        for (let k = 0; k < original.length; k++) {
          let count = 0;

          for (let w = 0; w < copy.length; w++) {
            if (JSON.stringify(original[k]) === JSON.stringify(copy[w])) {
              count++;
              delete copy[w];
            }
          }

          if (count > 0) {
            compressed.push({
              value: original[k],
              count: count
            });
          }
        }

        return compressed;
      }

      let arr = [];

      for (let i = 0; i < obj.length; i++) {
        for (let j = 0; j < obj[i].Values.length; j++) {
          arr.push([obj[i].Values[j].Value, obj[i].Values[j].Mood]);
        }
      }

      arr.sort().reverse();
      return compressArray(arr);
    }
  },
  created() {
    this.fetchStats();
  }
};
</script>
