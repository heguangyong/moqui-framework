# .kiro 目录说明

> **Kiro IDE 配置和规则目录**

## 📂 目录结构

```
.kiro/
├── README.md           # 本文档
├── steering/           # 自动加载的指导文件
│   └── RULES_GUIDE.md # 规则库使用指南（极简索引）
├── rules/              # 规则库（不会自动加载）
│   ├── INDEX.md       # 规则库索引
│   ├── README.md      # 规则库说明
│   ├── scenarios/     # 业务场景规则
│   └── standards/     # 技术规范规则
├── specs/              # Specs目录
│   ├── INDEX.md       # Specs索引
│   ├── README.md      # Specs说明
│   └── */             # 各功能的Specs
└── settings/           # 配置文件
    └── mcp.json       # MCP配置
```

## 🎯 核心目录说明

### steering/ - 自动加载指导
**用途**: 存放会被自动加载的轻量级指导文件  
**特点**: 文件会被自动加载，必须保持极简  
**内容**: 规则库索引和触发机制

**详细说明**: 查看 `.kiro/steering/RULES_GUIDE.md`

### rules/ - 规则库
**用途**: 存放开发规则和技术规范  
**特点**: 文件不会被自动加载，AI按需读取  
**组织**: 双维度（业务场景 + 技术规范）

**详细说明**: 查看 `.kiro/rules/README.md`

### specs/ - 功能规范
**用途**: 存放功能的需求、设计和任务文档  
**特点**: Specs驱动开发的核心目录  
**组织**: 按功能分类

**详细说明**: 查看 `.kiro/specs/README.md`

### settings/ - 配置文件
**用途**: 存放Kiro IDE的配置文件  
**包含**: MCP配置、其他IDE配置

## 🚀 快速开始

### 对于 AI 助手

#### 开发Moqui应用
```typescript
// 1. 读取场景规则
readFile('.kiro/rules/scenarios/moqui-development.md')

// 2. 按需读取技术规范
readFile('.kiro/rules/standards/moqui/authentication.md')
readFile('.kiro/rules/standards/moqui/entity.md')
```

#### 执行Specs任务
```typescript
// 1. 读取场景规则
readFile('.kiro/rules/scenarios/specs-workflow.md')

// 2. 读取Specs文档
readFile('.kiro/specs/[feature]/requirements.md')
readFile('.kiro/specs/[feature]/design.md')
readFile('.kiro/specs/[feature]/tasks.md')
```

### 对于开发者

#### 查看规则库
```bash
# 查看规则库索引
cat .kiro/rules/INDEX.md

# 查看业务场景
cat .kiro/rules/scenarios/moqui-development.md

# 查看技术规范
cat .kiro/rules/standards/moqui/authentication.md
```

#### 查看Specs
```bash
# 查看Specs索引
cat .kiro/specs/INDEX.md

# 查看具体功能的Specs
cat .kiro/specs/[feature]/requirements.md
```

## 📊 目录统计

### rules/ 规则库
- **业务场景**: 4个文件
- **技术规范**: 10个文件
- **总计**: 14个规则文件

### specs/ 功能规范
- **功能数量**: 17个
- **文档类型**: requirements.md, design.md, tasks.md

## 🎓 设计理念

### 1. 按需加载
- rules/目录下的文件不会被自动加载
- AI根据场景按需读取
- 大幅降低token消耗

### 2. 双维度组织
- **业务场景** - 明确"什么时候做什么"
- **技术规范** - 明确"怎么做"

### 3. Specs驱动
- 所有功能开发都通过Specs进行
- Requirements → Design → Tasks → 执行

## 🔄 历史变更

### v2.0 (2025-01-16)
- ✅ 创建steering/RULES_GUIDE.md（轻量级索引，自动加载）
- ✅ 创建rules目录（按需加载）
- ✅ 采用双维度组织（场景 + 规范）
- ✅ 删除archive目录（不需要）
- ✅ 删除优化文档（临时文档）

### v1.0 (之前)
- steering目录存放所有规则
- 所有文件被自动加载
- token消耗过高

## 📚 相关文档

- **规则库**: `.kiro/rules/README.md`
- **Specs**: `.kiro/specs/README.md`
- **规则库索引**: `.kiro/rules/INDEX.md`
- **Specs索引**: `.kiro/specs/INDEX.md`

---

**版本**: v2.0  
**最后更新**: 2025-01-16  
**维护者**: Kiro Team

