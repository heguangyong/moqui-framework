# 免费图像生成 API 选项

**创建时间**: 2026-01-25  
**目的**: 解决智谱 AI 余额不足问题，提供免费替代方案

---

## 🎯 推荐方案

### 方案 1: Hugging Face Inference API ⭐⭐⭐⭐⭐ (强烈推荐)

**优势**:
- ✅ **完全免费** (有速率限制，但对开发测试足够)
- ✅ 支持 Stable Diffusion 等多个模型
- ✅ 简单的 REST API
- ✅ 无需信用卡
- ✅ 每小时几百次请求（免费用户）
- ✅ PRO 账户 $9/月可提升速率限制

**免费额度**:
- 免费用户: ~几百次请求/小时
- 月度免费积分用于实验

**API 端点**:
```
https://api-inference.huggingface.co/models/{model_id}
```

**支持的模型**:
- `stabilityai/stable-diffusion-2-1`
- `stabilityai/stable-diffusion-xl-base-1.0`
- `runwayml/stable-diffusion-v1-5`
- `CompVis/stable-diffusion-v1-4`

**使用方法**:
```bash
curl https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1 \
  -X POST \
  -H "Authorization: Bearer YOUR_HF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "A cute cat"}'
```

**获取 Token**:
1. 注册 Hugging Face: https://huggingface.co/join
2. 访问: https://huggingface.co/settings/tokens
3. 创建新 token (Read 权限即可)

---

### 方案 2: Replicate API ⭐⭐⭐⭐

**优势**:
- ✅ 新用户有免费积分
- ✅ 支持多种 Stable Diffusion 模型
- ✅ 简单易用的 API
- ✅ 按使用付费（很便宜）

**免费额度**:
- 新用户注册送免费积分
- 之后按使用付费: ~$0.0023/次

**API 端点**:
```
https://api.replicate.com/v1/predictions
```

**支持的模型**:
- `stability-ai/stable-diffusion`
- `stability-ai/sdxl`
- 其他社区模型

**使用方法**:
```bash
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Token YOUR_REPLICATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "MODEL_VERSION",
    "input": {"prompt": "A cute cat"}
  }'
```

---

### 方案 3: Stability AI API ⭐⭐⭐

**优势**:
- ✅ 官方 Stable Diffusion API
- ✅ 新用户有免费积分
- ✅ 高质量输出

**免费额度**:
- 新用户注册送 $25 积分
- 之后按使用付费

**API 端点**:
```
https://api.stability.ai/v1/generation/{engine_id}/text-to-image
```

---

### 方案 4: 本地部署 Stable Diffusion ⭐⭐⭐⭐

**优势**:
- ✅ 完全免费
- ✅ 无限制使用
- ✅ 数据隐私

**劣势**:
- ❌ 需要 GPU (至少 6GB VRAM)
- ❌ 需要本地部署
- ❌ 速度较慢（无 GPU 时）

**实现方式**:
- 使用 Automatic1111 WebUI
- 使用 ComfyUI
- 使用 Stable Diffusion WebUI

---

## 🚀 推荐实施方案

### 立即可用: Hugging Face Inference API

**为什么选择 Hugging Face**:
1. 完全免费（有速率限制）
2. 无需信用卡
3. 简单的 REST API
4. 支持多个 Stable Diffusion 模型
5. 对开发测试完全够用

**实施步骤**:

#### 1. 注册并获取 Token

```bash
# 1. 访问 https://huggingface.co/join 注册
# 2. 访问 https://huggingface.co/settings/tokens
# 3. 创建新 token (Read 权限)
```

#### 2. 测试 API

```bash
curl https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1 \
  -X POST \
  -H "Authorization: Bearer YOUR_HF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "A cute anime cat, high quality, detailed"}' \
  --output test-image.png
```

#### 3. 集成到系统

我会创建一个新的服务文件，支持多个图像生成提供商：
- Hugging Face (免费)
- 智谱 CogView (付费)
- Replicate (付费)
- Stability AI (付费)

---

## 📊 成本对比

| 服务商 | 免费额度 | 付费价格 | 推荐度 |
|--------|---------|---------|--------|
| **Hugging Face** | 几百次/小时 | $9/月 (PRO) | ⭐⭐⭐⭐⭐ |
| Replicate | 注册送积分 | $0.0023/次 | ⭐⭐⭐⭐ |
| Stability AI | $25 积分 | 按使用付费 | ⭐⭐⭐ |
| 智谱 CogView | 无 | 按使用付费 | ⭐⭐⭐ |
| 本地部署 | 无限 | 硬件成本 | ⭐⭐⭐⭐ |

---

## 🔧 技术实现

### 多服务商架构

```
McpImageGenerationServices.xml
├── generate#Image (统一接口)
│   ├── provider: "huggingface" (默认)
│   ├── provider: "cogview"
│   ├── provider: "replicate"
│   └── provider: "stability"
└── 自动降级策略
    ├── 优先使用免费服务
    ├── 失败时切换到备用服务
    └── 记录使用统计
```

### 配置示例

```sql
-- Hugging Face Token
INSERT INTO MCP_SYSTEM_CONFIG (
    CONFIG_KEY, CONFIG_VALUE, CONFIG_TYPE, CATEGORY
) VALUES (
    'ai.huggingface.token', 'YOUR_HF_TOKEN', 'STRING', 'AI'
);

-- 默认提供商
INSERT INTO MCP_SYSTEM_CONFIG (
    CONFIG_KEY, CONFIG_VALUE, CONFIG_TYPE, CATEGORY
) VALUES (
    'ai.image.provider', 'huggingface', 'STRING', 'AI'
);

-- 降级策略
INSERT INTO MCP_SYSTEM_CONFIG (
    CONFIG_KEY, CONFIG_VALUE, CONFIG_TYPE, CATEGORY
) VALUES (
    'ai.image.fallback', 'huggingface,cogview,replicate', 'STRING', 'AI'
);
```

---

## 📝 下一步行动

### 立即执行

1. **注册 Hugging Face 账户**
   - 访问: https://huggingface.co/join
   - 创建账户（免费）

2. **获取 API Token**
   - 访问: https://huggingface.co/settings/tokens
   - 创建新 token (Read 权限)

3. **测试 API**
   ```bash
   curl https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1 \
     -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"inputs": "test"}' \
     --output test.png
   ```

4. **集成到系统**
   - 我会实现多服务商支持
   - 配置 Hugging Face 为默认提供商
   - 保留智谱 CogView 作为备用

---

## 🎯 预期效果

**实施后**:
- ✅ 可以免费生成图像（每小时几百次）
- ✅ 无需信用卡或充值
- ✅ 支持多个服务商
- ✅ 自动降级策略
- ✅ 完整的错误处理

**对于开发测试**:
- 完全够用
- 无成本
- 快速迭代

**对于生产环境**:
- 可以升级到 PRO ($9/月)
- 或者充值智谱 AI
- 或者使用 Replicate (按使用付费)

---

**文档版本**: v1.0  
**创建时间**: 2026-01-25 01:30  
**推荐方案**: Hugging Face Inference API (免费)
