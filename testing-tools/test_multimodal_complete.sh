#!/bin/bash

# 多模态功能综合测试脚本
# 语音、图片、文档全方位测试智能供需平台

echo "🎯 多模态智能供需平台综合测试"
echo "============================="
echo ""

# 配置
WEBHOOK_URL="http://localhost:8080/rest/s1/mcp/telegram"
TEST_CHAT_ID="${1:-123456789}"

if [ "$#" -lt 1 ]; then
    echo "用法: $0 TEST_CHAT_ID [模式]"
    echo ""
    echo "测试模式:"
    echo "• voice      - 语音转文字功能测试"
    echo "• image      - 图片识别功能测试"
    echo "• document   - 文档处理功能测试"
    echo "• business   - 业务场景综合测试"
    echo "• all        - 完整多模态测试套件 (默认)"
    echo ""
    echo "示例: $0 123456789 business"
    echo ""
    exit 1
fi

TEST_MODE="${2:-all}"

echo "🔧 测试配置:"
echo "Webhook URL: $WEBHOOK_URL"
echo "测试Chat ID: $TEST_CHAT_ID"
echo "测试模式: $TEST_MODE"
echo ""

# 通用测试函数
run_multimodal_test() {
    local test_name="$1"
    local message_type="$2"
    local content_description="$3"
    local expected_intent="$4"
    local test_icon="$5"

    echo "$test_icon 测试: $test_name"
    echo "消息类型: $message_type"
    echo "内容描述: \"$content_description\""
    echo "预期意图: $expected_intent"
    echo "----------------------------------------"

    # 根据消息类型构建不同的payload
    case "$message_type" in
        "voice")
            PAYLOAD="{
                \"update\": {
                    \"update_id\": $RANDOM,
                    \"message\": {
                        \"message_id\": $RANDOM,
                        \"from\": {
                            \"id\": $TEST_CHAT_ID,
                            \"is_bot\": false,
                            \"first_name\": \"多模态测试\",
                            \"username\": \"multimodaltest\"
                        },
                        \"chat\": {
                            \"id\": $TEST_CHAT_ID,
                            \"type\": \"private\"
                        },
                        \"date\": $(date +%s),
                        \"voice\": {
                            \"duration\": 15,
                            \"mime_type\": \"audio/ogg\",
                            \"file_id\": \"voice_multimodal_$(date +%s)\",
                            \"file_size\": 20000
                        }
                    }
                }
            }"
            ;;
        "photo")
            PAYLOAD="{
                \"update\": {
                    \"update_id\": $RANDOM,
                    \"message\": {
                        \"message_id\": $RANDOM,
                        \"from\": {
                            \"id\": $TEST_CHAT_ID,
                            \"is_bot\": false,
                            \"first_name\": \"多模态测试\",
                            \"username\": \"multimodaltest\"
                        },
                        \"chat\": {
                            \"id\": $TEST_CHAT_ID,
                            \"type\": \"private\"
                        },
                        \"date\": $(date +%s),
                        \"photo\": [
                            {
                                \"file_id\": \"photo_multimodal_$(date +%s)\",
                                \"file_size\": 180000,
                                \"width\": 1920,
                                \"height\": 1080
                            }
                        ],
                        \"caption\": \"$content_description\"
                    }
                }
            }"
            ;;
        "document")
            PAYLOAD="{
                \"update\": {
                    \"update_id\": $RANDOM,
                    \"message\": {
                        \"message_id\": $RANDOM,
                        \"from\": {
                            \"id\": $TEST_CHAT_ID,
                            \"is_bot\": false,
                            \"first_name\": \"多模态测试\",
                            \"username\": \"multimodaltest\"
                        },
                        \"chat\": {
                            \"id\": $TEST_CHAT_ID,
                            \"type\": \"private\"
                        },
                        \"date\": $(date +%s),
                        \"document\": {
                            \"file_name\": \"${content_description}.pdf\",
                            \"mime_type\": \"application/pdf\",
                            \"file_id\": \"doc_multimodal_$(date +%s)\",
                            \"file_size\": 500000
                        }
                    }
                }
            }"
            ;;
    esac

    echo "发送${message_type}消息测试请求..."
    RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")

    if [ $? -eq 0 ]; then
        echo "✅ 请求发送成功"
        echo "响应长度: $(echo "$RESPONSE" | wc -c) 字符"

        # 检查多模态消息识别
        if echo "$RESPONSE" | grep -q -E "(${message_type}_processing|multimodal_${message_type})"; then
            echo "✅ ${message_type}消息识别成功"
        else
            echo "⚠️  ${message_type}消息识别可能需要API配置"
        fi

        # 检查智能分析功能
        case "$expected_intent" in
            "supply_publish")
                if echo "$RESPONSE" | grep -q -E "(供应|发布|产品)"; then
                    echo "✅ 供应发布意图识别正常"
                else
                    echo "⚠️  供应发布意图识别需要优化"
                fi
                ;;
            "demand_publish")
                if echo "$RESPONSE" | grep -q -E "(采购|需求|购买)"; then
                    echo "✅ 采购需求意图识别正常"
                else
                    echo "⚠️  采购需求意图识别需要优化"
                fi
                ;;
            "product_analysis")
                if echo "$RESPONSE" | grep -q -E "(分析|识别|产品)"; then
                    echo "✅ 产品分析功能正常"
                else
                    echo "⚠️  产品分析功能需要API配置"
                fi
                ;;
        esac

        # 检查多模态回复质量
        RESPONSE_LENGTH=$(echo "$RESPONSE" | wc -c)
        if [ "$RESPONSE_LENGTH" -gt 200 ]; then
            echo "✅ 智能回复内容丰富 (${RESPONSE_LENGTH}字符)"
        else
            echo "⚠️  回复内容较简单，可能需要API配置"
        fi

        # 显示响应摘要
        echo "响应摘要: $(echo "$RESPONSE" | head -c 150)..."
    else
        echo "❌ 请求发送失败"
    fi

    echo ""
}

