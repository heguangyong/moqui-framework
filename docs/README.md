# Moqui Framework 文档中心

本目录是 Moqui Framework 项目的统一文档中心，采用结构化组织方式便于导航和维护。

## 📋 核心文档

### 进度跟踪
- **[progress-log.md](progress-log.md)** - 项目进展时间线（倒序记录）

## 🎯 专项目录

### 开发指南与方法论
**目录**: [development-guides/](development-guides/)
**状态**: ✅ 完成
**目标**: 提供完整的开发方法论和标准化指南

**关键文档**:
- `development-methodology-guide.md` - 完整的开发方法论和最佳实践
- `moqui-framework-guide.md` - Moqui Framework 实战指导书（24,868 词）
- `moqui-component-standards.md` - Moqui 组件开发标准
- `moqui-component-templates.md` - 组件模板和最佳实践

### Vue3+Quasar2 升级项目
**目录**: [vue3-quasar2-upgrade/](vue3-quasar2-upgrade/)
**状态**: ✅ 完成
**目标**: Vue 2.7.14 + Quasar 1.22.10 → Vue 3.5.22 + Quasar 2.18.5

**关键文档**:
- `README.md` - 项目概览和技术要求
- `phase-plan.md` - 分阶段实施计划
- `progress-log.md` - 详细进度记录
- `validation-checklist.md` - 验证清单
- `vue3-native-refactor-strategy.md` - Vue3 原生重构策略

### JWT 企业级实施项目
**目录**: [jwt-enterprise-implementation/](jwt-enterprise-implementation/)
**状态**: ✅ 完成
**目标**: 构建企业级 JWT 认证与授权系统

**关键文档**:
- `jwt-auth-migration-experience.md` - JWT 认证迁移经验总结
- `moqui-jwt-enterprise-guide.md` - 企业级 JWT 实施指南

### Chrome MCP 调试系统
**目录**: [chrome-mcp-debugging/](chrome-mcp-debugging/)
**状态**: ✅ 完成
**目标**: 解决 Chrome headless 认证限制，建立可靠的前端验证机制

**关键文档**:
- `chrome-mcp-debug-guide.md` - Chrome MCP 调试闭环实战指南

### 前端现代化改造
**目录**: [frontend-modernization/](frontend-modernization/)
**状态**: 🔧 进行中
**目标**: 前端技术栈现代化和用户体验提升

**关键文档**:
- `frontend-validation-protocol.md` - 前端验证协议
- `vue-quasar-upgrade-guide-cn.md` - Vue/Quasar 升级指南（中文）
- `vue-quasar-upgrade-guide-en.md` - Vue/Quasar 升级指南（英文）

## 🔍 快速导航

### 按开发阶段
- **规划阶段**: [development-guides/development-methodology-guide.md](development-guides/development-methodology-guide.md)
- **技术实施**: 各专项目录下的具体指南
- **进度跟踪**: [progress-log.md](progress-log.md)

### 按技术类型
- **前端技术**: [vue3-quasar2-upgrade/](vue3-quasar2-upgrade/), [frontend-modernization/](frontend-modernization/)
- **后端认证**: [jwt-enterprise-implementation/](jwt-enterprise-implementation/)
- **调试工具**: [chrome-mcp-debugging/](chrome-mcp-debugging/)
- **组件开发**: [development-guides/moqui-component-standards.md](development-guides/moqui-component-standards.md)

### 按状态
- **已完成**: development-guides, vue3-quasar2-upgrade, jwt-enterprise-implementation, chrome-mcp-debugging
- **进行中**: frontend-modernization
- **持续更新**: progress-log.md

## 📊 文档维护说明

### 目录结构原则
- **docs根目录**: 仅保留 README.md 和 progress-log.md
- **专项子目录**: 按重大目标或技术领域组织
- **命名规范**: 使用 kebab-case 命名（小写字母+连字符）

### 文档更新原则
1. **时间记录**: 所有重大变更在 [progress-log.md](progress-log.md) 中按倒序记录
2. **状态标识**: 使用统一的状态图标（✅ 完成，🔧 进行中，⏸️ 暂停，❌ 取消）
3. **交叉引用**: 文档间通过相对路径互相引用
4. **版本控制**: 重要文档变更通过 git 提交记录跟踪

### 新项目添加流程
1. 在 docs/ 下创建新的主题目录
2. 在目录中添加 README.md 说明项目目标和文档结构
3. 在 [progress-log.md](progress-log.md) 中添加新条目
4. 更新本文档的导航链接

---

📝 **最后更新**: 2025-10-21
🔄 **文档版本**: v2.2
👤 **维护者**: Claude AI Assistant