## 🚀 新项目初始化指南

### 为什么需要这个结构？

在使用Kiro IDE进行AI辅助开发时，我们面临一个核心问题：
- **问题**: 如果把所有开发规范放在 `steering/` 目录，会被自动加载，导致每个session消耗30,000+ tokens
- **解决**: 采用"轻量级索引 + 按需加载"的三层架构，将token消耗降低到~500 tokens

### 三层架构设计

```
Layer 1: steering/RULES_GUIDE.md (自动加载, ~500 tokens)
    ↓ 提供索引和关键词触发机制
    ↓
Layer 2: rules/scenarios/*.md (按需加载, ~2-3KB per file)
    ↓ 业务场景规则：明确"什么时候做什么"
    ↓
Layer 3: rules/standards/**/*.md (按需加载, ~3-5KB per file)
    ↓ 技术规范规则：明确"怎么做"
```

### 初始化步骤

#### 步骤1: 创建目录结构

```bash
mkdir -p .kiro/steering
mkdir -p .kiro/rules/scenarios
mkdir -p .kiro/rules/standards
mkdir -p .kiro/specs
mkdir -p .kiro/settings
```

#### 步骤2: 创建轻量级索引文件

创建 `.kiro/steering/RULES_GUIDE.md`（会被自动加载）：

```markdown
# Kiro 规则库使用指南

> **重要**: 本文件会被自动加载。内容保持极简，仅作为规则库的索引和触发器。

## 📚 规则库位置

规则库位于 `.kiro/rules/` 目录，**不会自动加载**，需要按需读取。

## 🎯 使用方式

### 关键词触发机制

当用户消息包含以下关键词时，AI应该**立即读取**对应的规则文件：

#### [场景1]开发相关
**关键词**: `关键词1`, `关键词2`, `关键词3`
**读取**: `.kiro/rules/scenarios/scenario1.md`

#### [场景2]相关
**关键词**: `关键词A`, `关键词B`
**读取**: `.kiro/rules/scenarios/scenario2.md`

## 📋 标准工作流程

### 1. 识别场景
根据用户消息中的关键词，识别开发场景

### 2. 读取场景规则
```typescript
// 示例：用户说"开发XXX"
readFile('.kiro/rules/scenarios/xxx.md')
```

### 3. 按需读取技术规范
根据场景规则中的引用，按需读取具体的技术规范

## 🔍 快速索引

### 业务场景规则
- `scenarios/scenario1.md` - 场景1描述
- `scenarios/scenario2.md` - 场景2描述

### 技术规范规则
- `standards/category1/standard1.md` - 规范1描述
- `standards/category2/standard2.md` - 规范2描述

## 💡 核心原则

1. **按需加载**: 不要一次性读取所有规则
2. **场景优先**: 先读场景规则，再读技术规范
3. **关键词匹配**: 根据用户消息中的关键词触发
4. **渐进式**: 先读概览，需要时再读详细规范

---

**Token消耗**: ~500 tokens
```

**关键点**:
- ✅ 保持文件极简（~500 tokens）
- ✅ 提供关键词触发机制
- ✅ 提供规则库索引
- ✅ 说明使用方式

#### 步骤3: 创建业务场景规则

在 `.kiro/rules/scenarios/` 目录下创建场景规则文件：

**文件命名**: `场景名称.md`（例如：`moqui-development.md`）

**文件结构**:
```markdown
# [场景名称]

> **用途**: [场景描述]  
> **适用**: [适用范围]

## 🎯 场景概述
[场景的整体说明]

## ✅ 前提条件检查
- [ ] 前提条件1
- [ ] 前提条件2

## 📋 标准开发流程

### 阶段1: [阶段名称]
[详细步骤和代码示例]

### 阶段2: [阶段名称]
[详细步骤和代码示例]

## ⚠️ 常见错误和解决方案

### 错误1: [错误描述]
**原因**: [原因]  
**解决**: [解决方案]

## 🔍 验证检查清单
- [ ] 检查项1
- [ ] 检查项2

## 📚 相关技术规范
- **规范1**: `.kiro/rules/standards/xxx/xxx.md`
- **规范2**: `.kiro/rules/standards/xxx/xxx.md`

## 💡 最佳实践
1. 实践1
2. 实践2
```

#### 步骤4: 创建技术规范规则

在 `.kiro/rules/standards/` 目录下按分类创建技术规范：

