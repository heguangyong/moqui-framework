#!/bin/bash
# 前端验证基线脚本 - 基于curl的可靠验证
set -e

MOQUI_URL="http://localhost:8080"
USERNAME="john.doe"
PASSWORD="moqui"

echo "🔍 前端验证基线开始"
echo "========================================"

# 步骤1: JWT API验证
echo "📋 步骤1: JWT认证API验证"
JWT_RESPONSE=$(curl -s -X POST "$MOQUI_URL/rest/s1/moqui/auth/login" \
                    -H "Content-Type: application/json" \
                    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

if echo "$JWT_RESPONSE" | grep -q '"success" : true'; then
    echo "✅ JWT API正常工作"
    JWT_TOKEN=$(echo "$JWT_RESPONSE" | grep -o '"accessToken" : "[^"]*"' | cut -d'"' -f4)
    echo "✅ JWT Token长度: ${#JWT_TOKEN}字符"
else
    echo "❌ JWT API失败"
    exit 1
fi

# 步骤2: Session认证验证
echo ""
echo "📋 步骤2: Session认证验证"
curl -s -X POST "$MOQUI_URL/Login/login" \
     -d "username=$USERNAME&password=$PASSWORD" \
     -c /tmp/baseline_session.txt -L > /dev/null

curl -s -b /tmp/baseline_session.txt "$MOQUI_URL/qapps" > /tmp/baseline_qapps.html

PAGE_SIZE=$(wc -c < /tmp/baseline_qapps.html)
PAGE_TITLE=$(grep -o "<title>.*</title>" /tmp/baseline_qapps.html)

if [ "$PAGE_SIZE" -gt 10000 ]; then
    echo "✅ Session认证正常 - 页面大小: ${PAGE_SIZE}字节"
    echo "✅ 页面标题: $PAGE_TITLE"
else
    echo "❌ Session认证失败 - 页面过小: ${PAGE_SIZE}字节"
    exit 1
fi

# 步骤3: 关键组件存在验证
echo ""
echo "📋 步骤3: 关键组件验证"

# 检查Marketplace组件
curl -s -b /tmp/baseline_session.txt "$MOQUI_URL/qapps/marketplace" > /tmp/marketplace_check.html
MARKETPLACE_SIZE=$(wc -c < /tmp/marketplace_check.html)

if [ "$MARKETPLACE_SIZE" -gt 5000 ]; then
    echo "✅ Marketplace组件正常 - ${MARKETPLACE_SIZE}字节"
else
    echo "⚠️  Marketplace组件响应较小 - ${MARKETPLACE_SIZE}字节"
fi

# 检查Tools组件
curl -s -b /tmp/baseline_session.txt "$MOQUI_URL/qapps/tools" > /tmp/tools_check.html
TOOLS_SIZE=$(wc -c < /tmp/tools_check.html)

if [ "$TOOLS_SIZE" -gt 5000 ]; then
    echo "✅ Tools组件正常 - ${TOOLS_SIZE}字节"
else
    echo "⚠️  Tools组件响应较小 - ${TOOLS_SIZE}字节"
fi

# 检查System组件
curl -s -b /tmp/baseline_session.txt "$MOQUI_URL/qapps/system" > /tmp/system_check.html
SYSTEM_SIZE=$(wc -c < /tmp/system_check.html)

if [ "$SYSTEM_SIZE" -gt 5000 ]; then
    echo "✅ System组件正常 - ${SYSTEM_SIZE}字节"
else
    echo "⚠️  System组件响应较小 - ${SYSTEM_SIZE}字节"
fi

# 步骤4: Vue.js框架检查
echo ""
echo "📋 步骤4: 前端框架验证"
VUE_COUNT=$(grep -c "Vue\|moqui\|Quasar" /tmp/baseline_qapps.html)
echo "✅ Vue.js/Quasar引用计数: $VUE_COUNT"

# 步骤5: 生成基线快照
echo ""
echo "📋 步骤5: 生成验证基线快照"
echo "========================================"
echo "基线验证时间: $(date)"
echo "JWT Token: ${JWT_TOKEN:0:50}..."
echo "主页面大小: ${PAGE_SIZE}字节"
echo "页面标题: $PAGE_TITLE"
echo "Marketplace: ${MARKETPLACE_SIZE}字节"
echo "Tools: ${TOOLS_SIZE}字节"
echo "System: ${SYSTEM_SIZE}字节"
echo "Vue.js引用: ${VUE_COUNT}个"
echo "========================================"

# 保存基线数据
cat > /tmp/baseline_snapshot.txt << EOF
# 前端验证基线快照
验证时间=$(date)
JWT_API_STATUS=OK
SESSION_AUTH_STATUS=OK
主页面大小=${PAGE_SIZE}
页面标题=$PAGE_TITLE
Marketplace组件=${MARKETPLACE_SIZE}
Tools组件=${TOOLS_SIZE}
System组件=${SYSTEM_SIZE}
Vue引用计数=${VUE_COUNT}
EOF

echo "📸 基线快照已保存: /tmp/baseline_snapshot.txt"
echo "✅ 前端验证基线建立完成"