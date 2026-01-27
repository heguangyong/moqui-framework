# 快速测试指南

## 🔧 已修复的问题

**根本原因**：auth store 的 `persistTokens()` 方法没有存储 userId 和用户数据

**修复内容**：
1. ✅ DashboardView 现在使用 auth store 登录
2. ✅ `persistTokens()` 现在会存储 userId 和 user 数据到 localStorage
3. ✅ 后端可以正确识别用户身份

---

## 🧪 测试步骤

### 1. 重启应用

```bash
# 完全关闭应用，然后重新启动
cd frontend/NovelAnimeDesktop
npm run dev
```

### 2. 打开控制台（F12）

查找以下日志：

```
🔐 Auth token: Missing ❌
🔐 Development mode: Attempting auto-login...
✅ Auto-login successful, user: { userId: "...", email: "test@example.com", ... }
```

### 3. 验证 localStorage

在控制台执行：

```javascript
console.log('Token:', localStorage.getItem('novel_anime_access_token'));
console.log('User ID:', localStorage.getItem('novel_anime_user_id'));
console.log('User Data:', JSON.parse(localStorage.getItem('novel_anime_user_data')));
```

**期望结果**：
- Token: 应该有一个 JWT token
- User ID: 应该是 "EX_JOHN_DOE" 或类似的 ID
- User Data: 应该包含完整的用户对象

### 4. 测试删除功能

1. 进入"全部项目"视图
2. 点击任意项目的删除按钮（垃圾桶图标）
3. 确认对话框出现
4. 点击"删除"按钮

**期望结果**：
```
🗑️ Deleting project: 100612
🗑️ Delete response: {success: true}
✅ Delete successful
```

---

## ✅ 成功标志

如果看到以下内容，说明修复成功：

1. **自动登录成功**：
   ```
   ✅ Auto-login successful, user: {...}
   ```

2. **localStorage 有完整数据**：
   - `novel_anime_access_token` ✓
   - `novel_anime_user_id` ✓
   - `novel_anime_user_data` ✓

3. **删除成功**：
   ```
   ✅ Delete successful
   项目 "xxx" 已删除
   ```

---

## ❌ 如果仍然失败

### 场景 A：自动登录失败

**可能原因**：测试账号不存在

**解决方案**：在控制台手动注册

```javascript
// 导入 auth store
const { useAuthStore } = await import('./src/renderer/stores/auth.ts');
const authStore = useAuthStore();

// 注册测试账号
const result = await authStore.register({
  email: 'test@example.com',
  password: 'test123',
  username: 'Test User'
});

console.log('Register result:', result);
```

### 场景 B：删除仍然返回 "No User"

**可能原因**：后端 JWT 验证问题

**解决方案**：
1. 检查后端日志
2. 验证 JWT token 格式
3. 确认后端的认证配置

---

## 📝 反馈

测试后请告诉我：

1. **自动登录是否成功？** （是/否）
2. **localStorage 是否有 userId？** （是/否）
3. **删除功能是否正常？** （是/否）
4. **如果失败，完整的错误日志是什么？**

---

**更新时间**: 2026-01-22  
**状态**: 修复完成，等待测试
