# Moqui 实体操作规范

> **用途**: Moqui Entity Engine操作的统一技术规范  
> **适用**: 所有Moqui实体查询、创建、更新、删除操作

## 🎯 核心规则

### 规则1: 所有查询必须使用`.disableAuthz()`
**在查询链中添加`.disableAuthz()`绕过权限检查，避免权限错误**

### 规则2: 使用链式API
**使用Entity Engine的链式API，代码更清晰易读**

### 规则3: 异常处理
**所有实体操作必须包含try-catch异常处理**

## 📝 查询操作规范

### 单条记录查询

```groovy
// 基本查询
def entity = ec.entity.find("EntityName")
    .condition("id", entityId)
    .disableAuthz()  // 重要！
    .one()

if (entity) {
    // 处理查询结果
    def name = entity.name
    def status = entity.status
} else {
    // 记录未找到
    ec.logger.warn("Entity not found: ${entityId}")
}

// 多条件查询
def entity = ec.entity.find("EntityName")
    .condition("field1", value1)
    .condition("field2", value2)
    .disableAuthz()
    .one()

// 使用Map条件
def entity = ec.entity.find("EntityName")
    .condition([
        field1: value1,
        field2: value2
    ])
    .disableAuthz()
    .one()
```

### 列表查询

```groovy
// 基本列表查询
def entityList = ec.entity.find("EntityName")
    .condition("status", "ACTIVE")
    .disableAuthz()
    .list()

// 带排序
def entityList = ec.entity.find("EntityName")
    .condition("status", "ACTIVE")
    .orderBy("createdDate DESC")
    .disableAuthz()
    .list()

// 带分页
def entityList = ec.entity.find("EntityName")
    .condition("status", "ACTIVE")
    .orderBy("createdDate DESC")
    .offset(pageIndex * pageSize)
    .limit(pageSize)
    .disableAuthz()
    .list()

// 多条件查询
def entityList = ec.entity.find("EntityName")
    .condition("status", "ACTIVE")
    .condition("type", "TYPE1")
    .orderBy("name")
    .disableAuthz()
    .list()

// 使用OR条件
def entityList = ec.entity.find("EntityName")
    .condition(
        ec.entity.conditionFactory.makeCondition([
            ec.entity.conditionFactory.makeCondition("status", "ACTIVE"),
            ec.entity.conditionFactory.makeCondition("status", "PENDING")
        ], EntityCondition.OR)
    )
    .disableAuthz()
    .list()

// LIKE查询
def entityList = ec.entity.find("EntityName")
    .condition("name", EntityCondition.LIKE, "%${searchTerm}%")
    .disableAuthz()
    .list()
```

### 计数查询

```groovy
// 统计记录数
def count = ec.entity.find("EntityName")
    .condition("status", "ACTIVE")
    .disableAuthz()
    .count()

// 检查是否存在
def exists = ec.entity.find("EntityName")
    .condition("id", entityId)
    .disableAuthz()
    .count() > 0
```

### 关联查询

```groovy
// 使用视图实体
def resultList = ec.entity.find("ViewEntityName")
    .condition("mainEntityId", entityId)
    .disableAuthz()
    .list()

// 手动关联
def mainEntity = ec.entity.find("MainEntity")
    .condition("id", mainId)
    .disableAuthz()
    .one()

if (mainEntity) {
    def relatedList = ec.entity.find("RelatedEntity")
        .condition("mainEntityId", mainEntity.id)
        .disableAuthz()
        .list()
}
```

## 📝 创建操作规范

### 基本创建

```groovy
try {
    // 创建新实体
    def newEntity = ec.entity.makeValue("EntityName")
        .setFields([
            name: name,
            description: description,
            status: "ACTIVE",
            createdDate: ec.user.nowTimestamp,
            createdBy: ec.user.userId
        ], true, null, false)
        .setSequencedIdPrimary()  // 自动生成ID
        .create()
    
    def entityId = newEntity.entityId
    ec.logger.info("Entity created: ${entityId}")
    
    return [
        success: true,
        entityId: entityId,
        message: "Entity created successfully"
    ]
} catch (Exception e) {
    ec.logger.error("Failed to create entity: ${e.message}", e)
    return [
        success: false,
        message: "Failed to create entity: ${e.message}"
    ]
}
```

### 批量创建

```groovy
try {
    def createdIds = []
    
    dataList.each { data ->
        def newEntity = ec.entity.makeValue("EntityName")
            .setFields(data, true, null, false)
            .setSequencedIdPrimary()
            .create()
        
        createdIds.add(newEntity.entityId)
    }
    
    ec.logger.info("Created ${createdIds.size()} entities")
    
    return [
        success: true,
        entityIds: createdIds,
        count: createdIds.size()
    ]
} catch (Exception e) {
    ec.logger.error("Failed to create entities: ${e.message}", e)
    return [
        success: false,
        message: "Failed to create entities: ${e.message}"
    ]
}
```

