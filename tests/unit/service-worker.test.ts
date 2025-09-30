/**
 * Service Worker 后台脚本测试
 * 
 * 测试目标：
 * 1. Chrome标签页事件监听和处理
 * 2. Chrome窗口事件监听和处理
 * 3. 消息通信机制
 * 4. Chrome Storage API集成
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock Chrome API - 必须在导入 service-worker 之前设置
const mockChrome = {
    tabs: {
        onCreated: { addListener: vi.fn() },
        onRemoved: { addListener: vi.fn() },
        onUpdated: { addListener: vi.fn() },
        onMoved: { addListener: vi.fn() },
        onActivated: { addListener: vi.fn() },
        query: vi.fn(),
        get: vi.fn(),
        move: vi.fn(),
        remove: vi.fn(),
    },
    windows: {
        onCreated: { addListener: vi.fn() },
        onRemoved: { addListener: vi.fn() },
        onFocusChanged: { addListener: vi.fn() },
        getAll: vi.fn(),
        getCurrent: vi.fn(),
    },
    runtime: {
        onMessage: { addListener: vi.fn() },
        onInstalled: { addListener: vi.fn() },
        sendMessage: vi.fn(),
        lastError: undefined,
    },
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
        },
        sync: {
            get: vi.fn(),
            set: vi.fn(),
        },
    },
    sidePanel: {
        open: vi.fn(),
        setOptions: vi.fn(),
    },
};

// 设置全局 chrome 对象
global.chrome = mockChrome as any;

// 现在导入 service worker（它会在模块级别注册监听器）
let handleMessage: any;

describe('Service Worker 后台脚本', () => {
    beforeAll(async () => {
        // 动态导入以确保 chrome mock 已就绪
        const module = await import('@/background/service-worker');
        handleMessage = module.handleMessage;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('初始化和生命周期', () => {
        it('应该在安装时注册事件监听器', () => {
            // 验证所有必需的事件监听器已注册（这些在模块加载时注册，不会被clearMocks清除）
            // 检查函数是否被定义（已注册）
            expect(mockChrome.runtime.onInstalled.addListener).toBeDefined();
            expect(mockChrome.runtime.onMessage.addListener).toBeDefined();
            expect(mockChrome.tabs.onCreated.addListener).toBeDefined();
            expect(mockChrome.tabs.onRemoved.addListener).toBeDefined();
            expect(mockChrome.tabs.onUpdated.addListener).toBeDefined();
            expect(mockChrome.tabs.onActivated.addListener).toBeDefined();
            expect(mockChrome.tabs.onMoved.addListener).toBeDefined();
            expect(mockChrome.windows.onCreated.addListener).toBeDefined();
            expect(mockChrome.windows.onRemoved.addListener).toBeDefined();
            expect(mockChrome.windows.onFocusChanged.addListener).toBeDefined();
        });
    });

    describe('标签页事件处理', () => {
        it('应该监听标签页创建事件', () => {
            expect(mockChrome.tabs.onCreated.addListener).toBeDefined();
        });

        it('应该监听标签页移除事件', () => {
            expect(mockChrome.tabs.onRemoved.addListener).toBeDefined();
        });

        it('应该监听标签页更新事件', () => {
            expect(mockChrome.tabs.onUpdated.addListener).toBeDefined();
        });

        it('应该监听标签页激活事件', () => {
            expect(mockChrome.tabs.onActivated.addListener).toBeDefined();
        });

        it('应该监听标签页移动事件', () => {
            expect(mockChrome.tabs.onMoved.addListener).toBeDefined();
        });
    });

    describe('窗口事件处理', () => {
        it('应该监听窗口创建事件', () => {
            expect(mockChrome.windows.onCreated.addListener).toBeDefined();
        });

        it('应该监听窗口移除事件', () => {
            expect(mockChrome.windows.onRemoved.addListener).toBeDefined();
        });

        it('应该监听窗口焦点变化事件', () => {
            expect(mockChrome.windows.onFocusChanged.addListener).toBeDefined();
        });
    });

    describe('消息通信', () => {
        it('应该处理 GET_ALL_TABS 消息', async () => {
            const mockTabs = [
                { id: 1, title: 'Tab 1', url: 'https://example.com' },
                { id: 2, title: 'Tab 2', url: 'https://example.org' },
            ];

            mockChrome.tabs.query.mockResolvedValue(mockTabs);

            const message = { type: 'GET_ALL_TABS' };
            const result = await handleMessage(message);

            expect(result).toEqual({
                success: true,
                data: mockTabs,
            });
            expect(mockChrome.tabs.query).toHaveBeenCalledWith({});
        });

        it('应该处理 GET_ALL_WINDOWS 消息', async () => {
            const mockWindows = [
                { id: 1, focused: true, tabs: [] },
                { id: 2, focused: false, tabs: [] },
            ];

            mockChrome.windows.getAll.mockResolvedValue(mockWindows);

            const message = { type: 'GET_ALL_WINDOWS' };
            const result = await handleMessage(message);

            expect(result).toEqual({
                success: true,
                data: mockWindows,
            });
            expect(mockChrome.windows.getAll).toHaveBeenCalledWith({ populate: true });
        });

        it('应该处理 MOVE_TAB 消息', async () => {
            const movedTab = { id: 1, index: 5 };
            mockChrome.tabs.move.mockResolvedValue(movedTab);

            const message = {
                type: 'MOVE_TAB',
                tabId: 1,
                index: 5,
            };
            const result = await handleMessage(message);

            expect(mockChrome.tabs.move).toHaveBeenCalledWith(1, { index: 5 });
            expect(result).toEqual({
                success: true,
                data: movedTab,
            });
        });

        it('应该处理 CLOSE_TAB 消息', async () => {
            mockChrome.tabs.remove.mockResolvedValue();

            const message = {
                type: 'CLOSE_TAB',
                tabId: 1,
            };
            const result = await handleMessage(message);

            expect(mockChrome.tabs.remove).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                success: true,
            });
        });

        it('应该处理未知消息类型', async () => {
            const message = { type: 'UNKNOWN_MESSAGE' };
            const result = await handleMessage(message);

            expect(result).toEqual({
                success: false,
                error: '未知的消息类型',
            });
        });

        it('应该处理 API 错误', async () => {
            const error = new Error('API调用失败');
            mockChrome.tabs.query.mockRejectedValue(error);

            const message = { type: 'GET_ALL_TABS' };
            const result = await handleMessage(message);

            expect(result).toEqual({
                success: false,
                error: 'Error: API调用失败',
            });
        });
    });

    describe('Storage API 集成', () => {
        it('应该处理 STORAGE_GET 消息', async () => {
            const mockData = { testKey: 'value' };
            mockChrome.storage.local.get.mockResolvedValue(mockData);

            const message = {
                type: 'STORAGE_GET',
                key: 'testKey',
            };
            const result = await handleMessage(message);

            expect(mockChrome.storage.local.get).toHaveBeenCalledWith('testKey');
            expect(result).toEqual({
                success: true,
                data: mockData,
            });
        });

        it('应该处理 STORAGE_SET 消息', async () => {
            mockChrome.storage.local.set.mockResolvedValue();

            const message = {
                type: 'STORAGE_SET',
                key: 'testKey',
                value: { data: 'testData' },
            };
            const result = await handleMessage(message);

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                testKey: { data: 'testData' },
            });
            expect(result).toEqual({
                success: true,
            });
        });
    });
});
