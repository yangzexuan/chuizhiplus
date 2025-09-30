/**
 * 父子关系自动识别和建立测试
 * 
 * 测试目标：
 * 1. 标签页创建事件监听和openerTabId解析
 * 2. 新标签页自动添加为父页面子节点
 * 3. 独立打开页面作为根节点
 * 4. 父子关系数据结构维护和更新
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
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
        onCreated: {
            addListener: vi.fn(),
        },
        get: vi.fn(),
        query: vi.fn(),
    },
} as any;

describe('父子关系自动识别和建立', () => {
    let tabsStore: ReturnType<typeof useTabsStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        tabsStore = useTabsStore();
        vi.clearAllMocks();
    });

    const createMockTab = (overrides = {}): chrome.tabs.Tab => ({
        id: 1,
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
        title: 'Test Page',
        url: 'https://example.com',
        ...overrides,
    });

    describe('标签页创建事件和openerTabId解析', () => {
        it('应该能够处理有openerTabId的新标签页', () => {
            const parentTab = createMockTab({ id: 1, title: 'Parent' });
            const childTab = createMockTab({ id: 2, title: 'Child', openerTabId: 1 });

            // 添加父节点
            tabsStore.addTabFromChrome(parentTab);

            // 添加有openerTabId的子节点
            tabsStore.addTabFromChrome(childTab);

            // 验证子节点被添加到父节点下
            const parentNode = tabsStore.findNodeByTabId(1);
            expect(parentNode).toBeDefined();
            expect(parentNode?.children.length).toBe(1);
            expect(parentNode?.children[0].tabId).toBe(2);
        });

        it('应该能够处理无openerTabId的独立标签页', () => {
            const independentTab = createMockTab({ id: 3, title: 'Independent' });

            tabsStore.addTabFromChrome(independentTab);

            // 验证作为根节点添加
            const rootNodes = tabsStore.rootNodes;
            expect(rootNodes.length).toBe(1);
            expect(rootNodes[0].tabId).toBe(3);
            expect(rootNodes[0].parentId).toBeUndefined();
        });

        it('应该处理openerTabId指向不存在的父节点的情况', () => {
            const orphanTab = createMockTab({ id: 4, title: 'Orphan', openerTabId: 999 });

            tabsStore.addTabFromChrome(orphanTab);

            // 验证作为根节点添加（父节点不存在时的降级处理）
            const node = tabsStore.findNodeByTabId(4);
            expect(node).toBeDefined();
            expect(node?.parentId).toBeUndefined();
        });
    });

    describe('父子关系建立和树结构维护', () => {
        it('应该正确建立多层父子关系', () => {
            const grandparent = createMockTab({ id: 1, title: 'Grandparent' });
            const parent = createMockTab({ id: 2, title: 'Parent', openerTabId: 1 });
            const child = createMockTab({ id: 3, title: 'Child', openerTabId: 2 });

            tabsStore.addTabFromChrome(grandparent);
            tabsStore.addTabFromChrome(parent);
            tabsStore.addTabFromChrome(child);

            // 验证三层结构
            const grandparentNode = tabsStore.findNodeByTabId(1);
            expect(grandparentNode?.depth).toBe(0);
            expect(grandparentNode?.children.length).toBe(1);

            const parentNode = tabsStore.findNodeByTabId(2);
            expect(parentNode?.depth).toBe(1);
            expect(parentNode?.parentId).toBe('tab-1');
            expect(parentNode?.children.length).toBe(1);

            const childNode = tabsStore.findNodeByTabId(3);
            expect(childNode?.depth).toBe(2);
            expect(childNode?.parentId).toBe('tab-2');
            expect(childNode?.children.length).toBe(0);
        });

        it('应该正确设置节点的depth属性', () => {
            const parent = createMockTab({ id: 1 });
            const child1 = createMockTab({ id: 2, openerTabId: 1 });
            const child2 = createMockTab({ id: 3, openerTabId: 1 });
            const grandchild = createMockTab({ id: 4, openerTabId: 2 });

            tabsStore.addTabFromChrome(parent);
            tabsStore.addTabFromChrome(child1);
            tabsStore.addTabFromChrome(child2);
            tabsStore.addTabFromChrome(grandchild);

            expect(tabsStore.findNodeByTabId(1)?.depth).toBe(0);
            expect(tabsStore.findNodeByTabId(2)?.depth).toBe(1);
            expect(tabsStore.findNodeByTabId(3)?.depth).toBe(1);
            expect(tabsStore.findNodeByTabId(4)?.depth).toBe(2);
        });

        it('应该正确设置节点的siblingIndex', () => {
            const parent = createMockTab({ id: 1 });
            const child1 = createMockTab({ id: 2, openerTabId: 1 });
            const child2 = createMockTab({ id: 3, openerTabId: 1 });
            const child3 = createMockTab({ id: 4, openerTabId: 1 });

            tabsStore.addTabFromChrome(parent);
            tabsStore.addTabFromChrome(child1);
            tabsStore.addTabFromChrome(child2);
            tabsStore.addTabFromChrome(child3);

            const parentNode = tabsStore.findNodeByTabId(1);
            expect(parentNode?.children[0].siblingIndex).toBe(0);
            expect(parentNode?.children[1].siblingIndex).toBe(1);
            expect(parentNode?.children[2].siblingIndex).toBe(2);
        });

        it('应该正确更新windowGroups', () => {
            const tab1 = createMockTab({ id: 1, windowId: 1 });
            const tab2 = createMockTab({ id: 2, windowId: 1, openerTabId: 1 });
            const tab3 = createMockTab({ id: 3, windowId: 2 });

            tabsStore.addTabFromChrome(tab1);
            tabsStore.addTabFromChrome(tab2);
            tabsStore.addTabFromChrome(tab3);

            expect(Object.keys(tabsStore.windowGroups).length).toBe(2);
            expect(tabsStore.tabsByWindow[1]?.length).toBe(2);
            expect(tabsStore.tabsByWindow[2]?.length).toBe(1);
        });
    });

    describe('addTabFromChrome方法', () => {
        it('应该存在addTabFromChrome方法', () => {
            expect(typeof tabsStore.addTabFromChrome).toBe('function');
        });

        it('addTabFromChrome应该接受chrome.tabs.Tab类型参数', () => {
            const tab = createMockTab({ id: 1 });

            // 不应该抛出错误
            expect(() => tabsStore.addTabFromChrome(tab)).not.toThrow();
        });

        it('addTabFromChrome应该返回创建的节点ID', () => {
            const tab = createMockTab({ id: 1 });
            const nodeId = tabsStore.addTabFromChrome(tab);

            expect(nodeId).toBeDefined();
            expect(typeof nodeId).toBe('string');
            expect(nodeId).toMatch(/^tab-\d+$/);
        });

        it('addTabFromChrome应该创建包含所有必需属性的节点', () => {
            const tab = createMockTab({
                id: 1,
                title: 'Test Title',
                url: 'https://test.com',
                favIconUrl: 'https://test.com/favicon.ico',
                active: true,
                pinned: false,
                audible: true,
            });

            const nodeId = tabsStore.addTabFromChrome(tab);
            const node = tabsStore.findNodeById(nodeId);

            expect(node).toBeDefined();
            expect(node?.title).toBe('Test Title');
            expect(node?.url).toBe('https://test.com');
            expect(node?.favicon).toBe('https://test.com/favicon.ico');
            expect(node?.isActive).toBe(true);
            expect(node?.isPinned).toBe(false);
            expect(node?.isAudioPlaying).toBe(true);
        });
    });

    describe('子节点管理', () => {
        it('移除父节点时应该保留子节点并将其提升为根节点', () => {
            const parent = createMockTab({ id: 1 });
            const child1 = createMockTab({ id: 2, openerTabId: 1 });
            const child2 = createMockTab({ id: 3, openerTabId: 1 });

            tabsStore.addTabFromChrome(parent);
            tabsStore.addTabFromChrome(child1);
            tabsStore.addTabFromChrome(child2);

            // 移除父节点
            tabsStore.removeTab(1);

            // 子节点应该仍然存在，并成为根节点
            const child1Node = tabsStore.findNodeByTabId(2);
            const child2Node = tabsStore.findNodeByTabId(3);

            expect(child1Node).toBeDefined();
            expect(child2Node).toBeDefined();
            expect(child1Node?.parentId).toBeUndefined();
            expect(child2Node?.parentId).toBeUndefined();
            expect(child1Node?.depth).toBe(0);
            expect(child2Node?.depth).toBe(0);
        });

        it('应该能够在运行时更新父子关系', () => {
            const tab1 = createMockTab({ id: 1 });
            const tab2 = createMockTab({ id: 2 });

            tabsStore.addTabFromChrome(tab1);
            tabsStore.addTabFromChrome(tab2);

            // 初始状态：两个独立的根节点
            expect(tabsStore.rootNodes.length).toBe(2);

            // 更新关系：将tab2设为tab1的子节点
            tabsStore.setParent(2, 1);

            // 验证关系已更新
            expect(tabsStore.rootNodes.length).toBe(1);
            const parentNode = tabsStore.findNodeByTabId(1);
            expect(parentNode?.children.length).toBe(1);
            expect(parentNode?.children[0].tabId).toBe(2);
        });
    });

    describe('边界情况和错误处理', () => {
        it('应该处理重复添加同一标签页的情况', () => {
            const tab = createMockTab({ id: 1 });

            const nodeId1 = tabsStore.addTabFromChrome(tab);
            const nodeId2 = tabsStore.addTabFromChrome(tab);

            // 第二次添加应该被忽略或更新现有节点
            expect(tabsStore.flattenedTabs.length).toBe(1);
        });

        it('应该处理无效的标签页数据', () => {
            const invalidTab = { id: undefined } as any;

            // 不应该崩溃
            expect(() => tabsStore.addTabFromChrome(invalidTab)).not.toThrow();
        });

        it('应该处理循环引用的情况（理论上不应该发生）', () => {
            // 这是一个防御性测试
            const tab1 = createMockTab({ id: 1, openerTabId: 2 });
            const tab2 = createMockTab({ id: 2, openerTabId: 1 });

            // 应该防止循环引用
            tabsStore.addTabFromChrome(tab1);
            tabsStore.addTabFromChrome(tab2);

            // 验证没有创建循环结构
            const node1 = tabsStore.findNodeByTabId(1);
            const node2 = tabsStore.findNodeByTabId(2);

            // 至少有一个应该是根节点
            expect(
                node1?.parentId === undefined || node2?.parentId === undefined
            ).toBe(true);
        });
    });
});
