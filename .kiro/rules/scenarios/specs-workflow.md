# Specs 工作流场景

> **用途**: Specs驱动开发的完整工作流程  
> **适用**: 所有使用Specs进行功能开发的任务

## 🎯 场景概述

Specs是一种结构化的功能开发方法，通过Requirements → Design → Tasks的流程，确保需求清晰、设计完整、实施有序。

## ✅ 前提条件检查

### 1. Specs目录结构
- [ ] `.kiro/specs/`目录存在
- [ ] 了解Specs命名规范
- [ ] 了解三件套文档结构 (requirements.md, design.md, tasks.md)

### 2. 工具准备
- [ ] 了解`userInput`工具的使用
- [ ] 了解`taskStatus`工具的使用
- [ ] 了解`prework`工具的使用（设计阶段）

### 3. 开发原则
- [ ] 理解"一次只执行一个任务"原则
- [ ] 理解"每个阶段需用户批准"原则
- [ ] 理解"任务完成后停止"原则

## 📋 标准工作流程

### 阶段1: Requirements (需求文档)

#### 执行步骤

1. **创建requirements.md**
```markdown
# Requirements Document

## Introduction
[功能概述]

## Glossary
- **System/Term**: [定义]

## Requirements

### Requirement 1
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event], THE [System_Name] SHALL [response]
2. WHILE [state], THE [System_Name] SHALL [response]
```

2. **使用EARS模式**
- Ubiquitous: THE <system> SHALL <response>
- Event-driven: WHEN <trigger>, THE <system> SHALL <response>
- State-driven: WHILE <condition>, THE <system> SHALL <response>
- Unwanted event: IF <condition>, THEN THE <system> SHALL <response>
- Optional feature: WHERE <option>, THE <system> SHALL <response>

3. **请求用户审核**
```typescript
userInput({
  question: "Do the requirements look good? If so, we can move on to the design.",
  reason: "spec-requirements-review"
})
```

4. **等待用户批准**
- ✅ 用户批准 → 进入Design阶段
- ❌ 用户反馈 → 修改requirements.md → 再次请求审核

### 阶段2: Design (设计文档)

#### 执行步骤

1. **创建design.md基础结构**
```markdown
# Design Document

## Overview
[设计概述]

## Architecture
[架构设计]

## Components and Interfaces
[组件和接口]

## Data Models
[数据模型]

## Correctness Properties
[正确性属性]

## Error Handling
[错误处理]

## Testing Strategy
[测试策略]
```

2. **完成Correctness Properties前的Prework**
```typescript
// 在写Correctness Properties之前，必须使用prework工具
prework({
  featureName: "feature-name",
  preworkAnalysis: `
1.1 Criteria Name
  Thoughts: step by step thoughts...
  Testable: yes - property / yes - example / no / edge-case
...
  `
})
```

3. **编写Correctness Properties**
- 每个property必须包含"for all"语句
- 每个property必须引用requirements中的具体条款
- 格式: `**Validates: Requirements 1.2**`

4. **请求用户审核**
```typescript
userInput({
  question: "Does the design look good? If so, we can move on to the implementation plan.",
  reason: "spec-design-review"
})
```

5. **等待用户批准**
- ✅ 用户批准 → 进入Tasks阶段
- ❌ 用户反馈 → 修改design.md → 再次请求审核

### 阶段3: Tasks (任务文档)

#### 执行步骤

1. **创建tasks.md**
```markdown
# Implementation Plan

- [ ] 1. 主任务标题
  - 任务描述
  - 实现要点
  - _Requirements: 1.1, 1.2_

- [ ] 1.1 子任务标题
  - 具体实现内容
  - _Requirements: 1.1_

- [ ]* 1.2 可选任务 (测试等)
  - 可选的测试或文档任务
  - _Requirements: 1.1_
```

2. **任务组织原则**
- 每个任务引用具体的Requirements
- 测试任务标记为可选 (带`*`后缀)
- 包含Checkpoint任务确保测试通过
- 任务按依赖关系排序

