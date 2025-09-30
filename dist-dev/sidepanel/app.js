// Chrome Tree Tab Manager - 侧边面板应用
// 简单的树状结构管理

// 全局状态
let tabs = [];
let windows = [];
let collapsedNodes = new Set();
let searchQuery = '';
let activeTabId = null;

// 初始化
async function init() {
    console.log('🚀 Chrome Tree Tab Manager 启动');
    
    try {
        // 加载标签页
        await loadTabs();
        console.log('📊 标签页数据:', tabs.length, '个');
        console.log('详细数据:', tabs);
        
        await loadWindows();
        console.log('🪟 窗口数据:', windows.length, '个');
        
        // 渲染树
        renderTree();
        console.log('🎨 树已渲染');
        
        // 设置监听器
        setupListeners();
        
        console.log('✅ 初始化完成');
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        document.getElementById('treeContainer').innerHTML = 
            `<div class="empty-state">
                初始化失败: ${error.message}<br>
                <small>请打开 DevTools 查看详细错误</small>
            </div>`;
    }
}

// 加载标签页
async function loadTabs() {
    try {
        const allTabs = await chrome.tabs.query({});
        console.log('📊 加载了', allTabs.length, '个标签页');
        
        // 转换为树结构
        tabs = allTabs.map(tab => ({
            id: tab.id,
            tabId: tab.id,
            windowId: tab.windowId,
            title: tab.title || 'Untitled',
            url: tab.url || '',
            favicon: tab.favIconUrl || '',
            isActive: tab.active,
            isPinned: tab.pinned,
            isLoading: tab.status === 'loading',
            isAudioPlaying: tab.audible || false,
            parentId: tab.openerTabId || null,
            children: [],
            depth: 0
        }));
        
        // 构建父子关系
        buildTree();
        
    } catch (error) {
        console.error('❌ 加载标签页失败:', error);
    }
}

// 加载窗口
async function loadWindows() {
    try {
        const allWindows = await chrome.windows.getAll();
        windows = allWindows;
        console.log('🪟 加载了', windows.length, '个窗口');
    } catch (error) {
        console.error('❌ 加载窗口失败:', error);
    }
}

// 构建树结构
function buildTree() {
    // 建立 ID 映射
    const tabMap = new Map();
    tabs.forEach(tab => tabMap.set(tab.id, tab));
    
    // 构建父子关系
    tabs.forEach(tab => {
        if (tab.parentId && tabMap.has(tab.parentId)) {
            const parent = tabMap.get(tab.parentId);
            if (!parent.children.includes(tab)) {
                parent.children.push(tab);
            }
            tab.depth = parent.depth + 1;
        }
    });
}

// 渲染树
function renderTree() {
    const container = document.getElementById('treeContainer');
    const tabCountEl = document.getElementById('tabCount');
    const windowCountEl = document.getElementById('windowCount');
    
    console.log('🎨 开始渲染，标签页数量:', tabs.length);
    
    // 更新统计
    tabCountEl.textContent = `标签页: ${tabs.length}`;
    windowCountEl.textContent = `窗口: ${windows.length}`;
    
    // 如果没有标签页数据
    if (!tabs || tabs.length === 0) {
        container.innerHTML = '<div class="empty-state">加载中...</div>';
        console.log('⚠️  没有标签页数据');
        return;
    }
    
    // 过滤和排序
    const query = searchQuery.toLowerCase();
    let visibleTabs;
    
    if (query) {
        // 搜索模式：显示所有匹配的标签页
        visibleTabs = tabs.filter(tab => 
            tab.title.toLowerCase().includes(query) || 
            tab.url.toLowerCase().includes(query)
        );
        console.log('🔍 搜索结果:', visibleTabs.length, '个匹配');
    } else {
        // 正常模式：只显示根节点（没有父节点的标签页）
        visibleTabs = tabs.filter(tab => !tab.parentId);
        console.log('🌲 根节点数量:', visibleTabs.length);
        console.log('根节点详情:', visibleTabs.map(t => ({ id: t.id, title: t.title, parentId: t.parentId })));
    }
    
    // 如果没有可见标签页
    if (visibleTabs.length === 0) {
        const message = query ? '没有找到匹配的标签页' : '没有标签页数据';
        container.innerHTML = `<div class="empty-state">${message}</div>`;
        console.log('⚠️  没有可见标签页');
        return;
    }
    
    // 渲染节点
    container.innerHTML = '';
    console.log('✏️  渲染', visibleTabs.length, '个节点');
    visibleTabs.forEach(tab => {
        renderNode(tab, container);
    });
    console.log('✅ 渲染完成');
}

