# Problem 3: Workflow-Project Association - FIX IMPLEMENTED

**Date**: 2026-01-26  
**Status**: ✅ FIXED - READY FOR TESTING

---

## 🎯 Problem Summary

**User Report**: "工作流菜单对应的流程还是没有"

When user navigates to the "工作流" (Workflow) main menu, they see no workflows even though they just completed a workflow execution for a project.

**Root Cause**: `workflowStore.loadWorkflows()` was loading ALL workflows from ALL projects without filtering by current projectId.

---

## 🔧 Solution Implemented

### Change 1: Add projectId Filter to Store

**File**: `frontend/NovelAnimeDesktop/src/renderer/stores/workflowStore.ts`

**Before**:
```typescript
async loadWorkflows(): Promise<void> {
  // ...
  const result = await workflowService.getWorkflows();  // ❌ No filter
  // ...
}
```

**After**:
```typescript
async loadWorkflows(projectId?: string): Promise<void> {
  // ...
  const result = await workflowService.getWorkflows(projectId ? { projectId } : undefined);
  console.log('📂 loadWorkflows: loaded', this.workflows.length, 'workflows', 
              projectId ? `for project ${projectId}` : '(all projects)');
  // ...
}
```

**Impact**:
- ✅ Store now accepts optional projectId parameter
- ✅ Filters workflows at API level (more efficient)
- ✅ Logs show whether filtering is active

---

### Change 2: Pass projectId in WorkflowEditor Initialization

**File**: `frontend/NovelAnimeDesktop/src/renderer/views/WorkflowEditor.vue`

**Before**:
```typescript
async function initializeEditor(): Promise<void> {
  // ...
  await workflowStore.loadWorkflows();  // ❌ No projectId
  // ...
}
```

**After**:
```typescript
async function initializeEditor(): Promise<void> {
  // ...
  const currentProjectId = projectStore.currentProject?.id;
  await workflowStore.loadWorkflows(currentProjectId);  // ✅ Pass projectId
  
  const cleanedCount = await workflowStore.cleanupEmptyWorkflows(currentProjectId);
  console.log('📂 WorkflowEditor initialized, workflows loaded:', workflowStore.workflows.length, 
              currentProjectId ? `for project ${currentProjectId}` : '(all projects)');
  // ...
}
```

**Impact**:
- ✅ Loads only current project's workflows on initialization
- ✅ Cleans up empty workflows for current project only
- ✅ Logs show project context

---

### Change 3: Pass projectId in refreshStatus

**File**: `frontend/NovelAnimeDesktop/src/renderer/views/WorkflowEditor.vue`

**Before**:
```typescript
async function refreshStatus(): Promise<void> {
  await workflowStore.loadWorkflows();  // ❌ No projectId
  // ...
}
```

**After**:
```typescript
async function refreshStatus(): Promise<void> {
  const currentProjectId = projectStore.currentProject?.id;
  await workflowStore.loadWorkflows(currentProjectId);  // ✅ Pass projectId
  // ...
}
```

**Impact**:
- ✅ Refresh button now reloads current project's workflows only

---

### Change 4: Add Project Change Watcher

**File**: `frontend/NovelAnimeDesktop/src/renderer/views/WorkflowEditor.vue`

**New Code**:
```typescript
// 监听当前项目变化 - 重新加载工作流列表
watch(
  () => projectStore.currentProject?.id,
  async (newProjectId, oldProjectId) => {
    if (!isReady.value) return;
    if (newProjectId === oldProjectId) return;
    
    console.log('🔄 Project changed, reloading workflows for project:', newProjectId);
    await workflowStore.loadWorkflows(newProjectId);
    
    // 清空当前选中的工作流（因为可能不属于新项目）
    selectedWorkflowId.value = '';
    
    uiStore.addNotification({
      type: 'info',
      title: '项目已切换',
      message: '工作流列表已更新',
      timeout: 2000
    });
  }
);
```

**Impact**:
- ✅ Automatically reloads workflows when user switches projects
- ✅ Clears selected workflow (prevents showing wrong project's workflow)
- ✅ Shows notification to user

---

## 📊 Expected Behavior After Fix

### Scenario 1: Navigate to Workflow Menu
1. User completes workflow execution for Project A
2. User clicks "工作流" main menu
3. **Expected**: Workflow dropdown shows Project A's workflows
4. **Before Fix**: Dropdown showed all workflows or was empty

### Scenario 2: Switch Projects
1. User is viewing Project A's workflows
2. User switches to Project B (via Dashboard or Project List)
3. **Expected**: Workflow list automatically updates to show Project B's workflows
4. **Before Fix**: Still showed Project A's workflows

### Scenario 3: Create New Project
1. User creates new Project C (no workflows yet)
2. User navigates to Workflow menu
3. **Expected**: Dropdown shows "暂无工作流" (no workflows)
4. **Before Fix**: Might show workflows from other projects

---

## 🧪 Testing Checklist

### Test 1: Workflow List Filtering
- [ ] Create Project A with workflow
- [ ] Create Project B with workflow
- [ ] Navigate to Workflow menu for Project A
- [ ] Verify only Project A's workflow appears in dropdown
- [ ] Switch to Project B
- [ ] Verify only Project B's workflow appears in dropdown

### Test 2: Empty State
- [ ] Create new project without workflow
- [ ] Navigate to Workflow menu
- [ ] Verify dropdown shows "暂无工作流"
- [ ] Create workflow for project
- [ ] Verify workflow appears in dropdown

### Test 3: Project Switching
- [ ] Open Project A (has workflow)
- [ ] Navigate to Workflow menu
- [ ] Note which workflow is shown
- [ ] Switch to Project B (different workflow)
- [ ] Verify workflow list updates automatically
- [ ] Verify notification appears: "项目已切换"

### Test 4: Workflow Execution
- [ ] Execute workflow for Project A
- [ ] Navigate to Workflow menu
- [ ] Verify Project A's workflow appears
- [ ] Verify workflow shows correct status

---

## 🔗 Related Fixes

This fix completes the trilogy of critical issues:

1. **Problem 1**: Project status not synced to backend ✅ FIXED
   - File: `WorkflowEditor.vue` line 1803
   - Added backend API call to save status

2. **Problem 2**: Image generation using same prompt ✅ FIXED
   - File: `PipelineOrchestrator.js` buildImagePrompt()
   - Enhanced prompt with chapter/scene details and unique seeds

3. **Problem 3**: Workflow-project association ✅ FIXED
   - Files: `workflowStore.ts`, `WorkflowEditor.vue`
   - Added projectId filtering to workflow loading

---

## 📝 Technical Notes

### Backend API Support

The backend API already supported projectId filtering:

```typescript
// workflowService.ts
export async function getWorkflows(params?: {
  projectId?: string;  // ✅ Already supported!
  userId?: string;
  status?: string;
}): Promise<ApiResponse<{ workflows: Workflow[] }>>
```

No backend changes were needed - only frontend filtering logic.

### Store Helper Methods

The store already had `getWorkflowByProjectId()` method, but it was searching the loaded workflows. If `loadWorkflows()` didn't filter by project, it wouldn't find the right workflows.

Now that `loadWorkflows()` filters correctly, `getWorkflowByProjectId()` will work as expected.

---

## 🎉 Success Criteria

✅ User navigates to Workflow menu and sees only current project's workflows  
✅ Switching projects automatically updates workflow list  
✅ Empty state shows when project has no workflows  
✅ Workflow creation associates with current project  
✅ Console logs show project context for debugging  

---

**Next Step**: User testing to verify all three problems are resolved!
