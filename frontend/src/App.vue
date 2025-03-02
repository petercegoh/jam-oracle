<template>
  <div id="app">
    <h1>Traffic Route Planner</h1>
    <RouteForm @submit="getRoutes" />
    <RouteList :routes="routes" @select-route="selectRoute" />
    <TrafficGraph :graphUrl="selectedGraphUrl" v-if="selectedGraphUrl" />
  </div>
</template>

<script>
import api from './services/api';
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
      console.log('Fetching routes for:', { start, end });
      try {
        const response = await api.get(`/get-routes-and-graphs`, {
          params: { start, end }
        });
        this.routes = response.data.routes;
        this.selectedGraphUrl = null;
      } catch (error) {
        console.error('Error fetching routes:', error);
        // Add more detailed error logging
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
      }
    },
    selectRoute(graphUrl) {
      this.selectedGraphUrl = graphUrl;
    }
  }
};
</script>