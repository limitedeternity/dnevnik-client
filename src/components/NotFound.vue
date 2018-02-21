<template>
    <div class="col s12 m6">
      <div class="card" style="background-color:#844204">
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

<script>
export default {
  name: 'NotFound',
  data() {
    return {
        error: false,
        message: 'Я пытаюсь понять, что произошло...'
    }
  },
  methods: {
    setError() {
        return setTimeout(() => {
            this.error = true;
            this.message = 'Похоже, вы где-то ошиблись. Кнопка "Домой" чуть ниже.'
        }, 3500)
    }
  },
  mounted() {
      this.setError();
  }
}
</script>
