# Hotfix 11: 项目数据复活问题 - 根本原因分析

**日期**: 2026-01-26  
**状态**: 🔍 深度诊断中  
**严重程度**: 🔴 高 - 数据一致性问题

---

## 问题描述

**用户报告**:
> "刚刚删除的项目,然后重新建一个项目,同名,发现当前项目完成100% 这个问题又出现了."

**现象**:
1. 删除项目 A
2. 创建同名项目 A
3. 新项目显示"完成100%"（应该是0%）
4. 之前的修复（Hotfix 6, 7）没有解决根本问题

---

## 根本原因分析

### 问题的本质

**代码已经乱成一锅粥** - 用户说得对！

存在**多个独立的数据源**，它们之间没有正确同步：

1. **后端数据库** (authoritative source)
   - 项目数据
   - 小说数据
   - 工作流状态

2. **ProjectManager 内存缓存** (Map<string, Project>)
   - 缓存项目对象
   - 不会自动清除已删除的项目

3. **localStorage 缓存** (多个 key)
   - `novel_anime_current_project_id` - 当前项目ID
   - `novel_anime_current_novel_id` - 当前小说ID
   - `novel_anime_current_novel_title` - 小说标题
   - `novel_${novelId}` - 小说完整数据（包括章节）
   - `recentProjects` - 最近项目列表
   - `novel_anime_project_workflow_map` - 项目到工作流的映射

4. **navigationStore.workflowState** (Pinia store)
   - `stage` - 工作流阶段
   - `charactersConfirmed` - 角色是否确认
   - `executionResult` - 执行结果

5. **projectStore** (Pinia store)
   - `currentProject` - 当前项目
   - `projects` - 项目列表

### 数据流混乱的表现

#### 场景 1: 删除项目后
```
1. 后端删除成功 ✅
2. projectStore.projects 更新 ✅
3. ProjectManager 内存缓存 - 可能未清除 ❌
4. localStorage 数据 - 完全未清除 ❌
5. navigationStore.workflowState - 未清除 ❌
```

#### 场景 2: 创建同名项目
```
1. 后端创建新项目（新ID）✅
2. projectStore 添加新项目 ✅
3. loadActiveProject() 被调用
4. 从 localStorage 读取旧的 novelId ❌
5. 从 localStorage 读取旧的小说数据（包含章节）❌
6. navigationStore.workflowState 仍然是旧的 completed 状态 ❌
7. 显示"完成100%" ❌
```

### 关键代码问题

#### 问题 1: loadActiveProject() 从 localStorage 恢复旧数据

**文件**: `DashboardView.vue` 行 ~700-750

```javascript
// 如果还是没有 novelId，尝试从 localStorage 恢复
if (!currentNovelId.value) {
  const storedNovelId = localStorage.getItem('novel_anime_current_novel_id');
  if (storedNovelId) {
    currentNovelId.value = storedNovelId;  // ❌ 这是旧项目的 novelId！
    console.log('📚 Restored novelId from localStorage:', currentNovelId.value);
    if (activeProject.value.status !== 'completed' && 
        (!activeProject.value.status || activeProject.value.status === 'active')) {
      activeProject.value.status = 'imported';  // ❌ 错误的状态
    }
  }
}
```

#### 问题 2: syncWorkflowStateFromProject() 不清除旧状态

**文件**: `DashboardView.vue` 行 ~800-850

```javascript
function syncWorkflowStateFromProject(project) {
  // ❌ 这个函数只会"添加"状态，不会"清除"旧状态
  // 如果 navigationStore.workflowState.stage 已经是 'completed'
  // 它不会被重置为 'idle'
}
```

#### 问题 3: navigationStore.workflowState 永久保留

**文件**: `navigation.js`

```javascript
// ❌ workflowState 是持久化的，不会在项目切换时清除
state: () => ({
  workflowState: {
    stage: 'idle',  // 但一旦变成 'completed'，就永远是 'completed'
    charactersConfirmed: false,  // 同样，一旦 true，就永远 true
    // ...
  }
})
```

#### 问题 4: localStorage 数据永不过期

**多个文件**:

```javascript
// ❌ 设置 localStorage 时没有关联 projectId
localStorage.setItem('novel_anime_current_novel_id', novelId);
localStorage.setItem(`novel_${novelId}`, JSON.stringify(novelData));

// ❌ 删除项目时不清除相关的 localStorage 数据
// 导致下次创建同名项目时，旧数据仍然存在
```

---

## 数据一致性问题的根源

### 1. 缺少"数据生命周期管理"

**应该有的逻辑**:
```
项目创建 → 初始化所有数据源
项目切换 → 清除旧数据，加载新数据
项目删除 → 清除所有相关数据
```

**实际情况**:
```
项目创建 → 只创建后端数据
项目切换 → 部分数据未清除
项目删除 → 只删除后端数据，其他数据残留
```

### 2. 缺少"单一数据源原则"

**应该有的架构**:
```
后端数据库 (Single Source of Truth)
    ↓
projectStore (唯一接口)
    ↓
所有组件通过 store 访问数据
```

