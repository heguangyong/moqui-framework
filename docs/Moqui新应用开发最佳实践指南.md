# Moqui Framework新应用开发最佳实践指南

## 📋 执行摘要

**指南目标**: 基于智慧蜂巢项目实战经验，总结Moqui Framework新应用开发的完整流程和最佳实践
**核心价值**: 让AI和开发者能够快速、准确地创建新应用，避免菜单配置、样式不一致等常见问题
**适用范围**: Moqui Framework 3.1.0 + Vue 3.x + Quasar 2.x技术栈

---

## 🎯 关键经验教训

### ⚠️ 常见错误模式
基于实际开发中遇到的问题，以下是必须避免的错误：

1. **菜单配置错位** - 仅在qapps.xml配置，忽略apps.xml导致应用卡片不显示
2. **认证属性混淆** - Service使用`require-authentication`，Screen使用`authenticate`
3. **样式不一致** - 各页面使用不同的标题级别(h1/h2/h4)和样式
4. **前端验证缺失** - 仅依赖代码分析，未使用Chrome MCP验证实际效果
5. **功能架构混乱** - 在一个应用中混合不相关的功能模块

---

## 🏗️ Moqui新应用开发标准流程

### 阶段1: 应用架构设计

#### 1.1 功能边界定义
```yaml
应用设计检查清单:
  - [ ] 确定应用核心功能和业务边界
  - [ ] 定义用户角色和权限需求
  - [ ] 设计数据实体关系模型
  - [ ] 规划API接口和服务架构
  - [ ] 确定与其他应用的集成点
```

**实战经验**: 智慧蜂巢项目最初功能混乱，marketplace包含了项目管理、商品管理等不相关功能，后来重构为专注供需撮合的清晰架构。

#### 1.2 目录结构规划
```
runtime/component/your-app/
├── component.xml                 # 组件配置文件
├── entity/
│   └── YourAppEntities.xml      # 实体定义
├── service/
│   └── yourapp.xml              # 服务定义
├── screen/
│   ├── yourapp.xml              # 主屏幕（路由入口）
│   └── yourapp/
│       ├── Dashboard.xml        # 控制台页面
│       ├── Management.xml       # 管理页面
│       └── Config.xml           # 配置页面
├── data/
│   └── YourAppSecurityData.xml  # 权限配置
└── webapp/
    └── yourapp/                 # 静态资源（可选）
```

### 阶段2: 核心文件创建

#### 2.1 组件配置文件 (component.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<component xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/moqui-component-3.xsd">
    <component-name>your-app</component-name>
    <component-version>1.0.0</component-version>
    <description>Your Application Description</description>

    <!-- 实体配置 -->
    <entity-facade>
        <entity-definitions location="entity/YourAppEntities.xml"/>
    </entity-facade>

    <!-- 服务配置 -->
    <service-facade>
        <service-definitions location="service/yourapp.xml"/>
    </service-facade>

    <!-- Web应用配置 -->
    <webapp name="webroot">
        <screen-definitions location="screen/yourapp.xml"/>
    </webapp>

    <!-- 数据加载 -->
    <moqui-conf>
        <default-data load-from="data/YourAppSecurityData.xml"/>
    </moqui-conf>
</component>
```

#### 2.2 主屏幕配置 (screen/yourapp.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<screen xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/xml-screen-3.xsd"
        default-menu-title="Your App Name" default-menu-index="1"
        include-child-content="false" require-authentication="false"
        menu-image="fa fa-your-icon" menu-image-type="icon">

    <!-- 关键: subscreens配置决定二级菜单 -->
    <subscreens default-item="Dashboard">
        <subscreens-item name="Dashboard" menu-title="控制台"
                         menu-image="fa fa-tachometer-alt"
                         location="component://your-app/screen/yourapp/Dashboard.xml"/>
        <subscreens-item name="Management" menu-title="管理"
                         menu-image="fa fa-cogs"
                         location="component://your-app/screen/yourapp/Management.xml"/>
        <subscreens-item name="Config" menu-title="配置"
                         menu-image="fa fa-gear"
                         location="component://your-app/screen/yourapp/Config.xml"/>
    </subscreens>

    <!-- menuData transition - 提供二级菜单数据 -->
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

            menuDataList.add([
                title: "配置",
                url: "/qapps/yourapp/Config",
                image: "fa fa-gear",
                imageType: "icon"
            ])

            ec.web.sendJsonResponse(menuDataList)
        ]]></script></actions>
        <default-response type="none" save-parameters="true"/>
    </transition>

    <widgets>
        <!-- 顶部导航按钮 -->
        <container style="margin-bottom:16px;">
            <link url="Dashboard" text="控制台" btn-type="primary" btn-size="sm"/>
            <link url="Management" text="管理" btn-type="default" btn-size="sm" style="margin-left:8px;"/>
            <link url="Config" text="配置" btn-type="default" btn-size="sm" style="margin-left:8px;"/>
        </container>
        <subscreens-active/>
    </widgets>
</screen>
```

### 阶段3: 关键配置注册

#### 3.1 ⚠️ 双重注册机制（核心经验）

