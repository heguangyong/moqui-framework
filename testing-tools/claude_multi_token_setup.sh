#!/bin/bash

# Claude多Token配置脚本 - 支持负载均衡和自动切换
# 使用您提供的代理服务和多个API Token

TOKENS=(
    "sk-l7qtU4hsKDd4VibSl36kiYI1PNBIYR3hE7nGLIuEak4cvLEL"
    "sk-XJPmxt29Y5YRqF1TaG6rTxsfzVvG6d8iPTVjpcICmgDhPMcN"
    "sk-cisF40yEr1OjrLb1LmqR5yByfvh9k5mVc5wiVGrS11gDaeN9"
    "sk-RP0c00rwf7Jw1zyuGATW6J2Q4p7btUjgps5sOWn6QIAD0rYS"
    "sk-EmGDgO2eLJpiAWEG8ozHGjALxorl4QnECcTvxVH5OnAhwnxw"
)

PROXY_BASE="https://q.quuvv.cn"
CONFIG_FILE="runtime/conf/MoquiDevConf.xml"

echo "🤖 配置Claude多Token智能轮换系统..."

# 测试哪个token可用
echo "🔍 测试可用的API Token..."
WORKING_TOKEN=""

for token in "${TOKENS[@]}"; do
    echo "测试 ${token:0:12}..."

    response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $token" \
         -H "Content-Type: application/json" \
         -d '{"model":"claude-3-haiku-20240307","messages":[{"role":"user","content":"test"}],"max_tokens":5}' \
         "$PROXY_BASE/v1/messages")

    http_code="${response: -3}"
    response_body="${response%???}"

    if [[ "$http_code" == "200" ]]; then
        echo "✅ Token ${token:0:12} 可用"
        WORKING_TOKEN="$token"
        break
    elif [[ "$response_body" == *"负载已经达到上限"* ]]; then
        echo "⚠️  Token ${token:0:12} 负载满，继续测试下一个..."
    else
        echo "❌ Token ${token:0:12} 不可用: $response_body"
    fi
done

if [ -z "$WORKING_TOKEN" ]; then
    echo "❌ 所有Token当前都不可用，配置第一个作为默认"
    WORKING_TOKEN="${TOKENS[0]}"
else
    echo "🎯 选择可用Token: ${WORKING_TOKEN:0:12}..."
fi

# 备份配置文件
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# 更新配置文件
sed -i '' 's|marketplace.ai.provider.*|<default-property name="marketplace.ai.provider" value="CLAUDE"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.model.*|<default-property name="marketplace.ai.model" value="claude-3-5-sonnet-20241022"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.base.*|<default-property name="marketplace.ai.api.base" value="'$PROXY_BASE'"/>|' "$CONFIG_FILE"
sed -i '' 's|marketplace.ai.api.key.*|<default-property name="marketplace.ai.api.key" value="'$WORKING_TOKEN'"/>|' "$CONFIG_FILE"

# 添加所有备用Token到配置中（供Java代码轮换使用）
if ! grep -q "marketplace.ai.backup.tokens" "$CONFIG_FILE"; then
    backup_tokens=$(IFS=','; echo "${TOKENS[*]}")
    sed -i '' '/marketplace.ai.api.key/a\
    <default-property name="marketplace.ai.backup.tokens" value="'$backup_tokens'"/>
' "$CONFIG_FILE"
fi

echo ""
echo "✅ Claude多Token配置完成"
echo ""
echo "📋 配置详情:"
echo "   Provider: CLAUDE"
echo "   Model: claude-3-5-sonnet-20241022"
echo "   API Base: $PROXY_BASE"
echo "   主Token: ${WORKING_TOKEN:0:12}..."
echo "   备用Token数量: ${#TOKENS[@]}"
echo ""
echo "🔄 系统将自动在Token间轮换以避免负载限制"
echo "🔄 请重启Moqui服务器使配置生效"
echo "💬 然后发送Telegram消息测试Claude智能对话功能"
echo ""
echo "🎯 Claude-3.5-Sonnet 具有最高的对话质量和推理能力！"