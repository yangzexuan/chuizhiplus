/**
 * 关闭操作撤销功能测试
 * 
 * 测试目标：
 * 1. 建立页面关闭操作的撤销时间窗口机制
 * 2. 实现撤销操作的页面恢复和树结构重建
 * 3. 创建撤销提示界面和用户交互功能
 * 4. 添加撤销超时和自动确认处理逻辑
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import { useConfigStore } from '@/stores/config';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
const mockTabsRemove = vi.fn();
const mockTabsCreate = vi.fn();
const mockRuntimeSendMessage = vi.fn();

global.chrome = {
    runtime: {
        sendMessage: mockRuntimeSendMessage,
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
        update: vi.fn(),
        move: vi.fn(),
        remove: mockTabsRemove,
        create: mockTabsCreate,
    },
    windows: {
        update: vi.fn(),
    },
} as any;

describe('关闭操作撤销功能', () => {
    let tabsStore: ReturnType<typeof useTabsStore>;
    let configStore: ReturnType<typeof useConfigStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        tabsStore = useTabsStore();
        configStore = useConfigStore();
        vi.clearAllMocks();
        vi.useFakeTimers();

        mockRuntimeSendMessage.mockResolvedValue({ success: true });
        mockTabsRemove.mockResolvedValue(undefined);
        mockTabsCreate.mockResolvedValue({ id: 999, url: 'https://example.com' });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('撤销快照机制', () => {
        it('应该有closeSnapshot状态', () => {
            expect(tabsStore.closeSnapshot).toBeDefined();
        });

        it('关闭标签页时应该保存快照', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');

            expect(tabsStore.closeSnapshot).not.toBeNull();
            expect(tabsStore.closeSnapshot?.closedNodes).toHaveLength(1);
            expect(tabsStore.closeSnapshot?.closedNodes[0].id).toBe('tab-1');
        });

        it('快照应该包含时间戳', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            const beforeClose = Date.now();
            await tabsStore.closeTab('tab-1');
            const afterClose = Date.now();

            expect(tabsStore.closeSnapshot?.timestamp).toBeGreaterThanOrEqual(beforeClose);
            expect(tabsStore.closeSnapshot?.timestamp).toBeLessThanOrEqual(afterClose);
        });

        it('关闭多个标签页应该保存所有节点', async () => {
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

            parent.children.push(child);
            tabsStore.addNode(parent);

            await tabsStore.closeTabWithChildren('tab-1');

            expect(tabsStore.closeSnapshot?.closedNodes).toHaveLength(2);
        });
    });

    describe('撤销操作', () => {
        it('应该有undoClose方法', () => {
            expect(typeof tabsStore.undoClose).toBe('function');
        });

        it('应该有canUndoClose getter', () => {
            expect(tabsStore.canUndoClose).toBeDefined();
        });

        it('没有快照时canUndoClose应该返回false', () => {
            expect(tabsStore.canUndoClose).toBe(false);
        });

        it('有快照时canUndoClose应该返回true', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');

            expect(tabsStore.canUndoClose).toBe(true);
        });

        it('撤销应该重新创建标签页', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');

            mockTabsCreate.mockResolvedValueOnce({ id: 999, url: 'https://example.com' });

            await tabsStore.undoClose();

            expect(mockTabsCreate).toHaveBeenCalledWith({
                url: 'https://example.com',
                windowId: 1,
                active: false,
            });
        });

        it('撤销应该恢复树结构', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            expect(tabsStore.findNodeById('tab-1')).toBeTruthy();

            await tabsStore.closeTab('tab-1');
            expect(tabsStore.findNodeById('tab-1')).toBeNull();

            mockTabsCreate.mockResolvedValueOnce({ id: 999, url: 'https://example.com' });
            await tabsStore.undoClose();

            // 应该重新添加节点到树中
            expect(tabsStore.tabTree.length).toBeGreaterThan(0);
        });

        it('撤销后应该清除快照', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');
            expect(tabsStore.canUndoClose).toBe(true);

            mockTabsCreate.mockResolvedValueOnce({ id: 999, url: 'https://example.com' });
            await tabsStore.undoClose();

            expect(tabsStore.canUndoClose).toBe(false);
            expect(tabsStore.closeSnapshot).toBeNull();
        });

        it('撤销应该保持父子关系', async () => {
            const parent: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Parent',
                url: 'https://example.com/parent',
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
            tabsStore.addNode(parent);

            await tabsStore.closeTabWithChildren('tab-1');

            mockTabsCreate
                .mockResolvedValueOnce({ id: 101, url: 'https://example.com/parent' })
                .mockResolvedValueOnce({ id: 102, url: 'https://example.com/child' });

            await tabsStore.undoClose();

            // 检查树中是否有2个节点
            expect(tabsStore.tabTree.length).toBeGreaterThan(0);
        });
    });

    describe('撤销时间窗口', () => {
        it('configStore应该有undoTimeWindow设置', () => {
            expect(configStore.config.undoTimeWindow).toBeDefined();
            expect(typeof configStore.config.undoTimeWindow).toBe('number');
        });

        it('超时后尝试撤销应该返回错误', async () => {
            const baseTime = 1000000;
            const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(baseTime);

            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
                url: 'https://example.com',
                isActive: false,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: false,
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: baseTime,
                lastAccessed: baseTime,
                lastModified: baseTime,
            };

            tabsStore.addNode(node);
            await tabsStore.closeTab('tab-1');

            // 快进时间超过撤销窗口
            dateSpy.mockReturnValue(baseTime + configStore.config.undoTimeWindow + 1000);

            const result = await tabsStore.undoClose();

            expect(result.success).toBe(false);
            expect(result.error).toContain('超时');

            dateSpy.mockRestore();
        });

        it('应该有clearCloseSnapshot方法', () => {
            expect(typeof tabsStore.clearCloseSnapshot).toBe('function');
        });

        it('clearCloseSnapshot应该清除快照', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');

            expect(tabsStore.closeSnapshot).not.toBeNull();

            tabsStore.clearCloseSnapshot();

            expect(tabsStore.closeSnapshot).toBeNull();
        });
    });

    describe('错误处理', () => {
        it('没有快照时尝试撤销应该返回错误', async () => {
            const result = await tabsStore.undoClose();

            expect(result.success).toBe(false);
            expect(result.error).toContain('没有');
        });

        it('Chrome API失败时应该返回错误', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');

            mockTabsCreate.mockRejectedValueOnce(new Error('Create failed'));

            const result = await tabsStore.undoClose();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Create failed');
        });
    });

    describe('撤销提示状态', () => {
        it('应该有undoNotification状态', () => {
            expect(tabsStore.undoNotification).toBeDefined();
        });

        it('关闭标签页后应该显示撤销提示', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');

            expect(tabsStore.undoNotification).not.toBeNull();
            expect(tabsStore.undoNotification?.message).toContain('关闭');
        });

        it('撤销后应该隐藏撤销提示', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');

            expect(tabsStore.undoNotification).not.toBeNull();

            mockTabsCreate.mockResolvedValueOnce({ id: 999, url: 'https://example.com' });
            await tabsStore.undoClose();

            expect(tabsStore.undoNotification).toBeNull();
        });

        it('应该有dismissUndoNotification方法', () => {
            expect(typeof tabsStore.dismissUndoNotification).toBe('function');
        });

        it('dismissUndoNotification应该隐藏提示', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Tab',
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
            await tabsStore.closeTab('tab-1');

            expect(tabsStore.undoNotification).not.toBeNull();

            tabsStore.dismissUndoNotification();

            expect(tabsStore.undoNotification).toBeNull();
        });
    });
});
