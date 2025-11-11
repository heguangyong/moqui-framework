#!/bin/bash

echo "🚀 GitHub 代码推送脚本"
echo "========================="

echo "📝 当前 Git 状态："
git status --porcelain

echo ""
echo "📋 待推送的提交："
git log --oneline -5

echo ""
echo "🔍 检查远程仓库配置："
git remote -v

echo ""
echo "🚀 开始推送过程..."

echo ""
echo "1️⃣ 推送主项目代码到 GitHub..."
git push origin master
if [ $? -eq 0 ]; then
    echo "✅ 主项目代码推送成功！"
    MAIN_PUSH_SUCCESS=1
else
    echo "❌ 主项目代码推送失败！"
    echo "请确保 GitHub 认证已正确配置"
    echo "运行 ./setup-github-auth.sh 查看认证配置说明"
    exit 1
fi

echo ""
echo "2️⃣ 推送 runtime 子模块到 GitHub..."
cd runtime
git push origin master
if [ $? -eq 0 ]; then
    echo "✅ runtime 子模块推送成功！"
    RUNTIME_PUSH_SUCCESS=1
else
    echo "❌ runtime 子模块推送失败！"
    echo "可能需要配置 runtime 子模块的远程仓库"
fi
cd ..

echo ""
echo "🎉 推送结果总结："
if [ "$MAIN_PUSH_SUCCESS" = "1" ]; then
    echo "✅ 主项目代码：成功推送到 GitHub"
else
    echo "❌ 主项目代码：推送失败"
fi

if [ "$RUNTIME_PUSH_SUCCESS" = "1" ]; then
    echo "✅ runtime 子模块：成功推送到 GitHub"
else
    echo "⚠️  runtime 子模块：推送失败（可能需要额外配置）"
fi

echo ""
echo "📍 GitHub 仓库链接："
echo "https://github.com/heguangyong/moqui-framework"

echo ""
echo "🔗 查看最新提交："
echo "https://github.com/heguangyong/moqui-framework/commits/master"

if [ "$MAIN_PUSH_SUCCESS" = "1" ]; then
    echo ""
    echo "🎯 统一 REST API 实现项目已成功提交到 GitHub！"
    echo "包含以下完成的功能："
    echo "- ✅ Marketplace API (36+ 端点，179KB Swagger 文档)"
    echo "- ✅ Mantle USL API (100+ 端点，完整 ERP 功能)"
    echo "- ✅ MinIO API (完整对象存储功能)"
    echo "- ✅ MCP AI Assistant API (16+ 端点，60KB Swagger 文档)"
    echo "- ✅ 统一响应格式和错误处理机制"
    echo "- ✅ 跨组件 API 兼容性验证"
fi