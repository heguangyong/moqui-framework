# Moqui框架前端升级指导：Vue 2.x + Quasar 1.x → Vue 3.x + Quasar 2.x

## 📋 升级概览

本文档提供了将Moqui框架前端从Vue 2.x + Quasar 1.x升级到Vue 3.x + Quasar 2.x的详细指导，基于实际生产环境升级经验总结。

### 🎯 升级目标
- **起点**: Vue 2.7.14 + Quasar 1.22.10
- **终点**: Vue 3.5.22 + Quasar 2.18.5
- **原则**: 渐进式升级，保持系统稳定性，避免破坏性变更

### ⚠️ 重要前提
- **单一版本策略**: 升级过程中保持单一版本，避免多套UI风格并存
- **渐进式方法**: 分阶段执行，每个阶段都要确保系统可用
- **兼容性优先**: 优先保证现有功能正常工作

---

## 🔍 Phase 1: 系统现状分析

### 1.1 确认当前技术栈

```bash
# 检查Vue版本
curl -s "http://localhost:8080/libs/vue/vue.js" | head -c 200
# 应该显示: Vue.js v2.7.14

# 检查Quasar版本
curl -s "http://localhost:8080/libs/quasar/quasar.umd.min.js" | head -c 200
# 应该显示: Quasar Framework v1.22.10

# 检查页面模板模式
curl -s -b session.txt "http://localhost:8080/qapps" | grep -E "render-mode|STT_"
```

### 1.2 识别关键文件

**核心配置文件**:
- `qapps.xml` - 页面样式和脚本加载配置
- `WebrootVue.qvt.js` - Vue实例和组件定义
- `AppList.xml` - 应用列表渲染模板

**检查当前render-mode**:
```xml
<!-- 在AppList.xml中检查 -->
<render-mode>
    <text type="html"><!-- HTML Bootstrap模式 --></text>
    <text type="vuet"><!-- Vue Bootstrap混合模式 --></text>
    <text type="qvt"><!-- Vue Quasar模式 --></text>
</render-mode>
```

### 1.3 功能测试基线

升级前必须建立功能测试基线：

```bash
# 1. 登录测试
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" -c baseline_session.txt

# 2. 页面访问测试
curl -s -b baseline_session.txt "http://localhost:8080/qapps" | grep "选择应用"

# 3. 应用导航测试
curl -s -b baseline_session.txt "http://localhost:8080/qapps/marketplace/Dashboard" -w "%{http_code}"

# 4. 截图基线
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome \
    --headless --screenshot=/tmp/baseline.png "http://localhost:8080/qapps"
```

---

## 🚀 Phase 2: 库文件升级

### 2.1 Vue.js升级

**步骤1**: 下载Vue 3.x文件
```bash
# 开发版本
curl -o base-component/webroot/screen/webroot/libs/vue/vue3.js \
     "https://unpkg.com/vue@3.5.22/dist/vue.global.js"

# 生产版本
curl -o base-component/webroot/screen/webroot/libs/vue/vue3.min.js \
     "https://unpkg.com/vue@3.5.22/dist/vue.global.prod.js"
```

**步骤2**: 创建Vue 3.x兼容性适配器

```javascript
// 文件: /js/Vue3CompatibilityAdapter.js
console.log("=== Vue 3.x Compatibility Adapter Loading ===");

// 检测Vue 3.x并创建Vue 2.x兼容接口
if (window.Vue && typeof window.Vue.createApp === 'function') {
    console.log("Vue 3.x detected, applying compatibility layer");

    // Vue 2.x兼容构造函数
    function Vue2Compatible(options) {
        if (!(this instanceof Vue2Compatible)) {
            return new Vue2Compatible(options);
        }

        if (options.el) {
            return createVueApp.call(this, options);
        } else {
            return window.Vue.defineComponent(options);
        }
    }

    // 核心Vue 3.x应用创建函数
    function createVueApp(options) {
        console.log("Creating Vue 3.x app with FreeMarker template hydration...");

        var el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el;

        // 读取DOM配置
        var domConfig = {};
        var confElements = {
            'appHost': document.getElementById('confAppHost'),
            'basePath': document.getElementById('confBasePath'),
            'linkBasePath': document.getElementById('confLinkBasePath'),
            'userId': document.getElementById('confUserId'),
            'leftOpen': document.getElementById('confLeftOpen')
        };

        for (var key in confElements) {
            var element = confElements[key];
            domConfig[key] = element ? element.value : '';
        }
        domConfig.leftOpen = domConfig.leftOpen === 'true';

        // 创建Vue 3.x应用配置
        var appConfig = {
            data: function() {
                return Object.assign({
                    basePath: "", linkBasePath: "", currentPathList: [],
                    navMenuList: [], leftOpen: false, moqui: window.moqui || {}
                }, domConfig);
            },
            methods: options.methods || {},
            computed: options.computed || {},
            mounted: options.mounted
        };

        var app = window.Vue.createApp(appConfig);
        return app.mount(options.el);
    }

    // Vue 2.x兼容方法
    Vue2Compatible.component = function(name, definition) {
        if (window.currentVueApp) {
            window.currentVueApp.component(name, definition);
        } else {
            window.pendingComponents = window.pendingComponents || {};
            window.pendingComponents[name] = definition;
        }
    };

    // 替换全局Vue
    window.Vue = Vue2Compatible;
    console.log("Vue 3.x compatibility layer installed");
}
```

