# 技术栈文档

## 架构概述

Chrome树状标签管理器采用现代化前端架构，基于Vue3框架开发Chrome扩展插件，实现高性能的标签页管理功能。

## 前端技术栈

### 核心框架
- **Vue 3.x**：采用Composition API的现代Vue框架
- **TypeScript**：类型安全的JavaScript开发
- **Vite**：快速的构建工具和开发服务器

### UI框架和组件
- **Vue组件化架构**：可复用的树状组件体系
- **CSS Modules**：组件级样式隔离
- **原生CSS**：利用Chrome扩展的样式优化

### 状态管理
- **Pinia**：Vue3推荐的状态管理库
- **组合式API**：基于Composition API的状态逻辑复用

### 构建和开发工具
- **Vite**：现代化构建工具
- **ESLint + Prettier**：代码质量和格式化
- **TypeScript**：类型检查和智能提示

## Chrome扩展技术

### 扩展架构
- **Manifest V3**：使用最新的Chrome扩展清单版本
- **Service Worker**：后台脚本处理标签页事件
- **Content Scripts**：页面内容脚本（如需要）
- **Popup/Side Panel**：侧边栏界面

### Chrome APIs
```javascript
// 核心使用的Chrome APIs
chrome.tabs.*        // 标签页管理API
chrome.windows.*     // 窗口管理API
chrome.storage.*     // 数据存储API
chrome.runtime.*     // 运行时通信API
chrome.sidePanel.*   // 侧边栏API
chrome.action.*      // 扩展图标操作API
```

### 权限要求
```json
{
  "permissions": [
    "tabs",           // 访问标签页信息
    "activeTab",      // 当前活跃标签页
    "storage",        // 本地存储
    "sidePanel"       // 侧边栏功能
  ]
}
```

## 数据管理

### 本地存储
- **chrome.storage.local**：用户配置和设置
- **chrome.storage.session**：会话期间的临时数据
- **IndexedDB**：大量数据的本地存储（如需要）

### 数据结构
```typescript
interface TabTreeNode {
  id: string;
  tabId: number;
  parentId?: string;
  children: TabTreeNode[];
  title: string;
  url: string;
  favicon?: string;
  isCollapsed: boolean;
  windowId: number;
}

interface UserConfig {
  panelWidth: number;
  defaultCollapsed: boolean;
  confirmThreshold: number;
  enableAutoClose: boolean;
  theme: 'light' | 'dark' | 'auto';
}
```

## 开发环境

### 必需工具
- **Node.js 16+**：JavaScript运行环境
- **npm/yarn**：包管理工具
- **Chrome浏览器**：开发和测试环境

### 开发命令
```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 测试
npm run test
```

### 目录结构
```
src/
├── manifest.json          # 扩展清单文件
├── background/             # 后台脚本
│   └── service-worker.ts
├── sidepanel/              # 侧边栏页面
│   ├── index.html
│   ├── main.ts
│   └── App.vue
├── components/             # Vue组件
│   ├── TreeView/
│   ├── SearchBar/
│   └── ConfigPanel/
├── stores/                 # Pinia状态管理
├── utils/                  # 工具函数
└── types/                  # TypeScript类型定义
```

## 性能优化

### 前端优化
- **虚拟滚动**：处理大量标签页的渲染优化
- **组件懒加载**：按需加载组件
- **防抖处理**：高频事件的性能优化
- **内存管理**：及时清理不必要的监听器

### Chrome扩展优化
- **事件监听优化**：避免过度的API调用
- **批量操作**：减少单个API调用的频率
- **缓存策略**：合理缓存标签页信息

## 调试和测试

### 开发调试
```bash
# Chrome扩展调试
chrome://extensions/
# 开启开发者模式，加载未打包的扩展

# Vue调试
# 使用Vue DevTools浏览器扩展
```

### 测试策略
- **单元测试**：使用Vitest进行组件和逻辑测试
- **集成测试**：Chrome API的集成测试
- **端到端测试**：使用Playwright进行完整流程测试

## 构建和部署

### 构建配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [
    vue(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      input: {
        sidepanel: 'src/sidepanel/index.html',
        background: 'src/background/service-worker.ts'
      }
    }
  }
});
```

### 部署流程
1. **开发构建**：`npm run build:dev`
2. **生产构建**：`npm run build`
3. **打包扩展**：生成.crx或.zip文件
4. **Chrome Web Store**：上传和发布流程

## 兼容性要求

### Chrome版本
- **最低版本**：Chrome 88+ (Manifest V3支持)
- **推荐版本**：Chrome 100+ (完整功能支持)
- **测试版本**：覆盖主流Chrome版本

### 操作系统
- **Windows 10/11**
- **macOS 10.15+**
- **Linux (主流发行版)**

## 环境变量

### 开发环境
```bash
# .env.development
VITE_ENV=development
VITE_API_DEBUG=true
```

### 生产环境
```bash
# .env.production
VITE_ENV=production
VITE_API_DEBUG=false
```

## 端口配置

### 开发服务器
- **开发端口**：5173 (Vite默认)
- **预览端口**：4173 (Vite preview)

### 扩展通信
- Chrome扩展使用chrome-extension://协议
- 本地存储通过Chrome Storage API访问、