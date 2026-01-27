# 前端系统 测试脚本

## 概述
本目录包含前端系统(Vue3+Quasar2)的所有测试脚本和验证工具。

## 目录结构
- `validation/` - 前端验证和兼容性测试脚本
- `tools/` - 前端调试和开发工具

## 快速开始
1. 环境准备: 确保前端开发环境正常
2. 基线验证: `./validation/frontend_baseline_verification.sh`
3. 高级验证: `./validation/frontend_verification_advanced.sh`
4. 组件兼容性: `./validation/component_compatibility_assessment.sh`

## 测试脚本索引

### 验证工具
- `validation/frontend_baseline_verification.sh` - 前端基线验证
- `validation/frontend_verification_advanced.sh` - 前端高级验证
- `validation/component_compatibility_assessment.sh` - 组件兼容性评估

### 调试工具
- `tools/debug_vue_mounting.js` - Vue组件挂载调试脚本
- `tools/debug_vue_mounting.sh` - Vue挂载调试Shell脚本

## 使用说明
1. 所有前端修改后必须执行Chrome MCP验证协议
2. 使用基线验证确保核心功能正常工作
3. 组件兼容性测试确保Vue3+Quasar2组件正常集成
4. 调试工具帮助排查Vue组件挂载和渲染问题

## 维护信息
- 负责人: 前端开发团队
- 最后更新: 2025年1月13日
- 相关文档: [前端系统架构设计](../../design.md)