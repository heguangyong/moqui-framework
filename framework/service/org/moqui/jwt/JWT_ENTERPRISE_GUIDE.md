# 企业级JWT认证系统配置指南

## 概述

本系统已实现企业级JWT认证架构，支持多种算法、配置化参数、安全增强功能和完整的审计日志。

## 配置架构

### 开发环境配置 (MoquiDevConf.xml)

开发环境使用宽松的安全配置，便于开发和测试：

```xml
<!-- JWT配置 - 开发环境 -->
<default-property name="moqui.jwt.secret" value="dev_jwt_secret_key_for_development_only_change_in_production_12345"/>
<default-property name="moqui.jwt.issuer" value="moqui-dev"/>
<default-property name="moqui.jwt.audience" value="moqui-app"/>
<default-property name="moqui.jwt.access.expire.minutes" value="120"/>  <!-- 2小时 -->
<default-property name="moqui.jwt.refresh.expire.days" value="7"/>      <!-- 7天 -->
<default-property name="moqui.jwt.ip.validation.enabled" value="false"/>
<default-property name="moqui.jwt.single.session.enabled" value="false"/>
<default-property name="moqui.jwt.rate.limit.enabled" value="false"/>
<default-property name="moqui.jwt.audit.enabled" value="true"/>
<default-property name="moqui.jwt.debug.logging" value="true"/>
<default-property name="moqui.jwt.algorithm" value="HS256"/>
```

### 生产环境配置 (MoquiProductionConf.xml)

生产环境使用严格的安全配置：

```xml
<!-- JWT配置 - 生产环境 -->
<default-property name="moqui.jwt.secret" value="${MOQUI_JWT_SECRET}"/>
<default-property name="moqui.jwt.issuer" value="${MOQUI_JWT_ISSUER:moqui-prod}"/>
<default-property name="moqui.jwt.audience" value="${MOQUI_JWT_AUDIENCE:moqui-app}"/>
<default-property name="moqui.jwt.access.expire.minutes" value="${MOQUI_JWT_ACCESS_EXPIRE:15}"/>    <!-- 15分钟 -->
<default-property name="moqui.jwt.refresh.expire.days" value="${MOQUI_JWT_REFRESH_EXPIRE:30}"/>      <!-- 30天 -->
<default-property name="moqui.jwt.ip.validation.enabled" value="${MOQUI_JWT_IP_VALIDATION:true}"/>
<default-property name="moqui.jwt.single.session.enabled" value="${MOQUI_JWT_SINGLE_SESSION:true}"/>
<default-property name="moqui.jwt.refresh.rotation.enabled" value="${MOQUI_JWT_REFRESH_ROTATION:true}"/>
<default-property name="moqui.jwt.rate.limit.enabled" value="${MOQUI_JWT_RATE_LIMIT:true}"/>
<default-property name="moqui.jwt.rate.limit.requests.per.minute" value="${MOQUI_JWT_RATE_LIMIT_RPM:60}"/>
<default-property name="moqui.jwt.audit.enabled" value="${MOQUI_JWT_AUDIT:true}"/>
<default-property name="moqui.jwt.debug.logging" value="${MOQUI_JWT_DEBUG:false}"/>
<default-property name="moqui.jwt.algorithm" value="${MOQUI_JWT_ALGORITHM:RS256}"/>
<default-property name="moqui.jwt.key.rotation.enabled" value="${MOQUI_JWT_KEY_ROTATION:true}"/>
```

## 环境变量配置（生产环境必须设置）

```bash
# JWT密钥（必须设置，长度建议64字符以上）
export MOQUI_JWT_SECRET="your-very-long-and-secure-jwt-secret-key-here-at-least-64-characters-long"

# JWT颁发者和受众
export MOQUI_JWT_ISSUER="your-company-prod"
export MOQUI_JWT_AUDIENCE="your-app-name"

# 令牌过期时间
export MOQUI_JWT_ACCESS_EXPIRE="15"    # 15分钟
export MOQUI_JWT_REFRESH_EXPIRE="30"   # 30天

# 安全设置
export MOQUI_JWT_IP_VALIDATION="true"
export MOQUI_JWT_SINGLE_SESSION="true"
export MOQUI_JWT_REFRESH_ROTATION="true"

# 速率限制
export MOQUI_JWT_RATE_LIMIT="true"
export MOQUI_JWT_RATE_LIMIT_RPM="60"

# 算法设置（推荐使用RS256）
export MOQUI_JWT_ALGORITHM="RS256"
export MOQUI_JWT_PRIVATE_KEY_PATH="/path/to/private.key"
export MOQUI_JWT_PUBLIC_KEY_PATH="/path/to/public.key"

# 日志设置
export MOQUI_JWT_AUDIT="true"
export MOQUI_JWT_DEBUG="false"
```

