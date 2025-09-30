<template>
  <div
    class="tree-node"
    :class="{
      'is-active': node.isActive,
      'is-loading': node.isLoading,
      'is-pinned': node.isPinned,
      'has-children': hasChildren,
    }"
    :style="{ paddingLeft: `${indentSize}px` }"
    @click.stop="$emit('click', node)"
    @contextmenu.prevent="$emit('contextmenu', node, $event)"
  >
    <!-- 折叠按钮 -->
    <button
      v-if="hasChildren"
      class="collapse-button"
      :class="{ 'expanded': !isCollapsed, 'collapsed': isCollapsed }"
      @click.stop="$emit('toggle-collapse', node)"
    >
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
    </button>

    <!-- 占位符（无子节点时保持对齐） -->
    <span v-else class="collapse-placeholder"></span>

    <!-- Favicon -->
    <img
      v-if="node.favicon"
      :src="node.favicon"
      class="node-favicon"
      alt=""
      @error="handleFaviconError"
    />
    <span v-else class="node-favicon favicon-placeholder">🌐</span>

    <!-- 标题 -->
    <span class="node-title">{{ node.title || 'Untitled' }}</span>

    <!-- 折叠时的子节点数量 -->
    <span v-if="isCollapsed && hasChildren" class="children-count">
      {{ node.children.length }}
    </span>

    <!-- 状态图标 -->
    <div class="node-icons">
      <!-- 加载指示器 -->
      <span v-if="node.isLoading" class="loading-indicator" title="加载中">
        ⏳
      </span>

      <!-- 音频播放图标 -->
      <span v-if="node.isAudioPlaying" class="audio-icon" title="播放音频">
        🔊
      </span>

      <!-- 固定图标 -->
      <span v-if="node.isPinned" class="pin-icon" title="已固定">
        📌
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUIStore } from '@/stores/ui';
import type { TabTreeNode } from '@/types';

// Props
interface Props {
  node: TabTreeNode;
}

const props = defineProps<Props>();

// Emits
interface Emits {
  (e: 'click', node: TabTreeNode): void;
  (e: 'toggle-collapse', node: TabTreeNode): void;
  (e: 'contextmenu', node: TabTreeNode, event: MouseEvent): void;
}

defineEmits<Emits>();

// Store
const uiStore = useUIStore();

// Computed
/**
 * 是否有子节点
 */
const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

/**
 * 是否折叠
 */
const isCollapsed = computed(() => {
  return uiStore.isNodeCollapsed(props.node.id);
});

/**
 * 缩进大小（基于深度）
 */
const indentSize = computed(() => {
  return 8 + props.node.depth * 20;
});

// State
const faviconError = ref(false);

// Methods
/**
 * 处理favicon加载错误
 */
function handleFaviconError() {
  faviconError.value = true;
}
</script>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  height: 32px;
  padding-right: 8px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s;
  border-radius: 4px;
  margin: 1px 4px;
}

.tree-node:hover {
  background-color: #f1f3f4;
}

.tree-node.is-active {
  background-color: #e8f0fe;
  font-weight: 500;
}

.tree-node.is-loading {
  opacity: 0.7;
}

/* 折叠按钮 */
.collapse-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 4px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  border-radius: 2px;
  transition: background-color 0.15s;
}

.collapse-button:hover {
  background-color: #dadce0;
}

.collapse-icon {
  font-size: 10px;
  color: #5f6368;
}

/* 子节点数量标记 */
.children-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  margin-left: 8px;
  background-color: #e8eaed;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 500;
  color: #5f6368;
}

.collapse-placeholder {
  width: 20px;
  height: 20px;
  margin-right: 4px;
  flex-shrink: 0;
}

/* Favicon */
.node-favicon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  flex-shrink: 0;
  border-radius: 2px;
}

.favicon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* 标题 */
.node-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #202124;
}

.tree-node.is-active .node-title {
  color: #1967d2;
}

/* 状态图标 */
.node-icons {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.loading-indicator,
.audio-icon,
.pin-icon {
  font-size: 12px;
  opacity: 0.7;
}

/* 固定节点样式 */
.tree-node.is-pinned {
  border-left: 2px solid #1967d2;
}

/* 有子节点的样式 */
.tree-node.has-children {
  font-weight: 500;
}
</style>
