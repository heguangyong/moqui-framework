# Design Document: Workflow Duplication Fix

## Overview

This design addresses the workflow duplication issue by moving state management from component-level to store-level, implementing project-workflow mappings, and adding robust duplicate prevention logic. The solution ensures that each project has exactly one workflow, and that this association persists across component lifecycle events and application restarts.

## Architecture

### Current Architecture Issues

1. **Component-Level State**: The flags `isAutoApplyingTemplate` and `hasAutoAppliedTemplate` are stored in the WorkflowEditor component, which resets when the component unmounts
2. **No Project-Workflow Mapping**: There's no persistent mapping between projects and workflows
3. **Race Conditions**: Multiple calls to `autoApplyTemplate` or `useTemplate` can create duplicate workflows
4. **Inefficient Lookup**: Finding workflows by project requires iterating through all workflows

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      WorkflowEditor.vue                      │
│  - Calls store methods for workflow operations               │
│  - No local state for workflow creation tracking             │
│  - Checks store before creating workflows                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      WorkflowStore (Pinia)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ State:                                                 │  │
│  │  - projectWorkflowMap: Map<projectId, workflowId>     │  │
│  │  - isCreatingWorkflowForProject: string | null        │  │
│  │  - workflows: Workflow[]                              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Methods:                                               │  │
│  │  - getWorkflowByProjectId(projectId)                  │  │
│  │  - setProjectWorkflowMapping(projectId, workflowId)   │  │
│  │  - clearProjectWorkflowMapping(projectId)             │  │
│  │  - cleanupEmptyWorkflows()                            │  │
│  │  - createWorkflowForProject(projectId, template)      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      localStorage                            │
│  - Persists projectWorkflowMap across app restarts          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. WorkflowStore State Extensions

Add new state properties to track project-workflow associations:

```typescript
export interface WorkflowState {
  // ... existing state ...
  
  // New state for project-workflow mapping
  projectWorkflowMap: Map<string, string>;  // projectId -> workflowId
  isCreatingWorkflowForProject: string | null;  // projectId currently being created
}
```

### 2. WorkflowStore Methods

#### 2.1 getWorkflowByProjectId

```typescript
/**
 * Get workflow for a specific project
 * @param projectId - The project ID
 * @returns The workflow or null if not found
 */
getWorkflowByProjectId(projectId: string): Workflow | null {
  // 1. Check the mapping cache first
  const workflowId = this.projectWorkflowMap.get(projectId);
  if (workflowId) {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (workflow) return workflow;
    
    // Mapping exists but workflow not found - clean up stale mapping
    this.projectWorkflowMap.delete(projectId);
  }
  
  // 2. Search through workflows for matching projectId
  const workflow = this.workflows.find(w => w.projectId === projectId);
  if (workflow) {
    // Update cache
    this.projectWorkflowMap.set(projectId, workflow.id);
    this.persistProjectWorkflowMap();
  }
  
  return workflow || null;
}
```

#### 2.2 setProjectWorkflowMapping

```typescript
/**
 * Set project-workflow mapping
 * @param projectId - The project ID
 * @param workflowId - The workflow ID
 */
setProjectWorkflowMapping(projectId: string, workflowId: string): void {
  this.projectWorkflowMap.set(projectId, workflowId);
  this.persistProjectWorkflowMap();
}
```

#### 2.3 clearProjectWorkflowMapping

```typescript
/**
 * Clear project-workflow mapping
 * @param projectId - The project ID
 */
clearProjectWorkflowMapping(projectId: string): void {
  this.projectWorkflowMap.delete(projectId);
  this.persistProjectWorkflowMap();
}
```

#### 2.4 persistProjectWorkflowMap

```typescript
/**
 * Persist project-workflow map to localStorage
 */
persistProjectWorkflowMap(): void {
  const mapObject = Object.fromEntries(this.projectWorkflowMap);
  localStorage.setItem('novel_anime_project_workflow_map', JSON.stringify(mapObject));
}
```

#### 2.5 loadProjectWorkflowMap

