# Moqui Framework Development Guide - Claude AI Reference

## 🔐 Critical Authentication Patterns

### Service vs REST API Authentication Attributes

**IMPORTANT**: Services and REST APIs use different authentication attributes in Moqui Framework.

#### For Services (`service` elements)
- ✅ **Correct**: `authenticate="false"` - Service does not require authentication
- ❌ **Incorrect**: `require-authentication="false"` - This will cause "User must be logged in to call service" errors

```xml
<!-- CORRECT Service Authentication -->
<service verb="process" noun="AllMatching" authenticate="false" allow-remote="true">
    <description>Service accessible without authentication</description>
</service>
```

#### For REST APIs and Screens (`screen` elements)
- ✅ **Correct**: `require-authentication="false"` - Screen/API does not require authentication
- ❌ **Incorrect**: `authenticate="false"` - Not valid for screens

```xml
<!-- CORRECT Screen Authentication -->
<screen require-authentication="false">
    <widgets>
        <!-- Screen content -->
    </widgets>
</screen>
```

### Reference Implementation
This pattern was discovered when fixing moqui-marketplace authentication issues. The moqui-minio component uses the correct `authenticate="true"` pattern for services that require authentication.

---

## 🚨 Moqui首页修改高风险警告

### ⚠️ 关键发现：系统性风险

**重要发现**: 在实际开发过程中发现，**基本铁定每次修改都会导致首页的样式不对，或者链接丢失，或者应用列表丢失**。

这是一个需要**高度重视**的系统性问题，必须建立强制验证机制。

### 📍 高风险操作类型

1. **AppList.xml修改** - 应用列表渲染核心文件
2. **WebrootVue.qvt.js修改** - Vue.js渲染引擎修改
3. **CSP配置修改** - 内容安全策略调整
4. **路径配置修改** - 任何涉及`/apps/`或`/qapps/`的变更
5. **组件配置修改** - subscreens或menu-image配置

### 🛡️ 强制验证协议

**任何涉及首页的修改都必须执行**：

#### 1. 修改前基线验证
```bash
# 获取基线截图
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" \
     -c /tmp/baseline_session.txt -L > /dev/null

JSESSIONID=$(grep JSESSIONID /tmp/baseline_session.txt | cut -f7)

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu \
    --screenshot=/tmp/baseline_homepage.png \
    --window-size=1920,1080 \
    --cookie="JSESSIONID=$JSESSIONID" \
    --virtual-time-budget=8000 \
    "http://localhost:8080/qapps"

echo "✅ 基线截图: /tmp/baseline_homepage.png"
```

#### 2. 修改后立即验证
```bash
# 修改后强制验证
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" \
     -c /tmp/modified_session.txt -L > /dev/null

JSESSIONID=$(grep JSESSIONID /tmp/modified_session.txt | cut -f7)

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu \
    --screenshot=/tmp/modified_homepage.png \
    --window-size=1920,1080 \
    --cookie="JSESSIONID=$JSESSIONID" \
    --virtual-time-budget=8000 \
    "http://localhost:8080/qapps"

echo "📸 修改后截图: /tmp/modified_homepage.png"
echo "⚠️  必须手动对比截图确认首页完整性"
```

#### 3. 问题检测与快速回滚
```bash
# 应用链接完整性测试
for app in "marketplace/Dashboard" "system/dashboard" "tools/dashboard"; do
    STATUS=$(curl -s -b /tmp/modified_session.txt "http://localhost:8080/qapps/$app" -w "%{http_code}" -o /dev/null)
    if [ "$STATUS" != "200" ]; then
        echo "❌ 检测到问题，建议立即回滚"
        break
    fi
done
```

### 📋 首页修改检查清单

✅ **修改前必须步骤**
- [ ] 获取当前首页基线截图
- [ ] 备份即将修改的文件
- [ ] 记录当前可用应用列表

✅ **修改后必须验证**
- [ ] Chrome MCP截图对比
- [ ] 应用列表完整性检查
- [ ] 所有应用链接可访问性测试
- [ ] 页面样式完整性确认
- [ ] **发现问题立即回滚**

### 📈 历史问题记录

