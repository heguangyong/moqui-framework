# Design Document: User System Refactor

## Overview

本设计文档描述了将 `NovelAnimeUser` 表重构为 `UserAccount` 扩展表的技术方案。核心思想是让 Moqui 框架的 `UserAccount` 负责用户认证，而 `NovelAnimeUser` 仅存储小说动漫生成器的业务扩展数据。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vue.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  App.vue    │  │ContextPanel │  │    userStore        │  │
│  │  (Header)   │◄─┤  (Profile)  │◄─┤  (Pinia State)      │  │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘  │
└───────────────────────────────────────────────┼─────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      REST API Layer                          │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  /auth/login    │  │  /auth/profile                  │   │
│  │  (Moqui Auth)   │  │  (JOIN UserAccount + NAUser)    │   │
│  └────────┬────────┘  └────────────────┬────────────────┘   │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  moqui.security     │    │  novel.anime.user           │ │
│  │  .UserAccount       │◄───┤  .NovelAnimeUser            │ │
│  │  ─────────────────  │    │  ─────────────────────────  │ │
│  │  userId (PK)        │    │  userId (PK, FK)            │ │
│  │  username           │    │  credits                    │ │
│  │  emailAddress       │    │  avatarUrl                  │ │
│  │  currentPassword    │    │  status                     │ │
│  │  userFullName       │    │  createdDate                │ │
│  │  ...                │    │  lastLoginDate              │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Entity Layer Changes

#### NovelAnimeUser Entity (Modified)

**Before:**
```xml
<entity entity-name="NovelAnimeUser" package="novel.anime.user">
    <field name="userId" type="id" is-pk="true"/>
    <field name="email" type="text-medium" not-null="true"/>        <!-- REMOVE -->
    <field name="username" type="text-medium"/>                      <!-- REMOVE -->
    <field name="passwordHash" type="text-medium"/>                  <!-- REMOVE -->
    <field name="avatarUrl" type="text-medium"/>
    <field name="credits" type="number-integer" default="500"/>
    <field name="status" type="text-short" default="'active'"/>
    <field name="authProvider" type="text-short" default="'local'"/> <!-- REMOVE -->
    <field name="createdDate" type="date-time"/>
    <field name="lastLoginDate" type="date-time"/>
</entity>
```

**After:**
```xml
<entity entity-name="NovelAnimeUser" package="novel.anime.user">
    <field name="userId" type="id" is-pk="true"/>
    <field name="avatarUrl" type="text-medium"/>
    <field name="credits" type="number-integer" default="500"/>
    <field name="status" type="text-short" default="'active'"/>
    <field name="createdDate" type="date-time"/>
    <field name="lastLoginDate" type="date-time"/>
    <relationship type="one" related="moqui.security.UserAccount"/>
</entity>
```

### 2. Service Layer Changes

#### Authentication Service

使用 Moqui 内置的认证机制，登录成功后自动创建/更新 NovelAnimeUser：

```groovy
// Login flow
1. ec.user.loginUser(username, password)  // Moqui built-in auth
2. Check if NovelAnimeUser exists for ec.user.userId
3. If not exists, create NovelAnimeUser with default credits
4. Update lastLoginDate
5. Return combined user profile
```

#### Profile Service

```groovy
// Get user profile - JOIN both tables
def userAccount = ec.entity.find("moqui.security.UserAccount")
    .condition("userId", userId).one()
def novelAnimeUser = ec.entity.find("novel.anime.user.NovelAnimeUser")
    .condition("userId", userId).one()

return [
    userId: userId,
    username: userAccount.username,
    email: userAccount.emailAddress,
    fullName: userAccount.userFullName,
    credits: novelAnimeUser?.credits ?: 500,
    avatarUrl: novelAnimeUser?.avatarUrl,
    status: novelAnimeUser?.status ?: 'active'
]
```

#### Update Profile Service

```groovy
// Update user profile - update both tables as needed
// Requirements: 6.1, 6.2, 6.3, 6.4

// Update UserAccount fields (fullName)
if (fullName) {
    def userAccount = ec.entity.find("moqui.security.UserAccount")
        .condition("userId", userId).one()
    userAccount.userFullName = fullName
    userAccount.update()
}

// Update NovelAnimeUser fields (avatarUrl)
if (avatarUrl) {
    def novelAnimeUser = ec.entity.find("novel.anime.user.NovelAnimeUser")
        .condition("userId", userId).one()
    novelAnimeUser.avatarUrl = avatarUrl
    novelAnimeUser.update()
}

// Return updated combined profile
return getUpdatedProfile(userId)
```

#### Change Password Service

```groovy
// Change password - verify current, update with Moqui hashing
// Requirements: 7.1, 7.2, 7.3, 7.4

// 1. Verify current password using Moqui's built-in verification
def userAccount = ec.entity.find("moqui.security.UserAccount")
    .condition("userId", userId).one()

if (!org.moqui.impl.context.UserFacadeImpl.checkPassword(currentPassword, userAccount.currentPassword)) {
    return [success: false, message: "Current password is incorrect"]
}

// 2. Hash and update new password
userAccount.currentPassword = org.moqui.impl.context.UserFacadeImpl.getPasswordHash(newPassword)
userAccount.passwordSetDate = ec.user.nowTimestamp
userAccount.update()

return [success: true, message: "Password changed successfully"]
```

