# 前端架构重构方案

**日期**: 2026-01-26  
**目标**: 从根本上重构前端架构，消除所有不合理的设计  
**原则**: 功能宁可重写，也不要垃圾存留

---

## 🎯 重构原则

### 核心原则

1. **单一数据源**: Backend 是唯一真相来源
2. **单向数据流**: Backend → Store → Component（只读）
3. **职责分离**: 一个模块只做一件事
4. **类型安全**: 全部 TypeScript，无 any
5. **无推断逻辑**: 前端不推断状态，只显示后端数据

### 删除原则

1. **状态推断**: 任何根据其他数据推断状态的代码 → 删除
2. **硬编码**: 任何魔法数字和硬编码映射 → 删除
3. **重复逻辑**: 任何重复的功能实现 → 删除
4. **混乱状态**: 任何与后端不同步的本地状态 → 删除
5. **臃肿组件**: 任何超过 300 行的组件 → 拆分

---

## 🔥 Phase 1: 立即删除（P0）

### 1.1 删除 navigationStore.workflowState

**原因**: 
- 与 project.status 重复
- 导致状态不同步
- 引发大量推断逻辑

**删除内容**:

```typescript
// ❌ stores/navigation.js
workflowState: {
  stage: 'import',
  charactersConfirmed: false,
  workflowCompleted: false
}

// ❌ 所有相关方法
setWorkflowState()
resetWorkflowState()
startImport()
setParseResult()
confirmCharacters()
completeWorkflow()
```

**替代方案**:
```typescript
// ✅ 直接使用 project.status
const isCharactersConfirmed = computed(() => 
  project.value?.status === 'characters_confirmed' ||
  project.value?.status === 'generating' ||
  project.value?.status === 'completed'
)

const isWorkflowCompleted = computed(() =>
  project.value?.status === 'completed'
)
```

**影响文件**:
- `stores/navigation.js` - 删除 workflowState
- `views/DashboardView.vue` - 删除所有 workflowState 引用
- `views/WorkflowEditor.vue` - 删除 workflowState 引用

### 1.2 删除 syncWorkflowStateFromProject

**原因**: 
- 状态同步逻辑本身就是错误的
- 应该只有一个状态源（Backend）

**删除内容**:

```typescript
// ❌ DashboardView.vue
function syncWorkflowStateFromProject(project) {
  if (!project) return;
  
  const status = project.status || 'active';
  
  // 根据项目状态设置工作流阶段
  if (status === 'analyzed' || status === 'parsed') {
    navigationStore.setWorkflowState({
      stage: 'character-review',
      charactersConfirmed: false
    });
  }
  // ... 更多推断逻辑
}
```

**替代方案**: 无需替代，直接使用 project.status

### 1.3 删除 updateStepsFromProject

**原因**:
- 硬编码的步骤映射
- 根据 workflowState 推断步骤
- 应该由后端返回步骤信息

**删除内容**:

```typescript
// ❌ DashboardView.vue
function updateStepsFromProject(project) {
  // 检查 workflowState.stage === 'completed'
  if (navigationStore.workflowState.stage === 'completed') {
    workflowSteps.value.forEach((step) => {
      step.completed = true;
    });
  }
  
  // 检查 workflowState.charactersConfirmed
  if (navigationStore.workflowState.charactersConfirmed) {
    // ...
  }
  
  // 状态到步骤的映射
  const statusMap = { ... };
}
```

**替代方案**:

```typescript
// ✅ 简化版本，直接根据 project.status
function updateStepsFromProject(project) {
  if (!project) return;
  
  // 简单映射，无推断
  const statusToStep = {
    'active': 0,
    'importing': 0,
    'imported': 1,
    'parsing': 1,
    'parsed': 2,
    'analyzing': 2,
    'analyzed': 2,
    'characters_confirmed': 3,
    'generating': 3,
    'completed': 4
  };
  
  const targetStep = statusToStep[project.status] ?? 0;
  currentStep.value = targetStep;
  
  workflowSteps.value.forEach((step, index) => {
    step.completed = index < targetStep;
    step.enabled = index <= targetStep;
  });
}
```

### 1.4 删除 workflowSteps 硬编码

**原因**:
- 步骤定义应该由后端返回或配置文件定义
- 不应该硬编码在组件中

**删除内容**:

```typescript
// ❌ DashboardView.vue
const workflowSteps = ref([
  { id: 1, title: '导入小说', description: '上传TXT文件', completed: false, enabled: true },
  { id: 2, title: '智能解析', description: '提取章节和场景', completed: false, enabled: false },
  { id: 3, title: '角色确认', description: '审核AI识别的角色', completed: false, enabled: false },
  { id: 4, title: '生成动漫', description: '执行工作流生成视频', completed: false, enabled: false }
]);
```

