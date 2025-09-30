// Chrome Tree Tab Manager - 侧边面板应用
// 简单的树状结构管理

// 全局状态
let tabs = [];
let windows = [];
let collapsedNodes = new Set();
let searchQuery = '';
let activeTabId = null;
let currentWindowId = null; // 当前窗口ID

// 拖拽状态
let draggedTab = null;
let dropTargetTab = null;

// 持久化的父子关系映射（因为 Chrome 的 openerTabId 可能丢失）
let parentChildMap = new Map(); // key: childId, value: parentId

// 从 localStorage 加载父子关系
function loadParentChildMap() {
    try {
        const saved = localStorage.getItem('parentChildMap');
        if (saved) {
            const data = JSON.parse(saved);
            parentChildMap = new Map(Object.entries(data));
            console.log('📂 从本地加载父子关系映射:', parentChildMap.size, '条记录');
        }
    } catch (error) {
        console.error('加载父子关系映射失败:', error);
    }
}

// 保存父子关系到 localStorage
function saveParentChildMap() {
    try {
        const data = Object.fromEntries(parentChildMap);
        localStorage.setItem('parentChildMap', JSON.stringify(data));
    } catch (error) {
        console.error('保存父子关系映射失败:', error);
    }
}

// 初始化
async function init() {
    console.log('🚀 Chrome Tree Tab Manager 启动');

    try {
        // 加载父子关系映射
        loadParentChildMap();
        
        // 获取当前窗口ID
        const currentWindow = await chrome.windows.getCurrent();
        currentWindowId = currentWindow.id;
        console.log('🪟 当前窗口ID:', currentWindowId);
        
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

        // 初始定位到当前活跃的标签页
        const activeTab = tabs.find(t => t.isActive);
        if (activeTab) {
            setTimeout(() => {
                scrollToActiveTab(activeTab.id);
            }, 200);
        }

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
        console.log('原始标签页数据:', allTabs.map(t => ({
            id: t.id,
            title: t.title?.substring(0, 30),
            openerTabId: t.openerTabId
        })));

        // 转换为树结构
        tabs = allTabs.map(tab => {
            // 优先使用持久化的父子关系，如果没有则使用 openerTabId
            let parentId = null;

            if (parentChildMap.has(tab.id)) {
                parentId = parentChildMap.get(tab.id);
                console.log(`✅ 使用持久化的父节点: ${tab.id} -> ${parentId}`);
            } else if (tab.openerTabId) {
                parentId = tab.openerTabId;
                // 保存到持久化映射
                parentChildMap.set(tab.id, parentId);
                saveParentChildMap();
                console.log(`💾 保存父子关系: ${tab.id} -> ${parentId}`);
            }

            return {
                id: tab.id,
                tabId: tab.id,
                windowId: tab.windowId,
                index: tab.index,
                title: tab.title || 'Untitled',
                url: tab.url || '',
                favicon: tab.favIconUrl || '',
                isActive: tab.active,
                isPinned: tab.pinned,
                isLoading: tab.status === 'loading',
                isAudioPlaying: tab.audible || false,
                parentId: parentId,
                children: [],
                depth: 0
            };
        });

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
    tabs.forEach(tab => {
        tab.children = []; // 重置子节点数组
        tab.depth = 0;     // 重置深度
        tabMap.set(tab.id, tab);
    });

    // 第一轮：构建直接父子关系
    tabs.forEach(tab => {
        if (tab.parentId && tabMap.has(tab.parentId)) {
            const parent = tabMap.get(tab.parentId);
            parent.children.push(tab);
        }
    });

    // 第二轮：递归计算深度
    function calculateDepth(node, depth = 0) {
        node.depth = depth;
        node.children.forEach(child => calculateDepth(child, depth + 1));
    }

    // 对所有根节点（没有父节点的）计算深度
    tabs.forEach(tab => {
        if (!tab.parentId || !tabMap.has(tab.parentId)) {
            calculateDepth(tab, 0);
        }
    });

    console.log('🌲 树结构构建完成');
    const rootTabs = tabs.filter(t => !t.parentId || !tabMap.has(t.parentId));
    console.log('根节点:', rootTabs.map(t => t.title));
    console.log('树结构详情:');
    rootTabs.forEach(root => printTree(root, 0));
}

// 打印树结构（调试用）
function printTree(node, level) {
    const indent = '  '.repeat(level);
    console.log(`${indent}├─ [${node.id}] ${node.title.substring(0, 30)} (depth: ${node.depth}, children: ${node.children.length})`);
    node.children.forEach(child => printTree(child, level + 1));
}

// 渲染树
function renderTree() {
    const container = document.getElementById('treeContainer');
    const tabCountEl = document.getElementById('tabCount');
    const windowCountEl = document.getElementById('windowCount');

    console.log('🎨 开始渲染，标签页数量:', tabs.length);

    // 更新统计（显示当前窗口的标签页数量）
    const currentWindowTabCount = tabs.filter(t => t.windowId === currentWindowId).length;
    tabCountEl.textContent = `当前窗口: ${currentWindowTabCount} 个标签页`;
    windowCountEl.textContent = `总窗口: ${windows.length} 个`;

    // 如果没有标签页数据
    if (!tabs || tabs.length === 0) {
        container.innerHTML = '<div class="empty-state">加载中...</div>';
        console.log('⚠️  没有标签页数据');
        return;
    }

    // 过滤和排序
    const query = searchQuery.toLowerCase();
    let visibleTabs;

    // 首先过滤当前窗口的标签页
    const currentWindowTabs = tabs.filter(tab => tab.windowId === currentWindowId);
    console.log('🪟 当前窗口标签页数量:', currentWindowTabs.length);
    
    if (query) {
        // 搜索模式：在当前窗口的标签页中搜索
        visibleTabs = currentWindowTabs.filter(tab => 
            tab.title.toLowerCase().includes(query) || 
            tab.url.toLowerCase().includes(query)
        );
        console.log('🔍 搜索结果:', visibleTabs.length, '个匹配');
    } else {
        // 正常模式：只显示当前窗口的根节点（没有父节点的标签页）
        visibleTabs = currentWindowTabs.filter(tab => !tab.parentId);
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

    // 设置可拖拽
    node.draggable = true;

    // 拖拽事件
    node.addEventListener('dragstart', (e) => {
        draggedTab = tab;
        node.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', node.innerHTML);
        console.log('🎯 开始拖拽:', tab.title);
    });

    node.addEventListener('dragend', (e) => {
        node.classList.remove('dragging');
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
        draggedTab = null;
        dropTargetTab = null;
    });

    node.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        if (draggedTab && draggedTab.id !== tab.id) {
            // 检查是否会造成循环依赖
            if (!isDescendant(tab, draggedTab)) {
                // 移除其他节点的高亮
                document.querySelectorAll('.drop-target').forEach(el => {
                    if (el !== node) el.classList.remove('drop-target');
                });
                node.classList.add('drop-target');
                dropTargetTab = tab;
                console.log('📍 悬停在:', tab.title);
            } else {
                console.log('⚠️  不能拖到后代节点:', tab.title);
            }
        }
    });

    node.addEventListener('dragleave', (e) => {
        // 只有当真正离开节点时才移除高亮（不是进入子元素）
        const rect = node.getBoundingClientRect();
        if (
            e.clientX < rect.left || e.clientX >= rect.right ||
            e.clientY < rect.top || e.clientY >= rect.bottom
        ) {
            node.classList.remove('drop-target');
        }
    });

    node.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('🎯 Drop 事件触发');
        console.log('拖拽的标签页:', draggedTab?.title);
        console.log('目标节点:', dropTargetTab?.title);

        // 移除所有高亮
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });

        if (draggedTab && dropTargetTab && draggedTab.id !== dropTargetTab.id) {
            console.log('📌 开始移动:', draggedTab.title, '→', dropTargetTab.title);
            await moveTabToParent(draggedTab.id, dropTargetTab.id);
        } else {
            console.log('❌ 无效的拖拽操作');
        }
    });

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

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.textContent = '✕';
    closeBtn.title = tab.children.length > 0 ? '关闭此页面及所有子页面' : '关闭此页面';
    closeBtn.onclick = async (e) => {
        e.stopPropagation();
        await closeTabWithChildren(tab);
    };
    node.appendChild(closeBtn);

    // 点击事件
    node.onclick = (e) => {
        // 如果不是拖拽操作，才激活标签页
        if (!node.classList.contains('dragging')) {
            activateTab(tab.id);
        }
    };

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

