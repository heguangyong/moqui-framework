#!/bin/bash
# JWT Chrome MCP认证代理 - 统一标准版本
set -e

MOQUI_URL="http://localhost:8080"
USERNAME="john.doe"
PASSWORD="moqui"
SCREENSHOT_PATH="/tmp/moqui_jwt_verified.png"

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
    echo "❌ JWT API 不可用，命令终止"
    exit 1
else
    echo "✅ 获得JWT Token: ${JWT_TOKEN:0:20}..."
    echo "✅ 获得Refresh Token: ${REFRESH_TOKEN:0:20}..."
fi

# 步骤3: 纯JWT认证访问Chrome
echo "📋 步骤3: 纯JWT Chrome MCP访问"
echo "🔐 使用JWT localStorage注入方式"
    cat > /tmp/moqui_jwt_loader.html <<EOF
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Moqui JWT Loader</title></head>
<body><script>
localStorage.setItem("jwt_token", "${JWT_TOKEN}");
localStorage.setItem("jwt_refresh_token", "${REFRESH_TOKEN}");
localStorage.setItem("jwt_access_token", "${JWT_TOKEN}");
localStorage.setItem("jwt_refresh_token", "${REFRESH_TOKEN}");
sessionStorage.setItem("jwt_token", "${JWT_TOKEN}");
sessionStorage.setItem("jwt_refresh_token", "${REFRESH_TOKEN}");
document.cookie = "jwt_token=${JWT_TOKEN}; path=/; SameSite=Strict";
setTimeout(function(){ window.location.replace("${MOQUI_URL}/qapps"); }, 10);
</script></body></html>
EOF