**替代方案**:

```typescript
// ✅ 配置文件
// config/workflowSteps.ts
export const WORKFLOW_STEPS = [
  { id: 'import', title: '导入小说', description: '上传TXT文件' },
  { id: 'parse', title: '智能解析', description: '提取章节和场景' },
  { id: 'characters', title: '角色确认', description: '审核AI识别的角色' },
  { id: 'generate', title: '生成动漫', description: '执行工作流生成视频' }
] as const;

// ✅ 或者从后端获取
async function loadWorkflowSteps() {
  const response = await apiService.get('/workflow/steps');
  workflowSteps.value = response.data.steps;
}
```

---

## 🔧 Phase 2: 重构 DashboardView.vue（P1）

### 2.1 拆分策略

**目标**: 1600+ 行拆分为 < 300 行的组件

**新组件结构**:

```
views/
├─ DashboardView.vue (容器，150 lines)
│   ├─ 路由逻辑
│   ├─ 数据加载
│   └─ 组件组合
│
└─ dashboard/
    ├─ ProjectHeader.vue (项目信息，80 lines)
    ├─ WorkflowSteps.vue (步骤显示，120 lines)
    ├─ NovelImportSection.vue (小说导入，200 lines)
    ├─ CharacterSection.vue (角色管理，150 lines)
    └─ ProjectActions.vue (操作按钮，100 lines)
```

### 2.2 DashboardView.vue（重写）

```vue
<template>
  <div class="dashboard-view">
    <ProjectHeader 
      :project="currentProject"
      @update="handleProjectUpdate"
    />
    
    <WorkflowSteps 
      :project="currentProject"
      :current-step="currentStep"
    />
    
    <NovelImportSection
      v-if="currentStep === 0"
      :project-id="currentProjectId"
      @imported="handleNovelImported"
    />
    
    <CharacterSection
      v-if="currentStep === 2"
      :project-id="currentProjectId"
      :novel-id="currentNovelId"
      @confirmed="handleCharactersConfirmed"
    />
    
    <ProjectActions
      :project="currentProject"
      :current-step="currentStep"
      @action="handleAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { useSessionStore } from '@/stores/sessionStore'

const projectStore = useProjectStore()
const sessionStore = useSessionStore()

// 当前项目（从 Store 获取）
const currentProject = computed(() => 
  projectStore.getCurrentProject(sessionStore.currentProjectId)
)

// 当前步骤（根据项目状态计算）
const currentStep = computed(() => {
  const status = currentProject.value?.status
  const stepMap = {
    'active': 0,
    'imported': 1,
    'parsed': 2,
    'characters_confirmed': 3,
    'completed': 4
  }
  return stepMap[status] ?? 0
})

// 事件处理
function handleProjectUpdate(data: any) {
  projectStore.updateProject(currentProject.value.id, data)
}

function handleNovelImported() {
  // 刷新项目状态
  projectStore.fetchProject(currentProject.value.id)
}

function handleCharactersConfirmed() {
  // 刷新项目状态
  projectStore.fetchProject(currentProject.value.id)
}

function handleAction(action: string) {
  // 处理操作
}
</script>
```

**优点**:
- 清晰的组件职责
- 单向数据流
- 无状态推断
- 易于测试

---

## 🏗️ Phase 3: 重构 Stores（P1）

### 3.1 projectStore.ts（重写）

```typescript
// stores/projectStore.ts
import { defineStore } from 'pinia'
import { projectApi } from '@/api/projectApi'
import type { Project, CreateProjectDto, UpdateProjectDto } from '@/types/project'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [] as Project[],
    currentProjectId: null as string | null,
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    // 获取当前项目
    getCurrentProject: (state) => (id: string | null) => {
      if (!id) return null
      return state.projects.find(p => p.id === id) ?? null
    },

    // 获取项目列表
    getProjects: (state) => state.projects,

    // 是否正在加载
    getIsLoading: (state) => state.isLoading
  },

  actions: {
    // 获取项目列表
    async fetchProjects() {
      this.isLoading = true
      this.error = null
      
      try {
        const projects = await projectApi.list()
        this.projects = projects
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 获取单个项目
    async fetchProject(id: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const project = await projectApi.get(id)
        
        // 更新或添加到列表
        const index = this.projects.findIndex(p => p.id === id)
        if (index >= 0) {
          this.projects[index] = project
        } else {
          this.projects.push(project)
        }
        
        return project
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 创建项目
    async createProject(data: CreateProjectDto) {
      this.isLoading = true
      this.error = null
      
      try {
        const project = await projectApi.create(data)
        this.projects.push(project)
        this.currentProjectId = project.id
        return project
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 更新项目
    async updateProject(id: string, data: UpdateProjectDto) {
      this.isLoading = true
      this.error = null
      
      try {
        const project = await projectApi.update(id, data)
        
        // 更新列表中的项目
        const index = this.projects.findIndex(p => p.id === id)
        if (index >= 0) {
          this.projects[index] = project
        }
        
        return project
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 删除项目
    async deleteProject(id: string) {
      this.isLoading = true
      this.error = null
      
      try {
        await projectApi.delete(id)
        
        // 从列表中移除
        this.projects = this.projects.filter(p => p.id !== id)
        
        // 如果是当前项目，清除
        if (this.currentProjectId === id) {
          this.currentProjectId = null
        }
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 设置当前项目
    setCurrentProject(id: string | null) {
      this.currentProjectId = id
    }
  }
})
```

