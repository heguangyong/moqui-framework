#!/bin/bash

# 端到端测试脚本
# Spec: 09-01-novel-to-anime-completion
# 目标: 测试完整的小说转动漫流程

set -e  # 遇到错误立即退出

echo "========================================="
echo "小说转动漫 - 端到端测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0
WARNINGS=0

# 辅助函数
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

# 1. 测试认证
echo "Test 1: 用户认证"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"john.doe","password":"moqui"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success"'; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken" : "[^"]*"' | cut -d'"' -f4)
    pass "用户认证成功"
    echo "   Token: ${ACCESS_TOKEN:0:30}..."
else
    fail "用户认证失败"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 2. 测试创建项目
echo "Test 2: 创建项目"
PROJECT_NAME="E2E测试项目-$(date +%s)"
CREATE_PROJECT=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/projects \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$PROJECT_NAME\",\"description\":\"端到端测试项目\"}")

if echo "$CREATE_PROJECT" | grep -q '"success"'; then
    PROJECT_ID=$(echo "$CREATE_PROJECT" | grep -o '"projectId" : "[^"]*"' | cut -d'"' -f4)
    pass "项目创建成功"
    echo "   Project ID: $PROJECT_ID"
else
    fail "项目创建失败"
    echo "   Response: $CREATE_PROJECT"
    exit 1
fi
echo ""

# 3. 测试获取项目列表
echo "Test 3: 获取项目列表"
GET_PROJECTS=$(curl -s http://localhost:8080/rest/s1/novel-anime/projects \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_PROJECTS" | grep -q "$PROJECT_ID"; then
    pass "项目列表包含新创建的项目"
else
    fail "项目列表不包含新创建的项目"
    echo "   Response: $GET_PROJECTS"
fi
echo ""

# 4. 测试创建小说
echo "Test 4: 创建小说"
NOVEL_CONTENT="第一章 开始\n\n这是一个测试小说的内容。\n主角张三走在街上，遇到了李四。\n\"你好！\"张三说。\n\"你好！\"李四回答。"
CREATE_NOVEL=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/novels \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":\"$PROJECT_ID\",\"title\":\"测试小说\",\"content\":\"$NOVEL_CONTENT\"}")

if echo "$CREATE_NOVEL" | grep -q '"success"'; then
    NOVEL_ID=$(echo "$CREATE_NOVEL" | grep -o '"novelId" : "[^"]*"' | cut -d'"' -f4)
    pass "小说创建成功"
    echo "   Novel ID: $NOVEL_ID"
else
    fail "小说创建失败"
    echo "   Response: $CREATE_NOVEL"
fi
echo ""

# 5. 测试创建角色
echo "Test 5: 创建角色"
CREATE_CHARACTER=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/characters \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":\"$PROJECT_ID\",\"name\":\"张三\",\"description\":\"主角\",\"type\":\"protagonist\"}")

if echo "$CREATE_CHARACTER" | grep -q '"success":true'; then
    CHARACTER_ID=$(echo "$CREATE_CHARACTER" | python3 -c "import sys, json; print(json.load(sys.stdin)['characterId'])")
    pass "角色创建成功"
    echo "   Character ID: $CHARACTER_ID"
else
    fail "角色创建失败"
    echo "   Response: $CREATE_CHARACTER"
fi
echo ""