```typescript
/**
 * Load project-workflow map from localStorage
 */
loadProjectWorkflowMap(): void {
  const stored = localStorage.getItem('novel_anime_project_workflow_map');
  if (stored) {
    try {
      const mapObject = JSON.parse(stored);
      this.projectWorkflowMap = new Map(Object.entries(mapObject));
    } catch (e) {
      console.error('Failed to load project-workflow map:', e);
      this.projectWorkflowMap = new Map();
    }
  }
}
```

#### 2.6 cleanupEmptyWorkflows

```typescript
/**
 * Clean up empty workflows (workflows with no nodes)
 * @param projectId - Optional project ID to limit cleanup to specific project
 */
async cleanupEmptyWorkflows(projectId?: string): Promise<number> {
  const emptyWorkflows = this.workflows.filter(w => {
    const isEmpty = !w.nodes || w.nodes.length === 0;
    const matchesProject = !projectId || w.projectId === projectId;
    return isEmpty && matchesProject;
  });
  
  let deletedCount = 0;
  for (const workflow of emptyWorkflows) {
    const success = await this.deleteWorkflow(workflow.id);
    if (success) {
      deletedCount++;
      console.log('🗑️ Cleaned up empty workflow:', workflow.name);
    }
  }
  
  return deletedCount;
}
```

#### 2.7 createWorkflowForProject

```typescript
/**
 * Create a workflow for a specific project with duplicate prevention
 * @param projectId - The project ID
 * @param template - The template to use
 * @param projectName - The project name for workflow naming
 * @returns The created or existing workflow
 */
async createWorkflowForProject(
  projectId: string,
  template: { id: string; name: string; description: string; nodes: string[] },
  projectName: string
): Promise<Workflow | null> {
  // 1. Check if already creating for this project
  if (this.isCreatingWorkflowForProject === projectId) {
    console.log('⏳ Already creating workflow for project:', projectId);
    return null;
  }
  
  // 2. Check if workflow already exists
  const existingWorkflow = this.getWorkflowByProjectId(projectId);
  if (existingWorkflow) {
    console.log('✅ Workflow already exists for project:', projectId);
    
    // If empty, add nodes
    if (!existingWorkflow.nodes || existingWorkflow.nodes.length === 0) {
      console.log('📋 Adding template nodes to existing empty workflow');
      await this.addTemplateNodesToWorkflow(existingWorkflow.id, template);
    }
    
    return existingWorkflow;
  }
  
  // 3. Set creation flag
  this.isCreatingWorkflowForProject = projectId;
  
  try {
    // 4. Create workflow
    const workflowName = `${projectName} - ${template.name}`;
    const workflow = await this.createWorkflow({
      name: workflowName,
      description: template.description,
      projectId: projectId
    });
    
    if (!workflow) {
      throw new Error('Failed to create workflow');
    }
    
    // 5. Add template nodes
    await this.addTemplateNodesToWorkflow(workflow.id, template);
    
    // 6. Set mapping
    this.setProjectWorkflowMapping(projectId, workflow.id);
    
    // 7. Save to backend
    await this.saveWorkflow(workflow.id);
    
    console.log('✅ Created workflow for project:', projectId, workflow.name);
    return workflow;
    
  } catch (error) {
    console.error('❌ Failed to create workflow for project:', error);
    throw error;
  } finally {
    // 8. Clear creation flag
    this.isCreatingWorkflowForProject = null;
  }
}
```

#### 2.8 addTemplateNodesToWorkflow

```typescript
/**
 * Add template nodes to a workflow
 * @param workflowId - The workflow ID
 * @param template - The template with nodes to add
 */
async addTemplateNodesToWorkflow(
  workflowId: string,
  template: { nodes: string[] }
): Promise<void> {
  const nodeIds: string[] = [];
  
  // Add nodes
  template.nodes.forEach((nodeType: string, index: number) => {
    const node = this.addNode(
      workflowId,
      nodeType as WorkflowNodeType,
      this.getNodeTitle(nodeType),
      { x: 100 + index * 220, y: 100 }
    );
    if (node) {
      nodeIds.push(node.id);
    }
  });
  
  // Connect nodes
  for (let i = 0; i < nodeIds.length - 1; i++) {
    this.addConnection(workflowId, nodeIds[i], nodeIds[i + 1]);
  }
}
```

