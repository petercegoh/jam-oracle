<template>
  <form @submit.prevent="onSubmit">
    <input v-model="start" placeholder="Start location" required>
    <input v-model="end" placeholder="End location" required>
    <button type="submit">Get Routes</button>
  </form>
</template>

<script>
export default {
  name: 'RouteForm',
  data() {
    return {
      start: '',
      end: ''
    };
  },
  methods: {
    onSubmit() {
      this.$emit('submit', this.start, this.end);
    }
  }
};
</script>