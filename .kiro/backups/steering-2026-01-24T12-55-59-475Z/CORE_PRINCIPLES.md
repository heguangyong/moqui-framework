# 核心开发原则（基准规则）

> **重要**: 这些是项目的基准规则，适用于所有 Spec，不应随意修改。
> 场景特定的规则请参考 `CURRENT_CONTEXT.md`

---

## 📋 Spec 驱动开发工作流程

### Spec 命名规范

**格式**: `{序号}-{序号}-{简短描述}`

**规则**:
- 使用 kebab-case（小写字母，单词用连字符分隔）
- 必须包含两个序号（用连字符分隔）
- 描述应简洁明确，反映 Spec 核心目标

**示例**:
- ✅ `01-00-user-space-diagnosis`
- ✅ `01-01-fix-duplicate-file-space-calculation`
- ✅ `02-00-oauth-api-upgrade`
- ❌ `user-space-diagnosis`（缺少序号）
- ❌ `01-user-space-diagnosis`（只有一个序号）
- ❌ `FixDuplicateFile`（不是 kebab-case）
- ❌ `fix_duplicate_file`（使用下划线而非连字符）

### 标准工作流程

```
1. 创建 Spec → 2. requirements.md → 3. design.md → 4. tasks.md → 5. 执行任务 → 6. 产物归档
```

### Spec 目录结构

```
.kiro/specs/{feature-name}/
├── requirements.md, design.md, tasks.md
├── scripts/, reports/, diagnostics/, tests/, results/
```

---

## ⚠️ 核心原则

### 1. Spec 驱动开发原则

**任何需求都必须先建立 Spec**
- 所有产物归档到 Spec 目录：scripts/, reports/, diagnostics/, tests/, results/
- 禁止将脚本、测试直接放到项目根目录

### 2. 文件管理原则

**禁止在根目录下随意生成临时文件**
- 临时文件用完立即删除
- 所有产物归档到对应的 Spec 目录

### 3. 代码质量原则

- 代码必须能够编译通过
- 修改后必须运行相关测试
- 遵循项目的编码规范

### 4. 问题解决态度

**但凡有问题没有解决，一定是我搞错了**
- 不要轻易得出"这是外部服务的问题"的结论
- 必须继续找原因，直到最终修正

### 5. 问题解决流程

遇到问题时的检查顺序：
1. `.kiro/specs/` 中相关功能的文档
2. `.kiro/steering/` 中的规则
3. 项目根目录下的分析文档

### 6. 上下文管控原则

**必须主动管控上下文，避免 session token 耗尽**

**管控时机**：
- 每完成一组任务后：精简已完成任务的详细内容
- 每完成一个阶段后：更新 CURRENT_CONTEXT.md
- Token 使用率 > 50% 时：立即精简
- 阶段切换时：更新 CURRENT_CONTEXT.md 聚焦新阶段

**精简规则**：
- Spec 文档：保留任务标题和状态，删除详细实现步骤
- CURRENT_CONTEXT.md：只保留当前任务核心信息，删除历史详细数据

### 7. Spec 完成与 Steering 更新原则

**每完成一个 Spec，开始新 Spec 前，必须评估是否需要更新 Steering**
- 通用经验教训 → 更新 CORE_PRINCIPLES
- 当前 Spec 场景 → 更新 CURRENT_CONTEXT

### 8. 文档精简原则

**Spec 文档精简**：
- 已完成任务：保留标题和状态，删除详细实现
- 历史测试结果：保留结论，删除详细日志
- 文档 > 1000 行：立即拆分为多个文件

**Steering 文档精简**：
- CURRENT_CONTEXT.md 只保留当前 Spec 核心信息
- 历史数据归档到 Spec 目录
- Session 启动后 token 使用率 > 50%：立即精简

---

**版本**: v5.0  
**更新**: 2026-01-22  
**说明**: 适用于所有 Spec 的稳定核心原则
