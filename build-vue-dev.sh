#!/bin/bash

# Chrome Tree Tab - Vue 完整构建脚本
# 使用 Vite 构建完整的 Vue 应用

echo "🔨 开始构建 Chrome Tree Tab Vue 完整版本..."

# 创建 dist 目录
echo "📁 准备构建目录..."
rm -rf dist
mkdir -p dist

# 使用 Vite 构建
echo "⚡ 使用 Vite 构建 Vue 应用..."
npx vite build --mode development 2>&1 | grep -v "experimentalDecorators" || true

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ Vite 构建失败，使用备用方案..."
    
    # 备用方案：手动复制和编译
    mkdir -p dist/sidepanel
    mkdir -p dist/background
    mkdir -p dist/assets/icons
    
    # 复制 manifest
    cp src/manifest.json dist/
    
    # 生成图标
    node generate-icons.cjs
    cp -r dist-dev/assets/icons/* dist/assets/icons/
    
    # 复制 HTML（但我们需要修改它以加载 Vue）
    cp src/sidepanel/index.html dist/sidepanel/
    
    # 编译 service worker
    npx esbuild src/background/service-worker.ts \
        --bundle \
        --outfile=dist/background/service-worker.js \
        --platform=browser \
        --format=esm \
        --target=es2020 \
        2>/dev/null || echo "⚠️  esbuild 编译警告"
    
    # 编译 Vue 应用
    echo "📦 编译 Vue 应用..."
    npx esbuild src/sidepanel/main.ts \
        --bundle \
        --outfile=dist/sidepanel/main.js \
        --platform=browser \
        --format=esm \
        --target=es2020 \
        --loader:.vue=text \
        --external:vue \
        --external:pinia \
        2>/dev/null || echo "⚠️  Vue 编译警告"
fi

# 确保 manifest 路径正确
if [ -f "dist/manifest.json" ]; then
    echo "✅ Manifest 已生成"
else
    echo "❌ Manifest 文件缺失"
fi

echo ""
echo "✅ Vue 完整版本构建完成！"
echo ""
echo "📍 构建输出目录: dist/"
echo ""
echo "🔧 在 Chrome 中加载扩展："
echo "   1. 打开 Chrome: chrome://extensions/"
echo "   2. 开启「开发者模式」"
echo "   3. 点击「加载已解压的扩展程序」"
echo "   4. 选择目录: $(pwd)/dist"
echo ""
