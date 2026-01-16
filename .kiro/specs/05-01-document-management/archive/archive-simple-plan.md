# Archive 文档简单归档方案

## 目标

将 `docs/archive/` 中的文档直接归档到对应的 spec 目录中，作为参考文档保存。

## 归档映射

### 1. 开发指南类 → Steering

| 源文档 | 目标位置 | 操作 |
|--------|---------|------|
| 01-开发指南-Moqui新应用开发最佳实践.md | `.kiro/steering/archive/` | 直接复制 |
| 06-故障排查-Telegram机器人问题诊断与修复.md | `.kiro/steering/archive/` | 直接复制 |
| 08-桌面端UI架构参考文档.md | `.kiro/steering/archive/` | 直接复制 |

### 2. 架构设计类 → 对应 Spec 的 docs/archive/

| 源文档 | 目标 Spec | 目标路径 |
|--------|----------|---------|
| 02-架构设计-MCP统一架构与AI平台整合.md | 01-03-mcp-unified-architecture | `docs/archive/` |
| 03-前端方案-移动端完整实施方案.md | 03-01-mobile-system | `docs/archive/` |

### 3. 应用案例类 → 对应 Spec 的 docs/archive/

| 源文档 | 目标 Spec | 目标路径 |
|--------|----------|---------|
| 04-应用案例-智慧蜂巢供需撮合平台.md | 02-01-smart-hive-platform | `docs/archive/` |
| 05-应用案例-EconoWatch经济资讯聚合系统.md | 02-02-econowatch-system | `docs/archive/` |
| 07-应用案例-上海港集装箱运输供需系统.md | 02-03-shanghai-port-logistics | `docs/archive/` |

## 执行步骤

### 步骤 1: 创建目录结构

```bash
# Steering archive 目录
mkdir -p .kiro/steering/archive

# Spec archive 目录
mkdir -p .kiro/specs/01-03-mcp-unified-architecture/docs/archive
mkdir -p .kiro/specs/03-01-mobile-system/docs/archive
mkdir -p .kiro/specs/02-01-smart-hive-platform/docs/archive
mkdir -p .kiro/specs/02-02-econowatch-system/docs/archive
mkdir -p .kiro/specs/02-03-shanghai-port-logistics/docs/archive
```

### 步骤 2: 复制文档

```bash
# 复制到 Steering
cp docs/archive/01-开发指南-Moqui新应用开发最佳实践.md .kiro/steering/archive/
cp docs/archive/06-故障排查-Telegram机器人问题诊断与修复.md .kiro/steering/archive/
cp docs/archive/08-桌面端UI架构参考文档.md .kiro/steering/archive/

# 复制到对应 Spec
cp docs/archive/02-架构设计-MCP统一架构与AI平台整合.md .kiro/specs/01-03-mcp-unified-architecture/docs/archive/
cp docs/archive/03-前端方案-移动端完整实施方案.md .kiro/specs/03-01-mobile-system/docs/archive/
cp docs/archive/04-应用案例-智慧蜂巢供需撮合平台.md .kiro/specs/02-01-smart-hive-platform/docs/archive/
cp docs/archive/05-应用案例-EconoWatch经济资讯聚合系统.md .kiro/specs/02-02-econowatch-system/docs/archive/
cp docs/archive/07-应用案例-上海港集装箱运输供需系统.md .kiro/specs/02-03-shanghai-port-logistics/docs/archive/
```

### 步骤 3: 创建索引文档

在每个 archive 目录创建 README.md 说明文档来源和用途。

## 完成标准

- [ ] 所有目录结构创建完成
- [ ] 所有文档复制到位
- [ ] 每个 archive 目录有 README.md 索引
- [ ] 原 docs/archive/ 目录保持不变（作为备份）

---

**创建日期**: 2025-01-14  
**预计执行时间**: 30分钟  
**状态**: 待执行
