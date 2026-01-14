# 文档分类和管理标准

## 概述

本文档定义了项目文档的分类标准、命名规范和组织结构，用于规范化现有分散文档的整理工作。

## 文档类型定义

### 核心文档类型

#### 1. 技术指南 (Technical Guide)
- **定义**: 框架、工具、技术的使用指南和最佳实践
- **特征**: 包含安装、配置、API使用等技术细节
- **示例**: Moqui框架指南、Quasar组件使用指南
- **目标位置**: `.kiro/steering/` (作为技术标准)

#### 2. 应用案例 (Application Case)
- **定义**: 具体功能实现的案例和解决方案
- **特征**: 包含业务场景、实现方案、代码示例
- **示例**: 智慧蜂巢平台、EconoWatch系统
- **目标位置**: `.kiro/specs/[feature-name]/` (转换为功能规范)

#### 3. 开发指南 (Development Guide)
- **定义**: 开发流程、规范、最佳实践
- **特征**: 包含编码标准、工作流程、质量要求
- **示例**: 新应用开发最佳实践
- **目标位置**: `.kiro/steering/` (作为开发原则)

#### 4. 架构设计 (Architecture Design)
- **定义**: 系统架构、设计决策、技术选型
- **特征**: 包含架构图、组件关系、设计理念
- **示例**: MCP统一架构设计
- **目标位置**: `.kiro/specs/[system-name]/design.md`

#### 5. 故障排查 (Troubleshooting)
- **定义**: 问题诊断、解决方案、FAQ
- **特征**: 包含问题描述、排查步骤、解决方法
- **示例**: Telegram机器人问题诊断
- **目标位置**: `.kiro/steering/troubleshooting-guide.md` (合并为统一指南)

#### 6. 配置文档 (Configuration)
- **定义**: 系统配置、环境设置、部署指南
- **特征**: 包含配置参数、环境要求、部署步骤
- **示例**: Docker配置、环境设置
- **目标位置**: `.kiro/steering/deployment-guide.md`

#### 7. 测试脚本 (Testing Scripts)
- **定义**: 功能测试、集成测试、验证脚本
- **特征**: 可执行脚本、测试用例、验证工具
- **示例**: API测试脚本、前端验证脚本、集成测试工具
- **目标位置**: `.kiro/specs/[feature-name]/testing/` (归属到对应功能)

## 文档状态定义

### Specs状态
- **DRAFT**: 草稿状态，正在编写中
- **REQUIREMENTS_COMPLETE**: 需求文档完成
- **DESIGN_COMPLETE**: 设计文档完成
- **TASKS_COMPLETE**: 任务文档完成
- **IN_PROGRESS**: 实施进行中
- **COMPLETED**: 已完成实施

### 文档优先级
- **CRITICAL**: 关键文档，必须保留和维护
- **HIGH**: 重要文档，需要迁移整理
- **MEDIUM**: 一般文档，可选择性处理
- **LOW**: 低价值文档，可考虑归档或删除

## 文档组织结构

### .kiro/specs/ 结构
```
.kiro/specs/
├── [feature-name]/
│   ├── requirements.md    # 需求文档
│   ├── design.md         # 设计文档
│   ├── tasks.md          # 任务文档
│   ├── testing/          # 测试脚本和工具
│   │   ├── api-tests/    # API测试脚本
│   │   ├── integration/  # 集成测试
│   │   └── validation/   # 验证工具
│   └── [additional-docs] # 相关补充文档
```

### .kiro/steering/ 结构
```
.kiro/steering/
├── project-overview.md           # 项目概览
├── moqui-framework-guide.md      # Moqui框架指南
├── quasar-framework-guide.md     # Quasar框架指南
├── development-principles.md     # 开发原则
├── design-principles.md          # 设计原则
├── moqui-standards.md           # Moqui开发标准
├── troubleshooting-guide.md     # 故障排查指南
├── deployment-guide.md          # 部署指南
└── document-management-principles.md # 文档管理原则
```

## 文档迁移规则

### 迁移到Specs的条件
1. 文档描述具体功能或系统
2. 包含需求、设计或实施内容
3. 可以转换为结构化的规范文档
4. 有明确的实施目标和任务
5. **测试脚本归属原则**: 所有测试脚本必须归属到对应的功能specs下

### 迁移到Steering的条件
1. 文档包含技术标准或原则
2. 适用于多个项目或功能
3. 提供指导性的最佳实践
4. 具有长期参考价值

### 保留在原位置的条件
1. 项目根目录的README.md
2. LICENSE、CHANGELOG等项目元文件
3. 构建和部署脚本的说明文档

## 文档命名规范

### Specs文档命名
- 使用kebab-case格式: `feature-name`
- 描述性名称，避免缩写
- 英文命名，便于系统处理

### Steering文档命名
- 使用kebab-case格式
- 包含文档类型后缀: `-guide`, `-principles`, `-standards`
- 清晰表达文档用途

### 文档标题规范
- 中文标题：简洁明确，体现文档核心内容
- 英文标题：用于文件名和系统引用
- 版本信息：在文档末尾标注版本和更新日期

## 元数据标准

### 必需元数据
```yaml
---
title: "文档标题"
version: "v1.0"
lastUpdated: "2025-01-13"
author: "作者"
category: "文档类型"
tags: ["标签1", "标签2"]
status: "文档状态"
---
```

### 可选元数据
- `description`: 文档描述
- `dependencies`: 依赖的其他文档
- `audience`: 目标读者
- `reviewers`: 审核人员
- `approvalStatus`: 审批状态

## 质量标准

### 内容质量要求
1. **完整性**: 包含必要的背景、方法、结果
2. **准确性**: 信息准确，无误导性内容
3. **时效性**: 内容与当前系统状态一致
4. **可读性**: 结构清晰，语言简洁

### 格式规范要求
1. **Markdown格式**: 统一使用标准Markdown语法
2. **标题层次**: 合理的标题层次结构
3. **代码块**: 正确的代码高亮和格式
4. **链接引用**: 有效的内部和外部链接

## 维护流程

### 文档创建流程
1. 确定文档类型和目标位置
2. 使用标准模板创建文档
3. 填写必需的元数据信息
4. 编写文档内容
5. 进行质量检查和审核

### 文档更新流程
1. 识别需要更新的文档
2. 更新内容和元数据
3. 检查相关文档的一致性
4. 记录变更历史
5. 通知相关人员

### 文档清理流程
1. 定期评估文档价值
2. 识别冗余和过时文档
3. 制定清理计划
4. 执行清理操作
5. 记录清理结果

---

**文档版本**: v1.0  
**最后更新**: 2025年1月13日  
**适用范围**: 整个项目的文档管理  
**审批状态**: 待审批