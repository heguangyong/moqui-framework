# Phase 1 执行计划 - 立即删除 workflowState

**日期**: 2026-01-26  
**优先级**: P0 - 立即执行  
**风险**: 高（影响范围大）  
**预计时间**: 2-3 小时

---

## 🎯 执行目标

**删除 navigationStore.workflowState 及所有相关逻辑**

### 为什么要删除？

1. **状态重复**: workflowState 与 project.status 重复
2. **状态不同步**: 导致前端和后端状态不一致
3. **推断逻辑**: 引发大量错误的状态推断
4. **数据污染**: 导致新项目继承旧项目状态

### 用户授权

- ✅ "我授权你可以删除你觉得任何有问题代码"
- ✅ "功能宁可重写,也不要垃圾存留"

---

## 📋 删除清单

### 1. navigationStore.js

**删除内容**:
```javascript
// ❌ 删除整个 workflowState 对象
workflowState: {
  stage: 'idle',
  importedFile: null,
  parseResult: null,
  charactersConfirmed: false,
  executionResult: null
}

// ❌ 删除所有 workflowState 相关方法
startImport(filePath)
setParseResult(result)
confirmCharacters()
startExecution()
setExecutionResult(result)
resetWorkflowState()
canExecuteWorkflow()
completeWorkflow()
```

**保留内容**:
```javascript
// ✅ 保留面板上下文管理
panelContext: { ... }

// ✅ 保留执行结果（用于显示）
// 注意：executionResult 移到 panelContext.workflow 中
```

### 2. DashboardView.vue

**删除内容**:
- ❌ `syncWorkflowStateFromProject()` 函数（~30 行）
- ❌ 所有 `navigationStore.workflowState` 的引用（~10 处）
- ❌ 所有根据 workflowState 推断状态的代码（~20 行）

**替代方案**:
```typescript
// ✅ 直接使用 project.status
const isCharactersConfirmed = computed(() => {
  const status = activeProject.value?.status;
  return status === 'characters_confirmed' || 
         status === 'generating' || 
         status === 'completed';
});

const isWorkflowCompleted = computed(() => {
  return activeProject.value?.status === 'completed';
});
```

### 3. WorkflowEditor.vue

**删除内容**:
- ❌ 所有 `navigationStore.workflowState` 的引用
- ❌ 所有 `setWorkflowState()` 调用

**替代方案**:
```typescript
// ✅ 直接更新项目状态（调用后端 API）
async function updateProjectStatus(status: string) {
  await apiService.updateProject(projectId, { status });
}
```

---

## 🔧 执行步骤

### Step 1: 备份当前代码

```bash
# 创建备份分支
git checkout -b backup-before-phase1-refactor
git add .
git commit -m "Backup before Phase 1 refactoring"
git checkout main
```

### Step 2: 修改 navigationStore.js

1. 删除 `workflowState` 对象
2. 删除所有 workflowState 相关方法
3. 将 `executionResult` 移到 `panelContext.workflow`
4. 更新 `persistNavigationState()` 方法

### Step 3: 修改 DashboardView.vue

1. 删除 `syncWorkflowStateFromProject()` 函数
2. 删除所有 `navigationStore.workflowState` 引用
3. 添加基于 `project.status` 的 computed 属性
4. 更新所有状态判断逻辑

### Step 4: 修改 WorkflowEditor.vue

1. 删除所有 `navigationStore.workflowState` 引用
2. 更新工作流完成逻辑，直接调用后端 API

### Step 5: 搜索并清理所有引用

```bash
# 搜索所有 workflowState 引用
grep -r "workflowState" frontend/NovelAnimeDesktop/src/renderer/
```

### Step 6: 编译测试

```bash
cd frontend/NovelAnimeDesktop
npm run build
```

### Step 7: 功能测试

- [ ] 新建项目
- [ ] 导入小说
- [ ] 解析小说
- [ ] 确认角色
- [ ] 执行工作流
- [ ] 查看结果

---

## ✅ 成功标准

### 代码质量

1. ✅ 所有 workflowState 引用已删除
2. ✅ 编译通过，无错误
3. ✅ 无 TypeScript 类型错误
4. ✅ 代码减少 ~100 行

### 功能质量

1. ✅ 新建项目状态正确
2. ✅ 项目切换状态正确
3. ✅ 工作流执行正常
4. ✅ 无状态混乱

### 架构质量

1. ✅ 单一数据源（project.status）
2. ✅ 无状态推断
3. ✅ 无状态重复

---

## 🚨 风险评估

### 高风险点

1. **DashboardView.vue**: 大量代码依赖 workflowState
2. **WorkflowEditor.vue**: 工作流执行逻辑
3. **其他组件**: 可能有隐藏的引用

### 缓解措施

1. 创建备份分支
2. 逐步删除，每步编译测试
3. 保留 executionResult（移到 panelContext）
4. 完整的功能测试

---

## 📝 执行日志

### 2026-01-26 开始执行

- [ ] Step 1: 备份代码
- [ ] Step 2: 修改 navigationStore.js
- [ ] Step 3: 修改 DashboardView.vue
- [ ] Step 4: 修改 WorkflowEditor.vue
- [ ] Step 5: 搜索清理引用
- [ ] Step 6: 编译测试
- [ ] Step 7: 功能测试

---

**下一步**: 开始执行 Step 1 - 备份代码

