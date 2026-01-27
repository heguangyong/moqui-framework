# Kiro Spec 驱动开发体系

> **用途**: 新项目引导文档，解释 Spec 驱动开发体系的设计思想和使用方法

---

## 🎯 这是什么？

这是一套基于 Spec 驱动的 AI 辅助开发规范体系，包含：
- **Steering 规范**：控制 AI 行为的规则和上下文
- **Spec 工作流**：结构化的需求-设计-实施流程
- **文件组织**：清晰的产物归档和知识沉淀

---

## 💡 为什么需要这套体系？

### 问题 1：AI Session Token 有限

**挑战**：
- AI session 启动时会加载所有 Steering 文档
- 历史数据和详细内容会快速消耗 token
- Token 耗尽导致无法继续执行任务

**解决方案**：
- **分层管理**：稳定规则（CORE_PRINCIPLES）+ 动态场景（CURRENT_CONTEXT）
- **精简原则**：Steering 只保留核心信息，详细内容放到 Spec 目录
- **主动管控**：每个 Spec 完成后及时更新 CURRENT_CONTEXT

### 问题 2：规范一致性难以保持

**挑战**：
- 不同 Spec 使用不同的开发流程
- 产物散落在项目各处，难以查找
- 缺乏上下文，不知道为什么要这样做

**解决方案**：
- **Spec 驱动**：所有工作基于 Spec 推进
- **统一规范**：CORE_PRINCIPLES 适用于所有 Spec
- **产物归档**：所有产物归档到对应的 Spec 目录

---

## 📚 文件组织

### Steering 目录（AI 每次启动时加载）

| 文件 | 职责 | Token 影响 | 更新频率 |
|------|------|-----------|---------|
| **RULES_GUIDE.md** | 索引和快速参考 | 低 | 很少 |
| **CORE_PRINCIPLES.md** | 核心开发规范 | 中 | 很少 |
| **ENVIRONMENT.md** | 环境配置 | 低 | 很少 |
| **CURRENT_CONTEXT.md** | 当前 Spec 场景 | **高** ⚠️ | 每个 Spec |

### Specs 目录（按需加载）

```
.kiro/specs/
├── SPEC_WORKFLOW_GUIDE.md    # Spec 工作流指南
└── {spec-name}/               # 具体的 Spec
    ├── requirements.md        # 需求文档
    ├── design.md              # 设计文档（可选）
    ├── tasks.md               # 任务列表（可选）
    ├── scripts/               # 脚本
    ├── diagnostics/           # 诊断文档
    └── results/               # 执行结果
```

---

## 🔄 Steering 体系的核心思想

### 1. 最小化 Token 消耗

**原则**：
- Steering 文档在每次 session 启动时**完全加载**
- 必须保持精简，避免历史数据堆积
- CURRENT_CONTEXT 需要随 Spec 推进及时更新

**实践**：
- ❌ 不要在 Steering 中保留详细的历史数据
- ❌ 不要在 Steering 中保留详细的配置和命令
- ✅ 历史数据归档到 Spec 目录
- ✅ 详细配置放到 Spec 文档中

### 2. 规范的可复用性

**原则**：
- CORE_PRINCIPLES 适用于所有 Spec
- 新项目可以直接复制这套体系
- 只需修正 ENVIRONMENT 和 CURRENT_CONTEXT

**实践**：
- ✅ CORE_PRINCIPLES 保持稳定，很少修改
- ✅ ENVIRONMENT 记录项目特定的环境配置
- ✅ CURRENT_CONTEXT 随 Spec 动态更新

### 3. 上下文的聚焦性

**原则**：
- CURRENT_CONTEXT 只保留当前 Spec 的核心信息
- 历史数据归档到 Spec 目录，不占用 Steering 空间
- 每个 Spec 开始前必须更新 CURRENT_CONTEXT

**实践**：
- ✅ 每个新 Spec 开始前：更新 CURRENT_CONTEXT
- ✅ Spec 推进中：及时精简已完成内容
- ✅ Spec 完成后：清空 CURRENT_CONTEXT

---

## 🚀 如何在新项目中使用？

### 步骤 1：复制 Steering 模板

```bash
# 从模板项目复制
cp -r template-project/.kiro/ new-project/.kiro/
```

### 步骤 2：修正 ENVIRONMENT.md

更新为新项目的实际环境：
- 服务器信息（如有）
- 数据库配置
- 部署方式
- AI 权限范围

### 步骤 3：清空 CURRENT_CONTEXT.md

删除旧项目的场景信息，标记为"无活跃 Spec"。

### 步骤 4：检查 CORE_PRINCIPLES.md