## 支持的算法

### 对称算法 (HMAC)
- **HS256**: HMAC with SHA-256 (推荐用于开发)
- **HS384**: HMAC with SHA-384
- **HS512**: HMAC with SHA-512

### 非对称算法 (RSA)
- **RS256**: RSA with SHA-256 (推荐用于生产)
- **RS384**: RSA with SHA-384
- **RS512**: RSA with SHA-512

## RSA密钥对生成

生产环境使用RS256时需要生成RSA密钥对：

```bash
# 生成私钥
openssl genrsa -out private.key 2048

# 生成公钥
openssl rsa -in private.key -pubout -out public.key

# 验证密钥对
openssl rsa -in private.key -check
```

## 企业级功能特性

### 1. 安全增强
- IP地址验证
- 令牌撤销黑名单
- 刷新令牌轮换
- 速率限制保护
- 完整的审计日志

### 2. 配置化管理
- 环境变量支持
- 多环境配置
- 动态算法切换
- 可配置过期时间

### 3. 监控和管理
- 健康状态检查
- 配置信息查询
- 过期令牌清理
- 用户令牌撤销

### 4. 高可用性支持
- 算法缓存机制
- 异常处理和恢复
- 性能优化
- 内存泄漏防护

## API端点

### 认证端点
- `POST /rest/s1/moqui/auth/login` - 用户登录获取JWT令牌
- `POST /rest/s1/moqui/auth/refresh` - 刷新访问令牌
- `POST /rest/s1/moqui/auth/logout` - 登出并撤销令牌
- `GET /rest/s1/moqui/auth/verify` - 验证令牌有效性

### 管理端点
- `POST /rest/s1/moqui/auth/cleanup` - 清理过期令牌
- `GET /rest/s1/moqui/auth/config` - 获取JWT配置信息
- `POST /rest/s1/moqui/auth/revoke-user` - 撤销用户所有令牌
- `GET /rest/s1/moqui/auth/health` - JWT系统健康检查

## 安全最佳实践

### 1. 生产环境部署
- 必须使用环境变量配置JWT密钥
- 推荐使用RS256非对称算法
- 启用IP验证和速率限制
- 设置较短的访问令牌过期时间（15分钟）

### 2. 密钥管理
- JWT密钥长度至少64字符
- 定期轮换密钥（建议每季度）
- 使用安全的密钥存储服务
- 避免在代码中硬编码密钥

### 3. 监控和审计
- 启用完整的审计日志
- 监控异常认证尝试
- 定期检查令牌撤销列表大小
- 设置安全告警

### 4. 网络安全
- 仅在HTTPS上传输JWT令牌
- 设置适当的CORS策略
- 使用安全的HTTP头
- 考虑实施WAF保护

## 故障排查

### 常见问题

1. **JWT密钥未配置错误**
   ```
   解决方案：设置MOQUI_JWT_SECRET环境变量
   ```

2. **算法不匹配错误**
   ```
   检查配置的算法是否与密钥类型匹配
   HMAC算法使用对称密钥，RSA算法使用非对称密钥对
   ```

3. **令牌验证失败**
   ```
   检查令牌是否过期、是否被撤销、IP是否匹配
   ```

4. **性能问题**
   ```
   检查撤销令牌列表大小，定期执行清理
   检查算法缓存是否正常工作
   ```

### 健康检查命令

```bash
# 检查JWT系统健康状态
curl -X GET "http://localhost:8080/rest/s1/moqui/auth/health" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 获取配置信息
curl -X GET "http://localhost:8080/rest/s1/moqui/auth/config" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 性能调优

### 1. 缓存优化
- 算法实例缓存5分钟
- 用户信息缓存
- 配置参数缓存

### 2. 内存管理
- 定期清理过期撤销令牌
- 监控内存使用情况
- 设置合理的缓存大小

### 3. 数据库优化
- 审计日志表定期归档
- 用户账户表添加索引
- 优化查询性能

## 维护任务

### 定期任务（建议配置为定时任务）

```bash
# 每小时清理过期令牌
0 * * * * curl -X POST "http://localhost:8080/rest/s1/moqui/auth/cleanup"

# 每日健康检查
0 6 * * * curl -X GET "http://localhost:8080/rest/s1/moqui/auth/health" >> /var/log/jwt-health.log

# 每周审计日志分析
0 0 * * 0 /path/to/audit-analysis-script.sh
```

## 升级和迁移

### 从旧版本升级
1. 备份现有配置
2. 更新配置文件格式
3. 设置环境变量
4. 测试认证功能
5. 逐步迁移生产环境

### 配置迁移脚本
系统提供自动配置迁移支持，会自动检测旧版配置并提供迁移建议。

---

这个企业级JWT认证系统提供了完整的安全、可扩展和可维护的解决方案，满足现代企业应用的认证需求。