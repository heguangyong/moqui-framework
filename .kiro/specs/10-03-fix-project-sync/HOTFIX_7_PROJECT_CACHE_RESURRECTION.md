# Hotfix 7: 删除项目后又恢复的问题

**日期**: 2026-01-26  
**状态**: ✅ 已修复  
**问题**: 删除项目后新建项目，发现历史数据又恢复了

---

## 问题描述

用户报告：
1. 删除一个项目
2. 新建一个项目
3. 发现之前删除的项目又出现了，历史数据恢复了

---

## 根本原因

**数据源冲突**：
- `projectStore` 有两个数据源：
  1. **后端 API**（权威数据源）
  2. **ProjectManager 内存缓存**（本地缓存）

**问题流程**：
1. 删除项目时，后端删除成功，`ProjectManager` 也删除了
2. 但是当 `fetchProjects()` 被调用时：
   - 如果 API 返回失败或空结果
   - 代码会从 `ProjectManager.getAllProjects()` 恢复数据
   - 这导致已删除的项目又出现了

**代码位置**：
```javascript
// frontend/NovelAnimeDesktop/src/renderer/stores/project.js
async fetchProjects() {
  // ...
  if (result.success && result.projects) {
    this.projects = result.projects.map(normalizeProject);
  } else {
    // ❌ 问题：从 ProjectManager 恢复数据
    this.projects = this.projectManager.getAllProjects().map(normalizeProject);
  }
  
  // 出错时也会恢复
  if (this.projects.length === 0) {
    // ❌ 问题：从 ProjectManager 恢复数据
    this.projects = this.projectManager.getAllProjects().map(normalizeProject);
  }
}
```

---

## 修复方案

**原则**：后端 API 是唯一权威数据源，不从 `ProjectManager` 恢复数据

### 修改内容

**文件**: `frontend/NovelAnimeDesktop/src/renderer/stores/project.js`

**修改**: 移除从 `ProjectManager` 恢复数据的逻辑

```javascript
async fetchProjects() {
  this.isLoading = true;
  this.error = null;
  
  try {
    console.log('🔄 Fetching projects from backend...');
    
    const { apiService } = await import('../services/index.ts');
    const result = await apiService.getProjects();
    
    if (result.success && result.projects) {
      // 规范化所有项目数据
      this.projects = result.projects.map(normalizeProject);
      console.log('📊 fetchProjects from API:', this.projects.length, 'projects');
    } else {
      // 🔧 FIX: 不再从 ProjectManager 恢复数据
      // 如果后端返回空，就是真的没有项目了
      this.projects = [];
      console.log('📊 No projects from API, clearing local list');
    }
    
    this.updateRecentProjects();
    this.isLoading = false;
    return result;
  } catch (error) {
    this.error = error.message || '加载项目列表失败';
    console.error('❌ Failed to fetch projects:', error);
    
    // 🔧 FIX: 出错时也不从 ProjectManager 恢复数据
    // 保持当前的项目列表不变，避免显示已删除的项目
    console.log('📊 fetchProjects error, keeping current list:', this.projects.length, 'projects');
    
    this.isLoading = false;
    return { success: false, projects: [] };
  }
}
```

---

## 修复效果

### 修复前

1. 删除项目 A
2. 后端删除成功
3. 刷新页面或切换页面
4. `fetchProjects()` 从 `ProjectManager` 恢复数据
5. 项目 A 又出现了 ❌

### 修复后

1. 删除项目 A
2. 后端删除成功
3. 刷新页面或切换页面
4. `fetchProjects()` 只从后端 API 获取数据
5. 项目 A 不会再出现 ✅

---

## 测试步骤

1. 创建 2-3 个项目
2. 删除其中一个项目
3. 刷新页面
4. **检查**: 删除的项目是否还在？（应该不在）
5. 新建一个项目
6. **检查**: 删除的项目是否恢复？（应该不会）
7. 切换到其他页面再切回来
8. **检查**: 删除的项目是否还在？（应该不在）

---

## 相关问题

这个问题与 **Hotfix 6** 相关，都是关于删除项目后的数据同步问题：
- Hotfix 6: 解决了 UI 状态同步问题
- Hotfix 7: 解决了数据源冲突导致的数据恢复问题

---

**完成时间**: 2026-01-26  
**等待**: 用户测试验证