// 渲染单个节点
function renderNode(tab, container) {
    const node = document.createElement('div');
    node.className = 'tree-node' + (tab.isActive ? ' active' : '') + (tab.isLoading ? ' loading' : '');
    node.style.paddingLeft = `${8 + tab.depth * 20}px`;
    node.dataset.tabId = tab.id;
    
    // 折叠按钮
    if (tab.children.length > 0) {
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'collapse-button';
        collapseBtn.textContent = collapsedNodes.has(tab.id) ? '▶' : '▼';
        collapseBtn.onclick = (e) => {
            e.stopPropagation();
            toggleCollapse(tab.id);
        };
        node.appendChild(collapseBtn);
    } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'collapse-placeholder';
        node.appendChild(placeholder);
    }
    
    // Favicon
    if (tab.favicon) {
        const favicon = document.createElement('img');
        favicon.className = 'node-favicon';
        favicon.src = tab.favicon;
        favicon.onerror = () => favicon.textContent = '🌐';
        node.appendChild(favicon);
    } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'node-favicon';
        placeholder.textContent = '🌐';
        node.appendChild(placeholder);
    }
    
    // 标题
    const title = document.createElement('span');
    title.className = 'node-title';
    title.textContent = tab.title;
    node.appendChild(title);
    
    // 子节点数量
    if (collapsedNodes.has(tab.id) && tab.children.length > 0) {
        const count = document.createElement('span');
        count.className = 'children-count';
        count.textContent = tab.children.length;
        node.appendChild(count);
    }
    
    // 状态图标
    const icons = document.createElement('div');
    icons.className = 'node-icons';
    if (tab.isLoading) icons.innerHTML += '⏳';
    if (tab.isAudioPlaying) icons.innerHTML += '🔊';
    if (tab.isPinned) icons.innerHTML += '📌';
    node.appendChild(icons);
    
    // 点击事件
    node.onclick = () => activateTab(tab.id);
    
    container.appendChild(node);
    
    // 渲染子节点
    if (!collapsedNodes.has(tab.id) && tab.children.length > 0) {
        tab.children.forEach(child => renderNode(child, container));
    }
}

// 激活标签页
async function activateTab(tabId) {
    try {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            await chrome.tabs.update(tabId, { active: true });
            await chrome.windows.update(tab.windowId, { focused: true });
            activeTabId = tabId;
            await loadTabs();
            renderTree();
        }
    } catch (error) {
        console.error('激活标签页失败:', error);
    }
}

// 切换折叠状态
function toggleCollapse(tabId) {
    if (collapsedNodes.has(tabId)) {
        collapsedNodes.delete(tabId);
    } else {
        collapsedNodes.add(tabId);
    }
    renderTree();
}

// 设置监听器
function setupListeners() {
    // 搜索输入
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTree();
    });
    
    // 标签页变化监听
    chrome.tabs.onCreated.addListener(async () => {
        await loadTabs();
        renderTree();
    });
    
    chrome.tabs.onRemoved.addListener(async () => {
        await loadTabs();
        renderTree();
    });
    
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
        if (changeInfo.status === 'complete' || changeInfo.title) {
            await loadTabs();
            renderTree();
        }
    });
    
    chrome.tabs.onActivated.addListener(async () => {
        await loadTabs();
        renderTree();
    });
    
    console.log('✅ 监听器设置完成');
}

// 启动应用
init();
