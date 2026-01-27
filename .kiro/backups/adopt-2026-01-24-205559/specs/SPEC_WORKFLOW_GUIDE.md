# Kiro Specs 工作流指南

> **用途**: Spec 驱动开发的完整工作流程和设计原则  
> **适用**: 上海图书馆 MinIO 文件存储系统的所有 Spec 驱动的功能开发

---

## 📋 一、Spec 命名规范

**格式**: `[功能名称]`（kebab-case）
- 示例：`fix-duplicate-file-space-calculation`、`oauth-api-upgrade`

**文档结构**:
- `requirements.md` - 需求文档
- `design.md` - 设计文档（可选）
- `tasks.md` - 任务列表（可选）
- `scripts/`, `diagnostics/`, `reports/`, `results/`

---

## 📁 二、三件套文档结构

```
XX-YY-功能名称/
├── requirements.md  ← WHAT（做什么）
├── design.md        ← HOW（怎么做）
├── tasks.md         ← STEPS（执行步骤）
└── scripts/, tests/, results/, reports/
```

### 2.1 requirements.md

**结构**:
```markdown
# 功能名称
## 1. 概述
## 2. 用户故事
## 3. 功能需求
### 3.1 需求标题
**描述**: ...
**验收标准**: WHEN [条件] THEN [结果]
## 4. 非功能需求
## 5. 约束条件
```

### 2.2 design.md（可选）

**结构**:
```markdown
# 功能名称 - 技术设计
## 1. 架构概览
## 2. 核心实现原则
_Requirements: X.X_
## 3. 组件设计
## 4. 数据流
## 5. 错误处理
## 6. 测试策略
```

### 2.3 tasks.md（可选）

**结构**:
```markdown
# 功能名称 - 实现任务
## 阶段一: 诊断分析
### 任务 1.1: 任务标题
**Validates: Requirements X.X**
- [ ] 子任务1
- [ ] 子任务2
```

---

## 🔄 三、Spec 创建工作流程

### 阶段 1: Requirements
1. 创建 requirements.md（使用 EARS 模式）
2. 请求用户审核（`userInput` 工具）
3. 等待批准 → 进入 Design 或直接执行

### 阶段 2: Design（可选）
1. 创建 design.md
2. 请求用户审核
3. 等待批准 → 进入 Tasks 或直接执行

### 阶段 3: Tasks（可选）
1. 创建 tasks.md
2. 请求用户审核
3. 等待批准 → Spec 创建完成

---

## ⚙️ 四、Spec 任务执行流程

**核心原则**: 一次只执行一个任务

**执行步骤**:
1. 读取 requirements.md, design.md, tasks.md
2. 更新任务状态为 `in_progress`
3. 执行任务（遵循 design.md）
4. 更新任务状态为 `completed`
5. 停止并等待用户审核

---

## 🎯 五、核心设计原则

1. **场景覆盖**: 覆盖原型系统的全部场景
2. **风格一致性**: 与现有代码库保持风格一致
3. **复杂性分解**: 大任务拆分为可独立验证的子任务
4. **遗留清理**: 清理旧的临时代码和注释
5. **实现整合**: 同一功能的实现整合在一处

---

## 🔗 六、双向追溯机制

**正向追溯**（需求 → 设计 → 任务）:
```markdown
## 2. 核心实现原则
_Requirements: 3.1, 3.2_
```

**反向追溯**（任务 → 需求）:
```markdown
### 任务 1.1: 实现进度条组件
**Validates: Requirements 3.1**
```

---

**版本**: v2.0  
**更新**: 2026-01-22  
**适用范围**: 上海图书馆 MinIO 文件存储系统的所有 Spec 驱动的功能开发
