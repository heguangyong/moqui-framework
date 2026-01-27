# Issue: 点击工作流跳转到登录页

**日期**: 2026-01-21  
**状态**: 🔍 调查中

---

## 问题描述

用户在人工测试时发现：
1. 工作流生成完成后
2. 点击中间面板中的对应工作流
3. 出现错误并自动跳转到登录页面

## 错误信息

从控制台日志可以看到：
```
Request failed with status code 404
Auth required, redirecting to login
Navigation allowed
```

## 问题分析

### 错误流程

1. 用户点击中间面板的工作流
2. `WorkflowContextPanel.handleWorkflowClick()` 被调用
3. `workflowStore.selectWorkflow(workflow.id)` 被调用
4. 导航到 WorkflowEditor 页面
5. WorkflowEditor 尝试加载工作流详情（可能触发 API 调用）
6. API 返回 404 错误
7. 错误拦截器检测到 401/404，触发认证检查
8. 跳转到登录页

### 可能的根本原因

#### 1. 工作流 ID 不匹配
- 前端创建的工作流 ID 格式：`workflow_${timestamp}_${random}`
- 后端期望的 ID 格式可能不同
- 或者工作流没有正确保存到后端

#### 2. API 路径问题
- `GET /workflow?workflowId=xxx` 可能不是正确的端点
- 后端可能期望 `GET /workflow/{workflowId}`

#### 3. 工作流未保存
- 工作流在前端创建后没有正确保存到后端
- 导致后端数据库中不存在该工作流

#### 4. 认证问题
- 工作流 API 需要认证
- 但认证 token 可能已过期或无效

---

## 诊断步骤

### 1. 检查工作流 ID
```javascript
// 在控制台执行
const workflowStore = useWorkflowStore();
console.log('Workflows:', workflowStore.workflows);
console.log('Current workflow ID:', workflowStore.currentWorkflowId);
```

### 2. 检查 API 调用
在 `api.ts` 的 `getWorkflow` 方法中添加日志：
```typescript
async getWorkflow(workflowId: string) {
  console.log('🔍 Getting workflow:', workflowId);
  try {
    const response = await this.axiosInstance.get('/workflow', {
      params: { workflowId }
    });
    console.log('✅ Workflow response:', response.data);
    return { success: true, workflow: response.data.workflow };
  } catch (error: any) {
    console.error('❌ Get workflow failed:', error.response?.status, error.response?.data);
    return { success: false, message: error.message };
  }
}
```

### 3. 检查后端日志
查看后端服务器的日志，确认：
- 是否收到了 GET /workflow 请求
- 请求的参数是什么
- 为什么返回 404

### 4. 检查工作流保存
在 `createWorkflowForProject` 方法中添加日志：
```typescript
// 7. 保存到后端
console.log('💾 Saving workflow to backend:', workflow.id);
const saveResult = await this.saveWorkflow(workflow.id);
console.log('💾 Save result:', saveResult);
```

---

## 临时解决方案

### 方案 1: 禁用工作流详情加载

在 `WorkflowEditor.vue` 中，暂时不加载工作流详情：

```typescript
function viewWorkflowDetail(workflow) {
  selectedWorkflowId.value = workflow.id;
  // 暂时注释掉，避免触发 API 调用
  // workflowStore.setCurrentWorkflow(workflow.id);
  
  // 直接使用已有的工作流数据
  const existingWorkflow = workflowStore.workflows.find(w => w.id === workflow.id);
  if (existingWorkflow) {
    workflowStore.currentWorkflowId = workflow.id;
  }
  
  navigationStore.updatePanelContext('workflow', {
    selectedWorkflow: workflow.id,
    viewType: 'workflow-detail',
    statusFilter: null,
    templateId: null,
    executionId: null
  });
}
```

### 方案 2: 修复 selectWorkflow 方法

在 `workflowStore.ts` 中，确保 `selectWorkflow` 不触发 API 调用：

```typescript
selectWorkflow(workflowId: string): boolean {
  const exists = this.workflows.some(w => w.id === workflowId);
  if (exists) {
    this.currentWorkflowId = workflowId;
    console.log('📌 selectWorkflow:', workflowId);
    return true;
  }
  console.warn('⚠️ selectWorkflow: workflow not found in local store:', workflowId);
  console.log('Available workflows:', this.workflows.map(w => ({ id: w.id, name: w.name })));
  return false;
}
```

### 方案 3: 修复 API 路径

如果后端期望不同的 API 路径，修改 `api.ts`：

```typescript
async getWorkflow(workflowId: string) {
  try {
    // 尝试不同的 API 路径
    const response = await this.axiosInstance.get(`/workflow/${workflowId}`);
    // 或者
    // const response = await this.axiosInstance.get('/workflows', {
    //   params: { id: workflowId }
    // });
    return { success: true, workflow: response.data.workflow };
  } catch (error: any) {
    console.error('Failed to get workflow:', error);
    return { success: false, message: error.message };
  }
}
```

---

## 下一步行动

1. **添加诊断日志** - 在关键位置添加 console.log
2. **检查后端 API** - 确认正确的 API 端点和参数格式
3. **验证工作流保存** - 确保工作流正确保存到后端
4. **测试修复** - 应用临时解决方案并测试

---

## 相关文件

- `frontend/NovelAnimeDesktop/src/renderer/components/panels/WorkflowContextPanel.vue`
- `frontend/NovelAnimeDesktop/src/renderer/stores/workflowStore.ts`
- `frontend/NovelAnimeDesktop/src/renderer/services/api.ts`
- `frontend/NovelAnimeDesktop/src/renderer/views/WorkflowEditor.vue`
- `frontend/NovelAnimeDesktop/src/renderer/router/index.js`