**目录组织**:
```
standards/
├── category1/          # 分类1（如：moqui）
│   ├── standard1.md   # 规范1（如：authentication.md）
│   └── standard2.md   # 规范2（如：entity.md）
└── category2/          # 分类2（如：frontend）
    ├── standard3.md   # 规范3（如：vue.md）
    └── standard4.md   # 规范4（如：quasar.md）
```

**文件结构**:
```markdown
# [技术规范名称]

> **用途**: [规范描述]  
> **适用**: [适用范围]

## 🎯 核心规则

### 规则1: [规则标题]
**[规则描述]**

### 规则2: [规则标题]
**[规则描述]**

## 📝 [功能分类1]

### [子功能]

```[language]
// 代码示例
```

## ⚠️ 常见错误

### 错误1: [错误描述]
```[language]
// ❌ 错误示例
// ✅ 正确示例
```

## 🎓 最佳实践
1. 实践1
2. 实践2

## 📚 相关规范
- **规范A**: `.kiro/rules/standards/xxx/xxx.md`
```

#### 步骤5: 创建索引文件

创建 `.kiro/rules/INDEX.md` 和 `.kiro/rules/README.md`：

**INDEX.md**: 提供完整的规则库索引和使用指南
**README.md**: 说明规则库的设计理念和使用方式

#### 步骤6: 创建项目README

创建 `.kiro/README.md`（本文件），说明整个.kiro目录的组织结构。

### 关键设计原则

#### 1. Token优化原则
- **steering/**: 只放轻量级索引（~500 tokens）
- **rules/**: 详细规则按需加载（不自动加载）
- **效果**: Token消耗从30,000+ → ~500

#### 2. 双维度组织原则
- **业务场景** (`scenarios/`): 明确"什么时候做什么"
- **技术规范** (`standards/`): 明确"怎么做"
- **效果**: 清晰的职责分离

#### 3. 关键词触发原则
- 在 `RULES_GUIDE.md` 中定义关键词映射
- AI根据用户消息中的关键词自动加载对应规则
- **效果**: 智能化的规则加载

#### 4. 渐进式加载原则
- 先读场景规则（概览）
- 再读技术规范（详细）
- **效果**: 按需获取信息

### 验证清单

初始化完成后，验证以下内容：

- [ ] `.kiro/steering/RULES_GUIDE.md` 存在且内容极简（~500 tokens）
- [ ] `.kiro/rules/scenarios/` 目录下有场景规则文件
- [ ] `.kiro/rules/standards/` 目录下有技术规范文件
- [ ] `RULES_GUIDE.md` 中定义了关键词触发机制
- [ ] 每个场景规则都引用了相关的技术规范
- [ ] 创建新session时，只有 `RULES_GUIDE.md` 被自动加载

### 实际效果

**新session开始时**:
```
自动加载: steering/RULES_GUIDE.md (~500 tokens)
    ↓
AI知道规则库的存在和使用方式
    ↓
用户: "开发XXX功能"
    ↓
AI识别关键词，读取对应场景规则 (~2-3KB)
    ↓
AI根据需要，读取相关技术规范 (~3-5KB)
    ↓
总token消耗: ~500 + 按需加载
```

### 复用到新项目

1. **复制目录结构**: 复制 `.kiro/` 整个目录到新项目
2. **修改RULES_GUIDE.md**: 更新关键词和场景列表
3. **创建场景规则**: 根据新项目的开发场景创建规则文件
4. **创建技术规范**: 根据新项目的技术栈创建规范文件
5. **验证**: 开启新session，确认只有RULES_GUIDE.md被加载

### 维护建议

1. **定期审查**: 每月审查规则库的使用情况
2. **持续优化**: 根据实际使用反馈优化规则内容
3. **版本管理**: 记录规则库的重大变更
4. **团队共享**: 将规则库作为团队知识库

---

## 总结

.kiro目录现在采用清晰的组织结构：
- **steering/** - 轻量级索引（自动加载，~500 tokens）
- **rules/** - 按需加载的规则库
- **specs/** - Specs驱动开发
- **settings/** - IDE配置

这种组织方式既保证了开发规范的统一，又避免了不必要的token消耗。

**核心价值**:
- ✅ Token消耗降低98%（30,000+ → ~500）
- ✅ 规则库完整且易于维护
- ✅ 智能化的按需加载机制
- ✅ 可复用到任何新项目
