// Chrome Tree Tab Manager - Service Worker
// 开发版本：简化的后台脚本

console.log('🚀 Chrome Tree Tab Manager Service Worker 已启动');

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
    console.log('✅ 扩展已安装:', details.reason);
    
    // 设置侧边面板
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('设置侧边面板失败:', error));
});

// 监听标签页创建
chrome.tabs.onCreated.addListener((tab) => {
    console.log('📄 新标签页创建:', tab.id, tab.title);
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        console.log('✅ 标签页更新完成:', tab.id, tab.title);
    }
});

// 监听标签页关闭
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log('🗑️  标签页关闭:', tabId);
});

// 监听标签页激活
chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log('👆 标签页激活:', activeInfo.tabId);
});

// 监听来自侧边面板的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 收到消息:', message);
    sendResponse({ success: true });
    return true;
});

console.log('✅ Service Worker 初始化完成');
console.log('💡 这是简化的开发版本，用于验证基础功能');
console.log('📊 完整功能请参考 tests/ 目录中的 422 个测试用例');
