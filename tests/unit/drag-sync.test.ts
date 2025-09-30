/**
 * 拖拽同步测试
 * 
 * 测试目标：
 * 1. 循环依赖检测和无效拖拽阻止机制
 * 2. 拖拽操作完成后的Chrome标签页位置更新
 * 3. 拖拽失败情况的错误处理和用户提示
 * 4. 拖拽操作的撤销和状态恢复功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
const mockTabsMove = vi.fn();
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
        move: mockTabsMove,
    },
    windows: {
        update: vi.fn(),
    },
} as any;

describe('拖拽同步功能', () => {
    let tabsStore: ReturnType<typeof useTabsStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        tabsStore = useTabsStore();
        vi.clearAllMocks();

        mockRuntimeSendMessage.mockResolvedValue({ success: true });
        mockTabsMove.mockResolvedValue({});
    });

    describe('增强的循环依赖检测', () => {
        it('validateDrop应该检测简单的循环引用', () => {
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

            // 尝试拖拽父节点到子节点
            tabsStore.startDrag(parent, 0, 0);
            expect(tabsStore.validateDrop('tab-2')).toBe(false);
        });

        it('validateDrop应该检测多层级的循环引用', () => {
            const grandparent: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Grandparent',
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

            const parent: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 1,
                parentId: 'tab-1',
                children: [],
                depth: 1,
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
                id: 'tab-3',
                tabId: 3,
                windowId: 1,
                parentId: 'tab-2',
                children: [],
                depth: 2,
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

            grandparent.children.push(parent);
            parent.children.push(child);
            tabsStore.addNode(grandparent);

            // 尝试拖拽祖父节点到孙子节点
            tabsStore.startDrag(grandparent, 0, 0);
            expect(tabsStore.validateDrop('tab-3')).toBe(false);
        });
    });

    describe('Chrome标签页位置同步', () => {
        it('应该有syncTabPosition方法', () => {
            expect(typeof tabsStore.syncTabPosition).toBe('function');
        });

        it('completeDrop应该调用Chrome API更新标签页位置', async () => {
            const dragNode: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Drag Node',
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
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 1,
                title: 'Target Node',
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

            tabsStore.addNode(dragNode);
            tabsStore.addNode(targetNode);
            tabsStore.startDrag(dragNode, 0, 0);

            await tabsStore.completeDrop('tab-2');

            // 验证 Chrome API 被调用
            expect(mockTabsMove).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ index: expect.any(Number) })
            );
        });

        it('syncTabPosition应该计算正确的标签页位置', async () => {
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

            await tabsStore.syncTabPosition('tab-2');

            // 子节点应该紧跟在父节点后面
            expect(mockTabsMove).toHaveBeenCalledWith(
                2,
                expect.objectContaining({ index: 1 })
            );
        });
    });

    describe('错误处理和用户提示', () => {
        it('拖拽失败时应该返回错误信息', async () => {
            mockTabsMove.mockRejectedValueOnce(new Error('Move failed'));

            const dragNode: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Drag Node',
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
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 1,
                title: 'Target Node',
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

            tabsStore.addNode(dragNode);
            tabsStore.addNode(targetNode);
            tabsStore.startDrag(dragNode, 0, 0);

            const result = await tabsStore.completeDrop('tab-2');

            expect(result).toBeDefined();
            expect(result?.success).toBe(false);
            expect(result?.error).toBeDefined();
        });

        it('无效的拖拽操作应该返回错误', async () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Node',
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
            tabsStore.startDrag(node, 0, 0);

            // 尝试拖拽到自身
            const result = await tabsStore.completeDrop('tab-1');

            expect(result).toBeDefined();
            expect(result?.success).toBe(false);
            expect(result?.error).toContain('无效');
        });
    });

    describe('拖拽撤销和状态恢复', () => {
        it('应该有保存拖拽前状态的机制', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Node',
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
            tabsStore.startDrag(node, 0, 0);

            // 应该保存拖拽前的状态
            expect(tabsStore.dragSnapshot).toBeDefined();
            expect(tabsStore.dragSnapshot?.nodeId).toBe('tab-1');
            expect(tabsStore.dragSnapshot?.originalParentId).toBeUndefined();
        });

        it('应该有undoDrag方法', () => {
            expect(typeof tabsStore.undoDrag).toBe('function');
        });

        it('undoDrag应该恢复拖拽前的状态', async () => {
            const dragNode: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Drag Node',
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
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 1,
                title: 'Target Node',
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

            tabsStore.addNode(dragNode);
            tabsStore.addNode(targetNode);
            tabsStore.startDrag(dragNode, 0, 0);

            // 完成拖拽
            await tabsStore.completeDrop('tab-2');

            // 验证拖拽后的状态
            const movedNode = tabsStore.findNodeById('tab-1');
            expect(movedNode?.parentId).toBe('tab-2');

            // 撤销拖拽
            await tabsStore.undoDrag();

            // 验证状态已恢复
            const restoredNode = tabsStore.findNodeById('tab-1');
            expect(restoredNode?.parentId).toBeUndefined();
            expect(restoredNode?.depth).toBe(0);
        });

        it('撤销后应该同步Chrome标签页位置', async () => {
            const dragNode: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Drag Node',
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
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 1,
                title: 'Target Node',
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

            tabsStore.addNode(dragNode);
            tabsStore.addNode(targetNode);
            tabsStore.startDrag(dragNode, 0, 0);

            await tabsStore.completeDrop('tab-2');
            vi.clearAllMocks();

            await tabsStore.undoDrag();

            // 验证撤销后也调用了 Chrome API
            expect(mockTabsMove).toHaveBeenCalled();
        });

        it('没有拖拽历史时undoDrag应该不做任何操作', async () => {
            const result = await tabsStore.undoDrag();

            expect(result).toBeDefined();
            expect(result?.success).toBe(false);
            expect(mockTabsMove).not.toHaveBeenCalled();
        });
    });

    describe('边界情况', () => {
        it('跨窗口拖拽应该正确处理', async () => {
            const dragNode: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Drag Node',
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
                windowId: 2, // 不同的窗口
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Target Node',
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

            tabsStore.addNode(dragNode);
            tabsStore.addNode(targetNode);
            tabsStore.startDrag(dragNode, 0, 0);

            await tabsStore.completeDrop('tab-2');

            // 验证跨窗口移动
            expect(mockTabsMove).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ windowId: 2 })
            );
        });

        it('拖拽带有子节点的节点应该更新所有子孙节点位置', async () => {
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

            const target: TabTreeNode = {
                id: 'tab-3',
                tabId: 3,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 1,
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
            tabsStore.addNode(target);
            tabsStore.startDrag(parent, 0, 0);

            await tabsStore.completeDrop('tab-3');

            // 应该同时移动父节点和子节点
            expect(mockTabsMove).toHaveBeenCalledTimes(2);
        });
    });
});
