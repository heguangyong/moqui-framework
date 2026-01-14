#!/bin/bash
# 直接测试marketplace页面的Chrome MCP脚本

set -e

MOQUI_URL="http://localhost:8080"
USERNAME="john.doe"
PASSWORD="moqui"
SCREENSHOT_PATH="/tmp/marketplace_test.png"

echo "🔐 Marketplace页面直接测试启动"

# 步骤1: 获取JWT token
echo "📋 步骤1: 获取JWT认证"
JWT_RESPONSE=$(curl -s -X POST "$MOQUI_URL/rest/s1/moqui/auth/login" \
                    -H "Content-Type: application/json" \
                    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo "$JWT_RESPONSE" | jq -r '.accessToken' 2>/dev/null || echo "")

if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
    echo "❌ JWT获取失败"
    exit 1
else
    echo "✅ JWT Token获取成功"
fi

# 步骤2: 创建包含JWT的HTML页面，直接访问marketplace
cat > /tmp/marketplace_jwt_test.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Marketplace Test</title>
</head>
<body>
    <div id="loading">正在加载marketplace页面...</div>
    <script>
        console.log('设置JWT认证...');
        localStorage.setItem('jwt_access_token', '$JWT_TOKEN');
        sessionStorage.setItem('jwt_access_token', '$JWT_TOKEN');

        console.log('跳转到marketplace页面...');
        setTimeout(function(){
            window.location.replace("${MOQUI_URL}/qapps/marketplace");
        }, 100);
    </script>
</body>
</html>
EOF

# 步骤3: 使用Chrome访问marketplace页面
echo "📋 步骤3: Chrome访问marketplace页面"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless \
    --disable-gpu \
    --screenshot="$SCREENSHOT_PATH" \
    --window-size=1920,1080 \
    --virtual-time-budget=10000 \
    --run-all-compositor-stages-before-draw \
    "file:///tmp/marketplace_jwt_test.html"

echo "✅ 截图保存: $SCREENSHOT_PATH"
echo "🔍 请检查截图以验证marketplace页面状态"