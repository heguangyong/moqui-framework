# Moqui Framework 开发文档

## 📚 文档导航

### 🎯 框架开发规范

#### [Moqui组件开发实战规范](./Moqui组件开发实战规范.md)
组件开发的标准化流程和最佳实践，包含：
- 组件架构设计原则
- 开发工作流程规范
- 代码质量要求

#### [Moqui 组件开发标准模板集(实战版)](./Moqui%20组件开发标准模板集(实战版).md)
开发模板和代码示例集合，包含：
- 标准组件模板
- 服务定义模板
- 屏幕配置模板
- 实体定义模板

### 🚀 技术栈升级

#### [Vue3-Quasar2-升级完整指南](./Vue3-Quasar2-升级完整指南.md)
前端技术栈升级的完整规划和实施指南，包含：
- 升级背景与目标
- 详细升级计划
- 风险评估和渐进式升级策略
- 成功标准和验收条件

## 🔗 其他文档资源

### 🏃 运行时环境文档
位置：`runtime/docs/`
- [JWT认证迁移与前端架构重构实战经验总结](../runtime/docs/JWT认证迁移与前端架构重构实战经验总结.md)
- [Moqui-JWT企业级认证实战指南](../runtime/docs/Moqui-JWT企业级认证实战指南.md)

### 📁 组件专用文档
各组件的专用文档位于对应组件的docs目录下：

#### Marketplace组件
位置：`runtime/component/moqui-marketplace/docs/`
- [应用列表组件自动化配置实战指南](../runtime/component/moqui-marketplace/docs/应用列表组件自动化配置实战指南.md)
- [Moqui-Marketplace组件认证与权限配置实战指南](../runtime/component/moqui-marketplace/docs/Moqui-Marketplace组件认证与权限配置实战指南.md)

#### MinIO组件
位置：`runtime/component/moqui-minio/docs/`
- [Moqui-MinIO组件开发精品化实战指南](../runtime/component/moqui-minio/docs/Moqui-MinIO组件开发精品化实战指南.md)

#### MCP组件
位置：`runtime/component/moqui-mcp/docs/`
- [MARKETPLACE_MCP_GUIDE](../runtime/component/moqui-mcp/docs/MARKETPLACE_MCP_GUIDE.md)

## 🚀 快速开始指引

### 新开发者必读顺序
1. **[Moqui组件开发实战规范](./Moqui组件开发实战规范.md)** - 掌握开发规范
2. **[JWT认证迁移与前端架构重构实战经验总结](../runtime/docs/JWT认证迁移与前端架构重构实战经验总结.md)** - 了解项目核心经验
3. **[应用列表组件自动化配置实战指南](../runtime/component/moqui-marketplace/docs/应用列表组件自动化配置实战指南.md)** - 理解自动发现机制

### 问题解决参考顺序
1. 🔍 **查看相关组件的docs目录** - 特定问题优先查看组件文档
2. 📖 **参考JWT认证迁移经验总结** - 了解常见问题模式
3. 📜 **查看GitHub历史版本** - 理解问题的历史背景
4. 🧪 **按照调试方法论进行系统性诊断** - 科学定位问题根因

## ⚠️ 重要开发原则

### 🎯 核心设计原则（必须遵守）
1. **自动发现优于手工配置** - 使用menu-image让组件自动出现
2. **权限验证不可省略** - 保持isPermitted()等安全检查
3. **异步处理避免阻塞** - 所有AJAX调用使用async: true
4. **多模式兼容支持** - 支持html/vuet/qvt多种render-mode

### 📋 开发前必做检查
- [ ] 📖 阅读相关组件的docs目录文档
- [ ] 📜 查看GitHub历史版本和提交信息
- [ ] 🧪 在开发环境充分测试验证
- [ ] 📝 记录修改原因和影响范围

## 📈 项目演进历程

### 技术栈演进
- **Phase 1**: Moqui Framework 基础架构
- **Phase 2**: Session-based 认证系统
- **Phase 3**: JWT认证迁移 + Vue2+Quasar1优化 ← **当前阶段**
- **Phase 4**: Vue3+Quasar2升级（规划中）

### 关键里程碑
- ✅ **应用列表自动发现机制** - 实现组件零配置自动显示
- ✅ **JWT认证系统迁移** - 完全摆脱session依赖
- ✅ **前端异步优化** - 解决页面卡死问题
- 🚧 **Vue3技术栈升级** - 下一阶段重点

## 🔗 相关链接

- [项目主README](../README.md)
- [Moqui Framework官方文档](https://www.moqui.org/docs)
- [Vue.js官方文档](https://vuejs.org/)
- [Quasar Framework文档](https://quasar.dev/)

---

**文档库维护**: 开发团队
**最后更新**: 2025-10-10
**版本**: 3.0 (重构版)

**📢 文档贡献指南**:
- 框架级通用文档放在docs目录下
- 运行时环境文档放在runtime/docs目录下
- 组件专有文档放在对应组件的docs目录下
- 重要经验和教训必须及时记录
- 定期清理过时和重复文档