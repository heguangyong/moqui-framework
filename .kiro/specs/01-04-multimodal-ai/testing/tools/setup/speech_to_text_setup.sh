#!/bin/bash

# 语音转文字API配置脚本
# 支持多种语音识别服务：OpenAI Whisper、百度语音、阿里云等

echo "🎙️ 语音转文字功能配置"
echo "=========================="
echo ""

CONFIG_FILE="runtime/conf/MoquiDevConf.xml"

if [ "$#" -eq 0 ]; then
    echo "用法: $0 [服务类型] [API密钥]"
    echo ""
    echo "📋 支持的服务类型："
    echo "• openai     - OpenAI Whisper API (推荐，准确度高)"
    echo "• baidu      - 百度语音识别 (中文优化，性价比高)"
    echo "• aliyun     - 阿里云语音识别 (企业级稳定)"
    echo ""
    echo "💡 使用示例："
    echo "# 配置OpenAI Whisper (推荐)"
    echo "$0 openai sk-your-openai-api-key"
    echo ""
    echo "# 配置百度语音识别"
    echo "$0 baidu YOUR_BAIDU_API_KEY YOUR_BAIDU_SECRET_KEY"
    echo ""
    echo "# 配置阿里云语音识别"
    echo "$0 aliyun YOUR_ACCESS_KEY_ID YOUR_ACCESS_KEY_SECRET"
    echo ""
    echo "🔍 当前配置状态："

    # 检查OpenAI配置
    if grep -q "openai.api.key" "$CONFIG_FILE"; then
        echo "✅ OpenAI Whisper - 已配置"
    else
        echo "❌ OpenAI Whisper - 未配置"
    fi

    # 检查百度配置
    if grep -q "baidu.speech.api.key" "$CONFIG_FILE"; then
        echo "✅ 百度语音识别 - 已配置"
    else
        echo "❌ 百度语音识别 - 未配置"
    fi

    # 检查阿里云配置
    if grep -q "aliyun.speech.access.key.id" "$CONFIG_FILE"; then
        echo "✅ 阿里云语音识别 - 已配置"
    else
        echo "❌ 阿里云语音识别 - 未配置"
    fi

    echo ""
    echo "📖 API申请指南："
    echo "• OpenAI: https://platform.openai.com/api-keys"
    echo "• 百度AI: https://ai.baidu.com/tech/speech"
    echo "• 阿里云: https://www.aliyun.com/product/nls"
    echo ""
    exit 1
fi

SERVICE_TYPE="$1"
API_KEY="$2"
SECRET_KEY="$3"

# 备份配置文件
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.speech.$(date +%Y%m%d_%H%M%S)"

case "$SERVICE_TYPE" in
    "openai")
        if [ -z "$API_KEY" ]; then
            echo "❌ 错误: 请提供OpenAI API密钥"
            echo "用法: $0 openai sk-your-openai-api-key"
            exit 1
        fi

        echo "🔧 配置OpenAI Whisper API..."

        # 检查API密钥格式
        if [[ ! "$API_KEY" =~ ^sk- ]]; then
            echo "⚠️  警告: OpenAI API密钥格式可能不正确"
            echo "   正确格式应该以 'sk-' 开头"
        fi

        # 添加或更新OpenAI配置
        if grep -q "openai.api.key" "$CONFIG_FILE"; then
            sed -i '' "s|openai.api.key.*value=\"[^\"]*\"|openai.api.key\" value=\"$API_KEY\"|" "$CONFIG_FILE"
        else
            sed -i '' "/<\/default-property>/i\\
    <default-property name=\"openai.api.key\" value=\"$API_KEY\"/>\\
    <default-property name=\"speech.primary.provider\" value=\"openai\"/>\\
" "$CONFIG_FILE"
        fi

        echo "✅ OpenAI Whisper API配置完成"
        echo "   API密钥: ${API_KEY:0:15}..."
        echo "   服务特点: 高精度、多语言支持、实时识别"
        ;;

    "baidu")
        if [ -z "$API_KEY" ] || [ -z "$SECRET_KEY" ]; then
            echo "❌ 错误: 请提供百度语音识别的API Key和Secret Key"
            echo "用法: $0 baidu YOUR_API_KEY YOUR_SECRET_KEY"
            exit 1
        fi

        echo "🔧 配置百度语音识别API..."

        # 添加或更新百度配置
        if grep -q "baidu.speech.api.key" "$CONFIG_FILE"; then
            sed -i '' "s|baidu.speech.api.key.*value=\"[^\"]*\"|baidu.speech.api.key\" value=\"$API_KEY\"|" "$CONFIG_FILE"
            sed -i '' "s|baidu.speech.secret.key.*value=\"[^\"]*\"|baidu.speech.secret.key\" value=\"$SECRET_KEY\"|" "$CONFIG_FILE"
        else
            sed -i '' "/<\/default-property>/i\\
    <default-property name=\"baidu.speech.api.key\" value=\"$API_KEY\"/>\\
    <default-property name=\"baidu.speech.secret.key\" value=\"$SECRET_KEY\"/>\\
    <default-property name=\"speech.primary.provider\" value=\"baidu\"/>\\
