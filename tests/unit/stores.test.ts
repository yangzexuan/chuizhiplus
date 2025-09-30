/**
 * Pinia Stores 测试
 * 
 * 测试目标：
 * 1. useTabsStore - 标签页树状态管理
 * 2. useConfigStore - 配置状态管理
 * 3. useUIStore - UI状态管理
 * 4. Store之间的数据流和响应式更新
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import { useConfigStore } from '@/stores/config';
import { useUIStore } from '@/stores/ui';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
global.chrome = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
} as any;

describe('Pinia Stores', () => {
    beforeEach(() => {
        // 为每个测试创建新的pinia实例
        setActivePinia(createPinia());

        // 重置chrome mocks
        vi.clearAllMocks();
    });

    describe('useTabsStore', () => {
        it('应该正确初始化', () => {
            const store = useTabsStore();

            expect(store.tabTree).toEqual([]);
            expect(store.activeTabId).toBeNull();
            expect(store.windowGroups).toEqual({});
        });

        it('应该能够添加标签页到树', () => {
            const store = useTabsStore();

            const tab: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
                url: 'https://example.com',
                isActive: true,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: false,
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            store.addTab(tab);

            expect(store.tabTree.length).toBe(1);
            expect(store.tabTree[0].id).toBe('tab-1');
        });

        it('应该能够移除标签页', () => {
            const store = useTabsStore();

            const tab: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
                url: 'https://example.com',
                isActive: true,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: false,
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            store.addTab(tab);
            expect(store.tabTree.length).toBe(1);

            store.removeTab('tab-1');
            expect(store.tabTree.length).toBe(0);
        });

        it('应该能够设置活跃标签页', () => {
            const store = useTabsStore();

            store.setActiveTab(123);
            expect(store.activeTabId).toBe(123);
        });

        it('应该能够计算扁平化的标签页列表', () => {
            const store = useTabsStore();

            const parent: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Parent',
                url: 'https://example.com',
                isActive: false,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: false,
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            const child: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 1,
                parentId: 'tab-1',
                children: [],
                depth: 1,
                siblingIndex: 0,
                title: 'Child',
                url: 'https://example.com/child',
                isActive: false,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: false,
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            parent.children.push(child);
            store.addTab(parent);

            const flattened = store.flattenedTabs;
            expect(flattened.length).toBe(2);
            expect(flattened[0].id).toBe('tab-1');
            expect(flattened[1].id).toBe('tab-2');
        });

        it('应该能够按窗口分组标签页', () => {
            const store = useTabsStore();

            const tab1: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Window 1 Tab',
                url: 'https://example.com',
                isActive: false,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: false,
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            const tab2: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 2,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Window 2 Tab',
                url: 'https://example.com',
                isActive: false,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: false,
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            store.addTab(tab1);
            store.addTab(tab2);

            expect(store.tabsByWindow[1]).toBeDefined();
            expect(store.tabsByWindow[2]).toBeDefined();
            expect(store.tabsByWindow[1].length).toBe(1);
            expect(store.tabsByWindow[2].length).toBe(1);
        });
    });

    describe('useConfigStore', () => {
        it('应该正确初始化默认配置', () => {
            const store = useConfigStore();

            expect(store.config.panelWidth).toBe(300);
            expect(store.config.panelVisible).toBe(true);
            expect(store.config.theme).toBe('auto');
        });

        it('应该能够更新配置', async () => {
            const store = useConfigStore();

            await store.updateConfig({ panelWidth: 400 });

            expect(store.config.panelWidth).toBe(400);
        });

        it('应该能够重置配置', async () => {
            const store = useConfigStore();

            await store.updateConfig({ panelWidth: 400 });
            expect(store.config.panelWidth).toBe(400);

            await store.resetConfig();
            expect(store.config.panelWidth).toBe(300);
        });

        it('应该能够保存配置到Chrome Storage', async () => {
            const store = useConfigStore();
            const mockSet = global.chrome.storage.local.set as any;

            await store.updateConfig({ panelWidth: 400 });

            expect(mockSet).toHaveBeenCalled();
        });
    });

    describe('useUIStore', () => {
        it('应该正确初始化', () => {
            const store = useUIStore();

            expect(store.collapsedNodes).toEqual(new Set());
            expect(store.searchQuery).toBe('');
            expect(store.selectedNodeId).toBeNull();
        });

        it('应该能够切换节点折叠状态', () => {
            const store = useUIStore();

            store.toggleCollapse('tab-1');
            expect(store.collapsedNodes.has('tab-1')).toBe(true);

            store.toggleCollapse('tab-1');
            expect(store.collapsedNodes.has('tab-1')).toBe(false);
        });

        it('应该能够设置搜索查询', () => {
            const store = useUIStore();

            store.setSearchQuery('test');
            expect(store.searchQuery).toBe('test');
        });

        it('应该能够选择节点', () => {
            const store = useUIStore();

            store.selectNode('tab-1');
            expect(store.selectedNodeId).toBe('tab-1');
        });

        it('应该能够清除选择', () => {
            const store = useUIStore();

            store.selectNode('tab-1');
            expect(store.selectedNodeId).toBe('tab-1');

            store.clearSelection();
            expect(store.selectedNodeId).toBeNull();
        });

        it('应该能够检查节点是否折叠', () => {
            const store = useUIStore();

            store.toggleCollapse('tab-1');
            expect(store.isNodeCollapsed('tab-1')).toBe(true);
            expect(store.isNodeCollapsed('tab-2')).toBe(false);
        });
    });

    describe('Store集成', () => {
        it('多个stores应该能够独立工作', () => {
            const tabsStore = useTabsStore();
            const configStore = useConfigStore();
            const uiStore = useUIStore();

            expect(tabsStore).toBeDefined();
            expect(configStore).toBeDefined();
            expect(uiStore).toBeDefined();

            // 它们应该是不同的实例
            expect(tabsStore).not.toBe(configStore);
            expect(tabsStore).not.toBe(uiStore);
            expect(configStore).not.toBe(uiStore);
        });
    });
});
