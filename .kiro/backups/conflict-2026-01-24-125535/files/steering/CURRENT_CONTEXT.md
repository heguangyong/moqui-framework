# 当前场景规则（可变）

> **重要**: 这些规则针对当前 Spec 场景优化，每个新 Spec 开始前应该更新。
> 基准规则请参考 `CORE_PRINCIPLES.md`，环境配置请参考 `ENVIRONMENT.md`

---

## 🎯 当前状态

**状态**: 🔄 测试验证中  
**Spec**: 08-01-workflow-duplication-fix  
**项目**: Novel Anime Desktop - 小说动漫生成器  
**最后更新**: 2026-01-22

---

## 📝 当前 Spec 信息

**Spec 名称**: 08-01-workflow-duplication-fix

**目标**: 修复工作流重复创建问题，实现项目-工作流一对一映射

**当前阶段**: 🔄 核心功能已完成，认证问题待验证

**已完成**:
- ✅ Task 12 - 所有单元测试通过（12/12）
- ✅ 工作流 404 错误修复
- ✅ 删除对话框 UI 修复（CSS + 按钮间距）
- ✅ 删除 API 实现
- ✅ 项目同名冲突处理（自动编号）
- ✅ 认证检查和开发环境自动登录

**待验证**:
- 🔄 自动登录功能是否正常工作
- 🔄 删除项目功能是否正常（依赖认证）

**下一步**: 用户测试自动登录和删除功能

**参考文档**:
- `.kiro/specs/08-01-workflow-duplication-fix/TESTING_GUIDE.md` - 测试指南
- `.kiro/specs/08-01-workflow-duplication-fix/COMPLETION_SUMMARY.md` - 完成总结
- `.kiro/specs/08-01-workflow-duplication-fix/AUTH_SOLUTION.md` - 认证解决方案

---

## 💡 提示

### 开始新 Spec 前的检查清单

- [ ] 确认 Spec 已创建（requirements.md, design.md, tasks.md）
- [ ] 更新本文档为新 Spec 的场景信息
- [ ] 移除上一个 Spec 的详细内容（如有）
- [ ] 只保留当前 Spec 的核心信息
- [ ] 检查 token 使用率是否 < 50%

### 内容建议

**应该包含**：
- 当前 Spec 的目标和背景（2-3 句话）
- 当前正在执行的任务（简要）
- 关键配置和命令（当前需要的）
- 重要的经验教训（1-2 行）

**不应该包含**：
- 已完成阶段的详细配置和命令
- 历史测试数据和性能对比表格
- 详细的问题排查流程和检查清单
- 过时的临时信息

---

**版本**: v1.0  
**创建**: 2025-01-22  
**项目**: 上海图书馆 MinIO 文件存储系统  
**说明**: 当前无活跃 Spec，等待新 Spec 创建时更新
