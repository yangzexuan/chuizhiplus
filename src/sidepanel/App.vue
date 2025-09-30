<template>
  <div class="app">
    <header class="app-header">
      <h1>Chrome Tree Tab Manager</h1>
    </header>

    <main class="app-main">
      <div class="placeholder">
        <p>Vue应用已成功加载</p>
        <p>待实现：树状结构展示</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  console.log('App component mounted');
});
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  padding: 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.app-header h1 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.app-main {
  flex: 1;
  padding: 1rem;
}

.placeholder {
  text-align: center;
  color: #666;
}

.placeholder p {
  margin: 0.5rem 0;
}
</style>