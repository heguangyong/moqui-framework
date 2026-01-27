# 移除 Mock 数据 - 实现任务

## 后端任务

### Task 1: 添加实体定义
- [x] 1.1 在 NovelAnimeEntities.xml 添加 Workflow 实体
- [x] 1.2 添加 WorkflowExecution 实体
- [x] 1.3 添加 WorkflowTemplate 实体
- [x] 1.4 添加 UserSettings 实体

### Task 2: 创建工作流服务
- [x] 2.1 创建 WorkflowServices.xml
- [x] 2.2 实现 get#Workflows 服务
- [x] 2.3 实现 get#Workflow 服务
- [x] 2.4 实现 create#Workflow 服务
- [x] 2.5 实现 update#Workflow 服务
- [x] 2.6 实现 delete#Workflow 服务
- [x] 2.7 实现 get#WorkflowExecutions 服务
- [x] 2.8 实现 get#WorkflowExecution 服务
- [x] 2.9 实现 create#WorkflowExecution 服务
- [x] 2.10 实现 update#WorkflowExecution 服务
- [x] 2.11 实现 get#WorkflowTemplates 服务
- [x] 2.12 实现 get#WorkflowTemplate 服务
- [x] 2.13 实现 create#WorkflowTemplate 服务
- [x] 2.14 实现 update#WorkflowTemplate 服务
- [x] 2.15 实现 delete#WorkflowTemplate 服务

### Task 3: 扩展资源服务
- [x] 3.1 创建/扩展 AssetServices.xml
- [x] 3.2 实现 get#Assets 服务
- [x] 3.3 实现 get#Asset 服务
- [x] 3.4 实现 create#Asset 服务
- [x] 3.5 实现 delete#Asset 服务

### Task 4: 用户设置服务
- [x] 4.1 扩展 UserServices.xml
- [x] 4.2 实现 get#UserSettings 服务
- [x] 4.3 实现 update#UserSettings 服务

### Task 5: REST API 端点
- [x] 5.1 在 novel-anime.rest.xml 添加工作流端点
- [x] 5.2 添加工作流执行记录端点
- [x] 5.3 添加工作流模板端点
- [x] 5.4 添加资源管理端点
- [x] 5.5 添加用户设置端点

## 前端任务

### Task 6: API 层更新
- [x] 6.1 在 api.ts 添加工作流 API 方法
- [x] 6.2 添加执行记录 API 方法
- [x] 6.3 添加模板 API 方法
- [x] 6.4 添加资源 API 方法
- [x] 6.5 添加用户设置 API 方法

### Task 7: 视图组件更新
- [x] 7.1 更新 WorkflowEditor.vue 使用后端 API
- [x] 7.2 更新 WorkflowDetailView.vue
- [x] 7.3 更新 WorkflowExecutionsView.vue
- [x] 7.4 更新 WorkflowTemplatesView.vue
- [x] 7.5 更新 AssetsView.vue
- [x] 7.6 更新 AssetCategoryView.vue
- [x] 7.7 更新 Settings.vue

### Task 8: 移除 Mock 数据
- [x] 8.1 移除 api.ts 中的 mock 数据 (无需移除，只有注释)
- [x] 8.2 移除各视图组件中的 mock 数据 (内置模板保留作为默认数据)
- [x] 8.3 清理 localStorage 相关代码 (保留作为后端不可用时的回退方案)
