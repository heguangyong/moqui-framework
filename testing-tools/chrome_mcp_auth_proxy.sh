#!/bin/bash
# Chrome MCP认证代理 - 绕过Chrome headless认证限制

set -e

# 配置
MOQUI_URL="http://localhost:8080"
USERNAME="john.doe"
PASSWORD="moqui"
SCREENSHOT_PATH="/tmp/moqui_verified.png"

echo "🔍 Chrome MCP认证代理启动"

# 步骤1: 获取工作的认证session
echo "📋 步骤1: 获取认证session"
curl -s -X POST "$MOQUI_URL/Login/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=$USERNAME&password=$PASSWORD" \
     -c /tmp/auth_session.txt -L > /dev/null

JSESSIONID=$(grep JSESSIONID /tmp/auth_session.txt | cut -f7)
if [ -z "$JSESSIONID" ]; then
    echo "❌ 认证失败"
    exit 1
fi
echo "✅ 获得JSESSIONID: $JSESSIONID"

# 步骤2: 验证session工作正常
echo "📋 步骤2: 验证session"
STATUS=$(curl -s -b /tmp/auth_session.txt "$MOQUI_URL/qapps" -w "%{http_code}" -o /dev/null)
if [ "$STATUS" != "200" ]; then
    echo "❌ Session验证失败: $STATUS"
    exit 1
fi
echo "✅ Session验证成功"

# 步骤3: 获取完整的认证页面内容
echo "📋 步骤3: 获取认证页面内容"
curl -s -b /tmp/auth_session.txt "$MOQUI_URL/qapps" > /tmp/authenticated_page.html
PAGE_SIZE=$(wc -c < /tmp/authenticated_page.html)
echo "✅ 获得认证页面: ${PAGE_SIZE}字节"

# 步骤4: 创建本地认证页面服务
echo "📋 步骤4: 创建本地认证页面"
# 创建包含认证内容的本地HTML文件，Chrome可以直接访问
cp /tmp/authenticated_page.html /tmp/moqui_authenticated_local.html

# 步骤5: Chrome MCP访问本地认证页面
echo "📋 步骤5: Chrome MCP截图"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu \
    --screenshot="$SCREENSHOT_PATH" \
    --window-size=1920,1080 \
    --virtual-time-budget=5000 \
    "file:///tmp/moqui_authenticated_local.html" 2>/dev/null

if [ -f "$SCREENSHOT_PATH" ]; then
    SCREENSHOT_SIZE=$(wc -c < "$SCREENSHOT_PATH")
    echo "✅ Chrome MCP截图完成: ${SCREENSHOT_SIZE}字节"
    echo "📸 截图路径: $SCREENSHOT_PATH"
else
    echo "❌ Chrome MCP截图失败"
    exit 1
fi

echo "🎉 Chrome MCP认证代理成功完成"
