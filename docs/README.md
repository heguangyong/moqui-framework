# 项目文档

本目录包含所有项目相关文档，按类别组织。

---

## 📁 目录结构

```
docs/
├── setup/          # 项目设置和配置文档
├── status/         # 项目状态报告
└── releases/       # 发布说明和版本历史
```

---

## 📚 文档索引

### 设置文档 (setup/)

#### ERP 项目设置
- **[ERP_PROJECT_SETUP_GUIDE.md](setup/ERP_PROJECT_SETUP_GUIDE.md)** - 完整的 ERP 项目设置指南
  * 详细的步骤说明
  * 完整的代码示例
  * 配置文件模板
  * 常见问题解答
  * 版本: v2.0 (2026-01-31)

- **[ERP_PROJECT_SETUP_SUMMARY.md](setup/ERP_PROJECT_SETUP_SUMMARY.md)** - 快速设置摘要
  * 5 步快速开始
  * 关键配置文件
  * 常用命令
  * 验证清单
  * 版本: v2.0 (2026-01-31)

#### KSE 相关
- **[KSE_1.18.1_NEW_FEATURES.md](setup/KSE_1.18.1_NEW_FEATURES.md)** - KSE 1.18.1 新特性详解
  * 新增命令说明
  * 增强的命令
  * 文档治理规范
  * 对 ERP 项目的影响
  * 版本: v1.0 (2026-01-31)

- **[KSE_UPDATE_SUMMARY.md](setup/KSE_UPDATE_SUMMARY.md)** - KSE 更新总结
  * 完成的工作
  * 文档结构改进
  * 验证结果
  * 版本: v1.0 (2026-01-31)

---

### 状态报告 (status/)

- **[PROJECT_STATUS_2026_01_28.md](status/PROJECT_STATUS_2026_01_28.md)** - 项目状态报告
  * 前端架构重构总结
  * 已完成工作
  * 遗留问题
  * 下次推进建议
  * 日期: 2026-01-28

---

### 发布说明 (releases/)

- **[RELEASE_NOTES_v1.0.2.md](releases/RELEASE_NOTES_v1.0.2.md)** - v1.0.2 发布说明
- **[ReleaseNotes.md](releases/ReleaseNotes.md)** - 历史发布说明

---

## 🔗 快速链接

### 新项目设置
1. 阅读 [ERP 项目设置指南](setup/ERP_PROJECT_SETUP_GUIDE.md)
2. 参考 [快速设置摘要](setup/ERP_PROJECT_SETUP_SUMMARY.md)
3. 了解 [KSE 1.18.1 新特性](setup/KSE_1.18.1_NEW_FEATURES.md)

### 当前项目状态
- 查看 [项目状态报告](status/PROJECT_STATUS_2026_01_28.md)

### 版本历史
- 查看 [发布说明](releases/)

---

## 📝 文档规范

根据 KSE 1.18.1 文档治理规范:

### 根目录规范
- ✅ 根目录只保留 `README.md`
- ✅ 所有其他文档移到 `docs/` 目录
- ✅ `LICENSE.md` 和 `SECURITY.md` 可保留在根目录 (特殊情况)

### 文档组织
- **setup/** - 设置、配置、安装相关文档
- **status/** - 项目状态、进度报告
- **releases/** - 发布说明、版本历史
- **specs/** - 在 `.kiro/specs/` 目录 (Spec 驱动开发)

### Spec 文档规范
每个 Spec 必须包含三个核心文件:
- `requirements.md` - 需求文档
- `design.md` - 设计文档
- `tasks.md` - 任务列表

---

## 🔧 维护指南

### 添加新文档
1. 确定文档类型 (setup/status/releases)
2. 放到对应目录
3. 更新本 README 的索引
4. 运行 `kse doctor --docs` 验证合规性

### 更新现有文档
1. 更新文档内容
2. 更新版本号和日期
3. 更新本 README (如需要)
4. 提交到 Git

### 检查文档合规性
```bash
# 检查文档治理
kse doctor --docs

# 检查项目状态
kse status

# 详细信息
kse status --verbose
```

---

## 📖 相关资源

- [Kiro Spec 工作流指南](../.kiro/specs/SPEC_WORKFLOW_GUIDE.md)
- [核心开发原则](../.kiro/steering/CORE_PRINCIPLES.md)
- [环境配置](../.kiro/steering/ENVIRONMENT.md)
- [当前场景规则](../.kiro/steering/CURRENT_CONTEXT.md)

---

**维护者**: Kiro AI Assistant  
**最后更新**: 2026-01-31  
**KSE 版本**: 1.18.1+
