/**
 * 核心功能集成测试
 * 
 * 测试目标：
 * 1. 集成所有组件功能建立完整的标签页管理工作流
 * 2. 验证树状结构、拖拽、搜索等功能的协同工作
 * 3. 测试Chrome API集成和扩展生命周期管理
 * 4. 优化性能和内存使用确保大量标签页的流畅运行
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import { useUIStore } from '@/stores/ui';
import { useConfigStore } from '@/stores/config';

// Mock Chrome API
global.chrome = {
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    move: vi.fn(),
    remove: vi.fn(),
    onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
    onMoved: { addListener: vi.fn(), removeListener: vi.fn() },
    onActivated: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  windows: {
    query: vi.fn(),
    get: vi.fn(),
    getCurrent: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    onFocusChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    sendMessage: vi.fn(),
  },
} as any;

describe('核心功能集成测试', () => {
  let tabsStore: ReturnType<typeof useTabsStore>;
  let uiStore: ReturnType<typeof useUIStore>;
  let configStore: ReturnType<typeof useConfigStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    tabsStore = useTabsStore();
    uiStore = useUIStore();
    configStore = useConfigStore();
    vi.clearAllMocks();
  });

  describe('完整标签页管理工作流', () => {
    it('应该能够创建标签页树结构', () => {
      // 添加根标签页
      const root = tabsStore.addTab({
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        title: 'Root Tab',
        url: 'https://example.com',
        parentId: null,
      });

      // 添加子标签页
      const child = tabsStore.addTab({
        id: 'tab-2',
        tabId: 2,
        windowId: 1,
        title: 'Child Tab',
        url: 'https://example.com/child',
        parentId: 'tab-1',
      });

      expect(tabsStore.tabTree.length).toBe(1);
      expect(tabsStore.tabTree[0].children.length).toBe(1);
      expect(tabsStore.tabTree[0].children[0].id).toBe('tab-2');
    });

    it('应该能够搜索并定位到标签页', () => {
      // 创建多个标签页
      tabsStore.addTab({
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        title: 'TypeScript Documentation',
        url: 'https://typescriptlang.org',
        parentId: null,
      });

      tabsStore.addTab({
        id: 'tab-2',
        tabId: 2,
        windowId: 1,
        title: 'Vue.js Guide',
        url: 'https://vuejs.org',
        parentId: null,
      });

      // 搜索
      uiStore.setSearchQuery('TypeScript');
      tabsStore.searchTabs('TypeScript');

      // 验证搜索结果
      expect(tabsStore.searchResults.length).toBe(1);
      expect(tabsStore.searchResults[0].nodeId).toBe('tab-1');

      // 定位到搜索结果
      tabsStore.scrollToNode('tab-1');
      const node = tabsStore.findNodeById('tab-1');
      expect(node?.isHighlighted).toBe(true);
    });

    it('应该能够折叠展开节点并保持状态', () => {
      // 创建父子标签页
      tabsStore.addTab({
        id: 'parent',
        tabId: 1,
        windowId: 1,
        title: 'Parent',
        url: 'https://example.com',
        parentId: null,
      });

      tabsStore.addTab({
        id: 'child',
        tabId: 2,
        windowId: 1,
        title: 'Child',
        url: 'https://example.com/child',
        parentId: 'parent',
      });

      // 折叠父节点
      uiStore.collapseNode('parent');
      expect(uiStore.isNodeCollapsed('parent')).toBe(true);

      // 验证折叠状态被记录
      const collapsedNodes = uiStore.collapsedNodes;
      expect(collapsedNodes.has('parent')).toBe(true);

      // 展开父节点
      uiStore.expandNode('parent');
      expect(uiStore.isNodeCollapsed('parent')).toBe(false);
      expect(collapsedNodes.has('parent')).toBe(false);
    });

    it('应该能够拖拽重组标签页树结构', () => {
      // 创建初始结构
      tabsStore.addTab({
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        title: 'Tab 1',
        url: 'https://example.com/1',
        parentId: null,
      });

      tabsStore.addTab({
        id: 'tab-2',
        tabId: 2,
        windowId: 1,
        title: 'Tab 2',
        url: 'https://example.com/2',
        parentId: null,
      });

      // 验证初始状态：两个根节点
      expect(tabsStore.rootNodes.length).toBe(2);

      // 开始拖拽
      tabsStore.startDrag('tab-2');
      
      // 验证拖拽快照已创建
      expect(tabsStore.dragSnapshot).not.toBeNull();

      // 验证可以撤销拖拽
      tabsStore.undoDrag();
      expect(tabsStore.dragSnapshot).toBeNull();

      // 验证结构未改变
      expect(tabsStore.rootNodes.length).toBe(2);
    });

    it('应该能够智能关闭标签页并撤销', async () => {
      // Mock Chrome API
      vi.mocked(chrome.tabs.remove).mockResolvedValue(undefined);
      vi.mocked(chrome.tabs.create).mockResolvedValue({
        id: 1,
        index: 0,
        pinned: false,
        highlighted: true,
        windowId: 1,
        active: true,
        incognito: false,
        selected: true,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
      } as chrome.tabs.Tab);

      // 创建父子结构
      tabsStore.addTab({
        id: 'parent',
        tabId: 1,
        windowId: 1,
        title: 'Parent',
        url: 'https://example.com',
        parentId: null,
      });

      tabsStore.addTab({
        id: 'child-1',
        tabId: 2,
        windowId: 1,
        title: 'Child 1',
        url: 'https://example.com/1',
        parentId: 'parent',
      });

      tabsStore.addTab({
        id: 'child-2',
        tabId: 3,
        windowId: 1,
        title: 'Child 2',
        url: 'https://example.com/2',
        parentId: 'parent',
      });

      // 验证关闭前的状态
      expect(tabsStore.tabCount).toBe(3);

      // 关闭父节点（包含子节点）
      await tabsStore.closeTabWithChildren('parent');

      // 验证所有标签页已关闭
      expect(tabsStore.tabTree.length).toBe(0);

      // 验证可以撤销
      expect(tabsStore.canUndoClose).toBe(true);
      expect(tabsStore.closeSnapshot).not.toBeNull();
    });
  });

  describe('多功能协同工作', () => {
    it('搜索应该与折叠状态协同工作', () => {
      // 创建折叠的父子结构
      tabsStore.addTab({
        id: 'parent',
        tabId: 1,
        windowId: 1,
        title: 'Parent',
        url: 'https://example.com',
        parentId: null,
      });

      tabsStore.addTab({
        id: 'child',
        tabId: 2,
        windowId: 1,
        title: 'Important Child',
        url: 'https://example.com/important',
        parentId: 'parent',
      });

      // 折叠父节点
      uiStore.collapseNode('parent');
      expect(uiStore.isNodeCollapsed('parent')).toBe(true);

      // 搜索子节点
      tabsStore.searchTabs('Important');

      // 自动展开匹配节点的父节点
      tabsStore.expandMatchedNodeParents();

      // 验证父节点已展开
      expect(uiStore.isNodeCollapsed('parent')).toBe(false);
    });

    it('过滤应该与搜索协同工作', () => {
      // 创建多个标签页
      tabsStore.addTab({
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        title: 'Active Tab',
        url: 'https://example.com/1',
        isActive: true,
        parentId: null,
      });

      tabsStore.addTab({
        id: 'tab-2',
        tabId: 2,
        windowId: 1,
        title: 'Inactive Tab',
        url: 'https://example.com/2',
        isActive: false,
        parentId: null,
      });

      // 应用搜索和过滤
      uiStore.setSearchQuery('Tab');
      tabsStore.searchTabs('Tab');
      uiStore.addFilter('active');

      // 验证只有符合所有条件的标签页被过滤
      const filtered = tabsStore.filteredTabs;
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('tab-1');
    });

    it('窗口管理应该与标签页树协同工作', () => {
      // 添加窗口
      tabsStore.addWindow({
        id: 1,
        focused: true,
        type: 'normal',
        incognito: false,
      });

      tabsStore.addWindow({
        id: 2,
        focused: false,
        type: 'normal',
        incognito: false,
      });

      // 在不同窗口添加标签页
      tabsStore.addTab({
        id: 'tab-1',
        tabId: 1,
        windowId: 1,
        title: 'Window 1 Tab',
        url: 'https://example.com/1',
        parentId: null,
      });

      tabsStore.addTab({
        id: 'tab-2',
        tabId: 2,
        windowId: 2,
        title: 'Window 2 Tab',
        url: 'https://example.com/2',
        parentId: null,
      });

      // 验证窗口和标签页数量
      expect(tabsStore.windowCount).toBe(2);
      expect(tabsStore.tabCount).toBe(2);

      // 验证按窗口分组
      const window1 = tabsStore.getWindowById(1);
      const window2 = tabsStore.getWindowById(2);

      expect(window1).toBeDefined();
      expect(window2).toBeDefined();
      expect(window1?.id).toBe(1);
      expect(window2?.id).toBe(2);
    });

    it('配置更改应该影响标签页管理行为', async () => {
      // 创建标签页
      tabsStore.addTab({
        id: 'parent',
        tabId: 1,
        windowId: 1,
        title: 'Parent',
        url: 'https://example.com',
        parentId: null,
      });

      for (let i = 2; i <= 5; i++) {
        tabsStore.addTab({
          id: `child-${i}`,
          tabId: i,
          windowId: 1,
          title: `Child ${i}`,
          url: `https://example.com/${i}`,
          parentId: 'parent',
        });
      }

      // 验证关闭数量计算
      const count = tabsStore.getCloseCount('parent');
      expect(count).toBe(5); // 1 parent + 4 children

      // 测试不同阈值下的行为
      await configStore.setConfigValue('closeConfirmThreshold', 3);
      
      // 验证配置已更新
      expect(configStore.config.closeConfirmThreshold).toBe(3);
      
      // 验证需要确认（因为关闭5个标签页超过阈值3）
      const needsConfirm = tabsStore.needsConfirmation('parent');
      expect(needsConfirm).toBe(true);
    });
  });

  describe('性能和内存优化', () => {
    it('应该能够处理大量标签页', () => {
      const startTime = performance.now();

      // 创建大量标签页（100个）
      for (let i = 1; i <= 100; i++) {
        tabsStore.addTab({
          id: `tab-${i}`,
          tabId: i,
          windowId: 1,
          title: `Tab ${i}`,
          url: `https://example.com/${i}`,
          parentId: i > 1 && i % 3 === 0 ? `tab-${i - 1}` : null,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证操作在合理时间内完成（< 1秒）
      expect(duration).toBeLessThan(1000);

      // 验证数据正确
      expect(tabsStore.tabCount).toBe(100);
    });

    it('搜索大量标签页应该快速响应', () => {
      // 创建大量标签页
      for (let i = 1; i <= 200; i++) {
        tabsStore.addTab({
          id: `tab-${i}`,
          tabId: i,
          windowId: 1,
          title: i % 10 === 0 ? `Special Tab ${i}` : `Regular Tab ${i}`,
          url: `https://example.com/${i}`,
          parentId: null,
        });
      }

      const startTime = performance.now();

      // 执行搜索
      tabsStore.searchTabs('Special');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证搜索在合理时间内完成（< 100ms）
      expect(duration).toBeLessThan(100);

      // 验证搜索结果正确
      expect(tabsStore.searchResults.length).toBe(20);
    });

    it('flattenedTabs 应该高效计算', () => {
      // 创建深层嵌套结构
      let parentId: string | null = null;
      for (let i = 1; i <= 50; i++) {
        const id = `tab-${i}`;
        tabsStore.addTab({
          id,
          tabId: i,
          windowId: 1,
          title: `Tab ${i}`,
          url: `https://example.com/${i}`,
          parentId,
        });
        parentId = id;
      }

      const startTime = performance.now();

      // 访问 flattenedTabs 多次
      for (let i = 0; i < 10; i++) {
        const flattened = tabsStore.flattenedTabs;
        expect(flattened.length).toBe(50);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证计算高效（computed 应该有缓存）
      expect(duration).toBeLessThan(50);
    });
  });

  describe('扩展生命周期管理', () => {
    it('应该有初始化和清理同步监听器的方法', () => {
      // 验证方法存在
      expect(typeof tabsStore.initializeSyncListeners).toBe('function');
      expect(typeof tabsStore.cleanupSyncListeners).toBe('function');
    });

    it('应该有同步所有标签页的方法', () => {
      expect(typeof tabsStore.syncAllTabs).toBe('function');
      expect(typeof tabsStore.syncWindows).toBe('function');
    });

    it('应该能够处理标签页创建事件', () => {
      const initialCount = tabsStore.tabCount;

      // 使用 addTabFromChrome 模拟标签页创建
      tabsStore.addTabFromChrome({
        id: 100,
        windowId: 1,
        title: 'New Tab',
        url: 'https://example.com/new',
        active: true,
        index: 0,
        pinned: false,
        highlighted: true,
        incognito: false,
      } as chrome.tabs.Tab);

      expect(tabsStore.tabCount).toBe(initialCount + 1);
    });
  });
});
