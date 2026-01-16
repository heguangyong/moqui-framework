# Moqui 服务定义规范

> **用途**: Moqui服务定义的统一技术规范  
> **适用**: 所有Moqui Service定义和实现

## 🎯 核心规则

### 规则1: 使用`authenticate`属性控制认证
**Service使用`authenticate`属性，不要使用`require-authentication`**

### 规则2: 明确定义输入输出参数
**所有参数必须明确定义类型和是否必填**

### 规则3: 完善的错误处理
**所有Service必须包含try-catch异常处理**

### 规则4: 返回统一的响应格式
**返回包含success、message、data的统一格式**

## 📝 基本Service结构

### 标准Service模板

```xml
<service verb="action" noun="EntityName" authenticate="false" allow-remote="true">
    <description>服务描述</description>
    
    <!-- 输入参数 -->
    <in-parameters>
        <parameter name="paramName" type="String" required="true"/>
        <parameter name="optionalParam" type="String" required="false"/>
    </in-parameters>
    
    <!-- 输出参数 -->
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
        <parameter name="data" type="Map"/>
    </out-parameters>
    
    <!-- 实现逻辑 -->
    <actions>
        <script><![CDATA[
            try {
                // 业务逻辑
                
                success = true
                message = "Operation successful"
                data = [:]
            } catch (Exception e) {
                ec.logger.error("Service error: ${e.message}", e)
                success = false
                message = "Operation failed: ${e.message}"
                data = [:]
            }
        ]]></script>
    </actions>
</service>
```

## 📝 查询Service

### 单条记录查询

```xml
<service verb="get" noun="Entity" authenticate="false" allow-remote="true">
    <description>获取单条记录</description>
    
    <in-parameters>
        <parameter name="entityId" required="true"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
        <parameter name="entity" type="Map"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                def entityValue = ec.entity.find("EntityName")
                    .condition("entityId", entityId)
                    .disableAuthz()
                    .one()
                
                if (entityValue) {
                    success = true
                    message = "Entity found"
                    entity = entityValue.getMap()
                } else {
                    success = false
                    message = "Entity not found"
                    entity = [:]
                }
            } catch (Exception e) {
                ec.logger.error("Failed to get entity: ${e.message}", e)
                success = false
                message = "Failed to get entity: ${e.message}"
                entity = [:]
            }
        ]]></script>
    </actions>
</service>
```

### 列表查询

```xml
<service verb="get" noun="EntityList" authenticate="false" allow-remote="true">
    <description>获取记录列表</description>
    
    <in-parameters>
        <parameter name="status" required="false"/>
        <parameter name="searchTerm" required="false"/>
        <parameter name="pageIndex" type="Integer" default="0"/>
        <parameter name="pageSize" type="Integer" default="20"/>
        <parameter name="orderBy" default="createdDate DESC"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
        <parameter name="entityList" type="List"/>
        <parameter name="totalCount" type="Long"/>
        <parameter name="pageIndex" type="Integer"/>
        <parameter name="pageSize" type="Integer"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                // 构建查询
                def finder = ec.entity.find("EntityName")
                
                // 添加条件
                if (status) {
                    finder.condition("status", status)
                }
                
                if (searchTerm) {
                    finder.condition("name", EntityCondition.LIKE, "%${searchTerm}%")
                }
                
                // 获取总数
                totalCount = finder.disableAuthz().count()
                
                // 分页查询
                entityList = finder
                    .orderBy(orderBy)
                    .offset(pageIndex * pageSize)
                    .limit(pageSize)
                    .disableAuthz()
                    .list()
                    .collect { it.getMap() }
                
                success = true
                message = "Query successful"
            } catch (Exception e) {
                ec.logger.error("Failed to get entity list: ${e.message}", e)
                success = false
                message = "Failed to get entity list: ${e.message}"
                entityList = []
                totalCount = 0
            }
        ]]></script>
    </actions>
</service>
```

## 📝 创建Service

### 基本创建

