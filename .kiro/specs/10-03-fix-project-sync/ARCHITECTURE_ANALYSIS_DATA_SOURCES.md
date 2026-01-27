# 数据源架构分析与重构建议

**日期**: 2026-01-26  
**类型**: 架构评估  
**优先级**: 🔴 高 - 影响系统稳定性和可维护性

---

## 当前架构问题

### 5个数据源分析

#### 1. 后端数据库 (Backend Database)

**职责**: 
- 持久化存储所有项目数据
- 提供 REST API 接口

**合理性**: ✅ **必需** - 权威数据源

**问题**: 
- 无问题，这是正确的架构

**建议**: 
- 保持不变
- 应该是**唯一的权威数据源** (Single Source of Truth)

---

#### 2. ProjectManager 内存缓存 (Memory Cache)

**职责**:
- 缓存已加载的项目对象
- 提供项目管理方法

**当前实现**:
```typescript
class ProjectManager {
  private projects: Map<string, Project>;  // 内存缓存
  private currentProject: Project | null;
  private recentProjects: ProjectMetadata[];
  
  async loadProject(projectId: string): Promise<Project | null> {
    // 先检查缓存
    if (this.projects.has(projectId)) {
      return this.projects.get(projectId)!;
    }
    // 再从文件系统加载
    const project = await fileSystemService.readProjectFile(projectId);
    this.projects.set(projectId, project);
    return project;
  }
}
```

**合理性**: ⚠️ **部分合理** - 缓存可以提升性能，但实现有问题

**问题**:
1. **缓存失效机制缺失**: 删除项目后，缓存不会自动清除
2. **与 Pinia store 重复**: projectStore 也在做同样的事情
3. **数据不一致风险**: 缓存可能与后端数据不同步
4. **职责不清**: ProjectManager 既管理缓存，又管理文件系统

**建议**: 
- ❌ **移除 ProjectManager 的缓存功能**
- ✅ 只保留 ProjectManager 作为"服务层"，不缓存数据
- ✅ 所有缓存由 Pinia store 统一管理

**重构方案**:
```typescript
// 重构后的 ProjectManager - 只提供服务，不缓存
class ProjectManager {
  // 移除: private projects: Map<string, Project>;
  // 移除: private currentProject: Project | null;
  
  async loadProject(projectId: string): Promise<Project | null> {
    // 直接从后端加载，不缓存
    return await apiService.getProject(projectId);
  }
  
  async saveProject(project: Project): Promise<boolean> {
    // 直接保存到后端
    return await apiService.updateProject(project);
  }
}
```

---

#### 3. localStorage (Browser Storage)

**职责**:
- 缓存当前项目ID、小说ID等
- 持久化用户会话数据

**当前实现**:
```javascript
// 多个 key，分散在各处
localStorage.setItem('novel_anime_current_project_id', projectId);
localStorage.setItem('novel_anime_current_novel_id', novelId);
localStorage.setItem('novel_anime_current_novel_title', title);
localStorage.setItem(`novel_${novelId}`, JSON.stringify(novelData));
localStorage.setItem('novel_anime_project_workflow_map', JSON.stringify(map));
localStorage.setItem('recentProjects', JSON.stringify(recentProjects));
localStorage.setItem('navigation-state', JSON.stringify(state));
```

**合理性**: ⚠️ **部分合理** - 持久化会话数据是合理的，但实现混乱

**问题**:
1. **数据关联性差**: key 没有关联 projectId，导致项目切换时数据混乱
2. **生命周期管理缺失**: 数据永不过期，删除项目后仍然存在
3. **职责过重**: 既存储会话数据，又存储业务数据（小说内容）
4. **分散管理**: 多个组件都在直接操作 localStorage

**建议**:
- ⚠️ **重新设计 localStorage 使用策略**
- ✅ 只存储"会话数据"，不存储"业务数据"
- ✅ 统一管理，不要分散在各个组件

**重构方案**:

**方案 A: 最小化使用（推荐）**
```javascript
// 只存储必要的会话数据
localStorage.setItem('session', JSON.stringify({
  currentProjectId: 'xxx',
  lastAccessTime: Date.now(),
  // 不存储 novelId, novelData 等业务数据
}));

// 业务数据从后端获取
const project = await apiService.getProject(projectId);
const novel = await novelApi.getNovel(projectId, novelId);
```

**方案 B: 关联 projectId**
```javascript
// 如果必须使用 localStorage，关联 projectId
localStorage.setItem(`project_${projectId}_session`, JSON.stringify({
  currentNovelId: 'xxx',
  lastAccessTime: Date.now()
}));

// 切换项目时清除旧数据
function switchProject(newProjectId) {
  const oldProjectId = getCurrentProjectId();
  localStorage.removeItem(`project_${oldProjectId}_session`);
  // 加载新项目数据
}
```

---

#### 4. navigationStore.workflowState (Pinia Store)

**职责**:
- 管理工作流执行状态
- 跟踪用户在工作流中的进度

