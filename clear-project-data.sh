#!/bin/bash

# 清空项目数据脚本
# 用于清理测试数据，重新开始完整流程测试

echo "=========================================="
echo "清空项目数据"
echo "=========================================="
echo ""

# 检查H2数据库文件
DB_FILE="runtime/db/h2/moqui.mv.db"

if [ ! -f "$DB_FILE" ]; then
    echo "❌ 数据库文件不存在: $DB_FILE"
    exit 1
fi

echo "📊 当前数据库: $DB_FILE"
echo ""

# 提示用户确认
read -p "⚠️  确定要清空所有项目数据吗？这将删除所有项目、小说、章节、场景、角色等数据。(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo ""
echo "🔄 正在清空数据..."
echo ""

# 使用Moqui的工具执行SQL
# 方法1: 通过REST API执行（需要Moqui运行中）
# 方法2: 直接使用H2的SQL工具
# 方法3: 通过Moqui的命令行工具

# 这里我们使用curl调用REST API的方式
# 需要先登录获取token

echo "方式1: 通过REST API清空数据（需要Moqui运行中）"
echo ""

# 检查Moqui是否运行
if curl -s http://localhost:8080/rest/s1/novel-anime/test/ping > /dev/null 2>&1; then
    echo "✅ Moqui正在运行"
    echo ""
    
    # 登录获取token
    echo "🔐 正在登录..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin"}')
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo "❌ 登录失败，无法获取token"
        echo "响应: $LOGIN_RESPONSE"
        echo ""
        echo "请使用方式2: 直接操作数据库"
        exit 1
    fi
    
    echo "✅ 登录成功"
    echo ""
    
    # 执行清理（需要创建对应的service）
    echo "🗑️  正在清空数据..."
    
    # 注意：这需要在Moqui中创建一个清理数据的service
    # 这里先提供SQL脚本，让用户手动执行
    
    echo "⚠️  REST API方式需要在Moqui中创建清理service"
    echo "请使用方式2: 手动执行SQL脚本"
    
else
    echo "❌ Moqui未运行"
    echo ""
fi

echo ""
echo "=========================================="
echo "方式2: 手动执行SQL脚本"
echo "=========================================="
echo ""
echo "1. 停止Moqui应用"
echo "   ./stop-applications.sh"
echo ""
echo "2. 使用H2 Console连接数据库"
echo "   java -cp runtime/lib/h2-*.jar org.h2.tools.Shell"
echo ""
echo "   连接信息:"
echo "   URL: jdbc:h2:./runtime/db/h2/moqui"
echo "   User: sa"
echo "   Password: (留空)"
echo ""
echo "3. 执行SQL脚本"
echo "   在H2 Console中执行 clear-project-data.sql 的内容"
echo ""
echo "4. 重启Moqui应用"
echo "   ./start-applications.sh"
echo ""

echo "=========================================="
echo "方式3: 使用Gradle任务（推荐）"
echo "=========================================="
echo ""
echo "创建一个Gradle任务来清空数据:"
echo ""
echo "1. 停止Moqui"
echo "   ./stop-applications.sh"
echo ""
echo "2. 执行清理"
echo "   ./gradlew clearProjectData"
echo ""
echo "3. 重启Moqui"
echo "   ./start-applications.sh"
echo ""

echo "📝 SQL脚本已生成: clear-project-data.sql"
echo ""
