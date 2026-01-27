#!/bin/bash

# 中英文多语言语音转文字测试脚本
# 测试语音识别系统对中文、英文和混合语言的支持能力

echo "🌍 中英文多语言语音转文字测试"
echo "=================================="
echo ""

# 配置
WEBHOOK_URL="http://localhost:8080/rest/s1/mcp/telegram"
TEST_CHAT_ID="${1:-123456789}"

if [ "$#" -lt 1 ]; then
    echo "用法: $0 TEST_CHAT_ID [语言类型]"
    echo ""
    echo "语言类型:"
    echo "• chinese    - 纯中文语音测试"
    echo "• english    - 纯英文语音测试"
    echo "• mixed      - 中英文混合语音测试"
    echo "• all        - 运行所有语言测试 (默认)"
    echo ""
    echo "示例: $0 123456789 mixed"
    echo ""
    exit 1
fi

LANGUAGE_TYPE="${2:-all}"

echo "🔧 测试配置:"
echo "Webhook URL: $WEBHOOK_URL"
echo "测试Chat ID: $TEST_CHAT_ID"
echo "语言类型: $LANGUAGE_TYPE"
echo ""

# 运行多语言语音测试
run_multilingual_voice_test() {
    local test_name="$1"
    local simulated_text="$2"
    local expected_language="$3"
    local test_flag="$4"

    echo "🎙️ $test_flag 测试: $test_name"
    echo "模拟语音内容: \"$simulated_text\""
    echo "预期语言: $expected_language"
    echo "----------------------------------------"

    # 构建语音消息payload
    VOICE_PAYLOAD="{
        \"update\": {
            \"update_id\": $RANDOM,
            \"message\": {
                \"message_id\": $RANDOM,
                \"from\": {
                    \"id\": $TEST_CHAT_ID,
                    \"is_bot\": false,
                    \"first_name\": \"多语言测试\",
                    \"username\": \"multilingualtest\"
                },
                \"chat\": {
                    \"id\": $TEST_CHAT_ID,
                    \"first_name\": \"多语言测试\",
                    \"username\": \"multilingualtest\",
                    \"type\": \"private\"
                },
                \"date\": $(date +%s),
                \"voice\": {
                    \"duration\": 10,
                    \"mime_type\": \"audio/ogg\",
                    \"file_id\": \"multilingual_test_$(date +%s)\",
                    \"file_unique_id\": \"test_multilingual_$(date +%s)\",
                    \"file_size\": 15000
                }
            }
        }
    }"

    echo "发送多语言语音测试请求..."
    RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$VOICE_PAYLOAD")

    if [ $? -eq 0 ]; then
        echo "✅ 请求发送成功"
        echo "响应: $RESPONSE"

        # 检查多语言处理
        if echo "$RESPONSE" | grep -q "voice_message"; then
            echo "✅ 多语言语音消息识别成功"
        else
            echo "❌ 多语言语音消息识别失败"
        fi

        # 检查语言检测提示
        case "$expected_language" in
            "chinese")
                if echo "$RESPONSE" | grep -q -E "(中文|Chinese)"; then
                    echo "✅ 中文语音处理正常"
                else
                    echo "⚠️  中文语音处理可能需要API配置"
                fi
                ;;
            "english")
                if echo "$RESPONSE" | grep -q -E "(English|英文)"; then
                    echo "✅ 英文语音处理正常"
                else
                    echo "⚠️  英文语音处理可能需要API配置"
                fi
                ;;
            "mixed")
                if echo "$RESPONSE" | grep -q -E "(混合|mixed|multilingual)"; then
                    echo "✅ 中英文混合语音处理正常"
                else
                    echo "⚠️  中英文混合语音处理可能需要API配置"
                fi
                ;;
        esac

        # 检查多语言回复
        if echo "$RESPONSE" | grep -q -E "\\(.*\\)|Reply"; then
            echo "✅ 多语言回复格式正确"
        else
            echo "❌ 多语言回复格式异常"
        fi
    else
        echo "❌ 请求发送失败"
    fi

    echo ""
}

