/**
 * UI状态管理 Store
 * 
 * 职责：
 * - 管理UI交互状态（折叠、选择、拖拽等）
 * - 管理搜索和过滤状态
 * - 提供UI状态的查询和更新接口
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DragState } from '@/types';

export const useUIStore = defineStore('ui', () => {
    // ==================== State ====================

    /**
     * 折叠的节点ID集合
     */
    const collapsedNodes = ref<Set<string>>(new Set());

    /**
     * 搜索查询字符串
     */
    const searchQuery = ref('');

    /**
     * 当前选中的节点ID
     */
    const selectedNodeId = ref<string | null>(null);

    /**
     * 拖拽状态
     */
    const dragState = ref<DragState | null>(null);

    /**
     * 是否显示面板
     */
    const isPanelVisible = ref(true);

    /**
     * 当前激活的过滤器
     */
    const activeFilters = ref<Set<string>>(new Set());

    // ==================== Getters ====================

    /**
     * 是否有搜索查询
     */
    const hasSearchQuery = computed(() => {
        return searchQuery.value.trim().length > 0;
    });

    /**
     * 是否有激活的过滤器
     */
    const hasActiveFilters = computed(() => {
        return activeFilters.value.size > 0;
    });

    /**
     * 是否正在拖拽
     */
    const isDragging = computed(() => {
        return dragState.value !== null;
    });

    // ==================== Actions ====================

    /**
     * 切换节点折叠状态
     */
    function toggleCollapse(nodeId: string) {
        if (collapsedNodes.value.has(nodeId)) {
            collapsedNodes.value.delete(nodeId);
        } else {
            collapsedNodes.value.add(nodeId);
        }
    }

    /**
     * 折叠节点
     */
    function collapseNode(nodeId: string) {
        collapsedNodes.value.add(nodeId);
    }

    /**
     * 展开节点
     */
    function expandNode(nodeId: string) {
        collapsedNodes.value.delete(nodeId);
    }

    /**
     * 折叠所有节点
     */
    function collapseAll(nodeIds: string[]) {
        nodeIds.forEach(nodeId => {
            collapsedNodes.value.add(nodeId);
        });
    }

    /**
     * 展开所有节点
     */
    function expandAll() {
        collapsedNodes.value.clear();
    }

    /**
     * 检查节点是否折叠
     */
    function isNodeCollapsed(nodeId: string): boolean {
        return collapsedNodes.value.has(nodeId);
    }

    /**
     * 设置搜索查询
     */
    function setSearchQuery(query: string) {
        searchQuery.value = query;
    }

    /**
     * 清除搜索查询
     */
    function clearSearch() {
        searchQuery.value = '';
    }

    /**
     * 选择节点
     */
    function selectNode(nodeId: string) {
        selectedNodeId.value = nodeId;
    }

    /**
     * 清除选择
     */
    function clearSelection() {
        selectedNodeId.value = null;
    }

    /**
     * 检查节点是否被选中
     */
    function isNodeSelected(nodeId: string): boolean {
        return selectedNodeId.value === nodeId;
    }

    /**
     * 开始拖拽
     */
    function startDrag(state: DragState) {
        dragState.value = state;
    }

    /**
     * 更新拖拽状态
     */
    function updateDragState(updates: Partial<DragState>) {
        if (dragState.value) {
            Object.assign(dragState.value, updates);
        }
    }

    /**
     * 结束拖拽
     */
    function endDrag() {
        dragState.value = null;
    }

    /**
     * 切换面板可见性
     */
    function togglePanel() {
        isPanelVisible.value = !isPanelVisible.value;
    }

    /**
     * 设置面板可见性
     */
    function setPanelVisible(visible: boolean) {
        isPanelVisible.value = visible;
    }

    /**
     * 添加过滤器
     */
    function addFilter(filterId: string) {
        activeFilters.value.add(filterId);
    }

    /**
     * 移除过滤器
     */
    function removeFilter(filterId: string) {
        activeFilters.value.delete(filterId);
    }

    /**
     * 清除所有过滤器
     */
    function clearFilters() {
        activeFilters.value.clear();
    }

    /**
     * 检查过滤器是否激活
     */
    function isFilterActive(filterId: string): boolean {
        return activeFilters.value.has(filterId);
    }

    /**
     * 重置UI状态
     */
    function reset() {
        collapsedNodes.value.clear();
        searchQuery.value = '';
        selectedNodeId.value = null;
        dragState.value = null;
        activeFilters.value.clear();
    }

    // ==================== Return ====================

    return {
        // State
        collapsedNodes,
        searchQuery,
        selectedNodeId,
        dragState,
        isPanelVisible,
        activeFilters,

        // Getters
        hasSearchQuery,
        hasActiveFilters,
        isDragging,

        // Actions
        toggleCollapse,
        collapseNode,
        expandNode,
        collapseAll,
        expandAll,
        isNodeCollapsed,
        setSearchQuery,
        clearSearch,
        selectNode,
        clearSelection,
        isNodeSelected,
        startDrag,
        updateDragState,
        endDrag,
        togglePanel,
        setPanelVisible,
        addFilter,
        removeFilter,
        clearFilters,
        isFilterActive,
        reset,
    };
});