#### 2.9 getNodeTitle (Helper)

```typescript
/**
 * Get display title for a node type
 * @param type - The node type
 * @returns The display title
 */
getNodeTitle(type: string): string {
  const titles: Record<string, string> = {
    'novel-parser': '小说解析器',
    'character-analyzer': '角色分析器',
    'scene-generator': '场景生成器',
    'script-converter': '脚本转换器',
    'video-generator': '视频生成器'
  };
  return titles[type] || type;
}
```

### 3. Workflow Data Model Extension

Add `projectId` field to the Workflow interface:

```typescript
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  projectId?: string;  // NEW: Link workflow to project
}
```

### 4. WorkflowEditor Component Changes

#### 4.1 Remove Component-Level Flags

Remove these reactive refs:
- `isAutoApplyingTemplate`
- `hasAutoAppliedTemplate`

#### 4.2 Update autoApplyTemplate

```typescript
async function autoApplyTemplate(context: any): Promise<void> {
  try {
    const template = templates.value.find(t => t.id === context.templateId);
    if (!template) {
      console.warn('Template not found:', context.templateId);
      return;
    }
    
    // Use store method to create workflow with duplicate prevention
    const workflow = await workflowStore.createWorkflowForProject(
      context.projectId,
      template,
      context.projectName
    );
    
    if (!workflow) {
      console.log('⚠️ Workflow creation skipped (already in progress or exists)');
      return;
    }
    
    // Select the workflow
    workflowStore.selectWorkflow(workflow.id);
    selectedWorkflowId.value = workflow.id;
    
    // Update navigation context
    navigationStore.updatePanelContext('workflow', {
      selectedWorkflow: workflow.id,
      viewType: 'workflow-detail',
      templateId: null,
      projectId: context.projectId,
      novelId: context.novelId,
      projectName: context.projectName
    });
    
    uiStore.addNotification({
      type: 'success',
      title: '工作流已创建',
      message: `已为项目 "${context.projectName}" 创建工作流`,
      timeout: 3000
    });
    
  } catch (error) {
    console.error('❌ autoApplyTemplate failed:', error);
    uiStore.addNotification({
      type: 'error',
      title: '创建失败',
      message: '无法创建工作流，请重试',
      timeout: 3000
    });
  }
}
```

#### 4.3 Update useTemplate

```typescript
async function useTemplate(): Promise<void> {
  if (!selectedTemplate.value) {
    uiStore.addNotification({
      type: 'warning',
      title: '请选择模板',
      message: '请先从左侧面板选择一个模板',
      timeout: 3000
    });
    return;
  }
  
  // Get projectId from context
  const context = navigationStore.panelContext.workflow;
  const projectId = context?.projectId || projectStore.currentProject?.id;
  
  if (!projectId) {
    console.warn('No projectId available');
    // Fall back to old behavior - create without project association
    await createWorkflowFromTemplate(selectedTemplate.value);
    return;
  }
  
  // Check if workflow already exists for this project
  const existingWorkflow = workflowStore.getWorkflowByProjectId(projectId);
  if (existingWorkflow) {
    console.log('✅ Workflow already exists, switching to it');
    
    workflowStore.selectWorkflow(existingWorkflow.id);
    selectedWorkflowId.value = existingWorkflow.id;
    
    navigationStore.updatePanelContext('workflow', {
      selectedWorkflow: existingWorkflow.id,
      viewType: 'workflow-detail',
      templateId: null
    });
    
    uiStore.addNotification({
      type: 'info',
      title: '工作流已存在',
      message: `已切换到工作流 "${existingWorkflow.name}"`,
      timeout: 2000
    });
    return;
  }
  
  // Create new workflow for project
  const projectName = context?.projectName || projectStore.currentProject?.name || '未命名项目';
  const workflow = await workflowStore.createWorkflowForProject(
    projectId,
    selectedTemplate.value,
    projectName
  );
  
  if (workflow) {
    workflowStore.selectWorkflow(workflow.id);
    selectedWorkflowId.value = workflow.id;
    
    navigationStore.updatePanelContext('workflow', {
      selectedWorkflow: workflow.id,
      viewType: 'workflow-detail',
      templateId: null
    });
    
    uiStore.addNotification({
      type: 'success',
      title: '模板应用成功',
      message: `已创建工作流 "${workflow.name}"`,
      timeout: 3000
    });
  }
}
```

