# 市场平台 测试脚本

## 概述
本目录包含智能供需市场平台的所有测试脚本和验证工具。

## 目录结构
- `integration/` - 市场平台集成测试脚本
- `integration/api-tests/` - API接口专项测试

## 快速开始
1. 环境准备: 确保Moqui市场平台组件正常运行
2. 直接测试: `./integration/test_marketplace_direct.sh`
3. MCP测试: `./integration/test_marketplace_mcp.sh`
4. API测试: `./integration/api-tests/ecommerce_order_rest_examples.sh`

## 测试脚本索引

### 集成测试
- `integration/telegram_marketplace_test.sh` - Telegram市场平台集成测试
- `integration/test_marketplace_direct.sh` - 市场平台直接测试
- `integration/test_marketplace_mcp.sh` - 市场平台MCP测试

### API测试
- `integration/api-tests/ecommerce_order_rest_examples.sh` - 电商订单REST API示例测试

## 使用说明
1. 市场平台是供需撮合的核心业务系统
2. 支持通过Telegram Bot进行智能供需发布和匹配
3. API测试验证REST接口的完整性和正确性
4. MCP测试验证AI驱动的智能匹配功能

## 维护信息
- 负责人: 市场平台团队
- 最后更新: 2025年1月13日
- 相关文档: [市场平台架构设计](../../design.md)