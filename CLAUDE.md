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