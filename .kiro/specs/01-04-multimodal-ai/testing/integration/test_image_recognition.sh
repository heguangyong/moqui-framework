#!/bin/bash

# 图片识别功能测试脚本
# 模拟真实图片消息，测试图片识别和智能回复

echo "📷 图片识别功能测试"
echo "==================="
echo ""

# 配置
WEBHOOK_URL="http://localhost:8080/rest/s1/mcp/telegram"
TEST_CHAT_ID="${1:-123456789}"

if [ "$#" -lt 1 ]; then
    echo "用法: $0 TEST_CHAT_ID [测试类型]"
    echo ""
    echo "测试类型:"
    echo "• product     - 模拟产品展示图片"
    echo "• document    - 模拟文档图片"
    echo "• quality     - 模拟质量检测图片"
    echo "• material    - 模拟原材料图片"
    echo "• all         - 运行所有测试 (默认)"
    echo ""
    echo "示例: $0 123456789 product"
    echo ""
    exit 1
fi

TEST_TYPE="${2:-all}"

echo "🔧 测试配置:"
echo "Webhook URL: $WEBHOOK_URL"
echo "测试Chat ID: $TEST_CHAT_ID"
echo "测试类型: $TEST_TYPE"
echo ""

# 模拟图片消息的测试用例
run_image_test() {
    local test_name="$1"
    local image_description="$2"
    local expected_analysis="$3"
    local test_icon="$4"

    echo "$test_icon 测试: $test_name"
    echo "模拟图片内容: \"$image_description\""
    echo "预期分析: $expected_analysis"
    echo "----------------------------------------"

    # 构建包含模拟图片信息的payload
    IMAGE_PAYLOAD="{
        \"update\": {
            \"update_id\": $RANDOM,
            \"message\": {
                \"message_id\": $RANDOM,
                \"from\": {
                    \"id\": $TEST_CHAT_ID,
                    \"is_bot\": false,
                    \"first_name\": \"图片测试用户\",
                    \"username\": \"imagetest\"
                },
                \"chat\": {
                    \"id\": $TEST_CHAT_ID,
                    \"first_name\": \"图片测试用户\",
                    \"username\": \"imagetest\",
                    \"type\": \"private\"
                },
                \"date\": $(date +%s),
                \"photo\": [
                    {
                        \"file_id\": \"photo_test_$(date +%s)\",
                        \"file_unique_id\": \"test_photo_unique_$(date +%s)\",
                        \"file_size\": 150000,
                        \"width\": 1920,
                        \"height\": 1080
                    }
                ],
                \"caption\": \"$image_description\"
            }
        }
    }"

    echo "发送图片消息测试请求..."
    RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$IMAGE_PAYLOAD")

    if [ $? -eq 0 ]; then
        echo "✅ 请求发送成功"
        echo "响应: $RESPONSE"

        # 检查响应中的图片识别
        if echo "$RESPONSE" | grep -q "\"intent\".*\"image_processing\""; then
            echo "✅ 图片消息识别成功"
        else
            echo "❌ 图片消息识别失败"
        fi

        # 检查是否包含图片分析的提示
        if echo "$RESPONSE" | grep -q "图片"; then
            echo "✅ 图片处理流程正常"
        else
            echo "❌ 图片处理流程异常"
        fi

        # 检查智能分析功能
        case "$expected_analysis" in
            "产品识别")
                if echo "$RESPONSE" | grep -q -E "(产品|产品识别|产品类型)"; then
                    echo "✅ 产品识别功能正常"
                else
                    echo "⚠️  产品识别功能可能需要API配置"
                fi
                ;;
            "文档识别")
                if echo "$RESPONSE" | grep -q -E "(文档|规格|价格|文字)"; then
                    echo "✅ 文档识别功能正常"
                else
                    echo "⚠️  文档识别功能可能需要API配置"
                fi
                ;;
            "质量检测")
                if echo "$RESPONSE" | grep -q -E "(质量|检测|缺陷|品质)"; then
                    echo "✅ 质量检测功能正常"
                else
                    echo "⚠️  质量检测功能可能需要API配置"
                fi
                ;;
        esac

        # 检查智能回复格式
        if echo "$RESPONSE" | grep -q -E "🔍|📷|💡"; then
            echo "✅ 智能回复格式正确"
        else
            echo "❌ 智能回复格式异常"
        fi
    else
        echo "❌ 请求发送失败"
    fi

    echo ""
}

