/**
 * 标签页树状态管理 Store
 * 
 * 职责：
 * - 管理标签页树状结构数据
 * - 提供树操作方法（添加、删除、移动）
 * - 计算派生状态（扁平化、按窗口分组等）
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TabTreeNode, FlattenedNode } from '@/types';

export const useTabsStore = defineStore('tabs', () => {
    // ==================== State ====================

    /**
     * 标签页树数组（根节点）
     */
    const tabTree = ref<TabTreeNode[]>([]);

    /**
     * 当前活跃的标签页ID
     */
    const activeTabId = ref<number | null>(null);

    /**
     * 按窗口分组的节点映射
     */
    const windowGroups = ref<Record<number, TabTreeNode[]>>({});

    // ==================== Getters ====================

    /**
     * 扁平化的标签页列表（深度优先遍历）
     */
    const flattenedTabs = computed<FlattenedNode[]>(() => {
        const result: FlattenedNode[] = [];

        function traverse(nodes: TabTreeNode[], depth = 0) {
            for (const node of nodes) {
                result.push({ ...node, depth });
                if (node.children.length > 0) {
                    traverse(node.children, depth + 1);
                }
            }
        }

        traverse(tabTree.value);
        return result;
    });

    /**
     * 按窗口ID分组的标签页
     */
    const tabsByWindow = computed<Record<number, TabTreeNode[]>>(() => {
        const groups: Record<number, TabTreeNode[]> = {};

        function collectByWindow(nodes: TabTreeNode[]) {
            for (const node of nodes) {
                if (!groups[node.windowId]) {
                    groups[node.windowId] = [];
                }
                groups[node.windowId].push(node);

                if (node.children.length > 0) {
                    collectByWindow(node.children);
                }
            }
        }

        collectByWindow(tabTree.value);
        return groups;
    });

    /**
     * 当前活跃的标签页节点
     */
    const activeTab = computed<TabTreeNode | null>(() => {
        if (activeTabId.value === null) return null;

        function findTab(nodes: TabTreeNode[]): TabTreeNode | null {
            for (const node of nodes) {
                if (node.tabId === activeTabId.value) {
                    return node;
                }
                if (node.children.length > 0) {
                    const found = findTab(node.children);
                    if (found) return found;
                }
            }
            return null;
        }

        return findTab(tabTree.value);
    });

    /**
     * 根节点列表
     */
    const rootNodes = computed<TabTreeNode[]>(() => {
        return tabTree.value.filter(node => !node.parentId);
    });

    /**
     * 标签页总数
     */
    const tabCount = computed<number>(() => {
        return flattenedTabs.value.length;
    });

    // ==================== Actions ====================

    /**
     * 添加标签页到树
     */
    function addTab(tab: TabTreeNode) {
        if (tab.parentId) {
            // 添加为子节点
            const parent = findNodeById(tab.parentId);
            if (parent) {
                parent.children.push(tab);
            } else {
                // 父节点不存在，添加为根节点
                tabTree.value.push(tab);
            }
        } else {
            // 添加为根节点
            tabTree.value.push(tab);
        }
    }

    /**
     * 移除标签页
     */
    function removeTab(nodeId: string) {
        function remove(nodes: TabTreeNode[], parentArray: TabTreeNode[]): boolean {
            const index = nodes.findIndex(n => n.id === nodeId);
            if (index !== -1) {
                nodes.splice(index, 1);
                return true;
            }

            for (const node of nodes) {
                if (remove(node.children, node.children)) {
                    return true;
                }
            }

            return false;
        }

        remove(tabTree.value, tabTree.value);
    }

    /**
     * 移动标签页
     */
    function moveTab(nodeId: string, newParentId?: string, index?: number) {
        // 找到要移动的节点
        const node = findNodeById(nodeId);
        if (!node) return;

        // 从原位置移除
        removeTab(nodeId);

        // 添加到新位置
        if (newParentId) {
            node.parentId = newParentId;
            const parent = findNodeById(newParentId);
            if (parent) {
                if (index !== undefined) {
                    parent.children.splice(index, 0, node);
                } else {
                    parent.children.push(node);
                }
            }
        } else {
            node.parentId = undefined;
            if (index !== undefined) {
                tabTree.value.splice(index, 0, node);
            } else {
                tabTree.value.push(node);
            }
        }
    }

    /**
     * 更新标签页
     */
    function updateTab(nodeId: string, updates: Partial<TabTreeNode>) {
        const node = findNodeById(nodeId);
        if (node) {
            Object.assign(node, updates);
        }
    }

    /**
     * 设置活跃标签页
     */
    function setActiveTab(tabId: number | null) {
        activeTabId.value = tabId;

        // 更新所有节点的isActive状态
        function updateActive(nodes: TabTreeNode[]) {
            for (const node of nodes) {
                node.isActive = node.tabId === tabId;
                if (node.children.length > 0) {
                    updateActive(node.children);
                }
            }
        }
        updateActive(tabTree.value);
    }

    /**
     * 清空树
     */
    function clearTree() {
        tabTree.value = [];
        activeTabId.value = null;
        windowGroups.value = {};
    }

    /**
     * 根据ID查找节点
     */
    function findNodeById(nodeId: string): TabTreeNode | null {
        function find(nodes: TabTreeNode[]): TabTreeNode | null {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    return node;
                }
                if (node.children.length > 0) {
                    const found = find(node.children);
                    if (found) return found;
                }
            }
            return null;
        }

        return find(tabTree.value);
    }

    /**
     * 根据tabId查找节点
     */
    function findNodeByTabId(tabId: number): TabTreeNode | null {
        function find(nodes: TabTreeNode[]): TabTreeNode | null {
            for (const node of nodes) {
                if (node.tabId === tabId) {
                    return node;
                }
                if (node.children.length > 0) {
                    const found = find(node.children);
                    if (found) return found;
                }
            }
            return null;
        }

        return find(tabTree.value);
    }

    // ==================== Return ====================

    return {
        // State
        tabTree,
        activeTabId,
        windowGroups,

        // Getters
        flattenedTabs,
        tabsByWindow,
        activeTab,
        rootNodes,
        tabCount,

        // Actions
        addTab,
        removeTab,
        moveTab,
        updateTab,
        setActiveTab,
        clearTree,
        findNodeById,
        findNodeByTabId,
    };
});
