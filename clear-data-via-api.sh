#!/bin/bash

# 通过REST API清空项目数据
# 这是最简单的方式，不需要停止Moqui

echo "=========================================="
echo "通过REST API清空项目数据"
echo "=========================================="
echo ""

# API基础URL
API_BASE="http://localhost:8080/rest/s1/novel-anime"

# 1. 检查Moqui是否运行
echo "🔍 检查Moqui服务状态..."
if ! curl -s "${API_BASE}/auth/status" > /dev/null 2>&1; then
    echo "❌ Moqui服务未运行"
    echo "请先启动Moqui: ./start-applications.sh"
    exit 1
fi
echo "✅ Moqui服务正在运行"
echo ""

# 2. 获取当前数据统计
echo "📊 当前数据统计:"
STATS=$(curl -s "${API_BASE}/data/statistics")
echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"
echo ""

# 3. 确认清空
read -p "⚠️  确定要清空所有项目数据吗？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo ""
echo "🗑️  正在清空数据..."

# 4. 调用清空API
RESULT=$(curl -s -X POST "${API_BASE}/data/clear-all" \
    -H "Content-Type: application/json")

echo ""
echo "📋 清空结果:"
echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
echo ""

# 5. 再次获取数据统计确认
echo "📊 清空后数据统计:"
STATS_AFTER=$(curl -s "${API_BASE}/data/statistics")
echo "$STATS_AFTER" | python3 -m json.tool 2>/dev/null || echo "$STATS_AFTER"
echo ""

echo "✅ 数据清空完成！"
echo ""
echo "现在可以重新开始完整的流程测试了。"
echo ""