**2025-10-10**: AppList.xml路径修改导致样式错乱
- **修改内容**: 将应用链接从`/apps/`改为`/qapps/`
- **问题现象**: 修改后样式错乱
- **教训**: 即使看似简单的路径修改也会引发级联问题

**核心原则**: 高度谨慎，强制验证，快速回滚

**详细指南**: [Chrome MCP调试闭环实战指南 - Moqui首页修改风险警告章节](runtime/docs/Chrome-MCP调试闭环实战指南.md#-moqui首页修改风险警告)

---

## 🔍 Chrome MCP调试闭环 - 关键模式

### 🚀 重大突破：Chrome MCP认证代理解决方案

**Chrome headless认证限制问题已彻底解决**！经过深入调试发现Chrome headless模式与Moqui认证系统存在根本性兼容问题，现已通过认证代理方案完美解决。

#### 问题背景
- **curl + JSESSIONID**: ✅ 完整应用列表 (21KB)
- **Chrome + 相同JSESSIONID**: ❌ 登录页面 (9KB)
- **所有Chrome认证方法失败**: cookie、header、localStorage等

#### 🔧 Chrome MCP认证代理 - 终极解决方案

**核心思路**: 绕过Chrome headless认证限制，使用curl获取认证内容，Chrome渲染本地文件。

```bash
# 标准Chrome MCP认证代理调用
/tmp/chrome_mcp_auth_proxy.sh

# 结果验证
open /tmp/moqui_verified.png
```

#### 突破性成果
✅ **完整应用列表显示**: 智能供需平台、项目管理、对象存储等
✅ **Vue.js组件完全加载**: 导航栏、用户菜单、通知等全部正常
✅ **高质量截图输出**: 58KB完整页面截图
✅ **彻底解决认证问题**: Chrome MCP现在可以完美验证Moqui动态页面

**详细技术方案**: [Chrome MCP调试闭环实战指南 - Chrome MCP认证代理章节](runtime/docs/Chrome-MCP调试闭环实战指南.md#-重大突破chrome-mcp认证代理解决方案)

### 核心原则：简明有效的动态页面验证

**重要**: Moqui采用动态渲染，curl测试无法验证前端JavaScript执行。Chrome MCP认证代理是验证动态内容的最可靠方法。

#### 标准调试流程（已更新）
```bash
# 推荐方案：使用认证代理
/tmp/chrome_mcp_auth_proxy.sh

# 传统方案：仅API验证
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" -c /tmp/s.txt -L > /dev/null
JSESSIONID=$(grep JSESSIONID /tmp/s.txt | cut -f7)
curl -s -b /tmp/s.txt "http://localhost:8080/qapps" -w "%{http_code}"
```

#### 关键要点
- ✅ **认证代理**: Chrome MCP认证问题的终极解决方案
- ✅ **时间预算**: 使用`--virtual-time-budget=5000`确保JavaScript执行完成
- ✅ **截图验证**: 通过截图确认页面实际渲染效果
- ✅ **本地文件访问**: 绕过Chrome headless认证限制的核心技术

#### 典型问题诊断
1. **Chrome显示登录界面**: 使用认证代理解决Chrome headless认证限制
2. **截图空白**: JavaScript加载时间不足，增加virtual-time-budget
3. **应用列表为空**: 检查组件menu-image配置或使用认证代理获取完整内容

---

## 🛠️ Template Error Fixes

### FormConfigUser Permission Errors
**Problem**: Template errors with `formListInfo`, `formNode`, etc. when using `form-list` components.

**Solution**: Replace `form-list` with HTML table + `section-iterate` structures:

```xml
<!-- BEFORE: Causes FormConfigUser errors -->
<form-list name="RecentDemandsList" list="recentDemands">
    <field name="productName"><default-field><display/></default-field></field>
</form-list>

<!-- AFTER: Works without permission issues -->
<container style="table table-striped">
    <section-iterate name="DemandsIterate" list="recentDemands" entry="demand">
        <widgets>
            <container style="tr">
                <container style="td"><label text="${demand.productName ?: '暂无数据'}"/></container>
            </container>
        </widgets>
    </section-iterate>
</container>
```

---

## 🗺️ Critical Routing Configuration Issues

### Missing default-item in Screen Subscreens

**Problem**: Screen paths not displaying expected content when accessed directly.

**Root Cause**: Screen definitions lacking `default-item` attribute in `<subscreens>` configuration, causing empty or incorrect page loads.

**Critical Example - qapps.xml Route Fix**:
```xml
<!-- BEFORE: Missing default-item causes empty page load -->
<subscreens>
    <subscreens-item name="tools" location="component://tools/screen/Tools.xml"/>
    <subscreens-item name="marketplace" location="component://moqui-marketplace/screen/marketplace.xml"/>
</subscreens>

<!-- AFTER: default-item ensures correct page loads -->
<subscreens default-item="AppList">
    <subscreens-item name="AppList" location="component://webroot/screen/webroot/apps/AppList.xml"/>
    <subscreens-item name="tools" location="component://tools/screen/Tools.xml"/>
    <subscreens-item name="marketplace" location="component://moqui-marketplace/screen/marketplace.xml"/>
</subscreens>
```

**Impact**:
- `/qapps` path now correctly loads Application List instead of empty Vue wrapper
- `/apps` path correctly defaults to marketplace dashboard instead of AppList
- User expectations align with URL behavior

**Investigation Pattern**:
1. Check page title: `curl -s URL | grep -o "<title>.*</title>"`
2. Compare expected vs actual screen content
3. Verify `subscreens` has appropriate `default-item`
4. Ensure referenced screen exists and has correct `menu-include` settings

**Reference Pattern**: This issue occurred multiple times during development. Always verify screen routing configuration when URLs don't load expected content.

### Legacy Screen Architecture Migration

**Problem**: Multiple page style architectures (apps.xml, vapps.xml, qapps.xml) causing maintenance complexity and user experience inconsistency.

**Architecture Analysis**:
- `apps.xml`: Legacy HTML Bootstrap style (`STT_INTERNAL` + `Header.html.ftl`)
- `vapps.xml`: Vue Bootstrap hybrid style (`STT_INTERNAL` + `WebrootVue.vuet.ftl`)
- `qapps.xml`: Modern Vue Quasar style (`STT_INTERNAL_QUASAR` + `WebrootVue.qvt.ftl`)

**Critical Discovery**: Components register subscreens-items to specific page styles via MoquiConf.xml. Simply deleting legacy styles breaks component registration and causes system failures.

**Safe Migration Strategy**:
```xml
<!-- BEFORE: Legacy apps.xml with full implementation -->
<pre-actions><script><![CDATA[
    if (!ec.user.userId) { ec.web.saveScreenLastInfo(null, null); sri.sendRedirectAndStopRender('/Login') }
]]></script></pre-actions>

<!-- AFTER: Legacy apps.xml converted to redirect -->
<pre-actions><script><![CDATA[
    // Legacy apps.xml - redirect to modern qapps.xml for consistent user experience
    sri.sendRedirectAndStopRender('/qapps')
]]></script></pre-actions>
```

**Benefits**:
- Maintains component compatibility (all existing MoquiConf.xml subscreens-items still work)
- Provides consistent modern UI experience (all paths lead to qapps.xml)
- Enables gradual migration (components can be updated to target qapps.xml over time)
- Preserves system stability (no broken registrations or missing functionality)

**Implementation Results**:
- `/apps` → redirects to `/qapps` (showing AppList)
- `/vapps` → redirects to `/qapps` (showing AppList)
- `/qapps` → direct load of AppList with modern Quasar UI
- All component functionality preserved and accessible

---

## 🔄 Entity Authorization Bypassing

### Using .disableAuthz() in Groovy Scripts
When performing entity operations in services, use `.disableAuthz()` to bypass authorization checks:

```groovy
// Correct pattern for entity queries in services
def supplyListings = ec.entity.find("marketplace.SupplyListing")
    .condition("status", "ACTIVE")
    .disableAuthz()  // Bypass authorization
    .list()

// Correct pattern for entity creation
ec.entity.makeValue("marketplace.SupplyListing")
    .setFields([...], true, null, false)
    .setSequencedIdPrimary()
    .createOrUpdate()
```

---

## 📊 Smart Matching Algorithm Implementation

### Intelligent Scoring System
Implemented in `marketplace.process#AllMatching` service:

- **Product Name Matching (40%)**: Exact match, contains check, word matching
- **Category Matching (30%)**: Exact category or category contains logic
- **Price Matching (20%)**: Supply price vs demand budget compatibility
- **Quantity Matching (10%)**: Supply quantity vs demand quantity needed

```groovy
def calculateMatchScore(supply, demand) {
    def score = 0.0

    // Product name matching (40%)
    if (supply.productName && demand.productName) {
        def supplyName = supply.productName.toLowerCase()
        def demandName = demand.productName.toLowerCase()
        if (supplyName.contains(demandName) || demandName.contains(supplyName)) {
            score += 0.4
        }
    }

    // Category matching (30%)
    if (supply.category && demand.category) {
        if (supply.category.toLowerCase() == demand.category.toLowerCase()) {
            score += 0.3
        }
    }

    // Price matching (20%)
    if (supply.price && demand.budgetMax) {
        def priceRatio = supply.price / demand.budgetMax
        if (priceRatio <= 1.0) {
            score += 0.2 * (1.0 - Math.abs(priceRatio - 0.8))
        }
    }

    // Quantity matching (10%)
    // Implementation details...

    return Math.max(0.0, Math.min(1.0, score))
}
```

---

## 📁 Component Structure

### Marketplace Component File Organization
```
runtime/component/moqui-marketplace/
├── service/
│   ├── marketplace.xml                 # Main services (statistics, matching, demo data)
│   └── marketplace/
│       └── SupplyDemandServices.xml   # CRUD services for supply/demand
├── screen/
│   ├── marketplace.xml                 # Main navigation screen
│   └── marketplace/
│       ├── Dashboard.xml               # Dashboard with statistics
│       ├── Matching.xml                # Smart matching interface
│       ├── Demand.xml                  # Demand management
│       └── TestDataInit.xml           # Data management & testing
├── data/
│   └── MarketplaceSecurityData.xml    # Security configurations
└── entity/
    └── MarketplaceEntities.xml        # Entity definitions
```

---

## 🧪 Testing Commands

### Initialize Demo Data
```bash
# Access data management interface
curl "http://localhost:8080/apps/marketplace/TestDataInit"

# Initialize demo data via service call
curl -X POST "http://localhost:8080/rest/s1/marketplace/initialize/DemoData" \
     -H "Content-Type: application/json" \
     -d '{"reset": true}'
```

### Run Smart Matching
```bash
# Run intelligent matching algorithm
curl -X POST "http://localhost:8080/rest/s1/marketplace/process/AllMatching" \
     -H "Content-Type: application/json" \
     -d '{"minScore": 0.6, "maxResults": 50}'
```

---

## ⚠️ Common Issues & Solutions

### 1. Service Not Found Errors
- Ensure service name matches exactly: `marketplace.process#AllMatching`
- Check service file is properly included in component

### 2. Authorization Errors
- Use `authenticate="false"` for services, not `require-authentication="false"`
- Add `.disableAuthz()` to entity operations in Groovy scripts
- Verify security configuration in MarketplaceSecurityData.xml

### 3. Template Rendering Errors
- Replace `form-list` components with HTML table + `section-iterate`
- Add fallback values using `${field ?: 'default'}` syntax
- Wrap entity queries in try-catch blocks

---

## 📋 Development Checklist

- [ ] Service authentication: Use `authenticate="false"` for public services
- [ ] Entity operations: Add `.disableAuthz()` to bypass permissions
- [ ] Template rendering: Avoid `form-list`, use `section-iterate` instead
- [ ] Error handling: Add try-catch blocks around entity operations
- [ ] Security configuration: Update MarketplaceSecurityData.xml for new services
- [ ] Testing: Use TestDataInit interface for development testing

---

## 🔧 Frontend JavaScript & CSP Troubleshooting

### JavaScript Execution Issues After Login

**Problem**: After successful login, navigation menus and user interface elements don't display correctly.

**Root Cause Analysis Process**:
1. **Initial Symptoms**: Vue.js components not initializing, empty navigation areas
2. **JavaScript Console Check**: Dependencies (Vue, moqui, Quasar) showing as undefined
3. **Network Analysis**: JavaScript files loading but not executing
4. **CSP Investigation**: Content Security Policy blocking script execution

**Solution**: Content Security Policy (CSP) Configuration

The default Moqui CSP configuration is too restrictive for JavaScript frameworks:
```xml
<!-- RESTRICTIVE (Blocks JavaScript) -->
<response-header type="screen-render" name="Content-Security-Policy"
                value="frame-ancestors 'none'; form-action 'self';"/>
```

**Fix in MoquiDevConf.xml**:
```xml
<webapp-list>
    <webapp name="webroot">
        <!-- Development Mode: More permissive CSP to allow JavaScript execution -->
        <response-header type="screen-render" name="Content-Security-Policy"
                       value="frame-ancestors 'none'; form-action 'self'; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;"/>
    </webapp>
</webapp-list>
```

**Key CSP Directives**:
- `'unsafe-inline'`: Allows inline JavaScript (required for Vue.js)
- `'unsafe-eval'`: Allows eval() function (required for template compilation)
- `https://cdnjs.cloudflare.com`: Allows external CDN resources

---

## 🗺️ Navigation & Routing Issues

### Missing /apps Route Handler

**Problem**: Frontend making requests to `/apps/getAppNavMenu` and `/apps/menuData` returning 404 errors.

**Error Logs**:
```
WARN  .webapp.MoquiServlet Web Resource Not Found: Could not find subscreen or transition or file/content [getAppNavMenu] under screen [component://webroot/screen/webroot.xml] while finding url for path [apps, getAppNavMenu]
```

**Root Cause**: Missing screen configuration for `/apps` path routing.

**Solution**: Create missing screen definitions and routing configuration.

**1. Add apps subscreens-item to webroot.xml**:
```xml
<screen location="component://webroot/screen/webroot.xml">
    <subscreens-item name="apps" location="component://webroot/screen/webroot/apps.xml"/>
    <subscreens-item name="qapps" location="component://webroot/screen/webroot/qapps.xml"/>
    <!-- other items -->
</screen>
```

**2. Create apps.xml screen definition** (if missing):
```xml
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/screen-3.xsd"
        require-authentication="false" allow-extra-path="true" include-child-content="true">

    <always-actions>
        <set field="appHeader" value="Moqui Applications"/>
    </always-actions>

    <transition name="getAppNavMenu" read-only="true">
        <actions>
            <!-- Navigation menu logic -->
        </actions>
    </transition>

    <subscreens default-item="dashboard">
        <subscreens-item name="tools" menu-title="Tools" menu-index="1"
                        location="component://tools/screen/Tools.xml"/>
        <subscreens-item name="simple" menu-title="SimpleScreens" menu-index="2"
                        location="component://SimpleScreens/screen/SimpleScreens.xml"/>
    </subscreens>
</screen>
```

**Verification**: Check that requests to `/apps/getAppNavMenu` return 401 (auth required) instead of 404 (not found).

---

## 🔍 Debugging Methodology

### Systematic Frontend Debugging Process

1. **JavaScript Execution Check**:
   ```javascript
   // Browser console verification
   console.log("Vue:", typeof Vue);
   console.log("moqui:", typeof moqui);
   console.log("Quasar:", typeof Quasar);
   ```

2. **Network Request Analysis**:
   - Check Developer Tools → Network tab for failed requests
   - Look for 404 errors on navigation endpoints
   - Verify CSP violations in Security tab

3. **Log File Analysis**:
   ```bash
   # Monitor real-time logs
   tail -f /Users/demo/Workspace/moqui/runtime/log/moqui.log

   # Filter for specific errors
   grep "Web Resource Not Found" /Users/demo/Workspace/moqui/runtime/log/moqui.log
   ```

4. **Configuration Verification**:
   - Check `MoquiActualConf.xml` for final merged configuration
   - Verify CSP headers in browser Developer Tools → Security

### Common Error Patterns & Solutions

| Error Pattern | Root Cause | Solution |
|---------------|------------|----------|
| `Vue is not defined` | CSP blocking scripts | Add script-src to CSP |
| `Web Resource Not Found: [path]` | Missing screen definition | Create screen file & routing |
| `Cannot set preference...no user logged in` | Session/auth issues | Check login state & tokens |
| JavaScript loads but doesn't execute | CSP restrictions | Allow 'unsafe-inline' & 'unsafe-eval' |

---

*Last updated: October 2025 - CSP and Navigation Routing Troubleshooting Session*