# GLM-4 API Key 配置指南

**目的**: 配置智谱 AI API Key 以启用图像生成功能

---

## 📋 前置条件

1. 已注册智谱 AI 账号: https://open.bigmodel.cn/
2. 已获取 API Key
3. Moqui 服务正在运行

---

## 🔧 配置方法

### 方法 1: 通过数据库直接插入 (推荐用于开发测试)

**步骤 1**: 连接到 H2 数据库

```bash
# Moqui 默认使用 H2 数据库
# 数据库文件位置: runtime/db/h2/moqui.mv.db
```

**步骤 2**: 插入系统配置

```sql
-- 插入 API Key 配置
INSERT INTO MCP_SYSTEM_CONFIG (
    CONFIG_ID,
    CONFIG_KEY,
    CONFIG_VALUE,
    CONFIG_TYPE,
    CATEGORY,
    DESCRIPTION,
    IS_USER_CONFIGURABLE
) VALUES (
    'AI_API_KEY',
    'ai.api.key',
    'YOUR_GLM4_API_KEY_HERE',  -- 替换为你的实际 API Key
    'STRING',
    'AI',
    'GLM-4 API Key',
    'Y'
);

-- 插入 API Base URL 配置(可选,默认已设置)
INSERT INTO MCP_SYSTEM_CONFIG (
    CONFIG_ID,
    CONFIG_KEY,
    CONFIG_VALUE,
    CONFIG_TYPE,
    CATEGORY,
    DESCRIPTION,
    IS_USER_CONFIGURABLE
) VALUES (
    'AI_API_BASE',
    'ai.api.base',
    'https://open.bigmodel.cn/api/paas/v4',
    'STRING',
    'AI',
    'GLM-4 API Base URL',
    'Y'
);

-- 插入图像模型配置(可选)
INSERT INTO MCP_SYSTEM_CONFIG (
    CONFIG_ID,
    CONFIG_KEY,
    CONFIG_VALUE,
    CONFIG_TYPE,
    CATEGORY,
    DESCRIPTION,
    IS_USER_CONFIGURABLE
) VALUES (
    'AI_IMAGE_MODEL',
    'ai.image.model',
    'cogview-3',
    'STRING',
    'AI',
    '图像生成模型',
    'Y'
);
```

---

### 方法 2: 通过 REST API 配置

**步骤 1**: 登录获取 token

```bash
curl -X POST http://localhost:8080/rest/s1/novel-anime/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "password": "moqui"
  }'
```

**步骤 2**: 使用 Moqui 服务调用插入配置

```bash
# 需要创建一个配置管理服务
# 或者直接通过数据库操作
```

---

### 方法 3: 通过 Moqui 控制台 (推荐用于生产环境)

**步骤 1**: 访问 Moqui 控制台

```
http://localhost:8080/apps/tools
```

**步骤 2**: 导航到 Entity Data

```
Tools → Entity → Data Find
```

**步骤 3**: 查找并编辑配置

- Entity Name: `mcp.system.McpSystemConfig`
- 查找或创建 `ai.api.key` 配置项
- 设置 `configValue` 为你的 API Key

---

## 🔍 验证配置

### 方法 1: 通过测试脚本验证

```bash
cd .kiro/specs/09-01-novel-to-anime-completion/scripts
./test-image-generation.sh
```

**预期结果**:
- ✅ 登录成功
- ✅ 项目创建成功
- ✅ 角色创建成功
- ✅ 图像生成成功
- ✅ 返回 Asset ID 和图像路径

---

### 方法 2: 通过健康检查验证

```bash
curl -X GET http://localhost:8080/rest/s1/mcp/image-generation/health
```

**预期响应**:
```json
{
  "status": "healthy",
  "model": "cogview-3",
  "apiAvailable": true,
  "lastCheck": "2026-01-24T12:00:00Z"
}
```

---

### 方法 3: 通过直接 API 调用验证

```bash
# 1. 登录
TOKEN=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"moqui"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# 2. 测试图像生成
curl -X POST http://localhost:8080/rest/s1/mcp/image-generation/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "A simple test image of a cat",
    "model": "cogview-3",
    "size": "512x512"
  }'
```

**预期响应**:
```json
{
  "success": true,
  "imageUrl": "https://...",
  "model": "cogview-3",
  "revisedPrompt": "..."
}
```

---

## 🚨 常见问题

### 问题 1: API Key 无效

**症状**:
```json
{
  "success": false,
  "error": "API returned 401: Unauthorized"
}
```

**解决方案**:
1. 检查 API Key 是否正确
2. 确认 API Key 是否已激活
3. 检查 API Key 是否有足够的配额

---

### 问题 2: 网络连接失败

**症状**:
```json
{
  "success": false,
  "error": "Failed after 3 retries: Connection timeout"
}
```

**解决方案**:
1. 检查网络连接
2. 确认可以访问 `https://open.bigmodel.cn`
3. 检查防火墙设置
4. 尝试使用代理

---

### 问题 3: 配置未生效

**症状**:
```json
{
  "success": false,
  "error": "AI API Key not configured"
}
```

**解决方案**:
1. 确认配置已插入数据库
2. 重启 Moqui 服务
3. 检查配置表名称是否正确: `mcp.system.McpSystemConfig`
4. 检查 configKey 是否为 `ai.api.key`

---

### 问题 4: 图像生成超时

**症状**:
```json
{
  "success": false,
  "error": "Read timeout"
}
```

**解决方案**:
1. 图像生成通常需要 30-60 秒
2. 当前超时设置为 120 秒
3. 如果仍然超时,可能是 API 服务问题
4. 稍后重试

---

## 📊 配额管理

### 查看 API 使用情况

访问智谱 AI 控制台:
```
https://open.bigmodel.cn/usercenter/apikeys
```

### 建议配额设置

**开发测试**:
- 每日限额: 100 次
- 单次成本: 约 0.1 元

**生产环境**:
- 根据实际使用量设置
- 建议设置告警阈值
- 实现成本统计功能

---

## 🔐 安全建议

### 1. 不要在代码中硬编码 API Key

❌ **错误做法**:
```groovy
def apiKey = "sk-xxxxxxxxxxxxx"
```

✅ **正确做法**:
```groovy
def apiKey = getAiApiKey(userId)
```

### 2. 使用环境变量(可选)

```bash
export GLM4_API_KEY="your-api-key"
```

### 3. 定期轮换 API Key

- 建议每 3-6 个月轮换一次
- 发现泄露立即轮换

### 4. 限制 API 调用频率

- 实现速率限制
- 防止滥用

---

## ✅ 配置检查清单

配置完成后,请确认:

- [ ] API Key 已插入到 `mcp.system.McpSystemConfig` 表
- [ ] configKey 为 `ai.api.key`
- [ ] configValue 为有效的 API Key
- [ ] Moqui 服务已重启(如果需要)
- [ ] 健康检查返回 `healthy`
- [ ] 测试脚本执行成功
- [ ] 可以生成测试图像

---

## 📞 获取帮助

### 智谱 AI 支持

- 官网: https://open.bigmodel.cn/
- 文档: https://open.bigmodel.cn/dev/api
- 支持: support@zhipuai.cn

### 项目支持

- 查看日志: `runtime/log/moqui.log`
- 搜索错误: `grep "Image Generation" runtime/log/moqui.log`
- 查看 API 调用: `grep "CogView API" runtime/log/moqui.log`

---

**文档版本**: v1.0  
**最后更新**: 2026-01-24  
**下一步**: 运行测试脚本验证配置

