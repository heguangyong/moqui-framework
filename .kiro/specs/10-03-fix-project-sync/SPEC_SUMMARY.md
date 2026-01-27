# Spec 10-03: 项目创建和列表同步修复

## 状态: 📝 已创建，准备执行

**创建时间**: 2026-01-25

---

## 问题描述

用户报告了三个项目同步问题：

1. **控制面板**：新建项目异常
2. **控制面板**：全部项目页面内容为空，明明新建了项目
3. **概览页面**：新建项目也是异常

**根本原因**：多个项目创建入口（4个）没有统一的刷新机制，导致信息不同步。

---

## 解决方案

### 核心策略

1. **统一刷新机制** - 在 `projectStore.createProject()` 中自动调用 `fetchProjects()`
2. **修复响应式更新** - 修复 ProjectList 组件的 `onMounted` 钩子
3. **数据规范化** - 实现 `normalizeProject()` 函数统一 id/projectId 字段
4. **状态管理** - 添加 isLoading 和 error 状态

### 影响的 4 个创建入口

1. **DashboardPanel.vue** - 控制面板的"+"按钮
2. **DashboardView.vue** - 概览页面的"新建项目"按钮
3. **App.vue** - 菜单栏的新建项目选项
4. **ImportNovelDialog.vue** - 导入小说时创建项目

---

## 技术方案

### 1. Project Store 增强

```typescript
// 在 createProject 中添加自动刷新
async createProject(projectData) {
  const response = await apiService.createProject(projectData)
  const normalizedProject = normalizeProject(response.data)
  this.projects.push(normalizedProject)
  await this.fetchProjects()  // 自动刷新
  return normalizedProject
}

// 在 fetchProjects 中添加加载状态
async fetchProjects() {
  this.isLoading = true
  const response = await apiService.getProjects()
  this.projects = response.data.map(normalizeProject)
  this.isLoading = false
}
```

### 2. 数据规范化

```typescript
function normalizeProject(project) {
  const projectId = project.projectId || project.id
  return {
    ...project,
    id: projectId,
    projectId: projectId
  }
}
```

### 3. ProjectList 修复

```vue
<script setup>
const projects = computed(() => projectStore.projects)
const isLoading = computed(() => projectStore.isLoading)

onMounted(async () => {
  await projectStore.fetchProjects()
})
</script>

<template>
  <div v-if="isLoading">加载中...</div>
  <div v-else-if="projects.length === 0">暂无项目</div>
  <div v-else><!-- 项目列表 --></div>
</template>
```

---

## 文档结构

- **requirements.md** ✅ - 10 个需求，50 个验收标准
- **design.md** ✅ - 完整架构设计，18 个正确性属性
- **tasks.md** ✅ - 14 个主任务，包含子任务和测试

---

## 修改文件清单

1. `frontend/NovelAnimeDesktop/src/renderer/stores/project.js` - 核心修改
2. `frontend/NovelAnimeDesktop/src/renderer/components/ProjectList.vue`
3. `frontend/NovelAnimeDesktop/src/renderer/components/panels/DashboardPanel.vue`
4. `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue`
5. `frontend/NovelAnimeDesktop/src/renderer/App.vue`
6. `frontend/NovelAnimeDesktop/src/renderer/components/dialogs/ImportNovelDialog.vue`

**预计修改量**: ~150 lines across 6 files

---

## 测试策略

### 双重测试方法

1. **单元测试** - 具体示例和边界情况
2. **属性测试** - 通用正确性属性（使用 Vitest + fast-check）

### 18 个正确性属性

包括：
- 项目创建触发自动刷新
- 前端-后端数据一致性
- 数据规范化
- 响应式更新
- 错误处理
- 加载状态管理

---

## 下一步

1. 打开 `.kiro/specs/10-03-fix-project-sync/tasks.md`
2. 开始执行任务 1：实现项目数据规范化
3. 按顺序完成所有任务
4. 在 Checkpoint 处验证功能

---

**准备好开始了！** 🚀
