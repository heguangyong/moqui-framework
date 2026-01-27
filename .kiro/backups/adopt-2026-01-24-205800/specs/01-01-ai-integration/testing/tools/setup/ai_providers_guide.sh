#!/bin/bash

echo "🤖 Moqui智能供需平台 - 大模型配置指南"
echo "==========================================="
echo ""

echo "📋 当前支持的大模型提供商："
echo "1. 智谱AI GLM-4 (推荐) - 中文优化，成本最低"
echo "2. OpenAI GPT-4o-mini - 国际领先"
echo "3. Claude-3.5-Sonnet - 高质量对话"
echo "4. 通义千问 - 阿里云"
echo "5. 百度文心一言 - 百度AI"
echo "6. 讯飞星火 - 科大讯飞"
echo ""

echo "💡 快速配置方案："
echo ""

echo "方案1: 智谱AI (推荐中文场景)"
echo "-------------------------------"
echo "1. 访问: https://open.bigmodel.cn/"
echo "2. 注册/登录并创建API密钥"
echo "3. 运行配置命令:"
echo "   ./zhipu_setup.sh YOUR_API_KEY"
echo ""

echo "方案2: OpenAI GPT (国际标准)"
echo "-------------------------------"
echo "1. 访问: https://platform.openai.com/api-keys"
echo "2. 创建API密钥"
echo "3. 运行配置命令:"
echo "   ./openai_setup.sh YOUR_API_KEY"
echo ""

echo "方案3: Claude (对话质量最高)"
echo "-------------------------------"
echo "1. 访问: https://console.anthropic.com/"
echo "2. 创建API密钥"
echo "3. 运行配置命令:"
echo "   ./claude_api_setup.sh YOUR_API_KEY"
echo ""

echo "🔧 配置后验证步骤："
echo "1. 重启Moqui服务器"
echo "2. 发送Telegram消息测试"
echo "3. 查看日志确认API调用成功"
echo ""

echo "💰 成本对比 (每百万字符):"
echo "- 智谱AI GLM-4: ~1-5元 (最便宜)"
echo "- 通义千问: ~2-8元"
echo "- OpenAI GPT-4o-mini: ~$0.15-0.60 (~1-4元)"
echo "- Claude-3.5-Sonnet: ~$3-15 (~20-100元)"
echo ""

echo "🎯 建议选择智谱AI，中文理解优秀且成本最低"
echo ""

read -p "请选择配置方案 [1-6]: " choice

case $choice in
    1)
        echo "配置智谱AI..."
        read -p "请输入智谱AI API密钥: " api_key
        if [ -n "$api_key" ]; then
            ./zhipu_setup.sh "$api_key"
        else
            echo "API密钥不能为空"
        fi
        ;;
    2)
        echo "配置OpenAI GPT..."
        read -p "请输入OpenAI API密钥: " api_key
        if [ -n "$api_key" ]; then
            ./openai_setup.sh "$api_key"
        else
            echo "API密钥不能为空"
        fi
        ;;
    3)
        echo "配置Claude..."
        read -p "请输入Claude API密钥: " api_key
        if [ -n "$api_key" ]; then
            ./claude_api_setup.sh "$api_key"
        else
            echo "API密钥不能为空"
        fi
        ;;
    4)
        echo "配置通义千问..."
        read -p "请输入通义千问API密钥: " api_key
        if [ -n "$api_key" ]; then
            ./qwen_setup.sh "$api_key"
        else
            echo "API密钥不能为空"
        fi
        ;;
    5)
        echo "配置百度文心一言..."
        read -p "请输入百度API Key: " api_key
        read -p "请输入百度Secret Key: " secret_key
        if [ -n "$api_key" ] && [ -n "$secret_key" ]; then
            ./baidu_setup.sh "$api_key" "$secret_key"
        else
            echo "API密钥和Secret密钥都不能为空"
        fi
        ;;
    6)
        echo "配置讯飞星火..."
        read -p "请输入讯飞APP ID: " app_id
        read -p "请输入讯飞API Key: " api_key
        read -p "请输入讯飞API Secret: " api_secret
        if [ -n "$app_id" ] && [ -n "$api_key" ] && [ -n "$api_secret" ]; then
            ./xunfei_setup.sh "$app_id" "$api_key" "$api_secret"
        else
            echo "所有参数都不能为空"
        fi
        ;;
    *)
        echo "无效选择，请重新运行脚本"
        ;;
esac