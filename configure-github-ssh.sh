#!/bin/bash

echo "🔑 自动配置 GitHub SSH 认证"
echo "================================"

# 获取当前SSH公钥
SSH_KEY=$(cat ~/.ssh/id_rsa.pub 2>/dev/null)

if [ -z "$SSH_KEY" ]; then
    echo "❌ 未找到SSH公钥，需要生成新的SSH密钥"
    exit 1
fi

echo "📋 您的SSH公钥内容："
echo "$SSH_KEY"
echo ""

echo "🎯 GitHub SSH 配置步骤："
echo "1. 复制上面的SSH公钥（从ssh-rsa开始到最后）"
echo "2. 打开 GitHub SSH 设置页面：https://github.com/settings/keys"
echo "3. 点击 'New SSH key' 按钮"
echo "4. Title字段输入：moqui-dev-$(hostname)"
echo "5. 粘贴SSH公钥到Key字段"
echo "6. 点击 'Add SSH key' 保存"
echo ""

echo "🔍 验证SSH连接..."
ssh -T git@github.com -o ConnectTimeout=10 -o StrictHostKeyChecking=no 2>&1 | {
    read result
    if [[ "$result" == *"successfully authenticated"* ]]; then
        echo "✅ SSH连接成功，可以开始推送代码"
        exit 0
    else
        echo "⚠️ SSH连接未成功: $result"
        echo ""
        echo "请完成上述步骤后运行以下命令验证："
        echo "ssh -T git@github.com"
        echo ""
        echo "验证成功后运行推送脚本："
        echo "./push-to-github.sh"
        exit 1
    fi
}