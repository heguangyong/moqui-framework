#!/bin/bash

echo "🔧 GitHub 认证配置助手"
echo "==============================="

echo "当前问题：无法推送代码到 GitHub 由于认证失败"
echo ""

echo "解决方案选择："
echo "1. SSH 密钥认证（推荐）"
echo "2. Personal Access Token 认证"
echo ""

echo "📋 SSH 密钥方法（选项 1）："
echo "您的 SSH 公钥已准备好："
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDUvcOBO15ZtV+G/txaV0gjuVrIYV5GH7nGAfajodRhn4Pnz1Pyv0tt/H2eF/6QG9+sQ4/OGzQCLfG7DKNXSfen3c4r2u2RaAbVTYxccIPvT2Qvf5sT+0QSqRqfaMrttIgtdFDX1H+Jpc1JLzAlIms632HlQe/ZnDEoelCGZ+IicXwmwmGVFgOYb4BiQor2DdLZhr3O4MPQEG8/97XMZGHITpLRj3rN660xkPFVEYeCL3BZZ2/KUycqYgVS4omEZEunq0DFob9563H4dDWDnDZ7ONVfGQZ+B0CyCz7HQLs4DLS0JHZQkIhvaJdTIWqToATOWrn8zXGux9Jm7o6NKx3L4FHCYhWuPb6irGF2kqdzwcJxfl2ttVy+w1Q89KCR8lPfVR3hZkfdamaYJXCSZvatcfwqZLJGhH+o+qVVwE/uW9MRwpOYKcNXQ7NFybDCdve1j7yFqfgrYrgo/vjPTfSGRu1io3eQLcKOSOhpiw9rhV6hIXjH0DK/QSKGHJMLZ3c= demo@mini.local"
echo ""
echo "请完成以下步骤："
echo "1. 登录 GitHub (https://github.com/settings/keys)"
echo "2. 点击 'New SSH key'"
echo "3. 复制上面的公钥粘贴到 'Key' 字段"
echo "4. 设置标题为 'moqui-dev-mac'"
echo "5. 点击 'Add SSH key'"
echo ""

echo "然后运行以下命令切换到 SSH："
echo "git remote set-url origin git@github.com:heguangyong/moqui-framework.git"
echo ""

echo "📋 Personal Access Token 方法（选项 2）："
echo "1. 访问 https://github.com/settings/tokens"
echo "2. 点击 'Generate new token' -> 'Generate new token (classic)'"
echo "3. 设置范围：repo, workflow"
echo "4. 复制生成的 token"
echo "5. 运行以下命令（将 YOUR_TOKEN 替换为实际 token）："
echo ""
echo "echo 'https://heguangyong@gmail.com:YOUR_TOKEN@github.com' >> ~/.git-credentials"
echo "git config --global credential.helper store"
echo ""

echo "🚀 配置完成后，运行以下命令推送代码："
echo "git push origin master"
echo ""

echo "📝 当前待推送的提交："
git log --oneline -3