// 检查 child 是否是 parent 的后代节点
function isDescendant(child, parent) {
    if (!parent.children || parent.children.length === 0) {
        return false;
    }

    for (const c of parent.children) {
        if (c.id === child.id) {
            return true;
        }
        if (isDescendant(child, c)) {
            return true;
        }
    }

    return false;
}

// 递归收集所有子孙节点
function collectAllDescendants(tab) {
    const descendants = [tab];

    if (tab.children && tab.children.length > 0) {
        for (const child of tab.children) {
            descendants.push(...collectAllDescendants(child));
        }
    }

    return descendants;
}

// 关闭标签页及其所有子节点
async function closeTabWithChildren(tab) {
    try {
        // 收集所有需要关闭的标签页（包括自己和所有后代）
        const toClose = collectAllDescendants(tab);
        const count = toClose.length;

        console.log('🗑️  准备关闭', count, '个标签页');
        console.log('要关闭的标签:', toClose.map(t => t.title));

        // 如果有多个标签页，显示确认对话框
        if (count > 1) {
            const confirmed = confirm(
                `确定要关闭 "${tab.title}" 及其所有 ${count - 1} 个子页面吗？\n\n` +
                `将关闭：\n${toClose.slice(0, 5).map(t => '• ' + t.title).join('\n')}` +
                (count > 5 ? `\n...还有 ${count - 5} 个` : '')
            );

            if (!confirmed) {
                console.log('❌ 用户取消关闭');
                return;
            }
        }

        // 关闭所有标签页（从叶子节点开始，避免关闭父节点导致子节点失去引用）
        const tabIds = toClose.map(t => t.id);

        // 批量关闭
        for (const id of tabIds) {
            try {
                await chrome.tabs.remove(id);
                console.log('✅ 已关闭标签页:', id);
            } catch (error) {
                console.error('❌ 关闭标签页失败:', id, error);
            }
        }

        // 重新加载和渲染
        await loadTabs();
        renderTree();

        console.log('✅ 关闭操作完成');
    } catch (error) {
        console.error('❌ 关闭标签页时出错:', error);
    }
}

