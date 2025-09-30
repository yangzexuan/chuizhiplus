/**
 * Service Worker 后台脚本
 * 
 * 职责：
 * - 监听Chrome标签页和窗口事件
 * - 转发事件到Vue应用
 * - 提供Chrome API代理
 */

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
    console.log('Chrome树状标签管理器已安装');
});

// 处理来自UI的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('收到消息:', message);

    // 异步处理消息
    handleMessage(message).then(sendResponse);

    // 返回true表示异步响应
    return true;
});

/**
 * 处理消息的异步函数
 */
async function handleMessage(message: any): Promise<any> {
    switch (message.type) {
        case 'GET_ALL_TABS':
            return getAllTabs();
        case 'GET_ALL_WINDOWS':
            return getAllWindows();
        default:
            return { error: '未知的消息类型' };
    }
}

/**
 * 获取所有标签页
 */
async function getAllTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        return { success: true, data: tabs };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * 获取所有窗口
 */
async function getAllWindows() {
    try {
        const windows = await chrome.windows.getAll({ populate: true });
        return { success: true, data: windows };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