**实际情况**:
```
后端数据库
ProjectManager 缓存
localStorage 缓存
navigationStore
projectStore
    ↓
组件从多个地方读取数据，导致不一致
```

### 3. 缺少"数据验证机制"

**应该有的逻辑**:
```
读取 localStorage 数据前 → 验证是否属于当前项目
使用缓存数据前 → 验证是否仍然有效
显示状态前 → 验证数据来源的优先级
```

**实际情况**:
```
直接使用 localStorage 数据，不验证
直接使用缓存数据，不验证
多个数据源冲突时，没有明确的优先级
```

---

## 修复策略

### 策略 A: 彻底清理（推荐）

**原则**: 删除项目时，清除所有相关数据

**需要修改**:
1. `projectStore.deleteProject()` - 清除 localStorage
2. `navigationStore` - 添加 `resetWorkflowState()` 方法
3. `DashboardView.loadActiveProject()` - 验证 localStorage 数据
4. `ProjectManager.deleteProject()` - 清除内存缓存

### 策略 B: 数据关联

**原则**: localStorage 数据关联 projectId，读取时验证

**需要修改**:
1. localStorage key 格式: `project_${projectId}_novel_id`
2. 读取时验证 projectId 是否匹配
3. 项目切换时清除旧项目的 localStorage

### 策略 C: 单一数据源

**原则**: 只从后端读取数据，不使用 localStorage 缓存

**需要修改**:
1. 移除所有 localStorage 读取逻辑
2. 所有数据从后端 API 获取
3. 使用 Pinia store 作为唯一缓存层

---

## 推荐修复方案

**综合策略 A + B**:

### 第一步: 清理 localStorage（立即修复）

在 `projectStore.deleteProject()` 中添加:
```javascript
// 清除所有相关的 localStorage 数据
localStorage.removeItem('novel_anime_current_project_id');
localStorage.removeItem('novel_anime_current_novel_id');
localStorage.removeItem('novel_anime_current_novel_title');

// 清除小说数据（需要先获取 novelId）
const novelId = localStorage.getItem('novel_anime_current_novel_id');
if (novelId) {
  localStorage.removeItem(`novel_${novelId}`);
}

// 清除工作流映射
const mapStr = localStorage.getItem('novel_anime_project_workflow_map');
if (mapStr) {
  const map = JSON.parse(mapStr);
  delete map[projectId];
  localStorage.setItem('novel_anime_project_workflow_map', JSON.stringify(map));
}
```

### 第二步: 重置工作流状态

在 `navigationStore` 添加:
```javascript
resetWorkflowState() {
  this.workflowState = {
    stage: 'idle',
    charactersConfirmed: false,
    parseResult: null,
    executionResult: null,
    currentNovelId: null,
    currentProjectId: null
  };
}
```

在项目删除和切换时调用。

### 第三步: 验证 localStorage 数据

在 `loadActiveProject()` 中:
```javascript
// 验证 localStorage 中的 projectId 是否匹配
const storedProjectId = localStorage.getItem('novel_anime_current_project_id');
if (storedProjectId && storedProjectId !== projectId) {
  // 不匹配，清除旧数据
  console.warn('⚠️ localStorage projectId mismatch, clearing...');
  localStorage.removeItem('novel_anime_current_novel_id');
  localStorage.removeItem('novel_anime_current_novel_title');
  // 不使用旧的 novelId
  return;
}
```

### 第四步: 项目切换时清理

在 `projectStore.setCurrentProject()` 中:
```javascript
// 如果切换到不同的项目，清除旧项目的状态
if (this.currentProject && this.currentProject.id !== projectId) {
  // 清除工作流状态
  navigationStore.resetWorkflowState();
  
  // 清除 localStorage（如果不匹配）
  const storedProjectId = localStorage.getItem('novel_anime_current_project_id');
  if (storedProjectId !== projectId) {
    localStorage.removeItem('novel_anime_current_novel_id');
    localStorage.removeItem('novel_anime_current_novel_title');
  }
}
```

---

## 测试计划

### 测试场景 1: 删除后重建同名项目
1. 创建项目 "测试项目"
2. 导入小说，完成工作流
3. 删除项目
4. 重新创建 "测试项目"
5. **验证**: 新项目进度应该是 0%，不是 100%

### 测试场景 2: 切换项目
1. 创建项目 A，完成工作流
2. 创建项目 B
3. 切换到项目 B
4. **验证**: 项目 B 的状态不应该受项目 A 影响

### 测试场景 3: 浏览器刷新
1. 创建项目，完成工作流
2. 刷新浏览器
3. **验证**: 项目状态正确恢复

---

## 下一步行动

1. **立即修复**: 实施"清理 localStorage"方案
2. **中期重构**: 实施"数据关联"方案
3. **长期优化**: 考虑"单一数据源"架构

---

**版本**: v1.0  
**更新**: 2026-01-26  
**状态**: 诊断完成，准备实施修复
