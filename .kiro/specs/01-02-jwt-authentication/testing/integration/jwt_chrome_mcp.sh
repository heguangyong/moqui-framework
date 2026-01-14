#!/bin/bash
# JWT Chrome MCP认证代理 - 纯JWT模式修复版本
set -e

MOQUI_URL="http://localhost:8080"
USERNAME="john.doe"
PASSWORD="moqui"
SCREENSHOT_PATH="/tmp/moqui_verified.png"

echo "🔐 JWT Chrome MCP认证代理启动"

# 步骤1: 尝试获取JWT token
echo "📋 步骤1: 获取JWT认证"
JWT_RESPONSE=$(curl -s -X POST "$MOQUI_URL/rest/s1/moqui/auth/login" \
                    -H "Content-Type: application/json" \
                    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo "$JWT_RESPONSE" | jq -r '.accessToken' 2>/dev/null || echo "")
REFRESH_TOKEN=$(echo "$JWT_RESPONSE" | jq -r '.refreshToken' 2>/dev/null || echo "")

# 步骤2: 验证JWT获取
if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
    echo "❌ JWT API 不可用，fallback到session模式"
    # Fallback to session mode
    curl -s -X POST "$MOQUI_URL/Login/login" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "username=$USERNAME&password=$PASSWORD" \
         -c /tmp/mcp_session.txt -L > /dev/null

    JSESSIONID=$(grep JSESSIONID /tmp/mcp_session.txt 2>/dev/null | cut -f7 || echo "")
    if [ -n "$JSESSIONID" ]; then
        echo "✅ 使用Session认证: $JSESSIONID"
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
            --headless --disable-gpu \
            --screenshot="$SCREENSHOT_PATH" \
            --window-size=1920,1080 \
            --cookie="JSESSIONID=$JSESSIONID" \
            --virtual-time-budget=8000 \
            "$MOQUI_URL/qapps"
    else
        echo "❌ Session认证也失败"
        exit 1
    fi
else
    echo "✅ 获得JWT Token: ${JWT_TOKEN:0:20}..."
    echo "✅ 获得Refresh Token: ${REFRESH_TOKEN:0:20}..."

    # 步骤3: 纯JWT认证访问Chrome - 使用正确的token名称
    echo "📋 步骤3: 纯JWT Chrome MCP访问"
    echo "🔐 使用JWT localStorage注入方式"

    cat > /tmp/moqui_jwt_loader.html <<EOF
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Moqui JWT Loader</title></head>
<body><script>
// 使用正确的JWT token名称（基于qapps.xml配置）
localStorage.setItem("jwt_access_token", "${JWT_TOKEN}");
localStorage.setItem("jwt_refresh_token", "${REFRESH_TOKEN}");
sessionStorage.setItem("jwt_access_token", "${JWT_TOKEN}");
sessionStorage.setItem("jwt_refresh_token", "${REFRESH_TOKEN}");

// 设置cookie认证
document.cookie = "jwt_access_token=${JWT_TOKEN}; path=/; SameSite=Lax";
document.cookie = "jwt_refresh_token=${REFRESH_TOKEN}; path=/; SameSite=Lax";

// 验证并跳转到应用列表页面
console.log("JWT tokens设置完成，跳转到应用列表");
setTimeout(function(){
    window.location.replace("${MOQUI_URL}/qapps");
}, 500);
</script>
<p>JWT认证中...</p>
</body></html>
EOF

    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        --headless --disable-gpu \
        --screenshot="$SCREENSHOT_PATH" \
        --window-size=1920,1080 \
        --user-data-dir=/tmp/chrome-jwt-test \
        --virtual-time-budget=10000 \
        --run-all-compositor-stages-before-draw \
        "file:///tmp/moqui_jwt_loader.html"
fi

echo "📸 截图已生成: $SCREENSHOT_PATH"
echo "✅ Chrome MCP认证代理完成"