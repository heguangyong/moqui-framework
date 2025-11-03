#!/bin/bash

# 图片识别API配置脚本
# 支持多种图片识别服务：OpenAI Vision、百度图像识别、Google Vision、阿里云视觉智能

echo "📷 图片识别功能配置"
echo "====================="
echo ""

CONFIG_FILE="runtime/conf/MoquiDevConf.xml"

if [ "$#" -eq 0 ]; then
    echo "用法: $0 [服务类型] [API密钥]"
    echo ""
    echo "📋 支持的服务类型："
    echo "• openai-vision  - OpenAI Vision API (GPT-4V，最佳图片理解能力)"
    echo "• baidu-vision   - 百度图像识别 (中文场景优化，性价比高)"
    echo "• google-vision  - Google Cloud Vision API (企业级精度)"
    echo "• aliyun-vision  - 阿里云视觉智能 (企业级稳定)"
    echo ""
    echo "💡 使用示例："
    echo "# 配置OpenAI Vision (推荐)"
    echo "$0 openai-vision sk-your-openai-api-key"
    echo ""
    echo "# 配置百度图像识别"
    echo "$0 baidu-vision YOUR_BAIDU_API_KEY YOUR_BAIDU_SECRET_KEY"
    echo ""
    echo "# 配置Google Vision"
    echo "$0 google-vision YOUR_GOOGLE_API_KEY"
    echo ""
    echo "# 配置阿里云视觉智能"
    echo "$0 aliyun-vision YOUR_ACCESS_KEY_ID YOUR_ACCESS_KEY_SECRET"
    echo ""
    echo "🔍 当前配置状态："

    # 检查OpenAI Vision配置
    if grep -q "openai.api.key" "$CONFIG_FILE"; then
        echo "✅ OpenAI Vision - 已配置 (可用于图片识别)"
    else
        echo "❌ OpenAI Vision - 未配置"
    fi

    # 检查百度Vision配置
    if grep -q "baidu.vision.api.key" "$CONFIG_FILE"; then
        echo "✅ 百度图像识别 - 已配置"
    else
        echo "❌ 百度图像识别 - 未配置"
    fi

    # 检查Google Vision配置
    if grep -q "google.vision.api.key" "$CONFIG_FILE"; then
        echo "✅ Google Cloud Vision - 已配置"
    else
        echo "❌ Google Cloud Vision - 未配置"
    fi

    # 检查阿里云Vision配置
    if grep -q "aliyun.vision.access.key.id" "$CONFIG_FILE"; then
        echo "✅ 阿里云视觉智能 - 已配置"
    else
        echo "❌ 阿里云视觉智能 - 未配置"
    fi

    echo ""
    echo "📖 API申请指南："
    echo "• OpenAI Vision: https://platform.openai.com/api-keys"
    echo "• 百度AI: https://ai.baidu.com/tech/imagerecognition"
    echo "• Google Vision: https://cloud.google.com/vision/docs/setup"
    echo "• 阿里云视觉: https://www.aliyun.com/product/vision"
    echo ""
    echo "🎯 功能特点对比："
    echo "┌──────────────┬──────────┬──────────┬──────────┬──────────┐"
    echo "│ 服务商       │ 准确度   │ 中文支持 │ 成本     │ 特色功能 │"
    echo "├──────────────┼──────────┼──────────┼──────────┼──────────┤"
    echo "│ OpenAI       │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐   │ 中等     │ 智能对话 │"
    echo "│ 百度         │ ⭐⭐⭐⭐   │ ⭐⭐⭐⭐⭐ │ 低       │ 中文优化 │"
    echo "│ Google       │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐    │ 中等     │ 企业级   │"
    echo "│ 阿里云       │ ⭐⭐⭐⭐   │ ⭐⭐⭐⭐⭐ │ 中等     │ 生态集成 │"
    echo "└──────────────┴──────────┴──────────┴──────────┴──────────┘"
    echo ""
    exit 1
fi

SERVICE_TYPE="$1"
API_KEY="$2"
SECRET_KEY="$3"

# 备份配置文件
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.vision.$(date +%Y%m%d_%H%M%S)"

case "$SERVICE_TYPE" in
    "openai-vision")
        if [ -z "$API_KEY" ]; then
            echo "❌ 错误: 请提供OpenAI API密钥"
            echo "用法: $0 openai-vision sk-your-openai-api-key"
            exit 1
        fi

        echo "🔧 配置OpenAI Vision API..."

        # 检查API密钥格式
        if [[ ! "$API_KEY" =~ ^sk- ]]; then
            echo "⚠️  警告: OpenAI API密钥格式可能不正确"
            echo "   正确格式应该以 'sk-' 开头"
        fi

        # 添加或更新OpenAI配置 (复用语音转文字的OpenAI配置)
        if grep -q "openai.api.key" "$CONFIG_FILE"; then
            echo "✅ OpenAI API密钥已存在，将用于Vision功能"
        else
            sed -i '' "/<\/default-property>/i\\
    <default-property name=\"openai.api.key\" value=\"$API_KEY\"/>\\
    <default-property name=\"vision.primary.provider\" value=\"openai\"/>\\
