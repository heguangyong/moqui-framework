#!/bin/bash

echo "🔍 GitHub SSH 诊断和修复脚本"
echo "================================="

echo "📋 1. SSH密钥状态检查"
echo "SSH私钥权限:"
ls -la ~/.ssh/id_rsa
echo ""

echo "SSH公钥内容:"
cat ~/.ssh/id_rsa.pub
echo ""

echo "📋 2. SSH Agent状态"
echo "SSH Agent中的密钥:"
ssh-add -l || echo "Agent中无密钥，正在添加..."
ssh-add ~/.ssh/id_rsa 2>/dev/null && echo "✅ 密钥已添加到SSH Agent"

echo ""
echo "📋 3. GitHub SSH连接测试"
echo "测试GitHub SSH连接..."
ssh -T git@github.com -o ConnectTimeout=10 2>&1 | {
    read -r result
    if [[ "$result" == *"successfully authenticated"* ]]; then
        echo "✅ SSH连接成功"
        SSH_SUCCESS=true
    else
        echo "❌ SSH连接失败: $result"
        SSH_SUCCESS=false
    fi

    if [ "$SSH_SUCCESS" = false ]; then
        echo ""
        echo "🔧 SSH问题解决方案："
        echo "1. 请检查您是否已将以下SSH公钥添加到GitHub："
        echo "   📍 GitHub SSH设置: https://github.com/settings/keys"
        echo ""
        echo "2. 您的SSH公钥（请复制完整内容）："
        cat ~/.ssh/id_rsa.pub
        echo ""
        echo "3. 如果已添加，可能需要等待几分钟生效"
        echo "4. 或者尝试删除并重新添加SSH密钥"
        echo ""
        echo "📝 添加步骤："
        echo "   - 点击 'New SSH key'"
        echo "   - Title: moqui-dev-$(hostname)"
        echo "   - Key: 复制上面完整的SSH公钥"
        echo "   - 点击 'Add SSH key'"
    fi
}

echo ""
echo "📋 4. Git远程仓库配置"
echo "当前远程仓库："
git remote -v

echo ""
echo "📋 5. 如果SSH正常，将尝试推送代码"
if ssh -T git@github.com -o ConnectTimeout=5 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH连接正常，可以进行代码推送"
    echo "执行: ./push-to-github.sh"
else
    echo "⚠️ 请先解决SSH连接问题，然后重新运行此脚本"
    echo ""
    echo "🔄 快速重试步骤:"
    echo "1. 确认SSH密钥已添加到GitHub"
    echo "2. 等待2-3分钟让密钥生效"
    echo "3. 重新运行: ./fix-github-ssh.sh"
fi