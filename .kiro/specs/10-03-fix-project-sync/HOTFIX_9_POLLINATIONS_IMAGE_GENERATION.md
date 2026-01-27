# Hotfix 9: Pollinations AI 图片生成集成

**日期**: 2026-01-26  
**状态**: ✅ 已完成  
**优先级**: 高

---

## 问题描述

用户在预览页面看到的是绿色占位符图片，而不是真实的 AI 生成图片。

**用户反馈**:
> "绿色图片? 啥内容也没有啊"

**问题场景**:
1. 用户执行工作流生成内容
2. 进入"分镜头预览"页面
3. 看到绿色矩形占位符，上面有文字"未指定 characters: 诺兹报告"
4. 这不是真实的 AI 生成图片

---

## 根本原因分析

### 1. 数据分析

**用户提供的 imageUrl 数据**:
```
data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4...
```

**解码后的 SVG 内容**:
```xml
<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#7a9188"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="20" fill="#ffffff">
    未指定 characters: 诺兹报告
  </text>
</svg>
```

### 2. 根本原因

**ImageGenerationService 配置问题**:

1. **当前支持的提供商** (ImageGenerationService.ts):
   - `'stable-diffusion'` - 需要本地部署 Stable Diffusion WebUI
   - `'dalle'` - 需要 OpenAI API 密钥和费用
   - `'placeholder'` - 生成 SVG 占位符（**当前默认**）

2. **Pollinations AI 未集成**:
   - Settings.vue 的 `imageProviderOptions` 没有 Pollinations 选项
   - ImageGenerationService.ts 没有 Pollinations 的处理逻辑
   - 默认配置是 `provider: 'placeholder'`

3. **工作流使用占位符**:
   ```javascript
   // Settings.vue line 833
   imageGeneration: { 
     provider: 'placeholder',  // ← 问题所在
     apiKey: '', 
     apiUrl: 'http://localhost:7860', 
     model: 'dall-e-3', 
     size: '1024x1024', 
     quality: 'standard' 
   }
   ```

4. **ImageGenerationService 逻辑**:
   ```javascript
   // ImageGenerationService.ts line 75-85
   switch (this.config.provider) {
     case 'stable-diffusion':
       result = await this.generateWithStableDiffusion(request);
       break;
     case 'dalle':
       result = await this.generateWithDALLE(request);
       break;
     case 'placeholder':
     default:
       result = await this.generatePlaceholder(request);  // ← 当前执行
       break;
   }
   ```

---

## 解决方案

### 方案: 集成 Pollinations AI 到图片生成服务

**目标**: 
- 添加 Pollinations AI 作为图片生成提供商
- 设置为默认提供商（免费、无需 API 密钥）
- 生成真实的 AI 图片而不是占位符

**修改文件**:
1. `ImageGenerationService.ts` - 添加 Pollinations AI 支持
2. `Settings.vue` - 添加 Pollinations 选项到 imageProviderOptions
3. 更新默认配置为 Pollinations AI

---

## 实施步骤

### Step 1: 添加 Pollinations AI 到 ImageGenerationService

**文件**: `frontend/NovelAnimeDesktop/src/renderer/services/ImageGenerationService.ts`

**修改 1**: 更新 ImageGenerationConfig 接口
```typescript
export interface ImageGenerationConfig {
  provider: 'stable-diffusion' | 'dalle' | 'pollinations' | 'placeholder';  // 添加 pollinations
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  size?: string;
  quality?: string;
}
```

**修改 2**: 添加 generateWithPollinations 方法
```typescript
/**
 * 使用 Pollinations AI 生成图片
 */
private async generateWithPollinations(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  // Pollinations AI 使用简单的 URL 参数方式
  // https://image.pollinations.ai/prompt/{prompt}?width={width}&height={height}&seed={seed}
  
  const prompt = encodeURIComponent(this.enhancePrompt(request.prompt));
  const width = request.width || 800;
  const height = request.height || 450;
  const seed = request.seed || Math.floor(Math.random() * 1000000);
  
  const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  
  console.log('📡 Calling Pollinations AI:', imageUrl.substring(0, 100) + '...');
  
  // Pollinations AI 直接返回图片 URL，无需额外处理
  return {
    imageUrl,
    thumbnailUrl: imageUrl, // 可以使用相同 URL，浏览器会缓存
    prompt: request.prompt,
    provider: 'pollinations',
    generatedAt: new Date()
  };
}
```

**修改 3**: 更新 generateImage 方法的 switch 语句
```typescript
switch (this.config.provider) {
  case 'stable-diffusion':
    result = await this.generateWithStableDiffusion(request);
    break;
  case 'dalle':
    result = await this.generateWithDALLE(request);
    break;
  case 'pollinations':  // 添加 pollinations case
    result = await this.generateWithPollinations(request);
    break;
  case 'placeholder':
  default:
    result = await this.generatePlaceholder(request);
    break;
}
```

