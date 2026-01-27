#!/bin/bash
# Chrome JWT认证验证工具 - 修复版本
set -e

MOQUI_URL="http://localhost:8080"
USERNAME="john.doe"
PASSWORD="moqui"
SCREENSHOT_PATH="/tmp/moqui_verified.png"

echo "🔐 Chrome JWT认证验证启动"

# 步骤1: 获取JWT token
echo "📋 步骤1: 获取JWT认证"
JWT_RESPONSE=$(curl -s -X POST "$MOQUI_URL/rest/s1/moqui/auth/login" \
                    -H "Content-Type: application/json" \
                    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo "$JWT_RESPONSE" | grep -o '"accessToken" : "[^"]*"' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
    echo "❌ JWT获取失败"
    exit 1
fi

echo "✅ 获得JWT Token: ${JWT_TOKEN:0:20}..."

# 步骤2: 直接使用Chrome cookie参数访问
echo "📋 步骤2: Chrome直接cookie访问"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu \
    --screenshot="$SCREENSHOT_PATH" \
    --window-size=1920,1080 \
    --cookie="jwt_access_token=$JWT_TOKEN" \
    --virtual-time-budget=8000 \
    "$MOQUI_URL/qapps"

echo "📸 截图已生成: $SCREENSHOT_PATH"
echo "✅ Chrome JWT认证验证完成"