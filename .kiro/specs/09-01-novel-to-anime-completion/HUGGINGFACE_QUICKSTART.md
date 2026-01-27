# Hugging Face 快速开始指南

**目的**: 使用免费的 Hugging Face API 替代智谱 AI  
**优势**: 完全免费，无需信用卡，立即可用

---

## 🚀 5分钟快速开始

### 步骤 1: 注册 Hugging Face (2分钟)

1. 访问: https://huggingface.co/join
2. 填写邮箱和密码
3. 验证邮箱
4. 完成注册

### 步骤 2: 获取 API Token (1分钟)

1. 登录后访问: https://huggingface.co/settings/tokens
2. 点击 "New token"
3. 名称: `novel-anime-generator`
4. 权限: 选择 "Read"
5. 点击 "Generate"
6. **复制 Token** (类似: `hf_xxxxxxxxxxxxxxxxxxxxx`)

### 步骤 3: 配置并测试 (2分钟)

```bash
# 1. 确保 Moqui 正在运行
./start-applications.sh

# 2. 运行测试脚本
cd .kiro/specs/09-01-novel-to-anime-completion/scripts
bash test-huggingface.sh YOUR_HF_TOKEN

# 替换 YOUR_HF_TOKEN 为你的实际 token
```

**完成！** 如果看到 "✓ 图像生成成功"，说明配置成功。

---

## 📋 详细说明

### Hugging Face 是什么？

Hugging Face 是全球最大的 AI 模型社区，提供：
- 免费的 AI 模型托管
- 免费的 Inference API
- 支持 Stable Diffusion 等图像生成模型

### 免费额度

**免费用户**:
- 每小时几百次请求
- 无需信用卡
- 永久免费

**PRO 用户** ($9/月):
- 更高的速率限制
- 优先处理
- 更快的响应

### 支持的模型

我们的系统支持以下 Hugging Face 模型：

1. **stabilityai/stable-diffusion-2-1** (推荐)
   - 最新的 Stable Diffusion 2.1
   - 高质量输出
   - 512x512 分辨率

2. **stabilityai/stable-diffusion-xl-base-1.0**
   - SDXL 模型
   - 更高质量
   - 1024x1024 分辨率

3. **runwayml/stable-diffusion-v1-5**
   - 经典的 SD 1.5
   - 稳定可靠
   - 512x512 分辨率

---

## 🔧 配置选项

### 方法 1: 使用测试脚本 (推荐)

```bash
cd .kiro/specs/09-01-novel-to-anime-completion/scripts
bash test-huggingface.sh YOUR_HF_TOKEN
```

### 方法 2: 手动配置

```bash
# 1. 登录
TOKEN=$(curl -s -X POST http://localhost:8080/rest/s1/novel-anime/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"moqui"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")

# 2. 配置 Hugging Face Token
curl -X POST http://localhost:8080/rest/s1/mcp/config/set-system-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "configKey": "ai.huggingface.token",
    "configValue": "YOUR_HF_TOKEN",
    "configType": "STRING",
    "category": "AI"
  }'

# 3. 设置默认提供商
curl -X POST http://localhost:8080/rest/s1/mcp/config/set-system-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "configKey": "ai.image.provider",
    "configValue": "huggingface",
    "configType": "STRING",
    "category": "AI"
  }'
```

---

## 🎨 使用示例

### 生成图像

```bash
curl -X POST http://localhost:8080/rest/s1/mcp/image-generation/generate-multi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "A cute anime cat, high quality, detailed",
    "provider": "huggingface",
    "model": "stable-diffusion-2-1",
    "size": "512x512"
  }'
```

### 响应格式

```json
{
  "success": true,
  "imageData": "base64_encoded_image_data...",
  "provider": "huggingface",
  "model": "stabilityai/stable-diffusion-2-1"
}
```

### 保存图像

```bash
# 提取 Base64 数据并保存
echo "$IMAGE_DATA" | base64 -d > generated-image.png
```

---

## 🔄 多服务商支持