**优点**:
- 完全类型化
- 单一职责
- 无状态推断
- 易于测试

### 3.2 sessionStore.ts（新建）

```typescript
// stores/sessionStore.ts
import { defineStore } from 'pinia'
import { SessionManager } from '@/utils/SessionManager'

export const useSessionStore = defineStore('session', {
  state: () => ({
    currentProjectId: null as string | null,
    currentNovelId: null as string | null,
    currentWorkflowId: null as string | null
  }),

  actions: {
    // 设置当前项目
    setCurrentProject(id: string | null) {
      this.currentProjectId = id
      if (id) {
        SessionManager.setCurrentProject(id)
      } else {
        SessionManager.clearSession()
      }
    },

    // 设置当前小说
    setCurrentNovel(id: string | null) {
      this.currentNovelId = id
    },

    // 设置当前工作流
    setCurrentWorkflow(id: string | null) {
      this.currentWorkflowId = id
    },

    // 清除会话
    clearSession() {
      this.currentProjectId = null
      this.currentNovelId = null
      this.currentWorkflowId = null
      SessionManager.clearSession()
    },

    // 验证会话
    validateSession(projectId: string): boolean {
      return SessionManager.validateProjectData(projectId)
    },

    // 从 SessionManager 恢复
    restoreFromSession() {
      const projectId = SessionManager.getCurrentProject()
      if (projectId) {
        this.currentProjectId = projectId
      }
    }
  }
})
```

**优点**:
- 统一会话管理
- 与 SessionManager 集成
- 类型安全

### 3.3 删除 navigationStore（部分）

**保留**:
- `panelContext`（面板上下文）
- `executionResult`（执行结果）

**删除**:
- ❌ `workflowState`
- ❌ `setWorkflowState()`
- ❌ `resetWorkflowState()`
- ❌ `startImport()`
- ❌ `setParseResult()`
- ❌ `confirmCharacters()`
- ❌ `completeWorkflow()`

---

## 📋 执行清单

### 立即执行（今天）

- [ ] 1. 删除 `navigationStore.workflowState`
- [ ] 2. 删除 `syncWorkflowStateFromProject()`
- [ ] 3. 删除 `updateStepsFromProject()` 中的 workflowState 检查
- [ ] 4. 删除所有 `navigationStore.workflowState` 引用
- [ ] 5. 测试新建项目功能

### 短期执行（本周）

- [ ] 6. 创建 `sessionStore.ts`
- [ ] 7. 重构 `projectStore.js` → `projectStore.ts`
- [ ] 8. 拆分 `DashboardView.vue`
- [ ] 9. 创建类型定义文件
- [ ] 10. 测试所有功能

### 中期执行（下周）

- [ ] 11. 重构 `workflowStore.ts`
- [ ] 12. 重构 `novelStore.js` → `novelStore.ts`
- [ ] 13. 创建统一 API Layer
- [ ] 14. 删除所有硬编码
- [ ] 15. 完整测试

---

## ✅ 成功标准

### 代码质量

1. ✅ 所有 Store 都是 TypeScript
2. ✅ 所有组件 < 300 行
3. ✅ 无 `any` 类型
4. ✅ 无硬编码
5. ✅ 无重复逻辑

### 架构质量

1. ✅ 单一数据源（Backend）
2. ✅ 单向数据流
3. ✅ 职责分离
4. ✅ 无状态推断
5. ✅ 类型安全

### 功能质量

1. ✅ 新建项目状态正确
2. ✅ 项目切换无问题
3. ✅ 刷新浏览器状态保持
4. ✅ 无数据污染
5. ✅ 无状态混乱

---

**下一步**: 等待用户确认，然后立即开始执行 Phase 1 的删除工作。
