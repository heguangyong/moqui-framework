# Moqui开发标准

本文档定义了基于Moqui Framework开发的技术标准和最佳实践，确保代码质量和系统稳定性。

## Moqui框架核心标准

### 0. 常见错误模式和避免方法

> **来源**: 整合自 `docs/archive/01-开发指南-Moqui新应用开发最佳实践.md`  
> **整合日期**: 2025-01-14  
> **原文档价值**: 包含智慧蜂巢项目实战经验和详细错误诊断

**原则**: 基于实际开发中遇到的问题，识别和避免常见错误模式。

**适用范围**: 所有Moqui应用开发

**必须避免的错误**:

#### 错误1: 菜单配置错位
**症状**: 应用在 `/qapps` 主页面不显示卡片  
**原因**: 仅在 qapps.xml 配置，忽略 apps.xml  
**解决**: 必须在 apps.xml 和 qapps.xml 两处都配置（详见"1.1 双重菜单配置标准"）

#### 错误2: 认证属性混淆
**症状**: "User must be logged in to call service" 错误  
**原因**: Service 使用 `require-authentication`，Screen 使用 `authenticate`  
**解决**: Service 使用 `authenticate` 属性，Screen 使用 `require-authentication` 属性

#### 错误3: 样式不一致
**症状**: 各页面使用不同的标题级别(h1/h2/h4)和样式  
**原因**: 缺乏统一的样式规范  
**解决**: 统一使用 h5 + 图标 + q-mb-md 样式（详见"5. 屏幕定义标准"）

#### 错误4: 前端验证缺失
**症状**: 代码看起来正确但实际渲染有问题  
**原因**: 仅依赖代码分析，未使用 Chrome MCP 验证实际效果  
**解决**: 每次前端修改后必须执行 Chrome MCP 验证（详见"9. Chrome MCP验证标准"）

#### 错误5: 功能架构混乱
**症状**: 一个应用包含多个不相关的功能模块  
**原因**: 缺乏清晰的功能边界定义  
**解决**: 遵循单一职责原则，每个应用专注一个业务域

**实战案例**: 智慧蜂巢项目最初 marketplace 包含了项目管理、商品管理等不相关功能，后来重构为专注供需撮合的清晰架构。

---

### 1. 认证配置标准

**标准**: 正确使用Moqui Framework的认证属性，避免常见配置错误。

**适用范围**: 所有Service定义和Screen配置

**实施规范**:

#### Service认证配置
```xml
<!-- ✅ 正确：Service使用authenticate属性 -->
<service verb="get" noun="Data" authenticate="false" allow-remote="true">
    <description>无需认证的服务</description>
</service>

<service verb="create" noun="Data" authenticate="true" allow-remote="true">
    <description>需要认证的服务</description>
</service>

<!-- ❌ 错误：Service不能使用require-authentication -->
<service verb="get" noun="Data" require-authentication="false">
    <!-- 这会导致"User must be logged in to call service"错误 -->
</service>
```

#### Screen认证配置
```xml
<!-- ✅ 正确：Screen使用require-authentication属性 -->
<screen require-authentication="false">
    <widgets><!-- Screen内容 --></widgets>
</screen>

<screen require-authentication="true">
    <widgets><!-- 需要认证的Screen内容 --></widgets>
</screen>

<!-- ❌ 错误：Screen不能使用authenticate -->
<screen authenticate="false">
    <!-- 这个属性对Screen无效 -->
</screen>
```

### 1.1 双重菜单配置标准

**标准**: 正确配置Moqui的双重菜单架构，确保应用正确显示。

**适用范围**: 所有应用菜单配置

**实施规范**:

#### 双重注册机制
```xml
<!-- 1. apps.xml注册（控制应用卡片显示） -->
<subscreens default-item="marketplace">
    <subscreens-item name="yourapp" menu-title="应用名称"
                     menu-image="fa fa-icon"
                     location="component://your-app/screen/yourapp.xml"/>
</subscreens>

<!-- 2. qapps.xml注册（现代化路由） -->
<subscreens default-item="AppList">
    <subscreens-item name="yourapp" menu-title="应用名称"
                     location="component://your-app/screen/yourapp.xml"/>
</subscreens>
```