// 将标签页移动到新父节点下
async function moveTabToParent(tabId, newParentId) {
    try {
        console.log('🔄 开始移动标签页');
        console.log('  源标签页 ID:', tabId);
        console.log('  目标父节点 ID:', newParentId);

        // 找到被拖拽的标签页
        const tab = tabs.find(t => t.id === tabId);
        const newParent = tabs.find(t => t.id === newParentId);

        console.log('  源标签页:', tab?.title);
        console.log('  目标父节点:', newParent?.title);

        if (!tab || !newParent) {
            console.error('❌ 找不到标签页或父节点');
            console.error('  tab:', tab);
            console.error('  newParent:', newParent);
            return;
        }

        // 检查循环依赖
        if (isDescendant(newParent, tab)) {
            console.error('❌ 不能移动到自己的后代节点下');
            alert('不能将节点移动到自己的子节点下！');
            return;
        }

        console.log('✅ 验证通过，开始更新父子关系');

        // 更新持久化的父子关系映射
        parentChildMap.set(tabId, newParentId);
        saveParentChildMap();
        console.log('💾 已保存父子关系到持久化存储');

        // 更新本地数据结构
        tab.parentId = newParentId;

        // 移动 Chrome 标签页位置（移到父标签页后面）
        console.log('📍 移动 Chrome 标签页位置...');
        await chrome.tabs.move(tabId, {
            index: newParent.index + 1
        });
        console.log('✅ Chrome 标签页位置已更新');

        // 自动展开新父节点
        if (collapsedNodes.has(newParentId)) {
            collapsedNodes.delete(newParentId);
            console.log('📂 自动展开目标父节点');
        }

        // 重新加载和渲染
        console.log('🔄 重新加载标签页数据...');
        await loadTabs();
        renderTree();

        console.log('✅ 移动操作完成！');
    } catch (error) {
        console.error('❌ 移动标签页失败:', error);
        alert('移动失败: ' + error.message);
    }
}

