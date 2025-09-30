/**
 * 智能关闭功能测试
 * 
 * 测试目标：
 * 1. 关闭父节点时的确认对话框和用户选择
 * 2. 超过配置阈值时的额外确认保护机制
 * 3. 递归关闭子树所有页面的层级处理逻辑
 * 4. 受保护页面跳过和继续处理的异常机制
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import { useConfigStore } from '@/stores/config';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
const mockTabsRemove = vi.fn();
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
    },
    windows: {
        update: vi.fn(),
    },
} as any;

describe('智能关闭功能', () => {
    let tabsStore: ReturnType<typeof useTabsStore>;
    let configStore: ReturnType<typeof useConfigStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        tabsStore = useTabsStore();
        configStore = useConfigStore();
        vi.clearAllMocks();

        mockRuntimeSendMessage.mockResolvedValue({ success: true });
        mockTabsRemove.mockResolvedValue(undefined);
    });

    describe('基础关闭功能', () => {
        it('应该有closeTab方法', () => {
            expect(typeof tabsStore.closeTab).toBe('function');
        });

        it('关闭单个标签页应该调用Chrome API', async () => {
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

            expect(mockTabsRemove).toHaveBeenCalledWith(1);
        });

        it('关闭后应该从树中移除节点', async () => {
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
        });
    });

    describe('递归关闭子树', () => {
        it('应该有closeTabWithChildren方法', () => {
            expect(typeof tabsStore.closeTabWithChildren).toBe('function');
        });

        it('关闭父节点应该递归关闭所有子节点', async () => {
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

            const child1: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 1,
                parentId: 'tab-1',
                children: [],
                depth: 1,
                siblingIndex: 0,
                title: 'Child 1',
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

            const child2: TabTreeNode = {
                id: 'tab-3',
                tabId: 3,
                windowId: 1,
                parentId: 'tab-1',
                children: [],
                depth: 1,
                siblingIndex: 1,
                title: 'Child 2',
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

            parent.children.push(child1, child2);
            tabsStore.addNode(parent);

            await tabsStore.closeTabWithChildren('tab-1');

            // 应该关闭父节点和所有子节点
            expect(mockTabsRemove).toHaveBeenCalledTimes(3);
            expect(mockTabsRemove).toHaveBeenCalledWith(1);
            expect(mockTabsRemove).toHaveBeenCalledWith(2);
            expect(mockTabsRemove).toHaveBeenCalledWith(3);
        });

        it('应该按层级顺序关闭节点（子节点先于父节点）', async () => {
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

            // 子节点应该先于父节点被关闭
            const calls = mockTabsRemove.mock.calls;
            expect(calls[0][0]).toBe(2); // 子节点
            expect(calls[1][0]).toBe(1); // 父节点
        });
    });

    describe('确认机制', () => {
        it('应该有needsConfirmation方法', () => {
            expect(typeof tabsStore.needsConfirmation).toBe('function');
        });

        it('关闭带子节点的父节点应该需要确认', () => {
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

            expect(tabsStore.needsConfirmation('tab-1')).toBe(true);
        });

        it('关闭单个无子节点的标签页不需要确认', () => {
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

            expect(tabsStore.needsConfirmation('tab-1')).toBe(false);
        });

        it('应该有getCloseCount方法计算将要关闭的标签页数量', () => {
            expect(typeof tabsStore.getCloseCount).toBe('function');
        });

        it('getCloseCount应该返回节点及其所有后代的总数', () => {
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

            const grandchild: TabTreeNode = {
                id: 'tab-3',
                tabId: 3,
                windowId: 1,
                parentId: 'tab-2',
                children: [],
                depth: 2,
                siblingIndex: 0,
                title: 'Grandchild',
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

            child.children.push(grandchild);
            parent.children.push(child);
            tabsStore.addNode(parent);

            expect(tabsStore.getCloseCount('tab-1')).toBe(3); // 父+子+孙
        });
    });

    describe('配置阈值', () => {
        it('configStore应该有closeConfirmThreshold设置', () => {
            expect(configStore.closeConfirmThreshold).toBeDefined();
            expect(typeof configStore.closeConfirmThreshold).toBe('number');
        });

        it('超过阈值时needsConfirmation应该返回true', () => {
            // 设置阈值为2
            configStore.closeConfirmThreshold = 2;

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

            // 添加3个子节点（总共4个标签页）
            for (let i = 0; i < 3; i++) {
                const child: TabTreeNode = {
                    id: `tab-${i + 2}`,
                    tabId: i + 2,
                    windowId: 1,
                    parentId: 'tab-1',
                    children: [],
                    depth: 1,
                    siblingIndex: i,
                    title: `Child ${i + 1}`,
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
            }

            tabsStore.addNode(parent);

            // 4个标签页超过阈值2，需要确认
            expect(tabsStore.needsConfirmation('tab-1')).toBe(true);
        });
    });

    describe('受保护页面处理', () => {
        it('应该有isProtectedTab方法', () => {
            expect(typeof tabsStore.isProtectedTab).toBe('function');
        });

        it('固定的标签页应该被视为受保护', () => {
            const pinnedNode: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Pinned Tab',
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

            tabsStore.addNode(pinnedNode);

            expect(tabsStore.isProtectedTab('tab-1')).toBe(true);
        });

        it('关闭受保护的标签页应该跳过', async () => {
            const pinnedNode: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Pinned Tab',
                url: 'https://example.com',
                isActive: false,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: true,
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            tabsStore.addNode(pinnedNode);

            const result = await tabsStore.closeTab('tab-1');

            // 不应该调用Chrome API关闭
            expect(mockTabsRemove).not.toHaveBeenCalled();
            // 应该返回被跳过的信息
            expect(result?.success).toBe(false);
            expect(result?.error).toContain('受保护');
        });

        it('递归关闭时应该跳过受保护的标签页但继续处理其他标签页', async () => {
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

            const pinnedChild: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 1,
                parentId: 'tab-1',
                children: [],
                depth: 1,
                siblingIndex: 0,
                title: 'Pinned Child',
                url: 'https://example.com',
                isActive: false,
                isLoading: false,
                isAudioPlaying: false,
                isPinned: true, // 受保护
                isCollapsed: false,
                isVisible: true,
                isHighlighted: false,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                lastModified: Date.now(),
            };

            const normalChild: TabTreeNode = {
                id: 'tab-3',
                tabId: 3,
                windowId: 1,
                parentId: 'tab-1',
                children: [],
                depth: 1,
                siblingIndex: 1,
                title: 'Normal Child',
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

            parent.children.push(pinnedChild, normalChild);
            tabsStore.addNode(parent);

            await tabsStore.closeTabWithChildren('tab-1');

            // 应该只关闭父节点和普通子节点，跳过固定的子节点
            expect(mockTabsRemove).toHaveBeenCalledTimes(2);
            expect(mockTabsRemove).toHaveBeenCalledWith(1); // 父节点
            expect(mockTabsRemove).toHaveBeenCalledWith(3); // 普通子节点
            expect(mockTabsRemove).not.toHaveBeenCalledWith(2); // 固定子节点被跳过
        });
    });

    describe('错误处理', () => {
        it('关闭不存在的标签页应该返回错误', async () => {
            const result = await tabsStore.closeTab('non-existent');

            expect(result?.success).toBe(false);
            expect(result?.error).toBeDefined();
            expect(mockTabsRemove).not.toHaveBeenCalled();
        });

        it('Chrome API失败时应该返回错误', async () => {
            mockTabsRemove.mockRejectedValueOnce(new Error('Close failed'));

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

            const result = await tabsStore.closeTab('tab-1');

            expect(result?.success).toBe(false);
            expect(result?.error).toContain('Close failed');
        });
    });
});
