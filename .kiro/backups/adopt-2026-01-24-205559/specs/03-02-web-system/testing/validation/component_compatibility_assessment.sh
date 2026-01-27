#!/bin/bash
# 组件兼容性评估脚本
set -e

MOQUI_URL="http://localhost:8080"
USERNAME="john.doe"
PASSWORD="moqui"

echo "🔍 组件兼容性评估开始"
echo "========================================"

# 建立认证会话
curl -s -X POST "$MOQUI_URL/Login/login" \
     -d "username=$USERNAME&password=$PASSWORD" \
     -c /tmp/compat_session.txt -L > /dev/null

# 步骤1: 核心组件结构检查
echo "📋 步骤1: 核心组件结构检查"
echo "已安装组件:"
for comp in HiveMind moqui-marketplace moqui-mcp PopCommerce MarbleERP moqui-minio; do
    if [ -d "runtime/component/$comp" ]; then
        if [ -f "runtime/component/$comp/component.xml" ]; then
            echo "  ✅ $comp: 完整安装"
        else
            echo "  ⚠️  $comp: 缺少component.xml"
        fi
    else
        echo "  ❌ $comp: 未安装"
    fi
done

# 步骤2: 前端集成验证
echo ""
echo "📋 步骤2: 前端页面访问验证"

# 测试主要页面
PAGES=("qapps" "qapps/marketplace" "qapps/tools" "qapps/system")
for page in "${PAGES[@]}"; do
    RESPONSE_SIZE=$(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/$page" | wc -c)
    if [ "$RESPONSE_SIZE" -gt 5000 ]; then
        echo "  ✅ $page: 正常访问 (${RESPONSE_SIZE}字节)"
    elif [ "$RESPONSE_SIZE" -gt 1000 ]; then
        echo "  ⚠️  $page: 部分内容 (${RESPONSE_SIZE}字节)"
    else
        echo "  ❌ $page: 访问异常 (${RESPONSE_SIZE}字节)"
    fi
done

# 步骤3: API端点验证
echo ""
echo "📋 步骤3: REST API端点验证"

# 根据日志确定的可用资源
API_ENDPOINTS=(
    "marketplace/listing"
    "marketplace/match"
    "marketplace/stats"
    "marketplace/webhook"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/rest/s1/$endpoint" -w "%{http_code}" -o /dev/null)
    case $HTTP_CODE in
        200|201) echo "  ✅ $endpoint: API正常 ($HTTP_CODE)" ;;
        401|403) echo "  ⚠️  $endpoint: 需要认证 ($HTTP_CODE)" ;;
        404) echo "  ❌ $endpoint: 端点不存在 ($HTTP_CODE)" ;;
        *) echo "  ⚠️  $endpoint: 其他状态 ($HTTP_CODE)" ;;
    esac
done

# 步骤4: 组件功能验证
echo ""
echo "📋 步骤4: 关键组件功能验证"

# HiveMind项目管理
echo "  HiveMind项目管理:"
HIVEMIND_SIZE=$(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/apps/hivemind" | wc -c)
if [ "$HIVEMIND_SIZE" -gt 5000 ]; then
    echo "    ✅ 项目管理界面正常访问"
else
    echo "    ⚠️  项目管理界面可能有问题 (${HIVEMIND_SIZE}字节)"
fi

# PopCommerce电商
echo "  PopCommerce电商:"
POPC_SIZE=$(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/vapps/PopcAdmin" -w "%{http_code}" -o /dev/null)
if [ "$POPC_SIZE" == "200" ]; then
    echo "    ✅ 电商管理界面可访问"
else
    echo "    ⚠️  电商管理界面状态: $POPC_SIZE"
fi

# MarbleERP制造
echo "  MarbleERP制造:"
MARBLE_SIZE=$(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/apps/marbleERP" -w "%{http_code}" -o /dev/null)
if [ "$MARBLE_SIZE" == "200" ]; then
    echo "    ✅ ERP制造界面可访问"
else
    echo "    ⚠️  ERP制造界面状态: $MARBLE_SIZE"
fi

# 步骤5: JWT认证兼容性
echo ""
echo "📋 步骤5: JWT认证系统验证"
JWT_RESPONSE=$(curl -s -X POST "$MOQUI_URL/rest/s1/moqui/auth/login" \
                    -H "Content-Type: application/json" \
                    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

if echo "$JWT_RESPONSE" | grep -q '"success" : true'; then
    echo "  ✅ JWT认证API正常工作"
    JWT_TOKEN=$(echo "$JWT_RESPONSE" | grep -o '"accessToken" : "[^"]*"' | cut -d'"' -f4)
    echo "  ✅ JWT Token生成成功 (${#JWT_TOKEN}字符)"
else
    echo "  ❌ JWT认证API异常"
fi

# 步骤6: 多模态AI集成验证
echo ""
echo "📋 步骤6: AI集成组件验证"

# 检查AI配置
AI_PROVIDER=$(grep "marketplace.ai.provider" runtime/conf/MoquiDevConf.xml | grep -o 'value="[^"]*"' | cut -d'"' -f2)
if [ -n "$AI_PROVIDER" ]; then
    echo "  ✅ AI提供商配置: $AI_PROVIDER"
else
    echo "  ⚠️  AI提供商配置未找到"
fi

# Telegram Bot配置检查
TELEGRAM_TOKEN=$(grep "mcp.telegram.bot.token" runtime/conf/MoquiDevConf.xml | grep -o 'value="[^"]*"' | cut -d'"' -f2)
if [ -n "$TELEGRAM_TOKEN" ]; then
    echo "  ✅ Telegram Bot配置存在"
else
    echo "  ⚠️  Telegram Bot配置未找到"
fi

# 步骤7: 生成兼容性报告
echo ""
echo "📋 步骤7: 兼容性评估总结"
echo "========================================"

cat > /tmp/compatibility_report.txt << EOF
# 组件兼容性评估报告
评估时间: $(date)

## 组件安装状态
HiveMind: $([ -d "runtime/component/HiveMind" ] && echo "已安装" || echo "未安装")
moqui-marketplace: $([ -d "runtime/component/moqui-marketplace" ] && echo "已安装" || echo "未安装")
PopCommerce: $([ -d "runtime/component/PopCommerce" ] && echo "已安装" || echo "未安装")
MarbleERP: $([ -d "runtime/component/MarbleERP" ] && echo "已安装" || echo "未安装")
moqui-mcp: $([ -d "runtime/component/moqui-mcp" ] && echo "已安装" || echo "未安装")

## 前端集成状态
主页面(qapps): $(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/qapps" | wc -c)字节
Marketplace: $(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/qapps/marketplace" | wc -c)字节
Tools: $(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/qapps/tools" | wc -c)字节
System: $(curl -s -b /tmp/compat_session.txt "$MOQUI_URL/qapps/system" | wc -c)字节

## JWT认证状态
JWT API: $(echo "$JWT_RESPONSE" | grep -q '"success" : true' && echo "正常" || echo "异常")

## AI集成状态
AI提供商: $AI_PROVIDER
Telegram Bot: $([ -n "$TELEGRAM_TOKEN" ] && echo "已配置" || echo "未配置")

EOF

echo "📊 兼容性评估完成"
echo "📋 详细报告已保存: /tmp/compatibility_report.txt"
echo "========================================"