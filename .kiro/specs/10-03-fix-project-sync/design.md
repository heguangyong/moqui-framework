# Design Document: 项目创建和列表同步修复

## Overview

本设计文档描述了修复项目创建和列表同步问题的技术方案。当前系统存在多个项目创建入口（控制面板、概览页面、菜单栏、导入对话框），但创建后项目列表未能正确同步更新。

**核心问题**：
1. 项目创建后未调用 `fetchProjects()` 刷新列表
2. ProjectList 组件的 `onMounted` 钩子未正确触发数据加载
3. 前端 store 和后端 API 的数据字段不一致（`id` vs `projectId`）
4. 缺少加载状态和错误处理

**解决方案**：
- 在 `projectStore.createProject()` 中添加自动刷新逻辑
- 修复 ProjectList 组件的 `onMounted` 钩子
- 统一项目数据的字段名称规范化
- 添加加载状态和错误处理机制

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Components                      │
├─────────────────────────────────────────────────────────────┤
│  DashboardPanel  │  DashboardView  │  App  │  ImportDialog  │
│  (创建入口1)      │  (创建入口2)     │ (入口3)│  (创建入口4)   │
└────────┬─────────┴────────┬─────────┴───┬───┴────────┬──────┘
         │                  │             │            │
         └──────────────────┴─────────────┴────────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │   Project Store     │
                  │  (Pinia State)      │
                  ├─────────────────────┤
                  │ - projects[]        │
                  │ - currentProject    │
                  │ - isLoading         │
                  │ - error             │
                  ├─────────────────────┤
                  │ + createProject()   │◄─── 统一创建逻辑
                  │ + fetchProjects()   │◄─── 统一刷新逻辑
                  │ + setCurrentProject()│
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    API Service      │
                  │  (Backend Calls)    │
                  ├─────────────────────┤
                  │ + createProject()   │
                  │ + getProjects()     │
                  │ + getProject(id)    │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Backend API       │
                  │   (Moqui)           │
                  └─────────────────────┘
```

### 数据流

**项目创建流程**：
```
1. 用户触发创建 → 2. 组件调用 store.createProject()
                  ↓
3. Store 调用 apiService.createProject() → 4. 后端创建项目
                  ↓
5. 后端返回 projectId → 6. Store 规范化数据
                  ↓
7. Store 添加到 projects[] → 8. Store 调用 fetchProjects()
                  ↓
9. 刷新完整列表 → 10. 组件自动更新显示
```

**项目列表加载流程**：
```
1. ProjectList.onMounted() → 2. store.fetchProjects()
                            ↓
3. store.isLoading = true → 4. apiService.getProjects()
                            ↓
5. 后端返回项目列表 → 6. 规范化数据
                            ↓
7. store.projects = 新列表 → 8. store.isLoading = false
                            ↓
9. 组件响应式更新显示
```

## Components and Interfaces

### 1. Project Store (projectStore.ts)

**职责**：管理项目状态，提供统一的项目操作接口

**状态**：
```typescript
interface ProjectStoreState {
  projects: Project[]           // 项目列表
  currentProject: Project | null // 当前项目
  isLoading: boolean            // 加载状态
  error: string | null          // 错误信息
}
```

**核心方法**：

```typescript
// 创建项目（包含自动刷新）
async createProject(projectData: CreateProjectRequest): Promise<Project> {
  try {
    // 1. 调用后端 API 创建项目
    const response = await apiService.createProject(projectData)
    
    // 2. 规范化返回的项目数据
    const normalizedProject = normalizeProject(response.data)
    
    // 3. 添加到 store 的 projects 数组
    this.projects.push(normalizedProject)
    
    // 4. 自动刷新项目列表（确保与后端同步）
    await this.fetchProjects()
    
    // 5. 返回创建的项目
    return normalizedProject
  } catch (error) {
    this.error = error.message
    throw error
  }
}