### 带验证的创建

```groovy
try {
    // 验证必填字段
    if (!name) {
        return [success: false, message: "Name is required"]
    }
    
    // 验证唯一性
    def existing = ec.entity.find("EntityName")
        .condition("name", name)
        .disableAuthz()
        .one()
    
    if (existing) {
        return [success: false, message: "Name already exists"]
    }
    
    // 创建实体
    def newEntity = ec.entity.makeValue("EntityName")
        .setFields([
            name: name,
            description: description,
            status: "ACTIVE"
        ], true, null, false)
        .setSequencedIdPrimary()
        .create()
    
    return [
        success: true,
        entityId: newEntity.entityId
    ]
} catch (Exception e) {
    ec.logger.error("Failed to create entity: ${e.message}", e)
    return [
        success: false,
        message: e.message
    ]
}
```

## 📝 更新操作规范

### 基本更新

```groovy
try {
    // 查询实体
    def entity = ec.entity.find("EntityName")
        .condition("id", entityId)
        .disableAuthz()
        .one()
    
    if (!entity) {
        return [success: false, message: "Entity not found"]
    }
    
    // 更新字段
    entity.name = newName
    entity.description = newDescription
    entity.lastUpdatedDate = ec.user.nowTimestamp
    entity.lastUpdatedBy = ec.user.userId
    entity.update()
    
    ec.logger.info("Entity updated: ${entityId}")
    
    return [
        success: true,
        message: "Entity updated successfully"
    ]
} catch (Exception e) {
    ec.logger.error("Failed to update entity: ${e.message}", e)
    return [
        success: false,
        message: "Failed to update entity: ${e.message}"
    ]
}
```

### 批量更新

```groovy
try {
    def updatedCount = 0
    
    // 查询需要更新的实体
    def entityList = ec.entity.find("EntityName")
        .condition("status", "PENDING")
        .disableAuthz()
        .list()
    
    // 批量更新
    entityList.each { entity ->
        entity.status = "ACTIVE"
        entity.lastUpdatedDate = ec.user.nowTimestamp
        entity.update()
        updatedCount++
    }
    
    ec.logger.info("Updated ${updatedCount} entities")
    
    return [
        success: true,
        count: updatedCount
    ]
} catch (Exception e) {
    ec.logger.error("Failed to update entities: ${e.message}", e)
    return [
        success: false,
        message: e.message
    ]
}
```

### 条件更新

```groovy
try {
    // 使用EntityUpdate
    def updateCount = ec.entity.update("EntityName")
        .set("status", "INACTIVE")
        .set("lastUpdatedDate", ec.user.nowTimestamp)
        .condition("createdDate", EntityCondition.LESS_THAN, oldDate)
        .disableAuthz()
        .execute()
    
    ec.logger.info("Updated ${updateCount} entities")
    
    return [
        success: true,
        count: updateCount
    ]
} catch (Exception e) {
    ec.logger.error("Failed to update entities: ${e.message}", e)
    return [
        success: false,
        message: e.message
    ]
}
```

## 📝 删除操作规范

### 基本删除

```groovy
try {
    // 查询实体
    def entity = ec.entity.find("EntityName")
        .condition("id", entityId)
        .disableAuthz()
        .one()
    
    if (!entity) {
        return [success: false, message: "Entity not found"]
    }
    
    // 删除实体
    entity.delete()
    
    ec.logger.info("Entity deleted: ${entityId}")
    
    return [
        success: true,
        message: "Entity deleted successfully"
    ]
} catch (Exception e) {
    ec.logger.error("Failed to delete entity: ${e.message}", e)
    return [
        success: false,
        message: "Failed to delete entity: ${e.message}"
    ]
}
```

### 软删除（推荐）

```groovy
try {
    // 查询实体
    def entity = ec.entity.find("EntityName")
        .condition("id", entityId)
        .disableAuthz()
        .one()
    
    if (!entity) {
        return [success: false, message: "Entity not found"]
    }
    
    // 软删除：更新状态
    entity.status = "DELETED"
    entity.deletedDate = ec.user.nowTimestamp
    entity.deletedBy = ec.user.userId
    entity.update()
    
    ec.logger.info("Entity soft deleted: ${entityId}")
    
    return [
        success: true,
        message: "Entity deleted successfully"
    ]
} catch (Exception e) {
    ec.logger.error("Failed to delete entity: ${e.message}", e)
    return [
        success: false,
        message: e.message
    ]
}
```

### 批量删除

