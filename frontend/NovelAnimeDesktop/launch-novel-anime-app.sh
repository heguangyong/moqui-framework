#!/bin/bash

# 启动小说动漫生成器桌面应用

echo "🎬 启动小说动漫生成器桌面应用..."

# 检查是否在正确的目录
if [ ! -d "NovelAnimeDesktop" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 进入桌面应用目录
cd NovelAnimeDesktop

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查 Electron 是否可用
echo "🔍 检查 Electron..."
if ! npm list electron > /dev/null 2>&1; then
    echo "⚠️  Electron 未正确安装，重新安装..."
    npm install electron --save-dev
fi

# 启动应用
echo "🚀 启动应用..."
echo "📝 提示: 应用将在几秒钟后启动，请稍候..."

# 使用 concurrently 同时启动前端和 Electron
npm run dev

echo "✅ 应用已启动完成"