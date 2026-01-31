# 智能推荐 - Moqui Framework

基于Moqui Framework构建的企业级智能推荐平台，集成多模态AI能力。

## 🚀 快速开始

### 系统要求
- **Java**: 21 LTS
- **内存**: 最低8GB

### 启动系统
```bash
./gradlew run
```

### 访问地址
- **主界面**: http://localhost:8080/qapps
- **用户名/密码**: john.doe / moqui

## 🎯 核心功能

- **🤖 多模态AI**: 语音识别、图像分析、智能对话
- **🏪 供需撮合**: AI驱动的智能匹配和价格分析
- **🔗 平台集成**: HiveMind、电商、ERP系统

## 📱 主要应用

- **智能推荐** (`/qapps/marketplace`): 供需发布、智能匹配
- **项目管理** (`/qapps/tools`): 任务管理、协作工具
- **系统管理** (`/qapps/system`): 用户权限、系统监控

## 🛠️ 技术架构

- **后端**: Moqui Framework 3.1.0 + Java 21 + JWT认证
- **前端**: Vue.js 3.5.22 + Quasar 2.18.5 + FreeMarker
- **AI**: 智谱AI GLM-4/GLM-4V + 多厂商备选
- **数据**: H2(开发) / MySQL(生产)

## 📚 文档

### 项目设置 (新项目)
- **[ERP 项目设置指南](docs/setup/ERP_PROJECT_SETUP_GUIDE.md)**: 完整的新项目设置指南
- **[快速设置摘要](docs/setup/ERP_PROJECT_SETUP_SUMMARY.md)**: 30-60分钟快速开始
- **[KSE 1.18.1 新特性](docs/setup/KSE_1.18.1_NEW_FEATURES.md)**: Kiro Spec Engine 新特性详解

### 技术指南 (当前项目)
- **[项目概览](.kiro/steering/project-overview.md)**: 完整的项目技术栈和结构说明
- **[Moqui开发指南](.kiro/steering/moqui-framework-guide.md)**: 基于官方文档+项目实践的完整指南
- **[Quasar前端指南](.kiro/steering/quasar-framework-guide.md)**: Vue3+Quasar2跨平台开发指南
- **[开发标准](.kiro/steering/moqui-standards.md)**: 认证配置、菜单配置等开发标准

### 项目状态
- **[项目状态报告](docs/status/PROJECT_STATUS_2026_01_28.md)**: 前端架构重构总结和遗留问题

### 传统文档
- **[技术报告](docs/)**: 实施总结和架构分析
- **[开发指南](CLAUDE.md)**: AI开发助手核心参考 ⚠️ 建议使用新的steering指南
- **[调试工具](testing-tools/)**: Chrome MCP认证、JWT测试等

### Kiro Spec 驱动开发
- **[Spec 工作流指南](.kiro/specs/SPEC_WORKFLOW_GUIDE.md)**: Spec 驱动开发完整流程
- **[核心开发原则](.kiro/steering/CORE_PRINCIPLES.md)**: 适用于所有 Spec 的基准规则
- **[环境配置](.kiro/steering/ENVIRONMENT.md)**: 项目环境和配置信息
- **[当前场景规则](.kiro/steering/CURRENT_CONTEXT.md)**: 当前 Spec 的场景规则

## 🚀 开发状态

### ✅ 已完成
- 多模态AI平台集成 (智谱AI GLM-4/GLM-4V)
- JWT认证系统实施
- Vue3+Quasar2技术栈升级

### 🔄 进行中
- Telegram Bot集成
- 多模态消息处理

## 🤖 AI开发指南

### 推荐资源 (最新)
- **[Moqui开发指南](.kiro/steering/moqui-framework-guide.md)**: 完整的Moqui开发指南
- **[开发原则](.kiro/steering/development-principles.md)**: 核心开发原则和质量标准
- **[开发标准](.kiro/steering/moqui-standards.md)**: 认证配置、菜单配置等标准

### 传统参考
- **核心参考**: [CLAUDE.md](CLAUDE.md) ⚠️ 建议使用上述新指南
- **认证模式**: Service用`authenticate="false"`，Screen用`require-authentication="false"`
- **强制验证**: 前端修改必须Chrome MCP验证

---

## 📚 更多资源

详细信息请参见Moqui Framework官方文档：

<https://www.moqui.org/docs/framework>

[![license](https://img.shields.io/badge/license-CC0%201.0%20Universal-blue.svg)](https://github.com/moqui/moqui-framework/blob/master/LICENSE.md)

---

**快速访问**: [系统首页](http://localhost:8080/qapps) | [技术指南](.kiro/steering/) | [调试工具](testing-tools/)

### 📖 文档迁移说明

⚠️ **重要**: 技术文档已迁移到 `.kiro/steering/` 目录，提供更统一和权威的技术指导。原有的 `.claude/skills/` 目录已添加重定向说明。


