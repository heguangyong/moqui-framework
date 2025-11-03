# Quasar 2 升级阶段计划

> 状态字段：`todo` / `in-progress` / `blocked` / `done`

## 阶段 0 · 基线确认（已完成）

| 编号 | 任务 | 输出 | Responsible | Status | Notes |
| 0-4 | 实施 `testing-tools/jwt_chrome_mcp.sh` 并生成 JWT 基线 | `/tmp/baseline_jwt_homepage.png` | Codex | done | 2025-10-18 通过 localStorage 注入实现纯 JWT 截图 |
| --- | --- | --- | --- | --- | --- |
| 0-1 | 与官方仓库对比 `runtime/base-component/webroot` 全量差异 | 差异列表 & 处理结论 | Codex | done | 见 progress-log 2025-10-13 + diff-2025-10-13.md |
| 0-2 | 建立 `/qapps/AppList` Chrome MCP 基线（截图+DOM） | `/tmp/baseline_homepage.png` 及脚本命令 | Codex | done | 2025-10-18 运行 testing-tools/jwt_chrome_mcp.sh (wrapper) |
| 0-3 | 复核文档：升级指南（中/英）是否与当前代码一致 | 更新后的文档 PR | Codex | done | 2025-10-13 已更新 |

### 阶段出口条件
- 与官方最新提交差异清零或说明原因。
- MCP 截图和命令被写入验证清单。
- 进度日志记录完成情况。

## 阶段 1 · 兼容层重构（当前）

| 编号 | 任务 | 输出 | Responsible | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 1-1 | 将 `WebrootVue.qvt.js` 中 setTimeout/DOM hack 重写为 Vue3/Quasar 插件机制 | 代码提交 + 单元验证脚本 | Codex | in-progress | 已完成评估，对照 `phase1-compat-assessment.md` 执行；2025-10-18 Codex 完成 AppList DOM hack/Microtask 队列重构、插件加载监控 + Diagnostics 以及 DragController 生命周期封装；2025-10-19 补齐 menuData/组件加载 JWT Authorization；DevTools headless 验证 nav/account 插件自动加载成功（nav=2/account=1），剩余 Dialog 拖拽待验证 |
| 1-2 | 编写 Cypress/Playwright 冒烟脚本，覆盖 AppList 导航 | 自动化脚本 & 日志 | Codex | todo | 结果写入验证清单 |
| 1-3 | 增加 `qapps` 关键日志/错误监控 | 日志汇总或告警策略 | Claude Code (分析) + Codex (实现) | todo | 需要人工一起评审 |

### 阶段出口条件
- 自动化脚本在本地通过并记录日志。
- 所有手工 hack 被替换为组件化逻辑。
- 进度日志存在“阶段 1 完成”记录。

## 阶段 2 · 主题与业务适配

| 编号 | 任务 | 输出 | Responsible | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 2-1 | 对比官方 demo 与业务页面的差异列表 | UI 差异表 + 截图 | Claude Code (比对) | todo | 需要与设计/产品确认保留项 |
| 2-2 | 将保留的 UI 打磨转换为 Quasar 组件/样式变量 | 组件库草稿 / CSS 变量表 | Codex | todo | 与 2-1 绑定 |
| 2-3 | Storybook/示例页沉淀常用组件 | Storybook 项目或简单示例 | Codex | todo | 便于后续复用 |

### 阶段出口条件
- 差异清单关闭或留存项有明确 owner。
- 组件库或样式表落地并通过验证脚本。

## 阶段 3 · 运维与增量迭代

| 编号 | 任务 | 输出 | Responsible | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 3-1 | 制定季度升级检查流程（Quasar/Vue 次版本） | 运维文档 | Codex | todo | 与运维协同 |
| 3-2 | 持续维护验证脚本与基线 | 自动化报告 | Codex | todo | 每次改动必须更新 |
| 3-3 | 评估增量特性（Dark 模式、主题切换等） | 提案/实验报告 | Claude Code + 产品 | todo | 在保证稳定基础上进行 |

---

> 📌 所有状态变更、备注和附件链接必须同步至 [进度日志](progress-log.md)。