### 2.2 Quasar升级

**步骤1**: 下载Quasar 2.x文件
```bash
# CSS文件
curl -o base-component/webroot/screen/webroot/libs/quasar/quasar2.min.css \
     "https://cdn.jsdelivr.net/npm/quasar@2.18.5/dist/quasar.prod.css"

# JavaScript文件
curl -o base-component/webroot/screen/webroot/libs/quasar/quasar2.umd.min.js \
     "https://cdn.jsdelivr.net/npm/quasar@2.18.5/dist/quasar.umd.prod.js"
```

**步骤2**: 修改qapps.xml脚本引用

```xml
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/screen-3.xsd"
        standalone-theme-type="STT_INTERNAL_QUASAR" require-authentication="true" allow-extra-path="true">

    <always-actions>
        <script><![CDATA[
        String instancePurpose = System.getProperty("instance_purpose")
        if (!instancePurpose || instancePurpose == 'production') {
            /* ========== Production Mode ========== */
            html_scripts.add('/js/MoquiLib.min.js')
            // Vue 3.x
            footer_scripts.add('/libs/vue/vue3.min.js')
            // Vue 3.x Compatibility Adapter
            footer_scripts.add('/js/Vue3CompatibilityAdapter.js')
            // Quasar 2.x
            footer_scripts.add("/libs/quasar/quasar2.umd.min.js")
            footer_scripts.add('/js/WebrootVue.qvt.min.js')
        } else {
            /* ========== Dev Mode ========== */
            html_scripts.add('/js/MoquiLib.js')
            // Vue 3.x
            footer_scripts.add('/libs/vue/vue3.js')
            // Vue 3.x Compatibility Adapter
            footer_scripts.add('/js/Vue3CompatibilityAdapter.js')
            // Quasar 2.x
            footer_scripts.add("/libs/quasar/quasar2.umd.js")
            footer_scripts.add('/js/WebrootVue.qvt.js')
        }
        ]]></script>
    </always-actions>
</screen>
```

---

## 🔧 Phase 3: 兼容性修复

### 3.1 Quasar组件兼容性

**问题**: Quasar 1.x到2.x的组件注册方式变化

**解决方案**: 在Vue3CompatibilityAdapter.js中添加Quasar兼容处理

```javascript
// Quasar 2.x注册处理
if (window.Quasar) {
    console.log("Registering Quasar 2.x with Vue 3.x app...");

    if (typeof window.Quasar.install === 'function') {
        app.use(window.Quasar);
        console.log("✅ Quasar 2.x registered successfully");
    } else {
        // Fallback for compatibility
        app.config.globalProperties.$q = window.Quasar;
        console.log("✅ Quasar available as $q globally");
    }
}
```

### 3.2 路由系统兼容性

**问题**: Vue 3.x的路由处理与Vue 2.x不同

**解决方案**: 保持现有的moqui.webrootRouter系统

```javascript
// 在WebrootVue.qvt.js中确保路由兼容
Object.defineProperty(Vue.prototype, '$router', {
    get: function get() { return moqui.webrootRouter; }
});

Object.defineProperty(Vue.prototype, '$route', {
    get: function get() { return moqui.webrootVue ? moqui.webrootVue.getRoute() : {}; }
});
```

### 3.3 点击事件处理修复

**问题**: 升级后侧边栏和应用列表点击无反应

**根因**: Vue实例挂载和事件绑定时序问题

**解决方案**: 在WebrootVue.qvt.js末尾添加事件修复代码

```javascript
// CRITICAL FIX: 确保点击处理器正常工作
setTimeout(function() {
    console.log("=== Vue实例和点击处理验证 ===");

    if (moqui && moqui.webrootVue) {
        // 修复HTML模式应用链接
        var appLinks = document.querySelectorAll("a.app-list-link");
        if (appLinks.length > 0) {
            console.log("🔧 Adding click handlers to app links...");
            appLinks.forEach(function(link) {
                link.addEventListener("click", function(e) {
                    if (moqui.webrootVue && moqui.webrootVue.setUrl && link.href.includes("/apps/")) {
                        e.preventDefault();
                        var path = link.pathname + link.search;
                        moqui.webrootVue.setUrl(path);
                    }
                });
            });
        }

        // 确保toggleLeftOpen全局可访问
        if (!window.toggleLeftOpen) {
            window.toggleLeftOpen = function() {
                if (moqui.webrootVue && moqui.webrootVue.toggleLeftOpen) {
                    moqui.webrootVue.toggleLeftOpen();
                }
            };
        }
    }
}, 1000);
```

