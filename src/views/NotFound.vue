<template>
  <div class="col s12 offset-m1 m10 offset-l2 l8 offset-xl4 xl4">
    <div class="card">
      <div class="card-content white-text">
        <span class="card-title">Подождите-ка...</span>
        <p>{{ message }}</p>
      </div>
      <div v-if="error" class="card-action">
        <router-link :to="{name: 'home'}" replace>Домой</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
div.card {
  background-color: #844204;
}
</style>


<script>
export default {
  name: "NotFound",
  data() {
    return {
      error: false,
      message: "Я пытаюсь понять, что произошло..."
    };
  },
  methods: {
    setError() {
      setTimeout(() => {
        this.error = true;
        this.message = 'Похоже, вы где-то ошиблись. Кнопка "Домой" чуть ниже.'; // eslint-disable-line
      }, 3500);
    }
  },
  mounted() {
    this.setError();
  }
};
</script>