确认规范是否适用于新项目，必要时调整（但尽量保持稳定）。

### 步骤 5：修正 SPEC_WORKFLOW_GUIDE.md

更新项目特定的内容：
- 项目名称
- 技术栈
- 示例

---

## 📖 Spec 驱动开发工作流程

### 标准流程

```
1. 创建 Spec 目录
   ↓
2. 编写需求文档 (requirements.md)
   ↓
3. 编写设计文档 (design.md) - 可选
   ↓
4. 创建任务列表 (tasks.md) - 可选
   ↓
5. 执行任务（调研、分析、实现、测试）
   ↓
6. 所有产物归档到 Spec 目录
   ↓
7. 更新 CURRENT_CONTEXT 为下一个 Spec
```

### 为什么要用 Spec 驱动？

**优点**：
- ✅ 所有工作有明确的需求和设计支持
- ✅ 产物有上下文，易于理解和维护
- ✅ 可以追溯需求和设计决策
- ✅ 团队协作更清晰
- ✅ 知识沉淀在 Spec 中

**不用 Spec 的问题**：
- ❌ 脚本散落在项目各处，难以查找
- ❌ 缺乏上下文，不知道为什么要这样做
- ❌ 无法追溯需求来源
- ❌ 临时文件堆积，项目混乱
- ❌ 知识流失

---

## 💡 最佳实践

### 1. 主动管控 Token

**时机**：
- 每完成一组任务后：精简 tasks.md
- 每完成一个阶段后：精简 CURRENT_CONTEXT
- 发现 token 使用率 > 50% 时：立即精简
- 阶段切换时：更新 CURRENT_CONTEXT 聚焦新阶段

**策略**：
- ❌ 删除：已完成阶段的详细配置、命令、表格
- ❌ 删除：历史测试数据和性能对比表格
- ❌ 删除：详细的问题排查流程和检查清单
- ✅ 保留：当前阶段的核心信息和关键经验

### 2. 保持 Steering 精简

**原则**：
- CURRENT_CONTEXT 只保留当前信息
- 历史数据归档到 Spec 目录
- 详细配置放到 Spec 文档中

**检查清单**：
- [ ] CURRENT_CONTEXT 是否聚焦当前 Spec？
- [ ] 历史阶段的详细内容是否已移除？
- [ ] 详细数据是否已归档到 Spec 目录？
- [ ] Token 使用率是否 < 50%？

### 3. 规范的一致性

**原则**：
- 所有 Spec 遵循相同的规范
- 不要在不同 Spec 中使用不同的流程
- 发现问题及时更新 CORE_PRINCIPLES

**实践**：
- ✅ 基于 Spec 推进所有工作
- ✅ 产物归档到对应的 Spec 目录
- ✅ 不要在根目录生成临时文件

### 4. 知识的沉淀

**原则**：
- 通用经验沉淀到 CORE_PRINCIPLES
- Spec 特定经验保留在 Spec 目录
- 定期回顾和更新规范

**时机**：
- Spec 完成后：总结经验教训
- 新 Spec 开始前：评估现有规则是否适用
- 发现重复问题时：更新 CORE_PRINCIPLES

---

## ⚠️ 常见错误

### 错误 1：CURRENT_CONTEXT 膨胀

**现象**：
- session 启动后 token 使用率 > 50%
- CURRENT_CONTEXT 包含大量历史数据

**解决**：
- 立即精简 CURRENT_CONTEXT
- 将详细数据归档到 Spec 目录
- 只保留当前阶段的核心信息

### 错误 2：规范不一致

**现象**：
- 不同 Spec 使用不同的开发流程
- 文件组织混乱

**解决**：
- 重新阅读 CORE_PRINCIPLES
- 按照规范重新组织文件
- 将散落的产物归档到 Spec 目录

### 错误 3：产物散落

**现象**：
- 脚本、测试、报告散落在项目各处
- 缺乏上下文，难以理解

**解决**：
- 所有产物归档到对应的 Spec 目录
- 不要在根目录生成临时文件
- 遵循 Spec 驱动开发原则

---

## 📚 相关文档

- **Steering 索引**: `.kiro/steering/RULES_GUIDE.md`
- **核心开发原则**: `.kiro/steering/CORE_PRINCIPLES.md`
- **环境配置**: `.kiro/steering/ENVIRONMENT.md`
- **当前场景**: `.kiro/steering/CURRENT_CONTEXT.md`
- **Spec 工作流指南**: `.kiro/specs/SPEC_WORKFLOW_GUIDE.md`

---

**版本**: v1.0  
**创建**: 2025-01-22  
**说明**: 这是新项目引导文档，日常开发时不需要加载
