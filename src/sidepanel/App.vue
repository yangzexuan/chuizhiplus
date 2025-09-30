<template>
  <div class="app">
    <header class="header">
      <h1>Chrome树状标签管理器</h1>
    </header>

    <section class="search-bar">
      <input
        type="text"
        class="search-input"
        placeholder="搜索标签页..."
        v-model="searchQuery"
      />
    </section>

    <main class="main">
      <TreeView />
    </main>

    <footer class="footer">
      <div class="status-info">
        <span class="tab-count">标签页: {{ tabCount }}</span>
        <span class="window-count">窗口: {{ windowCount }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TreeView from '@/components/TreeView/TreeView.vue';
import { useTabsStore } from '@/stores/tabs';
import { useUIStore } from '@/stores/ui';

// Stores
const tabsStore = useTabsStore();
const uiStore = useUIStore();

// 响应式数据
const searchQuery = computed({
  get: () => uiStore.searchQuery,
  set: (value: string) => uiStore.setSearchQuery(value),
});

const tabCount = computed(() => tabsStore.tabCount);
const windowCount = ref(0);

// 组件挂载
onMounted(() => {
  console.log('Side Panel已加载');
  
  // 初始化数据（后续会从Chrome API获取）
  initializeData();
});

/**
 * 初始化数据
 */
async function initializeData() {
  try {
    // 获取标签页和窗口信息
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_TABS' });
    if (response.success) {
      tabCount.value = response.data.length;
    }

    const windowsResponse = await chrome.runtime.sendMessage({ type: 'GET_ALL_WINDOWS' });
    if (windowsResponse.success) {
      windowCount.value = windowsResponse.data.length;
    }
  } catch (error) {
    console.error('初始化数据失败:', error);
  }
}
</script>

<style scoped>
.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  color: #333333;
}

/* 头部 */
.header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #202124;
}

/* 搜索栏 */
.search-bar {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.search-input::placeholder {
  color: #80868b;
}

/* 主内容区域 */
.main {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}



/* 底部状态栏 */
.footer {
  padding: 8px 16px;
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.status-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #5f6368;
}

.tab-count,
.window-count {
  display: inline-flex;
  align-items: center;
}

/* 滚动条样式 */
.main::-webkit-scrollbar {
  width: 8px;
}

.main::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.main::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.main::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>