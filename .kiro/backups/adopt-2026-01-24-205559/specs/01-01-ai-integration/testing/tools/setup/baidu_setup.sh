#!/bin/bash

# 百度文心一言配置脚本
# 获取API Key: https://cloud.baidu.com/product/wenxinworkshop

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "用法: $0 YOUR_API_KEY YOUR_SECRET_KEY"
    echo "获取密钥: https://cloud.baidu.com/product/wenxinworkshop"
    exit 1
fi

API_KEY="$1"
SECRET_KEY="$2"
CONFIG_FILE="runtime/conf/MoquiDevConf.xml"

echo "🔧 配置百度文心一言 API..."

# 备份配置文件
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# 更新配置文件
sed -i '' 's|marketplace.ai.provider.*|<default-property name="marketplace.ai.provider" value="BAIDU"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.model.*|<default-property name="marketplace.ai.model" value="ERNIE-4.0-8K"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.base.*|<default-property name="marketplace.ai.api.base" value="https://aip.baidubce.com"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.key.*|<default-property name="marketplace.ai.api.key" value="'$API_KEY'"/>|' "$CONFIG_FILE"

# 添加百度专用的Secret Key配置
if ! grep -q "marketplace.ai.secret.key" "$CONFIG_FILE"; then
    sed -i '' '/marketplace.ai.api.key/a\
    <default-property name="marketplace.ai.secret.key" value="'$SECRET_KEY'"/>
' "$CONFIG_FILE"
fi

echo "✅ 百度文心一言配置完成"
echo ""
echo "📋 配置详情:"
echo "   Provider: BAIDU"
echo "   Model: ERNIE-4.0-8K"
echo "   API Base: https://aip.baidubce.com"
echo "   API Key: ${API_KEY:0:8}..."
echo "   Secret Key: ${SECRET_KEY:0:8}..."
echo ""
echo "🔄 请重启Moqui服务器使配置生效"
echo "💬 然后发送Telegram消息测试智能对话功能"
