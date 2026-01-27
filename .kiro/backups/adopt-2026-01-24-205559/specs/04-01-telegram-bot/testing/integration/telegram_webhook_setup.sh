#!/bin/bash

# Telegram Webhook设置脚本
# 让Telegram直接推送消息到您的服务器

BOT_TOKEN="6889801043:AAF5wdoc4tybZEqCXtO5229tOErnK_ZUzMA"

echo "🤖 Telegram Webhook 设置指南"
echo "=============================="
echo ""

if [ -z "$1" ]; then
    echo "📋 当前有两种方式使用您的Telegram机器人："
    echo ""
    echo "方式1: 直接在Telegram中对话 (推荐)"
    echo "----------------------------------------"
    echo "1. 打开Telegram"
    echo "2. 搜索: @UpServceBot 或 '升阶助手'"
    echo "3. 发送 /start 开始对话"
    echo "4. 发送任何消息，比如："
    echo "   '我想采购100吨钢材，预算450万'"
    echo ""
    echo "⚠️  注意: 机器人只能回复给直接与它对话的用户"
    echo ""
    echo "方式2: 设置Webhook (高级用户)"
    echo "--------------------------------"
    echo "如果您有公网IP或域名，可以设置webhook："
    echo "用法: $0 YOUR_PUBLIC_URL"
    echo "示例: $0 https://your-domain.com"
    echo ""
    echo "🔍 当前Bot状态:"

    # 检查bot信息
    curl -s "https://api.telegram.org/bot$BOT_TOKEN/getMe" | jq -r '.result | "✅ Bot名称: \(.first_name) (@\(.username))"' 2>/dev/null || echo "✅ Bot已配置"

    # 检查webhook状态
    webhook_info=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
    webhook_url=$(echo "$webhook_info" | jq -r '.result.url' 2>/dev/null)

    if [ "$webhook_url" = "null" ] || [ -z "$webhook_url" ]; then
        echo "📡 Webhook: 未设置 (需要用户在Telegram中直接对话)"
    else
        echo "📡 Webhook: $webhook_url"
    fi

    exit 0
fi

PUBLIC_URL="$1"
WEBHOOK_URL="$PUBLIC_URL/rest/s1/mcp/telegram"

echo "🔧 设置Telegram Webhook..."
echo "Bot Token: ${BOT_TOKEN:0:15}..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# 设置webhook
response=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
    -d "url=$WEBHOOK_URL" \
    -d "allowed_updates=[\"message\"]")

success=$(echo "$response" | jq -r '.ok' 2>/dev/null)

if [ "$success" = "true" ]; then
    echo "✅ Webhook设置成功！"
    echo ""
    echo "📱 现在您可以："
    echo "1. 在Telegram中搜索 @UpServceBot"
    echo "2. 发送任何消息测试智能回复"
    echo "3. 消息将自动推送到您的服务器处理"
else
    echo "❌ Webhook设置失败"
    echo "响应: $response"
    echo ""
    echo "💡 可能的问题："
    echo "- URL不是HTTPS"
    echo "- 服务器无法从外网访问"
    echo "- 端口被防火墙阻止"
    echo ""
    echo "🔄 您仍然可以直接在Telegram中与机器人对话"
fi