#### 应用内部菜单配置
```xml
<!-- yourapp.xml - 应用主屏幕 -->
<screen default-menu-title="应用名称" default-menu-index="1"
        include-child-content="false" require-authentication="false"
        menu-image="fa fa-icon" menu-image-type="icon">

    <subscreens default-item="Dashboard">
        <subscreens-item name="Dashboard" menu-title="控制台"
                         menu-image="fa fa-tachometer-alt"
                         location="component://your-app/screen/yourapp/Dashboard.xml"/>
        <subscreens-item name="Management" menu-title="管理"
                         menu-image="fa fa-cogs"
                         location="component://your-app/screen/yourapp/Management.xml"/>
    </subscreens>

    <!-- 必须提供menuData transition -->
    <transition name="menuData" read-only="true" begin-transaction="false">
        <actions><script><![CDATA[
            List menuDataList = []
            menuDataList.add([
                title: "控制台",
                url: "/qapps/yourapp/Dashboard",
                image: "fa fa-tachometer-alt",
                imageType: "icon"
            ])
            menuDataList.add([
                title: "管理",
                url: "/qapps/yourapp/Management", 
                image: "fa fa-cogs",
                imageType: "icon"
            ])
            ec.web.sendJsonResponse(menuDataList)
        ]]></script></actions>
        <default-response type="none" save-parameters="true"/>
    </transition>

    <widgets>
        <subscreens-active/>
    </widgets>
</screen>
```

### 2. 菜单配置标准

**标准**: 正确配置Moqui的双重菜单架构，确保应用正确显示。

**适用范围**: 所有应用菜单配置

**实施规范**:

#### 双重注册机制
```xml
<!-- 1. apps.xml注册（控制应用卡片显示） -->
<subscreens default-item="marketplace">
    <subscreens-item name="yourapp" menu-title="应用名称"
                     menu-image="fa fa-icon"
                     location="component://your-app/screen/yourapp.xml"/>
</subscreens>

<!-- 2. qapps.xml注册（现代化路由） -->
<subscreens default-item="AppList">
    <subscreens-item name="yourapp" menu-title="应用名称"
                     location="component://your-app/screen/yourapp.xml"/>
</subscreens>
```

#### 应用内部菜单配置
```xml
<!-- yourapp.xml - 应用主屏幕 -->
<screen default-menu-title="应用名称" default-menu-index="1"
        include-child-content="false" require-authentication="false"
        menu-image="fa fa-icon" menu-image-type="icon">

    <subscreens default-item="Dashboard">
        <subscreens-item name="Dashboard" menu-title="控制台"
                         menu-image="fa fa-tachometer-alt"
                         location="component://your-app/screen/yourapp/Dashboard.xml"/>
        <subscreens-item name="Management" menu-title="管理"
                         menu-image="fa fa-cogs"
                         location="component://your-app/screen/yourapp/Management.xml"/>
    </subscreens>

    <!-- 必须提供menuData transition -->
    <transition name="menuData" read-only="true" begin-transaction="false">
        <actions><script><![CDATA[
            List menuDataList = []
            menuDataList.add([
                title: "控制台",
                url: "/qapps/yourapp/Dashboard",
                image: "fa fa-tachometer-alt",
                imageType: "icon"
            ])
            menuDataList.add([
                title: "管理",
                url: "/qapps/yourapp/Management", 
                image: "fa fa-cogs",
                imageType: "icon"
            ])
            ec.web.sendJsonResponse(menuDataList)
        ]]></script></actions>
        <default-response type="none" save-parameters="true"/>
    </transition>

    <widgets>
        <subscreens-active/>
    </widgets>
</screen>
```

### 3. 实体操作标准

**标准**: 正确使用Entity Engine，避免权限问题。

