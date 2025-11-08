---
name: moqui_complete
description: Complete Moqui Ecosystem documentation with intelligent supply-demand platform - framework, applications, business artifacts, and comprehensive development guide
---

# Moqui Framework & 智能供需平台完整开发技能

基于 Moqui Framework 完整官方文档和智能供需平台项目的综合开发技能，包含73个官方页面的全面文档。

## When to Use This Skill

此技能适用于以下场景：
- 开发 Moqui Framework 应用（全方位支持）
- 智能供需平台功能开发
- 企业应用开发和系统集成
- Telegram Bot 集成和多模态AI服务
- JWT 认证和安全系统实现
- Vue3 + Quasar2 前端开发
- Entity 数据建模和服务架构
- XML Screen 用户界面开发
- Apache Camel 企业集成
- Docker 多实例部署
- Performance 性能优化

## 项目架构概览

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

## Quick Reference - 核心开发模式

### 📧 通知和WebSocket (从官方文档提取)
```groovy
// 发送通知消息
ec.makeNotificationMessage()
    .topic("TestTopic")
    .type("info")
    .title("Test notification message")
    .message(messageMapOrJsonString)
    .userGroupId("ALL_USERS")
    .send()
```

### 🔧 服务实现 (从官方文档提取)
```xml
<!-- Groovy脚本服务 -->
<service verb="send" noun="Email" type="script"
         location="classpath://org/moqui/impl/sendEmailTemplate.groovy" allow-remote="false">
    <implements service="org.moqui.EmailServices.send#EmailTemplate"/>
</service>
```

### 📊 数据导入导出 (从官方文档提取)
```groovy
// 数据加载器
ec.entity.makeDataLoader().dataTypes(['seed', 'demo']).load()

// 数据导出
ec.entity.makeDataWriter()
    .entityName("mantle.order.OrderHeader")
    .dependentRecords(true)
    .orderBy(["orderId"])
    .fromDate(lastExportDate)
    .thruDate(ec.user.nowTimestamp)
    .file("/tmp/TestOrderExport.xml")
```

### 🚀 服务调用 (从官方文档提取)
```groovy
// 异步服务调用
Map ahp = [visitId:ec.user.visitId, artifactType:artifactType, ...]
ec.service.async().name("create", "moqui.server.ArtifactHit").parameters(ahp).call()

// 同步服务调用
Map result = ec.service.sync().name("org.moqui.impl.UserServices.create#UserAccount").parameters(params).call()
```

### ⏰ 定时任务 (从官方文档提取)
```xml
<!-- ServiceJob配置 -->
<moqui.service.job.ServiceJob
    jobName="clean_ArtifactData_daily"
    description="Clean Artifact Data: ArtifactHit, ArtifactHitBin"
    serviceName="org.moqui.impl.ServerServices.clean#ArtifactData"
    cronExpression="0 0 2 * * ?"
    paused="N">
    <parameters parameterName="daysToKeep" parameterValue="90"/>
</moqui.service.job.ServiceJob>
```

### 🏢 智能供需平台特定功能

#### 实体操作
```groovy
// 创建供应信息
ec.entity.makeValue("Supply")
    .set("title", title)
    .set("description", description)
    .set("category", category)
    .create()

// 查询需求信息
def demandList = ec.entity.find("Demand")
    .condition("status", "ACTIVE")
    .condition("category", category)
    .list()
```

#### Telegram Bot集成
```groovy
// Bot消息处理
def processSupplyCommand(String chatId, String messageText) {
    def result = ec.service.sync().name("marketplace.SupplyServices.create#Supply")
        .parameters([title: extractTitle(messageText),
                    description: extractDescription(messageText)])
        .call()

    sendTelegramMessage(chatId, "供应信息已创建: ${result.supplyId}")
}
```

#### AI服务调用
```groovy
// 智谱AI调用
def aiResponse = ec.service.sync().name("ai.ZhipuServices.call#GLM4")
    .parameters([
        model: "glm-4",
        messages: messages,
        temperature: 0.7
    ])
    .call()
```

## 官方文档覆盖范围 (73个页面)

### 🚀 入门指南 (10页)
- Framework Introduction
- Quick Tutorial
- Tool and Config Overview
- IDE Setup (包括 IntelliJ IDEA)
- Run and Deploy
- Multi-instance with Docker
- Source Management
- Community Guide
- Issue and Pull Request Guide
- Contributor Guide