// 获取项目列表（从后端刷新）
async fetchProjects(): Promise<void> {
  try {
    this.isLoading = true
    this.error = null
    
    // 1. 调用后端 API 获取项目列表
    const response = await apiService.getProjects()
    
    // 2. 规范化所有项目数据
    const normalizedProjects = response.data.map(normalizeProject)
    
    // 3. 替换 store 中的项目列表
    this.projects = normalizedProjects
    
    this.isLoading = false
  } catch (error) {
    this.error = error.message
    this.isLoading = false
    throw error
  }
}

// 设置当前项目
setCurrentProject(project: Project): void {
  this.currentProject = project
}
```

**修改文件**：`frontend/NovelAnimeDesktop/src/renderer/stores/projectStore.ts`

### 2. API Service (apiService.ts)

**职责**：封装后端 API 调用

**接口**：
```typescript
interface ApiService {
  // 创建项目
  createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>>
  
  // 获取项目列表
  getProjects(): Promise<ApiResponse<Project[]>>
  
  // 获取单个项目
  getProject(projectId: string): Promise<ApiResponse<Project>>
}
```

**修改文件**：`frontend/NovelAnimeDesktop/src/renderer/services/apiService.ts`

### 3. ProjectList Component (ProjectList.vue)

**职责**：显示项目列表，响应 store 变化

**关键修复**：
```vue
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useProjectStore } from '@/stores/projectStore'

const projectStore = useProjectStore()

// 计算属性：响应式获取项目列表
const projects = computed(() => projectStore.projects)
const isLoading = computed(() => projectStore.isLoading)
const error = computed(() => projectStore.error)

// 组件挂载时加载项目列表
onMounted(async () => {
  try {
    await projectStore.fetchProjects()
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
})
</script>

<template>
  <div class="project-list">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">
      <span>加载中...</span>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      <span>{{ error }}</span>
      <button @click="projectStore.fetchProjects()">重试</button>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="projects.length === 0" class="empty">
      <span>暂无项目</span>
    </div>
    
    <!-- 项目列表 -->
    <div v-else class="projects">
      <div v-for="project in projects" :key="project.id || project.projectId">
        <!-- 项目卡片 -->
      </div>
    </div>
  </div>
</template>
```

**修改文件**：`frontend/NovelAnimeDesktop/src/renderer/components/ProjectList.vue`

### 4. DashboardPanel Component (DashboardPanel.vue)

**职责**：控制面板，提供项目创建入口

**关键修复**：
```vue
<script setup lang="ts">
import { useProjectStore } from '@/stores/projectStore'

const projectStore = useProjectStore()

async function handleCreateProject() {
  try {
    const projectName = await showProjectNameDialog()
    
    // 调用 store 的 createProject（自动刷新）
    const newProject = await projectStore.createProject({
      name: projectName,
      description: ''
    })
    
    // 显示成功通知
    showSuccessNotification(`项目 "${newProject.name}" 创建成功`)
    
    // 可选：导航到项目详情页
    // router.push(`/project/${newProject.id}`)
  } catch (error) {
    showErrorNotification('项目创建失败：' + error.message)
  }
}
</script>
```

**修改文件**：`frontend/NovelAnimeDesktop/src/renderer/components/DashboardPanel.vue`

### 5. DashboardView Component (DashboardView.vue)

**职责**：概览页面，提供项目创建入口

**关键修复**：
```vue
<script setup lang="ts">
import { useProjectStore } from '@/stores/projectStore'

const projectStore = useProjectStore()

async function handleNewProject() {
  try {
    // 触发导入工作流（会调用 store.createProject）
    await triggerImportWorkflow()
    
    // createProject 内部已经调用了 fetchProjects()
    // 无需额外刷新
  } catch (error) {
    showErrorNotification('项目创建失败：' + error.message)
  }
}
</script>
```

**修改文件**：`frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue`

### 6. App Component (App.vue)

**职责**：应用根组件，处理菜单栏项目创建

**关键修复**：
```vue
<script setup lang="ts">
import { useProjectStore } from '@/stores/projectStore'

const projectStore = useProjectStore()

async function createProject() {
  try {
    const projectName = await showProjectNameDialog()
    
    // 调用 store 的 createProject（自动刷新）
    const newProject = await projectStore.createProject({
      name: projectName,
      description: ''
    })
    
    showSuccessNotification(`项目 "${newProject.name}" 创建成功`)
    
    // 导航到项目详情或控制面板
    router.push('/dashboard')
  } catch (error) {
    showErrorNotification('项目创建失败：' + error.message)
  }
}

// 监听菜单事件
window.electron.ipcRenderer.on('menu-action', (event, action) => {
  if (action === 'new-project') {
    createProject()
  }
})
</script>
```

**修改文件**：`frontend/NovelAnimeDesktop/src/renderer/App.vue`

### 7. ImportDialog Component (ImportDialog.vue)

**职责**：导入小说对话框，在导入时创建项目

**关键修复**：
```vue
<script setup lang="ts">
import { useProjectStore } from '@/stores/projectStore'
import apiService from '@/services/apiService'

const projectStore = useProjectStore()

async function handleImport(novelData) {
  try {
    let project = projectStore.currentProject
    
    // 如果没有当前项目，创建新项目
    if (!project) {
      // 直接调用后端 API 创建项目
      const response = await apiService.createProject({
        name: novelData.title,
        description: `从小说 "${novelData.title}" 创建`
      })
      
      // 规范化项目数据
      project = normalizeProject(response.data)
      
      // 设置为当前项目
      projectStore.setCurrentProject(project)
      
      // 刷新项目列表
      await projectStore.fetchProjects()
    }
    
    // 继续导入流程...
    const projectId = project.projectId || project.id
    await importNovel(projectId, novelData)
    
    showSuccessNotification('小说导入成功')
  } catch (error) {
    showErrorNotification('导入失败：' + error.message)
  }
}
</script>
```

**修改文件**：`frontend/NovelAnimeDesktop/src/renderer/components/ImportDialog.vue`

## Data Models

### Project 数据模型

```typescript
interface Project {
  // 主键（规范化后同时包含两个字段）
  id: string           // 前端使用
  projectId: string    // 后端使用
  
  // 基本信息
  name: string
  description: string
  
  // 时间戳
  createdAt: string
  updatedAt: string
  
  // 其他字段...
}
```

### CreateProjectRequest

```typescript
interface CreateProjectRequest {
  name: string
  description: string
}
```

### ApiResponse

```typescript
interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}
```

### 数据规范化函数

```typescript
/**
 * 规范化项目数据，确保 id 和 projectId 字段一致
 */