---

## 🧪 Phase 4: 测试与验证

### 4.1 功能测试清单

**基础功能测试**:
```bash
# 1. 页面加载测试
curl -s -b session.txt "http://localhost:8080/qapps" | grep "选择应用" | wc -l
# 预期输出: 1

# 2. Vue版本确认
curl -s "http://localhost:8080/libs/vue/vue3.js" | grep "Vue.js v3"

# 3. Quasar版本确认
curl -s "http://localhost:8080/libs/quasar/quasar2.umd.js" | grep "Quasar v2"
```

**UI交互测试**:
- [ ] 侧边栏开关正常工作
- [ ] 应用列表按钮可以点击
- [ ] 页面导航功能正常
- [ ] 用户菜单功能正常
- [ ] 通知系统正常工作

**视觉对比测试**:
```bash
# 升级后截图
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome \
    --headless --screenshot=/tmp/after_upgrade.png "http://localhost:8080/qapps"

# 对比升级前后差异
open /tmp/baseline.png
open /tmp/after_upgrade.png
```

### 4.2 问题排查

**常见问题1**: Vue实例未正确创建
```javascript
// 检查方法
console.log("Vue version:", Vue.version);
console.log("Vue instance:", moqui.webrootVue);
```

**常见问题2**: Quasar组件未注册
```javascript
// 检查方法
console.log("Quasar available:", typeof Quasar);
console.log("$q available:", typeof this.$q);
```

**常见问题3**: 点击事件不响应
```javascript
// 检查方法
console.log("Click handlers:", document.querySelectorAll('a.app-list-link').length);
console.log("toggleLeftOpen:", typeof window.toggleLeftOpen);
```

---

## 📚 Phase 5: 最佳实践与注意事项

### 5.1 升级原则

1. **渐进式升级**: 分阶段进行，每个阶段验证无误后再继续
2. **兼容性优先**: 优先保证现有功能正常，再考虑新特性
3. **测试充分**: 每次修改都要进行完整的功能测试
4. **回退准备**: 准备好快速回退方案

### 5.2 避免的陷阱

❌ **错误做法**:
- 同时升级多个库版本
- 创建多套UI风格并存
- 跳过中间测试步骤
- 修改核心渲染逻辑

✅ **正确做法**:
- 保持单一版本策略
- 使用兼容性适配器
- 分步骤验证功能
- 保持现有架构稳定

### 5.3 性能优化建议

**生产环境配置**:
```xml
<!-- 使用压缩版本 -->
<script>
footer_scripts.add('/libs/vue/vue3.min.js')
footer_scripts.add('/libs/quasar/quasar2.umd.min.js')
footer_scripts.add('/js/Vue3CompatibilityAdapter.min.js')
</script>
```

**开发环境配置**:
```xml
<!-- 使用开发版本便于调试 -->
<script>
footer_scripts.add('/libs/vue/vue3.js')
footer_scripts.add('/libs/quasar/quasar2.umd.js')
footer_scripts.add('/js/Vue3CompatibilityAdapter.js')
</script>
```

---

## 🔄 Phase 6: 升级后维护

### 6.1 监控要点

**性能监控**:
- 页面加载速度
- JavaScript执行时间
- 内存使用情况

**功能监控**:
- 用户交互响应性
- 页面导航准确性
- 组件渲染正确性

### 6.2 后续升级规划

**短期目标**:
- 稳定运行现有系统
- 收集用户反馈
- 修复发现的问题

**中长期目标**:
- 利用Vue 3.x新特性
- 升级到Quasar 2.x新组件
- 优化整体架构

---

## 📖 附录

### A.1 版本兼容性对照表

| 组件 | 升级前版本 | 升级后版本 | 兼容性 |
|------|------------|------------|---------|
| Vue.js | 2.7.14 | 3.5.22 | ✅ 通过适配器兼容 |
| Quasar | 1.22.10 | 2.18.5 | ✅ 通过手动注册兼容 |
| Vue Router | 集成在moqui | 保持现有 | ✅ 完全兼容 |

### A.2 故障排除指南

**问题**: 页面空白或加载错误
```bash
# 检查步骤
1. 查看浏览器控制台错误
2. 检查网络请求是否正常
3. 验证JavaScript文件是否正确加载
4. 确认Vue实例是否创建成功
```

**问题**: 点击无反应
```bash
# 检查步骤
1. 确认事件绑定是否成功
2. 检查Vue实例方法是否存在
3. 验证moqui.webrootVue是否初始化
4. 查看控制台是否有JavaScript错误
```

### A.3 相关资源链接

- [Vue 3.x 官方文档](https://vuejs.org/guide/)
- [Quasar 2.x 官方文档](https://quasar.dev/)
- [Moqui Framework 文档](https://www.moqui.org/docs/)
- [Vue 2 to 3 Migration Guide](https://v3-migration.vuejs.org/)

---

*文档版本: v1.0*
*最后更新: 2025年10月*
*适用于: Moqui Framework 3.1.0+*