/**
 * 折叠展开功能测试
 * 
 * 测试目标：
 * 1. 父节点旁的折叠/展开控制图标显示
 * 2. 点击图标切换子节点显示隐藏的功能
 * 3. 折叠状态下的子节点数量提示显示
 * 4. 新父节点默认展开状态的处理逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TreeNode from '@/components/TreeView/TreeNode.vue';
import TreeView from '@/components/TreeView/TreeView.vue';
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
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
    },
} as any;

describe('折叠展开功能', () => {
    let pinia: any;
    let tabsStore: ReturnType<typeof useTabsStore>;
    let uiStore: ReturnType<typeof useUIStore>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        tabsStore = useTabsStore();
        uiStore = useUIStore();
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

    describe('折叠按钮显示', () => {
        it('有子节点的父节点应该显示折叠按钮', () => {
            const childNode = createMockNode({ id: 'tab-2', tabId: 2 });
            const parentNode = createMockNode({
                id: 'tab-1',
                tabId: 1,
                children: [childNode],
            });

            const wrapper = mount(TreeNode, {
                props: { node: parentNode },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.collapse-button').exists()).toBe(true);
        });

        it('没有子节点的节点不应该显示折叠按钮', () => {
            const node = createMockNode({ children: [] });

            const wrapper = mount(TreeNode, {
                props: { node },
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.collapse-button').exists()).toBe(false);
        });

        it('折叠按钮应该显示正确的图标（展开/折叠）', async () => {
            const childNode = createMockNode({ id: 'tab-2', tabId: 2 });
            const parentNode = createMockNode({
                id: 'tab-1',
                tabId: 1,
                children: [childNode],
            });

            // 默认展开状态
            const wrapper = mount(TreeNode, {
                props: { node: parentNode },
                global: {
                    plugins: [pinia],
                },
            });

            const collapseButton = wrapper.find('.collapse-button');
            expect(collapseButton.exists()).toBe(true);

            // 检查展开图标
            expect(collapseButton.classes()).toContain('expanded');

            // 折叠节点
            uiStore.collapseNode(parentNode.id);
            await wrapper.vm.$nextTick();

            // 检查折叠图标
            expect(collapseButton.classes()).toContain('collapsed');
        });
    });

    describe('折叠展开交互', () => {
        it('点击折叠按钮应该切换折叠状态', async () => {
            const childNode = createMockNode({ id: 'tab-2', tabId: 2 });
            const parentNode = createMockNode({
                id: 'tab-1',
                tabId: 1,
                children: [childNode],
            });

            const wrapper = mount(TreeNode, {
                props: { node: parentNode },
                global: {
                    plugins: [pinia],
                },
            });

            // 初始状态：未折叠
            expect(uiStore.isNodeCollapsed(parentNode.id)).toBe(false);

            // 点击折叠按钮 - 这会发射toggle-collapse事件
            await wrapper.find('.collapse-button').trigger('click');

            // 验证事件被发射
            expect(wrapper.emitted('toggle-collapse')).toBeTruthy();
            expect(wrapper.emitted('toggle-collapse')?.[0]).toEqual([parentNode]);

            // 手动调用toggleCollapse（模拟TreeView的行为）
            uiStore.toggleCollapse(parentNode.id);

            // 验证状态已切换
            expect(uiStore.isNodeCollapsed(parentNode.id)).toBe(true);

            // 再次点击
            await wrapper.find('.collapse-button').trigger('click');
            uiStore.toggleCollapse(parentNode.id);

            // 验证恢复展开
            expect(uiStore.isNodeCollapsed(parentNode.id)).toBe(false);
        });

        it('点击折叠按钮不应该触发节点的click事件', async () => {
            const childNode = createMockNode({ id: 'tab-2', tabId: 2 });
            const parentNode = createMockNode({
                id: 'tab-1',
                tabId: 1,
                children: [childNode],
            });

            const wrapper = mount(TreeNode, {
                props: { node: parentNode },
                global: {
                    plugins: [pinia],
                },
            });

            // 点击折叠按钮
            await wrapper.find('.collapse-button').trigger('click');

            // 验证没有触发节点点击事件（使用@click.stop）
            expect(wrapper.emitted('click')).toBeFalsy();
        });
    });

    describe('子节点数量提示', () => {
        it('折叠状态下应该显示子节点数量', async () => {
            const children = [
                createMockNode({ id: 'tab-2', tabId: 2 }),
                createMockNode({ id: 'tab-3', tabId: 3 }),
                createMockNode({ id: 'tab-4', tabId: 4 }),
            ];
            const parentNode = createMockNode({
                id: 'tab-1',
                tabId: 1,
                children,
            });

            // 折叠节点
            uiStore.collapseNode(parentNode.id);

            const wrapper = mount(TreeNode, {
                props: { node: parentNode },
                global: {
                    plugins: [pinia],
                },
            });

            // 检查子节点数量提示
            const countBadge = wrapper.find('.children-count');
            expect(countBadge.exists()).toBe(true);
            expect(countBadge.text()).toBe('3');
        });

        it('展开状态下不应该显示子节点数量', () => {
            const children = [
                createMockNode({ id: 'tab-2', tabId: 2 }),
                createMockNode({ id: 'tab-3', tabId: 3 }),
            ];
            const parentNode = createMockNode({
                id: 'tab-1',
                tabId: 1,
                children,
            });

            // 不折叠（默认展开）
            const wrapper = mount(TreeNode, {
                props: { node: parentNode },
                global: {
                    plugins: [pinia],
                },
            });

            // 不应该显示子节点数量
            const countBadge = wrapper.find('.children-count');
            expect(countBadge.exists()).toBe(false);
        });
    });

    describe('TreeView中的折叠展开', () => {
        it('折叠节点后子节点应该不可见', async () => {
            const grandchild = createMockNode({
                id: 'tab-3',
                tabId: 3,
                depth: 2,
                parentId: 'tab-2',
            });
            const child = createMockNode({
                id: 'tab-2',
                tabId: 2,
                depth: 1,
                parentId: 'tab-1',
                children: [grandchild],
            });
            const parent = createMockNode({
                id: 'tab-1',
                tabId: 1,
                depth: 0,
                children: [child],
            });

            // 手动构建树结构
            tabsStore.addTab(parent);

            const wrapper = mount(TreeView, {
                global: {
                    plugins: [pinia],
                },
            });

            // 初始状态：所有节点可见
            expect(wrapper.findAllComponents(TreeNode).length).toBe(3);

            // 折叠父节点
            uiStore.collapseNode(parent.id);
            await wrapper.vm.$nextTick();

            // 只有父节点可见
            const visibleNodes = wrapper.findAllComponents(TreeNode);
            expect(visibleNodes.length).toBe(1);
            expect(visibleNodes[0].props('node').id).toBe('tab-1');
        });

        it('部分折叠的树应该只显示可见节点', async () => {
            // 构建树结构: parent -> child1, child2 (collapsed) -> grandchild
            const grandchild = createMockNode({
                id: 'tab-4',
                tabId: 4,
                depth: 2,
                parentId: 'tab-3',
            });
            const child1 = createMockNode({
                id: 'tab-2',
                tabId: 2,
                depth: 1,
                parentId: 'tab-1',
            });
            const child2 = createMockNode({
                id: 'tab-3',
                tabId: 3,
                depth: 1,
                parentId: 'tab-1',
                children: [grandchild],
            });
            const parent = createMockNode({
                id: 'tab-1',
                tabId: 1,
                depth: 0,
                children: [child1, child2],
            });

            tabsStore.addTab(parent);

            // 折叠child2
            uiStore.collapseNode(child2.id);

            const wrapper = mount(TreeView, {
                global: {
                    plugins: [pinia],
                },
            });

            // 应该显示: parent, child1, child2（但不显示grandchild）
            const visibleNodes = wrapper.findAllComponents(TreeNode);
            expect(visibleNodes.length).toBe(3);

            const nodeIds = visibleNodes.map(n => n.props('node').id);
            expect(nodeIds).toContain('tab-1');
            expect(nodeIds).toContain('tab-2');
            expect(nodeIds).toContain('tab-3');
            expect(nodeIds).not.toContain('tab-4');
        });
    });

    describe('默认展开状态', () => {
        it('新创建的父节点应该默认为展开状态', () => {
            const childNode = createMockNode({ id: 'tab-2', tabId: 2 });
            const parentNode = createMockNode({
                id: 'tab-1',
                tabId: 1,
                children: [childNode],
            });

            // 添加新节点
            tabsStore.addTab(parentNode);

            // 验证默认展开（未折叠）
            expect(uiStore.isNodeCollapsed(parentNode.id)).toBe(false);
        });

        it('新添加子节点到已折叠的父节点时不应该改变折叠状态', () => {
            const parentNode = createMockNode({
                id: 'tab-1',
                tabId: 1,
                children: [],
            });

            tabsStore.addTab(parentNode);

            // 折叠父节点
            uiStore.collapseNode(parentNode.id);
            expect(uiStore.isNodeCollapsed(parentNode.id)).toBe(true);

            // 添加子节点
            const childNode = createMockNode({
                id: 'tab-2',
                tabId: 2,
                parentId: parentNode.id,
            });
            parentNode.children.push(childNode);

            // 验证父节点仍然折叠
            expect(uiStore.isNodeCollapsed(parentNode.id)).toBe(true);
        });
    });

    describe('UIStore折叠功能', () => {
        it('collapseAll应该折叠所有节点', () => {
            const node1 = createMockNode({ id: 'tab-1' });
            const node2 = createMockNode({ id: 'tab-2' });
            const node3 = createMockNode({ id: 'tab-3' });

            tabsStore.addTab(node1);
            tabsStore.addTab(node2);
            tabsStore.addTab(node3);

            // 折叠所有节点
            uiStore.collapseAll(['tab-1', 'tab-2', 'tab-3']);

            expect(uiStore.isNodeCollapsed('tab-1')).toBe(true);
            expect(uiStore.isNodeCollapsed('tab-2')).toBe(true);
            expect(uiStore.isNodeCollapsed('tab-3')).toBe(true);
        });

        it('expandAll应该展开所有节点', () => {
            uiStore.collapseNode('tab-1');
            uiStore.collapseNode('tab-2');
            uiStore.collapseNode('tab-3');

            expect(uiStore.isNodeCollapsed('tab-1')).toBe(true);
            expect(uiStore.isNodeCollapsed('tab-2')).toBe(true);
            expect(uiStore.isNodeCollapsed('tab-3')).toBe(true);

            // 展开所有节点
            uiStore.expandAll();

            expect(uiStore.isNodeCollapsed('tab-1')).toBe(false);
            expect(uiStore.isNodeCollapsed('tab-2')).toBe(false);
            expect(uiStore.isNodeCollapsed('tab-3')).toBe(false);
        });
    });
});
