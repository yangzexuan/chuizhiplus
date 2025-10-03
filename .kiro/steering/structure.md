# 项目结构文档

## 根目录组织

```
chuizhiplus/
├── .kiro/                    # Kiro规范驱动开发目录
│   ├── steering/            # 项目指导文档
│   └── specs/               # 功能规范文档
├── src/                     # 源代码目录
├── dist-dev/                # 开发构建输出目录
├── tests/                   # 测试文件（24个测试文件，422个测试用例）
├── doc/                     # 项目文档
├── node_modules/            # 依赖包
├── package.json             # 项目依赖和脚本
├── tsconfig.json            # TypeScript配置
├── vite.config.ts           # Vite构建配置
├── vitest.config.ts         # 测试配置
├── build-dev.sh             # 开发构建脚本
├── build-vue-dev.sh         # Vue开发构建脚本
├── generate-icons.cjs       # 图标生成脚本
├── CHROME_INSTALL_GUIDE.md  # Chrome安装指南
├── CLAUDE.md                # Claude Code项目指令
└── README.md                # 项目说明文档
```

**项目状态更新** (2025-01-27)：
- ✅ **核心功能完成**：所有业务逻辑已实现并通过测试
- ✅ **测试覆盖完整**：24个测试文件，422个测试用例，100%通过率
- ⚙️ **UI组件开发中**：Vue组件界面正在完善
- 📁 **构建系统完善**：支持开发和生产环境构建

## 源代码结构 (src/)

```
src/
├── manifest.json            # Chrome扩展清单文件（Manifest V3）
├── background/              # 后台脚本
│   └── service-worker.ts    # 主服务工作线程（已实现）
├── sidepanel/               # 侧边栏页面
│   ├── index.html          # 侧边栏HTML入口
│   ├── index-csp.html      # CSP版本HTML
│   ├── index-standalone.html # 独立版本HTML
│   ├── main.ts             # 侧边栏Vue应用入口
│   ├── App.vue             # 根组件（开发中）
│   ├── style.css           # 全局样式
│   └── styles.css          # 组件样式
├── components/              # Vue组件库
│   └── TreeView/           # 树状视图组件
│       ├── TreeView.vue    # 主树视图组件（开发中）
│       └── TreeNode.vue     # 树节点组件（开发中）
├── stores/                  # Pinia状态管理（已完成）
│   ├── index.ts            # Store入口
│   ├── tabs.ts             # 标签页状态（1994行，核心逻辑）
│   ├── config.ts           # 配置状态
│   └── ui.ts               # UI状态
├── types/                   # TypeScript类型定义（已完成）
│   ├── tabs.ts             # 标签页相关类型
│   ├── config.ts           # 配置相关类型
│   ├── chrome.ts           # Chrome API类型扩展
│   └── index.ts            # 类型导出
└── assets/                  # 静态资源
    └── icons/              # 图标资源
```

**实现状态说明**：
- ✅ **已完成**：后台脚本、状态管理、类型定义、核心业务逻辑
- ⚙️ **开发中**：Vue组件界面、样式系统
- 📋 **待开发**：配置面板、右键菜单、高级UI组件

## 核心模块详细结构

### TreeView组件结构
```
components/TreeView/
├── TreeView.vue            # 主树视图组件
├── TreeNode.vue            # 单个树节点组件
├── NodeContent.vue         # 节点内容组件
├── CollapseButton.vue      # 折叠按钮组件
├── DragPreview.vue         # 拖拽预览组件
├── types.ts                # 组件相关类型
└── styles.module.css       # 组件样式
```

### 后台脚本结构
```
background/
├── service-worker.ts       # 主服务工作线程
│   ├── 事件监听器注册
│   ├── 消息通信处理
│   └── 生命周期管理
├── tab-manager.ts          # 标签页管理
│   ├── 标签页事件处理
│   ├── 树结构维护
│   └── 关系建立逻辑
├── window-manager.ts       # 窗口管理
│   ├── 窗口事件处理
│   ├── 跨窗口操作
│   └── 窗口状态同步
└── storage-manager.ts      # 存储管理
    ├── 配置数据管理
    ├── 树结构持久化
    └── 缓存策略
```

### 组合式API结构
```
composables/
├── useTabTree.ts           # 标签页树逻辑
│   ├── 树构建算法
│   ├── 节点操作方法
│   └── 状态响应式管理
├── useDragDrop.ts          # 拖拽功能
│   ├── 拖拽事件处理
│   ├── 拖放区域判断
│   └── 视觉反馈控制
├── useSearch.ts            # 搜索功能
│   ├── 搜索算法实现
│   ├── 过滤条件处理
│   └── 结果高亮显示
└── useConfig.ts            # 配置管理
    ├── 配置读取写入
    ├── 默认值管理
    └── 验证逻辑
```

## 代码组织模式

### 组件命名约定
- **PascalCase**：组件文件和类名 (TreeView.vue, NodeContent.vue)
- **kebab-case**：组件在模板中使用 (`<tree-view>`, `<node-content>`)
- **camelCase**：方法和变量名 (handleClick, isCollapsed)

### 文件命名约定
- **组件文件**：PascalCase.vue
- **组合式API**：use*.ts
- **工具函数**：kebab-case.ts
- **类型定义**：kebab-case.ts
- **样式文件**：kebab-case.css 或 *.module.css

