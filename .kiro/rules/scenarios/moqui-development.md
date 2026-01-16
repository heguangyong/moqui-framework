# Moqui 开发场景

> **用途**: Moqui应用开发的完整工作流程和前提条件  
> **适用**: 所有Moqui应用开发任务

## 🎯 场景概述

开发Moqui应用时，需要遵循标准的开发流程，确保认证配置正确、菜单配置完整、实体操作规范。

## ✅ 前提条件检查

### 1. 环境准备
- [ ] Moqui Framework已安装并运行
- [ ] 开发环境配置完成
- [ ] 数据库连接正常
- [ ] 组件目录结构已创建

### 2. 权限配置
- [ ] 了解Service认证属性 (`authenticate`)
- [ ] 了解Screen认证属性 (`require-authentication`)
- [ ] 了解实体权限绕过 (`.disableAuthz()`)

### 3. 菜单系统
- [ ] 了解双重菜单配置机制 (apps.xml + qapps.xml)
- [ ] 了解menuData transition的作用

## 📋 标准开发流程

### 阶段1: 组件结构创建

```
runtime/component/your-app/
├── component.xml              # 组件定义
├── entity/                    # 实体定义
│   └── YourEntities.xml
├── service/                   # 服务定义
│   └── YourServices.xml
├── screen/                    # 屏幕定义
│   └── yourapp.xml
└── data/                      # 初始数据
    └── SecurityData.xml
```

**执行步骤**:
1. 创建组件目录结构
2. 创建component.xml定义组件
3. 创建基础目录 (entity/, service/, screen/, data/)

### 阶段2: 双重菜单配置

**重要**: 必须同时配置apps.xml和qapps.xml

#### 步骤1: 配置apps.xml
```xml
<!-- runtime/component/webroot/screen/webroot/apps.xml -->
<subscreens default-item="marketplace">
    <subscreens-item name="yourapp" menu-title="应用名称"
                     menu-image="fa fa-icon"
                     location="component://your-app/screen/yourapp.xml"/>
</subscreens>
```

#### 步骤2: 配置qapps.xml
```xml
<!-- runtime/component/webroot/screen/webroot/qapps.xml -->
<subscreens default-item="AppList">
    <subscreens-item name="yourapp" menu-title="应用名称"
                     location="component://your-app/screen/yourapp.xml"/>
</subscreens>
```

#### 步骤3: 创建主屏幕
```xml
<!-- runtime/component/your-app/screen/yourapp.xml -->
<screen default-menu-title="应用名称" default-menu-index="1"
        include-child-content="false" require-authentication="false"
        menu-image="fa fa-icon" menu-image-type="icon">

    <subscreens default-item="Dashboard">
        <subscreens-item name="Dashboard" menu-title="控制台"
                         menu-image="fa fa-tachometer-alt"
                         location="component://your-app/screen/yourapp/Dashboard.xml"/>
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
            ec.web.sendJsonResponse(menuDataList)
        ]]></script></actions>
        <default-response type="none" save-parameters="true"/>
    </transition>

    <widgets>
        <subscreens-active/>
    </widgets>
</screen>
```

### 阶段3: 认证配置

#### Service认证
**规则**: Service使用`authenticate`属性

```xml
<!-- 无需认证的Service -->
<service verb="get" noun="Data" authenticate="false" allow-remote="true">
    <description>获取数据（无需认证）</description>
</service>

<!-- 需要认证的Service -->
<service verb="create" noun="Data" authenticate="true" allow-remote="true">
    <description>创建数据（需要认证）</description>
</service>
```

**参考**: `.kiro/rules/standards/moqui/authentication.md`

#### Screen认证
**规则**: Screen使用`require-authentication`属性

```xml
<!-- 无需认证的Screen -->
<screen require-authentication="false">
    <widgets><!-- 公开页面内容 --></widgets>
</screen>

<!-- 需要认证的Screen -->
<screen require-authentication="true">
    <widgets><!-- 需要认证的页面内容 --></widgets>
</screen>
```

**参考**: `.kiro/rules/standards/moqui/authentication.md`

### 阶段4: 实体操作

**规则**: 所有实体查询必须使用`.disableAuthz()`绕过权限检查

```groovy
// 查询操作
def dataList = ec.entity.find("YourEntity")
    .condition("status", "ACTIVE")
    .disableAuthz()  // 重要！
    .list()

// 创建操作
def newEntity = ec.entity.makeValue("YourEntity")
    .setFields([name: "Name", status: "ACTIVE"], true, null, false)
    .setSequencedIdPrimary()
    .create()

// 更新操作
def existingEntity = ec.entity.find("YourEntity")
    .condition("id", entityId)
    .disableAuthz()
    .one()

if (existingEntity) {
    existingEntity.name = "Updated Name"
    existingEntity.update()
}
```

**参考**: `.kiro/rules/standards/moqui/entity.md`

### 阶段5: 前端验证

**规则**: 每次前端修改后必须执行Chrome MCP验证

```bash
# 1. 修改前基线建立
/tmp/chrome_mcp_auth_proxy.sh
cp /tmp/moqui_verified.png /tmp/baseline_before.png

# 2. 进行代码修改...

# 3. 修改后立即验证
/tmp/chrome_mcp_auth_proxy.sh
echo "对比 /tmp/baseline_before.png 和 /tmp/moqui_verified.png"
```

## ⚠️ 常见错误和解决方案

### 错误1: "User must be logged in to call service"
**原因**: Service使用了错误的认证属性  
**解决**: 使用`authenticate="false"`而不是`require-authentication`

### 错误2: 应用不显示在主菜单
**原因**: 只配置了qapps.xml，忽略了apps.xml  
**解决**: 必须同时配置apps.xml和qapps.xml

### 错误3: Entity权限错误
**原因**: 查询时未绕过权限检查  
**解决**: 在查询链中添加`.disableAuthz()`

### 错误4: 前端渲染问题
**原因**: 未执行Chrome MCP验证  
**解决**: 每次前端修改后执行验证协议

## 🔍 验证检查清单

### 菜单配置验证
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

### 功能验证
- [ ] 主应用列表显示应用卡片
- [ ] 二级菜单正确显示和导航
- [ ] 所有页面可正常访问(200状态码)
- [ ] Chrome MCP验证页面渲染正确
- [ ] 数据服务API正常响应

## 📚 相关技术规范

- **认证配置**: `.kiro/rules/standards/moqui/authentication.md`
- **实体操作**: `.kiro/rules/standards/moqui/entity.md`
- **服务定义**: `.kiro/rules/standards/moqui/service.md`
- **屏幕定义**: `.kiro/rules/standards/moqui/screen.md`

## 💡 最佳实践

1. **先配置后开发**: 确保双重菜单配置完成后再开发功能
2. **统一认证方式**: 项目内统一使用JWT或Session认证
3. **权限一致性**: 所有实体操作统一使用`.disableAuthz()`
4. **前端验证**: 养成修改后立即验证的习惯

---

**版本**: v1.0  
**创建日期**: 2025-01-16  
**适用范围**: 所有Moqui应用开发