" "$CONFIG_FILE"
        fi

        echo "✅ 百度语音识别API配置完成"
        echo "   API Key: ${API_KEY:0:15}..."
        echo "   Secret Key: ${SECRET_KEY:0:15}..."
        echo "   服务特点: 中文识别优化、成本低、速度快"
        ;;

    "aliyun")
        if [ -z "$API_KEY" ] || [ -z "$SECRET_KEY" ]; then
            echo "❌ 错误: 请提供阿里云的Access Key ID和Access Key Secret"
            echo "用法: $0 aliyun YOUR_ACCESS_KEY_ID YOUR_ACCESS_KEY_SECRET"
            exit 1
        fi

        echo "🔧 配置阿里云语音识别API..."

        # 添加或更新阿里云配置
        if grep -q "aliyun.speech.access.key.id" "$CONFIG_FILE"; then
            sed -i '' "s|aliyun.speech.access.key.id.*value=\"[^\"]*\"|aliyun.speech.access.key.id\" value=\"$API_KEY\"|" "$CONFIG_FILE"
            sed -i '' "s|aliyun.speech.access.key.secret.*value=\"[^\"]*\"|aliyun.speech.access.key.secret\" value=\"$SECRET_KEY\"|" "$CONFIG_FILE"
        else
            sed -i '' "/<\/default-property>/i\\
    <default-property name=\"aliyun.speech.access.key.id\" value=\"$API_KEY\"/>\\
    <default-property name=\"aliyun.speech.access.key.secret\" value=\"$SECRET_KEY\"/>\\
    <default-property name=\"speech.primary.provider\" value=\"aliyun\"/>\\
" "$CONFIG_FILE"
        fi

        echo "✅ 阿里云语音识别API配置完成"
        echo "   Access Key ID: ${API_KEY:0:15}..."
        echo "   Access Key Secret: ${SECRET_KEY:0:15}..."
        echo "   服务特点: 企业级稳定、阿里云生态集成"
        ;;

    *)
        echo "❌ 错误: 不支持的服务类型 '$SERVICE_TYPE'"
        echo "支持的类型: openai, baidu, aliyun"
        exit 1
        ;;
esac

echo ""
echo "📋 配置详情:"
echo "   配置文件: $CONFIG_FILE"
echo "   备份文件: $CONFIG_FILE.backup.speech.*"
echo ""
echo "🔄 请重启Moqui服务器使配置生效:"
echo "   1. 停止当前服务器 (Ctrl+C)"
echo "   2. 重新运行: ./gradlew run"
echo ""
echo "🎙️ 测试语音转文字功能:"
echo "   1. 在Telegram中向 @UpServceBot 发送语音消息"
echo "   2. 机器人将自动识别语音内容并回复"
echo "   3. 检查服务器日志确认识别结果"
echo ""
echo "📊 服务对比:"
echo "┌──────────────┬──────────┬──────────┬──────────┐"
echo "│ 服务商       │ 准确度   │ 中文支持 │ 成本     │"
echo "├──────────────┼──────────┼──────────┼──────────┤"
echo "│ OpenAI       │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐   │ 中等     │"
echo "│ 百度         │ ⭐⭐⭐⭐   │ ⭐⭐⭐⭐⭐ │ 低       │"
echo "│ 阿里云       │ ⭐⭐⭐⭐   │ ⭐⭐⭐⭐⭐ │ 中等     │"
echo "└──────────────┴──────────┴──────────┴──────────┘"
echo ""
echo "💡 推荐配置策略:"
echo "• 🎯 高精度需求: 配置OpenAI Whisper"
echo "• 💰 成本敏感: 配置百度语音识别"
echo "• 🏢 企业用户: 配置阿里云语音识别"
echo "• 🛡️ 最佳体验: 同时配置多个服务作为备选"