# 🚀 认证诊断 - 快速启动指南

> **目标**: 快速运行诊断工具，识别认证问题的根本原因

---

## ⚡ 最快方式（2分钟）

### 步骤 1: 启动应用
```bash
# 启动后端（如果还没运行）
cd /path/to/moqui
./gradlew run

# 启动前端（另一个终端）
cd frontend/NovelAnimeDesktop
npm run dev
```

### 步骤 2: 登录应用
- 打开应用
- 使用 `john.doe` / `moqui` 登录

### 步骤 3: 运行浏览器诊断
1. 按 `F12` 打开开发者工具
2. 切换到 `Console` 标签
3. 复制并粘贴以下代码：

```javascript
// === 浏览器诊断脚本 ===
(function() {
  console.log('=== 认证状态诊断 ===\n');
  
  // 检查 localStorage
  const token = localStorage.getItem('novel_anime_access_token');
  const userId = localStorage.getItem('novel_anime_user_id');
  const user = localStorage.getItem('novel_anime_user_data');
  
  console.log('1. localStorage:');
  console.log('  access_token:', token ? '✓ 存在' : '✗ 缺失');
  console.log('  userId:', userId || '✗ 缺失');
  console.log('  user:', user ? '✓ 存在' : '✗ 缺失');
  console.log('');
  
  // 解码 token
  if (token) {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      console.log('2. Token 内容:');
      console.log('  sub (用户ID):', payload.sub || '✗ 缺失');
      console.log('  userId:', payload.userId || '✗ 缺失');
      console.log('  username:', payload.username || '✗ 缺失');
      console.log('  过期时间:', payload.exp ? new Date(payload.exp * 1000).toISOString() : '✗ 缺失');
      console.log('  是否过期:', payload.exp && Date.now() >= payload.exp * 1000 ? '✗ 是' : '✓ 否');
      console.log('');
      console.log('  完整 payload:', payload);
    } catch (e) {
      console.log('✗ Token 解码失败:', e);
    }
  }
  
  // 检查 Pinia store
  if (window.__PINIA__) {
    const authStore = window.__PINIA__.state.value?.auth;
    console.log('');
    console.log('3. Auth Store:');
    console.log('  isAuthenticated:', authStore?.isAuthenticated);
    console.log('  user:', authStore?.user ? '✓ 存在' : '✗ 缺失');
    console.log('  accessToken:', authStore?.accessToken ? '✓ 存在' : '✗ 缺失');
  }
  
  console.log('\n=== 诊断完成 ===');
})();
```

### 步骤 4: 查看结果
- 检查控制台输出
- 重点关注缺失的字段（标记为 ✗）

---

## 🔍 预期发现

根据之前的错误 `"User [No User] is not authorized"`，你应该会看到：

### ❌ 问题场景 1: userId 缺失
```
localStorage:
  access_token: ✓ 存在
  userId: ✗ 缺失          ← 问题！
  user: ✗ 缺失            ← 问题！
```

### ❌ 问题场景 2: Token 中没有用户信息
```
Token 内容:
  sub (用户ID): ✗ 缺失    ← 问题！
  userId: ✗ 缺失          ← 问题！
  username: ✗ 缺失
```

### ✅ 正常场景（参考）
```
localStorage:
  access_token: ✓ 存在
  userId: ✓ 100001
  user: ✓ 存在

Token 内容:
  sub (用户ID): ✓ 100001
  userId: ✓ 100001
  username: ✓ admin
  过期时间: ✓ 2026-01-25T13:20:00Z
  是否过期: ✓ 否
```

---

## 🎯 根据诊断结果的下一步

### 如果 localStorage 缺少 userId
→ **问题在前端**: `persistTokens()` 方法没有保存 userId  
→ **修复**: 修改 `frontend/NovelAnimeDesktop/src/renderer/stores/auth.ts`

### 如果 Token 中缺少 userId
→ **问题在后端**: 登录端点没有在 JWT 中包含 userId  
→ **修复**: 修改后端登录服务

### 如果 Auth Store 状态不一致
→ **问题在状态同步**: localStorage 和 store 不同步  
→ **修复**: 修改 `loadTokens()` 和 `persistTokens()` 方法

