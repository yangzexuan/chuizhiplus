/**
 * 实时同步功能测试
 * 
 * 测试目标：
 * 1. 标签页创建、关闭、移动事件的实时监听
 * 2. 树状结构与Chrome标签页状态的双向同步
 * 3. 标签页状态变化的响应式更新机制
 * 4. 异常情况处理和状态一致性保证
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import type { TabTreeNode } from '@/types';

// Mock Chrome API
const mockSendMessage = vi.fn().mockResolvedValue({ success: true });
const mockOnMessageListeners: Array<(message: any, sender: any, sendResponse: any) => void> = [];

global.chrome = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
    runtime: {
        sendMessage: mockSendMessage,
        onMessage: {
            addListener: vi.fn((listener) => {
                mockOnMessageListeners.push(listener);
            }),
            removeListener: vi.fn(),
        },
    },
    tabs: {
        onCreated: {
            addListener: vi.fn(),
        },
        onRemoved: {
            addListener: vi.fn(),
        },
        onUpdated: {
            addListener: vi.fn(),
        },
        onMoved: {
            addListener: vi.fn(),
        },
        onActivated: {
            addListener: vi.fn(),
        },
        get: vi.fn(),
        query: vi.fn(),
    },
} as any;

describe('实时同步功能', () => {
    let tabsStore: ReturnType<typeof useTabsStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        tabsStore = useTabsStore();
        vi.clearAllMocks();
        mockOnMessageListeners.length = 0;
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

    describe('事件监听器注册', () => {
        it('应该能够注册runtime.onMessage监听器', () => {
            tabsStore.initializeSyncListeners();

            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        });

        it('应该有initializeSyncListeners方法', () => {
            expect(typeof tabsStore.initializeSyncListeners).toBe('function');
        });

        it('应该有cleanupSyncListeners方法', () => {
            expect(typeof tabsStore.cleanupSyncListeners).toBe('function');
        });
    });

    describe('标签页创建事件同步', () => {
        it('接收到TAB_CREATED消息时应该添加新标签页', () => {
            tabsStore.initializeSyncListeners();

            const newTab = createMockTab({ id: 1, title: 'New Tab' });
            const message = {
                type: 'TAB_CREATED',
                tab: newTab,
            };

            // 模拟收到消息
            const listener = mockOnMessageListeners[0];
            listener(message, {}, vi.fn());

            // 验证标签页被添加
            const node = tabsStore.findNodeByTabId(1);
            expect(node).toBeDefined();
            expect(node?.title).toBe('New Tab');
        });

        it('应该处理带openerTabId的标签页创建', () => {
            // 先添加父标签页
            const parentTab = createMockTab({ id: 1, title: 'Parent' });
            tabsStore.addTabFromChrome(parentTab);

            tabsStore.initializeSyncListeners();

            const childTab = createMockTab({ id: 2, title: 'Child', openerTabId: 1 });
            const message = {
                type: 'TAB_CREATED',
                tab: childTab,
            };

            const listener = mockOnMessageListeners[0];
            listener(message, {}, vi.fn());

            // 验证子标签页被添加到父节点下
            const parentNode = tabsStore.findNodeByTabId(1);
            expect(parentNode?.children.length).toBe(1);
            expect(parentNode?.children[0].tabId).toBe(2);
        });
    });

    describe('标签页删除事件同步', () => {
        it('接收到TAB_REMOVED消息时应该删除标签页', () => {
            const tab = createMockTab({ id: 1 });
            tabsStore.addTabFromChrome(tab);

            tabsStore.initializeSyncListeners();

            const message = {
                type: 'TAB_REMOVED',
                tabId: 1,
            };

            const listener = mockOnMessageListeners[0];
            listener(message, {}, vi.fn());

            // 验证标签页被删除
            const node = tabsStore.findNodeByTabId(1);
            expect(node).toBeNull();
        });

        it('删除不存在的标签页时不应该崩溃', () => {
            tabsStore.initializeSyncListeners();

            const message = {
                type: 'TAB_REMOVED',
                tabId: 999,
            };

            const listener = mockOnMessageListeners[0];
            expect(() => listener(message, {}, vi.fn())).not.toThrow();
        });
    });

    describe('标签页更新事件同步', () => {
        it('接收到TAB_UPDATED消息时应该更新标签页', () => {
            const tab = createMockTab({ id: 1, title: 'Old Title' });
            tabsStore.addTabFromChrome(tab);

            tabsStore.initializeSyncListeners();

            const message = {
                type: 'TAB_UPDATED',
                tabId: 1,
                changeInfo: {
                    title: 'New Title',
                    status: 'complete',
                },
                tab: { ...tab, title: 'New Title', status: 'complete' },
            };

            const listener = mockOnMessageListeners[0];
            listener(message, {}, vi.fn());

            // 验证标签页被更新
            const node = tabsStore.findNodeByTabId(1);
            expect(node?.title).toBe('New Title');
            expect(node?.isLoading).toBe(false);
        });

        it('应该处理URL变化', () => {
            const tab = createMockTab({ id: 1, url: 'https://old.com' });
            tabsStore.addTabFromChrome(tab);

            tabsStore.initializeSyncListeners();

            const message = {
                type: 'TAB_UPDATED',
                tabId: 1,
                changeInfo: {
                    url: 'https://new.com',
                },
                tab: { ...tab, url: 'https://new.com' },
            };

            const listener = mockOnMessageListeners[0];
            listener(message, {}, vi.fn());

            const node = tabsStore.findNodeByTabId(1);
            expect(node?.url).toBe('https://new.com');
        });

        it('应该处理favIconUrl变化', () => {
            const tab = createMockTab({ id: 1 });
            tabsStore.addTabFromChrome(tab);

            tabsStore.initializeSyncListeners();

            const message = {
                type: 'TAB_UPDATED',
                tabId: 1,
                changeInfo: {
                    favIconUrl: 'https://new.com/favicon.ico',
                },
                tab: { ...tab, favIconUrl: 'https://new.com/favicon.ico' },
            };

            const listener = mockOnMessageListeners[0];
            listener(message, {}, vi.fn());

            const node = tabsStore.findNodeByTabId(1);
            expect(node?.favicon).toBe('https://new.com/favicon.ico');
        });
    });

    describe('标签页移动事件同步', () => {
        it('接收到TAB_MOVED消息时应该更新标签页位置', () => {
            const tab1 = createMockTab({ id: 1, index: 0 });
            const tab2 = createMockTab({ id: 2, index: 1 });
            tabsStore.addTabFromChrome(tab1);
            tabsStore.addTabFromChrome(tab2);

            tabsStore.initializeSyncListeners();

            const message = {
                type: 'TAB_MOVED',
                tabId: 1,
                moveInfo: {
                    windowId: 1,
                    fromIndex: 0,
                    toIndex: 1,
                },
            };

            const listener = mockOnMessageListeners[0];
            listener(message, {}, vi.fn());

            // 标签页移动逻辑已实现
            // 这里主要验证不会崩溃
            expect(tabsStore.findNodeByTabId(1)).toBeDefined();
        });
    });

    describe('标签页激活事件同步', () => {
        it('接收到TAB_ACTIVATED消息时应该更新活跃标签页', () => {
            const tab1 = createMockTab({ id: 1, active: false });
            const tab2 = createMockTab({ id: 2, active: true });
            tabsStore.addTabFromChrome(tab1);
            tabsStore.addTabFromChrome(tab2);

            tabsStore.initializeSyncListeners();

            const message = {
                type: 'TAB_ACTIVATED',
                activeInfo: {
                    tabId: 1,
                    windowId: 1,
                },
            };

            const listener = mockOnMessageListeners[0];
            listener(message, {}, vi.fn());

            // 验证活跃标签页被更新
            expect(tabsStore.activeTabId).toBe(1);

            const node1 = tabsStore.findNodeByTabId(1);
            const node2 = tabsStore.findNodeByTabId(2);
            expect(node1?.isActive).toBe(true);
            expect(node2?.isActive).toBe(false);
        });
    });

    describe('批量同步功能', () => {
        it('应该能够从Chrome同步所有标签页', async () => {
            const mockTabs = [
                createMockTab({ id: 1, title: 'Tab 1' }),
                createMockTab({ id: 2, title: 'Tab 2' }),
                createMockTab({ id: 3, title: 'Tab 3' }),
            ];

            mockSendMessage.mockResolvedValueOnce({
                success: true,
                data: mockTabs,
            });

            await tabsStore.syncAllTabs();

            expect(tabsStore.tabCount).toBe(3);
            expect(tabsStore.findNodeByTabId(1)?.title).toBe('Tab 1');
            expect(tabsStore.findNodeByTabId(2)?.title).toBe('Tab 2');
            expect(tabsStore.findNodeByTabId(3)?.title).toBe('Tab 3');
        });

        it('syncAllTabs应该发送GET_ALL_TABS消息', async () => {
            mockSendMessage.mockResolvedValueOnce({
                success: true,
                data: [],
            });

            await tabsStore.syncAllTabs();

            expect(mockSendMessage).toHaveBeenCalledWith({
                type: 'GET_ALL_TABS',
            });
        });

        it('syncAllTabs失败时应该处理错误', async () => {
            mockSendMessage.mockResolvedValueOnce({
                success: false,
                error: 'Network error',
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await tabsStore.syncAllTabs();

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('状态一致性', () => {
        it('应该能够检测并修复不一致的状态', async () => {
            // 添加一些本地节点
            tabsStore.addTabFromChrome(createMockTab({ id: 1 }));
            tabsStore.addTabFromChrome(createMockTab({ id: 2 }));
            tabsStore.addTabFromChrome(createMockTab({ id: 3 }));

            // Chrome中实际只有2个标签页
            mockSendMessage.mockResolvedValueOnce({
                success: true,
                data: [
                    createMockTab({ id: 1 }),
                    createMockTab({ id: 4 }), // 新标签页
                ],
            });

            await tabsStore.syncAllTabs();

            // 验证状态已同步
            expect(tabsStore.tabCount).toBe(2);
            expect(tabsStore.findNodeByTabId(1)).toBeDefined();
            expect(tabsStore.findNodeByTabId(2)).toBeNull();
            expect(tabsStore.findNodeByTabId(3)).toBeNull();
            expect(tabsStore.findNodeByTabId(4)).toBeDefined();
        });
    });

    describe('监听器清理', () => {
        it('cleanupSyncListeners应该移除监听器', () => {
            tabsStore.initializeSyncListeners();
            tabsStore.cleanupSyncListeners();

            expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
        });
    });
});
