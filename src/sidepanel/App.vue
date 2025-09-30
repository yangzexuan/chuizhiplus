<template>
  <div class="app">
    <header class="header">
      <h1>Chrome树状标签管理器</h1>
    </header>
    <main class="main">
      <p>正在初始化...</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  console.log('Side Panel已加载');
});
</script>

<style scoped>
.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.main {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}
</style>