3. **请求用户审核**
```typescript
userInput({
  question: "The current task list marks some tasks (e.g. tests, documentation) as optional to focus on core features first.",
  options: [
    "Keep optional tasks (faster MVP)",
    "Make all tasks required (comprehensive from start)"
  ],
  reason: "spec-tasks-review"
})
```

4. **等待用户批准**
- ✅ 用户批准 → Specs创建完成
- ❌ 用户反馈 → 修改tasks.md → 再次请求审核

### 阶段4: 执行任务

#### 执行原则

**核心原则**: 一次只执行一个任务

#### 执行步骤

1. **读取Specs文档**
```typescript
// 始终先读取三个核心文档
readFile('.kiro/specs/feature/requirements.md')
readFile('.kiro/specs/feature/design.md')
readFile('.kiro/specs/feature/tasks.md')
```

2. **更新任务状态为in_progress**
```typescript
taskStatus({
  taskFilePath: '.kiro/specs/feature/tasks.md',
  task: '1.1 实现功能',
  status: 'in_progress'
})
```

3. **执行任务**
- 只关注当前一个任务
- 遵循design.md中的设计
- 参考相关技术规范
- 确保实现符合requirements

4. **更新任务状态为completed**
```typescript
taskStatus({
  taskFilePath: '.kiro/specs/feature/tasks.md',
  task: '1.1 实现功能',
  status: 'completed'
})
```

5. **停止并等待用户审核**
- ❌ 不要自动继续下一个任务
- ✅ 等待用户指示或审核

## ⚠️ 常见错误和解决方案

### 错误1: 自动执行多个任务
**原因**: 未遵循"一次只执行一个任务"原则  
**解决**: 完成一个任务后立即停止，等待用户审核

### 错误2: 跳过用户审核
**原因**: 未使用`userInput`工具请求批准  
**解决**: 每个阶段完成后必须使用`userInput`工具

### 错误3: 任务状态未更新
**原因**: 忘记调用`taskStatus`工具  
**解决**: 任务开始时更新为`in_progress`，完成时更新为`completed`

### 错误4: 实现偏离设计
**原因**: 未仔细阅读design.md  
**解决**: 执行前必须读取并理解design.md

### 错误5: 测试脚本独立存在
**原因**: 未将测试脚本归属到对应的specs  
**解决**: 测试脚本放在`specs/[feature]/testing/`目录下

## 🔍 执行检查清单

### 开始任务前
- [ ] 已读取requirements.md
- [ ] 已读取design.md
- [ ] 已读取tasks.md
- [ ] 明确当前任务的需求引用
- [ ] 了解任务的依赖关系

### 执行任务中
- [ ] 更新任务状态为in_progress
- [ ] 只关注当前一个任务
- [ ] 遵循design.md中的设计
- [ ] 参考相关技术规范

### 完成任务后
- [ ] 更新任务状态为completed
- [ ] 停止执行
- [ ] 等待用户审核或指示
- [ ] 不自动继续下一个任务

## 📚 相关技术规范

根据任务类型，参考对应的技术规范：

- **Moqui开发**: `.kiro/rules/standards/moqui/*.md`
- **前端开发**: `.kiro/rules/standards/frontend/*.md`
- **代码质量**: `.kiro/rules/standards/general/code-quality.md`
- **测试开发**: `.kiro/rules/standards/general/testing.md`

## 💡 最佳实践

### 1. Requirements阶段
- 使用EARS模式确保需求清晰
- 每个需求包含用户故事和验收标准
- 定义清晰的术语表

### 2. Design阶段
- 先完成基础章节，再做Prework
- Correctness Properties必须引用具体的Requirements
- 设计要考虑可测试性

### 3. Tasks阶段
- 任务粒度适中，不要过大或过小
- 每个任务引用具体的Requirements
- 测试任务标记为可选，但建议实现

### 4. 执行阶段
- 严格遵循"一次一个任务"原则
- 任务完成后立即停止
- 保持与用户的沟通

---

**版本**: v1.0  
**创建日期**: 2025-01-16  
**适用范围**: 所有Specs驱动的功能开发
