# Pollinations.AI - 真正免费的图像生成方案

**时间**: 2026-01-25 02:10  
**状态**: ✅ 推荐方案  
**特点**: 完全免费、无需注册、无需 API Key

---

## 🎯 Pollinations.AI 简介

**Pollinations.AI** 是一个完全开源、完全免费的 AI 图像生成服务：

- ✅ **完全免费** - 无任何费用
- ✅ **无需注册** - 不需要账号
- ✅ **无需 API Key** - 直接调用
- ✅ **无速率限制** - 合理使用即可
- ✅ **支持多个模型** - Flux, Stable Diffusion 等
- ✅ **简单易用** - 一个 URL 即可

---

## 🚀 API 使用方法

### 方法 1: 直接 URL (最简单)

```bash
# 基础用法
https://image.pollinations.ai/prompt/{your_prompt}

# 示例
https://image.pollinations.ai/prompt/a%20cute%20anime%20cat

# 带参数
https://image.pollinations.ai/prompt/{prompt}?width=1024&height=1024&model=flux&seed=42
```

### 方法 2: POST 请求

```bash
curl -X POST "https://image.pollinations.ai/prompt/a%20cute%20anime%20cat" \
  -H "Content-Type: application/json" \
  -d '{
    "width": 1024,
    "height": 1024,
    "model": "flux",
    "seed": 42,
    "nologo": true,
    "enhance": true
  }'
```

---

## 📋 支持的参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | Integer | 1024 | 图像宽度 (64-2048) |
| `height` | Integer | 1024 | 图像高度 (64-2048) |
| `model` | String | flux | 模型: flux, flux-realism, flux-anime, flux-3d, turbo |
| `seed` | Integer | random | 随机种子 (可重现) |
| `nologo` | Boolean | false | 移除水印 |
| `enhance` | Boolean | false | 增强提示词 |
| `private` | Boolean | false | 私密模式 |

---

## 🎨 支持的模型

1. **flux** (默认) - 高质量通用模型
2. **flux-realism** - 写实风格
3. **flux-anime** - 动漫风格 (最适合我们!)
4. **flux-3d** - 3D 风格
5. **turbo** - 快速生成

---

## 💻 实现示例

### Groovy 实现 (Moqui)

```groovy
def generateWithPollinations(String prompt, String width, String height) {
    try {
        // URL 编码 prompt
        def encodedPrompt = URLEncoder.encode(prompt, "UTF-8")
        
        // 构建 URL
        def apiUrl = "https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux-anime&nologo=true&enhance=true"
        
        ec.logger.info("Calling Pollinations API: ${apiUrl}")
        
        // 直接获取图像
        def url = new URL(apiUrl)
        def connection = url.openConnection()
        connection.setRequestMethod("GET")
        connection.setConnectTimeout(30000)
        connection.setReadTimeout(120000)
        
        // 读取图像数据
        def responseCode = connection.getResponseCode()
        
        if (responseCode == 200) {
            def inputStream = connection.getInputStream()
            def imageBytes = inputStream.bytes
            inputStream.close()
            
            // 转换为 Base64
            def imageBase64 = imageBytes.encodeBase64().toString()
            
            return [
                success: true,
                imageData: imageBase64,
                imageUrl: apiUrl,  // 可以直接使用这个 URL
                model: "flux-anime"
            ]
        } else {
            return [
                success: false,
                error: "Pollinations API returned ${responseCode}"
            ]
        }
        
    } catch (Exception e) {
        return [success: false, error: e.message]
    }
}
```

---

## ✅ 优势对比

| 特性 | Pollinations | Hugging Face | Replicate | 智谱 CogView |
|------|--------------|--------------|-----------|--------------|
| **完全免费** | ✅ | ❌ (已弃用) | ❌ ($25后付费) | ❌ (付费) |
| **无需注册** | ✅ | ❌ | ❌ | ❌ |
| **无需 API Key** | ✅ | ❌ | ❌ | ❌ |
| **无速率限制** | ✅ | - | ❌ | ❌ |
| **动漫风格** | ✅ | - | ✅ | ✅ |
| **速度** | ⭐⭐⭐⭐ | - | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **质量** | ⭐⭐⭐⭐ | - | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 为什么选择 Pollinations

### 1. 真正免费
- 无任何费用
- 无需信用卡
- 无隐藏成本

### 2. 零配置
- 不需要注册
- 不需要 API Key
- 不需要任何设置

### 3. 简单易用
- 一个 URL 即可
- 支持 GET 和 POST
- 返回标准图像格式

### 4. 适合测试
- 完美用于开发测试
- 无限制使用
- 快速迭代

### 5. 动漫风格
- 专门的 `flux-anime` 模型
- 非常适合小说转动漫项目
- 质量优秀

---

## 📝 实施计划

### Step 1: 创建 Pollinations 服务 (15分钟)

创建 `McpPollinationsServices.xml`:
```xml
<service verb="generate" noun="ImageWithPollinations">
    <!-- 实现 Pollinations API 调用 -->
</service>
```

### Step 2: 更新多服务商架构 (5分钟)

在 `McpMultiProviderImageServices.xml` 中添加:
```groovy
case "pollinations":
    result = generateWithPollinations(prompt, size, userId)
    break
```

### Step 3: 设置为默认提供商 (1分钟)

```sql
UPDATE MCP_SYSTEM_CONFIG 
SET CONFIG_VALUE = 'pollinations' 
WHERE CONFIG_KEY = 'ai.image.provider';
```

### Step 4: 测试 (5分钟)

```bash
curl -X POST "http://localhost:8080/rest/s1/mcp/image-generation/generate-multi" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "a cute anime cat",
    "provider": "pollinations",
    "size": "1024x1024"
  }'
```

**总计时间**: 26分钟

---

## 🎉 测试示例

### 直接测试 Pollinations API

```bash
# 生成一只可爱的动漫猫
curl "https://image.pollinations.ai/prompt/a%20cute%20anime%20cat%20kawaii%20style?model=flux-anime&width=512&height=512&nologo=true" \
  --output test-cat.png

# 查看图像
open test-cat.png  # macOS
```

### 在浏览器中测试

直接访问:
```
https://image.pollinations.ai/prompt/a cute anime cat kawaii style?model=flux-anime&width=512&height=512&nologo=true
```

---

## 💡 使用建议

### 开发阶段
- ✅ 使用 Pollinations (完全免费)
- ✅ 使用 `flux-anime` 模型
- ✅ 设置 `nologo=true` 移除水印
- ✅ 设置 `enhance=true` 增强提示词

### 生产阶段
- 小规模: 继续使用 Pollinations
- 中规模: 考虑 Replicate 或智谱
- 大规模: 本地部署或专用服务

---

## 🚀 立即开始

我现在就可以实现 Pollinations 集成！

**预计时间**: 26分钟

**步骤**:
1. 创建 `McpPollinationsServices.xml`
2. 更新多服务商架构
3. 测试图像生成
4. 设置为默认提供商

**完成后**:
- ✅ 完全免费的图像生成
- ✅ 无需任何配置
- ✅ 立即可用
- ✅ 适合动漫风格

---

## 📚 参考资源

- **官网**: https://pollinations.ai/
- **文档**: https://image.pollinations.ai/
- **GitHub**: https://github.com/pollinations/pollinations
- **示例**: https://pollinations.ai/create

---

**文档版本**: v1.0  
**创建时间**: 2026-01-25 02:10  
**推荐度**: ⭐⭐⭐⭐⭐  
**下一步**: 立即实施！

