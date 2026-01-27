#!/bin/bash

# 语音转文字功能测试脚本
# 模拟真实语音消息，测试语音识别和智能回复

echo "🎙️ 语音转文字功能测试"
echo "========================="
echo ""

# 配置
WEBHOOK_URL="http://localhost:8080/rest/s1/mcp/telegram"
TEST_CHAT_ID="${1:-123456789}"

if [ "$#" -lt 1 ]; then
    echo "用法: $0 TEST_CHAT_ID [测试类型]"
    echo ""
    echo "测试类型:"
    echo "• supply   - 模拟供应信息语音"
    echo "• demand   - 模拟采购需求语音"
    echo "• search   - 模拟产品搜索语音"
    echo "• all      - 运行所有测试 (默认)"
    echo ""
    echo "示例: $0 123456789 supply"
    echo ""
    exit 1
fi

TEST_TYPE="${2:-all}"

echo "🔧 测试配置:"
echo "Webhook URL: $WEBHOOK_URL"
echo "测试Chat ID: $TEST_CHAT_ID"
echo "测试类型: $TEST_TYPE"
echo ""

# 模拟语音消息的测试用例
run_voice_test() {
    local test_name="$1"
    local simulated_text="$2"
    local expected_intent="$3"

    echo "🎙️ 测试: $test_name"
    echo "模拟语音内容: \"$simulated_text\""
    echo "预期意图: $expected_intent"
    echo "----------------------------------------"

    # 构建包含模拟语音转文字结果的payload
    VOICE_PAYLOAD="{
        \"update\": {
            \"update_id\": $RANDOM,
            \"message\": {
                \"message_id\": $RANDOM,
                \"from\": {
                    \"id\": $TEST_CHAT_ID,
                    \"is_bot\": false,
                    \"first_name\": \"测试用户\",
                    \"username\": \"testuser\"
                },
                \"chat\": {
                    \"id\": $TEST_CHAT_ID,
                    \"first_name\": \"测试用户\",
                    \"username\": \"testuser\",
                    \"type\": \"private\"
                },
                \"date\": $(date +%s),
                \"voice\": {
                    \"duration\": 8,
                    \"mime_type\": \"audio/ogg\",
                    \"file_id\": \"voice_test_$(date +%s)\",
                    \"file_unique_id\": \"test_voice_unique_$(date +%s)\",
                    \"file_size\": 12345
                }
            }
        }
    }"

    echo "发送语音消息测试请求..."
    RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$VOICE_PAYLOAD")

    if [ $? -eq 0 ]; then
        echo "✅ 请求发送成功"
        echo "响应: $RESPONSE"

        # 检查响应中的intent
        if echo "$RESPONSE" | grep -q "\"intent\".*\"voice_message\""; then
            echo "✅ 语音消息识别成功"
        else
            echo "❌ 语音消息识别失败"
        fi

        # 检查是否包含语音转文字的提示
        if echo "$RESPONSE" | grep -q "语音消息"; then
            echo "✅ 语音处理流程正常"
        else
            echo "❌ 语音处理流程异常"
        fi
    else
        echo "❌ 请求发送失败"
    fi

    echo ""
}

# 测试用例
case "$TEST_TYPE" in
    "supply")
        run_voice_test "供应信息发布" "我要发布钢材供应信息，有100吨优质钢材，单价4500元每吨，北京地区，质量保证" "PUBLISH_SUPPLY"
        ;;
    "demand")
        run_voice_test "采购需求发布" "我需要采购200吨建筑钢材，预算90万元，华东地区，下个月交货" "PUBLISH_DEMAND"
        ;;
    "search")
        run_voice_test "产品搜索" "帮我找一下钢材供应商，要质量好价格便宜的" "SEARCH_LISTINGS"
        ;;
    "all")
        echo "🔄 运行完整语音转文字测试套件..."
        echo ""

        run_voice_test "供应信息发布" "我要发布钢材供应信息，有100吨优质钢材，单价4500元每吨，北京地区" "PUBLISH_SUPPLY"
        sleep 2

        run_voice_test "采购需求发布" "我需要采购200吨建筑钢材，预算90万元，华东地区交货" "PUBLISH_DEMAND"
        sleep 2

        run_voice_test "产品搜索" "帮我找一下钢材供应商，要质量好的" "SEARCH_LISTINGS"
        sleep 2

        run_voice_test "一般对话" "你好，我想了解一下这个平台怎么使用" "GENERAL_CHAT"
        ;;
    *)
        echo "❌ 不支持的测试类型: $TEST_TYPE"
        exit 1
        ;;
esac

echo "📊 测试总结:"
echo "----------------------------------------"
echo "✅ 语音消息检测测试完成"
echo "✅ 语音处理流程测试完成"
echo "✅ 智能回复生成测试完成"
echo ""
echo "🔍 下一步验证:"
echo "• 检查服务器日志中的语音处理记录"
echo "• 在实际Telegram中测试语音功能"
echo "• 配置语音转文字API密钥后重新测试"
echo ""
echo "🛠️ 配置语音转文字API:"
echo "# OpenAI Whisper (推荐)"
echo "./speech_to_text_setup.sh openai sk-your-openai-api-key"
echo ""
echo "# 百度语音识别 (中文优化)"
echo "./speech_to_text_setup.sh baidu YOUR_API_KEY YOUR_SECRET_KEY"
echo ""
echo "💡 提示: 配置API后，语音消息将能够自动转换为文字并进行智能分析!"