**当前实现**:
```javascript
workflowState: {
  stage: 'idle',  // idle, importing, character-review, workflow-ready, executing, completed
  importedFile: null,
  parseResult: null,
  charactersConfirmed: false,
  executionResult: null
}
```

**合理性**: ✅ **合理** - 工作流状态应该由专门的 store 管理

**问题**:
1. **持久化策略不当**: 状态被持久化到 localStorage，导致项目切换时状态残留
2. **生命周期不清**: 什么时候重置状态？项目切换？项目删除？
3. **与项目状态混淆**: workflowState.stage 和 project.status 有重叠

**建议**:
- ✅ **保留 navigationStore.workflowState**
- ⚠️ **改进持久化策略**
- ✅ **明确生命周期管理**

**重构方案**:
```javascript
// 方案 A: 不持久化工作流状态（推荐）
// 工作流状态是"临时的"，不应该持久化
// 项目状态才是"持久的"，存储在后端

workflowState: {
  stage: 'idle',
  // ... 其他字段
}

// 不调用 persistNavigationState()
// 刷新页面后，从 project.status 恢复工作流状态

// 方案 B: 关联 projectId 持久化
persistNavigationState() {
  const projectId = projectStore.currentProject?.id;
  if (projectId) {
    localStorage.setItem(`workflow_state_${projectId}`, JSON.stringify({
      stage: this.workflowState.stage,
      charactersConfirmed: this.workflowState.charactersConfirmed
    }));
  }
}

// 切换项目时清除旧状态
switchProject(newProjectId) {
  this.resetWorkflowState();
  // 加载新项目的工作流状态
  const stored = localStorage.getItem(`workflow_state_${newProjectId}`);
  if (stored) {
    this.workflowState = JSON.parse(stored);
  }
}
```

---

#### 5. projectStore (Pinia Store)

**职责**:
- 管理项目列表
- 管理当前项目
- 提供项目操作接口

**当前实现**:
```javascript
state: () => ({
  projectManager: new ProjectManager(),  // ❌ 包含另一个缓存层
  currentProject: null,
  projects: [],
  recentProjects: [],
  isLoading: false,
  error: null
})
```

**合理性**: ✅ **合理** - 应该是前端的唯一数据管理层

**问题**:
1. **包含 ProjectManager**: 导致双重缓存
2. **职责不清**: 既管理状态，又包含业务逻辑（ProjectManager）
3. **数据同步复杂**: 需要同时更新 store 和 ProjectManager

**建议**:
- ✅ **保留 projectStore 作为唯一的前端数据层**
- ❌ **移除 ProjectManager 的缓存功能**
- ✅ **projectStore 直接调用 API，不通过 ProjectManager**

**重构方案**:
```javascript
// 重构后的 projectStore
state: () => ({
  // 移除: projectManager: new ProjectManager(),
  currentProject: null,
  projects: [],
  isLoading: false,
  error: null
}),

actions: {
  async fetchProjects() {
    this.isLoading = true;
    try {
      // 直接调用 API，不通过 ProjectManager
      const result = await apiService.getProjects();
      this.projects = result.projects;
    } catch (error) {
      this.error = error.message;
    } finally {
      this.isLoading = false;
    }
  },
  
  async loadProject(projectId) {
    // 先检查缓存
    let project = this.projects.find(p => p.id === projectId);
    
    // 如果缓存中没有，从后端加载
    if (!project) {
      const result = await apiService.getProject(projectId);
      project = result.project;
      this.projects.push(project);
    }
    
    this.currentProject = project;
    return project;
  }
}
```

---

## 推荐架构

### 理想的数据流

```
┌─────────────────────────────────────────────────────────┐
│                    后端数据库 (Backend)                    │
│              Single Source of Truth (权威数据源)           │
└─────────────────────────────────────────────────────────┘
                            ↑ ↓
                    REST API (HTTP)
                            ↑ ↓
┌─────────────────────────────────────────────────────────┐
│                   apiService (API 层)                     │
│              封装所有 HTTP 请求，处理错误                    │
└─────────────────────────────────────────────────────────┘
                            ↑ ↓
┌─────────────────────────────────────────────────────────┐
│                 Pinia Stores (状态管理层)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ projectStore │  │navigationStore│  │  uiStore     │  │
│  │ - projects   │  │ - activeNav   │  │ - loading    │  │
│  │ - current    │  │ - panelContext│  │ - error      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│              唯一的前端数据缓存和状态管理                    │
└─────────────────────────────────────────────────────────┘
                            ↑ ↓
┌─────────────────────────────────────────────────────────┐
│                   Vue Components (视图层)                 │
│  通过 computed 和 watch 响应式地使用 store 数据             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              localStorage (可选的会话持久化)                │
│  - 只存储 session 数据（当前 projectId）                   │
│  - 不存储业务数据                                          │
│  - 页面刷新时恢复会话                                       │
└─────────────────────────────────────────────────────────┘
```

### 数据流向

