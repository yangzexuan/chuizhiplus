/**
 * 状态过滤功能测试
 * 
 * 测试目标：
 * 1. 建立按音频播放、活动状态等条件的过滤功能
 * 2. 实现多种过滤条件的组合和交集处理
 * 3. 创建清除搜索条件和恢复完整显示的功能
 * 4. 添加过滤状态的视觉指示和用户反馈
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

describe('状态过滤功能', () => {
  let tabsStore: ReturnType<typeof useTabsStore>;
  let uiStore: ReturnType<typeof useUIStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    tabsStore = useTabsStore();
    uiStore = useUIStore();
    vi.clearAllMocks();
  });

  describe('按状态过滤', () => {
    it('应该有applyFilters方法', () => {
      expect(typeof tabsStore.applyFilters).toBe('function');
    });

    it('应该能够按音频播放状态过滤', () => {
      const nodes: TabTreeNode[] = [
        {
          id: 'tab-1',
          tabId: 1,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Playing Audio',
          url: 'https://example.com',
          isActive: false,
          isLoading: false,
          isAudioPlaying: true,
          isPinned: false,
          isCollapsed: false,
          isVisible: true,
          isHighlighted: false,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          lastModified: Date.now(),
        },
        {
          id: 'tab-2',
          tabId: 2,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Silent',
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
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      uiStore.addFilter('audio');
      tabsStore.applyFilters();

      expect(tabsStore.filteredTabs.length).toBe(1);
      expect(tabsStore.filteredTabs[0].id).toBe('tab-1');
    });

    it('应该能够按活跃状态过滤', () => {
      const nodes: TabTreeNode[] = [
        {
          id: 'tab-1',
          tabId: 1,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Active',
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
        },
        {
          id: 'tab-2',
          tabId: 2,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Inactive',
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
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      uiStore.addFilter('active');
      tabsStore.applyFilters();

      expect(tabsStore.filteredTabs.length).toBe(1);
      expect(tabsStore.filteredTabs[0].id).toBe('tab-1');
    });

    it('应该能够按固定状态过滤', () => {
      const nodes: TabTreeNode[] = [
        {
          id: 'tab-1',
          tabId: 1,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Pinned',
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
        },
        {
          id: 'tab-2',
          tabId: 2,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Unpinned',
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
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      uiStore.addFilter('pinned');
      tabsStore.applyFilters();

      expect(tabsStore.filteredTabs.length).toBe(1);
      expect(tabsStore.filteredTabs[0].id).toBe('tab-1');
    });

    it('应该能够按加载状态过滤', () => {
      const nodes: TabTreeNode[] = [
        {
          id: 'tab-1',
          tabId: 1,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Loading',
          url: 'https://example.com',
          isActive: false,
          isLoading: true,
          isAudioPlaying: false,
          isPinned: false,
          isCollapsed: false,
          isVisible: true,
          isHighlighted: false,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          lastModified: Date.now(),
        },
        {
          id: 'tab-2',
          tabId: 2,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Loaded',
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
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      uiStore.addFilter('loading');
      tabsStore.applyFilters();

      expect(tabsStore.filteredTabs.length).toBe(1);
      expect(tabsStore.filteredTabs[0].id).toBe('tab-1');
    });
  });

  describe('多条件组合过滤', () => {
    it('应该支持多个过滤条件的交集', () => {
      const nodes: TabTreeNode[] = [
        {
          id: 'tab-1',
          tabId: 1,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Active Audio',
          url: 'https://example.com',
          isActive: true,
          isLoading: false,
          isAudioPlaying: true,
          isPinned: false,
          isCollapsed: false,
          isVisible: true,
          isHighlighted: false,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          lastModified: Date.now(),
        },
        {
          id: 'tab-2',
          tabId: 2,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Active Silent',
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
        },
        {
          id: 'tab-3',
          tabId: 3,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Inactive Audio',
          url: 'https://example.com',
          isActive: false,
          isLoading: false,
          isAudioPlaying: true,
          isPinned: false,
          isCollapsed: false,
          isVisible: true,
          isHighlighted: false,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          lastModified: Date.now(),
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      // 同时激活 active 和 audio 过滤器
      uiStore.addFilter('active');
      uiStore.addFilter('audio');
      tabsStore.applyFilters();

      // 只有同时满足两个条件的标签页应该被过滤出来
      expect(tabsStore.filteredTabs.length).toBe(1);
      expect(tabsStore.filteredTabs[0].id).toBe('tab-1');
    });

    it('没有过滤器时应该显示所有标签页', () => {
      const nodes: TabTreeNode[] = [
        {
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
        },
        {
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
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      tabsStore.applyFilters();

      expect(tabsStore.filteredTabs.length).toBe(2);
    });
  });

  describe('搜索和过滤组合', () => {
    it('应该支持搜索和过滤同时生效', () => {
      const nodes: TabTreeNode[] = [
        {
          id: 'tab-1',
          tabId: 1,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'GitHub Active',
          url: 'https://github.com',
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
        },
        {
          id: 'tab-2',
          tabId: 2,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'GitHub Inactive',
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
        },
        {
          id: 'tab-3',
          tabId: 3,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Google Active',
          url: 'https://google.com',
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
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      // 搜索 "GitHub" 并且过滤 active
      uiStore.setSearchQuery('GitHub');
      tabsStore.searchTabs('GitHub');
      uiStore.addFilter('active');
      tabsStore.applyFilters();

      // 只有同时匹配搜索和过滤条件的标签页
      expect(tabsStore.filteredTabs.length).toBe(1);
      expect(tabsStore.filteredTabs[0].id).toBe('tab-1');
    });
  });

  describe('清除过滤', () => {
    it('应该有clearAllFiltersAndSearch方法', () => {
      expect(typeof tabsStore.clearAllFiltersAndSearch).toBe('function');
    });

    it('clearAllFiltersAndSearch应该清除所有过滤器和搜索', () => {
      const nodes: TabTreeNode[] = [
        {
          id: 'tab-1',
          tabId: 1,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'GitHub',
          url: 'https://github.com',
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
        },
        {
          id: 'tab-2',
          tabId: 2,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Google',
          url: 'https://google.com',
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
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      // 设置搜索和过滤
      uiStore.setSearchQuery('GitHub');
      tabsStore.searchTabs('GitHub');
      uiStore.addFilter('active');
      tabsStore.applyFilters();

      expect(tabsStore.filteredTabs.length).toBe(1);

      // 清除所有
      tabsStore.clearAllFiltersAndSearch();

      // 应该显示所有标签页
      expect(tabsStore.filteredTabs.length).toBe(2);
      expect(uiStore.searchQuery).toBe('');
      expect(uiStore.hasActiveFilters).toBe(false);
    });
  });

  describe('过滤器可用性', () => {
    it('应该有getAvailableFilters方法', () => {
      expect(typeof tabsStore.getAvailableFilters).toBe('function');
    });

    it('getAvailableFilters应该返回可用的过滤器及其数量', () => {
      const nodes: TabTreeNode[] = [
        {
          id: 'tab-1',
          tabId: 1,
          windowId: 1,
          parentId: undefined,
          children: [],
          depth: 0,
          siblingIndex: 0,
          title: 'Tab 1',
          url: 'https://example.com',
          isActive: true,
          isLoading: false,
          isAudioPlaying: true,
          isPinned: true,
          isCollapsed: false,
          isVisible: true,
          isHighlighted: false,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          lastModified: Date.now(),
        },
        {
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
          isLoading: true,
          isAudioPlaying: false,
          isPinned: false,
          isCollapsed: false,
          isVisible: true,
          isHighlighted: false,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          lastModified: Date.now(),
        },
      ];

      nodes.forEach(node => tabsStore.addNode(node));

      const filters = tabsStore.getAvailableFilters();

      expect(filters.active).toBe(1);
      expect(filters.audio).toBe(1);
      expect(filters.pinned).toBe(1);
      expect(filters.loading).toBe(1);
    });
  });
});
