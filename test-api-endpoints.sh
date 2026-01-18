#!/bin/bash

# API端点测试脚本

echo "🧪 测试Novel Anime Generator API端点..."
echo "================================"

BASE_URL="http://localhost:8080/rest/s1/novel-anime"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "测试 $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ 成功${NC}"
        echo "   响应: $(echo "$body" | jq -c . 2>/dev/null || echo "$body" | head -c 100)..."
    else
        echo -e "${RED}❌ 失败 (HTTP $http_code)${NC}"
        echo "   响应: $body"
    fi
    echo ""
}

# 测试认证端点
echo "🔐 认证端点测试:"
test_endpoint "GET" "/auth/status" "" "系统状态检查"
test_endpoint "POST" "/auth/login" '{"email":"test@example.com","password":"test123"}' "用户登录"
test_endpoint "POST" "/auth/register" '{"email":"newuser@example.com","password":"test123","username":"newuser"}' "用户注册"
test_endpoint "GET" "/auth/user" "" "获取当前用户"
test_endpoint "POST" "/auth/logout" '{}' "用户登出"

echo "🧪 测试端点:"
test_endpoint "GET" "/test/status" "" "测试状态"

echo "👤 用户设置端点:"
test_endpoint "GET" "/user-settings?userId=EX_JOHN_DOE" "" "获取用户设置"

echo "📁 项目端点:"
test_endpoint "GET" "/projects?userId=EX_JOHN_DOE" "" "获取项目列表"
test_endpoint "POST" "/projects" '{"name":"测试项目","description":"这是一个测试项目","userId":"EX_JOHN_DOE"}' "创建项目"
test_endpoint "GET" "/project?projectId=100204" "" "获取单个项目"
test_endpoint "PUT" "/project" '{"projectId":"100204","status":"active"}' "更新项目"

echo "📚 小说端点:"
test_endpoint "GET" "/novels" "" "获取小说列表"

echo "🔄 工作流端点:"
test_endpoint "GET" "/workflows" "" "获取工作流列表"
test_endpoint "POST" "/workflows" '{"name":"测试工作流","description":"这是一个测试工作流","userId":"EX_JOHN_DOE"}' "创建工作流"
test_endpoint "GET" "/workflow?workflowId=test123" "" "获取单个工作流"
test_endpoint "PUT" "/workflow" '{"workflowId":"test123","name":"更新的工作流"}' "更新工作流"

echo "📋 工作流模板端点:"
test_endpoint "GET" "/workflow-templates" "" "获取工作流模板"

echo "📁 资源端点:"
test_endpoint "GET" "/assets" "" "获取资源列表"
test_endpoint "POST" "/assets" '{"assetType":"image","name":"测试资源","description":"这是一个测试资源","userId":"EX_JOHN_DOE"}' "创建资源"

echo "================================"
echo "✅ API端点测试完成！"