#!/bin/bash

# 检查 API Key 配置
# 用法: ./check-api-key.sh [API_KEY]

set -e

API_BASE="http://localhost:8080/rest/s1/novel-anime"

echo "========================================="
echo "检查 GLM-4 API Key 配置"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 登录获取 token
echo "1. 登录系统..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "password": "moqui"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken" : "[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ 登录失败${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 登录成功${NC}"
echo ""

# 2. 检查 API Key 配置
echo "2. 检查 API Key 配置..."
echo ""
echo "请在 Moqui 数据库中检查以下表:"
echo "  表名: MCP_SYSTEM_CONFIG"
echo "  查询: SELECT * FROM MCP_SYSTEM_CONFIG WHERE CONFIG_KEY = 'ai.api.key'"
echo ""

# 3. 如果提供了 API Key 参数,则配置它
if [ ! -z "$1" ]; then
    echo "3. 配置 API Key..."
    echo ""
    echo "提供的 API Key: ${1:0:20}..."
    echo ""
    echo "请手动执行以下 SQL 来配置 API Key:"
    echo ""
    echo "-- 删除旧配置(如果存在)"
    echo "DELETE FROM MCP_SYSTEM_CONFIG WHERE CONFIG_KEY = 'ai.api.key';"
    echo ""
    echo "-- 插入新配置"
    echo "INSERT INTO MCP_SYSTEM_CONFIG ("
    echo "    CONFIG_ID,"
    echo "    CONFIG_KEY,"
    echo "    CONFIG_VALUE,"
    echo "    CONFIG_TYPE,"
    echo "    CATEGORY,"
    echo "    DESCRIPTION,"
    echo "    IS_USER_CONFIGURABLE"
    echo ") VALUES ("
    echo "    'AI_API_KEY',"
    echo "    'ai.api.key',"
    echo "    '$1',"
    echo "    'STRING',"
    echo "    'AI',"
    echo "    'GLM-4 API Key',"
    echo "    'Y'"
    echo ");"
    echo ""
fi

# 4. 测试 API Key
echo "4. 测试图像生成 API..."
echo ""

# 创建测试项目
PROJECT_RESPONSE=$(curl -s -X POST "${API_BASE}/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "API Key Test Project",
    "description": "Testing API Key configuration"
  }')

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"projectId" : "[^"]*' | cut -d'"' -f4)
if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}✗ 创建项目失败${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 项目创建成功: $PROJECT_ID${NC}"

# 导入小说
NOVEL_RESPONSE=$(curl -s -X POST "${API_BASE}/novels/import-text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"title\": \"测试小说\",
    \"content\": \"一个年轻的剑客。\"
  }")

NOVEL_ID=$(echo "$NOVEL_RESPONSE" | grep -o '"novelId" : "[^"]*' | cut -d'"' -f4)
if [ -z "$NOVEL_ID" ]; then
  NOVEL_ID=$(echo "$NOVEL_RESPONSE" | grep -o '"novelId":"[^"]*' | cut -d'"' -f4)
fi

# 提取角色
EXTRACT_RESPONSE=$(curl -s -X POST "${API_BASE}/novels/extract-characters" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"novelId\": \"$NOVEL_ID\",
    \"projectId\": \"$PROJECT_ID\"
  }")

CHARACTER_ID=$(echo "$EXTRACT_RESPONSE" | grep -o '"characterId" : "[^"]*' | head -1 | cut -d'"' -f4)
if [ -z "$CHARACTER_ID" ]; then
  CHARACTER_ID=$(echo "$EXTRACT_RESPONSE" | grep -o '"characterId":"[^"]*' | head -1 | cut -d'"' -f4)
fi

if [ -z "$CHARACTER_ID" ]; then
  echo -e "${RED}✗ 角色提取失败${NC}"
  curl -s -X DELETE "${API_BASE}/project/$PROJECT_ID" -H "Authorization: Bearer $TOKEN" > /dev/null
  exit 1
fi

echo -e "${GREEN}✓ 角色提取成功: $CHARACTER_ID${NC}"
echo ""

# 测试图像生成
echo "测试图像生成 (这可能需要 30-60 秒)..."
IMAGE_RESPONSE=$(curl -s -X POST "${API_BASE}/character/generate-image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"characterId\": \"$CHARACTER_ID\",
    \"projectId\": \"$PROJECT_ID\",
    \"style\": \"anime\",
    \"size\": \"1024x1024\"
  }")

echo ""
echo "图像生成响应:"
echo "$IMAGE_RESPONSE"
echo ""

SUCCESS=$(echo "$IMAGE_RESPONSE" | grep -o '"success" : [^,]*' | cut -d':' -f2 | tr -d ' ')
if [ -z "$SUCCESS" ]; then
  SUCCESS=$(echo "$IMAGE_RESPONSE" | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d ' ')
fi

# 清理
curl -s -X DELETE "${API_BASE}/project/$PROJECT_ID" -H "Authorization: Bearer $TOKEN" > /dev/null

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓ API Key 配置正确，图像生成成功！${NC}"
  exit 0
else
  ERROR=$(echo "$IMAGE_RESPONSE" | grep -o '"error" : "[^"]*' | cut -d'"' -f4)
  if [ -z "$ERROR" ]; then
    ERROR=$(echo "$IMAGE_RESPONSE" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
  fi
  echo -e "${RED}✗ 图像生成失败: $ERROR${NC}"
  echo ""
  echo "请检查:"
  echo "  1. API Key 是否正确配置在数据库中"
  echo "  2. API Key 是否有效"
  echo "  3. 网络连接是否正常"
  echo "  4. Moqui 日志: runtime/log/moqui.log"
  exit 1
fi
