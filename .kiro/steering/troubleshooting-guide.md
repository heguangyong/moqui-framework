# 故障排查指南

本文档提供了Moqui AI平台项目中常见问题的诊断和解决方案。

## 概述

故障排查遵循系统化的诊断流程，从症状识别到根因分析，再到解决方案实施和验证。

## 通用故障排查流程

### 1. 问题识别和分类
1. **收集症状信息**: 详细记录问题表现
2. **确定影响范围**: 识别受影响的功能和用户
3. **评估紧急程度**: 确定问题优先级
4. **初步分类**: 前端、后端、集成、配置等

### 2. 系统化诊断
1. **检查日志**: 查看应用日志、错误日志、访问日志
2. **验证配置**: 检查关键配置项和环境变量
3. **测试连接**: 验证网络连接和服务可用性
4. **隔离问题**: 通过最小化测试确定问题范围

### 3. 解决方案实施
1. **制定修复计划**: 确定修复步骤和回滚方案
2. **执行修复**: 按计划实施修复措施
3. **验证修复**: 确认问题已解决
4. **文档记录**: 记录问题和解决方案

## Moqui Framework 常见问题

### 认证配置错误

**症状**: "User must be logged in to call service" 错误

**诊断步骤**:
```bash
# 1. 检查服务定义
grep -r "require-authentication" runtime/component/*/service/
grep -r "authenticate.*true" runtime/component/*/service/

# 2. 检查屏幕定义
grep -r "authenticate.*false" runtime/component/*/screen/
```

**常见原因**:
- Service定义中错误使用 `require-authentication` 属性
- Screen定义中错误使用 `authenticate` 属性

**解决方案**:
```xml
<!-- ✅ 正确：Service使用authenticate属性 -->
<service verb="get" noun="Data" authenticate="false" allow-remote="true">

<!-- ✅ 正确：Screen使用require-authentication属性 -->
<screen require-authentication="false">
```

### 菜单显示问题

**症状**: 应用不显示在主菜单中

**诊断步骤**:
```bash
# 1. 检查apps.xml注册
curl -s -b /tmp/session.txt "http://localhost:8080/apps" | grep -i "应用名称"

# 2. 检查qapps.xml注册
curl -s -b /tmp/session.txt "http://localhost:8080/qapps" | grep -i "应用名称"

# 3. 检查menuData接口
curl -s -b /tmp/session.txt "http://localhost:8080/qapps/yourapp/menuData" | jq .
```

**解决方案**: 确保双重注册机制正确配置（详见moqui-standards.md）

### 实体权限问题

**症状**: Entity查询权限不足错误

**解决方案**:
```groovy
// ✅ 正确：使用.disableAuthz()绕过权限检查
def dataList = ec.entity.find("YourEntity")
    .condition("status", "ACTIVE")
    .disableAuthz()  // 重要：绕过权限检查
    .list()
```

## JWT认证问题

### JWT Token验证失败

**症状**: 前端请求返回401未授权错误

**诊断步骤**:
```bash
# 1. 检查JWT配置
grep -r "moqui.jwt" runtime/conf/MoquiDevConf.xml

# 2. 验证Token格式
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq .

# 3. 测试JWT验证
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/rest/s1/example
```

**常见原因**:
- JWT密钥配置错误
- Token过期
- Token格式不正确

**解决方案**:
```xml
<!-- MoquiDevConf.xml中的正确配置 -->
<default-property name="moqui.jwt.secret" value="your-secret-key"/>
<default-property name="moqui.jwt.expire.hours" value="24"/>
```

## Telegram Bot问题

### Bot无响应问题

**症状**: 用户输入/start没有反馈，PC端和手机端均无响应

**诊断步骤**:
```bash
# 1. 检查Webhook状态
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"

# 2. 测试Bot连接
curl "https://api.telegram.org/bot<BOT_TOKEN>/getMe"

# 3. 检查Moqui服务状态
curl -s "http://localhost:8080/rest/s1/mcp/telegram/webhook" -w "%{http_code}"
```

**常见原因**:
1. **Webhook配置过期**: Telegram无法访问回调URL
2. **网络连接问题**: 服务器网络配置变更
3. **菜单架构混乱**: 多个应用重复实现Telegram功能

**解决方案**:

1. **重新配置Webhook**:
```bash
# 删除旧Webhook
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"

# 设置新Webhook
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -d "url=https://your-domain.com/rest/s1/mcp/telegram/webhook"
```