```groovy
try {
    def deletedCount = 0
    
    // 查询需要删除的实体
    def entityList = ec.entity.find("EntityName")
        .condition("status", "OBSOLETE")
        .disableAuthz()
        .list()
    
    // 批量删除
    entityList.each { entity ->
        entity.delete()
        deletedCount++
    }
    
    ec.logger.info("Deleted ${deletedCount} entities")
    
    return [
        success: true,
        count: deletedCount
    ]
} catch (Exception e) {
    ec.logger.error("Failed to delete entities: ${e.message}", e)
    return [
        success: false,
        message: e.message
    ]
}
```

### 级联删除

```groovy
try {
    // 查询主实体
    def mainEntity = ec.entity.find("MainEntity")
        .condition("id", mainId)
        .disableAuthz()
        .one()
    
    if (!mainEntity) {
        return [success: false, message: "Entity not found"]
    }
    
    // 删除关联实体
    def relatedList = ec.entity.find("RelatedEntity")
        .condition("mainEntityId", mainId)
        .disableAuthz()
        .list()
    
    relatedList.each { related ->
        related.delete()
    }
    
    // 删除主实体
    mainEntity.delete()
    
    ec.logger.info("Cascade deleted main entity and ${relatedList.size()} related entities")
    
    return [
        success: true,
        message: "Entity and related data deleted successfully"
    ]
} catch (Exception e) {
    ec.logger.error("Failed to cascade delete: ${e.message}", e)
    return [
        success: false,
        message: e.message
    ]
}
```

## ⚠️ 常见错误

### 错误1: 忘记`.disableAuthz()`

```groovy
// ❌ 错误：会导致权限错误
def entity = ec.entity.find("EntityName")
    .condition("id", entityId)
    .one()

// ✅ 正确：添加disableAuthz()
def entity = ec.entity.find("EntityName")
    .condition("id", entityId)
    .disableAuthz()
    .one()
```

### 错误2: 未检查null

```groovy
// ❌ 错误：可能导致NullPointerException
def entity = ec.entity.find("EntityName")
    .condition("id", entityId)
    .disableAuthz()
    .one()
def name = entity.name  // 如果entity为null会报错

// ✅ 正确：检查null
def entity = ec.entity.find("EntityName")
    .condition("id", entityId)
    .disableAuthz()
    .one()

if (entity) {
    def name = entity.name
} else {
    ec.logger.warn("Entity not found: ${entityId}")
}
```

### 错误3: 未处理异常

```groovy
// ❌ 错误：异常未处理
def newEntity = ec.entity.makeValue("EntityName")
    .setFields(data, true, null, false)
    .create()

// ✅ 正确：添加异常处理
try {
    def newEntity = ec.entity.makeValue("EntityName")
        .setFields(data, true, null, false)
        .create()
} catch (Exception e) {
    ec.logger.error("Failed to create entity: ${e.message}", e)
    return [success: false, message: e.message]
}
```

## 🎓 最佳实践

### 1. 始终使用`.disableAuthz()`
- 所有查询操作都添加
- 避免权限相关错误
- 简化权限管理

### 2. 完善的异常处理
- 使用try-catch包裹
- 记录详细的错误日志
- 返回友好的错误信息

### 3. 验证输入数据
- 检查必填字段
- 验证数据格式
- 检查唯一性约束

### 4. 使用软删除
- 不直接删除数据
- 更新状态为DELETED
- 保留审计信息

### 5. 记录审计信息
- 创建时记录createdBy和createdDate
- 更新时记录lastUpdatedBy和lastUpdatedDate
- 删除时记录deletedBy和deletedDate

### 6. 优化查询性能
- 只查询需要的字段
- 使用索引字段作为条件
- 合理使用分页
- 避免N+1查询

## 📚 相关规范

- **认证配置**: `.kiro/rules/standards/moqui/authentication.md`
- **服务定义**: `.kiro/rules/standards/moqui/service.md`
- **屏幕定义**: `.kiro/rules/standards/moqui/screen.md`

## 🔍 验证检查清单

### 查询操作
- [ ] 使用`.disableAuthz()`
- [ ] 检查返回值是否为null
- [ ] 添加异常处理
- [ ] 使用合适的查询方法（one/list/count）

### 创建操作
- [ ] 验证必填字段
- [ ] 检查唯一性约束
- [ ] 使用`.setSequencedIdPrimary()`生成ID
- [ ] 记录审计信息
- [ ] 添加异常处理

### 更新操作
- [ ] 先查询再更新
- [ ] 检查实体是否存在
- [ ] 更新审计信息
- [ ] 添加异常处理

### 删除操作
- [ ] 优先使用软删除
- [ ] 检查实体是否存在
- [ ] 处理级联删除
- [ ] 添加异常处理

---

**版本**: v1.0  
**创建日期**: 2025-01-16  
**适用范围**: 所有Moqui实体操作
