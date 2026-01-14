# Moqui Framework 完整开发指南

本文档基于 Moqui Framework 完整官方文档（73页）和智能供需平台项目的实际开发经验，为企业级应用开发提供全方位技术指导。

## 概述

Moqui Framework 是一个基于Java的企业级开发框架，结合智能供需平台项目实践，提供完整的开发生态系统。

### 技术栈
- **后端**: Moqui Framework (Java/Groovy)
- **前端**: Vue3 + Quasar2 + XML Screen
- **AI集成**: 智谱AI (GLM-4/GLM-4V)
- **消息平台**: Telegram Bot API
- **认证**: JWT (JSON Web Tokens)
- **数据库**: Entity Facade (支持多种数据库)
- **集成**: Apache Camel + Web Services
- **部署**: Docker + Multi-instance

### 核心组件
- **Moqui Framework**: 企业应用开发框架
- **Mantle Business Artifacts**: 业务构件
- **moqui-marketplace**: 供需平台核心组件
- **moqui-mcp**: MCP集成组件
- **moqui-hivemind**: HiveMind项目管理集成
- **AI Services**: 多模态AI服务接口

## 核心开发模式

### 1. 实体驱动开发
```xml
<!-- 实体定义示例 -->
<entity entity-name="Supply" package="marketplace">
    <field name="supplyId" type="id" is-pk="true"/>
    <field name="title" type="text-medium"/>
    <field name="description" type="text-long"/>
    <field name="category" type="text-short"/>
    <field name="status" type="text-short"/>
    <field name="createdDate" type="date-time"/>
</entity>
```

### 2. 服务实现模式
```xml
<!-- 服务定义 -->
<service verb="create" noun="Supply" authenticate="true" allow-remote="true">
    <description>创建供应信息</description>
    <in-parameters>
        <parameter name="title" required="true"/>
        <parameter name="description"/>
        <parameter name="category" required="true"/>
    </in-parameters>
    <out-parameters>
        <parameter name="supplyId"/>
        <parameter name="success" type="Boolean"/>
        <parameter name="message"/>
    </out-parameters>
    <actions>
        <script><![CDATA[
            try {
                def newSupply = ec.entity.makeValue("Supply")
                    .setFields([
                        title: title,
                        description: description,
                        category: category,
                        status: "ACTIVE",
                        createdDate: ec.user.nowTimestamp
                    ], true, null, false)
                    .setSequencedIdPrimary()
                    .create()
                
                supplyId = newSupply.supplyId
                success = true
                message = "供应信息创建成功"
            } catch (Exception e) {
                ec.logger.error("创建供应信息失败: ${e.message}", e)
                success = false
                message = "创建失败: ${e.message}"
            }
        ]]></script>
    </actions>
</service>
```

### 3. 屏幕定义模式
```xml
<!-- 屏幕定义 -->
<screen require-authentication="false">
    <transition name="createSupply">
        <service-call name="marketplace.SupplyServices.create#Supply"/>
        <default-response url="."/>
    </transition>
    
    <actions>
        <entity-find entity-name="Supply" list="supplyList">
            <econdition field-name="status" value="ACTIVE"/>
            <order-by field-name="createdDate"/>
        </entity-find>
    </actions>
    
    <widgets>
        <container style="q-pa-md">
            <label text="📦 供应管理" type="h5" style="q-mb-md"/>
            
            <!-- 创建表单 -->
            <form-single name="CreateSupplyForm" transition="createSupply">
                <field name="title"><default-field><text-line/></default-field></field>
                <field name="description"><default-field><text-area/></default-field></field>
                <field name="category"><default-field><text-line/></default-field></field>
                <field name="submitButton"><default-field><submit text="创建供应"/></default-field></field>
            </form-single>
            
            <!-- 数据列表 -->
            <container style="q-mt-md">
                <section-iterate name="SupplyIterate" list="supplyList" entry="supply">
                    <widgets>
                        <container style="q-card q-pa-md q-mb-sm">
                            <label text="${supply.title}" type="h6"/>
                            <label text="${supply.description}"/>
                            <label text="分类: ${supply.category}" style="color: #666;"/>
                        </container>
                    </widgets>
                </section-iterate>
            </container>
        </container>
    </widgets>
</screen>
```