```xml
<service verb="create" noun="Entity" authenticate="true" allow-remote="true">
    <description>创建记录</description>
    
    <in-parameters>
        <parameter name="name" required="true"/>
        <parameter name="description" required="false"/>
        <parameter name="type" required="true"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
        <parameter name="entityId" type="String"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                // 验证必填字段
                if (!name) {
                    success = false
                    message = "Name is required"
                    return
                }
                
                // 验证唯一性
                def existing = ec.entity.find("EntityName")
                    .condition("name", name)
                    .disableAuthz()
                    .one()
                
                if (existing) {
                    success = false
                    message = "Name already exists"
                    return
                }
                
                // 创建实体
                def newEntity = ec.entity.makeValue("EntityName")
                    .setFields([
                        name: name,
                        description: description,
                        type: type,
                        status: "ACTIVE",
                        createdDate: ec.user.nowTimestamp,
                        createdBy: ec.user.userId
                    ], true, null, false)
                    .setSequencedIdPrimary()
                    .create()
                
                entityId = newEntity.entityId
                success = true
                message = "Entity created successfully"
                
                ec.logger.info("Entity created: ${entityId}")
            } catch (Exception e) {
                ec.logger.error("Failed to create entity: ${e.message}", e)
                success = false
                message = "Failed to create entity: ${e.message}"
                entityId = null
            }
        ]]></script>
    </actions>
</service>
```

### 批量创建

```xml
<service verb="create" noun="EntityBatch" authenticate="true" allow-remote="true">
    <description>批量创建记录</description>
    
    <in-parameters>
        <parameter name="entityList" type="List" required="true"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
        <parameter name="createdIds" type="List"/>
        <parameter name="createdCount" type="Integer"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                createdIds = []
                
                entityList.each { data ->
                    def newEntity = ec.entity.makeValue("EntityName")
                        .setFields(data, true, null, false)
                        .set("createdDate", ec.user.nowTimestamp)
                        .set("createdBy", ec.user.userId)
                        .setSequencedIdPrimary()
                        .create()
                    
                    createdIds.add(newEntity.entityId)
                }
                
                createdCount = createdIds.size()
                success = true
                message = "Created ${createdCount} entities"
                
                ec.logger.info("Batch created ${createdCount} entities")
            } catch (Exception e) {
                ec.logger.error("Failed to batch create: ${e.message}", e)
                success = false
                message = "Failed to batch create: ${e.message}"
                createdIds = []
                createdCount = 0
            }
        ]]></script>
    </actions>
</service>
```

## 📝 更新Service

### 基本更新

```xml
<service verb="update" noun="Entity" authenticate="true" allow-remote="true">
    <description>更新记录</description>
    
    <in-parameters>
        <parameter name="entityId" required="true"/>
        <parameter name="name" required="false"/>
        <parameter name="description" required="false"/>
        <parameter name="status" required="false"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                // 查询实体
                def entity = ec.entity.find("EntityName")
                    .condition("entityId", entityId)
                    .disableAuthz()
                    .one()
                
                if (!entity) {
                    success = false
                    message = "Entity not found"
                    return
                }
                
                // 更新字段
                if (name) entity.name = name
                if (description) entity.description = description
                if (status) entity.status = status
                
                entity.lastUpdatedDate = ec.user.nowTimestamp
                entity.lastUpdatedBy = ec.user.userId
                entity.update()
                
                success = true
                message = "Entity updated successfully"
                
                ec.logger.info("Entity updated: ${entityId}")
            } catch (Exception e) {
                ec.logger.error("Failed to update entity: ${e.message}", e)
                success = false
                message = "Failed to update entity: ${e.message}"
            }
        ]]></script>
    </actions>
</service>
```

### 批量更新

```xml
<service verb="update" noun="EntityBatch" authenticate="true" allow-remote="true">
    <description>批量更新记录</description>
    
    <in-parameters>
        <parameter name="entityIds" type="List" required="true"/>
        <parameter name="status" required="true"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
        <parameter name="updatedCount" type="Integer"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                updatedCount = 0
                
                entityIds.each { entityId ->
                    def entity = ec.entity.find("EntityName")
                        .condition("entityId", entityId)
                        .disableAuthz()
                        .one()
                    
                    if (entity) {
                        entity.status = status
                        entity.lastUpdatedDate = ec.user.nowTimestamp
                        entity.lastUpdatedBy = ec.user.userId
                        entity.update()
                        updatedCount++
                    }
                }
                
                success = true
                message = "Updated ${updatedCount} entities"
                
                ec.logger.info("Batch updated ${updatedCount} entities")
            } catch (Exception e) {
                ec.logger.error("Failed to batch update: ${e.message}", e)
                success = false
                message = "Failed to batch update: ${e.message}"
                updatedCount = 0
            }
        ]]></script>
    </actions>
</service>
```