### 🏗️ 框架核心 (50页)
- **数据和资源**:
  - Entity Facade 实体门面
  - Data Model Definition 数据模型定义
  - Data Model Patterns 数据模型模式
  - Entity Data Import and Export 数据导入导出
  - Entity ECA Rules 实体事件规则
  - Data Document 数据文档
  - Data Feed 数据源
  - Data Search 数据搜索
  - Resources and Content 资源和内容

- **逻辑和服务**:
  - Service Definition 服务定义
  - Service Implementation 服务实现
  - Service ECA Rules 服务事件规则
  - Service Jobs 服务任务
  - Calling Services 服务调用
  - Overview of XML Actions XML动作概述

- **用户界面**:
  - XML Screen XML屏幕
  - XML Form XML表单
  - Client Rendered Vue Screen Vue屏幕渲染
  - Templates 模板
  - Notification and WebSocket 通知和WebSocket
  - Sending and Receiving Email 邮件收发

- **系统接口**:
  - Web Service Web服务
  - System Message 系统消息
  - Enterprise Integration with Apache Camel Camel集成
  - Data and Logic Level Interfaces 数据逻辑接口
  - XML CSV and Plain Text Handling 文件处理

- **工具应用**:
  - The Tools Application 工具应用
  - Auto Screen 自动屏幕
  - Data View 数据视图
  - Entity Tools 实体工具

- **安全和性能**:
  - Security 安全
  - Performance 性能

### 📱 应用 (13页)
- Moqui Applications 应用概述
- Mantle Business Artifacts 业务构件
- POPC ERP User Guide ERP用户指南
- Framework Features 框架特性

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

## 常见开发模式

