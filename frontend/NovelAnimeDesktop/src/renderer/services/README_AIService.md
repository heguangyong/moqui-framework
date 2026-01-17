# AI Service 使用指南

## 概述

AI Service 提供了统一的AI服务接口，支持多个AI提供商，主要使用智谱AI GLM-4作为默认提供商。

## 功能特性

- ✅ 多AI提供商支持（智谱AI、OpenAI、Anthropic）
- ✅ API密钥安全存储（使用keytar）
- ✅ 自动重试机制（指数退避）
- ✅ 错误处理和恢复
- ✅ 请求统计和监控
- ✅ 小说场景分析
- ✅ 角色识别
- ✅ 降级方案支持

## 快速开始

### 1. 配置API密钥

```typescript
import { aiService } from '@/services/AIService'

// 设置智谱AI API密钥
const success = await aiService.setApiKey('your-zhipu-api-key')
if (success) {
  console.log('API密钥配置成功')
}
```

### 2. 检查服务状态

```typescript
const status = await aiService.getStatus()
console.log('AI服务状态:', status)
// {
//   available: true,
//   provider: 'zhipu',
//   model: 'glm-4',
//   hasApiKey: true,
//   lastChecked: Date
// }
```

### 3. 发送聊天请求

```typescript
import { MessageRole } from '@/services/AIServiceTypes'

const response = await aiService.chat({
  messages: [
    { role: MessageRole.SYSTEM, content: '你是一个有帮助的助手' },
    { role: MessageRole.USER, content: '你好，请介绍一下自己' }
  ],
  temperature: 0.7
})

if (response.success) {
  console.log('AI回复:', response.content)
  console.log('Token使用:', response.usage)
}
```

## 核心功能

### 场景分析

分析小说场景，提取关键信息：

```typescript
const sceneText = `
夜幕降临，月光洒在古老的城堡上。
李明站在城堡门前，手持长剑，警惕地观察着四周。
远处传来狼嚎声，让人不寒而栗。
`

const result = await aiService.analyzeScene(sceneText)

if (result.success) {
  const scene = result.result as SceneAnalysis
  console.log('场景地点:', scene.location)
  console.log('时间:', scene.timeOfDay)
  console.log('氛围:', scene.atmosphere)
  console.log('角色:', scene.characters)
  console.log('动作:', scene.actions)
}
```

**返回格式**:
```typescript
{
  success: true,
  analysisType: 'scene',
  result: {
    location: '古老的城堡',
    timeOfDay: '夜晚',
    weather: '晴朗',
    atmosphere: '紧张、神秘',
    characters: ['李明'],
    actions: ['站立', '观察', '警惕']
  },
  processingTime: 1234
}
```

### 角色识别

从小说文本中识别角色：

```typescript
const novelText = `
第一章：相遇

李明是一个年轻的剑客，身材高大，眼神坚毅。
他的师父张三丰是武林中的传奇人物。
反派王五则是一个阴险狡诈的恶人。
`

const result = await aiService.identifyCharacters(novelText)

if (result.success) {
  const characters = result.result as CharacterInfo[]
  characters.forEach(char => {
    console.log(`角色: ${char.name}`)
    console.log(`类型: ${char.role}`)
    console.log(`描述: ${char.description}`)
  })
}
```

**返回格式**:
```typescript
{
  success: true,
  analysisType: 'character',
  result: [
    {
      name: '李明',
      role: 'protagonist',
      firstMention: '第一章',
      description: '年轻的剑客，身材高大，眼神坚毅'
    },
    {
      name: '张三丰',
      role: 'supporting',
      firstMention: '第一章',
      description: '武林中的传奇人物，李明的师父'
    },
    {
      name: '王五',
      role: 'antagonist',
      firstMention: '第一章',
      description: '阴险狡诈的恶人'
    }
  ],
  processingTime: 2345
}
```

## API密钥管理

### 存储API密钥

```typescript
import { keyStorageService, KeyType } from '@/services/KeyStorageService'

// 存储智谱AI密钥
await keyStorageService.storeKey(KeyType.ZHIPU_API_KEY, 'your-api-key')

// 存储OpenAI密钥
await keyStorageService.storeKey(KeyType.OPENAI_API_KEY, 'sk-...')
```

### 检查密钥是否存在

```typescript
const hasKey = await keyStorageService.hasKey(KeyType.ZHIPU_API_KEY)
console.log('是否配置密钥:', hasKey)
```

### 删除API密钥

```typescript
await keyStorageService.deleteKey(KeyType.ZHIPU_API_KEY)
```

### 验证密钥格式

```typescript
const isValid = keyStorageService.validateKeyFormat(
  KeyType.ZHIPU_API_KEY,
  'your-api-key'
)
console.log('密钥格式是否有效:', isValid)
```

## 错误处理

### 错误类型

```typescript
import { AIErrorType } from '@/services/AIServiceTypes'

// 可能的错误类型：
// - NETWORK_ERROR: 网络错误
// - API_KEY_ERROR: API密钥错误
// - RATE_LIMIT_ERROR: 速率限制
// - TIMEOUT_ERROR: 请求超时
// - INVALID_REQUEST: 无效请求
// - SERVICE_UNAVAILABLE: 服务不可用
// - UNKNOWN_ERROR: 未知错误
```

### 处理错误

```typescript
const response = await aiService.chat({
  messages: [
    { role: MessageRole.USER, content: '你好' }
  ]
})

if (!response.success) {
  console.error('AI请求失败:', response.error)
  
  // 根据错误类型采取不同的处理策略
  if (response.error?.includes('API key')) {
    // 提示用户配置API密钥
    alert('请先配置AI服务的API密钥')
  } else if (response.error?.includes('timeout')) {
    // 提示用户重试
    alert('请求超时，请重试')
  }
}
```

