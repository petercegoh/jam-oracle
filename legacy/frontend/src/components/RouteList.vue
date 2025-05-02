<template>
  <div v-if="routes.length">
    <h2>Available Routes</h2>
    <ul>
      <li v-for="(route, index) in routes" :key="index">
        <p>{{ route.summary }}</p>
        <p>Distance: {{ route.distance }}</p>
        <p>Duration (typical): {{ route.duration_typical }}</p>
        <p>Duration (in traffic): {{ route.duration_considering_traffic }}</p>
        <button @click="selectRoute(route.graph_url)">View Traffic Graph</button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'RouteList',
  props: ['routes'],
  methods: {
    selectRoute(graphUrl) {
      this.$emit('select-route', graphUrl);
    }
  }
};
</script>