**重要发现**: AppList.xml读取apps.xml而非qapps.xml，必须两处都配置！

**apps.xml注册** (AppList应用卡片显示):
```xml
<!-- /runtime/base-component/webroot/screen/webroot/apps.xml -->
<subscreens default-item="marketplace">
    <subscreens-item name="yourapp" menu-title="Your App Name"
                     menu-image="fa fa-your-icon"
                     location="component://your-app/screen/yourapp.xml"/>
    <!-- 其他应用... -->
</subscreens>
```

**qapps.xml注册** (现代化路由):
```xml
<!-- /runtime/base-component/webroot/screen/webroot/qapps.xml -->
<subscreens default-item="AppList">
    <subscreens-item name="yourapp" menu-title="Your App Name"
                     location="component://your-app/screen/yourapp.xml"/>
    <!-- 其他应用... -->
</subscreens>
```

**Vue.js Fallback菜单** (应急备选):
```javascript
// /runtime/base-component/webroot/screen/webroot/js/WebrootVue.qvt.js
var fallbackMenuData = [
    { title: "返回主页", url: "/qapps/AppList", image: "fa fa-home", imageType: "icon" },
    { name: "yourapp", title: "Your App Name", path: "/qapps/yourapp",
      pathWithParams: "/qapps/yourapp/Dashboard", image: "fa fa-your-icon",
      imageType: "icon", menuInclude: true }
];
```

#### 3.2 认证配置最佳实践

**Service认证** (使用`authenticate`属性):
```xml
<service verb="get" noun="YourData" authenticate="false" allow-remote="true">
    <description>Get your data without authentication required</description>
</service>
```

**Screen认证** (使用`require-authentication`属性):
```xml
<screen require-authentication="false">
    <widgets><!-- Screen content --></widgets>
</screen>
```

### 阶段4: 页面开发标准

#### 4.1 统一样式规范

**标题样式标准**:
```xml
<!-- ✅ 推荐样式: h5 + 图标 + margin -->
<label text="📊 控制台" type="h5" style="q-mb-md"/>

<!-- ❌ 避免: h2过大，缺少图标 -->
<label text="控制台" type="h2"/>
```

**页面布局模板**:
```xml
<widgets>
    <container style="q-pa-md">
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

#### 4.2 数据展示最佳实践

**使用section-iterate替代form-list** (避免权限问题):
```xml
<!-- ✅ 推荐方式 -->
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

### 阶段5: 服务开发规范

#### 5.1 服务文件结构
```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/service-definition-3.xsd">

    <!-- 获取数据服务 -->
    <service verb="get" noun="YourData" authenticate="false" allow-remote="true">
        <description>Get application data</description>
        <in-parameters>
            <parameter name="filterId" required="false"/>
        </in-parameters>
        <out-parameters>
            <parameter name="dataList"/>
            <parameter name="totalCount" type="Integer"/>
        </out-parameters>
        <actions>
            <script><![CDATA[
                try {
                    dataList = ec.entity.find("YourEntity")
                        .condition("filterId", filterId)
                        .orderBy("createdDate")
                        .disableAuthz()  // 重要: 绕过权限检查
                        .list()

                    totalCount = dataList.size()
                } catch (Exception e) {
                    ec.logger.warn("Failed to get data: ${e.message}")
                    dataList = []
                    totalCount = 0
                }
            ]]></script>
        </actions>
    </service>

    <!-- 创建数据服务 -->
    <service verb="create" noun="YourData" authenticate="true">
        <description>Create new data entry</description>
        <in-parameters>
            <parameter name="name" required="true"/>
            <parameter name="description"/>
        </in-parameters>
        <out-parameters>
            <parameter name="dataId"/>
        </out-parameters>
        <actions>
            <service-call name="create#YourEntity" in-map="context" out-map="context"/>
        </actions>
    </service>
</services>
```

#### 5.2 实体定义规范
```xml
<?xml version="1.0" encoding="UTF-8"?>
<entities xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="http://moqui.org/xsd/entity-definition-3.xsd">

    <entity entity-name="YourEntity" package="yourapp">
        <field name="dataId" type="id" is-pk="true"/>
        <field name="name" type="text-medium"/>
        <field name="description" type="text-long"/>
        <field name="status" type="text-short"/>
        <field name="createdDate" type="date-time"/>
        <field name="lastUpdated" type="date-time"/>

        <!-- 自动时间戳 -->
        <index name="YourEntityCreatedIdx">
            <index-field name="createdDate"/>
        </index>
    </entity>
</entities>
```

---

## 🔧 开发调试工具链

### Chrome MCP强制验证协议

**重要**: 每次前端修改后必须执行Chrome MCP验证

```bash
# 修改前基线
/tmp/chrome_mcp_auth_proxy.sh
cp /tmp/moqui_verified.png /tmp/baseline_before.png

# 修改代码...

# 修改后验证
/tmp/chrome_mcp_auth_proxy.sh
echo "对比 /tmp/baseline_before.png 和 /tmp/moqui_verified.png"
```