**适用范围**: 所有数据库操作

**实施规范**:

#### 实体查询标准
```groovy
// ✅ 正确：使用.disableAuthz()绕过权限检查
def dataList = ec.entity.find("YourEntity")
    .condition("status", "ACTIVE")
    .orderBy("createdDate")
    .disableAuthz()  // 重要：绕过权限检查
    .list()

// ✅ 正确：带错误处理的查询
try {
    def result = ec.entity.find("YourEntity")
        .condition("id", entityId)
        .disableAuthz()
        .one()
    
    if (!result) {
        // 处理未找到的情况
        return [success: false, message: "Entity not found"]
    }
    
    return [success: true, data: result]
} catch (Exception e) {
    ec.logger.warn("Query failed: ${e.message}")
    return [success: false, message: "Query failed", error: e.message]
}
```

#### 实体创建和更新标准
```groovy
// ✅ 正确：实体创建
def newEntity = ec.entity.makeValue("YourEntity")
    .setFields([
        name: "Entity Name",
        description: "Description",
        status: "ACTIVE"
    ], true, null, false)
    .setSequencedIdPrimary()
    .create()

// ✅ 正确：实体更新
def existingEntity = ec.entity.find("YourEntity")
    .condition("id", entityId)
    .disableAuthz()
    .one()

if (existingEntity) {
    existingEntity.name = "Updated Name"
    existingEntity.lastUpdated = ec.user.nowTimestamp
    existingEntity.update()
}
```

### 4. 服务定义标准

**标准**: 遵循Moqui服务定义的最佳实践。

**适用范围**: 所有服务定义

**实施规范**:

#### 服务结构标准
```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/service-definition-3.xsd">

    <!-- 获取数据服务 -->
    <service verb="get" noun="EntityData" authenticate="false" allow-remote="true">
        <description>获取实体数据</description>
        <in-parameters>
            <parameter name="entityId" required="false"/>
            <parameter name="status" required="false"/>
        </in-parameters>
        <out-parameters>
            <parameter name="dataList" type="List"/>
            <parameter name="totalCount" type="Integer"/>
            <parameter name="success" type="Boolean"/>
            <parameter name="message" type="String"/>
        </out-parameters>
        <actions>
            <script><![CDATA[
                try {
                    def query = ec.entity.find("YourEntity").disableAuthz()
                    
                    if (entityId) query.condition("entityId", entityId)
                    if (status) query.condition("status", status)
                    
                    dataList = query.orderBy("createdDate").list()
                    totalCount = dataList.size()
                    success = true
                    message = "Data retrieved successfully"
                    
                } catch (Exception e) {
                    ec.logger.warn("Failed to get entity data: ${e.message}")
                    dataList = []
                    totalCount = 0
                    success = false
                    message = "Failed to retrieve data: ${e.message}"
                }
            ]]></script>
        </actions>
    </service>

    <!-- 创建数据服务 -->
    <service verb="create" noun="EntityData" authenticate="true" allow-remote="true">
        <description>创建实体数据</description>
        <in-parameters>
            <parameter name="name" required="true"/>
            <parameter name="description"/>
            <parameter name="status" default-value="ACTIVE"/>
        </in-parameters>
        <out-parameters>
            <parameter name="entityId"/>
            <parameter name="success" type="Boolean"/>
            <parameter name="message" type="String"/>
        </out-parameters>
        <actions>
            <script><![CDATA[
                try {
                    def newEntity = ec.entity.makeValue("YourEntity")
                        .setFields([
                            name: name,
                            description: description,
                            status: status,
                            createdDate: ec.user.nowTimestamp
                        ], true, null, false)
                        .setSequencedIdPrimary()
                        .create()
                    
                    entityId = newEntity.entityId
                    success = true
                    message = "Entity created successfully"
                    
                } catch (Exception e) {
                    ec.logger.error("Failed to create entity: ${e.message}", e)
                    success = false
                    message = "Failed to create entity: ${e.message}"
                }
            ]]></script>
        </actions>
    </service>
</services>
```

