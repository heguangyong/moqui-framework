# 项目环境配置（模板）

> **重要**: 这是项目的环境配置模板，复制到新项目时请根据实际情况修改。

---

## 📋 项目基本信息

- **项目名称**: 测试项目
- **项目类型**: Kiro Spec 驱动开发项目
- **核心技术**: Kiro Spec + Ultrawork 精神增强
- **开发语言**: [根据项目调整]

---

## 🖥️ 开发环境

### 本地环境
- **操作系统**: Windows (cmd shell)
- **Python**: 3.8+ (用于 Ultrawork 工具)
- **Kiro IDE**: 最新版本

### 核心组件
- **Spec 系统**: `.kiro/specs/` - Spec 驱动开发的核心
- **Steering 系统**: `.kiro/steering/` - AI 行为规则和上下文管理
- **工具系统**: `.kiro/tools/` - Ultrawork 增强工具

---

## 🔧 配置文件

**核心配置**:
- `CORE_PRINCIPLES.md` - 基准开发规则(包含 Ultrawork 原则)
- `ENVIRONMENT.md` - 环境配置(本文件)
- `CURRENT_CONTEXT.md` - 当前 Spec 场景(每个 Spec 更新)
- `RULES_GUIDE.md` - 规则索引

**Spec 结构**:
- `requirements.md` - 需求文档
- `design.md` - 设计文档
- `tasks.md` - 任务列表

---

## 🌐 关键目录

- `.kiro/specs/` - 所有 Spec 的存储目录
- `.kiro/steering/` - AI 行为规则和上下文
- `.kiro/tools/` - Ultrawork 增强工具
- `docs/` - 项目文档

---

## 🔐 AI 权限

**授权范围**:
- ✅ 查看和修改 Spec 文档
- ✅ 创建和修改 Steering 规则
- ✅ 使用 Ultrawork 工具增强质量
- ✅ 执行 Python 脚本(工具层)
- ❌ 不能修改核心原则(CORE_PRINCIPLES.md)未经用户同意

**操作限制**:
- 修改 CORE_PRINCIPLES.md 前必须征得用户同意
- 创建新工具前应先在 Spec 中设计
- 保持"有节制的 AI 权限"原则

---

## 📦 项目结构

```
project-root/
├── .kiro/                      # Kiro 核心目录
│   ├── specs/                  # Spec 存储
│   │   └── SPEC_WORKFLOW_GUIDE.md
│   ├── steering/               # AI 行为规则
│   │   ├── CORE_PRINCIPLES.md
│   │   ├── ENVIRONMENT.md (本文件)
│   │   ├── CURRENT_CONTEXT.md
│   │   └── RULES_GUIDE.md
│   ├── tools/                  # Ultrawork 工具
│   │   └── ultrawork_enhancer.py
│   ├── ultrawork-application-guide.md
│   ├── ultrawork-integration-summary.md
│   └── sisyphus-deep-dive.md
├── docs/                       # 项目文档
├── ultrawork.bat              # Ultrawork 便捷脚本
└── README.md                   # 项目说明
```

---

## 🔥 Ultrawork 功能

**已集成 Sisyphus 的"不懈努力"精神**:
- 专业级质量评估体系 (0-10 评分)
- Requirements/Design/Tasks 三阶段增强
- 自动改进识别和应用
- 便捷的批处理脚本

**使用方法**:
```bash
.\ultrawork.bat spec-name requirements  # 增强需求文档
.\ultrawork.bat spec-name design       # 增强设计文档
.\ultrawork.bat spec-name tasks        # 检查任务完成
.\ultrawork.bat spec-name all          # 全阶段增强
```

---

**版本**: v4.0  
**更新**: 2026-01-22  
**项目**: 通用 Kiro Spec 项目模板  
**说明**: 已清理项目特定内容，集成 Ultrawork 精神，可复制使用
