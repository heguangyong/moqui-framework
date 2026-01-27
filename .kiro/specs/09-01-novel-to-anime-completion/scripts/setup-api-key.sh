#!/bin/bash

# 设置 API Key 的完整脚本
# 这个脚本会：
# 1. 确保 Moqui 正在运行
# 2. 调用服务插入 API Key
# 3. 验证配置

set -e

API_KEY="7b547bec7286432186eb77a477e10c33.XtHQWZS5PoGKAkg0"
BASE_URL="http://localhost:8080"

echo "========================================="
echo "设置 GLM-4 API Key"
echo "========================================="
echo ""

# 1. 检查 Moqui 是否运行
echo "1. 检查 Moqui 状态..."
if ! curl -s "${BASE_URL}/rest/s1/novel-anime/auth/login" > /dev/null 2>&1; then
    echo "✗ Moqui 未运行或未就绪"
    echo "请先启动 Moqui: ./start-applications.sh"
    exit 1
fi
echo "✓ Moqui 正在运行"
echo ""

# 2. 登录获取 token
echo "2. 登录系统..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/rest/s1/novel-anime/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"moqui"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "✗ 登录失败"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo "✓ 登录成功"
echo ""

# 3. 调用服务设置 API Key
echo "3. 设置 API Key..."
SET_RESPONSE=$(curl -s -X POST "${BASE_URL}/rest/s1/mcp/config/set-system-config" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"configKey\": \"ai.api.key\",
    \"configValue\": \"${API_KEY}\",
    \"configType\": \"STRING\",
    \"category\": \"AI\",
    \"description\": \"GLM-4 API Key for image generation\"
  }")

echo "$SET_RESPONSE"

if echo "$SET_RESPONSE" | grep -q '"success":true'; then
    echo "✓ API Key 设置成功"
else
    echo "✗ API Key 设置失败"
    exit 1
fi
echo ""

# 4. 验证配置
echo "4. 验证 API Key 配置..."
GET_RESPONSE=$(curl -s -X GET "${BASE_URL}/rest/s1/mcp/config/get-system-config?configKey=ai.api.key" \
  -H "Authorization: Bearer $TOKEN")

echo "$GET_RESPONSE"

if echo "$GET_RESPONSE" | grep -q '"success":true'; then
    echo "✓ API Key 验证成功"
else
    echo "✗ API Key 验证失败"
    exit 1
fi
echo ""

# 5. 测试图像生成
echo "5. 测试图像生成..."
echo "创建测试项目..."
PROJECT_RESPONSE=$(curl -s -X POST "${BASE_URL}/rest/s1/novel-anime/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"API Key Test","description":"Testing API Key configuration"}')

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo "✗ 项目创建失败"
    exit 1
fi
echo "✓ 项目创建成功: $PROJECT_ID"

echo "测试图像生成 (这可能需要 30-60 秒)..."
IMAGE_RESPONSE=$(curl -s -X POST "${BASE_URL}/rest/s1/mcp/image-generation/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "A simple test image of a cute cat",
    "model": "cogview-3",
    "size": "512x512"
  }')

echo "$IMAGE_RESPONSE"

if echo "$IMAGE_RESPONSE" | grep -q '"success":true'; then
    echo "✓ 图像生成测试成功！"
    echo ""
    echo "========================================="
    echo "✓ API Key 配置完成并验证成功！"
    echo "========================================="
else
    echo "✗ 图像生成测试失败"
    echo "可能的原因："
    echo "  1. API Key 无效"
    echo "  2. 网络连接问题"
    echo "  3. API 配额不足"
    exit 1
fi