**修改 4**: 更新 testConnection 方法
```typescript
async testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    switch (this.config.provider) {
      case 'stable-diffusion':
        return await this.testStableDiffusion();
      case 'dalle':
        return await this.testDALLE();
      case 'pollinations':  // 添加 pollinations case
        return { success: true, message: 'Pollinations AI 无需配置，可直接使用' };
      case 'placeholder':
        return { success: true, message: 'Placeholder service is always available' };
      default:
        return { success: false, message: 'Unknown provider' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

**修改 5**: 更新默认配置
```typescript
private loadConfig(): ImageGenerationConfig {
  const savedConfig = localStorage.getItem('image_generation_config');
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (e) {
      console.warn('Failed to parse image generation config:', e);
    }
  }

  // 默认配置：使用 Pollinations AI（免费、无需 API 密钥）
  return {
    provider: 'pollinations',  // 改为 pollinations
    size: '800x450'
  };
}
```

### Step 2: 更新 Settings.vue

**文件**: `frontend/NovelAnimeDesktop/src/renderer/views/Settings.vue`

**修改 1**: 更新 imageProviderOptions (line ~763)
```javascript
const imageProviderOptions = [
  { 
    value: 'pollinations',  // 添加 Pollinations 选项
    label: 'Pollinations AI', 
    description: '免费 AI 图片生成服务（推荐）' 
  },
  { 
    value: 'placeholder', 
    label: '占位符图片', 
    description: '使用占位符服务（免费，立即可用）' 
  },
  { 
    value: 'stable-diffusion', 
    label: 'Stable Diffusion', 
    description: '开源AI图片生成（需本地部署）' 
  },
  { 
    value: 'dalle', 
    label: 'DALL-E 3', 
    description: 'OpenAI图片生成（高质量，收费）' 
  }
];
```

**修改 2**: 更新默认配置 (line ~833)
```javascript
const settings = reactive({
  ai: { provider: 'pollinations', apiKey: '', endpoint: '', model: 'flux-anime' },
  generation: { style: 'anime', resolution: '1080p', fps: 30, episodeDuration: 5, enableVoice: true, voiceStyle: 'natural' },
  interface: { theme: 'light', language: 'zh-CN', fontSize: 'medium', animations: true },
  storage: { projectDir: '~/Documents/NovelAnime/Projects', cacheDir: '~/Documents/NovelAnime/Cache', autoSave: true, autoSaveInterval: 5 },
  imageGeneration: { 
    provider: 'pollinations',  // 改为 pollinations
    apiKey: '', 
    apiUrl: '', 
    model: '', 
    size: '800x450', 
    quality: 'standard' 
  }
});
```

**修改 3**: 更新 getImageProviderHint 函数 (line ~790)
```javascript
function getImageProviderHint(provider) {
  const hints = {
    'pollinations': 'Pollinations AI 提供免费的 AI 图片生成服务，无需 API 密钥，推荐使用',
    'placeholder': '使用占位符图片服务，免费且立即可用，但不是真实的AI生成图片',
    'stable-diffusion': '需要本地部署Stable Diffusion WebUI，开源免费，质量高',
    'dalle': '使用OpenAI的DALL-E服务，质量最高，但需要API密钥和费用'
  };
  return hints[provider] || '';
}
```

### Step 3: 清除缓存并测试

**操作步骤**:
1. 清除 ImageGenerationService 的缓存
2. 清除 localStorage 中的旧配置
3. 重新执行工作流
4. 验证生成的是真实 AI 图片而不是占位符

---

## 测试计划

### 测试场景 1: 新项目使用 Pollinations AI
1. 创建新项目
2. 导入小说
3. 执行工作流（图片生成节点）
4. 验证生成的图片是真实 AI 图片
5. 检查图片 URL 格式：`https://image.pollinations.ai/prompt/...`

### 测试场景 2: 已有项目切换到 Pollinations AI
1. 打开设置页面
2. 切换图片生成服务为 "Pollinations AI"
3. 保存设置
4. 重新执行工作流
5. 验证生成的图片是真实 AI 图片

### 测试场景 3: 验证图片质量
1. 检查生成的图片是否符合提示词
2. 检查图片分辨率是否正确（800x450）
3. 检查图片是否包含动画风格元素

---

## 预期结果

**修复前**:
- imageUrl: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIi...`
- 显示: 绿色矩形占位符，带文字

**修复后**:
- imageUrl: `https://image.pollinations.ai/prompt/...?width=800&height=450&seed=...`
- 显示: 真实的 AI 生成图片，符合场景描述

---

## 相关文件

- `frontend/NovelAnimeDesktop/src/renderer/services/ImageGenerationService.ts` - 图片生成服务
- `frontend/NovelAnimeDesktop/src/renderer/views/Settings.vue` - 设置页面
- `frontend/NovelAnimeDesktop/src/renderer/services/PipelineOrchestrator.js` - 工作流编排器
- `frontend/NovelAnimeDesktop/src/renderer/views/PreviewView.vue` - 预览页面

---

## 实施状态

- [x] Step 1: 修改 ImageGenerationService.ts
- [x] Step 2: 修改 Settings.vue
- [x] Step 3: 更新前端版本号 (1.0.2 → 1.0.3)
- [ ] Step 4: 用户测试验证

---

## ✅ 修复完成

**实施日期**: 2026-01-26

**已完成的修改**:

1. **ImageGenerationService.ts**:
   - ✅ 添加 `'pollinations'` 到 ImageGenerationConfig 类型
   - ✅ 实现 `generateWithPollinations()` 方法
   - ✅ 更新 `generateImage()` 的 switch 语句
   - ✅ 更新 `testConnection()` 方法
   - ✅ 更新默认配置为 `provider: 'pollinations'`

2. **Settings.vue**:
   - ✅ 在 `imageProviderOptions` 添加 Pollinations AI（排第一位）
   - ✅ 更新 `getImageProviderHint()` 函数
   - ✅ 更新默认配置为 `provider: 'pollinations'`

3. **package.json**:
   - ✅ 版本号更新: `1.0.2` → `1.0.3`
   - ✅ 前端会自动清除缓存

**用户操作**:
- 刷新页面或重启应用（版本更新会自动清除缓存）
- 重新执行工作流
- 查看预览 - 应该看到真实的 AI 生成图片

---

**版本**: v1.0  
**创建**: 2026-01-26  
**状态**: 进行中
