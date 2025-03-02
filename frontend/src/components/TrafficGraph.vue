<template>
  <div v-if="graphUrl">
    <h2>Traffic Graph</h2>
    <img :src="fullGraphUrl" alt="Traffic Graph">
  </div>
</template>

<script>
export default {
  name: 'TrafficGraph',
  props: ['graphUrl'],
  computed: {
    fullGraphUrl() {
      return `http://localhost:5000${this.graphUrl}`;
    }
  }
};
</script>