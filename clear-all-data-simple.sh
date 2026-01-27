#!/bin/bash

# 简单粗暴的清空所有数据方法
# 直接删除Asset和Project

echo "=========================================="
echo "清空剩余数据"
echo "=========================================="
echo ""

API_BASE="http://localhost:8080/rest/s1/novel-anime"

# 1. 获取所有Asset并删除
echo "🗑️  删除所有Asset..."
ASSETS=$(curl -s "${API_BASE}/assets" | python3 -c "import sys, json; data=json.load(sys.stdin); print(' '.join([a['assetId'] for a in data.get('assets', [])]))")

for ASSET_ID in $ASSETS; do
    echo "  删除Asset: $ASSET_ID"
    curl -s -X DELETE "${API_BASE}/asset?assetId=$ASSET_ID" > /dev/null
done

# 2. 获取所有Project并删除
echo "🗑️  删除所有Project..."
PROJECTS=$(curl -s "${API_BASE}/projects" | python3 -c "import sys, json; data=json.load(sys.stdin); print(' '.join([p['projectId'] for p in data.get('projects', [])]))")

for PROJECT_ID in $PROJECTS; do
    echo "  删除Project: $PROJECT_ID"
    curl -s -X DELETE "${API_BASE}/project/${PROJECT_ID}" > /dev/null
done

echo ""
echo "✅ 清空完成！"
echo ""

# 3. 验证
echo "📊 最终数据统计:"
curl -s "${API_BASE}/data/statistics" | python3 -m json.tool
echo ""
