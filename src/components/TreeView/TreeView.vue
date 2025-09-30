<template>
  <div class="tree-view">
    <!-- 空状态 -->
    <div v-if="visibleNodes.length === 0" class="empty-state">
      <p>{{ emptyMessage }}</p>
    </div>

    <!-- 树节点列表 -->
    <div v-else class="tree-nodes">
      <TreeNode
        v-for="node in visibleNodes"
        :key="node.id"
        :node="node"
        @click="handleNodeClick(node)"
        @toggle-collapse="handleToggleCollapse(node)"
        @contextmenu="handleContextMenu(node, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useUIStore } from '@/stores/ui';
import TreeNode from './TreeNode.vue';
import type { TabTreeNode } from '@/types';

// Stores
const tabsStore = useTabsStore();
const uiStore = useUIStore();

// Computed
/**
 * 可见的节点列表（考虑折叠和搜索）
 */
const visibleNodes = computed<TabTreeNode[]>(() => {
  const searchQuery = uiStore.searchQuery.toLowerCase();
  const collapsed = uiStore.collapsedNodes;
  
  function filterNodes(nodes: TabTreeNode[]): TabTreeNode[] {
    const result: TabTreeNode[] = [];
    
    for (const node of nodes) {
      // 检查是否匹配搜索查询
      const matchesSearch = !searchQuery || 
        node.title.toLowerCase().includes(searchQuery) ||
        node.url.toLowerCase().includes(searchQuery);
      
      if (matchesSearch && node.isVisible) {
        result.push(node);
        
        // 如果节点未折叠，递归处理子节点
        if (!collapsed.has(node.id) && node.children.length > 0) {
          result.push(...filterNodes(node.children));
        }
      } else if (node.children.length > 0) {
        // 即使父节点不匹配，也检查子节点
        const matchingChildren = filterNodes(node.children);
        if (matchingChildren.length > 0) {
          result.push(node);
          if (!collapsed.has(node.id)) {
            result.push(...matchingChildren);
          }
        }
      }
    }
    
    return result;
  }
  
  return filterNodes(tabsStore.tabTree);
});

/**
 * 空状态消息
 */
const emptyMessage = computed(() => {
  if (uiStore.hasSearchQuery) {
    return '没有找到匹配的标签页';
  }
  return '没有打开的标签页';
});

// Methods
/**
 * 处理节点点击
 */
async function handleNodeClick(node: TabTreeNode) {
  console.log('Node clicked:', node.title);
  
  // 激活标签页
  await tabsStore.activateTab(node.tabId);
}

/**
 * 处理折叠切换
 */
function handleToggleCollapse(node: TabTreeNode) {
  uiStore.toggleCollapse(node.id);
}

/**
 * 处理节点右键菜单
 */
function handleContextMenu(node: TabTreeNode, event: MouseEvent) {
  console.log('Context menu:', node.title, event);
  // 右键菜单功能将在后续任务中完善
}
</script>

<style scoped>
.tree-view {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #80868b;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

/* 树节点容器 */
.tree-nodes {
  padding: 4px 0;
}

/* 滚动条样式 */
.tree-view::-webkit-scrollbar {
  width: 8px;
}

.tree-view::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tree-view::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.tree-view::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