" "$CONFIG_FILE"
        fi

        echo "✅ OpenAI Vision API配置完成"
        echo "   API密钥: ${API_KEY:0:15}..."
        echo "   服务特点: GPT-4V模型、智能图片理解、支持对话式分析"
        ;;

    "baidu-vision")
        if [ -z "$API_KEY" ] || [ -z "$SECRET_KEY" ]; then
            echo "❌ 错误: 请提供百度图像识别的API Key和Secret Key"
            echo "用法: $0 baidu-vision YOUR_API_KEY YOUR_SECRET_KEY"
            exit 1
        fi

        echo "🔧 配置百度图像识别API..."

        # 添加或更新百度Vision配置
        if grep -q "baidu.vision.api.key" "$CONFIG_FILE"; then
            sed -i '' "s|baidu.vision.api.key.*value=\"[^\"]*\"|baidu.vision.api.key\" value=\"$API_KEY\"|" "$CONFIG_FILE"
            sed -i '' "s|baidu.vision.secret.key.*value=\"[^\"]*\"|baidu.vision.secret.key\" value=\"$SECRET_KEY\"|" "$CONFIG_FILE"
        else
            sed -i '' "/<\/default-property>/i\\
    <default-property name=\"baidu.vision.api.key\" value=\"$API_KEY\"/>\\
    <default-property name=\"baidu.vision.secret.key\" value=\"$SECRET_KEY\"/>\\
    <default-property name=\"vision.primary.provider\" value=\"baidu\"/>\\
" "$CONFIG_FILE"
        fi

        echo "✅ 百度图像识别API配置完成"
        echo "   API Key: ${API_KEY:0:15}..."
        echo "   Secret Key: ${SECRET_KEY:0:15}..."
        echo "   服务特点: 中文场景优化、通用物体识别、文字识别"
        ;;

    "google-vision")
        if [ -z "$API_KEY" ]; then
            echo "❌ 错误: 请提供Google Cloud Vision API密钥"
            echo "用法: $0 google-vision YOUR_GOOGLE_API_KEY"
            exit 1
        fi

        echo "🔧 配置Google Cloud Vision API..."

        # 添加或更新Google Vision配置
        if grep -q "google.vision.api.key" "$CONFIG_FILE"; then
            sed -i '' "s|google.vision.api.key.*value=\"[^\"]*\"|google.vision.api.key\" value=\"$API_KEY\"|" "$CONFIG_FILE"
        else
            sed -i '' "/<\/default-property>/i\\
    <default-property name=\"google.vision.api.key\" value=\"$API_KEY\"/>\\
    <default-property name=\"vision.primary.provider\" value=\"google\"/>\\
" "$CONFIG_FILE"
        fi

        echo "✅ Google Cloud Vision API配置完成"
        echo "   API Key: ${API_KEY:0:15}..."
        echo "   服务特点: 企业级精度、标签检测、文字识别、物体定位"
        ;;

    "aliyun-vision")
        if [ -z "$API_KEY" ] || [ -z "$SECRET_KEY" ]; then
            echo "❌ 错误: 请提供阿里云的Access Key ID和Access Key Secret"
            echo "用法: $0 aliyun-vision YOUR_ACCESS_KEY_ID YOUR_ACCESS_KEY_SECRET"
            exit 1
        fi

        echo "🔧 配置阿里云视觉智能API..."

        # 添加或更新阿里云Vision配置
        if grep -q "aliyun.vision.access.key.id" "$CONFIG_FILE"; then
            sed -i '' "s|aliyun.vision.access.key.id.*value=\"[^\"]*\"|aliyun.vision.access.key.id\" value=\"$API_KEY\"|" "$CONFIG_FILE"
            sed -i '' "s|aliyun.vision.access.key.secret.*value=\"[^\"]*\"|aliyun.vision.access.key.secret\" value=\"$SECRET_KEY\"|" "$CONFIG_FILE"
        else
            sed -i '' "/<\/default-property>/i\\
    <default-property name=\"aliyun.vision.access.key.id\" value=\"$API_KEY\"/>\\
    <default-property name=\"aliyun.vision.access.key.secret\" value=\"$SECRET_KEY\"/>\\
    <default-property name=\"vision.primary.provider\" value=\"aliyun\"/>\\
" "$CONFIG_FILE"
        fi

        echo "✅ 阿里云视觉智能API配置完成"
        echo "   Access Key ID: ${API_KEY:0:15}..."
        echo "   Access Key Secret: ${SECRET_KEY:0:15}..."
        echo "   服务特点: 企业级稳定、阿里云生态集成、实时处理"
        ;;

    *)
        echo "❌ 错误: 不支持的服务类型 '$SERVICE_TYPE'"
        echo "支持的类型: openai-vision, baidu-vision, google-vision, aliyun-vision"
        exit 1
        ;;
esac

echo ""
echo "📋 配置详情:"
echo "   配置文件: $CONFIG_FILE"
echo "   备份文件: $CONFIG_FILE.backup.vision.*"
echo ""
echo "🔄 请重启Moqui服务器使配置生效:"
echo "   1. 停止当前服务器 (Ctrl+C)"
echo "   2. 重新运行: ./gradlew run"
echo ""
echo "📷 测试图片识别功能:"
echo "   1. 在Telegram中向 @UpServceBot 发送图片"
echo "   2. 机器人将自动识别图片内容并回复"
echo "   3. 检查服务器日志确认识别结果"
echo ""
echo "🎯 图片识别应用场景:"
echo "• 🏭 **产品展示识别**: 自动识别产品类型、规格、质量"
echo "• 📋 **文档信息提取**: 识别价格单、规格表、合同内容"
echo "• 🔍 **质量检测分析**: 分析产品质量、缺陷检测"
echo "• 📊 **数据统计支持**: 基于图片内容生成统计报告"
echo ""
echo "💡 最佳实践建议:"
echo "• 🔄 **多API备选**: 同时配置多个服务提高识别成功率"
echo "• 🎯 **场景选择**: OpenAI适合智能对话，百度适合中文内容"
echo "• 💰 **成本控制**: 百度图像识别成本最低，适合大量使用"
echo "• 🛡️ **隐私安全**: 企业敏感数据建议使用阿里云或自建服务"