# 6. 测试获取角色列表
echo "Test 6: 获取角色列表"
GET_CHARACTERS=$(curl -s "http://localhost:8080/rest/s1/novel-anime/characters?projectId=$PROJECT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_CHARACTERS" | grep -q "张三"; then
    pass "角色列表包含新创建的角色"
else
    fail "角色列表不包含新创建的角色"
    echo "   Response: $GET_CHARACTERS"
fi
echo ""

# 7. 测试工作流模板
echo "Test 7: 获取工作流模板"
GET_TEMPLATES=$(curl -s http://localhost:8080/rest/s1/novel-anime/workflow-templates \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_TEMPLATES" | grep -q '"success":true'; then
    pass "工作流模板获取成功"
    TEMPLATE_COUNT=$(echo "$GET_TEMPLATES" | grep -o '"templateId"' | wc -l)
    echo "   可用模板数: $TEMPLATE_COUNT"
else
    warn "工作流模板获取失败或为空"
    echo "   Response: $GET_TEMPLATES"
fi
echo ""

# 8. 测试创建工作流
echo "Test 8: 创建工作流"
WORKFLOW_CONFIG='{"nodes":[{"id":"input1","type":"INPUT_NOVEL","config":{}},{"id":"process1","type":"PROCESS_SCENE_ANALYSIS","config":{}},{"id":"output1","type":"OUTPUT_JSON","config":{}}],"edges":[{"from":"input1","to":"process1"},{"from":"process1","to":"output1"}]}'
CREATE_WORKFLOW=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/workflows \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":\"$PROJECT_ID\",\"name\":\"测试工作流\",\"config\":$WORKFLOW_CONFIG}")

if echo "$CREATE_WORKFLOW" | grep -q '"success":true'; then
    WORKFLOW_ID=$(echo "$CREATE_WORKFLOW" | python3 -c "import sys, json; print(json.load(sys.stdin)['workflowId'])")
    pass "工作流创建成功"
    echo "   Workflow ID: $WORKFLOW_ID"
else
    fail "工作流创建失败"
    echo "   Response: $CREATE_WORKFLOW"
fi
echo ""

# 9. 测试执行工作流
echo "Test 9: 执行工作流"
if [ -n "$WORKFLOW_ID" ] && [ -n "$NOVEL_ID" ]; then
    EXECUTE_WORKFLOW=$(curl -s -X POST "http://localhost:8080/rest/s1/novel-anime/workflow/$WORKFLOW_ID/execute" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"novelId\":\"$NOVEL_ID\"}")
    
    if echo "$EXECUTE_WORKFLOW" | grep -q '"success":true'; then
        EXECUTION_ID=$(echo "$EXECUTE_WORKFLOW" | python3 -c "import sys, json; print(json.load(sys.stdin)['executionId'])")
        pass "工作流执行启动成功"
        echo "   Execution ID: $EXECUTION_ID"
    else
        warn "工作流执行启动失败"
        echo "   Response: $EXECUTE_WORKFLOW"
    fi
else
    warn "跳过工作流执行测试(缺少必要ID)"
fi
echo ""

# 10. 测试删除项目(软删除)
echo "Test 10: 删除项目"
DELETE_PROJECT=$(curl -s -X DELETE "http://localhost:8080/rest/s1/novel-anime/project/$PROJECT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$DELETE_PROJECT" | grep -q '"success":true'; then
    pass "项目删除成功"
else
    fail "项目删除失败"
    echo "   Response: $DELETE_PROJECT"
fi
echo ""

# 11. 验证软删除
echo "Test 11: 验证软删除"
GET_PROJECTS_AFTER=$(curl -s http://localhost:8080/rest/s1/novel-anime/projects \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_PROJECTS_AFTER" | grep -q "$PROJECT_ID"; then
    fail "项目仍在列表中(软删除未生效)"
else
    pass "项目已从列表中移除(软删除生效)"
fi
echo ""

# 12. 测试回收站
echo "Test 12: 获取回收站"
GET_DELETED=$(curl -s http://localhost:8080/rest/s1/novel-anime/projects/deleted \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_DELETED" | grep -q "$PROJECT_ID"; then
    pass "回收站包含已删除的项目"
else
    warn "回收站不包含已删除的项目"
    echo "   Response: $GET_DELETED"
fi
echo ""

# 13. 测试恢复项目
echo "Test 13: 恢复项目"
RESTORE_PROJECT=$(curl -s -X POST "http://localhost:8080/rest/s1/novel-anime/project/$PROJECT_ID/restore" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$RESTORE_PROJECT" | grep -q '"success":true'; then
    pass "项目恢复成功"
else
    warn "项目恢复失败"
    echo "   Response: $RESTORE_PROJECT"
fi
echo ""

# 14. 最终清理
echo "Test 14: 最终清理"
FINAL_DELETE=$(curl -s -X DELETE "http://localhost:8080/rest/s1/novel-anime/project/$PROJECT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
if echo "$FINAL_DELETE" | grep -q '"success":true'; then
    pass "测试数据清理成功"
else
    warn "测试数据清理失败"
fi
echo ""

# 总结
echo "========================================="
echo "测试总结"
echo "========================================="
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo -e "${YELLOW}警告: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有核心测试通过!${NC}"
    exit 0
else
    echo -e "${RED}❌ 存在失败的测试,需要修复${NC}"
    exit 1
fi
