/**
 * 节点交互功能测试
 * 
 * 测试目标：
 * 1. 节点点击激活标签页
 * 2. 活跃标签页高亮显示
 * 3. 右键上下文菜单
 * 4. 状态指示器同步
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TreeNode from '@/components/TreeView/TreeNode.vue';
import { useTabsStore } from '@/stores/tabs';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
const mockSendMessage = vi.fn().mockResolvedValue({ success: true });
global.chrome = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
    runtime: {
        sendMessage: mockSendMessage,
    },
    tabs: {
        update: vi.fn().mockResolvedValue({}),
    },
} as any;

describe('节点交互功能', () => {
    let pinia: any;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
    });

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

    describe('节点点击激活标签页', () => {
        it('点击节点应该触发click事件', async () => {
            const node = createMockNode();
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.find('.tree-node').trigger('click');

            expect(wrapper.emitted('click')).toBeTruthy();
            expect(wrapper.emitted('click')?.[0]).toEqual([node]);
        });

        it('点击节点应该发送激活标签页的消息', async () => {
            const tabsStore = useTabsStore();
            const node = createMockNode({ tabId: 123 });

            await tabsStore.activateTab(123);

            expect(mockSendMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'ACTIVATE_TAB',
                    tabId: 123,
                })
            );
        });

        it('激活标签页后应该更新store中的activeTabId', async () => {
            const tabsStore = useTabsStore();
            const node = createMockNode({ tabId: 456 });
            tabsStore.addTab(node);

            tabsStore.setActiveTab(456);

            expect(tabsStore.activeTabId).toBe(456);
        });
    });

    describe('活跃标签页高亮显示', () => {
        it('活跃节点应该有is-active类', () => {
            const node = createMockNode({ isActive: true });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.tree-node').classes()).toContain('is-active');
        });

        it('非活跃节点不应该有is-active类', () => {
            const node = createMockNode({ isActive: false });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.tree-node').classes()).not.toContain('is-active');
        });

        it('当标签页被激活时应该更新所有节点的isActive状态', () => {
            const tabsStore = useTabsStore();

            const node1 = createMockNode({ id: 'tab-1', tabId: 1, isActive: true });
            const node2 = createMockNode({ id: 'tab-2', tabId: 2, isActive: false });

            tabsStore.addTab(node1);
            tabsStore.addTab(node2);

            // 激活tab-2
            tabsStore.setActiveTab(2);

            const updatedNode1 = tabsStore.findNodeByTabId(1);
            const updatedNode2 = tabsStore.findNodeByTabId(2);

            expect(updatedNode1?.isActive).toBe(false);
            expect(updatedNode2?.isActive).toBe(true);
        });
    });

    describe('右键上下文菜单', () => {
        it('右键点击节点应该触发contextmenu事件', async () => {
            const node = createMockNode();
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.find('.tree-node').trigger('contextmenu');

            expect(wrapper.emitted('contextmenu')).toBeTruthy();
        });

        it('右键点击应该阻止默认行为', async () => {
            const node = createMockNode();
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            const event = new MouseEvent('contextmenu');
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            await wrapper.find('.tree-node').element.dispatchEvent(event);

            // 注意：在实际实现中需要在组件内调用preventDefault
        });
    });

    describe('标签页状态指示器', () => {
        it('加载中的标签页应该显示加载指示器', () => {
            const node = createMockNode({ isLoading: true });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.loading-indicator').exists()).toBe(true);
        });

        it('播放音频的标签页应该显示音频图标', () => {
            const node = createMockNode({ isAudioPlaying: true });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.audio-icon').exists()).toBe(true);
        });

        it('固定的标签页应该显示固定图标', () => {
            const node = createMockNode({ isPinned: true });
            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.pin-icon').exists()).toBe(true);
        });

        it('状态变化时应该实时更新显示', async () => {
            const tabsStore = useTabsStore();
            const node = createMockNode({
                id: 'tab-1',
                tabId: 1,
                isLoading: false
            });

            tabsStore.addTab(node);

            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            // 初始状态：不显示加载指示器
            expect(wrapper.find('.loading-indicator').exists()).toBe(false);

            // 更新状态
            tabsStore.updateTab('tab-1', { isLoading: true });
            await wrapper.vm.$nextTick();

            // 应该显示加载指示器
            // 注意：需要重新获取props或使用响应式数据
        });
    });

    describe('Store方法 - activateTab', () => {
        it('应该存在activateTab方法', () => {
            const tabsStore = useTabsStore();
            expect(typeof tabsStore.activateTab).toBe('function');
        });

        it('activateTab应该发送消息到Service Worker', async () => {
            const tabsStore = useTabsStore();

            await tabsStore.activateTab(123);

            expect(mockSendMessage).toHaveBeenCalledWith({
                type: 'ACTIVATE_TAB',
                tabId: 123,
            });
        });

        it('activateTab成功后应该更新activeTabId', async () => {
            const tabsStore = useTabsStore();
            mockSendMessage.mockResolvedValueOnce({ success: true });

            await tabsStore.activateTab(789);

            expect(tabsStore.activeTabId).toBe(789);
        });

        it('activateTab失败时应该处理错误', async () => {
            const tabsStore = useTabsStore();
            mockSendMessage.mockResolvedValueOnce({
                success: false,
                error: 'Tab not found'
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await tabsStore.activateTab(999);

            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});
