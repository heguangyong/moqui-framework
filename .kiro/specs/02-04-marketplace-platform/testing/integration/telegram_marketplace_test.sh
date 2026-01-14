#!/bin/bash

# Telegram Marketplace Test Script
# 模拟 Telegram Bot Webhook 请求，验证 Moqui marketplace 聊天链路

set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:8080"}

echo "🤖 Telegram Marketplace Webhook 测试"
echo "================================="
echo "📍 API: $BASE_URL/rest/s1/mcp/telegram"

generate_payload() {
  local text="$1"
  local chat_id="$2"
  cat <<EOF
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "date": $(date +%s),
    "text": "$text",
    "chat": {
      "id": $chat_id,
      "type": "private",
      "first_name": "Test",
      "last_name": "User",
      "username": "telegram_market"
    },
    "from": {
      "id": $chat_id,
      "is_bot": false,
      "first_name": "Test",
      "last_name": "User",
      "language_code": "zh-hans"
    }
  }
}
EOF
}

CHAT_ID=${TELEGRAM_CHAT_ID:-10001}

send_request() {
  local text="$1"
  echo "\n➡️ 发送消息: $text"
  RESPONSE=$(curl -s -X POST "$BASE_URL/rest/s1/mcp/telegram" \
    -H "Content-Type: application/json" \
    -d "$(generate_payload "$text" "$CHAT_ID")")
  echo "⬅️ 响应: $RESPONSE"
}

send_request "/start"
send_request "我有30斤菠菜想出售，单价3元一斤。"
send_request "帮我匹配合适的买家"

echo "\n✅ Telegram webhook 摆渡测试完成"
