/**
 * 标签页相关类型定义
 */

/**
 * 标签页基本信息
 */
export interface TabInfo {
    id: number;
    title: string;
    url: string;
    favicon?: string;
    windowId: number;
    index: number;
    active: boolean;
    pinned: boolean;
    audible?: boolean;
    mutedInfo?: chrome.tabs.MutedInfo;
    openerTabId?: number;
}

/**
 * 树节点接口
 */
export interface TabTreeNode {
    // 节点标识
    id: string;
    tabId: number;
    windowId: number;

    // 层级关系
    parentId?: string;
    children: TabTreeNode[];
    depth: number;
    siblingIndex: number;

    // 标签页属性
    title: string;
    url: string;
    favicon?: string;

    // 节点状态
    isActive: boolean;
    isLoading: boolean;
    isAudioPlaying: boolean;
    isPinned: boolean;

    // UI状态
    isCollapsed: boolean;
    isVisible: boolean;
    isHighlighted: boolean;

    // 元数据
    createdAt: number;
    lastAccessed: number;
    lastModified: number;
}

/**
 * 扁平化的树节点（用于虚拟滚动）
 */
export interface FlattenedNode extends TabTreeNode {
    depth: number;
}

/**
 * 窗口分组信息
 */
export interface WindowGroup {
    windowId: number;
    focused: boolean;
    nodes: TabTreeNode[];
}

/**
 * 标签页事件类型
 */
export type TabEventType =
    | 'created'
    | 'removed'
    | 'moved'
    | 'activated'
    | 'updated';

/**
 * 标签页事件
 */
export interface TabEvent {
    type: TabEventType;
    tabId: number;
    changeInfo?: chrome.tabs.TabChangeInfo;
    tab?: chrome.tabs.Tab;
}

/**
 * 拖拽状态
 */
export interface DragState {
    dragNodeId: string;
    dragElement?: HTMLElement;
    startPosition: { x: number; y: number };
    isValid: boolean;
    targetNodeId?: string;
}

/**
 * 拖拽快照（用于撤销操作）
 */
export interface DragSnapshot {
    nodeId: string;
    originalParentId: string | undefined;
    originalDepth: number;
    originalSiblingIndex: number;
    originalTreePosition: number; // 在树中的位置索引
}

/**
 * 操作结果
 */
export interface OperationResult {
    success: boolean;
    error?: string;
    data?: any;
}

/**
 * 搜索结果
 */
export interface SearchResult {
    nodeId: string;
    matches: SearchMatch[];
    score: number;
}

/**
 * 搜索匹配信息
 */
export interface SearchMatch {
    field: 'title' | 'url';
    start: number;
    end: number;
    text: string;
}