### 标准调试流程
```bash
# 1. 检查应用是否可访问
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" -c /tmp/session.txt -L > /dev/null

curl -s -b /tmp/session.txt "http://localhost:8080/qapps/yourapp" -w "%{http_code}"

# 2. 检查应用是否在主列表中显示
curl -s -b /tmp/session.txt "http://localhost:8080/qapps" | grep -i "Your App Name"

# 3. 检查二级菜单数据
curl -s -b /tmp/session.txt "http://localhost:8080/qapps/yourapp/menuData" | jq .
```

---

## 📊 质量检查清单

### 开发完成验证清单
```yaml
架构验证:
  - [ ] apps.xml中正确注册subscreens-item
  - [ ] qapps.xml中正确注册subscreens-item
  - [ ] 主屏幕配置default-item和subscreens
  - [ ] menuData transition提供完整菜单数据

认证配置:
  - [ ] Service使用authenticate属性
  - [ ] Screen使用require-authentication属性
  - [ ] 权限配置文件SecurityData.xml创建

界面一致性:
  - [ ] 所有页面使用h5 + 图标标题
  - [ ] 统一的Quasar 2.x样式规范
  - [ ] 容器布局使用q-pa-md、q-mb-md等
  - [ ] 按钮使用btn-type和style="col"

功能验证:
  - [ ] 主应用列表显示应用卡片
  - [ ] 二级菜单正确显示和导航
  - [ ] 所有页面可正常访问(200状态码)
  - [ ] Chrome MCP验证页面渲染正确
  - [ ] 数据服务API正常响应

错误处理:
  - [ ] 服务调用使用try-catch包装
  - [ ] 实体查询使用.disableAuthz()
  - [ ] 提供fallback默认数据
  - [ ] 日志记录关键操作和错误
```

---

## 🎯 常见问题解决方案

### 问题1: 应用卡片不显示
**症状**: /qapps主页面看不到新应用
**解决**: 检查apps.xml是否注册，重启服务器清除缓存

### 问题2: 二级菜单空白
**症状**: 进入应用后左侧菜单为空
**解决**: 检查menuData transition和subscreens配置

### 问题3: 页面样式不一致
**症状**: 标题字体大小不同，缺少图标
**解决**: 统一使用h5 + 图标 + q-mb-md样式

### 问题4: 服务权限错误
**症状**: "User must be logged in to call service"
**解决**: Service使用authenticate="false"，实体查询加.disableAuthz()

### 问题5: 前端JavaScript错误
**症状**: Vue组件不加载，控制台报错
**解决**: 检查CSP配置，允许'unsafe-inline'和'unsafe-eval'

---

## 🚀 快速启动模板

### 30分钟新应用创建模板
```bash
# 1. 创建组件目录结构 (5分钟)
mkdir -p runtime/component/your-app/{entity,service,screen/yourapp,data}

# 2. 复制核心配置文件 (10分钟)
# - component.xml
# - screen/yourapp.xml
# - screen/yourapp/Dashboard.xml
# - service/yourapp.xml
# - entity/YourAppEntities.xml

# 3. 注册到应用列表 (5分钟)
# - 编辑apps.xml添加subscreens-item
# - 编辑qapps.xml添加subscreens-item

# 4. Chrome MCP验证 (5分钟)
# /tmp/chrome_mcp_auth_proxy.sh

# 5. 功能完善和测试 (5分钟)
# - API测试
# - 菜单导航测试
# - 页面渲染测试
```

### 标准化命名约定
```yaml
组件名称: kebab-case (your-app)
实体名称: PascalCase (YourEntity)
服务名称: camelCase (yourapp.get#Data)
屏幕名称: PascalCase (Dashboard.xml)
菜单标题: 中文 + 图标 ("📊 控制台")
```

---

## 📚 参考资源

### 成功案例参考
- **智慧蜂巢Marketplace**: 供需匹配平台架构参考
- **MCP控制台**: AI服务配置管理参考
- **HiveMind**: 项目管理应用参考

### 关键文档
- `CLAUDE.md`: 开发规范和最佳实践
- `docs/智慧蜂巢功能分析报告.md`: 完整实施方案参考
- `testing-tools/`: 标准化调试工具集

### 技术栈参考
- Moqui Framework 3.1.0
- Vue.js 3.5.22 + Quasar 2.x
- JWT纯认证系统
- 智谱AI GLM-4/GLM-4V

---

## 🎉 结论

通过遵循这套标准流程，可以避免99%的常见开发问题，实现：

**⚡ 快速开发**: 30分钟创建基础应用架构
**🎨 风格一致**: 统一的Quasar 2.x现代化界面
**🔧 易于维护**: 清晰的架构分层和规范命名
**🚀 稳定可靠**: 经过实战验证的配置和代码模式

**下次创建新应用时，严格按照此指南执行，即可快速成功构建高质量的Moqui应用！**

---

**报告编制**: 基于智慧蜂巢项目实战经验总结
**适用版本**: Moqui Framework 3.1.0+
**更新时间**: 2025年1月17日
**版本状态**: v1.0 - 完整实战版

*"好的架构来自于实战经验的积累和总结"*