### 导入组织规范
```typescript
// 1. Node modules
import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';

// 2. Internal utilities
import { debounce } from '@/utils/debounce';
import { chromeApiWrapper } from '@/utils/chrome-api';

// 3. Components
import TreeNode from './TreeNode.vue';

// 4. Types
import type { TabTreeNode, TreeViewConfig } from '@/types/tabs';
```

### 组件结构模式
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 1. 导入
import { ref, computed, onMounted } from 'vue';

// 2. Props定义
interface Props {
  // props类型定义
}
const props = defineProps<Props>();

// 3. Emits定义
interface Emits {
  // emits类型定义
}
const emit = defineEmits<Emits>();

// 4. 响应式数据
const localState = ref();

// 5. 计算属性
const computedValue = computed(() => {
  // 计算逻辑
});

// 6. 方法
const handleEvent = () => {
  // 处理逻辑
};

// 7. 生命周期
onMounted(() => {
  // 初始化逻辑
});
</script>

<style scoped>
/* 组件样式 */
</style>
```

## 状态管理架构

### Pinia Store结构
```typescript
// stores/tabs.ts
export const useTabsStore = defineStore('tabs', () => {
  // 1. State
  const tabTree = ref<TabTreeNode[]>([]);
  const activeTabId = ref<number | null>(null);

  // 2. Getters
  const flattenedTabs = computed(() => {
    return flattenTree(tabTree.value);
  });

  // 3. Actions
  const addTab = (tab: TabInfo) => {
    // 添加标签页逻辑
  };

  const removeTab = (tabId: number) => {
    // 移除标签页逻辑
  };

  return {
    // 导出state、getters、actions
    tabTree,
    activeTabId,
    flattenedTabs,
    addTab,
    removeTab
  };
});
```

## 关键架构原则

### 单一职责原则
- 每个组件专注于单一功能
- 工具函数保持功能独立
- Store按业务领域划分

### 依赖注入模式
- 使用Vue的provide/inject
- Chrome API通过工具类封装
- 配置通过组合式API管理

### 响应式数据流
```typescript
// 数据流向：Chrome API -> Background Script -> Store -> Component
Chrome API Events → Background Script → Store Updates → Component Reactivity
```

### 错误处理策略
```typescript
// 统一错误处理
const handleChromeApiError = (error: chrome.runtime.LastError | undefined) => {
  if (error) {
    console.error('Chrome API Error:', error);
    // 错误上报和用户通知
  }
};
```

## 性能优化模式

### 虚拟滚动实现
```
components/VirtualList/
├── VirtualList.vue         # 虚拟滚动容器
├── VirtualItem.vue         # 虚拟列表项
└── useVirtualScroll.ts     # 虚拟滚动逻辑
```

### 防抖和节流
```typescript
// 搜索防抖
const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

// 滚动节流
const throttledScroll = throttle((event: Event) => {
  updateVisibleItems(event);
}, 16);
```

### 组件懒加载
```typescript
// 路由级懒加载
const ConfigPanel = defineAsyncComponent(() =>
  import('@/components/ConfigPanel/ConfigPanel.vue')
);
```

## 测试文件组织

```
tests/unit/                # 单元测试（24个测试文件，422个测试用例）
├── infrastructure.test.ts          # 基础架构测试
├── tree-components.test.ts         # 树组件测试
├── parent-child-relationship.test.ts # 父子关系测试
├── realtime-sync.test.ts           # 实时同步测试
├── collapse-expand.test.ts         # 折叠展开测试
├── collapse-persistence.test.ts    # 折叠状态持久化测试
├── drag-drop.test.ts               # 拖拽操作测试
├── drag-sync.test.ts               # 拖拽同步测试
├── smart-close.test.ts             # 智能关闭测试
├── close-undo.test.ts              # 撤销关闭测试
├── window-groups.test.ts           # 窗口分组测试
├── cross-window-operations.test.ts # 跨窗口操作测试
├── search-filter.test.ts           # 搜索过滤测试
├── state-filters.test.ts           # 状态过滤测试
├── tab-navigation.test.ts          # 标签页导航测试
├── url-navigation.test.ts          # URL导航测试
├── config-management.test.ts       # 配置管理测试
├── config-import-export.test.ts    # 配置导入导出测试
├── integration.test.ts             # 集成测试
├── service-worker.test.ts         # Service Worker测试
├── stores.test.ts                 # 状态管理测试
├── node-interactions.test.ts      # 节点交互测试
├── ux-optimization.test.ts        # 用户体验测试
└── vue-app.test.ts                # Vue应用测试
```

**测试覆盖情况**：
- ✅ **100%测试通过率**：422个测试用例全部通过
- ✅ **全面功能覆盖**：从基础架构到用户体验的完整测试
- ✅ **Chrome API集成测试**：Service Worker和扩展API测试
- ✅ **Vue组件测试**：Vue应用和组件功能测试

## 构建输出结构

```
dist/
├── manifest.json          # 扩展清单
├── background.js          # 后台脚本
├── sidepanel/             # 侧边栏文件
│   ├── index.html
│   └── assets/
├── icons/                 # 图标资源
└── _locales/              # 国际化文件(如需要)
```

这个结构支持模块化开发、清晰的关注点分离，并为Chrome扩展的特殊需求提供了良好的组织方式。