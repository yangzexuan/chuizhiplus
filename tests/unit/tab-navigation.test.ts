/**
 * 标签页导航和定位功能测试
 * 
 * 测试目标：
 * 1. 实现标签页切换时的树状列表自动滚动定位
 * 2. 建立被折叠隐藏节点的父节点路径自动展开
 * 3. 创建定位完成后的目标节点视觉反馈高亮
 * 4. 添加大量节点情况下的平滑滚动动画效果
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import { useUIStore } from '@/stores/ui';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
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
    update: vi.fn(),
    move: vi.fn(),
    remove: vi.fn(),
    create: vi.fn(),
  },
  windows: {
    get: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe('标签页导航和定位功能', () => {
  let tabsStore: ReturnType<typeof useTabsStore>;
  let uiStore: ReturnType<typeof useUIStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    tabsStore = useTabsStore();
    uiStore = useUIStore();
    vi.clearAllMocks();
  });

  describe('确保节点可见', () => {
    it('应该有ensureNodeVisible方法', () => {
      expect(typeof tabsStore.ensureNodeVisible).toBe('function');
    });

    it('ensureNodeVisible应该展开所有父节点', () => {
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

      parent.children.push(child);
      grandparent.children.push(parent);
      tabsStore.addNode(grandparent);

      // 折叠所有节点
      uiStore.collapseNode('tab-1');
      uiStore.collapseNode('tab-2');

      expect(uiStore.isNodeCollapsed('tab-1')).toBe(true);
      expect(uiStore.isNodeCollapsed('tab-2')).toBe(true);

      // 确保子节点可见
      tabsStore.ensureNodeVisible('tab-3');

      // 所有祖先都应该被展开
      expect(uiStore.isNodeCollapsed('tab-1')).toBe(false);
      expect(uiStore.isNodeCollapsed('tab-2')).toBe(false);
    });

    it('根节点调用ensureNodeVisible应该不报错', () => {
      const node: TabTreeNode = {
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        parentId: undefined,
        children: [],
        depth: 0,
        siblingIndex: 0,
        title: 'Root',
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

      expect(() => {
        tabsStore.ensureNodeVisible('tab-1');
      }).not.toThrow();
    });
  });

  describe('节点高亮', () => {
    it('应该有highlightNode方法', () => {
      expect(typeof tabsStore.highlightNode).toBe('function');
    });

    it('应该有clearNodeHighlight方法', () => {
      expect(typeof tabsStore.clearNodeHighlight).toBe('function');
    });

    it('highlightNode应该设置节点的isHighlighted为true', () => {
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

      expect(node.isHighlighted).toBe(false);

      tabsStore.highlightNode('tab-1');

      const highlightedNode = tabsStore.findNodeById('tab-1');
      expect(highlightedNode?.isHighlighted).toBe(true);
    });

    it('highlightNode应该清除之前高亮的节点', () => {
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

      tabsStore.addNode(node1);
      tabsStore.addNode(node2);

      // 高亮第一个节点
      tabsStore.highlightNode('tab-1');
      expect(tabsStore.findNodeById('tab-1')?.isHighlighted).toBe(true);

      // 高亮第二个节点应该清除第一个节点的高亮
      tabsStore.highlightNode('tab-2');
      expect(tabsStore.findNodeById('tab-1')?.isHighlighted).toBe(false);
      expect(tabsStore.findNodeById('tab-2')?.isHighlighted).toBe(true);
    });

    it('clearNodeHighlight应该清除所有高亮', () => {
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

      tabsStore.highlightNode('tab-1');
      expect(tabsStore.findNodeById('tab-1')?.isHighlighted).toBe(true);

      tabsStore.clearNodeHighlight();
      expect(tabsStore.findNodeById('tab-1')?.isHighlighted).toBe(false);
    });
  });

  describe('滚动到节点', () => {
    it('应该有scrollToNode方法', () => {
      expect(typeof tabsStore.scrollToNode).toBe('function');
    });

    it('scrollToNode应该确保节点可见并高亮', () => {
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

      // 折叠父节点
      uiStore.collapseNode('tab-1');
      expect(uiStore.isNodeCollapsed('tab-1')).toBe(true);

      // 滚动到子节点
      tabsStore.scrollToNode('tab-2');

      // 父节点应该被展开
      expect(uiStore.isNodeCollapsed('tab-1')).toBe(false);

      // 子节点应该被高亮
      expect(tabsStore.findNodeById('tab-2')?.isHighlighted).toBe(true);
    });
  });

  describe('滚动到活跃标签页', () => {
    it('应该有scrollToActiveTab方法', () => {
      expect(typeof tabsStore.scrollToActiveTab).toBe('function');
    });

    it('scrollToActiveTab应该滚动到当前活跃的标签页', () => {
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
        siblingIndex: 0,
        title: 'Tab 2',
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

      tabsStore.addNode(node1);
      tabsStore.addNode(node2);
      tabsStore.setActiveTab(2);

      tabsStore.scrollToActiveTab();

      // 活跃标签页应该被高亮
      expect(tabsStore.findNodeById('tab-2')?.isHighlighted).toBe(true);
    });

    it('没有活跃标签页时scrollToActiveTab不应该报错', () => {
      expect(() => {
        tabsStore.scrollToActiveTab();
      }).not.toThrow();
    });
  });
});
