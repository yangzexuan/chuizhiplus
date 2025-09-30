# Chrome Tree Tab Manager 🌲

Chrome 浏览器树状标签管理器 - 以树状结构展示和管理标签页的浏览器扩展插件

## ✨ 功能特性

### ✅ 已实现的核心功能（422 测试全部通过）

- **树状结构展示** - 以层次化树状结构显示所有标签页
- **父子关系管理** - 自动识别和维护页面间的父子关系
- **实时同步** - 与 Chrome 标签页状态实时同步
- **折叠/展开** - 支持节点的折叠和展开，状态持久化
- **拖拽重组** - 拖拽节点重新组织层级关系（含循环依赖检测）
- **智能关闭** - 递归关闭子树，支持确认和撤销
- **跨窗口管理** - 多窗口标签页统一管理
- **搜索过滤** - 实时搜索标题和 URL，支持状态过滤
- **页面定位** - 自动定位和滚动到活跃标签页
- **配置管理** - 完整的配置系统，支持导入/导出/预览

### 🔧 开发中的功能

- **Vue 组件界面** - 完整的用户界面实现
- **虚拟滚动** - 高性能大列表渲染
- **主题系统** - 浅色/深色主题切换

## 🚀 快速开始

### 方式一：直接加载开发版本（最简单）

#### 1. 构建开发版本

```bash
cd /Users/yangzexuan/project/other/mywokr/chuizhiplus

# 运行开发构建脚本
./build-dev.sh
```

#### 2. 在 Chrome 中加载扩展

1. 打开 Chrome 浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 打开右上角的 **「开发者模式」** 开关
4. 点击 **「加载已解压的扩展程序」**
5. 选择目录：`/Users/yangzexuan/project/other/mywokr/chuizhiplus/dist-dev`

#### 3. 使用扩展

1. 点击 Chrome 工具栏中的扩展图标
2. 侧边面板会显示当前所有标签页
3. 点击标签页项可以激活对应的标签页

### 方式二：开发模式（用于调试）

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 运行测试
npm test

# 查看测试 UI
npm run test:ui
```

## 📊 项目状态

### 实现进度

- ✅ **核心功能**: 100% 完成（24/24 任务）
- ✅ **测试覆盖**: 422 个测试，100% 通过率
- ⚙️ **UI 界面**: 开发中
- 📋 **文档**: 完整的需求、设计、任务文档

### 测试统计

```
测试文件:  24 个
测试用例:  422 个
通过率:    100%
测试类型:  单元测试、集成测试、用户体验测试
```

运行测试：
```bash
npm test
```

## 🏗️ 技术架构

### 技术栈

- **前端框架**: Vue 3.x (Composition API)
- **状态管理**: Pinia
- **类型系统**: TypeScript
- **构建工具**: Vite
- **测试框架**: Vitest + @vue/test-utils
- **扩展平台**: Chrome Extension Manifest V3

### 核心组件

```
src/
├── background/          # Service Worker 后台脚本
│   └── service-worker.ts
├── stores/              # Pinia 状态管理
│   ├── tabs.ts         # 标签页树状态（1900+ 行）
│   ├── ui.ts           # UI 状态
│   └── config.ts       # 配置管理
├── types/               # TypeScript 类型定义
│   ├── tabs.ts
│   ├── config.ts
│   └── chrome.ts
├── components/          # Vue 组件
│   └── TreeView/
│       ├── TreeView.vue
│       └── TreeNode.vue
└── sidepanel/           # 侧边面板应用
    ├── index.html
    ├── main.ts
    └── App.vue
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage

# 查看测试 UI
npm run test:ui
```

### 测试文件结构

```
tests/unit/
├── infrastructure.test.ts          # 基础架构测试
├── tree-structure.test.ts          # 树状结构测试
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
├── url-navigation.test.ts          # URL 导航测试
├── config-management.test.ts       # 配置管理测试
├── config-import-export.test.ts    # 配置导入导出测试
├── integration.test.ts             # 集成测试
└── ux-optimization.test.ts         # 用户体验测试
```

## 📚 文档

### 项目文档

- **需求文档**: `.kiro/specs/chrome-tree-tab/requirements.md`
- **设计文档**: `.kiro/specs/chrome-tree-tab/design.md`
- **任务计划**: `.kiro/specs/chrome-tree-tab/tasks.md`
- **加载指南**: `CHROME_INSTALL_GUIDE.md`

### 需求概览

项目实现了 **10 个核心需求**：

1. **树状结构展示** - 左侧面板显示层次化标签页
2. **父子关系管理** - 自动识别和维护页面父子关系
3. **折叠展开功能** - 节点折叠/展开，状态记忆
4. **拖拽重组功能** - 拖拽节点调整层级，防止循环依赖
5. **智能关闭行为** - 递归关闭子树，支持确认和撤销
6. **跨窗口管理** - 多窗口标签页统一查看和操作
7. **搜索过滤功能** - 实时搜索和多条件过滤
8. **配置管理** - 完整的配置系统
9. **用户交互功能** - 节点点击、右键菜单、状态指示
10. **页面定位功能** - 自动滚动和高亮活跃标签页

所有需求都有对应的验收标准和测试验证。

## 🔍 验证核心功能

虽然 UI 界面还在开发中，但你可以通过以下方式验证核心功能：

### 1. 查看 Service Worker 日志

1. 打开 `chrome://extensions/`
2. 找到 "Chrome树状标签管理器"
3. 点击 "Service Worker" 旁边的链接
4. 打开 DevTools 控制台
5. 创建/关闭标签页，观察日志输出

### 2. 测试侧边面板

1. 点击扩展图标打开侧边面板
2. 可以看到当前所有标签页的列表
3. 点击标签页项可以激活对应的标签页
4. 创建新标签页会实时更新列表

### 3. 运行测试套件

```bash
# 运行所有测试，验证核心功能
npm test

# 查看具体的测试案例
npm run test:ui
```

## 🛠️ 开发建议

### 调试技巧

1. **Service Worker 调试**
   - 地址：`chrome://extensions/`
   - 点击扩展的 "Service Worker" 链接

2. **Side Panel 调试**
   - 右键侧边面板 → "检查"
   - 打开 DevTools

3. **查看 Store 状态**
   - 在 Side Panel 的控制台输入：
     ```javascript
     // 即将支持
     ```

### 下一步开发

1. **完善 Vue 组件**
   - 实现完整的 TreeView 和 TreeNode 组件
   - 添加拖拽交互
   - 实现虚拟滚动

2. **添加样式**
   - 实现主题系统（浅色/深色）
   - 优化布局和动画

3. **性能优化**
   - 虚拟滚动支持大量节点
   - 优化搜索性能

## 📝 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 🎯 路线图

- [x] 核心功能实现（已完成）
- [x] 测试覆盖（已完成）
- [ ] Vue 组件界面（进行中）
- [ ] 主题系统（规划中）
- [ ] Chrome Web Store 发布（待定）

---

**最后更新**: 2025-09-30  
**项目状态**: 核心功能完成 ✅ | UI 开发中 ⚙️  
**测试通过率**: 100% (422/422) ✅