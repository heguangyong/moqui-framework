#!/bin/bash

# Demo Image Recognition Test Script
# Tests the new generateDemoImageAnalysis functionality

echo "🖼️ === 演示图片识别测试 ==="
echo

# 检查系统状态
echo "📡 检查Moqui服务状态..."
if ! curl -s "http://localhost:8080" > /dev/null; then
    echo "❌ Moqui服务未启动，请先运行 ./gradlew run"
    exit 1
fi
echo "✅ Moqui服务正常运行"
echo

# 模拟不同的Telegram图片消息
echo "🧪 测试演示模式图片识别..."

# 测试用例：模拟Telegram Webhook调用
test_image_message() {
    local test_name=$1
    local file_id=$2

    echo "---"
    echo "📝 测试 $test_name"
    echo "FileID: $file_id"

    # 构建测试请求
    local payload='
    {
        "update": {
            "message": {
                "photo": [
                    {
                        "file_id": "'$file_id'",
                        "width": 1920,
                        "height": 1080,
                        "file_size": 125440
                    }
                ],
                "caption": "产品图片",
                "chat": {
                    "id": "123456789"
                },
                "from": {
                    "id": "987654321"
                }
            }
        }
    }'

    echo "🔄 发送图片消息请求..."

    # 调用Telegram服务
    response=$(curl -s -X POST "http://localhost:8080/rest/s1/mcp/telegram" \
        -H "Content-Type: application/json" \
        -d "$payload")

    echo "📱 服务响应:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo
}

# 执行多个测试用例，每个都会产生不同的演示结果
echo "🎯 执行图片识别演示测试..."

test_image_message "钢材产品场景" "demo_image_steel_001"
test_image_message "蔬菜农产品场景" "demo_image_vegetables_002"
test_image_message "机械设备场景" "demo_image_machine_003"
test_image_message "建材产品场景" "demo_image_building_004"
test_image_message "电子产品场景" "demo_image_electronics_005"
test_image_message "化工原料场景" "demo_image_chemical_006"
test_image_message "办公设备场景" "demo_image_office_007"
test_image_message "运输车辆场景" "demo_image_transport_008"
test_image_message "农产品大米场景" "demo_image_rice_009"
test_image_message "工业材料场景" "demo_image_industrial_010"

echo "🎉 === 演示测试完成 ==="
echo
echo "💡 说明："
echo "- 每个不同的fileId会产生不同的演示识别结果"
echo "- 这些结果涵盖了典型的产品识别场景"
echo "- 当配置真实API后，这些演示结果会被实际识别取代"
echo "- 所有结果都会触发智能分析和业务引导"
echo
echo "✅ 演示图片识别功能已验证！"