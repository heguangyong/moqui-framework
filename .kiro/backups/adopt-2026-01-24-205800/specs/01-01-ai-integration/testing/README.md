# AI集成 测试脚本

## 概述
本目录包含AI集成功能的所有测试脚本和验证工具。

## 目录结构
- `tools/setup/` - AI提供商设置和配置脚本
- `integration/` - AI服务集成测试脚本
- `validation/` - AI功能验证工具

## 快速开始
1. 环境准备: 选择合适的AI提供商设置脚本
2. 运行设置脚本: `./tools/setup/zhipu_setup.sh` (推荐)
3. 验证AI集成: 运行相应的集成测试

## 测试脚本索引

### AI提供商设置工具
- `tools/setup/ai_providers_guide.sh` - AI提供商配置指南
- `tools/setup/baidu_setup.sh` - 百度AI设置
- `tools/setup/claude_api_setup.sh` - Claude API设置
- `tools/setup/claude_multi_token_setup.sh` - Claude多令牌设置
- `tools/setup/claude_proxy_setup.sh` - Claude代理设置
- `tools/setup/demo_zhipu_setup.sh` - 智谱AI演示设置
- `tools/setup/openai_setup.sh` - OpenAI设置
- `tools/setup/qwen_setup.sh` - 通义千问设置
- `tools/setup/xunfei_setup.sh` - 讯飞AI设置
- `tools/setup/zhipu_setup.sh` - 智谱AI设置

## 使用说明
1. 根据项目需求选择合适的AI提供商
2. 运行对应的设置脚本配置API密钥和参数
3. 使用ai_providers_guide.sh获取详细配置指导
4. 智谱AI (GLM-4/GLM-4V) 是项目推荐的主要AI提供商

## 维护信息
- 负责人: AI集成团队
- 最后更新: 2025年1月13日
- 相关文档: [AI集成架构设计](../../design.md)