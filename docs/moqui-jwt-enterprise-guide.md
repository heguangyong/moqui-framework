# Moqui Framework - JWT企业级认证实战指南

## 📖 概述

本指南基于Moqui Framework成功实现的企业级JWT认证系统，提供完整的实战经验、配置方法和最佳实践。

## 🎯 核心特性

### ✅ 已实现功能
- **框架级JWT认证**: 完全替换传统session认证机制
- **多算法支持**: HMAC (HS256/384/512) 和 RSA (RS256/384/512)
- **企业级安全**: IP验证、速率限制、审计日志、令牌撤销
- **双兼容性**: 同时支持Header和Cookie方式的token传递
- **零配置启动**: 开发环境自动配置，生产环境可完全定制

### 🔧 架构设计
```
framework/src/main/java/org/moqui/jwt/JwtUtil.java           # 核心JWT工具类
framework/service/org/moqui/jwt/JwtSecurityServices.xml     # JWT安全服务
runtime/base-component/webroot/screen/webroot/Login.xml     # 统一登录实现
framework/src/main/groovy/org/moqui/impl/service/RestApi.groovy # REST API集成
```

## 🚀 快速配置

### 1. 开发环境（零配置）
系统默认配置即可直接使用：
- 算法: HS256
- 访问令牌过期时间: 1小时
- 刷新令牌过期时间: 30天
- 调试日志: 关闭

### 2. 生产环境配置
```bash
# 基础JWT配置
export MOQUI_JWT_ALGORITHM="RS256"
export MOQUI_JWT_PRIVATE_KEY_PATH="/path/to/private.key"
export MOQUI_JWT_PUBLIC_KEY_PATH="/path/to/public.key"

# 安全增强配置
export MOQUI_JWT_IP_VALIDATION_ENABLED="true"
export MOQUI_JWT_RATE_LIMIT_ENABLED="true"
export MOQUI_JWT_RATE_LIMIT_REQUESTS_PER_MINUTE="60"

# 审计和监控
export MOQUI_JWT_AUDIT_ENABLED="true"
export MOQUI_JWT_DEBUG_LOGGING="false"

# 令牌过期时间
export MOQUI_JWT_ACCESS_EXPIRE_MINUTES="30"
export MOQUI_JWT_REFRESH_EXPIRE_DAYS="7"
```

## 💻 API使用方法

### 登录获取令牌
```bash
curl -X POST http://localhost:8080/rest/s1/moqui/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john.doe", "password": "moqui"}'
```

**响应示例**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### 使用令牌访问API
```bash
curl -X GET http://localhost:8080/rest/s1/your-endpoint \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 刷新令牌
```bash
curl -X POST http://localhost:8080/rest/s1/moqui/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

## 🔍 令牌可见性验证

### 1. 浏览器中查看
- **Cookie方式**: F12 → Application → Cookies → `jwt_access_token`
- **Network面板**: F12 → Network → 登录请求 → Response Headers

### 2. 响应头字段
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-Access-Token: eyJhbGciOiJIUzI1NiIs...
X-Refresh-Token: eyJhbGciOiJIUzI1NiIs...
Set-Cookie: jwt_access_token=eyJhbGciOiJIUzI1NiIs...; Path=/; Max-Age=7200
```

## 🛡️ 安全特性详解

### 1. IP验证
```java
// 启用IP验证后，令牌绑定客户端IP
// 配置: MOQUI_JWT_IP_VALIDATION_ENABLED=true
// 效果: 防止令牌被盗用
```

### 2. 速率限制
```java
// 防止暴力破解攻击
// 配置: MOQUI_JWT_RATE_LIMIT_ENABLED=true
//       MOQUI_JWT_RATE_LIMIT_REQUESTS_PER_MINUTE=60
// 效果: 限制每分钟JWT操作次数
```

### 3. 令牌撤销
```java
// 全局令牌黑名单
// 功能: 立即撤销特定令牌
// 清理: 自动清理过期的撤销令牌
```

### 4. 审计日志
```java
// 完整的认证事件记录
// 记录: 登录、令牌生成、验证失败、撤销等
// 存储: Moqui EntityAuditLog系统
```

## 🔧 常见问题解决

### 1. 令牌验证失败
**问题**: 返回401未授权
**检查项**:
- 令牌是否过期 (`exp` claim)
- 算法是否匹配
- 密钥配置是否正确
- IP验证是否开启且IP不匹配

### 2. 令牌在浏览器中不可见
**原因**: Moqui是服务端渲染，不同于SPA应用
**解决方案**:
- 查看Cookie: `jwt_access_token`
- 检查Response Headers
- 使用Network面板查看登录请求

### 3. 服务调用权限错误
**问题**: `Could not find service with name create#moqui.security.AuditLog`
**解决**: 使用正确的服务名 `create#moqui.entity.EntityAuditLog`

### 4. RSA密钥配置
```bash
# 生成RSA密钥对
openssl genrsa -out private.key 2048
openssl rsa -in private.key -pubout -out public.key

# 配置路径
export MOQUI_JWT_PRIVATE_KEY_PATH="/path/to/private.key"
export MOQUI_JWT_PUBLIC_KEY_PATH="/path/to/public.key"
```

## 📊 性能优化

### 1. 算法缓存
- JWT算法实例缓存5分钟
- 避免重复初始化的性能开销

### 2. 令牌清理
```java
// 定期清理过期的撤销令牌
// 建议: 设置定时任务调用 JwtUtil.cleanupRevokedTokens()
```

### 3. 连接优化
- 使用连接池管理数据库连接
- 异步处理审计日志写入

## 🎯 最佳实践

### 1. 环境分离
```bash
# 开发环境: 使用HMAC算法，简单配置
export MOQUI_JWT_ALGORITHM="HS256"
export MOQUI_JWT_DEBUG_LOGGING="true"

# 生产环境: 使用RSA算法，完整安全配置
export MOQUI_JWT_ALGORITHM="RS256"
export MOQUI_JWT_IP_VALIDATION_ENABLED="true"
export MOQUI_JWT_RATE_LIMIT_ENABLED="true"
```

### 2. 令牌生命周期
- 访问令牌: 短期 (15-60分钟)
- 刷新令牌: 中期 (1-30天)
- 定期轮换刷新令牌增强安全性

### 3. 监控指标
- 令牌生成速率
- 验证失败率
- 撤销令牌数量
- IP验证失败次数

## 🔄 升级迁移

### 从传统Session到JWT
1. **向后兼容**: 现有功能无需修改
2. **渐进迁移**: REST API优先使用JWT
3. **Web界面**: 自动适配JWT认证
4. **测试验证**: 确保所有功能正常

### 配置迁移
```bash
# 旧配置方式 (不再使用)
# <default-property name="moqui.jwt.secret" value="..."/>

# 新配置方式 (推荐)
export MOQUI_JWT_SECRET="your-secret-key"
```

---

## 💡 实战经验总结

### ✅ 成功要点
1. **框架级集成**: 避免组件级散落实现
2. **系统属性配置**: 灵活的环境适配
3. **双模式兼容**: Headers + Cookies满足不同客户端需求
4. **完整审计**: 企业级安全要求
5. **性能优化**: 缓存和异步处理

### ❌ 避免陷阱
1. 不要在组件级实现JWT，应使用框架级
2. 不要硬编码密钥，使用环境变量配置
3. 不要忽略IP验证和速率限制
4. 不要忘记定期清理撤销令牌
5. 不要在生产环境开启调试日志

---

**文档版本**: v1.0
**最后更新**: 2025-10-02
**适用版本**: Moqui Framework + Java 21 + 企业级JWT认证系统