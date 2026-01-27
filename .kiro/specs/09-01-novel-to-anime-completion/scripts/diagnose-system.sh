#!/bin/bash

# 小说转动漫系统诊断脚本
# Spec: 09-01-novel-to-anime-completion
# 目标: 全面诊断系统状态,识别问题

echo "========================================="
echo "小说转动漫系统诊断"
echo "========================================="
echo ""

# 1. 检查后端服务
echo "1. 检查后端Moqui服务..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/rest/s1/novel-anime/projects)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "   ✅ 后端服务正常运行"
else
    echo "   ❌ 后端服务异常 (HTTP $BACKEND_STATUS)"
fi
echo ""

# 2. 检查可用的API端点
echo "2. 检查可用的API端点..."
curl -s http://localhost:8080/rest/s1/novel-anime/test 2>&1 | grep -q "errorCode"
if [ $? -eq 0 ]; then
    echo "   ⚠️  部分端点可能不可用"
    echo "   可用端点列表:"
    curl -s http://localhost:8080/rest/s1/novel-anime/test 2>&1 | grep "resources available" | sed 's/.*resources available are \[/   - /' | sed 's/\]//' | tr ',' '\n'
else
    echo "   ✅ API端点正常"
fi
echo ""

# 3. 检查认证功能
echo "3. 检查认证功能..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"john.doe","password":"moqui"}')
echo "$LOGIN_RESPONSE" | grep -q "accessToken"
if [ $? -eq 0 ]; then
    echo "   ✅ 认证功能正常"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${ACCESS_TOKEN:0:20}..."
else
    echo "   ❌ 认证功能异常"
    echo "   Response: $LOGIN_RESPONSE"
fi
echo ""

# 4. 检查项目管理功能
echo "4. 检查项目管理功能..."
if [ -n "$ACCESS_TOKEN" ]; then
    PROJECTS=$(curl -s http://localhost:8080/rest/s1/novel-anime/projects \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    echo "$PROJECTS" | grep -q "success"
    if [ $? -eq 0 ]; then
        echo "   ✅ 项目管理API正常"
        PROJECT_COUNT=$(echo "$PROJECTS" | grep -o '"projects":\[' | wc -l)
        echo "   当前项目数: $PROJECT_COUNT"
    else
        echo "   ❌ 项目管理API异常"
    fi
else
    echo "   ⏭️  跳过(认证失败)"
fi
echo ""

# 5. 检查小说管理功能
echo "5. 检查小说管理功能..."
if [ -n "$ACCESS_TOKEN" ]; then
    NOVELS=$(curl -s http://localhost:8080/rest/s1/novel-anime/novels \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    echo "$NOVELS" | grep -q "success"
    if [ $? -eq 0 ]; then
        echo "   ✅ 小说管理API正常"
    else
        echo "   ❌ 小说管理API异常"
    fi
else
    echo "   ⏭️  跳过(认证失败)"
fi
echo ""

# 6. 检查角色管理功能
echo "6. 检查角色管理功能..."
if [ -n "$ACCESS_TOKEN" ]; then
    CHARACTERS=$(curl -s http://localhost:8080/rest/s1/novel-anime/characters \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    echo "$CHARACTERS" | grep -q "success"
    if [ $? -eq 0 ]; then
        echo "   ✅ 角色管理API正常"
    else
        echo "   ❌ 角色管理API异常"
    fi
else
    echo "   ⏭️  跳过(认证失败)"
fi
echo ""

# 7. 检查工作流功能
echo "7. 检查工作流功能..."
if [ -n "$ACCESS_TOKEN" ]; then
    WORKFLOWS=$(curl -s http://localhost:8080/rest/s1/novel-anime/workflows \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    echo "$WORKFLOWS" | grep -q "success"
    if [ $? -eq 0 ]; then
        echo "   ✅ 工作流API正常"
    else
        echo "   ❌ 工作流API异常"
    fi
else
    echo "   ⏭️  跳过(认证失败)"
fi
echo ""

# 8. 检查前端应用
echo "8. 检查前端应用..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ 前端应用正常运行"
else
    echo "   ❌ 前端应用异常 (HTTP $FRONTEND_STATUS)"
fi
echo ""

# 9. 检查数据库连接
echo "9. 检查数据库状态..."
if [ -f "runtime/db/derby/moqui/seg0/c10.dat" ]; then
    echo "   ✅ Derby数据库文件存在"
    DB_SIZE=$(du -sh runtime/db/derby/moqui 2>/dev/null | cut -f1)
    echo "   数据库大小: $DB_SIZE"
else
    echo "   ⚠️  数据库文件未找到"
fi
echo ""

# 10. 总结
echo "========================================="
echo "诊断总结"
echo "========================================="
echo ""
echo "请根据以上诊断结果:"
echo "1. 修复标记为 ❌ 的问题"
echo "2. 调查标记为 ⚠️  的警告"
echo "3. 验证标记为 ✅ 的功能"
echo ""
echo "下一步: 运行端到端测试"
echo "========================================="
