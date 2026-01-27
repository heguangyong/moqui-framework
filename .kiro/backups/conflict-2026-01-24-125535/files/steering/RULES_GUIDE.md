# Steering 规则索引

## 📚 文件组织

| 文件 | 用途 | 更新频率 |
|------|------|---------|
| **CORE_PRINCIPLES.md** | Spec 驱动核心原则 | 很少 |
| **ENVIRONMENT.md** | 项目环境配置 | 很少 |
| **CURRENT_CONTEXT.md** | 当前 Spec 核心信息 | 每个 Spec |

## 🎯 当前场景

**Spec**: 08-01-workflow-duplication-fix  
**状态**: ✅ 核心功能已完成，认证问题待解决  
**核心方案**: Store 级别的项目-工作流映射

详细信息请查看 `CURRENT_CONTEXT.md`

---

## 📖 Spec 工作流指南

创建新 Spec 时，请参考：`.kiro/specs/SPEC_WORKFLOW_GUIDE.md`

该指南包含：
- Requirements → Design → Tasks 完整流程
- 工具使用规范（userInput, taskStatus, prework）
- 执行原则和最佳实践
- 常见错误和解决方案

---

## 🔗 快速链接

### 核心文档
- **项目说明**: `../ README.md` - Kiro Specs 体系说明
- **Spec 工作流**: `../specs/SPEC_WORKFLOW_GUIDE.md` - Spec 创建和执行流程
- **核心原则**: `CORE_PRINCIPLES.md` - 适用于所有 Spec 的规范
- **环境配置**: `ENVIRONMENT.md` - 项目环境信息
- **当前场景**: `CURRENT_CONTEXT.md` - 当前正在推进的 Spec

### 当前 Spec
- **Spec 目录**: `../specs/08-01-workflow-duplication-fix/`
- **需求文档**: `requirements.md`
- **设计文档**: `design.md`
- **任务列表**: `tasks.md`

---

## ⚠️ 重要提示

### CURRENT_CONTEXT.md 管控

**更新时机**:
- **每个新 Spec 开始前**: 更新为新 Spec 的场景
- **Spec 推进中**: 及时精简已完成内容
- **Spec 完成后**: 清空，准备下一个 Spec
- **Token 消耗 > 50% 时**: 立即精简

**精简策略**:
- ❌ 删除：已完成阶段的详细配置、命令、表格
- ❌ 删除：历史测试数据和详细流程
- ✅ 保留：当前阶段的核心信息
- ✅ 保留：关键经验教训（1-2 行）

### 文档拆分原则

**大文档拆分**（> 1000 行）:
```
verification.md              # 当前阶段 + 总结（< 500 行）
verification-phase1-3.md     # 历史阶段 1-3
verification-phase4-6.md     # 历史阶段 4-6
```

**目的**:
- 减少每次读取文档的 token 消耗
- 提高文档加载速度
- 保持当前工作的聚焦度

---

## 📋 Spec 命名规范

**格式**: `{序号}-{序号}-{功能描述}`

**示例**:
- ✅ `08-01-workflow-duplication-fix`
- ✅ `01-02-jwt-authentication`
- ❌ `workflow-fix`（缺少序号）
- ❌ `WorkflowFix`（不是 kebab-case）

---

## 🔄 工作流程

### Spec 创建
```
1. 确定 Spec 名称
   ↓
2. 创建 requirements.md
   ↓
3. 用户审核
   ↓
4. 创建 design.md（可选）
   ↓
5. 用户审核
   ↓
6. 创建 tasks.md（可选）
   ↓
7. 用户审核
   ↓
8. Spec 创建完成
```

### Spec 执行
```
1. 读取 Spec 文档
   ↓
2. 更新任务状态为 in_progress
   ↓
3. 执行任务
   ↓
4. 更新任务状态为 completed
   ↓
5. 停止并等待用户审核
```

**核心原则**: 一次只执行一个任务

---

## 🎯 核心原则速查

1. **Spec 驱动**: 任何需求都必须先建立 Spec
2. **产物归档**: 所有产物归档到 Spec 目录
3. **上下文管控**: 主动精简，避免 token 耗尽
4. **文档精简**: 大文档及时拆分
5. **问题解决**: 持续寻找原因，不轻易放弃

---

## 📞 获取帮助

遇到问题时的检查顺序：
1. 检查 `.kiro/specs/` 中相关功能的文档
2. 查看 `.kiro/steering/` 中的规则
3. 参考 `.kiro/specs/SPEC_WORKFLOW_GUIDE.md`
4. 查看项目根目录下的分析文档

---

**版本**: v7.0  
**更新**: 2026-01-22  
**项目**: Novel Anime Desktop