## 📝 删除Service

### 软删除（推荐）

```xml
<service verb="delete" noun="Entity" authenticate="true" allow-remote="true">
    <description>删除记录（软删除）</description>
    
    <in-parameters>
        <parameter name="entityId" required="true"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                // 查询实体
                def entity = ec.entity.find("EntityName")
                    .condition("entityId", entityId)
                    .disableAuthz()
                    .one()
                
                if (!entity) {
                    success = false
                    message = "Entity not found"
                    return
                }
                
                // 软删除：更新状态
                entity.status = "DELETED"
                entity.deletedDate = ec.user.nowTimestamp
                entity.deletedBy = ec.user.userId
                entity.update()
                
                success = true
                message = "Entity deleted successfully"
                
                ec.logger.info("Entity soft deleted: ${entityId}")
            } catch (Exception e) {
                ec.logger.error("Failed to delete entity: ${e.message}", e)
                success = false
                message = "Failed to delete entity: ${e.message}"
            }
        ]]></script>
    </actions>
</service>
```

### 物理删除

```xml
<service verb="remove" noun="Entity" authenticate="true" allow-remote="true">
    <description>物理删除记录</description>
    
    <in-parameters>
        <parameter name="entityId" required="true"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                // 查询实体
                def entity = ec.entity.find("EntityName")
                    .condition("entityId", entityId)
                    .disableAuthz()
                    .one()
                
                if (!entity) {
                    success = false
                    message = "Entity not found"
                    return
                }
                
                // 物理删除
                entity.delete()
                
                success = true
                message = "Entity removed successfully"
                
                ec.logger.info("Entity physically deleted: ${entityId}")
            } catch (Exception e) {
                ec.logger.error("Failed to remove entity: ${e.message}", e)
                success = false
                message = "Failed to remove entity: ${e.message}"
            }
        ]]></script>
    </actions>
</service>
```

## 📝 复杂Service

### 事务处理

```xml
<service verb="process" noun="ComplexOperation" authenticate="true" allow-remote="true">
    <description>复杂事务处理</description>
    
    <in-parameters>
        <parameter name="data" type="Map" required="true"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
        <parameter name="result" type="Map"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                // 开始事务（Moqui自动管理）
                
                // 步骤1: 创建主记录
                def mainEntity = ec.entity.makeValue("MainEntity")
                    .setFields(data.main, true, null, false)
                    .setSequencedIdPrimary()
                    .create()
                
                def mainId = mainEntity.mainEntityId
                
                // 步骤2: 创建关联记录
                data.details.each { detail ->
                    ec.entity.makeValue("DetailEntity")
                        .setFields(detail, true, null, false)
                        .set("mainEntityId", mainId)
                        .setSequencedIdPrimary()
                        .create()
                }
                
                // 步骤3: 更新统计
                ec.service.sync().name("update#Statistics")
                    .parameter("mainEntityId", mainId)
                    .call()
                
                success = true
                message = "Operation completed successfully"
                result = [mainEntityId: mainId]
                
                ec.logger.info("Complex operation completed: ${mainId}")
            } catch (Exception e) {
                ec.logger.error("Complex operation failed: ${e.message}", e)
                success = false
                message = "Operation failed: ${e.message}"
                result = [:]
                // 事务会自动回滚
            }
        ]]></script>
    </actions>
</service>
```

### 调用其他Service

