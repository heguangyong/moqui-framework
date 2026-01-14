#!/bin/bash

# OpenAI GPT配置脚本
# 使用方法: ./openai_setup.sh YOUR_OPENAI_API_KEY

if [ -z "$1" ]; then
    echo "请提供OpenAI API Key"
    echo "使用方法: $0 YOUR_OPENAI_API_KEY"
    echo ""
    echo "获取API Key: https://platform.openai.com/api-keys"
    exit 1
fi

OPENAI_API_KEY="$1"

# 配置OpenAI为AI提供商
cat >> runtime/conf/MoquiDevConf.xml << EOF

    <!-- OpenAI GPT配置 -->
    <default-property name="marketplace.ai.provider" value="OPENAI"/>
    <default-property name="marketplace.ai.model" value="gpt-4o-mini"/>
    <default-property name="marketplace.ai.api.base" value="https://api.openai.com"/>
    <default-property name="marketplace.ai.api.key" value="$OPENAI_API_KEY"/>
    <default-property name="marketplace.ai.timeout.seconds" value="30"/>

EOF

echo "✅ OpenAI GPT已配置完成"
echo "🔄 请重启Moqui服务器使配置生效"
echo ""
echo "🌟 OpenAI GPT特性:"
echo "   - 全球领先的AI模型"
echo "   - 多语言支持优秀"
echo "   - 推理能力强"
echo ""
echo "💡 模型选择建议:"
echo "   - gpt-4o-mini: 性价比最高，适合日常使用"
echo "   - gpt-4o: 最高质量，适合复杂任务"