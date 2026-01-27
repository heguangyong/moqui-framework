# Hotfix: 删除项目后概览页面未同步

**日期**: 2026-01-26  
**Spec**: 10-03-fix-project-sync  
**问题**: 在"全部项目"页面删除项目后，"概览"页面仍然显示该项目为当前项目

---

## 问题分析

### 用户报告
用户在"全部项目"页面删除项目后，返回"概览"页面，发现被删除的项目仍然显示为"当前项目"。

### 根本原因
**DashboardView** 中有两个独立的项目状态：
1. `projectStore.currentProject` - Store 中的当前项目（全局状态）
2. `activeProject` - DashboardView 组件内的本地 ref

**删除流程**:
1. 用户在 ProjectList 中点击删除
2. 调用 `projectStore.deleteProject(projectId)`
3. Store 正确地：
   - 从后端删除项目
   - 从 `projects` 数组中移除
   - 如果是当前项目，清除 `currentProject`
4. **问题**: DashboardView 的 `activeProject` ref 没有更新

**结果**: 概览页面仍然显示已删除的项目信息。

---

## 修复方案

在 `DashboardView.vue` 的删除确认函数中，添加逻辑检查被删除的项目是否是当前活动项目。

### 修改位置
`frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue` - 删除确认处理函数

### 修改内容

```javascript
const success = await projectStore.deleteProject(projectId);

if (success) {
  console.log('✅ Delete successful');
  uiStore.addNotification({
    type: 'success',
    title: '删除成功',
    message: `项目 "${projectToDelete.value.name}" 已删除`,
    timeout: 2000
  });
  
  // 刷新项目列表
  await projectStore.fetchProjects();
  
  // 🔧 FIX: 如果删除的是当前活动项目，清除 activeProject 并重新加载
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
    
    // 重新加载活动项目（会自动选择下一个项目）
    await loadActiveProject();
  }
}
```

### 修复逻辑

1. **检查是否是活动项目**: 比较被删除项目的 ID 与 `activeProject.value` 的 ID
2. **清除本地状态**: 
   - 清空 `activeProject.value`
   - 清空 `currentNovelId.value`
3. **重置步骤状态**: 将所有工作流步骤重置为初始状态
4. **重新加载**: 调用 `loadActiveProject()` 自动选择下一个可用项目

---

## 修改的文件

- `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue`
  * 在删除成功后添加活动项目检查和清除逻辑

---

## 预期效果

### 修复后的行为

1. **删除非活动项目**:
   - 项目从列表中移除
   - 概览页面的当前项目不受影响

2. **删除活动项目**:
   - 项目从列表中移除
   - 概览页面的"当前项目"卡片被清除
   - 如果有其他项目，自动选择下一个项目
   - 如果没有其他项目，显示空状态
   - 工作流步骤重置为初始状态

---

## 测试步骤

1. 创建两个项目（项目A 和 项目B）
2. 在概览页面，确认项目A 是当前项目
3. 切换到"全部项目"页面
4. 删除项目A
5. 返回"概览"页面
6. **预期结果**: 
   - 不再显示项目A
   - 如果有项目B，应该显示项目B 为当前项目
   - 如果没有其他项目，显示空状态

---

**状态**: ✅ 已修复，等待用户测试
