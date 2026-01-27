# Release Notes - v1.0.2

**发布日期**: 2025-01-20

## 🐛 Bug Fixes

### 工作流重复创建问题修复

**问题描述**：
- 使用模板创建工作流时，会创建多个重复的工作流
- 切换页面后再回来，又会创建新的工作流
- 导致数据库中存在大量空工作流和重复工作流

**修复内容**：

1. **添加现有工作流检测**
   - 在 `autoApplyTemplate` 中添加重复检查
   - 优先查找 `projectId` 匹配的工作流
   - 如果找到现有工作流，直接切换，不创建新的

2. **添加项目ID关联**
   - 创建工作流时传递 `projectId`
   - 建立工作流与项目的关联关系
   - 支持按项目查找工作流

3. **优化 useTemplate 函数**
   - 添加重复创建保护
   - 检查当前是否已有工作流且包含节点
   - 避免用户误操作导致重复创建

4. **详细日志输出**
   - 添加调试日志，方便问题排查
   - 显示工作流检查过程
   - 记录创建和复用决策

**影响范围**：
- `frontend/NovelAnimeDesktop/src/renderer/views/WorkflowEditor.vue`

**测试建议**：
1. 清理所有数据后重新测试
2. 验证从Dashboard创建项目只生成一个工作流
3. 验证切换页面后不会重复创建
4. 检查浏览器控制台日志

## 🔧 Technical Details

### 修改的函数

#### autoApplyTemplate
```typescript
// 添加现有工作流检查
if (workflows.value.length > 0) {
  const existingWorkflow = workflows.value.find(w => 
    w.projectId === context.projectId || 
    (w.nodes && w.nodes.length > 0)
  );
  
  if (existingWorkflow) {
    // 复用现有工作流，不创建新的
    workflowStore.selectWorkflow(existingWorkflow.id);
    return;
  }
}
```

#### useTemplate
```typescript
// 添加重复创建保护
if (currentWorkflow.value && currentWorkflow.value.nodes.length > 0) {
  // 切换到现有工作流
  navigationStore.updatePanelContext('workflow', {
    selectedWorkflow: currentWorkflow.value.id,
    viewType: 'workflow-detail',
    templateId: null
  });
  return;
}
```

## 📝 Documentation

新增文档：
- `WORKFLOW_DUPLICATE_FIX.md` - 详细的问题分析和修复说明

更新文档：
- `VERSION_MANAGEMENT.md` - 添加 v1.0.2 版本历史

## 🚀 Upgrade Instructions

### 自动升级（推荐）

1. **刷新应用**
   - 前端会自动热更新
   - 或者刷新浏览器页面

2. **版本检测**
   - 应用启动时会自动检测版本变更
   - 从 v1.0.1 升级到 v1.0.2
   - 自动清理前端缓存

3. **清理后端数据**（可选）
   ```bash
   ./clear-data-via-api.sh
   ```

### 验证升级

1. 查看登录页面版本号：应显示 `v1.0.2`
2. 查看浏览器控制台：
   ```
   🔍 [VersionManager] 检查应用版本: { storedVersion: '1.0.1', currentVersion: '1.0.2' }
   🔄 [VersionManager] 检测到版本变更，清理前端缓存...
   ✅ [VersionManager] 缓存清理完成，版本已更新
   ```

## 🎯 Breaking Changes

无破坏性变更。

## 📊 Statistics

- **修改文件**: 3个
- **新增文档**: 1个
- **代码行数**: +80 / -20
- **修复问题**: 1个重大bug

## 🙏 Acknowledgments

感谢用户反馈的工作流重复创建问题，帮助我们发现并修复了这个重要的bug。

---

**完整变更日志**: [VERSION_MANAGEMENT.md](./VERSION_MANAGEMENT.md)  
**问题修复详情**: [WORKFLOW_DUPLICATE_FIX.md](./WORKFLOW_DUPLICATE_FIX.md)
