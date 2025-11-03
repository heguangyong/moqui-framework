#!/bin/bash

# Telegram Bot 配置脚本
# 帮助用户快速配置 Telegram Bot Token

echo "🤖 Telegram Bot 配置指南"
echo "=========================="
echo ""

if [ -z "$1" ]; then
    echo "用法: $0 YOUR_TELEGRAM_BOT_TOKEN"
    echo ""
    echo "📋 如果您还没有 Telegram Bot，请按以下步骤创建："
    echo ""
    echo "1. 打开 Telegram，搜索 @BotFather"
    echo "2. 发送 /newbot 命令"
    echo "3. 按提示输入机器人名称和用户名"
    echo "4. 复制获得的 Bot Token"
    echo "5. 运行: $0 YOUR_BOT_TOKEN"
    echo ""
    echo "🔍 检查当前配置状态："

    # 检查当前配置
    if grep -q 'mcp.telegram.bot.token.*value=""' runtime/component/moqui-mcp/MoquiConf.xml; then
        echo "❌ Telegram Bot Token 未配置"
    else
        current_token=$(grep 'mcp.telegram.bot.token' runtime/component/moqui-mcp/MoquiConf.xml | sed 's/.*value="\([^"]*\)".*/\1/')
        if [ -n "$current_token" ] && [ "$current_token" != "" ]; then
            echo "✅ 已配置 Token: ${current_token:0:15}..."
        else
            echo "❌ Telegram Bot Token 未配置"
        fi
    fi
    exit 1
fi

BOT_TOKEN="$1"
CONFIG_FILE="runtime/component/moqui-mcp/MoquiConf.xml"

echo "🔧 配置 Telegram Bot Token..."

# 验证 Token 格式 (基本检查)
if [[ ! "$BOT_TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
    echo "⚠️  警告: Bot Token 格式可能不正确"
    echo "   正确格式应该像: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
    echo ""
fi

# 备份配置文件
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# 更新配置文件
sed -i '' 's|mcp.telegram.bot.token.*value="[^"]*"|mcp.telegram.bot.token" value="'$BOT_TOKEN'"|' "$CONFIG_FILE"

echo "✅ Telegram Bot Token 已配置"
echo ""
echo "📋 配置详情:"
echo "   Bot Token: ${BOT_TOKEN:0:15}..."
echo "   配置文件: $CONFIG_FILE"
echo ""
echo "🔄 请重启 Moqui 服务器使配置生效："
echo "   1. 停止当前服务器 (Ctrl+C)"
echo "   2. 重新运行: ./gradlew run"
echo ""
echo "📱 测试步骤:"
echo "   1. 在 Telegram 中找到您的机器人"
echo "   2. 发送 /start 开始对话"
echo "   3. 发送任何消息测试智能回复"
echo ""
echo "🎯 现在您的机器人具备智谱AI GLM-4智能对话能力！"