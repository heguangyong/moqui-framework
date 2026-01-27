# Hotfix 12: 新建项目显示50%进度问题诊断

**日期**: 2026-01-26  
**问题**: 通过项目面板加号新建项目，直接显示进度50%  
**用户反馈**: "刚刚通过项目面板中的加号新建的项目,直接进度就是50%;我发现前端功能真的是非常的乱"

---

## 🔍 问题诊断

### 根本原因

**DashboardView.vue 中存在大量硬编码的 progress 设置**，这些代码在不同场景下被错误触发：

1. **Line 566**: `activeProject.value.progress = 100` - 工作流完成时
2. **Line 572**: `activeProject.value.progress = 75` - 角色确认时
3. **Line 627**: `activeProject.value.progress = 100` - 工作流完成时（重复）
4. **Line 643**: `activeProject.value.progress = 75` - 角色确认时（重复）
5. **Line 970**: `progress: 25` - 导入小说时
6. **Line 1082**: `activeProject.value.progress = 50` - 解析完成时 ⚠️ **这是问题源头**

### 触发路径

```
用户点击"+"新建项目
  ↓
DashboardPanel.confirmCreateProject()
  ↓
projectStore.createProject() - 后端创建项目（status: 'PLANNING', progress: undefined）
  ↓
projectStore.fetchProjects() - 刷新项目列表
  ↓
DashboardView.loadActiveProject() - 加载活动项目
  ↓
DashboardView.watch(() => activeProject.value) - 监听器触发
  ↓
Line 560-574: 根据 workflowState 设置 progress ⚠️ **错误逻辑**
  ↓
如果 workflowState.stage === 'character-review' → progress = 50
```

### 核心问题

**DashboardView.vue 的 watch 监听器错误地根据 `navigationStore.workflowState` 设置项目进度**：

```typescript
// ❌ 错误逻辑：新项目也会被这个逻辑影响
watch(() => activeProject.value, (newProject) => {
  if (!newProject) return;
  
  // 🔥 问题：如果 workflowState.stage 是 'character-review'，
  // 即使是新项目也会被设置为 progress = 50
  if (navigationStore.workflowState.stage === 'character-review') {
    activeProject.value.progress = 50;
  }
});
```

### 数据混乱的根源

1. **多数据源混乱**: 
   - 后端数据库（status, progress）
   - navigationStore.workflowState（stage, completed）
   - activeProject.value（本地状态）
   - 三者之间没有清晰的主从关系

2. **硬编码进度值**: 
   - 25%, 50%, 75%, 100% 硬编码在多个地方
   - 没有统一的进度计算逻辑
   - 不同场景重复设置相同的值

3. **状态推断逻辑错误**:
   - 根据 workflowState 推断项目进度
   - 没有验证项目是否真的处于该阶段
   - 新项目也会被错误推断

---

## 🔧 修复方案

### 方案 1: 删除所有硬编码的 progress 设置（推荐）

**原则**: 
- 项目进度应该由后端计算并返回
- 前端只负责显示，不负责计算
- 删除所有 `activeProject.value.progress = XX` 的代码

**优点**:
- 彻底消除数据混乱
- 简化前端逻辑
- 单一数据源（后端）

**缺点**:
- 需要后端支持计算进度

### 方案 2: 统一进度计算逻辑

**原则**:
- 创建一个 `calculateProjectProgress()` 函数
- 根据项目状态统一计算进度
- 只在必要时更新进度

**优点**:
- 保留前端计算能力
- 逻辑集中管理

**缺点**:
- 仍然存在多数据源问题
- 需要维护复杂的计算逻辑

---

## 🎯 推荐行动

**立即执行**:
1. 删除 DashboardView.vue 中所有硬编码的 `progress` 设置
2. 删除根据 workflowState 推断进度的逻辑
3. 项目进度完全由后端返回

**后续优化**:
1. 后端添加进度计算逻辑
2. 前端只负责显示后端返回的进度
3. 清理 navigationStore.workflowState 的使用

---

## 📊 影响范围

### 需要删除的代码

**DashboardView.vue**:
- Line 560-574: watch 监听器中的 progress 设置
- Line 627: 工作流完成时的 progress 设置
- Line 643: 角色确认时的 progress 设置
- Line 970: 导入小说时的 progress 设置
- Line 1082: 解析完成时的 progress 设置

### 需要保留的代码

**后端返回的 progress**:
- 从 API 获取的项目数据中的 progress 字段
- 显示 progress 的 UI 组件

---

## ✅ 验证标准

修复后应该满足：
1. 新建项目显示进度 0% 或不显示进度
2. 只有真正执行了工作流的项目才显示进度
3. 进度值与项目实际状态一致
4. 刷新浏览器后进度值不变

---

**结论**: 前端代码确实非常混乱，存在大量硬编码和重复逻辑。需要彻底清理，建立清晰的数据流。
