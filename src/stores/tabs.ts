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
import type { TabTreeNode, FlattenedNode, DragSnapshot, OperationResult } from '@/types';
import { useUIStore } from './ui';
import { useConfigStore } from './config';

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

    /**
     * 拖拽操作快照（用于撤销）
     */
    const dragSnapshot = ref<DragSnapshot | null>(null);

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

        // 如果新标签页是活跃的，需要更新之前的活跃标签页
        if (tab.active) {
            // 将之前的活跃标签页设为非活跃
            if (activeTabId.value !== null && activeTabId.value !== tab.id) {
                const oldActiveNode = findNodeByTabId(activeTabId.value);
                if (oldActiveNode) {
                    updateTab(oldActiveNode.id, { isActive: false });
                }
            }
            // 更新活跃标签页ID
            activeTabId.value = tab.id;
        }

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
     * 递归更新节点所有后代的窗口ID
     */
    function updateDescendantsWindow(node: TabTreeNode, windowId: number): void {
        for (const child of node.children) {
            child.windowId = windowId;
            updateDescendantsWindow(child, windowId);
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

    // ==================== 实时同步功能 ====================

    /**
     * 消息监听器引用（用于清理）
     */
    let messageListener: ((message: any, sender: any, sendResponse: any) => void) | null = null;

    /**
     * 初始化实时同步监听器
     */
    function initializeSyncListeners(): void {
        // 避免重复注册
        if (messageListener) {
            return;
        }

        messageListener = (message: any, _sender: any, _sendResponse: any) => {
            handleSyncMessage(message);
        };

        chrome.runtime.onMessage.addListener(messageListener);
    }

    /**
     * 清理同步监听器
     */
    function cleanupSyncListeners(): void {
        if (messageListener) {
            chrome.runtime.onMessage.removeListener(messageListener);
            messageListener = null;
        }
    }

    /**
     * 处理同步消息
     */
    function handleSyncMessage(message: any): void {
        try {
            switch (message.type) {
                case 'TAB_CREATED':
                    if (message.tab) {
                        addTabFromChrome(message.tab);
                    }
                    break;

                case 'TAB_REMOVED':
                    if (message.tabId !== undefined) {
                        removeTab(message.tabId);
                    }
                    break;

                case 'TAB_UPDATED':
                    if (message.tabId !== undefined && message.tab) {
                        handleTabUpdate(message.tabId, message.changeInfo, message.tab);
                    }
                    break;

                case 'TAB_MOVED':
                    if (message.tabId !== undefined && message.moveInfo) {
                        // 标签页移动逻辑
                        // 目前只需要确保不崩溃
                        console.log('Tab moved:', message.tabId, message.moveInfo);
                    }
                    break;

                case 'TAB_ACTIVATED':
                    if (message.activeInfo && message.activeInfo.tabId !== undefined) {
                        handleTabActivation(message.activeInfo.tabId);
                    }
                    break;

                default:
                    // 未知消息类型，忽略
                    break;
            }
        } catch (error) {
            console.error('处理同步消息时出错:', error, message);
        }
    }

    /**
     * 处理标签页更新
     */
    function handleTabUpdate(tabId: number, changeInfo: any, tab: chrome.tabs.Tab): void {
        const node = findNodeByTabId(tabId);
        if (!node) {
            // 标签页不存在，可能需要添加
            addTabFromChrome(tab);
            return;
        }

        // 更新节点属性
        const updates: Partial<TabTreeNode> = {};

        if (changeInfo.title !== undefined) {
            updates.title = changeInfo.title;
        }

        if (changeInfo.url !== undefined) {
            updates.url = changeInfo.url;
        }

        if (changeInfo.favIconUrl !== undefined) {
            updates.favicon = changeInfo.favIconUrl;
        }

        if (changeInfo.status !== undefined) {
            updates.isLoading = changeInfo.status === 'loading';
        }

        if (changeInfo.audible !== undefined) {
            updates.isAudioPlaying = changeInfo.audible;
        }

        if (changeInfo.pinned !== undefined) {
            updates.isPinned = changeInfo.pinned;
        }

        // 应用更新
        if (Object.keys(updates).length > 0) {
            updateTab(node.id, updates);
        }
    }

    /**
     * 处理标签页激活
     */
    function handleTabActivation(tabId: number): void {
        // 更新活跃标签页ID
        const oldActiveId = activeTabId.value;
        activeTabId.value = tabId;

        // 更新节点的isActive状态
        if (oldActiveId !== null) {
            const oldActiveNode = findNodeByTabId(oldActiveId);
            if (oldActiveNode) {
                updateTab(oldActiveNode.id, { isActive: false });
            }
        }

        const newActiveNode = findNodeByTabId(tabId);
        if (newActiveNode) {
            updateTab(newActiveNode.id, { isActive: true });
        }
    }

    /**
     * 从Chrome同步所有标签页
     * 清空当前树并重新加载所有标签页
     */
    async function syncAllTabs(): Promise<void> {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_ALL_TABS',
            });

            if (!response.success) {
                console.error('同步标签页失败:', response.error);
                return;
            }

            // 清空当前树
            clearTree();

            // 添加所有标签页
            const tabs = response.data as chrome.tabs.Tab[];
            if (tabs && Array.isArray(tabs)) {
                for (const tab of tabs) {
                    addTabFromChrome(tab);
                }
            }
        } catch (error) {
            console.error('同步所有标签页时出错:', error);
        }
    }

    // ==================== 拖拽操作 ====================

    /**
     * 添加节点（用于测试）
     */
    function addNode(node: TabTreeNode): void {
        if (node.parentId) {
            const parent = findNodeById(node.parentId);
            if (parent) {
                parent.children.push(node);
            } else {
                tabTree.value.push(node);
            }
        } else {
            tabTree.value.push(node);
        }
        updateWindowGroups();
    }

    /**
     * 开始拖拽
     */
    function startDrag(node: TabTreeNode, x: number, y: number): void {
        const uiStore = useUIStore();
        uiStore.startDrag({
            dragNodeId: node.id,
            startPosition: { x, y },
            isValid: true,
        });

        // 保存拖拽前的状态快照（用于撤销）
        const treeIndex = tabTree.value.findIndex(n => n.id === node.id);
        dragSnapshot.value = {
            nodeId: node.id,
            originalParentId: node.parentId,
            originalDepth: node.depth,
            originalSiblingIndex: node.siblingIndex,
            originalTreePosition: treeIndex >= 0 ? treeIndex : -1,
        };
    }

    /**
     * 更新拖拽位置
     */
    function updateDragPosition(targetNodeId: string): void {
        const uiStore = useUIStore();
        if (uiStore.dragState) {
            uiStore.updateDragState({
                targetNodeId,
            });
        }
    }

    /**
     * 结束拖拽
     */
    function endDrag(): void {
        const uiStore = useUIStore();
        uiStore.endDrag();
    }

    /**
     * 验证拖拽是否有效
     */
    function validateDrop(targetNodeId: string): boolean {
        const uiStore = useUIStore();
        if (!uiStore.dragState) {
            return false;
        }

        const dragNodeId = uiStore.dragState.dragNodeId;

        // 不允许拖拽到自身
        if (dragNodeId === targetNodeId) {
            return false;
        }

        // 检查是否会创建循环引用
        const targetNode = findNodeById(targetNodeId);
        if (!targetNode) {
            return false;
        }

        // 检查目标节点是否是拖拽节点的后代
        let current: TabTreeNode | null = targetNode;
        while (current) {
            if (current.id === dragNodeId) {
                return false;
            }
            current = current.parentId ? findNodeById(current.parentId) : null;
        }

        return true;
    }

    /**
     * 同步单个节点的标签页位置到 Chrome
     */
    async function syncTabPosition(nodeId: string): Promise<void> {
        const node = findNodeById(nodeId);
        if (!node || node.tabId === undefined) {
            return;
        }

        // 计算节点在树中的位置（扁平化后的索引）
        const flatNodes = flattenedTabs.value;
        const targetIndex = flatNodes.findIndex(n => n.id === nodeId);

        if (targetIndex < 0) {
            return;
        }

        // 获取目标窗口ID
        const targetWindowId = node.windowId;

        try {
            await chrome.tabs.move(node.tabId, {
                index: targetIndex,
                windowId: targetWindowId,
            });
            console.log(`已移动标签页 ${node.tabId} 到位置 ${targetIndex}`);
        } catch (error) {
            console.error(`移动标签页失败:`, error);
            throw error;
        }
    }

    /**
     * 递归同步节点及其所有子节点的位置
     */
    async function syncTabPositionRecursive(node: TabTreeNode): Promise<void> {
        // 先同步当前节点
        if (node.tabId !== undefined) {
            await syncTabPosition(node.id);
        }

        // 递归同步所有子节点
        for (const child of node.children) {
            await syncTabPositionRecursive(child);
        }
    }

    /**
     * 撤销拖拽操作
     */
    async function undoDrag(): Promise<OperationResult> {
        if (!dragSnapshot.value) {
            return { success: false, error: '没有可撤销的拖拽操作' };
        }

        const snapshot = dragSnapshot.value;
        const node = findNodeById(snapshot.nodeId);

        if (!node) {
            dragSnapshot.value = null;
            return { success: false, error: '节点不存在' };
        }

        // 从当前位置移除
        if (node.parentId) {
            const currentParent = findNodeById(node.parentId);
            if (currentParent) {
                const index = currentParent.children.findIndex(c => c.id === node.id);
                if (index !== -1) {
                    currentParent.children.splice(index, 1);
                }
            }
        } else {
            const index = tabTree.value.findIndex(n => n.id === node.id);
            if (index !== -1) {
                tabTree.value.splice(index, 1);
            }
        }

        // 恢复到原位置
        node.parentId = snapshot.originalParentId;
        node.depth = snapshot.originalDepth;
        node.siblingIndex = snapshot.originalSiblingIndex;

        if (snapshot.originalParentId) {
            const originalParent = findNodeById(snapshot.originalParentId);
            if (originalParent) {
                originalParent.children.push(node);
            } else {
                // 父节点不存在，添加到根
                tabTree.value.push(node);
            }
        } else {
            // 恢复到根节点位置
            if (snapshot.originalTreePosition >= 0 && snapshot.originalTreePosition < tabTree.value.length) {
                tabTree.value.splice(snapshot.originalTreePosition, 0, node);
            } else {
                tabTree.value.push(node);
            }
        }

        updateDescendantsDepth(node);
        updateWindowGroups();

        // 同步到 Chrome
        try {
            await syncTabPositionRecursive(node);
        } catch (error) {
            console.error('撤销时同步标签页位置失败:', error);
            return { success: false, error: `撤销失败: ${error}` };
        }

        // 清除快照
        dragSnapshot.value = null;

        return { success: true };
    }

    /**
     * 完成拖拽操作
     */
    async function completeDrop(targetNodeId: string | null): Promise<OperationResult | undefined> {
        const uiStore = useUIStore();
        if (!uiStore.dragState) {
            return { success: false, error: '没有正在进行的拖拽操作' };
        }

        const dragNodeId = uiStore.dragState.dragNodeId;
        const dragNode = findNodeById(dragNodeId);

        if (!dragNode) {
            endDrag();
            return { success: false, error: '拖拽节点不存在' };
        }

        // 如果拖拽到根区域（targetNodeId 为 null）
        if (targetNodeId === null) {
            // 从原父节点移除
            if (dragNode.parentId) {
                const oldParent = findNodeById(dragNode.parentId);
                if (oldParent) {
                    const index = oldParent.children.findIndex(c => c.id === dragNode.id);
                    if (index !== -1) {
                        oldParent.children.splice(index, 1);
                    }
                }
            } else {
                // 已经是根节点，从树中移除
                const index = tabTree.value.findIndex(n => n.id === dragNode.id);
                if (index !== -1) {
                    tabTree.value.splice(index, 1);
                }
            }

            // 设置为根节点
            dragNode.parentId = undefined;
            dragNode.depth = 0;
            tabTree.value.push(dragNode);
            updateDescendantsDepth(dragNode);
        } else {
            // 验证拖拽是否有效
            if (!validateDrop(targetNodeId)) {
                endDrag();
                return { success: false, error: '无效的拖拽操作：不能拖拽到自身或其后代节点' };
            }

            // 从原位置移除
            if (dragNode.parentId) {
                const oldParent = findNodeById(dragNode.parentId);
                if (oldParent) {
                    const index = oldParent.children.findIndex(c => c.id === dragNode.id);
                    if (index !== -1) {
                        oldParent.children.splice(index, 1);
                    }
                }
            } else {
                const index = tabTree.value.findIndex(n => n.id === dragNode.id);
                if (index !== -1) {
                    tabTree.value.splice(index, 1);
                }
            }

            // 添加到新父节点
            const newParent = findNodeById(targetNodeId);
            if (newParent) {
                dragNode.parentId = targetNodeId;
                dragNode.depth = newParent.depth + 1;
                dragNode.siblingIndex = newParent.children.length;

                // 跨窗口拖拽：更新 windowId
                if (dragNode.windowId !== newParent.windowId) {
                    dragNode.windowId = newParent.windowId;
                    // 递归更新所有子节点的 windowId
                    updateDescendantsWindow(dragNode, newParent.windowId);
                }

                newParent.children.push(dragNode);
                updateDescendantsDepth(dragNode);
            }
        }

        updateWindowGroups();

        // 同步到 Chrome 标签页位置
        try {
            await syncTabPositionRecursive(dragNode);
        } catch (error) {
            console.error('同步标签页位置失败:', error);
            endDrag();
            return { success: false, error: `同步标签页位置失败: ${error}` };
        }

        endDrag();
        return { success: true };
    }

    // ==================== 智能关闭操作 ====================

    /**
     * 判断标签页是否受保护
     */
    function isProtectedTab(nodeId: string): boolean {
        const configStore = useConfigStore();
        if (!configStore.protectPinnedTabs) {
            return false;
        }

        const node = findNodeById(nodeId);
        return node?.isPinned || false;
    }

    /**
     * 计算将要关闭的标签页数量（包括节点及其所有后代）
     */
    function getCloseCount(nodeId: string): number {
        const node = findNodeById(nodeId);
        if (!node) {
            return 0;
        }

        let count = 1; // 节点本身

        // 递归计算所有后代
        function countDescendants(n: TabTreeNode): void {
            for (const child of n.children) {
                count++;
                countDescendants(child);
            }
        }

        countDescendants(node);
        return count;
    }

    /**
     * 判断关闭操作是否需要用户确认
     */
    function needsConfirmation(nodeId: string): boolean {
        const configStore = useConfigStore();

        if (!configStore.enableCloseConfirmation) {
            return false;
        }

        const node = findNodeById(nodeId);
        if (!node) {
            return false;
        }

        // 如果有子节点，需要确认
        if (node.children.length > 0) {
            return true;
        }

        // 如果关闭数量超过阈值，需要确认
        const closeCount = getCloseCount(nodeId);
        return closeCount > configStore.closeConfirmThreshold;
    }

    /**
     * 关闭单个标签页
     */
    async function closeTab(nodeId: string): Promise<OperationResult> {
        const node = findNodeById(nodeId);
        if (!node) {
            return { success: false, error: '标签页不存在' };
        }

        if (!node.tabId) {
            return { success: false, error: '无效的标签页ID' };
        }

        // 检查是否受保护
        if (isProtectedTab(nodeId)) {
            return { success: false, error: '标签页受保护，无法关闭' };
        }

        try {
            // 调用 Chrome API 关闭标签页
            await chrome.tabs.remove(node.tabId);

            // 从树中移除节点
            removeTab(nodeId);

            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    /**
     * 递归关闭标签页及其所有子节点
     */
    async function closeTabWithChildren(nodeId: string): Promise<OperationResult> {
        const node = findNodeById(nodeId);
        if (!node) {
            return { success: false, error: '标签页不存在' };
        }

        const errors: string[] = [];
        const closedTabs: number[] = [];

        // 递归收集所有需要关闭的标签页ID（深度优先，子节点先于父节点）
        const tabsToClose: TabTreeNode[] = [];
        function collectTabs(n: TabTreeNode): void {
            // 先收集子节点
            for (const child of n.children) {
                collectTabs(child);
            }
            // 再收集父节点
            tabsToClose.push(n);
        }

        collectTabs(node);

        // 按顺序关闭所有标签页
        for (const tab of tabsToClose) {
            // 跳过受保护的标签页
            if (isProtectedTab(tab.id)) {
                console.log(`跳过受保护的标签页: ${tab.title}`);
                continue;
            }

            if (tab.tabId) {
                try {
                    await chrome.tabs.remove(tab.tabId);
                    closedTabs.push(tab.tabId);
                } catch (error) {
                    errors.push(`关闭标签页 ${tab.title} 失败: ${error}`);
                }
            }
        }

        // 从树中移除所有已关闭的节点
        for (const tab of tabsToClose) {
            if (!isProtectedTab(tab.id)) {
                removeTab(tab.id);
            }
        }

        if (errors.length > 0) {
            return {
                success: false,
                error: errors.join('; '),
                data: { closedTabs, errors },
            };
        }

        return {
            success: true,
            data: { closedTabs },
        };
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

        // Sync Actions
        initializeSyncListeners,
        cleanupSyncListeners,
        syncAllTabs,

        // Drag & Drop Actions
        addNode,
        startDrag,
        updateDragPosition,
        endDrag,
        validateDrop,
        completeDrop,
        syncTabPosition,
        undoDrag,
        dragSnapshot,

        // Smart Close Actions
        closeTab,
        closeTabWithChildren,
        needsConfirmation,
        getCloseCount,
        isProtectedTab,
    };
});