### 5. 屏幕定义标准

**标准**: 正确定义Moqui屏幕，避免模板错误。

**适用范围**: 所有屏幕定义

**实施规范**:

#### 避免form-list权限问题
```xml
<!-- ❌ 错误：form-list可能导致FormConfigUser权限错误 -->
<form-list name="DataList" list="dataList">
    <field name="name"><default-field><display/></default-field></field>
</form-list>

<!-- ✅ 正确：使用HTML table + section-iterate -->
<container style="table table-striped">
    <container style="thead">
        <container style="tr">
            <container style="th"><label text="ID"/></container>
            <container style="th"><label text="名称"/></container>
            <container style="th"><label text="状态"/></container>
        </container>
    </container>
    <container style="tbody">
        <section-iterate name="DataIterate" list="dataList" entry="item">
            <widgets>
                <container style="tr">
                    <container style="td"><label text="${item.id ?: '暂无'}"/></container>
                    <container style="td"><label text="${item.name ?: '暂无'}"/></container>
                    <container style="td"><label text="${item.status ?: '未知'}"/></container>
                </container>
            </widgets>
        </section-iterate>
    </container>
</container>
```

#### 统一样式标准
```xml
<!-- ✅ 推荐：统一的页面样式 -->
<widgets>
    <container style="q-pa-md">
        <!-- 页面标题 -->
        <container style="q-mb-md">
            <label text="📊 页面标题" type="h5" style="q-mb-md"/>
            <label text="页面功能描述" style="color: #666; font-size: 14px;"/>
        </container>

        <!-- 功能操作区 -->
        <container style="q-card q-pa-md q-mb-md">
            <label text="🚀 快速操作" type="h5" style="q-mb-md"/>
            <container style="row q-gutter-md">
                <link url="Action1" text="📋 操作一" btn-type="primary" style="col"/>
                <link url="Action2" text="⚙️ 操作二" btn-type="secondary" style="col"/>
            </container>
        </container>

        <!-- 数据展示区 -->
        <container style="q-card q-pa-md">
            <label text="📋 数据列表" type="h5" style="q-mb-md"/>
            <!-- 数据内容 -->
        </container>
    </container>
</widgets>
```

## JWT认证标准

### 6. JWT配置标准

**标准**: 正确配置JWT认证系统。

**适用范围**: 系统认证配置

**实施规范**:

#### MoquiDevConf.xml配置
```xml
<!-- JWT纯认证模式配置 -->
<default-property name="moqui.session.auth.disabled" value="true"/>
<default-property name="moqui.webapp.auth.mode" value="jwt_only"/>
<default-property name="moqui.jwt.force.mode" value="true"/>
<default-property name="moqui.jwt.webapp.auth.enabled" value="true"/>

<!-- JWT密钥配置 -->
<default-property name="moqui.jwt.secret" value="your-secret-key"/>
<default-property name="moqui.jwt.expire.hours" value="24"/>
```

#### JWT验证逻辑
```xml
<!-- qapps.xml中的JWT验证 -->
<if condition="jwtToken">
    <script><![CDATA[
        boolean isValid = org.moqui.jwt.JwtUtil.validateToken(ec, jwtToken)
        if (isValid) {
            Map<String, Object> claims = org.moqui.jwt.JwtUtil.parseClaims(ec, jwtToken)
            String userId = claims.get("sub")
            if (userId) {
                ec.user.loginUser(userId, false)
            }
        }
    ]]></script>
</if>
```

### 7. API端点标准

**标准**: 统一的REST API设计规范。

**适用范围**: 所有REST API设计

**实施规范**:

#### 统一响应格式
```json
{
  "success": true,
  "data": { /* 响应数据 */ },
  "message": "操作成功",
  "errorCode": null,
  "errors": []
}
```

#### Swagger文档生成
```bash
# 生成API文档的标准命令
curl -s "http://localhost:8080/rest/service.swagger/your-component" > swagger.json
```

