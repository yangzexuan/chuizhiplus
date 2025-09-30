// Chrome Extension Service Worker
// 轻量化事件监听和消息转发机制

console.log('Chrome Tree Tab Manager - Service Worker loaded');

// 安装事件处理
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// 扩展图标点击事件 - 打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
});

// 标签页事件监听
chrome.tabs.onCreated.addListener((tab) => {
  console.log('Tab created:', tab.id);
  // TODO: 实现标签页创建事件处理
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId);
  // TODO: 实现标签页移除事件处理
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tabId, changeInfo);
  // TODO: 实现标签页更新事件处理
});

// 窗口事件监听
chrome.windows.onCreated.addListener((window) => {
  console.log('Window created:', window.id);
  // TODO: 实现窗口创建事件处理
});

chrome.windows.onRemoved.addListener((windowId) => {
  console.log('Window removed:', windowId);
  // TODO: 实现窗口移除事件处理
});

// 消息通信处理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);

  // TODO: 实现与Vue应用的双向通信桥梁
  switch (request.action) {
    case 'GET_TABS':
      // 获取所有标签页
      chrome.tabs.query({}, (tabs) => {
        sendResponse({ tabs });
      });
      return true; // 保持消息通道开放

    case 'GET_WINDOWS':
      // 获取所有窗口
      chrome.windows.getAll({ populate: true }, (windows) => {
        sendResponse({ windows });
      });
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});