#### 4.4 Add Cleanup on Mount

```typescript
async function initializeEditor(): Promise<void> {
  try {
    await waitForInit();
    await workflowStore.loadWorkflows();
    
    // Load project-workflow map from localStorage
    workflowStore.loadProjectWorkflowMap();
    
    // Clean up empty workflows
    const deletedCount = await workflowStore.cleanupEmptyWorkflows();
    if (deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${deletedCount} empty workflow(s)`);
    }
    
    // Check if need to auto-apply template
    const context = navigationStore.panelContext.workflow;
    if (context?.viewType === 'template' && context?.templateId && context?.projectName) {
      await autoApplyTemplate(context);
    }
    
    isReady.value = true;
  } catch (error) {
    console.error('❌ WorkflowEditor initialization failed:', error);
    isReady.value = true;
  }
}
```

## Data Models

### Workflow Model Extension

```typescript
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  projectId?: string;  // NEW: Optional project association
}
```

### WorkflowStore State Extension

```typescript
export interface WorkflowState {
  // Existing state
  workflows: Workflow[];
  currentWorkflowId: string | null;
  executions: WorkflowExecution[];
  isExecuting: boolean;
  executionProgress: number;
  executionStatus: WorkflowStatus;
  executionMessage: string;
  isLoading: boolean;
  isInitialized: boolean;
  error: ApiError | null;
  
