<template>
  <div v-if="graphUrl">
    <h2>Traffic Graph</h2>
    <img :src="fullGraphUrl" alt="Traffic Graph" @error="handleImageError">
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TrafficGraph',
  props: ['graphUrl'],
  data() {
    return {
      imageBlob: null
    };
  },
  computed: {
    fullGraphUrl() {
      return this.imageBlob ? URL.createObjectURL(this.imageBlob) : '';
    }
  },
  watch: {
    graphUrl: {
      immediate: true,
      handler(newUrl) {
        if (newUrl) {
          this.fetchGraphImage(newUrl);
        }
      }
    }
  },
  methods: {
    async fetchGraphImage(url) {
      try {
        const response = await axios.get(`http://localhost:5000${url}`, {
          responseType: 'blob'
        });
        this.imageBlob = new Blob([response.data], { type: 'image/png' });
      } catch (error) {
        console.error('Error fetching graph image:', error);
      }
    },
    handleImageError() {
      console.error('Failed to load graph image');
    }
  }
};
</script>