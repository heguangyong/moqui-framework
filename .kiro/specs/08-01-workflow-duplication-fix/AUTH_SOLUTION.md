# 认证问题解决方案

**Date**: 2026-01-22  
**Status**: ✅ 方案确定

---

## 问题总结

删除项目失败的根本原因：**用户未登录**

```
错误信息: User [No User] is not authorized for Update on Entity novel.anime.Project
```

---

## 系统现状

### ✅ 已有的认证系统

1. **Auth Store** (`stores/auth.ts`)
   - 完整的认证状态管理
   - 支持多种登录方式：
     - 邮箱密码登录
     - GitHub OAuth
     - Google OAuth
     - 微信扫码登录
   - Token 管理和刷新

2. **Login View** (`views/LoginView.vue`)
   - 登录页面已存在
   - 路由: `/login`

3. **路由守卫** (`router/index.js`)
   - 自动检查认证状态
   - 未登录自动跳转到登录页

### ✅ 已实现的改进

1. **删除前认证检查**
   - 检查 localStorage 中的 token
   - 未登录时显示友好提示
   - 避免无效的 API 调用

2. **启动时认证提示**
   - 应用加载时检查认证状态
   - 显示警告通知

3. **增强的错误提示**
   - 识别认证相关错误
   - 显示具体的错误信息

---

## 解决方案

### 方案 1: 正常登录流程（推荐）

**步骤**:
1. 打开应用
2. 如果未登录，会看到警告提示
3. 点击登录按钮或访问 `/login` 路由
4. 使用以下方式之一登录：
   - 邮箱密码
   - GitHub 账号
   - Google 账号
   - 微信扫码
5. 登录成功后，删除功能正常工作

**优点**:
- 符合正常业务流程
- 安全可靠
- 用户体验完整

**缺点**:
- 需要有效的用户账号
- 需要后端支持

---

### 方案 2: 开发环境自动登录

为开发和测试方便，可以实现自动登录功能。

#### 实现方式

在 `DashboardView.vue` 的 `onMounted` 中添加：

```javascript
async function checkAndAutoLogin() {
  const token = localStorage.getItem('novel_anime_access_token');
  
  if (!token) {
    console.log('🔐 No auth token found, attempting auto-login...');
    
    // 尝试使用测试账号登录
    const { apiService } = await import('../services/index.ts');
    const result = await apiService.login('test@example.com', 'test123');
    
    if (result.success) {
      console.log('✅ Auto-login successful');
      // 刷新页面以更新认证状态
      location.reload();
    } else {
      console.warn('⚠️ Auto-login failed:', result.message);
    }
  }
}

// 在 onMounted 中调用
onMounted(async () => {
  console.log('📊 DashboardView mounted');
  
  // 开发环境自动登录
  if (import.meta.env.DEV) {
    await checkAndAutoLogin();
  }
  
  // ... 其他初始化代码
});
```

**优点**:
- 开发测试方便
- 无需手动登录

**缺点**:
- 需要后端提供测试账号
- 仅适用于开发环境

---

### 方案 3: 临时 Token 注入（快速测试）

如果只是想快速测试删除功能，可以手动注入 token。

#### 步骤

1. 打开浏览器控制台（F12）
2. 运行以下命令：

```javascript
// 注入测试 token
localStorage.setItem('novel_anime_access_token', 'YOUR_VALID_TOKEN_HERE');

// 刷新页面
location.reload();
```

3. 页面刷新后，删除功能应该可以工作

**如何获取有效 token**:
- 方法 1: 在另一个已登录的浏览器中，运行 `localStorage.getItem('novel_anime_access_token')` 复制 token
- 方法 2: 使用 Postman 或 curl 调用登录 API 获取 token
- 方法 3: 查看后端日志或数据库中的 token

**优点**:
- 快速测试
- 无需修改代码

**缺点**:
- 临时方案
- Token 可能过期
- 不适合长期使用

---

### 方案 4: 后端配置（不推荐）

修改后端，允许未认证的删除操作。

**不推荐原因**:
- 安全风险
- 违反业务逻辑
- 仅适用于开发环境

---

## 推荐实施步骤

### 短期（立即可用）

1. ✅ 使用方案 3 快速测试删除功能
2. ✅ 验证删除逻辑正确

### 中期（开发阶段）

1. ⏳ 实施方案 2 - 开发环境自动登录
2. ⏳ 配置测试账号
3. ⏳ 添加环境变量控制

### 长期（生产环境）

1. ⏳ 使用方案 1 - 正常登录流程
2. ⏳ 完善用户体验
3. ⏳ 添加"登录"按钮到 UI

---

## 代码示例

### 添加登录按钮到 Dashboard

在 `DashboardView.vue` 中添加：

```vue
<template>
  <div class="dashboard-view">
    <!-- 未登录提示 -->
    <div v-if="!isAuthenticated" class="auth-warning">
      <component :is="icons.alertCircle" :size="20" />
      <span>您尚未登录，部分功能受限</span>
      <button class="login-btn" @click="goToLogin">
        立即登录
      </button>
    </div>
    
    <!-- 其他内容 -->
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);

function goToLogin() {
  router.push('/login');
}
</script>

<style scoped>
.auth-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
}

.login-btn {
  margin-left: auto;
  padding: 6px 16px;
  background: #7a9188;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.login-btn:hover {
  background: #6a8178;
}
</style>
```

---

## 测试清单

- [ ] 未登录时尝试删除 → 显示"请先登录"提示
- [ ] 登录后尝试删除 → 删除成功
- [ ] Token 过期后尝试删除 → 显示权限错误
- [ ] 刷新页面后认证状态保持
- [ ] 登出后删除功能被禁用

---

## 相关文件

- `frontend/NovelAnimeDesktop/src/renderer/stores/auth.ts` - 认证 Store
- `frontend/NovelAnimeDesktop/src/renderer/views/LoginView.vue` - 登录页面
- `frontend/NovelAnimeDesktop/src/renderer/views/DashboardView.vue` - 仪表盘（需添加登录按钮）
- `frontend/NovelAnimeDesktop/src/renderer/router/index.js` - 路由配置

---

**结论**: 系统已有完整的认证机制，用户需要登录后才能删除项目。建议实施方案 2（开发环境自动登录）+ 方案 1（生产环境正常登录）。