// 自动滚动到活跃标签页
function scrollToActiveTab(tabId) {
    console.log('📍 开始定位到标签页:', tabId);

    // 找到对应的标签页
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
        console.log('⚠️  找不到标签页:', tabId);
        return;
    }

    console.log('📍 找到标签页:', tab.title);

    // 展开所有父节点路径
    expandPathToNode(tab);

    // 等待渲染完成后滚动
    setTimeout(() => {
        // 找到 DOM 节点
        const nodeElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (nodeElement) {
            console.log('✅ 找到 DOM 节点，开始滚动');

            // 滚动到可见区域
            nodeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // 添加短暂的高亮效果
            nodeElement.classList.add('highlight-flash');
            setTimeout(() => {
                nodeElement.classList.remove('highlight-flash');
            }, 1000);

            console.log('✅ 滚动完成');
        } else {
            console.log('⚠️  找不到 DOM 节点');
        }
    }, 50);
}

// 展开到指定节点的所有父节点路径
function expandPathToNode(tab) {
    const pathToExpand = [];

    // 收集所有父节点
    let current = tab;
    while (current.parentId) {
        const parent = tabs.find(t => t.id === current.parentId);
        if (!parent) break;

        pathToExpand.push(parent.id);
        current = parent;
    }

    console.log('📂 需要展开的节点路径:', pathToExpand);

    // 展开所有父节点
    pathToExpand.forEach(nodeId => {
        if (collapsedNodes.has(nodeId)) {
            collapsedNodes.delete(nodeId);
            console.log('📂 展开节点:', nodeId);
        }
    });

    // 如果有节点被展开，重新渲染
    if (pathToExpand.length > 0) {
        renderTree();
    }
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
    chrome.tabs.onCreated.addListener(async (tab) => {
        console.log('🆕 新标签页创建:', {
            id: tab.id,
            title: tab.title,
            openerTabId: tab.openerTabId
        });

        // 立即保存父子关系（在 openerTabId 消失之前）
        if (tab.openerTabId) {
            parentChildMap.set(tab.id, tab.openerTabId);
            saveParentChildMap();
            console.log(`💾 实时保存父子关系: ${tab.id} -> ${tab.openerTabId}`);
        }

        await loadTabs();
        renderTree();
    });

    chrome.tabs.onRemoved.addListener(async (tabId) => {
        console.log('🗑️  标签页删除:', tabId);

        // 清除父子关系映射
        parentChildMap.delete(tabId);
        saveParentChildMap();

        await loadTabs();
        renderTree();
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
        if (changeInfo.status === 'complete' || changeInfo.title) {
            await loadTabs();
            renderTree();
        }
    });

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        console.log('👆 标签页激活:', activeInfo.tabId, '窗口:', activeInfo.windowId);
        
        // 更新当前窗口ID
        currentWindowId = activeInfo.windowId;
        
        await loadTabs();
        renderTree();
        
        // 自动定位到活跃的标签页
        setTimeout(() => {
            scrollToActiveTab(activeInfo.tabId);
        }, 100);
    });
    
    // 监听窗口焦点变化
    chrome.windows.onFocusChanged.addListener(async (windowId) => {
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            console.log('⚠️  没有窗口获得焦点');
            return;
        }
        
        console.log('🪟 窗口焦点变化:', windowId);
        currentWindowId = windowId;
        
        await loadTabs();
        renderTree();
        
        // 定位到新窗口的活跃标签页
        const activeTab = tabs.find(t => t.isActive && t.windowId === windowId);
        if (activeTab) {
            setTimeout(() => {
                scrollToActiveTab(activeTab.id);
            }, 100);
        }
    });

    console.log('✅ 监听器设置完成');
}

// 启动应用
init();
