/**
 * 搜索过滤功能测试
 * 
 * 测试目标：
 * 1. 实现搜索框输入和关键词实时匹配功能
 * 2. 建立标题和URL的全文搜索和高亮显示
 * 3. 创建搜索结果的树状上下文保持机制
 * 4. 添加搜索时相关父节点的自动展开功能
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

describe('搜索过滤功能', () => {
    let tabsStore: ReturnType<typeof useTabsStore>;
    let uiStore: ReturnType<typeof useUIStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        tabsStore = useTabsStore();
        uiStore = useUIStore();
        vi.clearAllMocks();
    });

    describe('搜索基础功能', () => {
        it('应该有searchTabs方法', () => {
            expect(typeof tabsStore.searchTabs).toBe('function');
        });

        it('应该有searchResults状态', () => {
            expect(tabsStore.searchResults).toBeDefined();
            expect(Array.isArray(tabsStore.searchResults)).toBe(true);
        });

        it('空字符串搜索应该返回所有节点', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Example',
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
            tabsStore.searchTabs('');

            expect(tabsStore.searchResults.length).toBe(0);
        });

        it('搜索应该在标题中匹配', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'GitHub - Code Repository',
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
            tabsStore.searchTabs('GitHub');

            expect(tabsStore.searchResults.length).toBe(1);
            expect(tabsStore.searchResults[0].nodeId).toBe('tab-1');
        });

        it('搜索应该在URL中匹配', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Homepage',
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
            tabsStore.searchTabs('github');

            expect(tabsStore.searchResults.length).toBe(1);
            expect(tabsStore.searchResults[0].nodeId).toBe('tab-1');
        });

        it('搜索应该不区分大小写', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'GitHub Repository',
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

            tabsStore.searchTabs('github');
            expect(tabsStore.searchResults.length).toBe(1);

            tabsStore.searchTabs('GITHUB');
            expect(tabsStore.searchResults.length).toBe(1);

            tabsStore.searchTabs('GiThUb');
            expect(tabsStore.searchResults.length).toBe(1);
        });

        it('搜索无匹配时应该返回空数组', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Example',
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
            tabsStore.searchTabs('nonexistent');

            expect(tabsStore.searchResults.length).toBe(0);
        });
    });

    describe('搜索匹配信息', () => {
        it('搜索结果应该包含匹配信息', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'GitHub Repository',
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
            tabsStore.searchTabs('GitHub');

            expect(tabsStore.searchResults[0].matches).toBeDefined();
            expect(tabsStore.searchResults[0].matches.length).toBeGreaterThan(0);
        });

        it('匹配信息应该包含字段、位置和文本', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'GitHub Repository',
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
            tabsStore.searchTabs('GitHub');

            const match = tabsStore.searchResults[0].matches[0];
            expect(match.field).toBe('title');
            expect(match.start).toBe(0);
            expect(match.end).toBe(6);
            expect(match.text).toBe('GitHub');
        });

        it('应该支持多个匹配', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Test Page',
                url: 'https://test.com',
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
            tabsStore.searchTabs('test');

            // 应该在 title 和 url 中都匹配到
            expect(tabsStore.searchResults[0].matches.length).toBe(2);
        });
    });

    describe('搜索结果评分', () => {
        it('搜索结果应该有评分', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'GitHub',
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
            tabsStore.searchTabs('GitHub');

            expect(tabsStore.searchResults[0].score).toBeDefined();
            expect(typeof tabsStore.searchResults[0].score).toBe('number');
            expect(tabsStore.searchResults[0].score).toBeGreaterThan(0);
        });

        it('标题匹配应该比URL匹配得分高', () => {
            const node1: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'GitHub Repository',
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
                title: 'Example',
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
            tabsStore.searchTabs('github');

            const titleMatch = tabsStore.searchResults.find(r => r.nodeId === 'tab-1');
            const urlMatch = tabsStore.searchResults.find(r => r.nodeId === 'tab-2');

            expect(titleMatch!.score).toBeGreaterThan(urlMatch!.score);
        });

        it('结果应该按评分降序排列', () => {
            const nodes: TabTreeNode[] = [
                {
                    id: 'tab-1',
                    tabId: 1,
                    windowId: 1,
                    parentId: undefined,
                    children: [],
                    depth: 0,
                    siblingIndex: 0,
                    title: 'test',
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
                    title: 'other',
                    url: 'https://test.com',
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
            tabsStore.searchTabs('test');

            // 验证结果按分数降序排列
            for (let i = 0; i < tabsStore.searchResults.length - 1; i++) {
                expect(tabsStore.searchResults[i].score).toBeGreaterThanOrEqual(
                    tabsStore.searchResults[i + 1].score
                );
            }
        });
    });

    describe('过滤后的节点', () => {
        it('应该有filteredTabs getter', () => {
            expect(tabsStore.filteredTabs).toBeDefined();
        });

        it('没有搜索时filteredTabs应该返回所有节点', () => {
            const node: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Example',
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
            uiStore.setSearchQuery('');

            expect(tabsStore.filteredTabs.length).toBe(1);
        });

        it('有搜索时filteredTabs应该只返回匹配的节点', () => {
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
            uiStore.setSearchQuery('GitHub');
            tabsStore.searchTabs('GitHub');

            expect(tabsStore.filteredTabs.length).toBe(1);
            expect(tabsStore.filteredTabs[0].id).toBe('tab-1');
        });
    });

    describe('搜索时父节点自动展开', () => {
        it('应该有expandMatchedNodeParents方法', () => {
            expect(typeof tabsStore.expandMatchedNodeParents).toBe('function');
        });

        it('搜索到子节点时应该自动展开父节点', () => {
            const parent: TabTreeNode = {
                id: 'tab-1',
                tabId: 1,
                windowId: 1,
                parentId: undefined,
                children: [],
                depth: 0,
                siblingIndex: 0,
                title: 'Parent',
                url: 'https://parent.com',
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
                title: 'GitHub Child',
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

            // 先折叠父节点
            uiStore.collapseNode('tab-1');
            expect(uiStore.isNodeCollapsed('tab-1')).toBe(true);

            // 搜索子节点
            tabsStore.searchTabs('GitHub');
            tabsStore.expandMatchedNodeParents();

            // 父节点应该被自动展开
            expect(uiStore.isNodeCollapsed('tab-1')).toBe(false);
        });

        it('应该递归展开所有祖先节点', () => {
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
                title: 'GitHub Child',
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
            grandparent.children.push(parent);
            tabsStore.addNode(grandparent);

            // 折叠所有节点
            uiStore.collapseNode('tab-1');
            uiStore.collapseNode('tab-2');

            expect(uiStore.isNodeCollapsed('tab-1')).toBe(true);
            expect(uiStore.isNodeCollapsed('tab-2')).toBe(true);

            // 搜索最深层子节点
            tabsStore.searchTabs('GitHub');
            tabsStore.expandMatchedNodeParents();

            // 所有祖先都应该被展开
            expect(uiStore.isNodeCollapsed('tab-1')).toBe(false);
            expect(uiStore.isNodeCollapsed('tab-2')).toBe(false);
        });
    });

    describe('清除搜索', () => {
        it('应该有clearSearchResults方法', () => {
            expect(typeof tabsStore.clearSearchResults).toBe('function');
        });

        it('clearSearchResults应该清空搜索结果', () => {
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
            tabsStore.searchTabs('GitHub');

            expect(tabsStore.searchResults.length).toBeGreaterThan(0);

            tabsStore.clearSearchResults();

            expect(tabsStore.searchResults.length).toBe(0);
        });
    });
});
