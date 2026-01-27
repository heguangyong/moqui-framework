#!/bin/bash

# Claude代理API配置脚本 (使用q.quuvv.cn代理)
# 使用您提供的代理和API Token

API_TOKEN="sk-EmGDgO2eLJpiAWEG8ozHGjALxorl4QnECcTvxVH5OnAhwnxw"
PROXY_BASE="https://q.quuvv.cn"
CONFIG_FILE="runtime/conf/MoquiDevConf.xml"

echo "🔧 配置Claude代理 API..."

# 备份配置文件
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# 更新配置文件使用Claude
sed -i '' 's|marketplace.ai.provider.*|<default-property name="marketplace.ai.provider" value="CLAUDE"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.model.*|<default-property name="marketplace.ai.model" value="claude-3-5-sonnet-20241022"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.base.*|<default-property name="marketplace.ai.api.base" value="'$PROXY_BASE'"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.key.*|<default-property name="marketplace.ai.api.key" value="'$API_TOKEN'"/>|' "$CONFIG_FILE"

echo "✅ Claude代理配置完成"
echo ""
echo "📋 配置详情:"
echo "   Provider: CLAUDE"
echo "   Model: claude-3-5-sonnet-20241022"
echo "   API Base: $PROXY_BASE"
echo "   API Token: ${API_TOKEN:0:8}..."
echo ""
echo "⚠️  注意: 当前代理服务器负载较高，如果遇到负载限制错误，"
echo "   建议使用智谱AI等其他提供商: ./zhipu_setup.sh YOUR_API_KEY"
echo ""
echo "🔄 请重启Moqui服务器使配置生效"
echo "💬 然后发送Telegram消息测试智能对话功能"
