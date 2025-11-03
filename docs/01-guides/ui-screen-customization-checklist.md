# UI 层改造复盘与最佳实践

> 适用于自定义 `webroot` / `qapps` 层 XML Screen、Quasar 布局、主题资源等场景，目标是**避免破坏官方结构**、**防止多端样式串扰**、并在上线前尽量降低返工。

## 1. 修改前对齐官方基线

- **始终先对比上游**：`curl https://raw.githubusercontent.com/moqui/moqui-runtime/<tag>/base-component/...` 获取官方版本，清楚差异后再动手。
- **保留动态生成机制**：像 AppList 这类屏幕依赖 `currentScreenDef.getMenuSubscreensItems()` 拉取菜单，如果硬编码列表，很容易在别的页面出现重复块。
- **不要遗漏 render-mode**：QApps 只使用 `type="qvt"`。如果额外输出 HTML/Vuet 片段，就会在其它 UI 风格下显示旧样式。

## 2. 实施过程控制要点

| 风险点 | 建议动作 |
|--------|---------|
| 静态块影响其它页面 | 包装专用样式或条件（如 `body.AppList`），避免全局渲染 |
| 主题页脚/头部残留 | 调整 `ScreenThemeResource` 时允许为空，或者在模板中判断 `has_content()` 再渲染 |
| 多处引用的系统属性 | 统一使用 `ec.entity.conditionFactory` 等官方 API，避免旧版本静态方法失效 |

- **变更小步提交**：分步骤修改 XML、FTL、Groovy，随时验证，防止一次改动影响多个屏幕。
- **记录来源链接**：在 PR/文档里写明参照的 upstream 文件，方便后续升级。

## 3. 修改后的回归检查

1. **入口检验**：`/apps`、`/qapps/AppList` 要能加载应用列表，并与官方配色一致。
2. **任意子页面检查**：进入 `/qapps/marketplace/Dashboard` 等页面确认底部没有残留“选择应用”“切换 UI”之类块。
3. **主题资源验证**：查看浏览器元素面板，确认 `q-footer` 是否被移除或只渲染预期内容。
4. **服务重启测试**：执行 `./gradlew run --no-daemon`，确保日志中没有新的 Screen/Groovy 警告。

## 4. 经验总结

- **正规路径优先**：尽量沿用 Moqui 官方提供的 XML、主题扩展点，不要自造布局。
- **少用静态 HTML**：Quasar 布局推荐通过按钮卡片、`q-btn` 等组件动态渲染，可沿用原始样式参数（如 `outline`、`no-caps`）。
- **文档即时更新**：每次 UI 结构调整都要同步记录（参考 `docs/progress-log.md`），避免团队成员重复踩坑。

保持上述流程，即使未来升级到新的 Quasar 或新增 Apps，也能快速排查、减少返工时间。***