## 高级配置

### 自定义配置

```typescript
import { AIService } from '@/services/AIService'
import { AIProvider, AIModel } from '@/services/AIServiceTypes'

// 创建自定义配置的AI服务实例
const customAI = new AIService({
  provider: AIProvider.ZHIPU,
  model: AIModel.GLM_4_PLUS,
  temperature: 0.5,
  timeout: 30000,
  maxRetries: 5
})
```

### 重试配置

默认重试配置：
- 最大重试次数: 3
- 初始延迟: 1000ms
- 最大延迟: 10000ms
- 退避倍数: 2

重试策略：
- 网络错误 → 重试
- 超时错误 → 重试
- 5xx服务器错误 → 重试
- 4xx客户端错误 → 不重试

### 请求选项

```typescript
const response = await aiService.chat({
  model: AIModel.GLM_4_PLUS,  // 可选：覆盖默认模型
  messages: [...],
  temperature: 0.7,            // 0-1，控制随机性
  maxTokens: 2000,            // 最大生成token数
  topP: 0.9,                  // 核采样参数
  stream: false,              // 是否流式输出
  timeout: 60000              // 请求超时时间（毫秒）
})
```

## 服务统计

### 获取统计信息

```typescript
const stats = aiService.getStatistics()
console.log('请求总数:', stats.requestCount)
console.log('错误次数:', stats.errorCount)
console.log('成功率:', stats.successRate + '%')
console.log('最后错误:', stats.lastError)
```

### 重置统计

```typescript
aiService.resetStatistics()
```

## 安全性

### API密钥存储

- **生产环境**: 使用keytar库，密钥存储在操作系统的安全存储中
  - macOS: Keychain
  - Windows: Credential Vault
  - Linux: libsecret

- **开发环境**: 如果keytar不可用，使用加密的localStorage作为降级方案

### 密钥保护

- ✅ 密钥不会出现在日志中
- ✅ 密钥不会出现在错误消息中
- ✅ 密钥使用HTTPS传输
- ✅ 密钥格式验证

## 最佳实践

### 1. 错误处理

```typescript
try {
  const response = await aiService.chat({...})
  
  if (!response.success) {
    // 处理AI服务错误
    handleAIError(response.error)
    return
  }
  
  // 处理成功响应
  processResponse(response.content)
  
} catch (error) {
  // 处理意外错误
  console.error('Unexpected error:', error)
}
```

### 2. 超时处理

```typescript
// 为长时间运行的请求设置更长的超时
const response = await aiService.chat({
  messages: [...],
  timeout: 120000  // 2分钟
})
```

### 3. Token管理

```typescript
// 监控token使用
const response = await aiService.chat({...})

if (response.usage) {
  console.log('Token使用情况:')
  console.log('- 输入:', response.usage.promptTokens)
  console.log('- 输出:', response.usage.completionTokens)
  console.log('- 总计:', response.usage.totalTokens)
  
  // 根据使用情况调整策略
  if (response.usage.totalTokens > 3000) {
    console.warn('Token使用较多，考虑优化提示词')
  }
}
```

### 4. 降级方案

```typescript
async function analyzeWithFallback(text: string) {
  // 尝试使用AI服务
  const result = await aiService.analyzeScene(text)
  
  if (result.success) {
    return result.result
  }
  
  // AI服务失败，使用本地降级方案
  console.warn('AI服务不可用，使用本地分析')
  return localSceneAnalysis(text)
}

function localSceneAnalysis(text: string) {
  // 简单的本地分析逻辑
  return {
    location: '未知',
    timeOfDay: '未知',
    atmosphere: '未知',
    characters: [],
    actions: []
  }
}
```

## 故障排查

### 问题：API密钥无效

**症状**: 返回错误 "Invalid API key"

**解决方案**:
1. 检查API密钥是否正确配置
2. 验证密钥格式是否正确
3. 确认密钥是否已过期
4. 检查网络连接

```typescript
// 检查密钥状态
const hasKey = await aiService.hasApiKey()
if (!hasKey) {
  console.log('未配置API密钥')
  // 提示用户配置
}
```

### 问题：请求超时

**症状**: 返回错误 "Request timeout"

**解决方案**:
1. 增加超时时间
2. 检查网络连接
3. 减少请求内容长度

```typescript
// 增加超时时间
const response = await aiService.chat({
  messages: [...],
  timeout: 120000  // 增加到2分钟
})
```

### 问题：速率限制

**症状**: 返回错误 "Rate limit exceeded"

**解决方案**:
1. 减少请求频率
2. 实现请求队列
3. 升级API套餐

```typescript
// 实现简单的请求队列
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private delay = 1000  // 1秒延迟

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const fn = this.queue.shift()
      if (fn) {
        await fn()
        await new Promise(resolve => setTimeout(resolve, this.delay))
      }
    }

    this.processing = false
  }
}
```

## 相关文档

- [AIServiceTypes.ts](./AIServiceTypes.ts) - 类型定义
- [KeyStorageService.ts](./KeyStorageService.ts) - 密钥存储服务
- [智谱AI API文档](https://open.bigmodel.cn/dev/api)

## 更新日志

### v1.0.0 (2025-01-15)
- ✅ 初始版本
- ✅ 智谱AI GLM-4集成
- ✅ API密钥安全存储
- ✅ 自动重试机制
- ✅ 场景分析功能
- ✅ 角色识别功能
- ✅ 错误处理和恢复

## 许可证

MIT License