## 智能供需平台特定功能

### Telegram Bot集成
```groovy
// Bot消息处理
def processSupplyCommand(String chatId, String messageText) {
    def result = ec.service.sync().name("marketplace.SupplyServices.create#Supply")
        .parameters([
            title: extractTitle(messageText),
            description: extractDescription(messageText),
            category: extractCategory(messageText)
        ])
        .call()

    if (result.success) {
        sendTelegramMessage(chatId, "✅ 供应信息已创建: ${result.supplyId}")
    } else {
        sendTelegramMessage(chatId, "❌ 创建失败: ${result.message}")
    }
}
```

### AI服务调用
```groovy
// 智谱AI调用
def aiResponse = ec.service.sync().name("ai.ZhipuServices.call#GLM4")
    .parameters([
        model: "glm-4",
        messages: [
            [role: "system", content: "你是一个供需匹配助手"],
            [role: "user", content: userMessage]
        ],
        temperature: 0.7
    ])
    .call()

if (aiResponse.success) {
    def aiMessage = aiResponse.choices[0].message.content
    // 处理AI响应
}
```

### 实体操作最佳实践
```groovy
// 查询操作
def supplyList = ec.entity.find("Supply")
    .condition("status", "ACTIVE")
    .condition("category", category)
    .orderBy("createdDate")
    .disableAuthz()  // 重要：绕过权限检查
    .list()

// 更新操作
def existingSupply = ec.entity.find("Supply")
    .condition("supplyId", supplyId)
    .disableAuthz()
    .one()

if (existingSupply) {
    existingSupply.status = "INACTIVE"
    existingSupply.lastUpdated = ec.user.nowTimestamp
    existingSupply.update()
}
```

## 认证和安全配置

### JWT认证配置
```xml
<!-- MoquiDevConf.xml中的JWT配置 -->
<default-property name="moqui.session.auth.disabled" value="true"/>
<default-property name="moqui.webapp.auth.mode" value="jwt_only"/>
<default-property name="moqui.jwt.force.mode" value="true"/>
<default-property name="moqui.jwt.webapp.auth.enabled" value="true"/>
<default-property name="moqui.jwt.secret" value="your-secret-key"/>
<default-property name="moqui.jwt.expire.hours" value="24"/>
```

### 服务认证标准
```xml
<!-- ✅ 正确：Service使用authenticate属性 -->
<service verb="get" noun="SupplyData" authenticate="false" allow-remote="true">
    <description>获取供应数据（无需认证）</description>
</service>

<service verb="create" noun="Supply" authenticate="true" allow-remote="true">
    <description>创建供应信息（需要认证）</description>
</service>
```

### 屏幕认证标准
```xml
<!-- ✅ 正确：Screen使用require-authentication属性 -->
<screen require-authentication="false">
    <widgets><!-- 公开页面内容 --></widgets>
</screen>

<screen require-authentication="true">
    <widgets><!-- 需要认证的页面内容 --></widgets>
</screen>
```

**注意**: 详细的认证配置标准请参考 `moqui-standards.md` 文档。

## 菜单配置标准

### 双重注册机制
```xml
<!-- 1. apps.xml注册（控制应用卡片显示） -->
<subscreens default-item="marketplace">
    <subscreens-item name="marketplace" menu-title="智能供需平台"
                     menu-image="fa fa-handshake"
                     location="component://moqui-marketplace/screen/marketplace.xml"/>
</subscreens>

<!-- 2. qapps.xml注册（现代化路由） -->
<subscreens default-item="AppList">
    <subscreens-item name="marketplace" menu-title="智能供需平台"
                     location="component://moqui-marketplace/screen/marketplace.xml"/>
</subscreens>
```