function normalizeProject(project: any): Project {
  const projectId = project.projectId || project.id
  
  return {
    ...project,
    id: projectId,
    projectId: projectId
  }
}
```

**修改文件**：`frontend/NovelAnimeDesktop/src/renderer/types/project.ts`


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several redundant properties:
- Properties 2.3, 3.3, 4.4, 5.5 all test the same behavior as 1.1 (fetchProjects called after createProject)
- Properties 7.2, 7.3, 7.4, 8.1, 8.4 are redundant with 1.2, 1.4, and 1.5
- Properties 2.5 and 3.5 test the same integration flow
- Properties 6.5 and 10.5 test the same empty state display

The following properties represent the unique, non-redundant correctness guarantees:

### Property 1: Project creation triggers automatic refresh
*For any* project creation through any entry point (DashboardPanel, DashboardView, App menu, ImportDialog), calling `projectStore.createProject()` should automatically call `projectStore.fetchProjects()` to refresh the project list from the backend.
**Validates: Requirements 1.1, 2.3, 3.3, 4.4, 5.5**

### Property 2: Project creation updates store array
*For any* successful project creation, the `projectStore.projects` array should contain the newly created project with both `id` and `projectId` fields populated.
**Validates: Requirements 1.2, 7.2**

### Property 3: Frontend-backend data consistency
*For any* project created through the store, fetching the project list from the backend should return a list that includes the newly created project with matching data.
**Validates: Requirements 1.3**

### Property 4: Fetch projects updates store from backend
*For any* call to `projectStore.fetchProjects()`, the store's `projects` array should be replaced with the latest data from the backend API.
**Validates: Requirements 1.4, 7.3**

### Property 5: Project data normalization
*For any* project data returned from the backend (whether with `id`, `projectId`, or both), the normalized project should have both `id` and `projectId` fields with equal values.
**Validates: Requirements 1.5, 5.3, 7.4, 8.1, 8.4**

### Property 6: Project count badge updates after refresh
*For any* project list refresh in DashboardPanel, the project count badge should display the current length of `projectStore.projects`.
**Validates: Requirements 2.4**

### Property 7: Active project display updates after refresh
*For any* project list refresh in DashboardView, the active project display should reflect the current `projectStore.currentProject`.
**Validates: Requirements 3.4**

### Property 8: Import checks for existing project
*For any* novel import operation, the system should check if `projectStore.currentProject` exists before creating a new project.
**Validates: Requirements 5.1**

### Property 9: ProjectList reactivity to store changes
*For any* change to `projectStore.projects` array (addition or removal), the ProjectList component should automatically re-render to reflect the change.
**Validates: Requirements 6.2, 6.3, 6.4**

### Property 10: Backend-first project creation
*For any* call to `projectStore.createProject()`, the backend API `apiService.createProject()` must be called and succeed before the project is added to the store's `projects` array.
**Validates: Requirements 7.1**

### Property 11: Error handling prevents store corruption
*For any* project creation that fails on the backend, the store's `projects` array should remain unchanged and an error message should be displayed.
**Validates: Requirements 7.5**

### Property 12: Backend identifier consistency
*For any* project data sent to the backend, the request should use `projectId` as the primary identifier field.
**Validates: Requirements 8.2**

### Property 13: Display field fallback logic
*For any* project displayed in a component, the display logic should successfully render using either `id` or `projectId` field (whichever is available).
**Validates: Requirements 8.3**

### Property 14: Project comparison with fallback
*For any* two projects being compared, the comparison should work correctly whether they use `id`, `projectId`, or both fields.
**Validates: Requirements 8.5**

### Property 15: Success notification with project name
*For any* successful project creation, a success notification should be displayed containing the created project's name.
**Validates: Requirements 9.1**

### Property 16: Error notification with failure reason
*For any* failed project creation, an error notification should be displayed containing the failure reason from the error object.
**Validates: Requirements 9.4**

### Property 17: Loading state management
*For any* call to `projectStore.fetchProjects()`, `isLoading` should be `true` during the fetch operation and `false` after completion (success or failure).
**Validates: Requirements 10.1, 10.3**

### Property 18: Error state management
*For any* failed project list load, `projectStore.isLoading` should be set to `false` and an error message should be displayed.
**Validates: Requirements 10.4**

## Error Handling

### 1. Project Creation Errors

**Scenario**: Backend API call fails during project creation

**Handling**:
```typescript
async createProject(projectData: CreateProjectRequest): Promise<Project> {
  try {
    const response = await apiService.createProject(projectData)
    const normalizedProject = normalizeProject(response.data)
    this.projects.push(normalizedProject)
    await this.fetchProjects()
    return normalizedProject
  } catch (error) {
    // 设置错误状态
    this.error = error.message || '项目创建失败'
    
    // 显示错误通知
    showErrorNotification(this.error)
    
    // 不修改 projects 数组
    // 抛出错误让调用者处理
    throw error
  }
}
```

### 2. Project List Fetch Errors

**Scenario**: Backend API call fails during project list fetch

**Handling**:
```typescript
async fetchProjects(): Promise<void> {
  try {
    this.isLoading = true
    this.error = null
    
    const response = await apiService.getProjects()
    const normalizedProjects = response.data.map(normalizeProject)
    this.projects = normalizedProjects
    
    this.isLoading = false
  } catch (error) {
    // 设置错误状态
    this.error = error.message || '加载项目列表失败'
    this.isLoading = false
    
    // 显示错误通知（带重试选项）
    showErrorNotification(this.error, {
      action: '重试',
      onAction: () => this.fetchProjects()
    })
    
    // 不清空现有 projects 数组（保留缓存数据）
    throw error
  }
}
```

### 3. Network Timeout Errors

**Scenario**: API request times out

**Handling**:
- Set timeout for all API calls (e.g., 30 seconds)
- Display user-friendly timeout message
- Provide retry option
- Log timeout for debugging

### 4. Data Normalization Errors

**Scenario**: Backend returns project without `id` or `projectId`

**Handling**:
```typescript
function normalizeProject(project: any): Project {
  const projectId = project.projectId || project.id
  
  if (!projectId) {
    console.error('Project missing both id and projectId:', project)
    throw new Error('Invalid project data: missing identifier')
  }
  
  return {
    ...project,
    id: projectId,
    projectId: projectId
  }
}
```

### 5. Component Mount Errors

**Scenario**: ProjectList component fails to load projects on mount

**Handling**:
```vue
<script setup lang="ts">
onMounted(async () => {
  try {
    await projectStore.fetchProjects()
  } catch (error) {
    console.error('Failed to load projects on mount:', error)
    // Error already handled by store and displayed to user
    // Component will show error state from store
  }
})
</script>
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and error conditions
- Specific UI interactions (button clicks, dialog displays)
- Component lifecycle events (onMounted)
- Error scenarios (network failures, invalid data)
- Integration flows (create → navigate → verify)

