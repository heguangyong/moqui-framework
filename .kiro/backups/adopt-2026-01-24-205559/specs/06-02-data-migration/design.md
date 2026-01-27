# 移除 Mock 数据 - 技术设计

## 数据模型设计

### 1. 工作流实体 (Workflow)

```xml
<entity entity-name="Workflow" package="novel.anime">
    <field name="workflowId" type="id" is-pk="true"/>
    <field name="projectId" type="id"/>
    <field name="userId" type="id"/>
    <field name="name" type="text-medium"/>
    <field name="description" type="text-long"/>
    <field name="status" type="text-short"/>  <!-- idle, running, completed, error -->
    <field name="nodesJson" type="text-very-long"/>
    <field name="connectionsJson" type="text-very-long"/>
    <field name="createdDate" type="date-time"/>
    <field name="lastUpdatedDate" type="date-time"/>
</entity>
```

### 2. 工作流执行记录实体 (WorkflowExecution)

```xml
<entity entity-name="WorkflowExecution" package="novel.anime">
    <field name="executionId" type="id" is-pk="true"/>
    <field name="workflowId" type="id"/>
    <field name="workflowName" type="text-medium"/>
    <field name="status" type="text-short"/>  <!-- running, success, failed, cancelled -->
    <field name="startTime" type="date-time"/>
    <field name="endTime" type="date-time"/>
    <field name="duration" type="number-integer"/>
    <field name="nodeCount" type="number-integer"/>
    <field name="logsJson" type="text-very-long"/>
    <field name="createdDate" type="date-time"/>
</entity>
```

### 3. 工作流模板实体 (WorkflowTemplate)

```xml
<entity entity-name="WorkflowTemplate" package="novel.anime">
    <field name="templateId" type="id" is-pk="true"/>
    <field name="userId" type="id"/>  <!-- null for built-in -->
    <field name="name" type="text-medium"/>
    <field name="description" type="text-long"/>
    <field name="isBuiltIn" type="text-indicator"/>
    <field name="nodeCount" type="number-integer"/>
    <field name="estimatedTime" type="text-short"/>
    <field name="useCase" type="text-medium"/>
    <field name="nodesJson" type="text-very-long"/>
    <field name="connectionsJson" type="text-very-long"/>
    <field name="createdDate" type="date-time"/>
    <field name="lastUpdatedDate" type="date-time"/>
</entity>
```

### 4. 用户设置实体 (UserSettings)

```xml
<entity entity-name="UserSettings" package="novel.anime.user">
    <field name="userId" type="id" is-pk="true"/>
    <field name="theme" type="text-short"/>
    <field name="language" type="text-short"/>
    <field name="notificationEmail" type="text-indicator"/>
    <field name="notificationPush" type="text-indicator"/>
    <field name="defaultWorkflowTemplate" type="id"/>
    <field name="autoSave" type="text-indicator"/>
    <field name="createdDate" type="date-time"/>
    <field name="lastUpdatedDate" type="date-time"/>
</entity>
```

## 服务设计

### WorkflowServices.xml

| 服务名 | 描述 |
|--------|------|
| get#Workflows | 获取工作流列表，支持 projectId/userId/status 过滤 |
| get#Workflow | 获取单个工作流详情 |
| create#Workflow | 创建工作流 |
| update#Workflow | 更新工作流 |
| delete#Workflow | 删除工作流及关联执行记录 |
| get#WorkflowExecutions | 获取执行记录列表 |
| get#WorkflowExecution | 获取单个执行记录 |
| create#WorkflowExecution | 创建执行记录 |
| update#WorkflowExecution | 更新执行状态 |
| get#WorkflowTemplates | 获取模板列表 |
| get#WorkflowTemplate | 获取单个模板 |
| create#WorkflowTemplate | 创建模板 |
| update#WorkflowTemplate | 更新模板 |
| delete#WorkflowTemplate | 删除模板（仅用户模板） |

### AssetServices.xml

| 服务名 | 描述 |
|--------|------|
| get#Assets | 获取资源列表，支持 projectId/type 过滤 |
| get#Asset | 获取单个资源详情 |
| create#Asset | 创建资源记录 |
| delete#Asset | 删除资源 |

### UserServices.xml (扩展)

| 服务名 | 描述 |
|--------|------|
| get#UserSettings | 获取用户设置 |
| update#UserSettings | 更新用户设置 |

## 前端修改

完成后端接口后，需要更新以下前端文件：

1. `api.ts` - 添加新的 API 方法
2. `WorkflowEditor.vue` - 使用后端 API 替代 localStorage
3. `WorkflowDetailView.vue` - 从后端加载工作流详情
4. `WorkflowExecutionsView.vue` - 从后端加载执行记录
5. `WorkflowTemplatesView.vue` - 从后端加载模板
6. `AssetsView.vue` - 使用统一的资源 API
7. `Settings.vue` - 使用用户配置 API
