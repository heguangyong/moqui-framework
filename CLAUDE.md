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

*Last updated: Based on moqui-marketplace development session - Critical authentication attribute discovery*