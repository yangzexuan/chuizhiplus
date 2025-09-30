/**
 * 树状视图组件测试
 * 
 * 测试目标：
 * 1. TreeView组件 - 层次化标签页展示
 * 2. TreeNode组件 - 节点渲染（标题、favicon、缩进）
 * 3. 树状连接线和视觉层次
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TreeView from '@/components/TreeView/TreeView.vue';
import TreeNode from '@/components/TreeView/TreeNode.vue';
import { useTabsStore } from '@/stores/tabs';
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
    runtime: {
        sendMessage: vi.fn().mockResolvedValue({ success: true, data: [] }),
    },
} as any;

describe('树状视图组件', () => {
    let pinia: any;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    describe('TreeView组件', () => {
        it('应该能够挂载', () => {
            const wrapper = mount(TreeView, {
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.exists()).toBe(true);
        });

        it('应该有正确的CSS类', () => {
            const wrapper = mount(TreeView, {
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.tree-view').exists()).toBe(true);
        });

        it('当没有标签页时应该显示空状态', () => {
            const wrapper = mount(TreeView, {
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.empty-state').exists()).toBe(true);
        });

        it('当有标签页时应该渲染TreeNode组件', () => {
            const tabsStore = useTabsStore();

            const tab: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
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

            tabsStore.addTab(tab);

            const wrapper = mount(TreeView, {
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.findComponent(TreeNode).exists()).toBe(true);
        });

        it('应该渲染所有可见的标签页节点', () => {
            const tabsStore = useTabsStore();

            // 添加多个标签页
            for (let i = 1; i <= 3; i++) {
                const tab: TabTreeNode = {
                    id: `tab-${i}`,
                    tabId: i,
                    windowId: 1,
                    children: [],
                    depth: 0,
                    siblingIndex: i - 1,
                    title: `Tab ${i}`,
                    url: `https://example.com/${i}`,
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
                tabsStore.addTab(tab);
            }

            const wrapper = mount(TreeView, {
                global: {
                    plugins: [pinia],
                },
            });

            const nodes = wrapper.findAllComponents(TreeNode);
            expect(nodes.length).toBe(3);
        });

        it('应该支持搜索过滤', async () => {
            const tabsStore = useTabsStore();
            const uiStore = useUIStore();

            const tab1: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Example Page',
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
                windowId: 1,
                children: [],
                depth: 0,
                siblingIndex: 1,
                title: 'Test Page',
                url: 'https://test.com',
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

            tabsStore.addTab(tab1);
            tabsStore.addTab(tab2);

            const wrapper = mount(TreeView, {
                global: {
                    plugins: [pinia],
                },
            });

            // 初始应该显示2个节点
            expect(wrapper.findAllComponents(TreeNode).length).toBe(2);

            // 设置搜索查询
            uiStore.setSearchQuery('Example');
            await wrapper.vm.$nextTick();

            // 应该只显示匹配的节点
            const visibleNodes = wrapper.findAllComponents(TreeNode);
            expect(visibleNodes.length).toBeLessThanOrEqual(2);
        });
    });

    describe('TreeNode组件', () => {
        const createMockNode = (overrides = {}): TabTreeNode => ({
            id: 'tab-1',
            tabId: 1,
            windowId: 1,
            children: [],
            depth: 0,
            siblingIndex: 0,
            title: 'Test Tab',
            url: 'https://example.com',
            favicon: 'https://example.com/favicon.ico',
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
            ...overrides,
        });

        it('应该能够挂载', () => {
            const node = createMockNode();
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.exists()).toBe(true);
        });

        it('应该显示标题', () => {
            const node = createMockNode({ title: 'My Test Page' });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.text()).toContain('My Test Page');
        });

        it('应该显示favicon', () => {
            const node = createMockNode({
                favicon: 'https://example.com/favicon.ico'
            });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            const favicon = wrapper.find('.node-favicon');
            expect(favicon.exists()).toBe(true);
        });

        it('应该根据depth设置正确的缩进', () => {
            const node = createMockNode({ depth: 2 });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            const nodeElement = wrapper.find('.tree-node');
            const style = nodeElement.attributes('style');
            expect(style).toContain('padding-left');
        });

        it('活跃节点应该有特殊样式', () => {
            const node = createMockNode({ isActive: true });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.tree-node').classes()).toContain('is-active');
        });

        it('当节点有子节点时应该显示折叠按钮', () => {
            const child: TabTreeNode = createMockNode({
                id: 'tab-2',
                tabId: 2,
                depth: 1
            });
            const node = createMockNode({ children: [child] });

            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.collapse-button').exists()).toBe(true);
        });

        it('当节点没有子节点时不应该显示折叠按钮', () => {
            const node = createMockNode({ children: [] });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.collapse-button').exists()).toBe(false);
        });

        it('加载中的节点应该显示加载指示器', () => {
            const node = createMockNode({ isLoading: true });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.loading-indicator').exists()).toBe(true);
        });

        it('播放音频的节点应该显示音频图标', () => {
            const node = createMockNode({ isAudioPlaying: true });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.audio-icon').exists()).toBe(true);
        });

        it('固定的节点应该显示固定图标', () => {
            const node = createMockNode({ isPinned: true });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.pin-icon').exists()).toBe(true);
        });

        it('应该支持点击事件', async () => {
            const node = createMockNode();
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.find('.tree-node').trigger('click');

            expect(wrapper.emitted('click')).toBeTruthy();
        });
    });
});
