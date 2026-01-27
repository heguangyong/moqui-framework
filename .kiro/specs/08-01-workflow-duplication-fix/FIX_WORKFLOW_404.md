# Fix: 工作流 404 错误导致跳转登录页

**日期**: 2026-01-21  
**状态**: ✅ 已修复（诊断日志已添加）

---

## 问题描述

用户点击中间面板的工作流时，出现 404 错误并跳转到登录页。

## 根本原因分析

1. **工作流未保存到后端** - 工作流在前端创建后可能没有正确保存到后端数据库
2. **错误处理不当** - 404 错误被误判为认证问题，导致跳转登录页

## 已实施的修复

### 1. 增强错误日志 (`api.ts`)

```typescript
async getWorkflow(workflowId: string) {
  console.log('🔍 API: Getting workflow:', workflowId);
  try {
    const response = await this.axiosInstance.get('/workflow', {
      params: { workflowId }
    });
    console.log('✅ API: Workflow response:', response.data);
    return { success: true, workflow: response.data.workflow };
  } catch (error: any) {
    console.error('❌ API: Failed to get workflow:', {
      workflowId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, message: error.message };
  }
}
```

### 2. 改进错误拦截器 (`api.ts`)

```typescript
this.axiosInstance.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // ONLY clear auth tokens for 401 errors
    if (error.response?.status === 401) {
      console.warn('🚫 401 Unauthorized - clearing auth tokens');
      localStorage.removeItem('novel_anime_access_token');
      localStorage.removeItem('novel_anime_refresh_token');
    }
    
    // For 404 errors, just log - don't clear auth
    if (error.response?.status === 404) {
      console.warn('⚠️ 404 Not Found:', error.config?.url);
    }
    
    return Promise.reject(error);
  }
);
```

### 3. 增强 selectWorkflow 日志 (`workflowStore.ts`)

```typescript
selectWorkflow(workflowId: string): boolean {
  const exists = this.workflows.some(w => w.id === workflowId);
  if (exists) {
    this.currentWorkflowId = workflowId;
    console.log('📌 selectWorkflow:', workflowId);
    return true;
  }
  console.warn('⚠️ selectWorkflow: workflow not found:', workflowId);
  console.log('📋 Available workflows:', this.workflows.map(w => ({ 
    id: w.id, 
    name: w.name 
  })));
  return false;
}
```

---

## 测试步骤

### 1. 重新测试工作流创建

1. 清除浏览器缓存和 localStorage
2. 重新登录应用
3. 创建新项目并导入小说
4. 点击"继续处理"创建工作流
5. 观察控制台日志：
   ```
   ✅ createWorkflowForProject: created workflow for project: xxx
   💾 Saving workflow to backend: xxx
   💾 Save result: true/false
   ```

### 2. 测试工作流点击

1. 在中间面板点击工作流
2. 观察控制台日志：
   ```
   🖱️ Workflow clicked: xxx
   📌 selectWorkflow: xxx
   ```
3. 如果出现错误，查看详细的错误信息：
   ```
   ❌ API: Failed to get workflow: {
     workflowId: xxx,
     status: 404,
     statusText: 'Not Found',
     data: {...}
   }
   ```

### 3. 检查工作流是否保存

在控制台执行：
```javascript
const workflowStore = useWorkflowStore();
console.log('Workflows:', workflowStore.workflows);
console.log('Current workflow:', workflowStore.currentWorkflow);
```

---

## 可能的后续问题

### 问题 1: 工作流未保存到后端

**症状**: 控制台显示 `💾 Save result: false`

**原因**: 
- 后端 API 不可用
- 工作流数据格式不正确
- 认证 token 无效

**解决方案**:
1. 检查后端服务是否运行
2. 检查 API 端点是否正确
3. 检查工作流数据格式是否符合后端期望

### 问题 2: 工作流 ID 不匹配

**症状**: 控制台显示 `⚠️ selectWorkflow: workflow not found`

**原因**:
- 前端生成的 ID 和后端返回的 ID 不一致
- 工作流列表没有正确加载

**解决方案**:
1. 检查 `convertFromBackend` 方法中的 ID 映射
2. 确保 `loadWorkflows` 正确加载了所有工作流
3. 检查后端返回的工作流数据格式

### 问题 3: API 路径不正确

**症状**: 控制台显示 `❌ API: Failed to get workflow: { status: 404 }`

**原因**:
- API 端点路径不正确
- 参数格式不正确

**解决方案**:
1. 检查后端 API 文档，确认正确的端点
2. 可能需要修改为 `GET /workflow/{workflowId}` 而不是 `GET /workflow?workflowId=xxx`
3. 或者使用 `GET /workflows` 端点

---

## 临时解决方案

如果问题持续存在，可以使用以下临时方案：

### 方案 1: 禁用工作流详情加载

在 `WorkflowEditor.vue` 中，不从后端加载工作流详情，直接使用本地数据：

```typescript
function viewWorkflowDetail(workflow) {
  selectedWorkflowId.value = workflow.id;
  // 直接使用本地工作流数据，不触发 API 调用
  workflowStore.currentWorkflowId = workflow.id;
  
  navigationStore.updatePanelContext('workflow', {
    selectedWorkflow: workflow.id,
    viewType: 'workflow-detail',
    statusFilter: null,
    templateId: null,
    executionId: null
  });
}
```

### 方案 2: 使用本地存储作为主要数据源

修改 `workflowStore.ts`，优先使用 localStorage 中的工作流数据：

```typescript
async loadWorkflows(): Promise<void> {
  // 先从 localStorage 加载
  const localWorkflows = localStorage.getItem('novel_anime_workflows');
  if (localWorkflows) {
    try {
      this.workflows = JSON.parse(localWorkflows);
      console.log('📂 Loaded workflows from localStorage:', this.workflows.length);
    } catch (e) {
      console.error('Failed to parse local workflows:', e);
    }
  }
  
  // 然后尝试从后端同步
  try {
    const result = await workflowService.getWorkflows();
    if (result.success && result.data) {
      this.workflows = result.data.workflows;
      // 保存到 localStorage
      localStorage.setItem('novel_anime_workflows', JSON.stringify(this.workflows));
    }
  } catch (e) {
    console.warn('Failed to sync workflows from backend, using local data');
  }
}
```

---

## 相关文件

- `frontend/NovelAnimeDesktop/src/renderer/services/api.ts` - API 错误处理
- `frontend/NovelAnimeDesktop/src/renderer/stores/workflowStore.ts` - 工作流状态管理
- `frontend/NovelAnimeDesktop/src/renderer/components/panels/WorkflowContextPanel.vue` - 中间面板
- `frontend/NovelAnimeDesktop/src/renderer/views/WorkflowEditor.vue` - 工作流编辑器
- `frontend/NovelAnimeDesktop/src/renderer/router/index.js` - 路由守卫

---

## 下一步

1. **用户重新测试** - 使用增强的日志重新测试工作流创建和点击
2. **分析日志** - 根据控制台日志确定具体问题
3. **应用修复** - 根据具体问题应用相应的修复方案
4. **验证修复** - 确认问题已解决

---

**修复状态**: ✅ 诊断日志已添加，等待用户测试反馈
