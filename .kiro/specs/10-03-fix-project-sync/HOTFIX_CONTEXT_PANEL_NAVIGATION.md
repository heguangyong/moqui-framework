# Hotfix: 中间面板菜单导航问题

**日期**: 2026-01-26  
**Spec**: 10-03-fix-project-sync  
**问题**: 在预览页面看完后，点击中间面板菜单没有反应，只有点击一级主菜单才有反应

---

## 问题分析

### 用户报告
用户在 PreviewView 页面看完内容后，想点击中间面板（ContextPanel）的菜单项返回其他页面，但点击没有反应。只有点击左侧一级主菜单才能导航。

### 根本原因
**DashboardPanel** 的菜单项点击处理函数只更新了 `navigationStore.updatePanelContext()`，但没有触发路由跳转。

当用户在 `/preview` 页面时：
1. 点击 DashboardPanel 的菜单项（如"项目概览"、"运行中"等）
2. 只更新了面板上下文，但没有跳转到 `/dashboard`
3. 用户仍然停留在 `/preview` 页面，看起来点击没有反应

### 对比其他面板
其他面板（WorkflowContextPanel、AssetsPanel、CharactersPanel）都有 `ensurePage()` 函数来确保路由跳转：
- `ensureWorkflowPage()` - 确保在 `/workflow` 页面
- `ensureAssetsPage()` - 确保在 `/assets` 页面
- `ensureCharactersPage()` - 确保在 `/characters` 页面

但 DashboardPanel 缺少这个逻辑。

---

## 修复方案

在 DashboardPanel 的所有点击处理函数中添加路由跳转逻辑：

### 修改的函数
1. `handleProjectClick()` - 项目点击处理
2. `handleStatusClick()` - 状态点击处理
3. `handleShortcutClick()` - 快捷入口点击处理

### 修改内容
在每个函数的末尾添加：
```javascript
// 确保导航到 dashboard 页面
if (router.currentRoute.value.path !== '/dashboard') {
  console.log('🔄 Navigating to /dashboard');
  router.push('/dashboard');
}
```

---

## 修改的文件

- `frontend/NovelAnimeDesktop/src/renderer/components/panels/DashboardPanel.vue`
  * `handleProjectClick()` - 添加路由跳转
  * `handleStatusClick()` - 添加路由跳转
  * `handleShortcutClick()` - 添加路由跳转

---

## 预期效果

修复后，用户在任何页面（包括 PreviewView）点击 DashboardPanel 的菜单项时：
1. 更新面板上下文
2. 自动跳转到 `/dashboard` 页面
3. 显示对应的内容视图

---

## 测试步骤

1. 在 WorkflowEditor 中执行工作流
2. 点击"查看预览"进入 PreviewView
3. 在 PreviewView 中，点击左侧 DashboardPanel 的任意菜单项
4. 应该能够成功跳转到 Dashboard 页面并显示对应内容

---

**状态**: 已修复，等待用户测试
