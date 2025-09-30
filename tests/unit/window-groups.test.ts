/**
 * 多窗口标签页分组功能测试
 * 
 * 测试目标：
 * 1. 建立按浏览器窗口分组的树状结构显示
 * 2. 实现窗口分组的视觉区分和标识显示
 * 3. 创建窗口创建和关闭事件的实时更新处理
 * 4. 添加窗口分组展开折叠和管理功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import { useUIStore } from '@/stores/ui';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
const mockWindowsGet = vi.fn();
const mockWindowsGetAll = vi.fn();
const mockWindowsCreate = vi.fn();
const mockWindowsRemove = vi.fn();
const mockWindowsUpdate = vi.fn();

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
    get: mockWindowsGet,
    getAll: mockWindowsGetAll,
    create: mockWindowsCreate,
    remove: mockWindowsRemove,
    update: mockWindowsUpdate,
  },
} as any;

describe('多窗口标签页分组功能', () => {
  let tabsStore: ReturnType<typeof useTabsStore>;
  let uiStore: ReturnType<typeof useUIStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    tabsStore = useTabsStore();
    uiStore = useUIStore();
    vi.clearAllMocks();
  });

  describe('窗口数据结构', () => {
    it('应该有windows状态', () => {
      expect(tabsStore.windows).toBeDefined();
      expect(Array.isArray(tabsStore.windows)).toBe(true);
    });

    it('应该有windowGroups状态', () => {
      expect(tabsStore.windowGroups).toBeDefined();
      expect(typeof tabsStore.windowGroups).toBe('object');
    });

    it('应该有getWindowById方法', () => {
      expect(typeof tabsStore.getWindowById).toBe('function');
    });

    it('添加标签页时应该自动更新windowGroups', () => {
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
        windowId: 2,
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

      expect(Object.keys(tabsStore.windowGroups)).toHaveLength(2);
      expect(tabsStore.windowGroups[1]).toBeDefined();
      expect(tabsStore.windowGroups[2]).toBeDefined();
      expect(tabsStore.windowGroups[1].length).toBe(1);
      expect(tabsStore.windowGroups[2].length).toBe(1);
    });
  });

  describe('窗口信息管理', () => {
    it('应该有addWindow方法', () => {
      expect(typeof tabsStore.addWindow).toBe('function');
    });

    it('应该有removeWindow方法', () => {
      expect(typeof tabsStore.removeWindow).toBe('function');
    });

    it('应该有updateWindow方法', () => {
      expect(typeof tabsStore.updateWindow).toBe('function');
    });

    it('addWindow应该添加窗口信息', () => {
      tabsStore.addWindow({
        id: 1,
        focused: true,
        type: 'normal',
        incognito: false,
        alwaysOnTop: false,
      });

      const window = tabsStore.getWindowById(1);
      expect(window).toBeDefined();
      expect(window?.id).toBe(1);
      expect(window?.focused).toBe(true);
    });

    it('removeWindow应该移除窗口信息', () => {
      tabsStore.addWindow({
        id: 1,
        focused: true,
        type: 'normal',
        incognito: false,
        alwaysOnTop: false,
      });

      expect(tabsStore.getWindowById(1)).toBeDefined();

      tabsStore.removeWindow(1);

      expect(tabsStore.getWindowById(1)).toBeUndefined();
    });

    it('updateWindow应该更新窗口信息', () => {
      tabsStore.addWindow({
        id: 1,
        focused: true,
        type: 'normal',
        incognito: false,
        alwaysOnTop: false,
      });

      tabsStore.updateWindow(1, { focused: false });

      const window = tabsStore.getWindowById(1);
      expect(window?.focused).toBe(false);
    });
  });

  describe('窗口展开折叠', () => {
    it('uiStore应该有collapsedWindows状态', () => {
      expect(uiStore.collapsedWindows).toBeDefined();
    });

    it('应该有toggleWindowCollapse方法', () => {
      expect(typeof uiStore.toggleWindowCollapse).toBe('function');
    });

    it('应该有isWindowCollapsed方法', () => {
      expect(typeof uiStore.isWindowCollapsed).toBe('function');
    });

    it('toggleWindowCollapse应该切换窗口折叠状态', () => {
      expect(uiStore.isWindowCollapsed(1)).toBe(false);

      uiStore.toggleWindowCollapse(1);
      expect(uiStore.isWindowCollapsed(1)).toBe(true);

      uiStore.toggleWindowCollapse(1);
      expect(uiStore.isWindowCollapsed(1)).toBe(false);
    });

    it('应该有collapseAllWindows方法', () => {
      expect(typeof uiStore.collapseAllWindows).toBe('function');
    });

    it('应该有expandAllWindows方法', () => {
      expect(typeof uiStore.expandAllWindows).toBe('function');
    });

    it('collapseAllWindows应该折叠所有窗口', () => {
      // 添加一些窗口
      tabsStore.addWindow({ id: 1, focused: true, type: 'normal', incognito: false, alwaysOnTop: false });
      tabsStore.addWindow({ id: 2, focused: false, type: 'normal', incognito: false, alwaysOnTop: false });

      uiStore.collapseAllWindows([1, 2]);

      expect(uiStore.isWindowCollapsed(1)).toBe(true);
      expect(uiStore.isWindowCollapsed(2)).toBe(true);
    });

    it('expandAllWindows应该展开所有窗口', () => {
      uiStore.toggleWindowCollapse(1);
      uiStore.toggleWindowCollapse(2);

      expect(uiStore.isWindowCollapsed(1)).toBe(true);
      expect(uiStore.isWindowCollapsed(2)).toBe(true);

      uiStore.expandAllWindows();

      expect(uiStore.isWindowCollapsed(1)).toBe(false);
      expect(uiStore.isWindowCollapsed(2)).toBe(false);
    });
  });

  describe('窗口按窗口ID获取标签页', () => {
    it('应该有getTabsByWindowId方法', () => {
      expect(typeof tabsStore.getTabsByWindowId).toBe('function');
    });

    it('getTabsByWindowId应该返回指定窗口的所有标签页', () => {
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

      const tabs = tabsStore.getTabsByWindowId(1);
      expect(tabs.length).toBe(2);
      expect(tabs[0].windowId).toBe(1);
      expect(tabs[1].windowId).toBe(1);
    });

    it('getTabsByWindowId应该返回空数组如果窗口不存在', () => {
      const tabs = tabsStore.getTabsByWindowId(999);
      expect(tabs).toEqual([]);
    });
  });

  describe('窗口事件同步', () => {
    it('应该有syncWindows方法', () => {
      expect(typeof tabsStore.syncWindows).toBe('function');
    });

    it('syncWindows应该调用Chrome API获取所有窗口', async () => {
      mockWindowsGetAll.mockResolvedValueOnce([
        { id: 1, focused: true, type: 'normal', incognito: false, alwaysOnTop: false },
        { id: 2, focused: false, type: 'normal', incognito: false, alwaysOnTop: false },
      ]);

      await tabsStore.syncWindows();

      expect(mockWindowsGetAll).toHaveBeenCalled();
      expect(tabsStore.windows.length).toBe(2);
    });

    it('应该有handleWindowCreated方法', () => {
      expect(typeof tabsStore.handleWindowCreated).toBe('function');
    });

    it('handleWindowCreated应该添加新窗口', () => {
      tabsStore.handleWindowCreated({
        id: 3,
        focused: true,
        type: 'normal',
        incognito: false,
        alwaysOnTop: false,
      });

      expect(tabsStore.getWindowById(3)).toBeDefined();
    });

    it('应该有handleWindowRemoved方法', () => {
      expect(typeof tabsStore.handleWindowRemoved).toBe('function');
    });

    it('handleWindowRemoved应该移除窗口和其所有标签页', () => {
      // 添加窗口和标签页
      tabsStore.addWindow({
        id: 1,
        focused: true,
        type: 'normal',
        incognito: false,
        alwaysOnTop: false,
      });

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

      expect(tabsStore.getWindowById(1)).toBeDefined();
      expect(tabsStore.windowGroups[1]).toBeDefined();

      tabsStore.handleWindowRemoved(1);

      expect(tabsStore.getWindowById(1)).toBeUndefined();
      expect(tabsStore.windowGroups[1]).toBeUndefined();
    });

    it('应该有handleWindowFocusChanged方法', () => {
      expect(typeof tabsStore.handleWindowFocusChanged).toBe('function');
    });

    it('handleWindowFocusChanged应该更新窗口焦点状态', () => {
      tabsStore.addWindow({
        id: 1,
        focused: false,
        type: 'normal',
        incognito: false,
        alwaysOnTop: false,
      });

      tabsStore.addWindow({
        id: 2,
        focused: true,
        type: 'normal',
        incognito: false,
        alwaysOnTop: false,
      });

      tabsStore.handleWindowFocusChanged(1);

      const window1 = tabsStore.getWindowById(1);
      const window2 = tabsStore.getWindowById(2);

      expect(window1?.focused).toBe(true);
      expect(window2?.focused).toBe(false);
    });
  });

  describe('窗口计数', () => {
    it('应该有windowCount getter', () => {
      expect(tabsStore.windowCount).toBeDefined();
    });

    it('windowCount应该返回窗口数量', () => {
      expect(tabsStore.windowCount).toBe(0);

      tabsStore.addWindow({ id: 1, focused: true, type: 'normal', incognito: false, alwaysOnTop: false });
      tabsStore.addWindow({ id: 2, focused: false, type: 'normal', incognito: false, alwaysOnTop: false });

      expect(tabsStore.windowCount).toBe(2);
    });
  });
});
