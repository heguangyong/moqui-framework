# 阶段 1 自动化验证（CI）计划

> 目标：在 CI 环境中复用 `debug_vue_mounting.sh --assert`，确保 `/qapps` Vue 应用和 nav/account 插件持续可用。

## 运行步骤

1. **启动 Moqui 服务**（CI job 需先运行 `gradle load`/`gradle run` 或使用现有容器）。
2. **等待端口 8080**：可使用 `curl --retry-connrefused http://localhost:8080` 确认服务就绪。
3. **执行无头脚本**：
   ```bash
   ./debug_vue_mounting.sh --assert
   ```
4. **收集产物**（可上传到 CI artifacts）：
   - `/tmp/vue_debug_screenshot.png`
   - `/tmp/qapps_dom.html`
   - `/tmp/moqui_plugin_diagnostics.json`
   - `/tmp/moqui_plugin_counts.json`
   - `/tmp/moqui_plugin_history.json`
   - `/tmp/moqui_plugin_failures.json`
   - `/tmp/moqui_plugin_hidden_counts.json`
   - `/tmp/moqui_network_events.json`

## 断言逻辑

脚本在 `--assert` 模式下会针对以下条件返回非零退出码：
- Vue 未挂载（`window.moqui.webrootVue` 不存在）。
- nav/account 插件计数为 0。
- `moqui.webrootVue.pluginLoadFailures` 非空。

## CI 示例（GitHub Actions）

```yaml
- name: Headless Vue diagnostics
  run: |
    ./debug_vue_mounting.sh --assert
- name: Upload artifacts
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: vue-diagnostics
    path: |
      /tmp/vue_debug_screenshot.png
      /tmp/qapps_dom.html
      /tmp/moqui_plugin_*.json
```

## 后续扩展
- 为 `debug_vue_mounting.sh` 增加 `--timeout` 参数，避免 CI 阻塞（可使用 `timeout` 命令包装）。
- 将脚本接入阶段 1 验证 checklist 的自动生成报告。
- 若需更多交互测试，可在后续阶段引入 Playwright/Chromium 脚本复用 JWT 注入逻辑。
