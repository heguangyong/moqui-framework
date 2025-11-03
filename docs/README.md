# 智能供需平台文档导航

## 📚 文档目录结构

本文档按照项目管理最佳实践组织，便于不同角色的开发者快速找到所需信息。

### 🔗 快速导航

| 目录 | 用途 | 主要受众 |
|------|------|----------|
| [01-guides/](#01-guides) | 开发和使用指南 | 开发者、运维人员 |
| [02-design/](#02-design) | 系统设计文档 | 架构师、高级开发者 |
| [03-tasks/](#03-tasks) | 项目任务管理 | 项目经理、开发团队 |
| [04-archive/](#04-archive) | 历史文档归档 | 研究人员、审计 |
| [05-reports/](#05-reports) | 技术报告总结 | 管理层、技术负责人 |

---

## 📖 01-guides/ - 开发指南

### 开发环境和工具
- `development-setup.md` - 开发环境搭建指南
- `debugging-methodology.md` - 调试方法论和工具链
- `deployment-guide.md` - 生产环境部署指南
- `ui-screen-customization-checklist.md` - UI 层改造复盘与最佳实践（本次 AppList/主题调整经验）

### AI集成开发
- `ai-integration-guide.md` - 多模态AI集成开发指南
- `api-integration-patterns.md` - API集成模式和最佳实践

---

## 🏗️ 02-design/ - 设计文档

### API设计 (`api/`)
- `ai-services-api.md` - AI服务API接口设计
- `telegram-bot-api.md` - Telegram Bot API设计
- `marketplace-api.md` - 供需平台API设计

### 架构设计 (`architecture/`)
- `multimodal-ai-arch.md` - 多模态AI架构设计
- `platform-integration.md` - HiveMind/POP/Marble平台集成架构
- `security-architecture.md` - 安全架构和认证体系

### 数据设计 (`data/`)
- `entity-model.md` - 实体模型和数据结构
- `data-flow.md` - 数据流设计和处理链路

### 工作流设计 (`workflow/`)
- `supply-demand-flow.md` - 供需撮合业务流程
- `project-creation-flow.md` - 项目创建和管理流程

---

## 🎯 03-tasks/ - 项目任务

### 业务开发阶段
- `phase-1-telegram-mvp/` - Phase 1: Telegram MVP实现
- `phase-2-hivemind-integration/` - Phase 2: HiveMind项目管理集成
- `phase-3-pop-ecommerce/` - Phase 3: POP电商平台集成
- `phase-4-marble-erp/` - Phase 4: Marble ERP深度整合

### 基础设施升级 (`infrastructure-upgrades/`)
- `vue3-quasar2-upgrade/` - Vue3+Quasar2技术栈升级
- `jwt-authentication/` - JWT认证系统实现
- `chrome-mcp-debugging/` - Chrome MCP调试工具链

---

## 📦 04-archive/ - 归档文档

- `legacy-integration-reports/` - 历史集成报告
- `deprecated-guides/` - 已废弃的开发指南
- `old-api-docs/` - 旧版API文档

---

## 📊 05-reports/ - 技术报告

- `technical-summaries/` - 技术实现总结
- `phase-completion-reports/` - 阶段完成报告
- `performance-analysis/` - 性能分析报告

---

## 🔄 当前开发状态

**最新进展**: [progress-log.md](progress-log.md)

### Phase 0 ✅ 已完成
- 多模态AI平台集成（智谱AI GLM-4/GLM-4V）
- JWT认证系统实施
- Vue3+Quasar2技术栈升级
- Chrome MCP调试工具链建立

### Phase 1 🔄 进行中
- Telegram MVP闭环实现
- `/supply` `/demand` `/match` 指令系统
- 多模态消息处理优化

---

## 📝 文档维护

- **更新频率**: 重要变更立即更新，常规更新每周一次
- **维护责任**: 开发团队共同维护，技术负责人审核
- **质量标准**: 文档必须与代码同步，包含完整的示例和说明

---

## 🔧 组件级文档

各组件的详细文档位于组件目录下：
- `runtime/component/moqui-marketplace/docs/` - 供需平台组件
- `runtime/component/moqui-mcp/docs/` - MCP集成组件
- `runtime/component/moqui-hivemind/docs/` - HiveMind集成组件

---

**最后更新**: 2025-11-01
**文档版本**: v3.0
**维护者**: Claude Code AI Assistant
