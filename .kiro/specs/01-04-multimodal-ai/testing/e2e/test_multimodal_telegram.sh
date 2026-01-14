#!/bin/bash

# Telegram Bot Multimodal Testing Script
# Tests voice and image functionality with ngrok webhook

echo "🎙️📷 Telegram Bot 多模态功能测试"
echo "========================================"
echo ""

# Configuration
BOT_TOKEN="6889801043:AAF5wdoc4tybZEqCXtO5229tOErnK_ZUzMA"
NGROK_URL="${1:-https://a2943131c958.ngrok-free.app}"
TEST_CHAT_ID="${2:-123456789}"  # Use a real chat ID for testing

if [ "$#" -lt 1 ]; then
    echo "用法: $0 NGROK_URL [TEST_CHAT_ID]"
    echo ""
    echo "示例: $0 https://your-ngrok-url.ngrok-free.app 123456789"
    echo ""
    echo "📋 测试内容："
    echo "• 模拟 Telegram 语音消息 webhook"
    echo "• 模拟 Telegram 图片消息 webhook"
    echo "• 模拟 Telegram 文档消息 webhook"
    echo "• 验证 multimodal 响应处理"
    echo ""
    echo "🔧 当前配置："
    echo "Bot Token: ${BOT_TOKEN:0:15}..."
    echo "Webhook URL: http://localhost:8080/rest/s1/mcp/telegram"
    echo ""
    exit 1
fi

WEBHOOK_URL="${NGROK_URL}/rest/s1/mcp/telegram"

echo "🔧 测试配置："
echo "Bot Token: ${BOT_TOKEN:0:15}..."
echo "Ngrok URL: $NGROK_URL"
echo "Webhook URL: $WEBHOOK_URL"
echo "Test Chat ID: $TEST_CHAT_ID"
echo ""

# Test 1: Voice Message
echo "🎙️ 测试 1: 语音消息处理"
echo "----------------------------------------"

VOICE_PAYLOAD='{
  "update": {
    "update_id": 123456,
    "message": {
      "message_id": 1001,
      "from": {
        "id": '$TEST_CHAT_ID',
        "is_bot": false,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": '$TEST_CHAT_ID',
        "first_name": "Test",
        "username": "testuser",
        "type": "private"
      },
      "date": 1699123456,
      "voice": {
        "duration": 15,
        "mime_type": "audio/ogg",
        "file_id": "AwACAgIAAxkBAAICHmVYQVGm9X8Y4S_sample_voice_file_id",
        "file_unique_id": "AgAD_sample_unique_id",
        "file_size": 12345
      }
    }
  }
}'

echo "发送语音消息测试请求..."
VOICE_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$VOICE_PAYLOAD")

echo "响应状态: $(echo $? | sed 's/0/✅ 成功/g' | sed 's/[^0]/❌ 失败/g')"
echo "响应内容: $VOICE_RESPONSE"
echo ""

# Test 2: Photo Message
echo "📷 测试 2: 图片消息处理"
echo "----------------------------------------"

PHOTO_PAYLOAD='{
  "update": {
    "update_id": 123457,
    "message": {
      "message_id": 1002,
      "from": {
        "id": '$TEST_CHAT_ID',
        "is_bot": false,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": '$TEST_CHAT_ID',
        "first_name": "Test",
        "username": "testuser",
        "type": "private"
      },
      "date": 1699123456,
      "photo": [
        {
          "file_id": "AgACAgIAAxkBAAICH2VYQVGm9X8Y4S_sample_photo_small_id",
          "file_unique_id": "AQAD_sample_small_unique",
          "file_size": 1234,
          "width": 90,
          "height": 90
        },
        {
          "file_id": "AgACAgIAAxkBAAICIGVYQVGm9X8Y4S_sample_photo_large_id",
          "file_unique_id": "AQAD_sample_large_unique",
          "file_size": 56789,
          "width": 1280,
          "height": 960
        }
      ],
      "caption": "这是我们工厂生产的钢材产品"
    }
  }
}'

