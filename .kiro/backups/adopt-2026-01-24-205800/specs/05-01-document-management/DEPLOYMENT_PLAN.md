# 文档整理和迁移部署计划

## 概述

本计划的核心目标是：**整理系统所有的文档，并使用specs方式组织起来，把项目中各类文档迁移到specs目录下面**。

## 部署目标

### 核心目标
**将项目中分散的各类文档迁移到 `.kiro/specs/` 目录下，使用specs方式统一组织管理**

### 具体目标
1. **文档发现**: 识别项目中所有有价值的文档
2. **文档分类**: 按功能和类型对文档进行分类
3. **specs转换**: 将文档转换为specs格式（requirements.md、design.md、tasks.md）
4. **迁移执行**: 将文档迁移到对应的specs目录
5. **清理整理**: 清理原始位置，建立索引导航

### 成功标准
- 项目中所有有价值文档迁移到 `.kiro/specs/` 目录
- 每个功能都有完整的specs三件套
- 原始文档位置得到清理和整理
- 建立清晰的文档导航和索引

## 部署环境规划

## 当前文档现状分析

### 需要迁移的文档位置
1. **docs/ 目录**
   - `00-文档索引.md` → 转换为specs索引
   - `01-开发指南-Moqui新应用开发最佳实践.md` → `moqui-development/`
   - `02-架构设计-MCP统一架构与AI平台整合.md` → `mcp-architecture/`
   - `03-前端方案-移动端完整实施方案.md` → `mobile-frontend/`
   - `04-应用案例-智慧蜂巢供需撮合平台.md` → `smart-hive-platform/`
   - `05-应用案例-EconoWatch经济资讯聚合系统.md` → `econowatch-system/`
   - `06-故障排查-Telegram机器人问题诊断与修复.md` → `telegram-troubleshooting/`
   - `07-应用案例-上海港集装箱运输供需系统.md` → `shanghai-port-logistics/`
   - `08-桌面端UI架构参考文档.md` → `desktop-ui-architecture/`

2. **testing-tools/ 目录**
   - 各类测试脚本 → 按功能归属到对应specs的testing子目录

3. **.claude/skills/ 目录**
   - `moqui/SKILL.md` → 已迁移到steering
   - `quasar/SKILL.md` → 已迁移到steering

### 目标specs结构
```
.kiro/specs/
├── moqui-development/           # Moqui开发最佳实践
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── mcp-architecture/            # MCP统一架构
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── mobile-frontend/             # 移动端前端方案
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── smart-hive-platform/         # 智慧蜂巢平台
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── econowatch-system/           # EconoWatch系统
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── telegram-troubleshooting/    # Telegram故障排查
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── shanghai-port-logistics/     # 上海港物流系统
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── desktop-ui-architecture/     # 桌面端UI架构
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
└── [existing-specs]/           # 现有specs保持不变
```

## 文档迁移实施计划

### 第1阶段：准备和备份（第1天）
**目标**: 准备迁移环境和备份现有文档

**具体任务**:
1. 备份整个 `docs/` 目录到 `docs/backup/`
2. 备份 `testing-tools/` 目录
3. 创建迁移日志文件
4. 准备specs模板文件

### 第2阶段：文档分析和规划（第2-3天）
**目标**: 分析每个文档的内容和迁移策略

**具体任务**:
1. 分析每个docs文档的主要内容
2. 确定每个文档对应的specs名称
3. 规划如何将内容拆分为requirements、design、tasks
4. 识别需要合并或拆分的文档

### 第3阶段：创建specs结构（第4天）
**目标**: 创建所有目标specs的目录结构

**具体任务**:
1. 创建8个新的specs目录
2. 在每个specs下创建requirements.md、design.md、tasks.md模板
3. 设置统一的文档头部元数据

### 第4阶段：内容迁移转换（第5-8天）
**目标**: 将原始文档内容转换为specs格式

**每个specs的转换流程**:
1. **requirements.md**: 提取业务需求、用户故事、验收标准
2. **design.md**: 提取技术设计、架构方案、实现细节
3. **tasks.md**: 提取实施步骤、开发任务、里程碑

### 第5阶段：测试脚本重组（第9天）
**目标**: 将testing-tools下的脚本按功能归属到对应specs

**具体任务**:
1. 分析每个测试脚本的功能
2. 创建specs/[feature-name]/testing/目录
3. 移动相关脚本到对应位置
4. 更新testing-tools/README.md为索引

### 第6阶段：清理和验证（第10天）
**目标**: 清理原始位置并验证迁移结果

**具体任务**:
1. 将已迁移的docs文档移动到docs/archive/
2. 更新所有文档间的链接引用
3. 创建.kiro/specs/README.md索引文件
4. 验证所有specs的完整性

## 文档转换规则

### specs三件套内容分配原则

#### requirements.md 内容来源
- 业务背景和目标
- 用户需求和场景
- 功能性需求
- 非功能性需求
- 验收标准
- 约束条件

#### design.md 内容来源  
- 技术架构设计
- 系统组件设计
- 接口设计
- 数据模型设计
- 技术选型说明
- 实现方案细节

#### tasks.md 内容来源
- 实施步骤和计划
- 开发任务分解
- 里程碑和检查点
- 资源需求
- 时间安排
- 风险和依赖

### 具体文档转换示例

#### 示例1：`01-开发指南-Moqui新应用开发最佳实践.md`
**目标specs**: `moqui-development/`

- **requirements.md**: 提取开发规范需求、最佳实践要求
- **design.md**: 提取技术架构、开发模式、工具配置
- **tasks.md**: 提取开发流程步骤、检查清单

#### 示例2：`04-应用案例-智慧蜂巢供需撮合平台.md`
**目标specs**: `smart-hive-platform/`

- **requirements.md**: 提取业务需求、用户故事、功能要求
- **design.md**: 提取系统架构、技术方案、接口设计  
- **tasks.md**: 提取开发计划、实施步骤、交付里程碑

## 迁移执行检查清单

### 每个specs完成标准
- [ ] 目录结构创建完成
- [ ] requirements.md 内容完整
- [ ] design.md 技术方案清晰
- [ ] tasks.md 实施计划可执行
- [ ] 文档元数据信息完整
- [ ] 相关测试脚本已归属
- [ ] 原始文档已归档

### 整体迁移完成标准
- [ ] 所有docs文档已处理
- [ ] 所有testing-tools脚本已重组
- [ ] .kiro/specs/README.md 索引创建
- [ ] docs/archive/ 归档整理完成
- [ ] testing-tools/README.md 更新为索引
- [ ] 所有文档链接验证通过

---

**文档版本**: v1.0  
**最后更新**: 2025年1月14日  
**适用范围**: 文档管理系统部署实施  
**审批状态**: 待审批