# 手动配置 API Key 指南

**API Key**: `7b547bec7286432186eb77a477e10c33.XtHQWZS5PoGKAkg0`

---

## 方法 1: 通过 H2 控制台 (推荐)

### 步骤 1: 确保 Moqui 正在运行

```bash
./start-applications.sh
```

等待启动完成（约30秒）

### 步骤 2: 访问 H2 控制台

在浏览器中打开: http://localhost:8080/h2

### 步骤 3: 连接数据库

- **JDBC URL**: `jdbc:h2:./runtime/db/h2/moqui`
- **User Name**: `sa`
- **Password**: (留空)

点击 "Connect"

### 步骤 4: 执行 SQL

在 SQL 输入框中粘贴以下 SQL 并执行:

```sql
-- 删除旧配置(如果存在)
DELETE FROM MCP_SYSTEM_CONFIG WHERE CONFIG_KEY = 'ai.api.key';

-- 插入新配置
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
    '7b547bec7286432186eb77a477e10c33.XtHQWZS5PoGKAkg0',
    'STRING',
    'AI',
    'GLM-4 API Key',
    'Y'
);

-- 验证插入
SELECT * FROM MCP_SYSTEM_CONFIG WHERE CONFIG_KEY = 'ai.api.key';
```

### 步骤 5: 验证配置

运行测试脚本:

```bash
cd .kiro/specs/09-01-novel-to-anime-completion/scripts
bash check-api-key.sh
```

预期输出应该显示图像生成成功。

---

## 方法 2: 通过 REST API

### 步骤 1: 登录

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"moqui"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### 步骤 2: 调用配置服务

```bash
curl -X POST http://localhost:8080/rest/s1/mcp/config/set-system-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "configKey": "ai.api.key",
    "configValue": "7b547bec7286432186eb77a477e10c33.XtHQWZS5PoGKAkg0",
    "configType": "STRING",
    "category": "AI",
    "description": "GLM-4 API Key"
  }'
```

### 步骤 3: 验证

```bash
curl -X GET "http://localhost:8080/rest/s1/mcp/config/get-system-config?configKey=ai.api.key" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 方法 3: 使用自动化脚本

如果 Moqui 已经正常运行，可以使用自动化脚本:

```bash
cd .kiro/specs/09-01-novel-to-anime-completion/scripts
bash setup-api-key.sh
```

这个脚本会：
1. 检查 Moqui 状态
2. 登录系统
3. 设置 API Key
4. 验证配置
5. 测试图像生成

---

## 验证成功的标志

配置成功后，运行测试应该看到:

```json
{
  "success": true,
  "imageUrl": "https://...",
  "model": "cogview-3",
  "revisedPrompt": "..."
}
```

而不是:

```json
{
  "success": false,
  "error": "AI API Key not configured"
}
```

---

## 故障排除

### 问题 1: H2 控制台无法访问

**解决方案**: 
- 确认 Moqui 正在运行: `ps aux | grep moqui`
- 检查端口 8080: `lsof -i:8080`
- 查看日志: `tail -f runtime/log/moqui.log`

### 问题 2: SQL 执行失败

**可能原因**:
- 表 `MCP_SYSTEM_CONFIG` 不存在
- 需要先创建表结构

**解决方案**:
检查实体定义文件是否存在:
```bash
find runtime/component/moqui-mcp/entity -name "*.xml"
```

### 问题 3: REST API 返回 503

**原因**: Moqui 还在启动中

**解决方案**: 等待 1-2 分钟，然后重试

### 问题 4: 图像生成仍然失败

**检查清单**:
- [ ] API Key 是否正确插入数据库
- [ ] configKey 是否为 `ai.api.key`
- [ ] configValue 是否为完整的 API Key
- [ ] 网络是否可以访问 `https://open.bigmodel.cn`

---

## 下一步

配置完成后，继续 Phase 3 测试:

```bash
cd .kiro/specs/09-01-novel-to-anime-completion/scripts
bash test-image-generation-v2.sh
```

这将测试完整的图像生成流程。