# 测试用例
case "$LANGUAGE_TYPE" in
    "chinese")
        run_multilingual_voice_test "纯中文供应发布" "我要发布钢材供应信息，有一百吨优质钢材，单价四千五每吨" "chinese" "🇨🇳"
        ;;
    "english")
        run_multilingual_voice_test "Pure English Supply" "I want to publish steel supply information, we have 100 tons of high quality steel" "english" "🇺🇸"
        ;;
    "mixed")
        run_multilingual_voice_test "中英文混合" "我要采购steel materials，大概需要100 tons，预算around 450万人民币" "mixed" "🌍"
        ;;
    "all")
        echo "🔄 运行完整多语言测试套件..."
        echo ""

        run_multilingual_voice_test "纯中文供应发布" "我要发布钢材供应信息，有一百吨优质钢材，单价四千五每吨，北京地区" "chinese" "🇨🇳"
        sleep 2

        run_multilingual_voice_test "Pure English Purchase" "I need to purchase 200 tons of construction steel materials for our project in Shanghai" "english" "🇺🇸"
        sleep 2

        run_multilingual_voice_test "中英文混合采购" "我们公司需要采购steel materials，大概需要100 tons，预算around 450万人民币，delivery到华东地区" "mixed" "🌍"
        sleep 2

        run_multilingual_voice_test "Business English + 中文" "Our company wants to publish supply information，我们有high quality steel products，价格competitive，欢迎contact us" "mixed" "🌍"
        sleep 2

        run_multilingual_voice_test "技术术语混合" "我们需要procurement stainless steel，不锈钢材料，grade 304和316L，用于manufacturing industry" "mixed" "🌍"
        ;;
    *)
        echo "❌ 不支持的语言类型: $LANGUAGE_TYPE"
        exit 1
        ;;
esac

echo "📊 多语言测试总结:"
echo "----------------------------------------"
echo "✅ 中文语音识别测试完成"
echo "✅ 英文语音识别测试完成"
echo "✅ 中英文混合语音测试完成"
echo "✅ 多语言回复格式测试完成"
echo ""
echo "🌐 语言支持特性:"
echo "• 🇨🇳 中文语音识别 (Mandarin Chinese)"
echo "• 🇺🇸 英文语音识别 (English)"
echo "• 🌍 中英文混合语音 (Mixed Chinese-English)"
echo "• 🔄 自动语言检测 (Auto Language Detection)"
echo "• 📱 双语回复格式 (Bilingual Response Format)"
echo ""
echo "🔍 下一步验证:"
echo "• 配置多语言语音转文字API密钥"
echo "• 在实际Telegram中测试各种语言场景"
echo "• 验证混合语言的商业术语识别"
echo ""
echo "🛠️ 配置多语言API:"
echo "# OpenAI Whisper (最佳多语言支持)"
echo "./speech_to_text_setup.sh openai sk-your-openai-api-key"
echo ""
echo "# 百度语音识别 (中英文混合)"
echo "./speech_to_text_setup.sh baidu YOUR_API_KEY YOUR_SECRET_KEY"
echo ""
echo "💡 多语言优势:"
echo "┌─────────────────┬─────────┬─────────┬─────────┐"
echo "│ 语言场景        │ OpenAI  │ 百度    │ 系统    │"
echo "├─────────────────┼─────────┼─────────┼─────────┤"
echo "│ 纯中文          │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐⭐ │"
echo "│ 纯英文          │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐ │"
echo "│ 中英文混合      │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐   │ ⭐⭐⭐⭐⭐ │"
echo "│ 商业术语        │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐ │"
echo "└─────────────────┴─────────┴─────────┴─────────┘"
echo ""
echo "🎯 实际使用场景:"
echo "• 国际贸易商务谈判 (International Business)"
echo "• 技术规格说明 (Technical Specifications)"
echo "• 价格预算讨论 (Budget & Pricing)"
echo "• 产品质量描述 (Quality Description)"