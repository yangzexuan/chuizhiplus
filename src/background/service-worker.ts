/**
 * Service Worker 后台脚本
 * 
 * 职责：
 * - 监听Chrome标签页和窗口事件
 * - 转发事件到Vue应用
 * - 提供Chrome API代理
 * - 管理数据持久化
 */

console.log('Service Worker 正在初始化...');

// ==================== 事件监听器注册 ====================

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
    console.log('Chrome树状标签管理器已安装');
});

// 标签页事件监听
chrome.tabs.onCreated.addListener((tab) => {
    console.log('标签页创建:', tab.id);
    // 可以在这里转发事件到UI（如果需要实时更新）
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log('标签页移除:', tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        console.log('标签页更新:', tabId);
    }
});

chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
    console.log('标签页移动:', tabId);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log('标签页激活:', activeInfo.tabId);
});

// 窗口事件监听
chrome.windows.onCreated.addListener((window) => {
    console.log('窗口创建:', window.id);
});

chrome.windows.onRemoved.addListener((windowId) => {
    console.log('窗口移除:', windowId);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        console.log('窗口焦点变化:', windowId);
    }
});

// ==================== 消息处理 ====================

/**
 * 消息接口定义
 */
interface Message {
    type: string;
    [key: string]: any;
}

interface MessageResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * 处理来自UI的消息
 */
chrome.runtime.onMessage.addListener((
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
) => {
    console.log('收到消息:', message.type);

    // 异步处理消息
    handleMessage(message)
        .then(sendResponse)
        .catch(error => {
            console.error('消息处理错误:', error);
            sendResponse({
                success: false,
                error: String(error),
            });
        });

    // 返回true表示异步响应
    return true;
});

/**
 * 处理消息的异步函数
 * 导出以便测试
 */
export async function handleMessage(message: Message): Promise<MessageResponse> {
    switch (message.type) {
        // ==================== 标签页操作 ====================
        case 'GET_ALL_TABS':
            return getAllTabs();

        case 'GET_TAB':
            return getTab(message.tabId);

        case 'MOVE_TAB':
            return moveTab(message.tabId, message.index, message.windowId);

        case 'CLOSE_TAB':
            return closeTab(message.tabId);

        case 'CREATE_TAB':
            return createTab(message.url, message.openerTabId, message.windowId);

        case 'ACTIVATE_TAB':
            return activateTab(message.tabId);

        // ==================== 窗口操作 ====================
        case 'GET_ALL_WINDOWS':
            return getAllWindows();

        case 'GET_CURRENT_WINDOW':
            return getCurrentWindow();

        // ==================== 存储操作 ====================
        case 'STORAGE_GET':
            return storageGet(message.key);

        case 'STORAGE_SET':
            return storageSet(message.key, message.value);

        case 'STORAGE_REMOVE':
            return storageRemove(message.key);

        case 'STORAGE_CLEAR':
            return storageClear();

        // ==================== 未知消息 ====================
        default:
            return {
                success: false,
                error: '未知的消息类型',
            };
    }
}

// ==================== 标签页API函数 ====================

/**
 * 获取所有标签页
 */
async function getAllTabs(): Promise<MessageResponse> {
    try {
        const tabs = await chrome.tabs.query({});
        return { success: true, data: tabs };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 获取指定标签页
 */
async function getTab(tabId: number): Promise<MessageResponse> {
    try {
        const tab = await chrome.tabs.get(tabId);
        return { success: true, data: tab };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 移动标签页
 */
async function moveTab(
    tabId: number,
    index: number,
    windowId?: number
): Promise<MessageResponse> {
    try {
        const moveProperties: chrome.tabs.MoveProperties = { index };
        if (windowId !== undefined) {
            moveProperties.windowId = windowId;
        }
        const tab = await chrome.tabs.move(tabId, moveProperties);
        return { success: true, data: tab };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 关闭标签页
 */
async function closeTab(tabId: number): Promise<MessageResponse> {
    try {
        await chrome.tabs.remove(tabId);
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 创建标签页
 */
async function createTab(
    url: string,
    openerTabId?: number,
    windowId?: number
): Promise<MessageResponse> {
    try {
        const createProperties: chrome.tabs.CreateProperties = { url };
        if (openerTabId !== undefined) {
            createProperties.openerTabId = openerTabId;
        }
        if (windowId !== undefined) {
            createProperties.windowId = windowId;
        }
        const tab = await chrome.tabs.create(createProperties);
        return { success: true, data: tab };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 激活标签页
 */
async function activateTab(tabId: number): Promise<MessageResponse> {
    try {
        // 先获取标签页以确定其所属窗口
        const tab = await chrome.tabs.get(tabId);

        // 激活标签页
        await chrome.tabs.update(tabId, { active: true });

        // 如果标签页在另一个窗口，需要先聚焦那个窗口
        if (tab.windowId) {
            await chrome.windows.update(tab.windowId, { focused: true });
        }

        return { success: true, data: tab };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ==================== 窗口API函数 ====================

/**
 * 获取所有窗口
 */
async function getAllWindows(): Promise<MessageResponse> {
    try {
        const windows = await chrome.windows.getAll({ populate: true });
        return { success: true, data: windows };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 获取当前窗口
 */
async function getCurrentWindow(): Promise<MessageResponse> {
    try {
        const window = await chrome.windows.getCurrent({ populate: true });
        return { success: true, data: window };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ==================== Storage API函数 ====================

/**
 * 从存储获取数据
 */
async function storageGet(key: string): Promise<MessageResponse> {
    try {
        const result = await chrome.storage.local.get(key);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 保存数据到存储
 */
async function storageSet(key: string, value: any): Promise<MessageResponse> {
    try {
        await chrome.storage.local.set({ [key]: value });
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 从存储删除数据
 */
async function storageRemove(key: string): Promise<MessageResponse> {
    try {
        await chrome.storage.local.remove(key);
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 清空存储
 */
async function storageClear(): Promise<MessageResponse> {
    try {
        await chrome.storage.local.clear();
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

console.log('Service Worker 初始化完成');