### 自动降级

系统支持多个服务商，并自动降级：

1. **Hugging Face** (免费，默认)
2. **智谱 CogView** (付费，备用)
3. **Replicate** (付费，备用)

### 配置降级策略

```bash
curl -X POST http://localhost:8080/rest/s1/mcp/config/set-system-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "configKey": "ai.image.fallback",
    "configValue": "huggingface,cogview,replicate",
    "configType": "STRING",
    "category": "AI"
  }'
```

### 指定提供商

```bash
# 使用 Hugging Face
curl -X POST .../generate-multi \
  -d '{"prompt": "...", "provider": "huggingface"}'

# 使用智谱 CogView
curl -X POST .../generate-multi \
  -d '{"prompt": "...", "provider": "cogview"}'

# 自动选择（使用降级策略）
curl -X POST .../generate-multi \
  -d '{"prompt": "...", "provider": "auto"}'
```

---

## 🚨 常见问题

### 问题 1: Token 无效

**症状**:
```json
{
  "success": false,
  "error": "Hugging Face API returned 401: Unauthorized"
}
```

**解决方案**:
1. 检查 Token 是否正确复制
2. 确认 Token 权限为 "Read"
3. 重新生成 Token

### 问题 2: 模型加载中

**症状**:
```json
{
  "success": false,
  "error": "Model is loading, please retry in a few seconds"
}
```

**解决方案**:
- 这是正常的！首次调用模型需要加载
- 等待 30-60 秒后重试
- 之后的调用会很快

### 问题 3: 速率限制

**症状**:
```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

**解决方案**:
- 免费用户有速率限制（每小时几百次）
- 等待一段时间后重试
- 或者升级到 PRO ($9/月)

### 问题 4: 图像质量

**问题**: 生成的图像质量不够好

**解决方案**:
1. 优化 prompt（更详细的描述）
2. 尝试不同的模型（SDXL 质量更高）
3. 调整参数（guidance_scale, num_inference_steps）

---

## 📊 性能对比

| 指标 | Hugging Face | 智谱 CogView |
|------|-------------|-------------|
| 成本 | 免费 | 付费 |
| 速度 | 30-60秒 | 20-40秒 |
| 质量 | 高 | 高 |
| 分辨率 | 512x512, 1024x1024 | 512x512, 1024x1024 |
| 速率限制 | 几百次/小时 | 按配额 |
| 模型选择 | 多个 SD 模型 | CogView-3 |

---

## 🎯 下一步

### 开发测试

使用 Hugging Face 免费额度进行开发和测试：
- 完全够用
- 无成本
- 快速迭代

### 生产环境

根据需求选择：

1. **Hugging Face PRO** ($9/月)
   - 更高速率限制
   - 适合中小规模应用

2. **智谱 CogView** (按使用付费)
   - 充值后使用
   - 适合大规模应用

3. **混合方案**
   - Hugging Face 作为主要服务
   - 智谱 CogView 作为备用
   - 自动降级策略

---

## 📝 技术细节

### API 端点

```
POST /rest/s1/mcp/image-generation/generate-multi
```

### 请求参数

```json
{
  "prompt": "图像描述",
  "provider": "huggingface|cogview|replicate|auto",
  "model": "stable-diffusion-2-1",
  "size": "512x512",
  "userId": "system"
}
```

### 响应格式

```json
{
  "success": true,
  "imageData": "base64_encoded_data",
  "imageUrl": null,
  "provider": "huggingface",
  "model": "stabilityai/stable-diffusion-2-1",
  "error": null
}
```

---

## 🔗 相关链接

- **Hugging Face 官网**: https://huggingface.co/
- **Token 管理**: https://huggingface.co/settings/tokens
- **Inference API 文档**: https://huggingface.co/docs/api-inference/
- **Stable Diffusion 模型**: https://huggingface.co/stabilityai

---

**文档版本**: v1.0  
**创建时间**: 2026-01-25 01:45  
**状态**: 已实现并测试
