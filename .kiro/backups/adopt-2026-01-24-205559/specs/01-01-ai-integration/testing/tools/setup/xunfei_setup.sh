#!/bin/bash

# 讯飞星火配置脚本
# 获取密钥: https://console.xfyun.cn/

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "用法: $0 YOUR_APP_ID YOUR_API_KEY YOUR_API_SECRET"
    echo "获取密钥: https://console.xfyun.cn/"
    exit 1
fi

APP_ID="$1"
API_KEY="$2"
API_SECRET="$3"
CONFIG_FILE="runtime/conf/MoquiDevConf.xml"

echo "🔧 配置讯飞星火 API..."

# 备份配置文件
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# 更新配置文件
sed -i '' 's|marketplace.ai.provider.*|<default-property name="marketplace.ai.provider" value="XUNFEI"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.model.*|<default-property name="marketplace.ai.model" value="4.0Ultra"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.base.*|<default-property name="marketplace.ai.api.base" value="https://spark-api.xf-yun.com"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.key.*|<default-property name="marketplace.ai.api.key" value="'$API_KEY'"/>|' "$CONFIG_FILE"

# 添加讯飞专用配置
if ! grep -q "marketplace.ai.app.id" "$CONFIG_FILE"; then
    sed -i '' '/marketplace.ai.api.key/a\
    <default-property name="marketplace.ai.app.id" value="'$APP_ID'"/>\
    <default-property name="marketplace.ai.api.secret" value="'$API_SECRET'"/>
' "$CONFIG_FILE"
fi

echo "✅ 讯飞星火配置完成"
echo ""
echo "📋 配置详情:"
echo "   Provider: XUNFEI"
echo "   Model: 4.0Ultra"
echo "   API Base: https://spark-api.xf-yun.com"
echo "   App ID: ${APP_ID:0:8}..."
echo "   API Key: ${API_KEY:0:8}..."
echo "   API Secret: ${API_SECRET:0:8}..."
echo ""
echo "🔄 请重启Moqui服务器使配置生效"
echo "💬 然后发送Telegram消息测试智能对话功能"
