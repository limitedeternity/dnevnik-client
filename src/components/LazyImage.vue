<template>
  <img :data-src="lazySrc" :data-srcset="lazySrcset" :style="style" class="LazyImage" alt>
</template>

<style>
.LazyImage {
  width: 100%;
  height: 100%;
}
</style>

<script>
import lozad from "lozad";

export default {
  name: "LazyImage",
  props: {
    backgroundColor: {
      type: String,
      default: "#efefef"
    },
    height: {
      type: Number,
      default: null,
      required: true
    },
    width: {
      type: Number,
      default: null,
      required: true
    },
    lazySrc: {
      type: String,
      default: null,
      required: true
    },
    lazySrcset: {
      type: String,
      default: null
    }
  },
  computed: {
    aspectRatio() {
      return (this.height / this.width) * 100;
    },
    style() {
      let styleObj = {
        backgroundColor: this.backgroundColor
      };

      if (this.loading) {
        return {
          ...styleObj,
          height: "0px",
          paddingTop: `${this.aspectRatio}%`
        };
      }

      return styleObj;
    }
  },
  data() {
    return {
      loading: true
    };
  },
  mounted() {
    this.$el.onload = () => {
      this.loading = false;
    };

    lozad(this.$el).observe();
  }
};
</script>
