# Telegram Bot 测试脚本

## 概述
本目录包含Telegram Bot功能的所有测试脚本和验证工具。

## 目录结构
- `integration/` - Telegram Bot集成测试脚本
- `tools/` - Bot配置和管理工具

## 快速开始
1. 环境准备: `./integration/telegram_setup.sh`
2. Webhook配置: `./integration/telegram_webhook_setup.sh`
3. 功能测试: `./integration/telegram_menu_test.sh`
4. 验证测试: `./integration/telegram_webhook_verification.sh`

## 测试脚本索引

### 集成测试
- `integration/telegram_marketplace_test.sh` - Telegram市场平台测试
- `integration/telegram_menu_test.sh` - Telegram菜单功能测试
- `integration/telegram_setup.sh` - Telegram Bot基础设置
- `integration/telegram_user_verification_guide.sh` - 用户验证指南
- `integration/telegram_webhook_setup.sh` - Webhook配置测试
- `integration/telegram_webhook_test.sh` - Webhook功能测试
- `integration/telegram_webhook_verification.sh` - Webhook验证测试

### 工具脚本
- `tools/reorganize_telegram_menu.sh` - Telegram菜单重组工具

## 使用说明
1. 首先运行telegram_setup.sh进行基础配置
2. 配置Webhook以接收Telegram消息
3. 使用菜单测试脚本验证Bot交互功能
4. Telegram Bot是多模态AI交互的重要入口

## 维护信息
- 负责人: Telegram Bot团队
- 最后更新: 2025年1月13日
- 相关文档: [Telegram Bot架构设计](../../design.md)