---

## 📋 完整诊断（可选）

如果需要更详细的诊断，运行后端测试：

```bash
cd .kiro/specs/08-02-auth-diagnosis-fix/scripts
./diagnose-backend.sh
```

这将测试：
- ✓ 登录端点
- ✓ Token 生成
- ✓ API 认证
- ✓ DELETE 权限

---

## 💡 提示

- **快速测试**: 只需运行浏览器诊断（1分钟）
- **完整测试**: 同时运行浏览器和后端诊断（3分钟）
- **问题记录**: 截图或复制控制台输出，方便后续分析

---

## 📞 遇到问题？

查看详细文档：
- `reports/DIAGNOSTIC_ANALYSIS.md` - 完整诊断分析
- `docs/DIAGNOSTIC_USAGE_GUIDE.md` - 详细使用指南
- `design.md` - 认证流程设计

---

## 🗑️ 删除操作专项诊断（针对当前问题）

### 快速诊断删除失败原因

1. 登录应用（使用 `john.doe` / `moqui`）
2. 打开浏览器控制台（F12）
3. 复制并运行以下脚本：

```javascript
// === 删除操作诊断脚本 ===
async function diagnoseDelete() {
  console.log('🔍 === Delete Operation Diagnostic ===\n');
  
  // 1. 检查认证状态
  const token = localStorage.getItem('novel_anime_access_token');
  const userId = localStorage.getItem('novel_anime_user_id');
  const userData = localStorage.getItem('novel_anime_user_data');
  
  console.log('1. 认证状态:');
  console.log('  Token:', token ? '✓ 存在' : '✗ 缺失');
  console.log('  UserId:', userId || '✗ 缺失');
  console.log('  UserData:', userData ? '✓ 存在' : '✗ 缺失');
  console.log('');
  
  // 2. 解码 Token
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('2. Token 内容:');
      console.log('  sub:', payload.sub || '✗ 缺失');
      console.log('  userId:', payload.userId || '✗ 缺失');
      console.log('  username:', payload.username || '✗ 缺失');
      console.log('  roles:', payload.roles || payload.authorities || '✗ 缺失');
      console.log('  过期:', payload.exp && Date.now() >= payload.exp * 1000 ? '✗ 是' : '✓ 否');
      console.log('');
    } catch (e) {
      console.log('✗ Token 解码失败');
    }
  }
  
  // 3. 测试 DELETE 请求
  console.log('3. 测试 DELETE 请求...');
  const testUrl = 'http://localhost:8080/rest/s1/novel-anime/projects/TEST_ID';
  
  try {
    const response = await fetch(testUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('  状态码:', response.status, response.statusText);
    
    if (response.status === 401) {
      console.log('  ❌ 认证失败 - Token 无效或未被后端识别');
    } else if (response.status === 403) {
      console.log('  ❌ 权限不足 - 用户没有删除权限');
    } else if (response.status === 404) {
      console.log('  ✅ 认证通过 - 404 表示项目不存在（这是预期的）');
    }
    
    try {
      const data = await response.json();
      console.log('  响应:', data);
    } catch (e) {}
    
  } catch (error) {
    console.log('  ❌ 请求失败:', error.message);
  }
  
  console.log('\n=== 诊断完成 ===');
}

// 运行诊断
diagnoseDelete();
```

### 预期结果分析

**如果看到 401 错误**：
- 问题：后端不认识这个 token
- 原因：Token 格式错误或后端 JWT 验证配置问题
- 解决：检查后端 JWT secret 和验证逻辑

**如果看到 403 错误**：
- 问题：用户认证成功但没有删除权限
- 原因：`john.doe` 用户缺少删除权限
- 解决：检查后端权限配置，给用户添加删除权限

**如果看到 404 错误**：
- 问题：认证成功！404 只是因为测试 ID 不存在
- 解决：尝试删除真实的项目

**如果 Token 中缺少 userId/username**：
- 问题：后端登录时没有在 JWT 中包含用户信息
- 解决：修改后端登录服务，在 JWT 中添加必要的用户信息

---

**准备好了吗？** 启动应用，打开控制台，运行诊断脚本！