### 3. Frontend Changes

#### New userStore (Pinia)

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    username: '',
    email: '',
    fullName: '',
    credits: 0,
    avatarUrl: '',
    status: 'active',
    isLoggedIn: false
  }),
  
  actions: {
    async fetchProfile() { ... },
    async login(username, password) { ... },
    async updateProfile(data: { fullName?: string, avatarUrl?: string }) { ... },
    async changePassword(currentPassword: string, newPassword: string) { ... },
    logout() { ... }
  }
})
```

#### Profile Edit Dialog Component

```vue
<!-- components/dialogs/ProfileEditDialog.vue -->
<template>
  <q-dialog v-model="visible">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">编辑个人资料</div>
      </q-card-section>
      
      <q-card-section>
        <!-- Avatar upload -->
        <div class="avatar-section">
          <img :src="avatarUrl || defaultAvatar" />
          <q-btn @click="uploadAvatar">更换头像</q-btn>
        </div>
        
        <!-- Full name input -->
        <q-input v-model="fullName" label="显示名称" />
      </q-card-section>
      
      <q-card-actions>
        <q-btn @click="save">保存</q-btn>
        <q-btn @click="visible = false">取消</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
```

#### App.vue / ContextPanel Changes

```vue
<!-- Before: Hardcoded -->
<ContextPanel user-name="John Doe" user-email="customerpop@gmail.com" />

<!-- After: From store -->
<ContextPanel :user-name="userStore.fullName || userStore.username" 
              :user-email="userStore.email" />
```

## Data Models

### UserAccount (Moqui Built-in)

| Field | Type | Description |
|-------|------|-------------|
| userId | id (PK) | 用户唯一标识 |
| username | text-medium | 登录用户名 |
| emailAddress | text-medium | 邮箱地址 |
| currentPassword | text-medium | 加密密码 |
| userFullName | text-medium | 用户全名 |
| locale | text-short | 语言设置 |
| timeZone | text-short | 时区设置 |

### NovelAnimeUser (Business Extension)

| Field | Type | Description |
|-------|------|-------------|
| userId | id (PK, FK) | 关联 UserAccount.userId |
| credits | number-integer | 积分余额，默认 500 |
| avatarUrl | text-medium | 头像 URL |
| status | text-short | 账户状态 (active/suspended) |
| createdDate | date-time | 创建时间 |
| lastLoginDate | date-time | 最后登录时间 |

### UserOAuthAccount (Unchanged)

保持现有结构，userId 继续关联 NovelAnimeUser.userId。

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Auto-creation of NovelAnimeUser

*For any* user who successfully authenticates via UserAccount, if no corresponding NovelAnimeUser record exists, the system should create one with userId matching UserAccount.userId and credits set to 500.

**Validates: Requirements 2.3**

### Property 2: Profile data consistency

*For any* call to the profile API, the returned username and email should match the values stored in UserAccount for the same userId.

**Validates: Requirements 3.2, 3.3**

### Property 3: User store synchronization

*For any* successful login, the userStore state should contain the same userId, username, and email as returned by the login API response.

**Validates: Requirements 4.2**

### Property 4: Profile update consistency

*For any* successful profile update, the returned profile data should reflect the updated values, and subsequent profile fetches should return the same updated values.

**Validates: Requirements 6.3**

### Property 5: Password change security

*For any* password change request, if the current password is incorrect, the system should reject the change and the stored password should remain unchanged.

**Validates: Requirements 7.1, 7.2**

## Error Handling

| Scenario | Handling |
|----------|----------|
| UserAccount not found | Return 401 Unauthorized |
| NovelAnimeUser creation fails | Log error, return partial profile from UserAccount only |
| Database connection error | Return 503 Service Unavailable |
| Invalid JWT token | Return 401 Unauthorized, clear frontend user store |
| Profile update fails | Return 400 Bad Request with error details, no data modified |
| Current password incorrect | Return 401 Unauthorized, password unchanged |
| New password too short | Return 400 Bad Request with validation error |

## Testing Strategy

### Unit Tests

1. **Entity Tests**: Verify NovelAnimeUser entity has correct fields and relationship
2. **Service Tests**: Test profile service returns combined data correctly
3. **Store Tests**: Test userStore actions update state correctly

### Property-Based Tests

使用 Groovy Spock 框架进行属性测试：

1. **Property 1 Test**: Generate random UserAccount records, verify NovelAnimeUser auto-creation
2. **Property 2 Test**: Generate random profile requests, verify response matches database
3. **Property 3 Test**: Generate random login sequences, verify store state consistency

### Integration Tests

1. **Login Flow**: Test complete login → profile fetch → UI display flow
2. **OAuth Flow**: Test OAuth login creates both UserAccount and NovelAnimeUser
3. **Logout Flow**: Test logout clears all user state