echo "发送图片消息测试请求..."
PHOTO_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$PHOTO_PAYLOAD")

echo "响应状态: $(echo $? | sed 's/0/✅ 成功/g' | sed 's/[^0]/❌ 失败/g')"
echo "响应内容: $PHOTO_RESPONSE"
echo ""

# Test 3: Document Message
echo "📄 测试 3: 文档消息处理"
echo "----------------------------------------"

DOCUMENT_PAYLOAD='{
  "update": {
    "update_id": 123458,
    "message": {
      "message_id": 1003,
      "from": {
        "id": '$TEST_CHAT_ID',
        "is_bot": false,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": '$TEST_CHAT_ID',
        "first_name": "Test",
        "username": "testuser",
        "type": "private"
      },
      "date": 1699123456,
      "document": {
        "file_name": "product_specification.pdf",
        "mime_type": "application/pdf",
        "file_id": "BAADBAADrwADBREAAUmKCwABYj_sample_doc_file_id",
        "file_unique_id": "AgAD_sample_doc_unique",
        "file_size": 234567
      },
      "caption": "这是我们最新的产品规格书"
    }
  }
}'

echo "发送文档消息测试请求..."
DOC_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$DOCUMENT_PAYLOAD")

echo "响应状态: $(echo $? | sed 's/0/✅ 成功/g' | sed 's/[^0]/❌ 失败/g')"
echo "响应内容: $DOC_RESPONSE"
echo ""

# Test 4: Audio Message
echo "🎵 测试 4: 音频消息处理"
echo "----------------------------------------"

AUDIO_PAYLOAD='{
  "update": {
    "update_id": 123459,
    "message": {
      "message_id": 1004,
      "from": {
        "id": '$TEST_CHAT_ID',
        "is_bot": false,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": '$TEST_CHAT_ID',
        "first_name": "Test",
        "username": "testuser",
        "type": "private"
      },
      "date": 1699123456,
      "audio": {
        "duration": 180,
        "mime_type": "audio/mpeg",
        "file_id": "CQACAgIAAxkBAAICIWVYQVGm9X8Y4S_sample_audio_file_id",
        "file_unique_id": "AgAD_sample_audio_unique",
        "file_size": 3456789,
        "title": "产品介绍录音",
        "performer": "销售经理张三"
      }
    }
  }
}'

echo "发送音频消息测试请求..."
AUDIO_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$AUDIO_PAYLOAD")

echo "响应状态: $(echo $? | sed 's/0/✅ 成功/g' | sed 's/[^0]/❌ 失败/g')"
echo "响应内容: $AUDIO_RESPONSE"
echo ""

# Check logs for multimodal processing
echo "📋 检查服务器日志 (最近 20 行):"
echo "----------------------------------------"
tail -20 runtime/log/moqui.log | grep -E "(voice|photo|audio|document|multimodal|Voice|Photo|Audio|Document)" || echo "未找到多模态处理日志"
echo ""

# Summary
echo "📊 测试总结:"
echo "----------------------------------------"
echo "✅ 语音消息测试完成"
echo "✅ 图片消息测试完成"
echo "✅ 文档消息测试完成"
echo "✅ 音频消息测试完成"
echo ""
echo "💡 下一步测试建议:"
echo "• 在实际 Telegram 中发送语音消息到 @UpServceBot"
echo "• 在实际 Telegram 中发送图片消息到 @UpServceBot"
echo "• 在实际 Telegram 中发送文档到 @UpServceBot"
echo "• 验证机器人能够识别并回复对应的多模态内容"
echo ""
echo "🔧 如果测试失败，请检查:"
echo "• Moqui 服务器是否运行正常"
echo "• ngrok 隧道是否活跃"
echo "• Telegram webhook 是否配置正确"
echo "• 服务器日志中是否有错误信息"