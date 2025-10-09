# Moqui企业级开发文档索引

## 📋 快速导航

### 🎯 核心文档（推荐优先阅读）

| 文档名称 | 适用场景 | 最后更新 |
|---------|---------|----------|
| [Moqui-JWT企业级认证实战指南](./Moqui-JWT企业级认证实战指南.md) | JWT认证系统实施、配置和故障排除 | 2025-10-02 |
| [Moqui-Marketplace组件认证与权限配置实战指南](./Moqui-Marketplace组件认证与权限配置实战指南.md) | 组件认证权限配置、错误修复 | 2025-10-01 |
| [Moqui-MinIO组件开发精品化实战指南](./Moqui-MinIO组件开发精品化实战指南.md) | MinIO组件开发和企业级架构 | 2025-09-28 |
| [Vue3-Quasar2-升级监测工具链指南](./Vue3-Quasar2-升级监测工具链指南.md) | **Vue 3 + Quasar 2 升级修复完整指南** | 2025-10-04 |

### 🗃️ 归档文档

保存在 `archive/` 目录下，包含详细的技术细节和历史参考资料。

## 🚀 快速开始指南

### JWT认证系统部署流程
1. 📖 **系统了解**：阅读 **JWT企业级认证实战指南** 了解架构设计
2. ⚙️ **环境配置**：参考配置示例设置开发/生产环境
3. 🔧 **API集成**：使用REST API进行令牌获取和验证
4. 🛡️ **安全加固**：启用IP验证、速率限制、审计日志

### Vue 3升级监测工具链
1. 📖 **系统了解**：阅读 **Vue3-Quasar2-升级监测工具链指南** 了解完整技术修复
2. 🛠️ **主控制台**：打开 `Vue3_Monitor_Dashboard.html` 进行实时监控
3. 🤖 **自动化测试**：使用 `Vue3_Automated_Tests.html` 运行完整测试套件
4. 🔧 **专业诊断**：使用专业诊断工具进行深度问题分析
   - `vue3_test_verification.html` - Vue 3组件注册验证器
   - `vue3_actual_test.html` - 实际页面测试工具
   - `page_blank_diagnosis.html` - 页面白板诊断工具

### 组件开发流程
1. 🎯 **权限配置**：使用 **Marketplace组件认证指南** 解决权限问题
2. 🏗️ **架构设计**：参考 **MinIO组件指南** 了解企业级设计模式
3. 📋 **质量检查**：使用 **实战规范** 进行代码质量验证

## 🔐 JWT认证快速配置

### 开发环境（零配置）
```bash
# 无需配置，使用默认设置：
# - 算法: HS256
# - 访问令牌: 1小时过期
# - 刷新令牌: 30天过期
./gradlew run
```

### 生产环境配置
```bash
# RSA算法 + 完整安全功能
export MOQUI_JWT_ALGORITHM="RS256"
export MOQUI_JWT_PRIVATE_KEY_PATH="/path/to/private.key"
export MOQUI_JWT_PUBLIC_KEY_PATH="/path/to/public.key"
export MOQUI_JWT_IP_VALIDATION_ENABLED="true"
export MOQUI_JWT_RATE_LIMIT_ENABLED="true"
```

### API快速测试
```bash
# 获取JWT令牌
curl -X POST http://localhost:8080/rest/s1/moqui/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john.doe", "password": "moqui"}'

# 使用令牌访问API
curl -X GET http://localhost:8080/rest/s1/your-endpoint \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 💡 常见问题速查

### Vue 3升级专项问题
| 问题类型 | 解决方案 | 文档位置 |
|---------|---------|----------|
| **组件解析失败** | 检查组件注册时机是否在mount前 | Vue3指南 §1 |
| **路由器未定义** | 确保router在使用前定义 | Vue3指南 §2 |
| **模板编译错误** | 使用null安全操作符 | Vue3指南 §3 |
| **页面白板问题** | 使用诊断工具分析认证重定向 | Vue3指南 §4 |

### JWT认证问题
| 问题类型 | 解决方案 | 文档位置 |
|---------|---------|----------|
| **令牌验证失败** | 检查算法配置和密钥 | JWT指南 §4.1 |
| **令牌不可见** | 查看Cookie和Response Headers | JWT指南 §3 |
| **IP验证失败** | 配置IP验证规则 | JWT指南 §5.1 |
| **速率限制触发** | 调整限制参数 | JWT指南 §5.2 |

### 组件开发问题
| 问题类型 | 解决方案 | 文档位置 |
|---------|---------|----------|
| **服务认证错误** | 使用 `authenticate="false"` | Marketplace指南 §一 |
| **实体权限错误** | 添加匿名权限 + `.disableAuthz()` | Marketplace指南 §二 |
| **FormConfigUser错误** | form-list改HTML表格 | Marketplace指南 §三 |

## 🏗️ 企业级架构特性

### JWT认证系统架构
- **框架级集成**: `framework/src/main/java/org/moqui/jwt/JwtUtil.java`
- **安全服务**: `framework/service/org/moqui/jwt/JwtSecurityServices.xml`
- **统一登录**: `runtime/base-component/webroot/screen/webroot/Login.xml`
- **REST API**: `framework/src/main/groovy/org/moqui/impl/service/RestApi.groovy`

### 安全特性
- ✅ **多算法支持**: HMAC和RSA算法族
- ✅ **IP绑定验证**: 防止令牌盗用
- ✅ **速率限制**: 防暴力破解攻击
- ✅ **审计日志**: 完整认证事件记录
- ✅ **令牌撤销**: 全局黑名单管理
- ✅ **自动清理**: 过期令牌自动清理

### 性能优化
- ✅ **算法缓存**: 5分钟缓存避免重复初始化
- ✅ **异步审计**: 非阻塞日志写入
- ✅ **条件调试**: 零性能影响的调试日志

## 🎯 最佳实践总结

### ✅ 架构设计要点
1. **框架级统一**: 避免组件级分散实现
2. **配置驱动**: 系统属性灵活配置
3. **向后兼容**: 零破坏性升级
4. **双模式支持**: Headers + Cookies兼容不同客户端

### ❌ 常见陷阱避免
1. 不要在组件级实现认证功能
2. 不要硬编码敏感配置信息
3. 不要忽略生产环境安全配置
4. 不要忘记定期清理撤销令牌

## 💻 AI使用建议

### 开发JWT功能时
1. 明确说明是否为框架级还是组件级需求
2. 引用具体的JWT指南章节（如"参考JWT指南§5.1"）
3. 提供完整的错误信息和配置内容

### 组件开发时
1. 要求AI遵循企业级架构模式
2. 让AI参考MinIO组件的设计原则
3. 要求AI进行安全性和性能检查

---

**框架版本**: Moqui Framework + Java 21 + JWT企业级认证 + Vue 3 + Quasar 2
**文档维护**: 开发团队共同维护
**最后更新**: 2025-10-04