# 测试用例
case "$TEST_TYPE" in
    "product")
        run_image_test "产品展示识别" "钢材产品展示图片，显示了100吨优质钢材，产品规格为HRB400" "产品识别" "🏭"
        ;;
    "document")
        run_image_test "文档识别" "产品规格表，包含价格信息、数量信息和技术参数" "文档识别" "📋"
        ;;
    "quality")
        run_image_test "质量检测" "钢材质量检测报告，显示产品质量等级和检测结果" "质量检测" "🔍"
        ;;
    "material")
        run_image_test "原材料识别" "建筑材料堆放现场，包含水泥、砂石、钢筋等材料" "产品识别" "🏗️"
        ;;
    "all")
        echo "🔄 运行完整图片识别测试套件..."
        echo ""

        run_image_test "产品展示识别" "钢材产品展示图片，规格HRB400，数量100吨" "产品识别" "🏭"
        sleep 2

        run_image_test "规格文档识别" "产品技术规格表，包含详细参数和价格信息" "文档识别" "📋"
        sleep 2

        run_image_test "质量检测报告" "钢材质量检测证书，显示合格标准和检测数据" "质量检测" "🔍"
        sleep 2

        run_image_test "原材料现场" "建筑工地原材料堆放区，多种建材混合" "产品识别" "🏗️"
        sleep 2

        run_image_test "机械设备图片" "生产车间机械设备，包含型号和技术参数标识" "产品识别" "⚙️"
        ;;
    *)
        echo "❌ 不支持的测试类型: $TEST_TYPE"
        exit 1
        ;;
esac

echo "📊 图片识别测试总结:"
echo "----------------------------------------"
echo "✅ 图片消息检测测试完成"
echo "✅ 图片处理流程测试完成"
echo "✅ 智能分析回复测试完成"
echo ""
echo "🔍 下一步验证:"
echo "• 检查服务器日志中的图片处理记录"
echo "• 在实际Telegram中测试图片功能"
echo "• 配置图片识别API密钥后重新测试"
echo ""
echo "🛠️ 配置图片识别API:"
echo "# OpenAI Vision (推荐)"
echo "./image_recognition_setup.sh openai-vision sk-your-openai-api-key"
echo ""
echo "# 百度图像识别 (中文优化)"
echo "./image_recognition_setup.sh baidu-vision YOUR_API_KEY YOUR_SECRET_KEY"
echo ""
echo "# Google Cloud Vision (企业级)"
echo "./image_recognition_setup.sh google-vision YOUR_GOOGLE_API_KEY"
echo ""
echo "💡 提示: 配置API后，图片将能够自动识别内容并进行智能分析!"
echo ""
echo "🎯 应用场景测试:"
echo "• 📦 产品展示识别 - 自动识别产品类型、规格、质量等级"
echo "• 📋 文档信息提取 - 从价格单、规格表中提取关键信息"
echo "• 🔍 质量检测分析 - 分析产品质量、识别潜在缺陷"
echo "• 📊 数据统计支持 - 基于图片内容生成业务报告"
echo ""
echo "📈 智能识别优势:"
echo "• 🤖 自动化处理 - 无需人工标注，智能识别图片内容"
echo "• 🎯 精准分析 - 多API融合，提高识别准确度"
echo "• 🌍 多语言支持 - 中英文混合内容智能处理"
echo "• 🔄 实时响应 - 即时分析图片并生成业务建议"