  // NEW: Project-workflow mapping
  projectWorkflowMap: Map<string, string>;
  isCreatingWorkflowForProject: string | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Unique Workflow Per Project

*For any* project ID, there should be at most one workflow associated with that project at any given time.

**Validates: Requirements 1.1, 1.4**

### Property 2: Mapping Consistency

*For any* project-workflow mapping in the store, the workflow ID should correspond to an existing workflow in the workflows array.

**Validates: Requirements 5.2, 5.3**

### Property 3: Creation Flag Cleanup

*For any* workflow creation operation (successful or failed), the `isCreatingWorkflowForProject` flag should be null after the operation completes.

**Validates: Requirements 7.4, 7.5**

### Property 4: Empty Workflow Cleanup

*For any* project with multiple workflows, after cleanup, there should be no workflows with zero nodes remaining.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Persistence Round Trip

*For any* project-workflow mapping stored in the map, persisting to localStorage and then loading should produce an equivalent mapping.

**Validates: Requirements 5.5**

### Property 6: Concurrent Creation Prevention

*For any* two concurrent calls to `createWorkflowForProject` with the same project ID, only one workflow should be created.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 7: Workflow Lookup Correctness

*For any* project ID with an associated workflow, `getWorkflowByProjectId` should return that workflow regardless of whether it's in the cache or requires a search.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 8: Navigation State Preservation

*For any* workflow created for a project, navigating away and back should result in the same workflow being displayed (no duplicates created).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

## Error Handling

### 1. Workflow Creation Failures

**Scenario**: `createWorkflowForProject` fails due to network error or backend issue

**Handling**:
- Clear the `isCreatingWorkflowForProject` flag in the finally block
- Log the error with full context
- Show user-friendly error notification
- Do not update the project-workflow mapping
- Allow retry by user

### 2. Stale Mapping Detection

**Scenario**: Mapping points to a workflow ID that no longer exists

**Handling**:
- Detect during `getWorkflowByProjectId` lookup
- Remove the stale mapping from the map
- Persist the updated map to localStorage
- Return null to indicate no workflow found
- Log the cleanup action

### 3. localStorage Corruption

**Scenario**: localStorage contains invalid JSON for project-workflow map

**Handling**:
- Catch JSON.parse errors in `loadProjectWorkflowMap`
- Initialize with empty Map
- Log the error for debugging
- Continue normal operation
- User can recreate mappings naturally

### 4. Concurrent Creation Attempts

**Scenario**: Multiple components try to create workflow for same project simultaneously

**Handling**:
- Check `isCreatingWorkflowForProject` flag at start
- Return null immediately if flag is set to the same project ID
- Show "please wait" notification to user
- First call proceeds, subsequent calls are blocked
- Flag is cleared after first call completes

### 5. Empty Workflow Cleanup Failures

**Scenario**: Deletion of empty workflow fails

**Handling**:
- Log the failure but continue with other workflows
- Return count of successfully deleted workflows
- Do not throw error (cleanup is best-effort)
- User can manually delete if needed

## Testing Strategy

### Unit Tests

Unit tests will focus on specific examples and edge cases:

1. **Project-Workflow Mapping Tests**
   - Test setting and getting mappings
   - Test clearing mappings
   - Test stale mapping cleanup

2. **Workflow Lookup Tests**
   - Test lookup with cached mapping
   - Test lookup with search fallback
   - Test lookup with no workflow found

3. **Empty Workflow Cleanup Tests**
   - Test cleanup with single empty workflow
   - Test cleanup with multiple empty workflows
   - Test cleanup preserves workflows with nodes

4. **Creation Flag Tests**
   - Test flag is set during creation
   - Test flag is cleared after success
   - Test flag is cleared after failure

### Property-Based Tests

Property tests will verify universal properties across all inputs. Each test should run a minimum of 100 iterations.

1. **Property Test: Unique Workflow Per Project**
   - Generate random project IDs and create workflows
   - Verify only one workflow exists per project
   - **Feature: workflow-duplication-fix, Property 1: Unique Workflow Per Project**

2. **Property Test: Mapping Consistency**
   - Generate random mappings and workflows
   - Verify all mapped workflow IDs exist in workflows array
   - **Feature: workflow-duplication-fix, Property 2: Mapping Consistency**

3. **Property Test: Creation Flag Cleanup**
   - Simulate random creation operations (success/failure)
   - Verify flag is always null after completion
   - **Feature: workflow-duplication-fix, Property 3: Creation Flag Cleanup**

4. **Property Test: Empty Workflow Cleanup**
   - Generate random workflows (some empty, some with nodes)
   - Run cleanup and verify no empty workflows remain
   - **Feature: workflow-duplication-fix, Property 4: Empty Workflow Cleanup**

5. **Property Test: Persistence Round Trip**
   - Generate random project-workflow mappings
   - Persist and load, verify equivalence
   - **Feature: workflow-duplication-fix, Property 5: Persistence Round Trip**

6. **Property Test: Concurrent Creation Prevention**
   - Simulate concurrent creation calls for same project
   - Verify only one workflow is created
   - **Feature: workflow-duplication-fix, Property 6: Concurrent Creation Prevention**

7. **Property Test: Workflow Lookup Correctness**
   - Generate random workflows with project IDs
   - Test lookup with and without cache
   - Verify correct workflow is always returned
   - **Feature: workflow-duplication-fix, Property 7: Workflow Lookup Correctness**

8. **Property Test: Navigation State Preservation**
   - Simulate component mount/unmount cycles
   - Verify same workflow is used after remount
   - **Feature: workflow-duplication-fix, Property 8: Navigation State Preservation**

### Integration Tests

1. **End-to-End Workflow Creation**
   - Test complete flow from Dashboard to WorkflowEditor
   - Verify single workflow is created
   - Verify navigation back and forth doesn't create duplicates

2. **Template Application Flow**
   - Test auto-apply from Dashboard
   - Test manual template button click
   - Verify both use same workflow

3. **Multi-Project Scenario**
   - Create multiple projects
   - Verify each has its own workflow
   - Verify no cross-contamination

### Test Configuration

- Use Vitest for unit and property tests
- Use fast-check library for property-based testing
- Minimum 100 iterations per property test
- Tag each test with feature name and property number
- Run tests in CI/CD pipeline before merge