2. **统一菜单架构**:
```xml
<!-- 隐藏重复的Telegram功能 -->
<subscreens-item name="TelegramAdmin" menu-include="false"
                 location="component://moqui-marketplace/screen/marketplace/TelegramAdmin.xml"/>
```

3. **验证修复**:
```bash
# 测试Bot响应
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" \
     -d "chat_id=<CHAT_ID>&text=测试消息"
```

### 多模态功能异常

**症状**: 语音识别或图像识别功能不工作

**诊断步骤**:
```bash
# 1. 检查AI服务配置
grep -r "zhipu" runtime/conf/MoquiDevConf.xml

# 2. 测试AI API连接
curl -H "Authorization: Bearer <API_KEY>" \
     "https://open.bigmodel.cn/api/paas/v4/chat/completions"

# 3. 检查文件上传功能
curl -X POST -F "file=@test.jpg" "http://localhost:8080/rest/s1/mcp/upload"
```

**解决方案**: 确保AI API密钥配置正确，文件上传路径可访问

## Vue3 + Quasar2 前端问题

### 组件渲染问题

**症状**: Vue组件不显示或显示异常

**诊断步骤**:
```bash
# 1. 检查浏览器控制台错误
# 2. 验证WebrootVue.qvt.js配置
# 3. 执行Chrome MCP验证
/tmp/chrome_mcp_auth_proxy.sh
```

**解决方案**: 
1. 检查WebrootVue.qvt.js配置
2. 验证Quasar插件加载
3. 执行Chrome MCP验证协议

### CSP策略问题

**症状**: 内容安全策略阻止资源加载

**解决方案**:
```xml
<!-- MoquiDevConf.xml中的CSP配置 -->
<webapp name="webroot">
    <response-header type="screen-render" name="Content-Security-Policy"
                   value="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com;"/>
</webapp>
```

## AI集成问题

### 智谱AI API调用失败

**症状**: AI功能返回错误或无响应

**诊断步骤**:
```bash
# 1. 验证API密钥
curl -H "Authorization: Bearer <API_KEY>" \
     "https://open.bigmodel.cn/api/paas/v4/models"

# 2. 检查请求格式
curl -X POST "https://open.bigmodel.cn/api/paas/v4/chat/completions" \
     -H "Authorization: Bearer <API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"model":"glm-4","messages":[{"role":"user","content":"测试"}]}'
```

**常见原因**:
- API密钥过期或无效
- 请求格式不正确
- 网络连接问题
- API配额不足

**解决方案**:
1. 更新API密钥配置
2. 检查请求参数格式
3. 验证网络连接
4. 检查API使用配额

## 性能问题

### 响应时间过长

**诊断步骤**:
```bash
# 1. 检查数据库查询性能
grep -r "SELECT.*FROM" runtime/log/

# 2. 分析API响应时间
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8080/rest/s1/example"

# 3. 检查内存使用
jstat -gc <PID>
```

**优化方案**:
1. 添加数据库索引
2. 实施查询缓存
3. 优化API响应数据
4. 调整JVM参数

## 部署问题

### Docker容器启动失败

**诊断步骤**:
```bash
# 1. 检查容器日志
docker logs <container_id>

# 2. 验证端口映射
docker port <container_id>

# 3. 检查环境变量
docker exec <container_id> env
```

**常见解决方案**:
1. 检查端口冲突
2. 验证环境变量配置
3. 确认数据卷挂载
4. 检查网络配置

## 预防措施

### 监控和告警

1. **应用监控**: 设置关键指标监控
2. **日志监控**: 配置错误日志告警
3. **性能监控**: 监控响应时间和资源使用
4. **业务监控**: 监控关键业务指标

### 定期维护

1. **配置审查**: 定期检查配置文件
2. **依赖更新**: 及时更新依赖版本
3. **安全扫描**: 定期进行安全检查
4. **备份验证**: 验证备份数据完整性

### 文档维护

1. **问题记录**: 及时记录新发现的问题
2. **解决方案更新**: 更新解决方案文档
3. **知识分享**: 定期进行技术分享
4. **培训更新**: 更新故障排查培训材料

---

**文档版本**: v1.0  
**最后更新**: 2025年1月13日  
**适用范围**: 整个Moqui AI平台项目  
**审批状态**: 待审批