# JWT认证系统 测试脚本

## 概述
本目录包含JWT认证系统的所有测试脚本和验证工具。

## 目录结构
- `unit/` - 单元测试脚本和HTML测试文件
- `integration/` - JWT认证集成测试
- `validation/` - Chrome认证验证工具

## 快速开始
1. 环境准备: 确保Moqui服务器运行在JWT纯认证模式
2. 运行单元测试: 打开 `unit/pure_jwt_test.html` 进行基础测试
3. 运行集成测试: `./integration/jwt_chrome_mcp.sh`
4. Chrome验证: `./validation/chrome_jwt_verification.sh`

## 测试脚本索引

### 单元测试
- `unit/pure_jwt_test.html` - 纯JWT认证单元测试页面
- `unit/jwt_fix_frontend.html` - JWT前端修复测试页面

### 集成测试
- `integration/jwt_chrome_mcp.sh` - JWT Chrome MCP集成测试
- `integration/jwt_frontend_fix.sh` - JWT前端修复集成测试

### 验证工具
- `validation/chrome_jwt_fixed.sh` - Chrome JWT修复验证
- `validation/chrome_jwt_verification.sh` - Chrome JWT验证工具

## 使用说明
1. 确保系统配置为JWT纯认证模式 (moqui.webapp.auth.mode=jwt_only)
2. 使用Chrome验证工具确保前端JWT集成正常工作
3. 所有前端修改后必须执行Chrome MCP验证协议
4. JWT认证是项目的统一认证标准，避免混合认证模式

## 维护信息
- 负责人: 认证系统团队
- 最后更新: 2025年1月13日
- 相关文档: [JWT认证架构设计](../../design.md)