## 前端集成标准

### 8. Vue3+Quasar2集成标准

**标准**: 正确集成Vue3和Quasar2组件。

**适用范围**: 所有前端开发

**实施规范**:

#### WebrootVue.qvt.js配置
```javascript
// Vue 3 + Quasar runtime配置
if (typeof Quasar !== 'undefined') {
    window.vuePendingPlugins = window.vuePendingPlugins || [];
    window.vuePendingPlugins.push({ 
        plugin: Quasar, 
        options: { config: window.quasarConfig || {} } 
    });
}

const app = Vue.createApp(appConfig);
(window.vuePendingPlugins || []).forEach(entry => 
    app.use(entry.plugin, entry.options)
);
window.vuePendingPlugins = [];
moqui.webrootVue = app.mount('#apps-root');
```

#### CSP配置标准
```xml
<!-- MoquiDevConf.xml中的CSP配置 -->
<webapp name="webroot">
    <response-header type="screen-render" name="Content-Security-Policy"
                   value="frame-ancestors 'none'; form-action 'self'; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;"/>
</webapp>
```

## 调试和验证标准

### 9. Chrome MCP验证标准

**标准**: 强制执行前端修改验证协议。

**适用范围**: 所有前端修改

**实施规范**:

#### 验证流程
```bash
# 1. 修改前基线建立
/tmp/chrome_mcp_auth_proxy.sh
cp /tmp/moqui_verified.png /tmp/baseline_before.png

# 2. 进行代码修改...

# 3. 修改后立即验证
/tmp/chrome_mcp_auth_proxy.sh
echo "对比 /tmp/baseline_before.png 和 /tmp/moqui_verified.png"

# 4. 验证检查清单
# - 布局完整性：元素正确显示和定位
# - 导航功能：链接和按钮可点击且跳转正确  
# - 内容渲染：数据正确加载和显示
# - 响应式设计：不同尺寸下正常显示
```

### 10. 标准调试流程

**标准**: 系统化的问题诊断和调试流程。

**适用范围**: 所有开发调试活动

**实施规范**:

#### API测试标准
```bash
# 1. 检查应用访问性
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" -c /tmp/session.txt -L > /dev/null

curl -s -b /tmp/session.txt "http://localhost:8080/qapps/yourapp" -w "%{http_code}"

# 2. 检查应用列表显示
curl -s -b /tmp/session.txt "http://localhost:8080/qapps" | grep -i "Your App Name"

# 3. 检查菜单数据
curl -s -b /tmp/session.txt "http://localhost:8080/qapps/yourapp/menuData" | jq .
```

## 质量检查清单

### 开发完成验证清单

**架构验证**:
- [ ] apps.xml中正确注册subscreens-item
- [ ] qapps.xml中正确注册subscreens-item  
- [ ] 主屏幕配置default-item和subscreens
- [ ] menuData transition提供完整菜单数据

**认证配置**:
- [ ] Service使用authenticate属性
- [ ] Screen使用require-authentication属性
- [ ] 权限配置文件SecurityData.xml创建

**界面一致性**:
- [ ] 所有页面使用h5 + 图标标题
- [ ] 统一的Quasar 2.x样式规范
- [ ] 容器布局使用q-pa-md、q-mb-md等
- [ ] 按钮使用btn-type和style="col"

**功能验证**:
- [ ] 主应用列表显示应用卡片
- [ ] 二级菜单正确显示和导航
- [ ] 所有页面可正常访问(200状态码)
- [ ] Chrome MCP验证页面渲染正确
- [ ] 数据服务API正常响应

**错误处理**:
- [ ] 服务调用使用try-catch包装
- [ ] 实体查询使用.disableAuthz()
- [ ] 提供fallback默认数据
- [ ] 日志记录关键操作和错误

---

**文档版本**: v1.0  
**最后更新**: 2025年1月13日  
**适用范围**: 所有基于Moqui Framework的开发活动  
**审批状态**: 待审批