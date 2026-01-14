#!/bin/bash
# Telegram Bot 菜单重组和命令设置脚本

echo "🔄 重新组织Telegram Bot菜单结构"
echo "================================="

BOT_TOKEN="6889801043:AAF5wdoc4tybZEqCXtO5229tOErnK_ZUzMA"

# 1. 设置Bot Commands（用户可以在输入框看到命令提示）
echo "📋 设置Telegram Bot Commands..."

COMMANDS='[
  {"command": "start", "description": "🏠 主菜单 - 显示所有功能"},
  {"command": "menu", "description": "📋 功能菜单 - 系统功能导航"},
  {"command": "econowatch", "description": "📰 经济观察 - 资讯聚合分析"},
  {"command": "marketplace", "description": "🤝 供需匹配 - 智能撮合平台"},
  {"command": "projects", "description": "📊 项目管理 - HiveMind工作台"},
  {"command": "mcp", "description": "🤖 MCP控制台 - AI服务管理"},
  {"command": "tools", "description": "🔧 系统工具 - 开发工具集"},
  {"command": "storage", "description": "💾 对象存储 - 文件管理"},
  {"command": "news", "description": "📈 今日资讯 - 50篇精选头条"},
  {"command": "supply", "description": "📦 发布供应 - 供应信息管理"},
  {"command": "demand", "description": "🛒 发布需求 - 需求信息管理"},
  {"command": "match", "description": "⚡ 智能匹配 - AI驱动撮合"},
  {"command": "analyze", "description": "🎯 AI分析 - 多模态智能处理"},
  {"command": "status", "description": "📊 系统状态 - 服务健康检查"},
  {"command": "help", "description": "❓ 帮助信息 - 使用指南"}
]'

curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setMyCommands" \
  --data-urlencode "commands=$COMMANDS" | jq '.ok'

if [ $? -eq 0 ]; then
    echo "✅ Telegram Bot Commands 设置成功"
else
    echo "❌ Commands 设置失败"
fi

echo ""
echo "🎯 新的菜单结构设计："
echo ""
echo "【主菜单】 /start"
echo "├── 🏢 业务应用"
echo "│   ├── 📰 /econowatch - 经济观察者"
echo "│   │   ├── /news - 今日资讯 (50篇精选)"
echo "│   │   ├── /categories - 资讯分类"
echo "│   │   └── /trending - 热门趋势"
echo "│   ├── 🤝 /marketplace - 供需匹配"
echo "│   │   ├── /supply - 发布供应"
echo "│   │   ├── /demand - 发布需求"
echo "│   │   └── /match - 智能匹配"
echo "│   └── 📊 /projects - 项目管理"
echo "│       ├── 执行端 - 任务跟踪"
echo "│       └── 管理端 - 项目分析"
echo "├── 🤖 技术服务"
echo "│   ├── /mcp - MCP控制台"
echo "│   ├── /tools - 系统工具"
echo "│   └── /storage - 对象存储"
echo "├── 🎯 AI功能"
echo "│   ├── /analyze - 智能分析"
echo "│   ├── 语音识别 (发送语音)"
echo "│   └── 图像识别 (发送图片)"
echo "└── ℹ️ 系统信息"
echo "    ├── /status - 系统状态"
echo "    ├── /help - 帮助信息"
echo "    └── /menu - 功能导航"

echo ""
echo "📱 用户体验改进："
echo "• 在Telegram输入框输入 '/' 可看到所有命令"
echo "• 每个功能有清晰的中文说明"
echo "• 支持emoji图标识别"
echo "• 层次化的功能组织"

echo ""
echo "✅ 菜单重组完成！"
echo "现在用户可以："
echo "1. 输入 / 查看所有可用命令"
echo "2. 使用 /start 查看完整主菜单"
echo "3. 直接使用功能命令，如 /news、/supply 等"