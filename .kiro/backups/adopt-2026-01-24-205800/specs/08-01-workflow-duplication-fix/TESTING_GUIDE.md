# 测试指南 - 删除项目功能

## 当前状态

✅ **已完成的修复**：
1. 删除对话框 UI（按钮样式和间距）
2. 删除 API 实现
3. 认证检查和自动登录
4. 项目同名冲突处理

🔄 **待验证**：自动登录功能是否正常工作

---

## 测试步骤

### 1. 重启应用并观察自动登录

1. **完全关闭应用**（如果正在运行）
2. **重新启动应用**：
   ```bash
   cd frontend/NovelAnimeDesktop
   npm run dev
   ```
3. **打开浏览器控制台**（F12 或 Cmd+Option+I）
4. **观察启动日志**，查找以下信息：

   **期望看到的日志**：
   ```
   🔐 Auth token: Missing ❌
   🔐 Development mode: Attempting auto-login...
   ✅ Auto-login successful
   ```

   **如果自动登录失败，会看到**：
   ```
   ⚠️ Auto-login failed: [错误信息]
   ```

### 2. 测试删除项目功能

#### 场景 A：自动登录成功

1. 进入"全部项目"视图
2. 选择一个测试项目
3. 点击删除按钮（垃圾桶图标）
4. 确认对话框应该正常显示
5. 点击"删除"按钮
6. **期望结果**：项目成功删除，显示成功提示

#### 场景 B：自动登录失败

1. 进入"全部项目"视图
2. 选择一个测试项目
3. 点击删除按钮
4. 确认对话框显示
5. 点击"删除"按钮
6. **期望结果**：显示错误提示"请先登录后再删除项目"

---

## 问题排查

### 如果自动登录失败

**可能原因**：
1. 后端服务未启动
2. 测试账号不存在（test@example.com / test123）
3. 后端 API 路径不正确

**解决方案**：

#### 方案 1：手动登录（推荐）

如果自动登录不工作，可以手动登录：

1. 打开浏览器控制台
2. 执行以下代码手动登录：
   ```javascript
   // 使用 apiService 登录
   const apiService = window.__API_SERVICE__ || 
     (await import('./src/renderer/services/api.ts')).apiService;
   
   const result = await apiService.login('test@example.com', 'test123');
   console.log('Login result:', result);
   ```

3. 如果成功，应该看到：
   ```javascript
   { success: true, token: "...", user: {...} }
   ```

4. 然后重新测试删除功能

#### 方案 2：检查后端服务

1. 确认后端服务正在运行：
   ```bash
   curl http://localhost:8080/rest/s1/novel-anime/auth/status
   ```

2. 如果后端未运行，启动后端服务

#### 方案 3：创建测试账号

如果测试账号不存在，需要先注册：

1. 打开浏览器控制台
2. 执行注册代码：
   ```javascript
   const result = await apiService.register('test@example.com', 'test123', 'Test User');
   console.log('Register result:', result);
   ```

---

## 预期行为总结

### ✅ 正常流程

1. **应用启动** → 检测到无 token → 自动登录 → 登录成功
2. **点击删除** → 显示确认对话框 → 点击确认 → 调用后端 API → 删除成功
3. **显示通知** → "删除成功"

### ⚠️ 异常流程

1. **应用启动** → 检测到无 token → 自动登录失败 → 显示警告通知
2. **点击删除** → 显示确认对话框 → 点击确认 → 检测到未登录 → 显示错误"请先登录"

---

## 需要反馈的信息

请测试后提供以下信息：

1. **自动登录是否成功？**
   - [ ] 成功 - 看到 "✅ Auto-login successful"
   - [ ] 失败 - 看到 "⚠️ Auto-login failed"
   - [ ] 未尝试 - 没有看到相关日志

2. **删除功能是否正常？**
   - [ ] 成功 - 项目被删除
   - [ ] 失败 - 显示认证错误
   - [ ] 失败 - 其他错误（请提供错误信息）

3. **控制台日志**（如果有错误，请复制完整日志）

---

## 临时解决方案

如果自动登录一直失败，可以暂时禁用删除功能的认证检查（仅用于开发测试）：

**不推荐**，但如果需要快速测试删除功能，可以临时修改 `DashboardView.vue` 中的 `confirmDelete` 函数，注释掉认证检查：

```javascript
async function confirmDelete() {
  if (projectToDelete.value) {
    // 临时注释掉认证检查（仅用于测试）
    /*
    const token = localStorage.getItem('novel_anime_access_token');
    if (!token) {
      // ... 认证检查代码
      return;
    }
    */
    
    // 直接执行删除
    const success = await projectStore.deleteProject(projectId);
    // ...
  }
}
```

**注意**：这只是临时测试方案，不应该用于生产环境。

---

**更新时间**：2026-01-22  
**Spec**：08-01-workflow-duplication-fix  
**状态**：等待用户测试反馈
