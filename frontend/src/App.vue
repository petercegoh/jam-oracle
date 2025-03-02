<template>
  <div id="app">
    <h1>Traffic Route Planner</h1>
    <RouteForm @submit="getRoutes" />
    <RouteList :routes="routes" @select-route="selectRoute" />
    <TrafficGraph :graphUrl="selectedGraphUrl" v-if="selectedGraphUrl" />
  </div>
</template>

<script>
import axios from 'axios';
import RouteForm from './components/RouteForm.vue';
import RouteList from './components/RouteList.vue';
import TrafficGraph from './components/TrafficGraph.vue';

export default {
  name: 'App',
  components: {
    RouteForm,
    RouteList,
    TrafficGraph
  },
  data() {
    return {
      routes: [],
      selectedGraphUrl: null
    };
  },
  methods: {
    async getRoutes(start, end) {
      try {
        const response = await axios.get(`http://localhost:5000/get-routes-and-graphs?start=${start}&end=${end}`);
        this.routes = response.data.routes;
        this.selectedGraphUrl = null;
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    },
    selectRoute(graphUrl) {
      this.selectedGraphUrl = graphUrl;
    }
  }
};
</script>