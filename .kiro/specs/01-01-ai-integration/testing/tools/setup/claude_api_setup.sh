#!/bin/bash

# Claude API配置脚本
# 使用方法: ./claude_api_setup.sh YOUR_CLAUDE_API_KEY

if [ -z "$1" ]; then
    echo "请提供Claude API Key"
    echo "使用方法: $0 YOUR_CLAUDE_API_KEY"
    exit 1
fi

CLAUDE_API_KEY="$1"

# 配置Claude为AI提供商
cat >> runtime/conf/MoquiDevConf.xml << EOF

    <!-- Claude AI配置 -->
    <default-property name="marketplace.ai.provider" value="CLAUDE"/>
    <default-property name="marketplace.ai.model" value="claude-3-5-sonnet-20241022"/>
    <default-property name="marketplace.ai.api.base" value="https://api.anthropic.com"/>
    <default-property name="marketplace.ai.api.key" value="$CLAUDE_API_KEY"/>
    <default-property name="marketplace.ai.timeout.seconds" value="45"/>

EOF

echo "✅ Claude API已配置完成"
echo "🔄 请重启Moqui服务器使配置生效"