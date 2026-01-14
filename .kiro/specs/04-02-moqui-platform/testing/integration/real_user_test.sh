#!/bin/bash
# 真实用户交互测试脚本 - 定位[object Object]问题

echo "🔍 开始真实用户交互测试..."

# 1. 模拟完整登录流程
echo "📡 执行登录流程..."

# 获取登录页面以获取session token
LOGIN_RESPONSE=$(curl -s -c /tmp/real_session.txt "http://localhost:8080/Login")
SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o 'name="moquiSessionToken" value="[^"]*"' | cut -d'"' -f4)

echo "🔑 Session Token: $SESSION_TOKEN"

# 执行登录
curl -s -X POST "http://localhost:8080/Login/login" \
     -b /tmp/real_session.txt -c /tmp/real_session.txt \
     -d "username=john.doe&password=moqui&moquiSessionToken=$SESSION_TOKEN" \
     -L > /dev/null

# 2. 访问qapps页面
echo "🌐 访问qapps页面..."
curl -s -b /tmp/real_session.txt "http://localhost:8080/qapps" > /tmp/real_qapps.html

# 3. 检查qapps页面大小和内容
CONTENT_SIZE=$(wc -c < /tmp/real_qapps.html)
echo "📊 页面内容大小: $CONTENT_SIZE bytes"

# 4. 检查是否有JavaScript错误相关的内容
echo "🔍 搜索可能的对象显示问题..."
if grep -q "object Object" /tmp/real_qapps.html; then
    echo "❌ 发现 object Object 在静态HTML中"
    grep -n -B 2 -A 2 "object Object" /tmp/real_qapps.html
else
    echo "✅ 静态HTML中未发现 object Object"
fi

# 5. 检查Vue组件加载的数据
echo "🔍 检查menuData接口..."
MENU_DATA=$(curl -s -b /tmp/real_session.txt "http://localhost:8080/qapps/menuData")
echo "📋 MenuData响应长度: $(echo "$MENU_DATA" | wc -c) bytes"
echo "📋 MenuData内容样本:"
echo "$MENU_DATA" | head -5

# 6. 检查menuData中是否有object问题
if echo "$MENU_DATA" | grep -q "object Object"; then
    echo "❌ 发现 object Object 在menuData响应中！"
    echo "$MENU_DATA" | grep -B 2 -A 2 "object Object"
else
    echo "✅ menuData响应正常"
fi

echo "🎯 真实用户交互测试完成"