**读取数据**:
```
Component → Store (检查缓存) → API → Backend
                ↓
            返回数据
```

**写入数据**:
```
Component → Store → API → Backend
                         ↓
                    更新成功后
                         ↓
            Store 更新缓存
```

**会话恢复**:
```
页面刷新 → 从 localStorage 读取 sessionId
         → Store 从 Backend 重新加载数据
         → 不使用 localStorage 中的业务数据
```

---

## 重构计划

### 阶段 1: 清理 ProjectManager（高优先级）

**目标**: 移除 ProjectManager 的缓存功能

**步骤**:
1. 修改 ProjectManager，移除 `projects: Map` 和 `currentProject`
2. ProjectManager 只保留"服务方法"，不缓存数据
3. projectStore 直接调用 apiService，不通过 ProjectManager
4. 测试所有项目操作功能

**影响范围**: 中等
**预计工作量**: 2-3 小时
**风险**: 低

### 阶段 2: 重新设计 localStorage 使用（高优先级）

**目标**: 只存储会话数据，不存储业务数据

**步骤**:
1. 创建 `SessionManager` 统一管理 localStorage
2. 定义清晰的 session 数据结构
3. 移除所有业务数据的 localStorage 存储
4. 业务数据从后端获取

**影响范围**: 大
**预计工作量**: 4-6 小时
**风险**: 中

### 阶段 3: 优化 workflowState 持久化（中优先级）

**目标**: 明确工作流状态的生命周期

**步骤**:
1. 决定是否持久化 workflowState
2. 如果持久化，关联 projectId
3. 项目切换时清除旧状态
4. 从 project.status 恢复工作流状态

**影响范围**: 小
**预计工作量**: 1-2 小时
**风险**: 低

### 阶段 4: 统一数据访问接口（低优先级）

**目标**: 所有组件通过 store 访问数据

**步骤**:
1. 审查所有组件，找出直接调用 API 的地方
2. 统一改为通过 store 访问
3. 添加数据访问的最佳实践文档

**影响范围**: 大
**预计工作量**: 6-8 小时
**风险**: 低

---

## 立即行动 vs 长期重构

### 立即行动（已完成）✅

**Hotfix 11**: 
- ✅ 删除项目时清理 localStorage
- ✅ 加载项目时验证数据
- ✅ 重置 workflowState

**效果**: 
- 解决了"数据复活"问题
- 但没有解决架构问题

### 短期优化（1-2周内）⚠️

**重构 ProjectManager**:
- 移除缓存功能
- 简化为纯服务层

**重新设计 localStorage**:
- 只存储会话数据
- 统一管理

**效果**:
- 减少数据源冲突
- 提升代码可维护性

### 长期重构（1-2个月）🔄

**完整的架构优化**:
- 实施"单一数据源"原则
- 统一数据访问接口
- 完善文档和测试

**效果**:
- 彻底解决数据一致性问题
- 大幅提升系统稳定性

---

## 建议

### 对于当前问题

✅ **Hotfix 11 已经足够** - 可以解决用户遇到的问题

### 对于长期发展

⚠️ **需要重构** - 当前架构存在明显问题：

1. **数据源过多**: 5个数据源导致同步困难
2. **职责不清**: ProjectManager 和 projectStore 职责重叠
3. **缓存混乱**: 多层缓存导致数据不一致
4. **localStorage 滥用**: 存储了不应该存储的业务数据

### 推荐方案

**分阶段重构**:
1. ✅ **立即**: 应用 Hotfix 11，解决紧急问题
2. ⚠️ **1周内**: 重构 ProjectManager，移除缓存
3. ⚠️ **2周内**: 重新设计 localStorage 使用
4. 🔄 **1个月内**: 完整的架构优化

**优先级**:
- 🔴 高: 清理 ProjectManager 缓存
- 🔴 高: 重新设计 localStorage
- 🟡 中: 优化 workflowState 持久化
- 🟢 低: 统一数据访问接口

---

## 总结

### 当前状态

- ❌ **架构混乱**: 5个数据源，职责不清
- ⚠️ **技术债务**: 多层缓存，同步困难
- ✅ **功能可用**: Hotfix 11 解决了紧急问题

### 建议

1. **短期**: 应用 Hotfix 11，继续开发新功能
2. **中期**: 分阶段重构，逐步优化架构
3. **长期**: 实施"单一数据源"原则，彻底解决问题

### 是否需要立即重构？

**我的建议**: ⚠️ **不需要立即全面重构**

**理由**:
1. Hotfix 11 已经解决了用户遇到的问题
2. 全面重构风险大，可能引入新问题
3. 分阶段重构更安全，可以逐步验证

**但是**: 🔴 **需要尽快开始阶段1重构**（清理 ProjectManager）

这样可以：
- 减少未来的技术债务
- 降低新功能开发的复杂度
- 提升代码可维护性

---

**版本**: v1.0  
**更新**: 2026-01-26  
**建议**: 先测试 Hotfix 11，再决定是否重构
