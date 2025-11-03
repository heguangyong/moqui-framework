#!/bin/bash

# 通义千问配置脚本
# 获取API Key: https://bailian.console.aliyun.com/

if [ -z "$1" ]; then
    echo "用法: $0 YOUR_QWEN_API_KEY"
    echo "获取API Key: https://bailian.console.aliyun.com/"
    exit 1
fi

API_KEY="$1"
CONFIG_FILE="runtime/conf/MoquiDevConf.xml"

echo "🔧 配置通义千问 API..."

# 备份配置文件
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# 更新配置文件
sed -i '' 's|marketplace.ai.provider.*|<default-property name="marketplace.ai.provider" value="QWEN"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.model.*|<default-property name="marketplace.ai.model" value="qwen-plus"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.base.*|<default-property name="marketplace.ai.api.base" value="https://dashscope.aliyuncs.com"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.key.*|<default-property name="marketplace.ai.api.key" value="'$API_KEY'"/>|' "$CONFIG_FILE"

echo "✅ 通义千问配置完成"
echo ""
echo "📋 配置详情:"
echo "   Provider: QWEN"
echo "   Model: qwen-plus"
echo "   API Base: https://dashscope.aliyuncs.com"
echo "   API Key: ${API_KEY:0:8}..."
echo ""
echo "🔄 请重启Moqui服务器使配置生效"
echo "💬 然后发送Telegram消息测试智能对话功能"