**Property Tests**: Verify universal properties across all inputs
- Data normalization works for all field name combinations
- Store updates correctly for all project creation entry points
- Reactivity works for all types of array changes
- Error handling preserves store integrity for all failure types

### Property-Based Testing Configuration

**Library**: We'll use **Vitest** with **fast-check** for property-based testing in TypeScript/Vue

**Configuration**:
```typescript
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

// Each property test runs 100 iterations
const NUM_RUNS = 100

describe('Project Store Properties', () => {
  it('Property 5: Project data normalization', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate projects with various field combinations
          id: fc.option(fc.uuid()),
          projectId: fc.option(fc.uuid()),
          name: fc.string(),
          description: fc.string()
        }),
        (project) => {
          // Feature: 10-03-fix-project-sync, Property 5: Project data normalization
          const normalized = normalizeProject(project)
          
          // Both fields should exist and be equal
          expect(normalized.id).toBeDefined()
          expect(normalized.projectId).toBeDefined()
          expect(normalized.id).toBe(normalized.projectId)
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })
})
```

**Test Organization**:
- Unit tests: `frontend/NovelAnimeDesktop/src/renderer/__tests__/unit/`
- Property tests: `frontend/NovelAnimeDesktop/src/renderer/__tests__/properties/`
- Integration tests: `frontend/NovelAnimeDesktop/src/renderer/__tests__/integration/`

**Test Tagging**:
Each property test must include a comment tag referencing the design property:
```typescript
// Feature: 10-03-fix-project-sync, Property 1: Project creation triggers automatic refresh
```

### Key Test Scenarios

**Unit Test Examples**:
1. DashboardPanel "+" button displays creation dialog
2. ProjectList displays loading indicator when `isLoading` is true
3. ProjectList displays empty state when `projects` is empty
4. Error notification displays when project creation fails
5. Success notification displays with project name after creation

**Property Test Examples**:
1. Project normalization works for all field name combinations
2. Store array updates correctly for all project data variations
3. Fetch always replaces store array with backend data
4. Error handling never corrupts store for any error type
5. Loading state transitions correctly for all fetch outcomes

**Integration Test Examples**:
1. Create project in DashboardPanel → Navigate to ProjectList → Verify project appears
2. Import novel without project → Verify project created → Verify appears in list
3. Create project via menu → Verify store updated → Verify backend has project

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 18 correctness properties implemented
- **Integration Tests**: All 4 entry points tested end-to-end
- **Error Scenarios**: All error handling paths tested

### Continuous Testing

- Run unit tests on every commit
- Run property tests (100 iterations) on every PR
- Run integration tests before release
- Monitor test execution time (property tests may be slower)
