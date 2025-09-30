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
     * 移除标签页节点
     * 可以通过nodeId(字符串)或tabId(数字)移除
     * 移除父节点时，子节点会被保留并提升为根节点（或提升到父节点的父节点下）
     */
    function removeTab(identifier: string | number) {
        // 查找节点
        let node: TabTreeNode | null;
        if (typeof identifier === 'number') {
            node = findNodeByTabId(identifier);
        } else {
            node = findNodeById(identifier);
        }

        if (!node) {
            return;
        }

        // 保存子节点
        const children = [...node.children];

        // 从父节点中移除当前节点
        removeNodeFromParent(node);

        // 将子节点提升为根节点（或添加到当前节点的父节点下）
        if (node.parentId) {
            // 有父节点：将子节点添加到父节点下
            const parentNode = findNodeById(node.parentId);
            if (parentNode) {
                for (const child of children) {
                    child.parentId = parentNode.id;
                    child.depth = parentNode.depth + 1;
                    child.siblingIndex = parentNode.children.length;
                    parentNode.children.push(child);
                    updateDescendantsDepth(child);
                }
            } else {
                // 父节点不存在，提升为根节点
                for (const child of children) {
                    child.parentId = undefined;
                    child.depth = 0;
                    child.siblingIndex = tabTree.value.length;
                    tabTree.value.push(child);
                    updateDescendantsDepth(child);
                }
            }
        } else {
            // 无父节点：子节点提升为根节点
            for (const child of children) {
                child.parentId = undefined;
                child.depth = 0;
                child.siblingIndex = tabTree.value.length;
                tabTree.value.push(child);
                updateDescendantsDepth(child);
            }
        }

        updateWindowGroups();
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

    /**
     * 激活标签页
     */
    async function activateTab(tabId: number): Promise<void> {
        try {
            // 发送消息到Service Worker激活标签页
            const response = await chrome.runtime.sendMessage({
                type: 'ACTIVATE_TAB',
                tabId,
            });

            if (response.success) {
                // 更新活跃标签页ID
                setActiveTab(tabId);
            } else {
                console.error('激活标签页失败:', response.error);
            }
        } catch (error) {
            console.error('激活标签页时出错:', error);
        }
    }

    /**
     * 从Chrome标签页对象创建树节点并添加到树中
     * 自动处理父子关系
     */
    function addTabFromChrome(tab: chrome.tabs.Tab): string {
        // 参数验证
        if (!tab || tab.id === undefined) {
            console.warn('无效的标签页数据:', tab);
            return '';
        }

        // 检查是否已存在
        const existing = findNodeByTabId(tab.id);
        if (existing) {
            // 更新现有节点
            updateTab(existing.id, {
                title: tab.title || '',
                url: tab.url || '',
                favicon: tab.favIconUrl,
                isActive: tab.active || false,
                isPinned: tab.pinned || false,
                isAudioPlaying: tab.audible || false,
                isLoading: tab.status === 'loading',
            });
            return existing.id;
        }

        // 生成节点ID
        const nodeId = `tab-${tab.id}`;

        // 确定父节点
        let parentNodeId: string | undefined;
        let depth = 0;
        let siblingIndex = 0;

        if (tab.openerTabId !== undefined) {
            const parentNode = findNodeByTabId(tab.openerTabId);
            if (parentNode) {
                parentNodeId = parentNode.id;
                depth = parentNode.depth + 1;
                siblingIndex = parentNode.children.length;

                // 检查是否会创建循环引用
                if (wouldCreateCycle(nodeId, parentNodeId)) {
                    console.warn('检测到潜在的循环引用，将作为根节点添加');
                    parentNodeId = undefined;
                    depth = 0;
                }
            }
        }

        // 创建新节点
        const newNode: TabTreeNode = {
            id: nodeId,
            tabId: tab.id,
            windowId: tab.windowId,
            parentId: parentNodeId,
            children: [],
            depth,
            siblingIndex,
            title: tab.title || '新标签页',
            url: tab.url || '',
            favicon: tab.favIconUrl,
            isActive: tab.active || false,
            isLoading: tab.status === 'loading',
            isAudioPlaying: tab.audible || false,
            isPinned: tab.pinned || false,
            isCollapsed: false,
            isVisible: true,
            isHighlighted: false,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            lastModified: Date.now(),
        };

        // 添加到树中
        if (parentNodeId) {
            const parentNode = findNodeById(parentNodeId);
            if (parentNode) {
                parentNode.children.push(newNode);
            } else {
                // 父节点不存在，作为根节点
                tabTree.value.push(newNode);
            }
        } else {
            // 作为根节点添加
            tabTree.value.push(newNode);
        }

        // 更新窗口分组
        updateWindowGroups();

        return nodeId;
    }

    /**
     * 检查是否会创建循环引用
     */
    function wouldCreateCycle(nodeId: string, potentialParentId: string): boolean {
        let currentId: string | undefined = potentialParentId;
        const visited = new Set<string>();

        while (currentId) {
            if (currentId === nodeId) {
                return true;
            }
            if (visited.has(currentId)) {
                // 检测到已存在的循环
                return true;
            }
            visited.add(currentId);

            const node = findNodeById(currentId);
            currentId = node?.parentId;
        }

        return false;
    }

    /**
     * 设置节点的父节点（更新父子关系）
     */
    function setParent(tabId: number, parentTabId: number): void {
        const childNode = findNodeByTabId(tabId);
        const parentNode = findNodeByTabId(parentTabId);

        if (!childNode || !parentNode) {
            console.warn('无法找到子节点或父节点');
            return;
        }

        // 检查循环引用
        if (wouldCreateCycle(childNode.id, parentNode.id)) {
            console.warn('不能创建循环引用');
            return;
        }

        // 从原位置移除
        removeNodeFromParent(childNode);

        // 添加到新父节点
        childNode.parentId = parentNode.id;
        childNode.depth = parentNode.depth + 1;
        childNode.siblingIndex = parentNode.children.length;
        parentNode.children.push(childNode);

        // 更新所有子孙节点的depth
        updateDescendantsDepth(childNode);
    }

    /**
     * 从父节点中移除节点（但不删除节点本身）
     */
    function removeNodeFromParent(node: TabTreeNode): void {
        if (node.parentId) {
            const parentNode = findNodeById(node.parentId);
            if (parentNode) {
                const index = parentNode.children.findIndex(c => c.id === node.id);
                if (index !== -1) {
                    parentNode.children.splice(index, 1);
                    // 更新兄弟节点的siblingIndex
                    for (let i = index; i < parentNode.children.length; i++) {
                        parentNode.children[i].siblingIndex = i;
                    }
                }
            }
        } else {
            // 从根节点中移除
            const index = tabTree.value.findIndex(n => n.id === node.id);
            if (index !== -1) {
                tabTree.value.splice(index, 1);
            }
        }
    }

    /**
     * 更新节点及其所有子孙节点的depth
     */
    function updateDescendantsDepth(node: TabTreeNode): void {
        for (const child of node.children) {
            child.depth = node.depth + 1;
            updateDescendantsDepth(child);
        }
    }

    /**
     * 更新窗口分组映射
     */
    function updateWindowGroups(): void {
        const groups: Record<number, TabTreeNode[]> = {};

        function collectNodes(nodes: TabTreeNode[]) {
            for (const node of nodes) {
                if (!groups[node.windowId]) {
                    groups[node.windowId] = [];
                }
                groups[node.windowId].push(node);

                if (node.children.length > 0) {
                    collectNodes(node.children);
                }
            }
        }

        collectNodes(tabTree.value);
        windowGroups.value = groups;
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
        activateTab,
        addTabFromChrome,
        setParent,
    };
});