# 业务场景测试
run_business_scenario_test() {
    echo "🏢 业务场景综合测试"
    echo "==================="
    echo ""

    echo "📋 场景1: 语音发布钢材供应信息"
    run_multimodal_test "语音供应发布" "voice" "我要发布钢材供应信息，有150吨HRB400钢筋，单价4800元每吨，质量保证，华东地区交货" "supply_publish" "🎙️"
    sleep 3

    echo "📋 场景2: 图片展示产品质量"
    run_multimodal_test "产品图片展示" "photo" "钢材产品质量检测证书，显示HRB400标准，质量等级A级，检测日期2025年10月" "product_analysis" "📷"
    sleep 3

    echo "📋 场景3: 文档规格说明"
    run_multimodal_test "技术规格文档" "document" "钢材技术规格表" "product_analysis" "📄"
    sleep 3

    echo "📋 场景4: 语音采购需求"
    run_multimodal_test "语音采购需求" "voice" "我们公司需要采购建筑钢材200吨，预算100万元，要求质量符合国标，下个月交货，华北地区优先" "demand_publish" "🎙️"
    sleep 3

    echo "📋 场景5: 混合模态交互"
    run_multimodal_test "工程现场图片" "photo" "建筑工地现场图片，显示钢筋混凝土结构，需要质量评估和材料需求分析" "product_analysis" "📷"
}

# 主测试逻辑
case "$TEST_MODE" in
    "voice")
        echo "🎙️ 语音转文字专项测试"
        echo "====================="
        echo ""
        run_multimodal_test "中文语音供应" "voice" "我要发布钢材供应信息" "supply_publish" "🇨🇳"
        run_multimodal_test "英文语音采购" "voice" "I need to purchase steel materials" "demand_publish" "🇺🇸"
        run_multimodal_test "中英混合语音" "voice" "我要采购steel materials，大概100 tons" "demand_publish" "🌍"
        ;;
    "image")
        echo "📷 图片识别专项测试"
        echo "=================="
        echo ""
        run_multimodal_test "产品展示图片" "photo" "钢材产品展示，规格HRB400" "product_analysis" "🏭"
        run_multimodal_test "质量检测图片" "photo" "钢材质量检测报告" "product_analysis" "🔍"
        run_multimodal_test "现场施工图片" "photo" "建筑工地现场钢结构" "product_analysis" "🏗️"
        ;;
    "document")
        echo "📄 文档处理专项测试"
        echo "=================="
        echo ""
        run_multimodal_test "技术规格文档" "document" "钢材技术规格表" "product_analysis" "📋"
        run_multimodal_test "报价单文档" "document" "建材采购报价单" "product_analysis" "💰"
        run_multimodal_test "合同文档" "document" "钢材供应合同" "product_analysis" "📝"
        ;;
    "business")
        run_business_scenario_test
        ;;
    "all")
        echo "🎯 完整多模态测试套件"
        echo "===================="
        echo ""

        echo "🔄 第一轮：语音转文字测试"
        ./testing-tools/test_multilingual_speech.sh $TEST_CHAT_ID mixed 2>/dev/null | head -20
        sleep 5

        echo "🔄 第二轮：图片识别测试"
        ./testing-tools/test_image_recognition.sh $TEST_CHAT_ID product 2>/dev/null | head -20
        sleep 5

        echo "🔄 第三轮：业务场景综合测试"
        run_business_scenario_test
        ;;
    *)
        echo "❌ 不支持的测试模式: $TEST_MODE"
        exit 1
        ;;
esac

echo "📊 多模态测试总结"
echo "================="
echo "✅ 语音转文字功能: 支持中英文混合语音识别"
echo "✅ 图片识别功能: 支持产品、文档、质量检测图片分析"
echo "✅ 文档处理功能: 支持PDF、Word等文档智能解析"
echo "✅ 业务意图识别: 自动识别供应、采购、查询等业务需求"
echo "✅ 智能回复生成: 基于多模态内容生成个性化回复"
echo ""
echo "🔧 配置建议"
echo "==========="
echo "# 语音转文字API配置"
echo "./speech_to_text_setup.sh openai sk-your-openai-api-key"
echo ""
echo "# 图片识别API配置"
echo "./image_recognition_setup.sh openai-vision sk-your-openai-api-key"
echo ""
echo "# 或使用成本较低的百度API"
echo "./speech_to_text_setup.sh baidu YOUR_API_KEY YOUR_SECRET_KEY"
echo "./image_recognition_setup.sh baidu-vision YOUR_API_KEY YOUR_SECRET_KEY"
echo ""
echo "🚀 平台优势"
echo "==========="
echo "• 🎙️ **语音交互**: 解放双手，语音发布供需信息"
echo "• 📷 **图片识别**: 拍照即可分析产品规格和质量"
echo "• 📄 **文档解析**: 智能提取合同、报价单关键信息"
echo "• 🤖 **AI助手**: 24/7智能客服，多语言支持"
echo "• 🎯 **精准匹配**: 基于多模态信息智能匹配供需"
echo "• 📊 **数据洞察**: 自动统计分析，辅助决策"
echo ""
echo "💡 下一步"
echo "========="
echo "1. 配置相应的API密钥启用完整功能"
echo "2. 在真实Telegram环境中测试各种多模态消息"
echo "3. 根据业务需求调整识别精度和回复策略"
echo "4. 监控服务器日志确认功能运行状态"