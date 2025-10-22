# Headless Vue Diagnostics Script

为了在无头环境（CI、本地脚本）下验证 `/qapps` Vue 入口是否正确挂载，我们新增了 `debug_vue_mounting.sh`/`debug_vue_mounting.js`（位于仓库根目录）。脚本会：

- 通过 REST 登录接口获取 JWT（必要时记录 `JSESSIONID`）。
- 启动 Chrome headless 并注入 `Authorization` 头、LocalStorage、Cookie。
- 等待导航/账户插件加载，采集 Vue 挂载状态与诊断信息。
- 将输出写入 `/tmp`，便于后续排查。

## 使用方法

```bash
./debug_vue_mounting.sh
```

执行成功后，可在 `/tmp` 目录获取：

- `vue_debug_screenshot.png`：当前 `/qapps` 页面截图。
- `qapps_dom.html`：完整 DOM 快照。
- `moqui_plugin_diagnostics.json`：`window.moquiPluginDiagnostics` 的 JSON。
- `moqui_plugin_counts.json`：`navPlugins` 与 `accountPlugins` 数量。
- `moqui_plugin_history.json` / `moqui_plugin_failures.json`：插件加载历史 / 失败列表。
- `moqui_plugin_hidden_counts.json`：页面中隐藏的插件 URL 配置。
- `moqui_network_events.json`：Chrome DevTools 捕获的网络请求明细（用于排查插件资源未请求等问题）。

## 当前验证结果（2025-10-19）

- `navPlugins=2 / accountPlugins=1`（`QuickSearch.qvue`、`ActiveOrgNav.qvue`、`MyAccountNav.qvue` 正常加载）。
- `window.moquiPluginDiagnostics.hasFailures=false`。
- 截图与 DOM 显示 `/qapps` 主界面已完全渲染。

如需在其他环境运行，可设置以下环境变量覆盖默认值：

```bash
export MOQUI_URL="http://target-host:8080"
export MOQUI_USERNAME="your.user"
export MOQUI_PASSWORD="secret"
./debug_vue_mounting.sh
```

> 若脚本运行失败，可查看 `debug_vue_mounting.js` 日志中的 Chrome 启动错误，或检查 `/tmp/moqui_network_events.json` 是否缺失插件资源请求。

### CI 断言模式

运行 `./debug_vue_mounting.sh --assert` 将在 Vue 未挂载、nav/account 插件计数为 0 或检测到插件失败时返回非零退出码，方便集成到 CI 工作流中。
