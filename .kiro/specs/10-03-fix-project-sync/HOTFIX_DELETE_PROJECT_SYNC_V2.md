# Hotfix: 删除项目后数据未完全同步（V2 - 完整修复）

**日期**: 2026-01-26  
**Spec**: 10-03-fix-project-sync  
**状态**: ✅ 已完成  
**问题**: 
1. 删除项目后，DashboardPanel 的统计数字仍然包含已删除的项目
2. 从其他页面切回概览页面，仍然显示已删除的项目为当前项目

---

## 问题分析

### 用户报告
1. 在"全部项目"页面删除项目
2. 切换到工作流页面
3. 再切回项目主菜单
4. **问题**:
   - DashboardPanel 的"全部项目"徽章数字错误（包含已删除项目）
   - 点击"概览"，仍然显示已删除的项目为当前项目

### 根本原因

**问题 1: 统计数字不更新**
- `projectCounts` 是从 `projectStore.projectCounts` 计算的
- `projectStore.projectCounts` 是基于 `projectStore.projects` 数组计算的
- 虽然删除时调用了 `projectStore.fetchProjects()`，但 DashboardPanel 不会自动刷新
- DashboardPanel 只在 `onMounted` 时加载一次数据
- 当从其他页面切回来时，`onMounted` 不会再次执行

**问题 2: 概览页面仍显示已删除项目**
- DashboardView 的 `activeProject` 是本地 ref
- 虽然在删除确认函数中添加了清除逻辑，但：
  * 只有在删除操作发生在 DashboardView 页面时才会执行
  * 如果用户删除后切换到其他页面再切回来，`activeProject` 不会重新验证
  * `loadActiveProject()` 可能从缓存或 store 中加载了过期的项目数据

---

## 完整修复方案

### 修复 1: DashboardPanel 监听路由变化刷新数据 ✅

**文件**: `frontend/NovelAnimeDesktop/src/renderer/components/panels/DashboardPanel.vue`

**方案**: 添加路由监听，当切换到 dashboard 页面时自动刷新项目列表

```javascript
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 监听路由变化，当切换到 dashboard 时刷新项目列表
watch(() => route.path, async (newPath, oldPath) => {
  if (newPath === '/dashboard' && oldPath && oldPath !== '/dashboard') {
    console.log('🔄 Switched to dashboard from', oldPath, ', refreshing projects...');
    await projectStore.fetchProjects();
    console.log('✅ Projects refreshed, count:', projectStore.projects.length);
  }
}, { immediate: false });
```

**状态**: ✅ 已实现

### 修复 2: DashboardView 在挂载时验证当前项目 ✅

**文件**: `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue`

**方案**: 在 `loadActiveProject()` 中添加验证逻辑，确保当前项目仍然存在

```javascript
async function loadActiveProject() {
  // ... 现有代码 ...
  
  if (current) {
    const projectId = current.id || current.projectId;
    
    // 🔧 FIX: 首先验证项目是否仍然存在于项目列表中
    // 刷新项目列表以获取最新数据
    await projectStore.fetchProjects();
    const projectExists = projectStore.projects.find(
      p => (p.id || p.projectId) === projectId
    );
    
    if (!projectExists) {
      console.warn('⚠️ Current project no longer exists (deleted), clearing...');
      projectStore.clearCurrentProject();
      activeProject.value = null;
      currentNovelId.value = null;
      
      // 重置步骤状态
      workflowSteps.value.forEach((step, index) => {
        step.completed = false;
        step.enabled = index === 0;
      });
      currentStep.value = 0;
      
      // 尝试加载下一个可用项目
      const nextProject = projectStore.projects[0];
      if (nextProject) {
        console.log('🔄 Loading next available project:', nextProject.name);
        current = nextProject;
        projectStore.setCurrentProject(current);
        // 继续执行后续逻辑
      } else {
        console.log('📊 No projects available');
        return; // 没有项目了，直接返回
      }
    }
    
    // 继续现有逻辑...
  }
}
```

**状态**: ✅ 已实现

### 修复 3: 确保删除后立即刷新所有相关组件 ✅

**文件**: `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue`

**方案**: 在删除成功后，不仅刷新项目列表，还要触发 DashboardPanel 的刷新

```javascript
if (success) {
  console.log('✅ Delete successful');
  uiStore.addNotification({
    type: 'success',
    title: '删除成功',
    message: `项目 "${projectToDelete.value.name}" 已删除`,
    timeout: 2000
  });
  
  // 🔧 FIX: 刷新项目列表（这会触发 projectCounts 的更新）
  await projectStore.fetchProjects();
  
  // 🔧 FIX: 如果删除的是当前活动项目，清除并重新加载
  if (activeProject.value && 
      (activeProject.value.id === projectId || activeProject.value.projectId === projectId)) {
    console.log('🔄 Deleted project was active project, clearing and reloading...');
    activeProject.value = null;
    currentNovelId.value = null;
    
    // 重置步骤状态
    workflowSteps.value.forEach((step, index) => {
      step.completed = false;
      step.enabled = index === 0;
    });
    currentStep.value = 0;
    
    // 重新加载活动项目（会自动验证项目是否存在）
    await loadActiveProject();
  }
}
```

**状态**: ✅ 已实现（在之前的修复中）

---

## 修改的文件

1. ✅ `frontend/NovelAnimeDesktop/src/renderer/components/panels/DashboardPanel.vue`
   - 添加路由监听，自动刷新项目列表

2. ✅ `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue`
   - 在 `loadActiveProject()` 中添加项目存在性验证
   - 确保删除后的清除逻辑正确执行

---

## 预期效果

### 修复后的完整流程

1. **用户在"全部项目"页面删除项目**:
   - 项目从后端删除
   - `projectStore.projects` 数组更新
   - `projectCounts` 自动更新（响应式）
   - 如果是当前项目，`activeProject` 被清除

2. **用户切换到工作流页面**:
   - 正常使用工作流功能

3. **用户切回项目主菜单（dashboard）**:
   - DashboardPanel 检测到路由变化
   - 自动调用 `projectStore.fetchProjects()` 刷新数据
   - `projectCounts` 显示正确的数字

4. **用户点击"概览"**:
   - DashboardView 的 `onMounted` 执行
   - `loadActiveProject()` 验证当前项目是否存在
   - 如果不存在，清除并加载下一个项目
   - 如果没有项目，显示空状态

---

## 测试步骤

1. 创建 2-3 个项目
2. 在"全部项目"页面删除一个项目
3. 观察 DashboardPanel 的"全部项目"徽章数字是否立即更新
4. 切换到工作流页面
5. 再切回项目主菜单
6. 观察"全部项目"徽章数字是否正确
7. 点击"概览"
8. 观察是否显示正确的当前项目（不应该是已删除的项目）

---

**状态**: ✅ 已完成，等待用户测试
