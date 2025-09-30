/**
 * 跨窗口操作功能测试
 * 
 * 测试目标：
 * 1. 建立不同窗口间标签页拖拽移动的功能
 * 2. 实现点击其他窗口节点的窗口切换和标签页激活
 * 3. 创建跨窗口操作的状态同步和更新机制
 * 4. 添加跨窗口操作的权限验证和错误处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
const mockTabsMove = vi.fn();
const mockWindowsUpdate = vi.fn();
const mockTabsUpdate = vi.fn();

global.chrome = {
    runtime: {
        sendMessage: vi.fn(),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
    },
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
    tabs: {
        query: vi.fn(),
        get: vi.fn(),
        update: mockTabsUpdate,
        move: mockTabsMove,
        remove: vi.fn(),
        create: vi.fn(),
    },
    windows: {
        get: vi.fn(),
        getAll: vi.fn(),
        create: vi.fn(),
        remove: vi.fn(),
        update: mockWindowsUpdate,
    },
} as any;

describe('跨窗口操作功能', () => {
    let tabsStore: ReturnType<typeof useTabsStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        tabsStore = useTabsStore();
        vi.clearAllMocks();

        mockTabsMove.mockResolvedValue(undefined);
        mockWindowsUpdate.mockResolvedValue(undefined);
        mockTabsUpdate.mockResolvedValue(undefined);
    });

    describe('跨窗口拖拽', () => {
        it('跨窗口拖拽应该更新标签页的windowId', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
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

            const targetNode: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 2,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 2',
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

            tabsStore.addNode(node);
            tabsStore.addNode(targetNode);

            expect(node.windowId).toBe(1);

            // 模拟跨窗口拖拽
            tabsStore.startDrag(node, 0, 0);
            await tabsStore.completeDrop('tab-2');

            // 节点应该被移动到新窗口
            const movedNode = tabsStore.findNodeById('tab-1');
            expect(movedNode?.windowId).toBe(2);
        });

        it('跨窗口拖拽应该更新所有子节点的windowId', async () => {
            const parent: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
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

            const targetNode: TabTreeNode = {
                id: 'tab-3',
                tabId: 3,
                windowId: 2,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Target',
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

            parent.children.push(child);
            tabsStore.addNode(parent);
            tabsStore.addNode(targetNode);

            // 跨窗口拖拽父节点
            tabsStore.startDrag(parent, 0, 0);
            await tabsStore.completeDrop('tab-3');

            // 父节点和子节点都应该在新窗口
            const movedParent = tabsStore.findNodeById('tab-1');
            const movedChild = tabsStore.findNodeById('tab-2');

            expect(movedParent?.windowId).toBe(2);
            expect(movedChild?.windowId).toBe(2);
        });

        it('跨窗口拖拽应该调用Chrome API移动标签页', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
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

            const targetNode: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 2,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 2',
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

            tabsStore.addNode(node);
            tabsStore.addNode(targetNode);

            tabsStore.startDrag(node, 0, 0);
            await tabsStore.completeDrop('tab-2');

            // 应该调用 chrome.tabs.move 并指定新的 windowId
            expect(mockTabsMove).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    windowId: 2,
                })
            );
        });
    });

    describe('窗口切换和激活', () => {
        it('应该有switchToWindow方法', () => {
            expect(typeof tabsStore.switchToWindow).toBe('function');
        });

        it('switchToWindow应该调用Chrome API切换窗口', async () => {
            await tabsStore.switchToWindow(2);

            expect(mockWindowsUpdate).toHaveBeenCalledWith(2, { focused: true });
        });

        it('应该有activateTabInWindow方法', () => {
            expect(typeof tabsStore.activateTabInWindow).toBe('function');
        });

        it('activateTabInWindow应该切换窗口并激活标签页', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 2,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
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

            tabsStore.addNode(node);

            await tabsStore.activateTabInWindow('tab-1');

            // 应该切换窗口
            expect(mockWindowsUpdate).toHaveBeenCalledWith(2, { focused: true });

            // 应该激活标签页
            expect(mockTabsUpdate).toHaveBeenCalledWith(1, { active: true });
        });

        it('activateTabInWindow应该返回操作结果', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 2,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
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

            tabsStore.addNode(node);

            const result = await tabsStore.activateTabInWindow('tab-1');

            expect(result.success).toBe(true);
        });

        it('activateTabInWindow对不存在的节点应该返回错误', async () => {
            const result = await tabsStore.activateTabInWindow('non-existent');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('跨窗口操作权限验证', () => {
        it('应该有canMoveToWindow方法', () => {
            expect(typeof tabsStore.canMoveToWindow).toBe('function');
        });

        it('canMoveToWindow对普通标签页应该返回true', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
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

            tabsStore.addNode(node);

            expect(tabsStore.canMoveToWindow('tab-1', 2)).toBe(true);
        });

        it('canMoveToWindow对固定的标签页应该返回false', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
                url: 'https://example.com',
                isActive: false,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: true, // 固定的标签页
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            tabsStore.addNode(node);

            expect(tabsStore.canMoveToWindow('tab-1', 2)).toBe(false);
        });

        it('canMoveToWindow移动到同一窗口应该返回false', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
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

            tabsStore.addNode(node);

            expect(tabsStore.canMoveToWindow('tab-1', 1)).toBe(false);
        });
    });

    describe('错误处理', () => {
        it('switchToWindow失败时应该返回错误', async () => {
            mockWindowsUpdate.mockRejectedValueOnce(new Error('Window not found'));

            const result = await tabsStore.switchToWindow(999);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Window not found');
        });

        it('activateTabInWindow中Chrome API失败时应该返回错误', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 2,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
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

            tabsStore.addNode(node);

            mockWindowsUpdate.mockRejectedValueOnce(new Error('Failed'));

            const result = await tabsStore.activateTabInWindow('tab-1');

            expect(result.success).toBe(false);
        });
    });

    describe('状态同步', () => {
        it('跨窗口移动后应该更新windowGroups', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 1',
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

            const targetNode: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 2,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Tab 2',
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

            tabsStore.addNode(node);
            tabsStore.addNode(targetNode);

            // 拖拽前
            expect(tabsStore.windowGroups[1]).toHaveLength(1);
            expect(tabsStore.windowGroups[2]).toHaveLength(1);

            // 跨窗口拖拽
            tabsStore.startDrag(node, 0, 0);
            await tabsStore.completeDrop('tab-2');

            // 拖拽后
            // 窗口1应该没有标签了（可能是undefined或空数组）
            expect(tabsStore.windowGroups[1]?.length || 0).toBe(0);
            expect(tabsStore.windowGroups[2]).toHaveLength(2);
        });
    });
});
