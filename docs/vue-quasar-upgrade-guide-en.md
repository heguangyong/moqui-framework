# Moqui Frontend Upgrade Guide: Vue 2.x + Quasar 1.x → Vue 3.x + Quasar 2.x

## 📋 Upgrade Overview

This guide provides detailed instructions for upgrading Moqui Framework frontend from Vue 2.x + Quasar 1.x to Vue 3.x + Quasar 2.x, based on real production environment experience.

### 🎯 Upgrade Goals
- **From**: Vue 2.7.14 + Quasar 1.22.10
- **To**: Vue 3.5.22 + Quasar 2.18.5
- **Principle**: Gradual upgrade, maintain system stability, avoid breaking changes

---

## 🚀 Quick Start Guide

### Phase 1: System Analysis
```bash
# Check current Vue version
curl -s "http://localhost:8080/libs/vue/vue.js" | head -c 200

# Check current Quasar version
curl -s "http://localhost:8080/libs/quasar/quasar.umd.min.js" | head -c 200

# Test baseline functionality
curl -s -b session.txt "http://localhost:8080/qapps" | grep "Choose"
```

### Phase 2: Library Upgrades

**Step 1**: Download Vue 3.x
```bash
# Development version
curl -o libs/vue/vue3.js \
     "https://unpkg.com/vue@3.5.22/dist/vue.global.js"

# Production version
curl -o libs/vue/vue3.min.js \
     "https://unpkg.com/vue@3.5.22/dist/vue.global.prod.js"
```

**Step 2**: Create Vue 3.x Compatibility Adapter
Create `/js/Vue3CompatibilityAdapter.js` with Vue 2.x compatible interface.

**Step 3**: Download Quasar 2.x
```bash
# CSS
curl -o libs/quasar/quasar2.min.css \
     "https://cdn.jsdelivr.net/npm/quasar@2.18.5/dist/quasar.prod.css"

# JavaScript
curl -o libs/quasar/quasar2.umd.min.js \
     "https://cdn.jsdelivr.net/npm/quasar@2.18.5/dist/quasar.umd.prod.js"
```

### Phase 3: Configuration Updates

Update `qapps.xml` script references:
```xml
<script><![CDATA[
if (!instancePurpose || instancePurpose == 'production') {
    footer_scripts.add('/libs/vue/vue3.min.js')
    footer_scripts.add('/js/Vue3CompatibilityAdapter.js')
    footer_scripts.add("/libs/quasar/quasar2.umd.min.js")
} else {
    footer_scripts.add('/libs/vue/vue3.js')
    footer_scripts.add('/js/Vue3CompatibilityAdapter.js')
    footer_scripts.add("/libs/quasar/quasar2.umd.js")
}
]]></script>
```

### Phase 4: Critical Bug Fixes

Add click event handling fix to `WebrootVue.qvt.js`:
```javascript
// Fix for unresponsive sidebar and app list clicks
setTimeout(function() {
    if (moqui && moqui.webrootVue) {
        // Fix HTML mode app links
        var appLinks = document.querySelectorAll("a.app-list-link");
        appLinks.forEach(function(link) {
            link.addEventListener("click", function(e) {
                if (moqui.webrootVue && moqui.webrootVue.setUrl) {
                    e.preventDefault();
                    moqui.webrootVue.setUrl(link.pathname + link.search);
                }
            });
        });

        // Ensure toggleLeftOpen is globally accessible
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

## ✅ Testing Checklist

**Basic Functionality**:
- [ ] Page loads without errors
- [ ] Sidebar toggle works
- [ ] App list buttons are clickable
- [ ] Navigation functions properly
- [ ] User menu works correctly

**Browser Console Tests**:
```javascript
// Check Vue version
console.log("Vue version:", Vue.version);

// Check Vue instance
console.log("Vue instance:", moqui.webrootVue);

// Check Quasar
console.log("Quasar available:", typeof Quasar);
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Blank Page or Loading Errors
**Solution**: Check browser console for JavaScript errors, verify library loading order.

### Issue 2: Clicks Don't Work
**Solution**: Ensure Vue instance is properly mounted and event handlers are bound.

### Issue 3: Styling Issues
**Solution**: Verify Quasar CSS is loaded correctly and component registration is successful.

---

## 📚 Best Practices

### ✅ Do's
- Use gradual upgrade approach
- Test each phase thoroughly
- Keep compatibility layer
- Maintain single version strategy

### ❌ Don'ts
- Don't upgrade multiple libraries simultaneously
- Don't create multiple UI styles
- Don't skip testing steps
- Don't modify core rendering logic

---

## 📖 Resources

- [Complete Chinese Guide](Vue-Quasar升级指导.md) - Detailed documentation in Chinese
- [Vue 3.x Migration Guide](https://v3-migration.vuejs.org/)
- [Quasar 2.x Documentation](https://quasar.dev/)
- [Moqui Framework Docs](https://www.moqui.org/docs/)

---

*Document Version: v1.0*
*Last Updated: October 2025*
*Compatible with: Moqui Framework 3.1.0+*