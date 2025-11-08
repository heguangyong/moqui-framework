# Claude Skills for Moqui Project

This directory contains various skills to assist with Moqui development.

## Available Skills

### 🔧 moqui/
- **Description**: Moqui Framework & 智能供需平台开发 - 完整官方文档 + 项目实践
- **Version**: v3.0 (2025-11-02 更新) 🎉 **MAJOR UPDATE**
- **Source**:
  - ✅ **Complete Moqui.org documentation** (73页完整官网文档)
  - ✅ **Local project documentation** from `/Users/demo/Workspace/moqui/docs/`
- **Coverage**:
  - 🚀 **Getting Started** (10页): 入门指南、IDE设置、部署
  - 🏗️ **Framework Core** (50页): 数据、服务、UI、集成、工具
  - 📱 **Applications** (13页): 应用构建、业务构件、ERP
  - 🏢 **Local Project**: 智能供需平台完整实现
- **Features**:
  - Moqui Framework 完整生态系统
  - Entity Facade 数据建模
  - Service Implementation 服务实现
  - XML Screen 用户界面
  - Apache Camel 企业集成
  - Docker Multi-instance 部署
  - Performance & Security 性能安全
  - 智能供需平台开发
  - Telegram Bot + AI集成
  - JWT认证 + Vue3+Quasar2
  - MCP调试工具链
- **Files**:
  - `SKILL.md` - 主技能文档 (30.6KB) ⭐**ENHANCED**
  - `moqui_complete.zip` - 完整技能包 (156.3KB) 🆕**NEW**
  - `moqui.zip` - 基础技能包 (6.0KB)
  - `references/` - 详细参考文档:
    - `getting_started.md` - 入门指南 (139KB)
    - `framework.md` - 框架核心 (340KB) 📈**MASSIVE**
    - `applications.md` - 应用构件 (18KB)
    - `local_project.md` - 本地项目 (4.5KB)
    - `index.md` - 文档导航 (1.8KB)

## Usage

### Local Development
- Reference the skill files directly for development guidance
- Use `references/` for detailed API documentation
- Check `SKILL.md` for quick patterns and examples

### Claude Integration
- Upload `moqui.zip` to https://claude.ai/skills
- Claude will use this knowledge for Moqui-related questions

## Adding New Skills

To add new skills to this project:

1. Create a new directory: `.claude/skills/{skill-name}/`
2. Add the skill files (SKILL.md, references/, etc.)
3. Update this README.md with the new skill information
4. Consider creating a packaged .zip file for Claude upload

## File Structure

```
.claude/skills/
├── README.md              # This file
├── moqui/                 # Moqui Framework skill
│   ├── SKILL.md          # Main skill file
│   ├── SKILL.md.backup   # Backup version
│   ├── moqui.zip         # Packaged for upload
│   └── references/       # Detailed documentation
│       ├── index.md
│       └── other.md
└── {future-skills}/      # Additional skills can be added here
```

## Maintenance

- Skills should be updated when framework documentation changes
- Consider versioning skills if major framework updates occur
- Keep skill descriptions up to date in this README