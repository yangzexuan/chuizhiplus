/**
 * 拖拽功能测试
 * 
 * 测试目标：
 * 1. 节点拖拽初始化和状态跟踪机制
 * 2. 拖拽过程中的预览显示和目标位置高亮
 * 3. 拖拽到其他节点设为子节点的操作逻辑
 * 4. 拖拽到顶部区域提升为根节点的功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import { useUIStore } from '@/stores/ui';
import TreeNode from '@/components/TreeView/TreeNode.vue';
import type { TabTreeNode, DragState } from '@/types';

// Mock Chrome API
global.chrome = {
    runtime: {
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
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
    },
    windows: {
        update: vi.fn(),
    },
} as any;

describe('拖拽功能', () => {
    let tabsStore: ReturnType<typeof useTabsStore>;
    let uiStore: ReturnType<typeof useUIStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        tabsStore = useTabsStore();
        uiStore = useUIStore();
        vi.clearAllMocks();
    });

    describe('拖拽初始化和状态跟踪', () => {
        it('应该有startDrag方法', () => {
            expect(typeof tabsStore.startDrag).toBe('function');
        });

        it('startDrag应该初始化拖拽状态', () => {
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

            tabsStore.startDrag(node, 100, 200);

            expect(uiStore.dragState).toBeDefined();
            expect(uiStore.dragState?.dragNodeId).toBe('tab-1');
            expect(uiStore.dragState?.startPosition).toEqual({ x: 100, y: 200 });
            expect(uiStore.dragState?.isValid).toBe(true);
        });

        it('应该有updateDragPosition方法', () => {
            expect(typeof tabsStore.updateDragPosition).toBe('function');
        });

        it('updateDragPosition应该更新拖拽位置和目标节点', () => {
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

            tabsStore.updateDragPosition('tab-2');

            expect(uiStore.dragState?.targetNodeId).toBe('tab-2');
        });

        it('应该有endDrag方法', () => {
            expect(typeof tabsStore.endDrag).toBe('function');
        });

        it('endDrag应该清除拖拽状态', () => {
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

            tabsStore.startDrag(node, 0, 0);
            expect(uiStore.dragState).not.toBeNull();

            tabsStore.endDrag();
            expect(uiStore.dragState).toBeNull();
        });
    });

    describe('拖拽验证', () => {
        it('不应该允许拖拽节点到其自身', () => {
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
            tabsStore.startDrag(node, 0, 0);

            const isValid = tabsStore.validateDrop('tab-1');
            expect(isValid).toBe(false);
        });

        it('不应该允许拖拽父节点到其子孙节点', () => {
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

            parent.children.push(child);
            child.children.push(grandchild);

            tabsStore.addNode(parent);
            tabsStore.startDrag(parent, 0, 0);

            // 不应该允许拖拽到直接子节点
            expect(tabsStore.validateDrop('tab-2')).toBe(false);
            // 不应该允许拖拽到孙子节点
            expect(tabsStore.validateDrop('tab-3')).toBe(false);
        });

        it('应该允许拖拽到无关节点', () => {
            const node1: TabTreeNode = {
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

            const node2: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 1,
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

            tabsStore.addNode(node1);
            tabsStore.addNode(node2);
            tabsStore.startDrag(node1, 0, 0);

            expect(tabsStore.validateDrop('tab-2')).toBe(true);
        });
    });

    describe('拖拽完成操作', () => {
        it('应该有completeDrop方法', () => {
            expect(typeof tabsStore.completeDrop).toBe('function');
        });

        it('拖拽节点到另一个节点应该建立父子关系', async () => {
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

            const updatedDragNode = tabsStore.findNodeById('tab-1');
            expect(updatedDragNode?.parentId).toBe('tab-2');
            expect(updatedDragNode?.depth).toBe(1);
            expect(targetNode.children.length).toBe(1);
            expect(targetNode.children[0].id).toBe('tab-1');
        });

        it('拖拽节点到根区域应该清除父节点', async () => {
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
            tabsStore.startDrag(child, 0, 0);

            // 拖拽到根区域（targetNodeId 为 undefined 或 null）
            await tabsStore.completeDrop(null);

            const updatedChild = tabsStore.findNodeById('tab-2');
            expect(updatedChild?.parentId).toBeUndefined();
            expect(updatedChild?.depth).toBe(0);
            expect(parent.children.length).toBe(0);
        });

        it('拖拽完成后应该清除拖拽状态', async () => {
            const node1: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Node 1',
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

            const node2: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 1,
                title: 'Node 2',
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

            tabsStore.addNode(node1);
            tabsStore.addNode(node2);
            tabsStore.startDrag(node1, 0, 0);

            expect(uiStore.dragState).not.toBeNull();

            await tabsStore.completeDrop('tab-2');

            expect(uiStore.dragState).toBeNull();
        });
    });

    describe('TreeNode 组件拖拽事件', () => {
        it('TreeNode应该有draggable属性', () => {
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

            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [createPinia()],
                },
            });

            const treeNodeElement = wrapper.find('.tree-node');
            expect(treeNodeElement.attributes('draggable')).toBe('true');
        });

        it('TreeNode应该发出dragstart事件', async () => {
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

            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [createPinia()],
                },
            });

            const treeNodeElement = wrapper.find('.tree-node');
            await treeNodeElement.trigger('dragstart');

            expect(wrapper.emitted('dragstart')).toBeTruthy();
        });

        it('TreeNode应该在拖拽时显示拖拽样式', async () => {
            const pinia = createPinia();
            setActivePinia(pinia);
            const localTabsStore = useTabsStore();
            const localUIStore = useUIStore();

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

            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            localTabsStore.startDrag(node, 0, 0);
            await wrapper.vm.$nextTick();

            const treeNodeElement = wrapper.find('.tree-node');
            expect(treeNodeElement.classes()).toContain('is-dragging');
        });

        it('TreeNode应该在作为拖放目标时高亮显示', async () => {
            const pinia = createPinia();
            setActivePinia(pinia);
            const localTabsStore = useTabsStore();
            const localUIStore = useUIStore();

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

            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            const dragNode: TabTreeNode = {
                id: 'tab-2',
                tabId: 2,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 1,
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

            localTabsStore.addNode(node);
            localTabsStore.addNode(dragNode);
            localTabsStore.startDrag(dragNode, 0, 0);
            localTabsStore.updateDragPosition('tab-1');
            await wrapper.vm.$nextTick();

            const treeNodeElement = wrapper.find('.tree-node');
            expect(treeNodeElement.classes()).toContain('is-drop-target');
        });
    });
});
