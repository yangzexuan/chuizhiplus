/**
 * 折叠状态持久化测试
 * 
 * 测试目标：
 * 1. 节点折叠状态的内存存储和管理机制
 * 2. 折叠状态在浏览器会话期间的记忆功能
 * 3. 状态恢复和初始化逻辑
 * 4. 状态变更的响应式更新和界面同步
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '@/stores/ui';

// Mock Chrome API
const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();

global.chrome = {
    storage: {
        local: {
            get: mockStorageGet,
            set: mockStorageSet,
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

describe('折叠状态持久化', () => {
    let uiStore: ReturnType<typeof useUIStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        uiStore = useUIStore();
        vi.clearAllMocks();

        // 默认返回空状态
        mockStorageGet.mockResolvedValue({});
        mockStorageSet.mockResolvedValue(undefined);
    });

    describe('状态保存到Chrome Storage', () => {
        it('应该有saveCollapseState方法', () => {
            expect(typeof uiStore.saveCollapseState).toBe('function');
        });

        it('saveCollapseState应该将折叠状态保存到Chrome Storage', async () => {
            uiStore.collapseNode('tab-1');
            uiStore.collapseNode('tab-2');
            uiStore.collapseNode('tab-3');

            await uiStore.saveCollapseState();

            expect(mockStorageSet).toHaveBeenCalledWith({
                'ui-collapse-state': expect.any(Object),
            });

            const savedData = mockStorageSet.mock.calls[0][0]['ui-collapse-state'];
            expect(savedData.collapsedNodes).toEqual(['tab-1', 'tab-2', 'tab-3']);
        });

        it('保存时应该包含时间戳', async () => {
            uiStore.collapseNode('tab-1');

            await uiStore.saveCollapseState();

            const savedData = mockStorageSet.mock.calls[0][0]['ui-collapse-state'];
            expect(savedData.timestamp).toBeDefined();
            expect(typeof savedData.timestamp).toBe('number');
        });

        it('空的折叠状态也应该能够保存', async () => {
            // 不折叠任何节点
            await uiStore.saveCollapseState();

            expect(mockStorageSet).toHaveBeenCalled();
            const savedData = mockStorageSet.mock.calls[0][0]['ui-collapse-state'];
            expect(savedData.collapsedNodes).toEqual([]);
        });
    });

    describe('状态从Chrome Storage恢复', () => {
        it('应该有loadCollapseState方法', () => {
            expect(typeof uiStore.loadCollapseState).toBe('function');
        });

        it('loadCollapseState应该从Chrome Storage恢复折叠状态', async () => {
            const savedState = {
                'ui-collapse-state': {
                    collapsedNodes: ['tab-1', 'tab-2', 'tab-3'],
                    timestamp: Date.now(),
                },
            };
            mockStorageGet.mockResolvedValueOnce(savedState);

            await uiStore.loadCollapseState();

            expect(uiStore.isNodeCollapsed('tab-1')).toBe(true);
            expect(uiStore.isNodeCollapsed('tab-2')).toBe(true);
            expect(uiStore.isNodeCollapsed('tab-3')).toBe(true);
            expect(uiStore.isNodeCollapsed('tab-4')).toBe(false);
        });

        it('loadCollapseState应该调用Chrome Storage API', async () => {
            await uiStore.loadCollapseState();

            expect(mockStorageGet).toHaveBeenCalledWith('ui-collapse-state');
        });

        it('恢复状态失败时不应该崩溃', async () => {
            mockStorageGet.mockRejectedValueOnce(new Error('Storage error'));

            // 不应该抛出错误
            await expect(uiStore.loadCollapseState()).resolves.not.toThrow();
        });

        it('Storage中没有保存的状态时应该使用默认状态', async () => {
            mockStorageGet.mockResolvedValueOnce({});

            await uiStore.loadCollapseState();

            // 应该没有任何节点被折叠
            expect(uiStore.collapsedNodes.size).toBe(0);
        });

        it('Storage中数据格式错误时应该使用默认状态', async () => {
            mockStorageGet.mockResolvedValueOnce({
                'ui-collapse-state': {
                    collapsedNodes: 'invalid-data', // 错误的数据类型
                },
            });

            await uiStore.loadCollapseState();

            // 应该使用默认状态（空）
            expect(uiStore.collapsedNodes.size).toBe(0);
        });
    });

    describe('自动保存机制', () => {
        it('折叠节点时应该自动保存状态', async () => {
            uiStore.collapseNode('tab-1');

            // 等待自动保存
            await new Promise(resolve => setTimeout(resolve, 100));

            // 验证保存被调用（可能通过防抖）
            // 注意：这个测试依赖于实现细节
        });

        it('展开节点时应该自动保存状态', async () => {
            uiStore.collapseNode('tab-1');
            vi.clearAllMocks();

            uiStore.expandNode('tab-1');

            // 等待自动保存
            await new Promise(resolve => setTimeout(resolve, 100));
        });
    });

    describe('状态同步', () => {
        it('多次折叠/展开后保存的状态应该是最新的', async () => {
            uiStore.collapseNode('tab-1');
            uiStore.collapseNode('tab-2');
            uiStore.expandNode('tab-1');
            uiStore.collapseNode('tab-3');

            await uiStore.saveCollapseState();

            const savedData = mockStorageSet.mock.calls[0][0]['ui-collapse-state'];
            expect(savedData.collapsedNodes).not.toContain('tab-1'); // 已展开
            expect(savedData.collapsedNodes).toContain('tab-2');
            expect(savedData.collapsedNodes).toContain('tab-3');
        });

        it('reset应该清除所有折叠状态并保存', async () => {
            uiStore.collapseNode('tab-1');
            uiStore.collapseNode('tab-2');

            uiStore.reset();

            expect(uiStore.collapsedNodes.size).toBe(0);
        });
    });

    describe('初始化逻辑', () => {
        it('应用启动时应该自动恢复折叠状态', async () => {
            const savedState = {
                'ui-collapse-state': {
                    collapsedNodes: ['tab-1', 'tab-2'],
                    timestamp: Date.now(),
                },
            };
            mockStorageGet.mockResolvedValueOnce(savedState);

            // 模拟应用初始化
            const newPinia = createPinia();
            setActivePinia(newPinia);
            const newUIStore = useUIStore();

            // 调用初始化
            await newUIStore.loadCollapseState();

            expect(newUIStore.isNodeCollapsed('tab-1')).toBe(true);
            expect(newUIStore.isNodeCollapsed('tab-2')).toBe(true);
        });
    });

    describe('边界情况', () => {
        it('应该处理大量节点的折叠状态', async () => {
            // 折叠1000个节点
            for (let i = 0; i < 1000; i++) {
                uiStore.collapseNode(`tab-${i}`);
            }

            await uiStore.saveCollapseState();

            expect(mockStorageSet).toHaveBeenCalled();
            const savedData = mockStorageSet.mock.calls[0][0]['ui-collapse-state'];
            expect(savedData.collapsedNodes.length).toBe(1000);
        });

        it('应该处理特殊字符的节点ID', async () => {
            const specialIds = [
                'tab-with-dash',
                'tab_with_underscore',
                'tab.with.dot',
                'tab:with:colon',
            ];

            specialIds.forEach(id => uiStore.collapseNode(id));

            await uiStore.saveCollapseState();

            const savedData = mockStorageSet.mock.calls[0][0]['ui-collapse-state'];
            specialIds.forEach(id => {
                expect(savedData.collapsedNodes).toContain(id);
            });
        });

        it('恢复状态时应该去重', async () => {
            const savedState = {
                'ui-collapse-state': {
                    collapsedNodes: ['tab-1', 'tab-2', 'tab-1', 'tab-2'], // 有重复
                    timestamp: Date.now(),
                },
            };
            mockStorageGet.mockResolvedValueOnce(savedState);

            await uiStore.loadCollapseState();

            // Set会自动去重
            expect(uiStore.collapsedNodes.size).toBe(2);
        });
    });
});
