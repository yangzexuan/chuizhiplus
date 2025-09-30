# Chrome树状标签管理器

以树状结构展示和管理Chrome标签页的浏览器扩展插件。

## 功能特性

- 🌳 **树状结构展示** - 以层次化树状列表展示所有标签页
- 🔄 **自动父子关系** - 自动识别并维护页面间的父子关系
- 📁 **折叠/展开** - 支持节点的折叠展开，优化空间利用
- 🎯 **拖拽重组** - 通过拖拽操作重新组织标签页层级
- ⚡ **智能关闭** - 递归关闭整个子树，支持批量管理
- 🔍 **搜索过滤** - 实时搜索和多条件过滤
- 🪟 **跨窗口管理** - 统一管理多个浏览器窗口
- ⚙️ **高度自定义** - 丰富的配置选项

## 技术栈

- **Vue 3** - 采用Composition API的现代Vue框架
- **TypeScript** - 类型安全的开发体验
- **Pinia** - Vue3状态管理
- **Vite** - 快速的构建工具
- **Chrome Extension Manifest V3** - 最新的扩展规范

## 开发环境

### 必需工具

- Node.js 16+
- npm 或 yarn
- Chrome浏览器

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 开发模式

\`\`\`bash
npm run dev
\`\`\`

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

### 运行测试

\`\`\`bash
npm test
\`\`\`

### 类型检查

\`\`\`bash
npm run type-check
\`\`\`

## 在Chrome中加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 项目结构

\`\`\`
chuizhiplus/
├── src/
│   ├── background/         # 后台脚本
│   ├── sidepanel/         # 侧边栏页面
│   ├── components/        # Vue组件
│   ├── composables/       # 组合式API
│   ├── stores/           # Pinia状态管理
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript类型
│   └── manifest.json     # 扩展清单
├── tests/                # 测试文件
├── .kiro/               # Kiro规范文档
└── package.json         # 项目配置
\`\`\`

## 开发规范

本项目采用 Kiro Spec-Driven Development (SDD) 方法论进行开发：

- **需求文档**: `.kiro/specs/chrome-tree-tab/requirements.md`
- **设计文档**: `.kiro/specs/chrome-tree-tab/design.md`
- **任务列表**: `.kiro/specs/chrome-tree-tab/tasks.md`

## 测试驱动开发 (TDD)

项目严格遵循Kent Beck的TDD方法论：

1. **RED** - 编写失败的测试
2. **GREEN** - 编写最小代码使测试通过
3. **REFACTOR** - 重构和改进代码

## License

MIT

## 作者

Chrome树状标签管理器开发团队
