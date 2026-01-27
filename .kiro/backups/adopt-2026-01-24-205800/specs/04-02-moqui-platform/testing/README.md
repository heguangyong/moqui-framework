# Moqui平台 测试脚本

## 概述
本目录包含Moqui Framework平台的所有测试脚本和验证工具。

## 目录结构
- `integration/` - Moqui平台集成测试脚本
- `validation/` - 平台验证工具

## 快速开始
1. 环境准备: 确保Moqui服务器正常运行
2. 用户测试: `./integration/real_user_test.sh`
3. 完整测试: `./integration/user_complete_test.sh`
4. 解决方案验证: 打开 `integration/moqui_complete_solution.html`

## 测试脚本索引

### 集成测试
- `integration/real_user_test.sh` - 真实用户场景测试
- `integration/user_complete_test.sh` - 用户完整流程测试
- `integration/moqui_complete_solution.html` - Moqui完整解决方案测试页面

## 使用说明
1. Moqui Framework是项目的核心后端框架
2. 真实用户测试模拟实际业务场景
3. 完整解决方案测试验证端到端功能
4. 确保所有Moqui组件和服务正常工作

## 维护信息
- 负责人: Moqui平台团队
- 最后更新: 2025年1月13日
- 相关文档: [Moqui平台架构设计](../../design.md)