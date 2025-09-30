/**
 * URL导航和定位功能测试
 * 
 * 测试目标：
 * 1. 建立地址栏直接导航的节点定位响应
 * 2. 实现页面URL变化时的对应树节点查找
 * 3. 创建新页面导航时的父子关系判断和更新
 * 4. 添加导航定位失败时的fallback处理机制
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

describe('URL导航和定位功能', () => {
  let tabsStore: ReturnType<typeof useTabsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    tabsStore = useTabsStore();
    vi.clearAllMocks();
  });

  describe('按URL查找节点', () => {
    it('应该有findNodeByUrl方法', () => {
      expect(typeof tabsStore.findNodeByUrl).toBe('function');
    });

    it('findNodeByUrl应该能找到完全匹配的节点', () => {
      const node: TabTreeNode = {
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        parentId: undefined,
        children: [],
        depth: 0,
        siblingIndex: 0,
        title: 'GitHub',
        url: 'https://github.com/user/repo',
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

      const found = tabsStore.findNodeByUrl('https://github.com/user/repo');
      expect(found).toBeDefined();
      expect(found?.id).toBe('tab-1');
    });

    it('findNodeByUrl应该能找到子节点', () => {
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
        url: 'https://github.com',
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

      const found = tabsStore.findNodeByUrl('https://github.com');
      expect(found).toBeDefined();
      expect(found?.id).toBe('tab-2');
    });

    it('findNodeByUrl找不到时应该返回undefined', () => {
      const node: TabTreeNode = {
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        parentId: undefined,
        children: [],
        depth: 0,
        siblingIndex: 0,
        title: 'GitHub',
        url: 'https://github.com',
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

      const found = tabsStore.findNodeByUrl('https://nonexistent.com');
      expect(found).toBeUndefined();
    });
  });

  describe('导航到URL', () => {
    it('应该有navigateToUrl方法', () => {
      expect(typeof tabsStore.navigateToUrl).toBe('function');
    });

    it('navigateToUrl应该查找并滚动到对应节点', () => {
      const node: TabTreeNode = {
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        parentId: undefined,
        children: [],
        depth: 0,
        siblingIndex: 0,
        title: 'GitHub',
        url: 'https://github.com',
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

      const result = tabsStore.navigateToUrl('https://github.com');

      expect(result).toBe(true);
      expect(tabsStore.findNodeById('tab-1')?.isHighlighted).toBe(true);
    });

    it('navigateToUrl应该展开父节点', () => {
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
        url: 'https://github.com',
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
      const uiStore = useUIStore();
      uiStore.collapseNode('tab-1');

      const result = tabsStore.navigateToUrl('https://github.com');

      expect(result).toBe(true);
      expect(uiStore.isNodeCollapsed('tab-1')).toBe(false);
    });

    it('navigateToUrl找不到节点时应该返回false', () => {
      const node: TabTreeNode = {
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        parentId: undefined,
        children: [],
        depth: 0,
        siblingIndex: 0,
        title: 'GitHub',
        url: 'https://github.com',
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

      const result = tabsStore.navigateToUrl('https://nonexistent.com');

      expect(result).toBe(false);
    });
  });

  describe('查找所有匹配URL的节点', () => {
    it('应该有findAllNodesByUrl方法', () => {
      expect(typeof tabsStore.findAllNodesByUrl).toBe('function');
    });

    it('findAllNodesByUrl应该返回所有匹配的节点', () => {
      const node1: TabTreeNode = {
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        parentId: undefined,
        children: [],
        depth: 0,
        siblingIndex: 0,
        title: 'GitHub 1',
        url: 'https://github.com',
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
        title: 'GitHub 2',
        url: 'https://github.com',
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

      const nodes = tabsStore.findAllNodesByUrl('https://github.com');

      expect(nodes.length).toBe(2);
      expect(nodes.map(n => n.id)).toContain('tab-1');
      expect(nodes.map(n => n.id)).toContain('tab-2');
    });

    it('findAllNodesByUrl找不到时应该返回空数组', () => {
      const node: TabTreeNode = {
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        parentId: undefined,
        children: [],
        depth: 0,
        siblingIndex: 0,
        title: 'GitHub',
        url: 'https://github.com',
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

      const nodes = tabsStore.findAllNodesByUrl('https://nonexistent.com');

      expect(nodes).toEqual([]);
    });
  });
});
