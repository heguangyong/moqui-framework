# Moqui Framework 开发文档

## 📚 统一指导书 (推荐)

**[📖 Moqui Framework 实战指导书](./moqui-framework-guide.md)** - 综合性实战指南

本指导书整合了所有核心开发经验，推荐作为主要参考文档。

## 🎯 框架开发规范 (专项文档)

### 核心规范文档

#### [Moqui组件开发实战规范](./moqui-component-standards.md)
组件开发的标准化流程和最佳实践，包含：
- 组件架构设计原则
- 开发工作流程规范
- 代码质量要求

#### [Moqui 组件开发标准模板集](./moqui-component-templates.md)
开发模板和代码示例集合，包含：
- 标准组件模板
- 服务定义模板
- 屏幕配置模板
- 实体定义模板

## 🔐 认证系统 (专项文档)

### 核心认证文档

#### [JWT认证迁移与前端架构重构实战经验总结](./jwt-auth-migration-experience.md)
**最重要的经验文档** - 记录了JWT认证迁移过程中的关键经验教训，包括：
- 如何正确理解和应用项目设计原则
- 避免破坏现有架构的重要实践
- 前端JavaScript异步处理最佳实践
- 系统性问题诊断方法论

#### [Moqui JWT企业级认证实战指南](./moqui-jwt-enterprise-guide.md)
JWT认证系统的技术实现细节和配置指南，包含：
- JWT配置参数详解
- 前端集成实现
- 安全最佳实践

## 🔍 调试与验证 (专项文档)

### Chrome MCP调试

#### [Chrome MCP调试闭环实战指南](./chrome-mcp-debug-guide.md)
**Moqui动态页面验证的核心方法** - 建立完善的Chrome MCP调试闭环，包括：
- 为什么需要Chrome MCP调试（动态渲染验证）
- 标准化调试流程和脚本
- 关键问题解决方案
- 简明有效的调试模式

#### [前端修改强制验证协议](./frontend-validation-protocol.md)
前端开发的强制验证要求和更新记录

### 前端升级文档

#### Vue.js + Quasar 升级指导
- **[Vue3+Quasar2升级指导(中文)](./vue-quasar-upgrade-guide-cn.md)** - 完整升级实战经验(13,799字)
- **[Vue3+Quasar2 Upgrade Guide(English)](./vue-quasar-upgrade-guide-en.md)** - English version (4,623 words)

## 🚀 快速开始指引

### 推荐学习路径
1. **[📖 实战指导书](./moqui-framework-guide.md)** - 完整学习体系
2. **[🔑 CLAUDE.md](../CLAUDE.md)** - 具体开发模式
3. **本目录规范文档** - 深入理解标准化流程

### 问题解决优先级
1. 🔍 **[实战指导书](./moqui-framework-guide.md)** - 综合问题解决
2. 📖 **[CLAUDE.md](../CLAUDE.md)** - 经过验证的解决方案
3. 📜 **GitHub历史版本** - 了解问题背景
4. 🧪 **Chrome MCP调试** - 动态验证实际效果

## 🔗 相关资源

- **组件文档**: `runtime/component/*/docs/`
- **调试工具**: `testing-tools/README.md`
- **项目主页**: `../README.md`

---

**维护说明**: 本目录集中管理所有项目文档，采用kebab-case命名规范