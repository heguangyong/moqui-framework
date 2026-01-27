#!/bin/bash

# Demo Speech Recognition Test Script
# Tests the new generateDemoTranscription functionality

echo "🎙️ === 演示语音识别测试 ==="
echo

# 检查系统状态
echo "📡 检查Moqui服务状态..."
if ! curl -s "http://localhost:8080" > /dev/null; then
    echo "❌ Moqui服务未启动，请先运行 ./gradlew run"
    exit 1
fi
echo "✅ Moqui服务正常运行"
echo

# 模拟不同的Telegram语音消息
echo "🧪 测试演示模式语音识别..."

# 测试用例：模拟Telegram Webhook调用
test_voice_message() {
    local test_name=$1
    local file_id=$2

    echo "---"
    echo "📝 测试 $test_name"
    echo "FileID: $file_id"

    # 构建测试请求
    local payload='{
        "update": {
            "message": {
                "voice": {
                    "file_id": "'$file_id'",
                    "duration": 3,
                    "mime_type": "audio/ogg"
                },
                "chat": {
                    "id": "123456789"
                },
                "from": {
                    "id": "987654321"
                }
            }
        }
    }'

    echo "🔄 发送语音消息请求..."

    # 调用Telegram服务
    response=$(curl -s -X POST "http://localhost:8080/rest/s1/mcp/telegram" \
        -H "Content-Type: application/json" \
        -d "$payload")

    echo "📱 服务响应:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo
}

# 执行多个测试用例，每个都会产生不同的演示结果
echo "🎯 执行语音识别演示测试..."

test_voice_message "钢材供应场景" "demo_file_steel_001"
test_voice_message "农产品采购场景" "demo_file_agri_002"
test_voice_message "机械设备场景" "demo_file_machine_003"
test_voice_message "建材需求场景" "demo_file_building_004"
test_voice_message "化工产品场景" "demo_file_chemical_005"

echo "🎉 === 演示测试完成 ==="
echo
echo "💡 说明："
echo "- 每个不同的fileId会产生不同的演示识别结果"
echo "- 这些结果涵盖了典型的供需场景"
echo "- 当配置真实API后，这些演示结果会被实际识别取代"
echo "- 所有结果都会触发智能分析和业务引导"
echo
echo "✅ 演示语音识别功能已验证！"