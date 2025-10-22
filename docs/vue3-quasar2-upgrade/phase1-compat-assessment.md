# 阶段 1 · 兼容层重构评估清单

> 初步梳理 `WebrootVue.qvt.js` 中仍依赖 DOM hack 的关键片段，为后续 Vue3/Quasar2 原生化重构提供依据。

## 1. setTimeout 依赖

| 位置 (行号) | 描述 | 备注 |
| --- | --- | --- |
| 910 | `reload()` 通过 `setTimeout` 恢复 curUrl | 可改为 Vue watcher 或 nextTick |
| 1159 | Invoice 输入框 250ms 聚焦 | 评估能否用 `nextTick` |
| 1190 / 1383 | 按钮禁用后 3 秒自动恢复 | 改为 Promise / await |
| 1290 | 下载完成后 100ms 回收 URL | 可用 `finally` |
| 2873 / 2879 | 导航插件加载使用递归 `setTimeout` | 优化为 Promise 队列 |
| 3438 | 页面加载完成后批量 DOM 处理 | 重点清理 |

## 2. 原生 DOM 事件绑定

| 位置 (行号) | 描述 | 计划 |
| --- | --- | --- |
| 847 | 对话框头部 `mousedown` | 2025-10-18 Codex: 模板 `@mousedown` → `ensureDragInstance`；拖拽生命周期集中在controller，便于后续迁移到指令 |
| 882 / 883 | 全局 `mousemove` / `mouseup` | 2025-10-18 Codex: 新建 DragController 管理 document 事件；后续评估替换为自定义指令/Quasar 插件 |
| 3463 | 批量给应用链接添加 `click` | 2025-10-18 Codex: MutationObserver + 数据标记统一绑定；后续评估是否迁移到 Vue 组件 |

## 3. 其他值得关注的逻辑

- `setTimeout` 包裹的 `document.querySelectorAll`（第 3438 行附近）：2025-10-18 Codex 已改为 MutationObserver + 全局桥接，后续仍需评估是否抽象为 Vue 组件。
- `addNavPluginsWait` / `addAccountPluginsWait`：2025-10-18 Codex 改为 queueMicrotask/Fallback Promise，新增 `recordPluginFailure` + `window.moquiPluginDiagnostics`；仍需评估链式加载完成后的自动化兜底。

## 下一步

1. 逐段分析上述位置的调用链，确认是否仍需保留，或替换为 Vue 3 / Quasar 正式 API。
2. 制定重构顺序：先处理全局事件（鼠标拖动、菜单点击），再收敛 `setTimeout`。
3. 编写实验性子组件/指令，替换 DOM hack。

> 本表作为阶段 1 的工作待办，请持续更新与勾选。
