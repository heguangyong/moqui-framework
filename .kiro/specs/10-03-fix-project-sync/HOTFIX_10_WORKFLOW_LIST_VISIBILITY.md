# Hotfix 10: 工作流列表不可见问题

**日期**: 2026-01-26  
**状态**: ✅ 已完成

---

## 问题描述

**用户报告**: 
> "我发现当我切换到主菜单工作流时,居然没有任何数据. 刚刚做完的项目里面应该有流程的. 这里居然没有任何流程."

**现象**:
- 用户从项目执行了工作流
- 切换到"工作流"主菜单
- 看不到任何工作流数据

---

## 根本原因分析

### 1. 工作流确实被创建了
- ✅ `createWorkflowForProject()` 正确创建工作流
- ✅ 工作流保存到后端数据库
- ✅ `workflowStore.loadWorkflows()` 正确加载工作流

### 2. UI 显示问题
**WorkflowEditor 的视图结构**:
```
- 默认视图 (viewType === 'workflow-detail' 或空)
  → 显示工作流编辑器画布
  → 需要先选择一个工作流才能看到内容
  → 如果没有选中工作流，显示"请选择或创建一个工作流"

- 状态视图 (viewType === 'status')
  → 显示工作流列表
  → 按状态筛选（running/completed/failed）
```

**问题**: 
- 用户切换到工作流菜单时，默认进入"工作流编辑器"视图
- 没有选中任何工作流，所以看到空白画布
- **缺少工作流选择器/下拉菜单**，用户无法选择已有的工作流

### 3. 缺失的功能
- ❌ 没有工作流下拉选择器
- ❌ 没有"全部工作流"列表视图
- ❌ 用户不知道如何查看已创建的工作流

---

## 解决方案

### 实施方案: 添加工作流选择器

在 WorkflowEditor 的 header 中添加工作流下拉选择器，让用户可以：
1. 查看所有工作流列表
2. 选择一个工作流进行编辑
3. 快速切换工作流

**优点**:
- 符合用户直觉
- 不改变现有视图结构
- 类似于 IDE 的文件选择器

---

## 实施详情

### 修改文件: `WorkflowEditor.vue`

#### 1. 添加工作流选择器 UI (已完成)

**位置**: `<template>` 部分，view-header 内

**添加内容**:
```vue
<div class="workflow-selector">
  <label for="workflow-select">工作流:</label>
  <select 
    id="workflow-select"
    v-model="selectedWorkflowId" 
    @change="onWorkflowSelect"
    class="workflow-select"
  >
    <option value="">{{ workflows.length === 0 ? '暂无工作流' : '选择工作流' }}</option>
    <option 
      v-for="wf in workflows" 
      :key="wf.id" 
      :value="wf.id"
    >
      {{ wf.name }}
    </option>
  </select>
</div>
```

**功能**:
- 显示所有可用工作流
- 空状态友好提示："暂无工作流"
- 选择工作流时触发 `onWorkflowSelect()` 函数

#### 2. 添加选择处理函数 (已完成)

**位置**: `<script setup>` 部分

**添加内容**:
```typescript
const onWorkflowSelect = () => {
  if (selectedWorkflowId.value) {
    const workflow = workflows.value.find(w => w.id === selectedWorkflowId.value);
    if (workflow) {
      workflowStore.setCurrentWorkflow(workflow);
    }
  }
};
```

**功能**:
- 根据选中的 ID 查找工作流对象
- 调用 `workflowStore.setCurrentWorkflow()` 加载工作流到编辑器

#### 3. 添加 CSS 样式 (已完成)

**位置**: `<style scoped>` 部分，workflow-title-group 样式之后

**添加内容**:
```css
/* 工作流选择器 */
.workflow-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-selector label {
  font-size: 14px;
  color: #6a6a6c;
  font-weight: 500;
}

.workflow-select {
  min-width: 200px;
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #2c2c2e;
  cursor: pointer;
  transition: all 0.15s;
}

.workflow-select:hover {
  border-color: rgba(0, 0, 0, 0.2);
}

.workflow-select:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}
```

**样式特点**:
- macOS 风格设计
- 平滑过渡动画
- 聚焦时蓝色高亮
- 悬停时边框加深

---

## 测试计划

### 测试步骤

1. ✅ **验证工作流已创建**
   - 从项目执行工作流
   - 检查后端数据库是否保存

2. ✅ **验证数据加载**
   - 切换到工作流菜单
   - 检查 `workflowStore.loadWorkflows()` 是否被调用
   - 检查 `workflows` 数组是否有数据

3. ✅ **测试选择器显示**
   - 工作流选择器是否显示
   - 下拉列表是否包含所有工作流
   - 空状态提示是否正确

4. 🔧 **测试选择功能** (待用户测试)
   - 选择一个工作流
   - 编辑器是否正确加载工作流
   - 画布是否显示节点和连接

5. 🔧 **测试空状态** (待用户测试)
   - 没有工作流时，选择器显示"暂无工作流"
   - 空画布显示友好提示

---

## 预期结果

用户切换到"工作流"菜单后：
1. ✅ 看到工作流选择器，显示所有已创建的工作流
2. 🔧 可以选择一个工作流进行查看/编辑
3. 🔧 如果没有工作流，看到友好的空状态提示

---

## 用户操作指南

### 如何查看和编辑工作流

1. **切换到工作流菜单**
   - 点击左侧主菜单的"工作流"图标

2. **选择工作流**
   - 在顶部看到"工作流:"标签和下拉选择器
   - 点击下拉选择器，查看所有可用工作流
   - 选择一个工作流

3. **编辑工作流**
   - 选择后，编辑器画布会显示工作流的节点和连接
   - 可以拖拽节点、编辑属性、添加新节点
   - 点击"保存"按钮保存修改

4. **创建新工作流**
   - 点击"新建工作流"按钮
   - 或点击"默认工作流"快速创建标准流程

---

**版本**: v2.0  
**更新**: 2026-01-26  
**状态**: 实施完成，等待用户测试
