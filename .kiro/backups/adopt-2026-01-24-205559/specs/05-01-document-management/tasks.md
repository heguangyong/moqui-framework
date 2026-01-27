# 文档整理实施计划

## 任务概述

**核心目标**: 整理系统所有的文档，并使用specs方式组织起来，把项目中各类文档迁移到specs目录下面。

## 实施任务

- [ ] 1. 分析现有文档结构
  - 扫描docs目录下的所有文档
  - 识别testing-tools目录下的测试脚本
  - 分析.claude/skills目录的技术文档
  - 确定每个文档的功能归属和迁移目标

- [ ] 2. 创建specs目录结构
  - 为每个功能创建对应的specs目录
  - 在每个specs下创建requirements.md、design.md、tasks.md三件套
  - 建立testing子目录用于归属测试脚本

- [ ] 3. 执行文档内容迁移
  - ✅ 已完成：将docs/04-智慧蜂巢供需撮合平台.md转换为smart-hive-platform specs
  - ✅ 已完成：将docs/02-MCP统一架构.md转换为mcp-unified-architecture specs  
  - ✅ 已完成：将docs/03-移动端前端方案.md转换为mobile-frontend-system specs
  - ✅ 已完成：将docs/05-EconoWatch系统.md转换为econowatch-system specs
  - ✅ 已完成：将docs/01-开发指南.md整合到steering文档中
  - ✅ 已完成：将原始文档内容转换为specs三件套格式
  - ✅ 已完成：保持文档内容的完整性和可读性

- [x] 4. 重组测试脚本
  - 分析testing-tools下每个脚本的功能
  - 将测试脚本按功能归属到对应specs的testing目录
  - 更新testing-tools/README.md为索引文件

- [x] 5. 技术规范文档迁移
  - ✅ 已完成：将.claude/skills/moqui/SKILL.md整合到steering/moqui-framework-guide.md
  - ✅ 已完成：将.claude/skills/quasar/SKILL.md整合到steering/quasar-framework-guide.md
  - ✅ 已完成：清理原始skills目录并建立重定向

- [x] 6. 清理和归档
  - 将已迁移的docs文档移动到docs/archive目录
  - 创建.kiro/specs/README.md索引文件
  - 验证所有文档链接和引用的正确性

- [x] 7. 建立维护机制
  - ✅ 已完成：创建文档迁移部署计划
  - ✅ 已完成：编写用户操作指南
  - ✅ 已完成：建立日常维护流程