### 1. 实体驱动开发
1. 定义实体模型 (entities/*.xml)
2. 自动生成CRUD服务 (entity-auto)
3. 创建屏幕界面 (screen/*.xml)
4. 实现业务逻辑 (services/*.xml)

### 2. 服务为中心架构
1. 设计服务接口
2. 实现服务逻辑 (Groovy/Java)
3. 配置服务调用权限
4. 集成前端调用

### 3. 事件驱动处理
1. Entity ECA 数据事件
2. Service ECA 服务事件
3. 通知系统集成
4. WebSocket 实时通信

### 4. 集成开发模式
1. Apache Camel 企业集成
2. Web Service 接口
3. REST API 开发
4. 外部系统连接

## 性能优化最佳实践

### 数据层优化
- Entity Facade 缓存策略
- 数据库查询优化
- 批量操作处理
- 索引和约束设计

### 服务层优化
- 异步服务调用
- 事务管理优化
- 服务组合和编排
- 缓存策略实施

### 用户界面优化
- Vue组件懒加载
- 屏幕渲染优化
- WebSocket 连接管理
- 静态资源优化

## 部署和运维

### Docker部署
- Multi-instance 配置
- 容器编排
- 环境变量管理
- 健康检查设置

### 监控和日志
- 性能监控
- 错误追踪
- 审计日志
- 运维工具

## Reference Files

### 📖 完整官方文档参考 (73页)
- **getting_started.md**: 入门指南 (10页)
- **framework.md**: 框架核心文档 (50页)
- **applications.md**: 应用和构件文档 (13页)

### 📁 本地项目文档
参考现有的 `local_project.md` 获取智能供需平台的具体实现细节。

## 故障排除

### 常见问题
- Entity 定义错误
- 服务调用失败
- 屏幕渲染问题
- 数据导入导出错误
- 权限和安全配置
- Docker 部署问题

### 调试工具
- Tools Application 内置工具
- Entity Tools 实体工具
- Data View 数据视图
- Auto Screen 自动屏幕
- Chrome MCP 调试工具链

## 资源链接

- **官方文档**: 73页完整覆盖
- **项目文档**: `/Users/demo/Workspace/moqui/docs/`
- **组件文档**: `runtime/component/*/docs/`
- **API参考**: Moqui Framework JavaDoc
- **社区**: Moqui Forum

---

**最后更新**: 2025-11-01
**技能版本**: v3.0 (完整官方文档 + 本地项目)
**文档覆盖**: 73个官方页面 + 本地项目文档
**维护者**: Claude Code AI Assistant

此技能结合了 Moqui Framework 完整官方文档（73页）和智能供需平台项目的实际开发经验，为企业级应用开发提供全方位支持。
```

**Pattern 5:** Ecosystem Framework Business Artifacts Applications Add ons Forum Service Providers Issues & Tasks My Account My Requests (Issues) HiveMind PM Documentation Moqui Ecosystem Moqui Framework Mantle Business Artifacts Applications API JavaDoc Search Try the applications demo! Try POP Shop eCommerce! Comments? Questions? Get Involved? Join the Forum Wiki Spaces Mantle Business Artifacts Moqui Applications Moqui Community Moqui Framework Page Tree Moqui Framework All Pages The Entity Facade Basic CrUD Operations Finding Entity Records Flexible Finding with View Entities Basic CrUD Operations The basic CrUD operations for an entity record are available through the EntityValue interface. There are two main ways to get an EntityValue object: Make a Value (use ec.entity.makeValue(entityName)) Find a Value (more details on this below) Once you have an EntityValue object you can call the create(), update(), or delete() methods to perform the desired operation. There is also a createOrUpdate() method that will create a record if it doesn’t exist, or update it if it does. Note that all of these methods, like many methods on the EntityValue interface, return a self-reference for convenience so that you can chain operations. For example: ec.entity.makeValue("Example").setAll(fields).setSequencedIdPrimary().create() While this example is interesting, only in rare cases should you create a record directly using the Entity Facade API (accessed as ec.entity). You should generally do CrUD operations through services, and there are automatic CrUD services for all entities available through the Service Facade. These services have no definition, they exist implicitly and are driven only the entity definition. We’ll discuss the Service Facade more below in the context of the logic layer, but here is an example of what that operation would look like using an implicit automatic entity service: ec.service.sync().name("create#Example").parameters(fields).call() Most of the Moqui Framework API methods return a self-reference for convenient chaining of method calls like this. The main difference between the two is that one goes through the Service Facade and the other doesn’t. There are some advantages of going through the Service Facade (such as transaction management, flow control, security options, and so much more), but many things are the same between the two calls including automatic cleanup and type conversion of the fields passed in before performing the underlying operation. With the implicit automatic entity service you don’t have to explicitly set the sequenced primary ID as it automatically determines that there is a single primary and if it is not present in the parameters passed into the service then it will generate one. However you do the operation, only the entity fields that are modified or passed in are updated. The EntityValue object will keep track of which fields have been modified and only create or update those when the operation is done in the database. You can ask an EntityValue object if it is modified using the isModified() method, and you can restore it to its state in the database (populating all fields, not just the modified ones) using the refresh() method. If you want to find all the differences between the field values currently in the EntityValue and the corresponding column values in the database, use the checkAgainstDatabase(List messages) method. This method is used when asserting (as opposed to loading) an entity-facade-xml file and can also be used manually if you want to write Java or Groovy code check the state of data. Finding Entity Records Finding entity records is done using the EntityFind interface. Rather than using a number of different methods with different optional parameters through the EntityFind interface you can call methods for the aspects of the find that you care about, and ignore the rest. You can get a find object from the EntityFacade with something like: ec.getEntity().find("moqui.example.Example") Most of the methods on the EntityFind interface return a reference to the object so that you can chain method calls instead of putting them in separate statements. For example a find by the primary on the Example entity would look like this: EntityValue example = ec.entity.find("moqui.example.Example").condition("exampleId", exampleId).useCache(true).one() The EntityFind interface has methods on it for: conditions (both where and having) condition(String fieldName, Object value): Simple condition, named field equals value. condition(String fieldName, EntityCondition.ComparisonOperator operator, Object value): Compare the named field to the value using the operator which can be EQUALS, NOT_EQUAL, LESS_THAN, GREATER_THAN, LESS_THAN_EQUAL_TO, GREATER_THAN_EQUAL_TO, IN, NOT_IN, BETWEEN, LIKE, or NOT_LIKE. conditionToField(String fieldName, EntityCondition.ComparisonOperator operator, String toFieldName): Compare a field to another field using the operator. condition(Map<String, ?> fields): Constrain by each entry in the Map whose key matches a field name on the entity. If a field has been set with the same name and any of the Map keys, this will replace that field's value. Fields set in this way will be combined with other conditions (if applicable) just before doing the query. This will do conversions if needed from Strings to field types as needed, and will only get keys that match entity fields. In other words, it does the same thing as: EntityValue.setFields(fields, true, null, null). condition(EntityCondition condition): Add a condition created through the EntityConditionFactory. conditionDate(String fromFieldName, String thruFieldName, Timestamp compareStamp): Add conditions for the standard effective date query pattern including from field is null or earlier than or equal to compareStamp and thru field is null or later than or equal to compareStamp. havingCondition(EntityCondition condition): Add a condition created through the EntityConditionFactory to the having conditions. Having is the standard SQL concept and used for conditions applied after the grouping and functions. searchFormInputs(String inputFieldsMapName, String defaultOrderBy, boolean alwaysPaginate): Adds conditions for the fields found in the inputFieldsMapName Map. The fields and special fields with suffixes supported are the same as the *-find fields in the XML Forms. This means that you can use this to process the data from the various inputs generated by XML Forms. The suffixes include things like *_op for operators and *_ic for ignore case. If inputFieldsMapName is empty will look at the ec.web.parameters map if the web facade is available, otherwise the current context (ec.context). If there is not an orderByField parameter (one of the standard parameters for search XML Forms) defaultOrderBy is used instead. If alwaysPaginate is true pagination offset/limit will be set even if there is no pageIndex parameter. fields to select with selectField(String fieldToSelect) and/or selectFields(Collection<String> fieldsToSelect) fields to order the results by orderBy(String orderByFieldName): A field of the find entity to order the query by. Optionally add a " ASC" to the end or "+" to the beginning for ascending, or " DESC" to the end of "-" to the beginning for descending. If any other order by fields have already been specified this will be added to the end of the list. The String may be a comma-separated list of field names. Only fields that actually exist on the entity will be added to the order by list. orderBy(List<String> orderByFieldNames): Each List entry is passed to the orderBy(String orderByFieldName) method. whether or not to cache the results with useCache(Boolean useCache), defaults to the value on the entity definition the offset and limit to pass to the datasource to limit results offset(Integer offset): The offset, i.e. the starting row to return. Default (null) means start from the first actual row. Only applicable for list() and iterator() finds. offset(int pageIndex, int pageSize): Specify the offset in terms of page index and size. Actual offset is pageIndex * pageSize. limit(Integer limit): The limit, i.e. max number of rows to return. Default (null) means all rows. Only applicable for list() and iterator() finds. database options including distinct with the distinct(boolean distinct) method and for update with the forUpdate(boolean forUpdate) method JDBC options resultSetType(int resultSetType): Specifies how the ResultSet will be traversed. Available values are ResultSet.TYPE_FORWARD_ONLY, ResultSet.TYPE_SCROLL_INSENSITIVE (default) or ResultSet.TYPE_SCROLL_SENSITIVE. See the java.sql.ResultSet JavaDoc for more information. If you want it to be fast, use the common option ResultSet.TYPE_FORWARD_ONLY. For partial results where you want to jump to an index make sure to use ResultSet.TYPE_SCROLL_INSENSITIVE, which is the default. resultSetConcurrency(int resultSetConcurrency): Specifies whether or not the ResultSet can be updated. Available values are ResultSet.CONCUR_READ_ONLY (default) or ResultSet.CONCUR_UPDATABLE. Should pretty much always be ResultSet.CONCUR_READ_ONLY with the Entity Facade since updates are generally done as separate operations. fetchSize(Integer fetchSize): The JDBC fetch size for this query. Default (null) will fall back to datasource settings. This is not the fetch as in the OFFSET/FETCH SQL clause (use the offset/limit methods for that), and is rather the JDBC fetch to determine how many rows to get back on each round-trip to the database. Only applicable for list() and iterator() finds. maxRows(Integer maxRows): The JDBC max rows for this query. Default (null) will fall back to datasource settings. This is the maximum number of rows the ResultSet will keep in memory at any given time before releasing them and if requested they are retrieved from the database again. Only applicable for list() and iterator() finds. There are various options for conditions, some on the EntityFind interface itself and a more extensive set available through the EntityConditionFactory interface. To get an instance of this interface use the ec.entity.getConditionFactory() method, something like: EntityConditionFactory ecf = ec.entity.getConditionFactory(); ef.condition(ecf.makeCondition(...)); For find forms that follow the standard Moqui pattern (used in XML Form find fields and can be used in templates or JSON or XML parameter bodies too), just use the EntityFind.searchFormInputs() method. Once all of these options have been specified you can do any of these actual operations to get results or make changes: get a single EntityValue (one() method) get an EntityValueList with multiple value objects (list() method) get an* EntityListIterator* to handle a larger set of results in smaller batches (with the iterator() method) get a count of matching results (count() method) update all matching records with specified fields (updateAll() method) delete all matching records (delete() method) Flexible Finding with View Entities You probably noticed that the EntityFind interface operates on a single entity. To do a query across multiple entities joined together and represented by a single entity name you can create a static view entity using a XML definition that lives along side normal entity definitions. A view entity can also be defined in database records (in the DbViewEntity and related entities) or with dynamic view entities built with code using the EntityDynamicView interface (get an instance using the EntityFind.makeEntityDynamicView() method). Static View Entity A view entity consists of one or more member entities joined together with key mappings and a set of fields aliased from the member entities with optional functions associated with them. The view entity can also have conditions associated with it to encapsulate some sort of constraint on the data to be included in the view. Here is an example of a view-entity XML snippet from the ExampleViewEntities.xml file in the example component: <view-entity entity-name="ExampleFeatureApplAndEnum" package="moqui.example"> <member-entity entity-alias="EXFTAP" entity-name="ExampleFeatureAppl"/> <member-entity entity-alias="ENUM" entity-name="moqui.basic.Enumeration" join-from-alias="EXFTAP"> <key-map field-name="exampleFeatureApplEnumId"/> </member-entity> <alias-all entity-alias="EXFTAP"/> <alias-all entity-alias="ENUM"> <exclude field="sequenceNum"/> </alias-all> </view-entity> Just like an entity a view entity has a name and exists in a package using the entity-name and package-name attributes on the view-entity element. Each member entity is represented by a member-entity element and is uniquely identified by an alias in the entity-alias attribute. Part of the reason for this is that the same entity can be a member in a view entity multiple times with a different alias for each one. Note that the second member-entity element also has a join-from-alias attribute to specify that it is joined to the first member entity. Only the first member entity does not have a join-from-alias attribute. If you want the current member entity to be optional in the join (a left outer join in SQL) then just set the join-optional attribute to true. To describe how the two entities relate to each other use one or more key-map elements under the member-entity element. The key-map element has two attributes: field-name and related. Note that the related attribute is optional when matching the primary key field on the current member entity. Fields can be aliased in sets using the alias-all element, as in the example above, or individually using the alias element. If you want to have a function on the field then alias them individually with the alias element. Note for SQL databases that if any aliased field has a function then all other fields that don’t have a function but that are selected in the query will be added to the group by clause to avoid invalid SQL. View Entity Auto Minimize on Find When doing a query with the Entity Facade EntityFind you can specify fields to select and only those fields will be selected. For view entities this does a little more to give you a big boost in performance without much work. A common problem with static view entities is that you want to join in a bunch of member entities to provide a lot of options for search screens and similar flexible queries and when you do this the temporary table for the query in the database can get HUGE. When the common use is to only select certain fields and only have conditions and sorting on a limited set of fields you may end up joining in a number of tables that are not actually used. In effect you are asking the database to do a LOT more work that it really needs to for the data you need. One approach to solving this is to build a EntityDynamicView on the fly and only join in the entities you need for the specific query options used. This works, but is cumbersome. The easy approach is to just take advantage of the feature in EntityFind that automatically minimizes the fields and entities joined in for each particular query. On a view entity just specify the fields to select, the conditions, and the order by fields. The Entity Facade will automatically go through the view entity definition and only alias the fields that are used for one of these (select, conditions, order by), and only join in the entities with fields that are actually used (or that are need to connect a member entity with other member entities to complete the join). A good example of this is the FindPartyView view entity defined in the PartyViewEntities.xml file in Mantle Business Artifacts. This view entity has a respectable 13 member entities. Without the automatic minimize that would be 13 tables joined in to every query on it. With millions of customer records or other similarly large party data each query could take a few minutes. When only querying on a few fields and only joining in a small number of member entities and a minimal number of fields, the query gets down to sub-second times. The actual find is done by the mantle.party.PartyServices.find#Party service. The implementation of this service is a simple 45 line Groovy script (findParty.groovy), and most of that script is just adding conditions to the find based on parameter being specified or not. Doing the same thing with the EntityDynamicView approach requires hundreds of lines of much more complex scripting, more complex to both write and maintain. Database Defined View Entity In addition to defining view entities in XML you can also define them in database records using DbViewEntity and related entities. This is especially useful for building screens where the user defines a view on the fly (like the EditDbView.xml screen in the tools component, get to it in the menu with Tool => Data View), and then searches, views, and exports the data using a screen based on the user-defined view (like the ViewDbView.xml screen). There aren’t quite as many options when defining a DB view entity, but the main features are there and the same patterns apply. There is a view entity with a name (dbViewEntityName), package (packageName), and whether to cache results. It also has member entities (DbViewEntityMember), key maps to specify how the members join together (DbViewEntityKeyMap), and field aliases (DbViewEntityAlias). Here is an example, from the example component: <moqui.entity.view.DbViewEntity dbViewEntityName="StatusItemAndTypeDb" packageName="moqui.basic" cache="Y"> <moqui.entity.view.DbViewEntityMember entityAlias="SI" entityName="moqui.basic.StatusItem"/> <moqui.entity.view.DbViewEntityMember entityAlias="ST" entityName="moqui.basic.StatusType" joinFromAlias="SI"/> <moqui.entity.view.DbViewEntityKeyMap joinFromAlias="SI" entityAlias="ST" fieldName="statusTypeId"/> <moqui.entity.view.DbViewEntityAlias entityAlias="SI" fieldAlias="statusId"/> <moqui.entity.view.DbViewEntityAlias entityAlias="SI" fieldAlias="description"/> <moqui.entity.view.DbViewEntityAlias entityAlias="SI" fieldAlias="sequenceNum"/> <moqui.entity.view.DbViewEntityAlias entityAlias="ST" fieldAlias="typeDescription" fieldName="description"/> </moqui.entity.view.DbViewEntity> As you can see the entity and field names correlate with the XML element and attribute names. To use these entities just refer to them by name just like any other entity. Dynamic View Entity Even with the automatic view entity minimize that the Entity Facade does during a find there are still cases where you’ll need or want to build a view programmatically on the fly instead of having a statically defined view entity. To do this get an instance of the EntityDynamicView interface using the EntityFind.makeEntityDynamicView() method. This interface has methods on it that do the same things as the XML elements in a static view entity. Add member entities using the addMemberEntity(String entityAlias, String entityName, String joinFromAlias, Boolean joinOptional, Map<String, String> entityKeyMaps) method. One convenient option that doesn’t exist for static (XML defined) view entities is to join in a member entity based on a relationship definition. To do this use the addRelationshipMember(String entityAlias, String joinFromAlias, String relationshipName, Boolean joinOptional) method. To alias fields use the addAlias(String entityAlias, String name, String field, String function) method, the shortcut variation of it addAlias(String entityAlias, String name), or the addAliasAll(String entityAlias, String prefix) method. You can optionally specify a name for the dynamic view with the setEntityName() method, but usually this mostly useful for debugging and the default name (DynamicView) is usually just fine. Once this is done just specify conditions and doing the find operation as normal on the EntityFind object that you used to create the* EntityDynamicView* object.

```
ec.entity.makeValue("Example").setAll(fields).setSequencedIdPrimary().create()
```

## Reference Files

This skill includes comprehensive documentation in `references/`:

- **applications.md** - Applications documentation
- **framework.md** - Framework documentation
- **getting_started.md** - Getting Started documentation

Use `view` to read specific reference files when detailed information is needed.

## Working with This Skill

### For Beginners
Start with the getting_started or tutorials reference files for foundational concepts.

### For Specific Features
Use the appropriate category reference file (api, guides, etc.) for detailed information.

### For Code Examples
The quick reference section above contains common patterns extracted from the official docs.

## Resources

### references/
Organized documentation extracted from official sources. These files contain:
- Detailed explanations
- Code examples with language annotations
- Links to original documentation
- Table of contents for quick navigation

### scripts/
Add helper scripts here for common automation tasks.

### assets/
Add templates, boilerplate, or example projects here.

## Notes

- This skill was automatically generated from official documentation
- Reference files preserve the structure and examples from source docs
- Code examples include language detection for better syntax highlighting
- Quick reference patterns are extracted from common usage examples in the docs

## Updating

To refresh this skill with updated documentation:
1. Re-run the scraper with the same configuration
2. The skill will be rebuilt with the latest information
