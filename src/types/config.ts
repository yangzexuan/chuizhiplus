/**
 * 配置相关类型定义
 */

/**
 * 扩展配置接口
 */
export interface ExtensionConfig {
    // 面板设置
    panelWidth: number;
    panelVisible: boolean;
    showFavicons: boolean;
    showLines: boolean;

    // 折叠设置
    defaultCollapsed: boolean;
    rememberCollapseState: boolean;

    // 关闭行为设置
    confirmThreshold: number;
    enableAutoClose: boolean;
    undoTimeWindow: number; // 毫秒

    // 拖拽设置
    enableDragDrop: boolean;
    dragSensitivity: number;

    // 搜索设置
    searchCaseSensitive: boolean;
    searchInUrl: boolean;
    searchInTitle: boolean;

    // 过滤设置
    showAudioOnly: boolean;
    showActiveOnly: boolean;

    // 性能设置
    enableVirtualScroll: boolean;
    nodeHeight: number;
    bufferSize: number;

    // 主题设置
    theme: 'light' | 'dark' | 'auto';

    // 窗口管理
    showWindowGroups: boolean;
    groupByWindow: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: ExtensionConfig = {
    panelWidth: 300,
    panelVisible: true,
    showFavicons: true,
    showLines: true,

    defaultCollapsed: false,
    rememberCollapseState: true,

    confirmThreshold: 5,
    enableAutoClose: true,
    undoTimeWindow: 5000,

    enableDragDrop: true,
    dragSensitivity: 5,

    searchCaseSensitive: false,
    searchInUrl: true,
    searchInTitle: true,

    showAudioOnly: false,
    showActiveOnly: false,

    enableVirtualScroll: true,
    nodeHeight: 32,
    bufferSize: 10,

    theme: 'auto',

    showWindowGroups: true,
    groupByWindow: true,
};

/**
 * 配置更新选项
 */
export type ConfigUpdate = Partial<ExtensionConfig>;
