# 项目结构文档

## 根目录组织

```
chuizhiplus/
├── .kiro/                    # Kiro规范驱动开发目录
│   ├── steering/            # 项目指导文档
│   └── specs/               # 功能规范文档
├── .claude/                 # Claude Code配置
│   ├── commands/            # 自定义命令
│   └── settings.local.json  # 本地设置
├── src/                     # 源代码目录
├── dist/                    # 构建输出目录
├── tests/                   # 测试文件
├── docs/                    # 项目文档
├── public/                  # 静态资源
├── package.json             # 项目依赖和脚本
├── tsconfig.json            # TypeScript配置
├── vite.config.ts           # Vite构建配置
├── .eslintrc.js             # ESLint配置
├── .prettierrc              # Prettier配置
├── CLAUDE.md                # Claude Code项目指令
└── README.md                # 项目说明文档
```

## 源代码结构 (src/)

```
src/
├── manifest.json            # Chrome扩展清单文件
├── background/              # 后台脚本
│   ├── service-worker.ts    # 主服务工作线程
│   ├── tab-manager.ts       # 标签页管理逻辑
│   ├── window-manager.ts    # 窗口管理逻辑
│   └── storage-manager.ts   # 存储管理逻辑
├── sidepanel/               # 侧边栏页面
│   ├── index.html          # 侧边栏HTML入口
│   ├── main.ts             # 侧边栏Vue应用入口
│   ├── App.vue             # 根组件
│   └── styles/             # 侧边栏样式
├── components/              # Vue组件库
│   ├── TreeView/           # 树状视图组件
│   ├── SearchBar/          # 搜索栏组件
│   ├── ContextMenu/        # 右键菜单组件
│   ├── ConfigPanel/        # 配置面板组件
│   └── common/             # 通用组件
├── composables/             # Vue组合式API
│   ├── useTabTree.ts       # 标签页树状逻辑
│   ├── useDragDrop.ts      # 拖拽功能逻辑
│   ├── useSearch.ts        # 搜索功能逻辑
│   └── useConfig.ts        # 配置管理逻辑
├── stores/                  # Pinia状态管理
│   ├── index.ts            # Store入口
│   ├── tabs.ts             # 标签页状态
│   ├── config.ts           # 配置状态
│   └── ui.ts               # UI状态
├── utils/                   # 工具函数
│   ├── chrome-api.ts       # Chrome API封装
│   ├── tree-operations.ts  # 树操作工具
│   ├── debounce.ts         # 防抖函数
│   └── constants.ts        # 常量定义
├── types/                   # TypeScript类型定义
│   ├── tabs.ts             # 标签页相关类型
│   ├── config.ts           # 配置相关类型
│   └── chrome.ts           # Chrome API类型扩展
└── assets/                  # 静态资源
    ├── icons/              # 图标资源
    ├── images/             # 图片资源
    └── styles/             # 全局样式
```

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
tests/
├── unit/                   # 单元测试
│   ├── components/        # 组件测试
│   ├── composables/       # 组合式API测试
│   └── utils/             # 工具函数测试
├── integration/           # 集成测试
│   ├── chrome-api/        # Chrome API集成
│   └── stores/            # 状态管理集成
└── e2e/                   # 端到端测试
    ├── scenarios/         # 测试场景
    └── fixtures/          # 测试数据
```

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