**注意**: 完整的菜单配置标准和应用内部菜单配置请参考 `moqui-standards.md` 文档。

## Vue3 + Quasar2 前端集成

### WebrootVue.qvt.js配置
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

### 统一样式标准
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

### 数据展示最佳实践

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

## 性能优化最佳实践

### 数据层优化
```groovy
// 使用缓存
def cachedData = ec.entity.find("Supply")
    .condition("status", "ACTIVE")
    .useCache(true)
    .list()

// 批量操作
def supplies = []
supplyDataList.each { data ->
    supplies.add(ec.entity.makeValue("Supply").setAll(data))
}
ec.entity.createAll(supplies)
```

### 服务层优化
```groovy
// 异步服务调用
ec.service.async().name("marketplace.NotificationServices.send#SupplyNotification")
    .parameters([supplyId: supplyId, userId: userId])
    .call()

// 事务管理
ec.transaction.begin()
try {
    // 多个数据库操作
    ec.transaction.commit()
} catch (Exception e) {
    ec.transaction.rollback()
    throw e
}
```

## 调试和验证

### Chrome MCP验证流程
```bash
# 1. 修改前基线建立
/tmp/chrome_mcp_auth_proxy.sh
cp /tmp/moqui_verified.png /tmp/baseline_before.png

# 2. 进行代码修改...

# 3. 修改后立即验证
/tmp/chrome_mcp_auth_proxy.sh
echo "对比 /tmp/baseline_before.png 和 /tmp/moqui_verified.png"
```

### API测试标准
```bash
# 1. 检查应用访问性
curl -s -X POST "http://localhost:8080/Login/login" \
     -d "username=john.doe&password=moqui" -c /tmp/session.txt -L > /dev/null

curl -s -b /tmp/session.txt "http://localhost:8080/qapps/marketplace" -w "%{http_code}"

# 2. 检查菜单数据
curl -s -b /tmp/session.txt "http://localhost:8080/qapps/marketplace/menuData" | jq .
```

## 部署和运维

### Docker部署配置
```yaml
# docker-compose.yml
version: '3.8'
services:
  moqui:
    image: moqui/moqui-framework:latest
    ports:
      - "8080:8080"
    environment:
      - entity_ds_db_conf=mysql8
      - entity_ds_host=mysql
      - entity_ds_database=moqui
      - entity_ds_user=moqui
      - entity_ds_password=moqui
    volumes:
      - ./runtime:/opt/moqui/runtime
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=moquiroot
      - MYSQL_DATABASE=moqui
      - MYSQL_USER=moqui
      - MYSQL_PASSWORD=moqui
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## 开发阶段状态

### ✅ Phase 0 - 已完成
- 多模态AI平台集成
- JWT认证系统实施
- Vue3+Quasar2技术栈升级
- Chrome MCP调试工具链建立

### 🔄 Phase 1 - 进行中
- Telegram MVP闭环实现
- 供需撮合核心功能
- 多模态消息处理优化

### 📋 后续阶段
- **Phase 2**: HiveMind项目管理集成
- **Phase 3**: POP电商平台集成
- **Phase 4**: Marble ERP深度整合

## 故障排除

### 常见问题和解决方案

#### 1. 认证配置错误
```
错误: "User must be logged in to call service"
解决: 检查Service定义中使用authenticate="false"而非require-authentication
```

#### 2. 菜单显示问题
```
错误: 应用不显示在主菜单中
解决: 确保apps.xml和qapps.xml都正确注册了subscreens-item
```

#### 3. 实体权限问题
```
错误: Entity查询权限不足
解决: 在查询中添加.disableAuthz()绕过权限检查
```

#### 4. 前端渲染问题
```
错误: Vue组件不显示
解决: 检查WebrootVue.qvt.js配置和Quasar插件加载
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
- [ ] JWT配置正确设置

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
**基于**: Moqui Framework 官方文档（73页）+ 智能供需平台项目实践  
**适用范围**: 所有基于Moqui Framework的开发活动  
**审批状态**: 待审批