```xml
<service verb="process" noun="WithServiceCall" authenticate="true" allow-remote="true">
    <description>调用其他Service</description>
    
    <in-parameters>
        <parameter name="entityId" required="true"/>
    </in-parameters>
    
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
    </out-parameters>
    
    <actions>
        <script><![CDATA[
            try {
                // 同步调用Service
                def result = ec.service.sync()
                    .name("your.component.get#Entity")
                    .parameter("entityId", entityId)
                    .call()
                
                if (!result.success) {
                    success = false
                    message = result.message
                    return
                }
                
                // 处理结果
                def entity = result.entity
                
                // 异步调用Service
                ec.service.async()
                    .name("your.component.notify#User")
                    .parameter("userId", entity.userId)
                    .parameter("message", "Entity processed")
                    .call()
                
                success = true
                message = "Processing completed"
            } catch (Exception e) {
                ec.logger.error("Service call failed: ${e.message}", e)
                success = false
                message = "Processing failed: ${e.message}"
            }
        ]]></script>
    </actions>
</service>
```

## ⚠️ 常见错误

### 错误1: 使用错误的认证属性

```xml
<!-- ❌ 错误：Service不能使用require-authentication -->
<service verb="get" noun="Data" require-authentication="false">
    <!-- 这会导致认证错误 -->
</service>

<!-- ✅ 正确：Service使用authenticate -->
<service verb="get" noun="Data" authenticate="false" allow-remote="true">
    <description>正确的认证配置</description>
</service>
```

### 错误2: 未定义输出参数

```xml
<!-- ❌ 错误：未定义输出参数 -->
<service verb="get" noun="Data">
    <actions>
        <script><![CDATA[
            success = true  // 未定义的参数
        ]]></script>
    </actions>
</service>

<!-- ✅ 正确：明确定义输出参数 -->
<service verb="get" noun="Data">
    <out-parameters>
        <parameter name="success" type="Boolean"/>
    </out-parameters>
    <actions>
        <script><![CDATA[
            success = true
        ]]></script>
    </actions>
</service>
```

### 错误3: 未处理异常

```xml
<!-- ❌ 错误：未处理异常 -->
<service verb="create" noun="Entity">
    <actions>
        <script><![CDATA[
            def entity = ec.entity.makeValue("EntityName").create()
        ]]></script>
    </actions>
</service>

<!-- ✅ 正确：添加异常处理 -->
<service verb="create" noun="Entity">
    <out-parameters>
        <parameter name="success" type="Boolean"/>
        <parameter name="message" type="String"/>
    </out-parameters>
    <actions>
        <script><![CDATA[
            try {
                def entity = ec.entity.makeValue("EntityName").create()
                success = true
                message = "Created successfully"
            } catch (Exception e) {
                ec.logger.error("Failed: ${e.message}", e)
                success = false
                message = e.message
            }
        ]]></script>
    </actions>
</service>
```

## 🎓 最佳实践

### 1. 统一的响应格式
- 始终返回success、message
- 成功时返回data
- 失败时返回详细的错误信息

### 2. 完善的参数定义
- 明确参数类型
- 标记是否必填
- 提供默认值

### 3. 完善的错误处理
- 使用try-catch包裹
- 记录详细的错误日志
- 返回友好的错误信息

### 4. 合理的认证配置
- 公开API使用`authenticate="false"`
- 私有API使用`authenticate="true"`
- 设置`allow-remote="true"`允许远程调用

### 5. 记录审计日志
- 记录关键操作
- 包含用户信息
- 包含时间戳

## 📚 相关规范

- **认证配置**: `.kiro/rules/standards/moqui/authentication.md`
- **实体操作**: `.kiro/rules/standards/moqui/entity.md`
- **屏幕定义**: `.kiro/rules/standards/moqui/screen.md`

## 🔍 验证检查清单

### Service定义
- [ ] 使用`authenticate`属性（不是`require-authentication`）
- [ ] 设置`allow-remote="true"`
- [ ] 提供清晰的description

### 参数定义
- [ ] 明确定义in-parameters
- [ ] 明确定义out-parameters
- [ ] 标记required属性
- [ ] 指定参数类型

### 实现逻辑
- [ ] 添加try-catch异常处理
- [ ] 验证输入参数
- [ ] 使用`.disableAuthz()`查询实体
- [ ] 记录审计日志
- [ ] 返回统一的响应格式

---

**版本**: v1.0  
**创建日期**: 2025-01-16  
**适用范围**: 所有Moqui Service定义
