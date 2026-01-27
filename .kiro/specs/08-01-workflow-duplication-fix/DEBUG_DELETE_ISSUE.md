# Debug Guide: Delete Project Issue

**Date**: 2026-01-22

---

## 已实现的修复

### 1. 项目名称重复检查 ✅
- 在创建项目前检查是否存在同名项目
- 如果存在，自动添加编号后缀（例如："test-novel (2)", "test-novel (3)"）
- 避免用户无法区分同名项目

### 2. 增强的删除日志 ✅
- 添加详细的控制台日志
- 显示具体的错误信息（而不是通用的"无法删除"）
- 帮助诊断删除失败的原因

---

## 请提供以下信息

为了诊断删除失败的问题，请执行以下步骤并提供信息：

### 步骤 1: 打开浏览器控制台
1. 按 F12 打开开发者工具
2. 切换到 "Console" 标签页
3. 清空控制台（点击 🚫 图标）

### 步骤 2: 尝试删除项目
1. 在"全部项目"视图中，悬停在一个项目上
2. 点击删除按钮（垃圾桶图标）
3. 在确认对话框中点击"删除"按钮

### 步骤 3: 查看控制台输出

请复制并提供以下日志信息：

**应该看到的日志**:
```
🗑️ Confirming delete for project: {项目对象}
🗑️ Project ID to delete: {项目ID}
🗑️ Store: Deleting project: {项目ID}
🗑️ Deleting project: {项目ID}
🗑️ Delete response: {响应数据}
✅ Backend delete successful
✅ Local delete successful
✅ Delete successful
```

**如果失败，可能看到**:
```
❌ Backend delete failed: {错误信息}
❌ Failed to delete project: {错误详情}
❌ Delete failed, error: {错误信息}
```

### 步骤 4: 检查网络请求

1. 切换到 "Network" 标签页
2. 再次尝试删除
3. 查找 DELETE 请求到 `/project/{projectId}`
4. 点击该请求，查看：
   - **Request URL**: 完整的请求 URL
   - **Status Code**: HTTP 状态码
   - **Response**: 服务器返回的响应

---

## 可能的问题和解决方案

### 问题 1: 后端 API 不存在
**症状**: 404 Not Found 错误

**解决方案**: 需要在后端实现 DELETE /project/{projectId} 端点

### 问题 2: 项目 ID 格式错误
**症状**: 400 Bad Request 或 422 Unprocessable Entity

**解决方案**: 检查前端发送的 projectId 格式是否正确

### 问题 3: 权限问题
**症状**: 401 Unauthorized 或 403 Forbidden

**解决方案**: 检查用户是否有删除权限

### 问题 4: 项目不存在
**症状**: 404 Not Found

**解决方案**: 项目可能已被删除或 ID 不正确

---

## 临时解决方案

如果后端 API 暂时无法修复，可以考虑：

1. **仅前端删除**（不推荐）:
   - 只从前端列表中移除
   - 刷新后会重新出现

2. **标记为已删除**:
   - 更新项目状态为 "deleted"
   - 在列表中过滤掉已删除项目

3. **等待后端实现**:
   - 联系后端开发人员实现 DELETE 端点

---

## 下一步

请提供上述调试信息，特别是：
1. 控制台的完整日志
2. Network 标签中的 DELETE 请求详情
3. 服务器返回的错误响应

有了这些信息，我们可以准确定位问题并提供解决方案。
