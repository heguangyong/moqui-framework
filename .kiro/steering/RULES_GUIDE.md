# Kiro 规则库使用指南

> **重要**: 本文件会被自动加载。内容保持极简，仅作为规则库的索引和触发器。

## 📚 规则库位置

规则库位于 `.kiro/rules/` 目录，**不会自动加载**，需要按需读取。

## 🎯 使用方式

### 关键词触发机制

当用户消息包含以下关键词时，AI应该**立即读取**对应的规则文件：

#### Moqui开发相关
**关键词**: `moqui`, `开发moqui`, `创建service`, `创建screen`, `实体查询`, `菜单配置`
**读取**: `.kiro/rules/scenarios/moqui-development.md`

#### Specs工作流相关
**关键词**: `specs`, `创建spec`, `requirements`, `design`, `tasks`, `执行任务`
**读取**: `.kiro/rules/scenarios/specs-workflow.md`

#### 前端开发相关
**关键词**: `前端`, `vue`, `quasar`, `组件`, `开发组件`, `typescript`
**读取**: `.kiro/rules/scenarios/frontend-development.md`

#### 故障排查相关
**关键词**: `错误`, `报错`, `问题`, `故障`, `排查`, `调试`, `不工作`
**读取**: `.kiro/rules/scenarios/troubleshooting.md`

## 📋 标准工作流程

### 1. 识别场景
根据用户消息中的关键词，识别开发场景

### 2. 读取场景规则
```typescript
// 示例：用户说"开发Moqui应用"
readFile('.kiro/rules/scenarios/moqui-development.md')
```

### 3. 按需读取技术规范
根据场景规则中的引用，按需读取具体的技术规范：
```typescript
// 如果涉及认证
readFile('.kiro/rules/standards/moqui/authentication.md')

// 如果涉及实体操作
readFile('.kiro/rules/standards/moqui/entity.md')
```

## 🔍 快速索引

### 业务场景规则
- `scenarios/moqui-development.md` - Moqui开发完整流程
- `scenarios/specs-workflow.md` - Specs驱动开发流程
- `scenarios/frontend-development.md` - 前端开发流程
- `scenarios/troubleshooting.md` - 故障排查流程

### 技术规范规则
**Moqui**:
- `standards/moqui/authentication.md` - 认证配置
- `standards/moqui/entity.md` - 实体操作
- `standards/moqui/service.md` - 服务定义
- `standards/moqui/screen.md` - 屏幕定义

**前端**:
- `standards/frontend/vue.md` - Vue3规范
- `standards/frontend/quasar.md` - Quasar2规范
- `standards/frontend/typescript.md` - TypeScript规范

**通用**:
- `standards/general/code-quality.md` - 代码质量
- `standards/general/testing.md` - 测试规范
- `standards/general/design-patterns.md` - 设计模式

## 💡 核心原则

1. **按需加载**: 不要一次性读取所有规则
2. **场景优先**: 先读场景规则，再读技术规范
3. **关键词匹配**: 根据用户消息中的关键词触发
4. **渐进式**: 先读概览，需要时再读详细规范

## 📊 Token优化

- **本文件**: ~500 tokens (自动加载)
- **场景规则**: ~2-3KB per file (按需加载)
- **技术规范**: ~3-5KB per file (按需加载)

相比旧方案的30,000+ tokens自动加载，新方案大幅降低token消耗。

## 🚀 示例

### 示例1: 用户说"开发Moqui应用"
```typescript
// 1. 识别关键词: "moqui", "开发"
// 2. 读取场景规则
readFile('.kiro/rules/scenarios/moqui-development.md')

// 3. 根据具体需求，按需读取技术规范
// 如果涉及Service开发
readFile('.kiro/rules/standards/moqui/service.md')
```

### 示例2: 用户说"创建Vue组件"
```typescript
// 1. 识别关键词: "vue", "组件"
// 2. 读取场景规则
readFile('.kiro/rules/scenarios/frontend-development.md')

// 3. 按需读取技术规范
readFile('.kiro/rules/standards/frontend/vue.md')
readFile('.kiro/rules/standards/frontend/quasar.md')
```

### 示例3: 用户说"遇到认证错误"
```typescript
// 1. 识别关键词: "错误", "认证"
// 2. 读取故障排查场景
readFile('.kiro/rules/scenarios/troubleshooting.md')

// 3. 读取认证规范
readFile('.kiro/rules/standards/moqui/authentication.md')
```

---

**版本**: v1.0  
**最后更新**: 2025-01-16  
**Token消耗**: ~500 tokens

## 总结

这个文件是规则库的"入口"和"索引"，帮助AI：
1. 知道规则库的存在
2. 知道如何按需加载规则
3. 知道什么时候加载哪个规则

保持本文件极简，避免token浪费。
