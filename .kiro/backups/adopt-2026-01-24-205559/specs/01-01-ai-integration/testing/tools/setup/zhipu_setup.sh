#!/bin/bash

# 智谱AI GLM-4配置脚本
# 使用方法: ./zhipu_setup.sh YOUR_ZHIPU_API_KEY

if [ -z "$1" ]; then
    echo "请提供智谱AI API Key"
    echo "使用方法: $0 YOUR_ZHIPU_API_KEY"
    echo ""
    echo "获取API Key: https://open.bigmodel.cn/"
    exit 1
fi

ZHIPU_API_KEY="$1"

# 配置智谱AI为AI提供商
cat >> runtime/conf/MoquiDevConf.xml << EOF

    <!-- 智谱AI GLM-4配置 -->
    <default-property name="marketplace.ai.provider" value="ZHIPU"/>
    <default-property name="marketplace.ai.model" value="glm-4-plus"/>
    <default-property name="marketplace.ai.api.base" value="https://open.bigmodel.cn/api/paas/v4"/>
    <default-property name="marketplace.ai.api.key" value="$ZHIPU_API_KEY"/>
    <default-property name="marketplace.ai.timeout.seconds" value="30"/>

EOF

echo "✅ 智谱AI GLM-4已配置完成"
echo "🔄 请重启Moqui服务器使配置生效"
echo ""
echo "🌟 智谱AI特性:"
echo "   - 中文语义理解优秀"
echo "   - 价格相对便宜"
echo "   - 响应速度快"