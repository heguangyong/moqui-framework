/**
 * AI Service
 * 
 * Unified AI service layer for integrating multiple AI providers
 * Primary provider: 智谱AI GLM-4
 * 
 * Features:
 * - Multi-provider support with fallback
 * - Automatic retry with exponential backoff
 * - Error handling and recovery
 * - API key management
 * - Request/response logging
 * 
 * Requirements: 6.1, 6.2, 6.5
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import {
  AIProvider,
  AIModel,
  AIServiceConfig,
  AIMessage,
  AIRequestOptions,
  AIResponse,
  AIServiceStatus,
  AIServiceError,
  AIErrorType,
  RetryConfig,
  NovelAnalysisRequest,
  NovelAnalysisResponse,
  SceneAnalysis,
  CharacterInfo,
  DialogueInfo,
  EmotionAnalysis,
  MessageRole
} from './AIServiceTypes'
import { keyStorageService, KeyType } from './KeyStorageService'

/**
 * Default configuration for 智谱AI
 */
const ZHIPU_CONFIG = {
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  timeout: 60000,
  maxRetries: 3
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

/**
 * AI Service Class
 */
export class AIService {
  private config: AIServiceConfig
  private axiosInstance: AxiosInstance
  private retryConfig: RetryConfig
  private requestCount: number = 0
  private errorCount: number = 0
  private lastError: string | null = null

  constructor(config?: Partial<AIServiceConfig>) {
    // Default to 智谱AI GLM-4
    this.config = {
      provider: AIProvider.ZHIPU,
      model: AIModel.GLM_4,
      baseURL: ZHIPU_CONFIG.baseURL,
      timeout: ZHIPU_CONFIG.timeout,
      maxRetries: ZHIPU_CONFIG.maxRetries,
      temperature: 0.7,
      ...config
    }

    this.retryConfig = DEFAULT_RETRY_CONFIG

    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add request interceptor for API key
    this.axiosInstance.interceptors.request.use(
      async (config: any) => {
        const apiKey = await this.getApiKey()
        if (apiKey) {
          config.headers.Authorization = `Bearer ${apiKey}`
        }
        return config
      },
      (error: any) => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        this.errorCount++
        this.lastError = error.message
        return Promise.reject(error)
      }
    )

    console.log('🤖 AIService initialized:', {
      provider: this.config.provider,
      model: this.config.model,
      baseURL: this.config.baseURL
    })
  }

  /**
   * Get API key from secure storage
   */
  private async getApiKey(): Promise<string | null> {
    const keyType = this.getKeyTypeForProvider(this.config.provider)
    return await keyStorageService.getKey(keyType)
  }

  /**
   * Get key type for provider
   */
  private getKeyTypeForProvider(provider: AIProvider): KeyType {
    switch (provider) {
      case AIProvider.ZHIPU:
        return KeyType.ZHIPU_API_KEY
      case AIProvider.OPENAI:
        return KeyType.OPENAI_API_KEY
      case AIProvider.ANTHROPIC:
        return KeyType.ANTHROPIC_API_KEY
      default:
        return KeyType.ZHIPU_API_KEY
    }
  }

  /**
   * Set API key
   * 
   * @param apiKey - API key to store
   * @returns Success status
   */
  async setApiKey(apiKey: string): Promise<boolean> {
    const keyType = this.getKeyTypeForProvider(this.config.provider)
    
    // Validate key format
    if (!keyStorageService.validateKeyFormat(keyType, apiKey)) {
      console.error('Invalid API key format')
      return false
    }

    // Store key securely
    return await keyStorageService.storeKey(keyType, apiKey)
  }

  /**
   * Check if API key is configured
   */
  async hasApiKey(): Promise<boolean> {
    const keyType = this.getKeyTypeForProvider(this.config.provider)
    return await keyStorageService.hasKey(keyType)
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<AIServiceStatus> {
    const hasKey = await this.hasApiKey()
    
    return {
      available: hasKey,
      provider: this.config.provider,
      model: this.config.model,
      hasApiKey: hasKey,
      lastError: this.lastError || undefined,
      lastChecked: new Date()
    }
  }

  /**
   * Send chat completion request
   * 
   * @param options - Request options
   * @returns AI response
   */
  async chat(options: AIRequestOptions): Promise<AIResponse> {
    this.requestCount++

    try {
      // Check if API key is configured
      if (!(await this.hasApiKey())) {
        throw new AIServiceError(
          AIErrorType.API_KEY_ERROR,
          'API key not configured'
        )
      }

      // Prepare request payload
      const payload = this.prepareRequestPayload(options)

      // Send request with retry
      const response = await this.sendWithRetry(payload)

      // Parse response
      return this.parseResponse(response.data)

    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Prepare request payload for 智谱AI
   */
  private prepareRequestPayload(options: AIRequestOptions): any {
    return {
      model: options.model || this.config.model,
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stream: options.stream || false
    }
  }

  /**
   * Send request with retry logic
   */
  private async sendWithRetry(payload: any, attempt: number = 0): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/chat/completions', payload)
      return response
    } catch (error) {
      // Check if we should retry
      if (attempt < this.retryConfig.maxRetries && this.shouldRetry(error)) {
        const delay = this.calculateRetryDelay(attempt)
        console.log(`⏳ Retrying request (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`)
        
        await this.sleep(delay)
        return this.sendWithRetry(payload, attempt + 1)
      }
      
      throw error
    }
  }

  /**
   * Check if error is retryable
   */
  private shouldRetry(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      // Retry on network errors, timeouts, and 5xx errors
      return !status || status >= 500 || error.code === 'ECONNABORTED'
    }
    return false
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.initialDelay * 
                  Math.pow(this.retryConfig.backoffMultiplier, attempt)
    return Math.min(delay, this.retryConfig.maxDelay)
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Parse AI response
   */
  private parseResponse(data: any): AIResponse {
    try {
      const choice = data.choices?.[0]
      const message = choice?.message
      
      return {
        success: true,
        content: message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        model: data.model,
        finishReason: choice?.finish_reason,
        provider: this.config.provider
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return {
        success: false,
        error: 'Failed to parse response',
        provider: this.config.provider
      }
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any): AIResponse {
    let errorType: AIErrorType = AIErrorType.UNKNOWN_ERROR
    let errorMessage = 'Unknown error occurred'

    if (error instanceof AIServiceError) {
      errorType = error.type
      errorMessage = error.message
    } else if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      
      if (axiosError.code === 'ECONNABORTED') {
        errorType = AIErrorType.TIMEOUT_ERROR
        errorMessage = 'Request timeout'
      } else if (axiosError.response) {
        const status = axiosError.response.status
        
        if (status === 401 || status === 403) {
          errorType = AIErrorType.API_KEY_ERROR
          errorMessage = 'Invalid API key'
        } else if (status === 429) {
          errorType = AIErrorType.RATE_LIMIT_ERROR
          errorMessage = 'Rate limit exceeded'
        } else if (status >= 500) {
          errorType = AIErrorType.SERVICE_UNAVAILABLE
          errorMessage = 'AI service unavailable'
        } else {
          errorType = AIErrorType.INVALID_REQUEST
          errorMessage = axiosError.response.data?.error?.message || 'Invalid request'
        }
      } else {
        errorType = AIErrorType.NETWORK_ERROR
        errorMessage = 'Network error'
      }
    }

    console.error(`AI Service Error [${errorType}]:`, errorMessage)

    return {
      success: false,
      error: errorMessage,
      provider: this.config.provider
    }
  }

  /**
   * Analyze novel scene
   * 
   * @param sceneText - Scene text to analyze
   * @returns Scene analysis result
   */
  async analyzeScene(sceneText: string): Promise<NovelAnalysisResponse> {
    const startTime = Date.now()

    try {
      const prompt = `
分析以下小说场景，提取关键信息：

场景文本：
${sceneText}

请提取：
1. 场景地点
2. 时间（白天/夜晚/黄昏等）
3. 天气
4. 氛围/情绪
5. 出现的角色
6. 主要动作

以JSON格式返回，格式如下：
{
  "location": "场景地点",
  "timeOfDay": "时间",
  "weather": "天气",
  "atmosphere": "氛围",
  "characters": ["角色1", "角色2"],
  "actions": ["动作1", "动作2"]
}
`

      const response = await this.chat({
        messages: [
          { role: MessageRole.SYSTEM, content: '你是一个专业的小说场景分析助手。' },
          { role: MessageRole.USER, content: prompt }
        ],
        temperature: 0.3 // Lower temperature for more consistent output
      })

      if (!response.success || !response.content) {
        return {
          success: false,
          analysisType: 'scene',
          error: response.error || 'Failed to analyze scene'
        }
      }

      // Parse JSON response
      const result = this.parseJSONResponse<SceneAnalysis>(response.content)

      return {
        success: true,
        analysisType: 'scene',
        result,
        processingTime: Date.now() - startTime
      }

    } catch (error: any) {
      return {
        success: false,
        analysisType: 'scene',
        error: error.message || 'Failed to analyze scene',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Identify characters from novel text
   * 
   * @param novelText - Novel text to analyze
   * @returns Character identification result
   */
  async identifyCharacters(novelText: string): Promise<NovelAnalysisResponse> {
    const startTime = Date.now()

    try {
      // Limit text length for API
      const textSample = novelText.substring(0, 5000)

      const prompt = `
从以下小说文本中识别所有角色：

${textSample}

对每个角色提取：
1. 姓名
2. 角色类型（protagonist/antagonist/supporting/minor）
3. 首次出现位置
4. 简短描述

以JSON数组格式返回，格式如下：
[
  {
    "name": "角色名",
    "role": "protagonist",
    "firstMention": "首次出现位置",
    "description": "简短描述"
  }
]
`

      const response = await this.chat({
        messages: [
          { role: MessageRole.SYSTEM, content: '你是一个专业的小说角色识别助手。' },
          { role: MessageRole.USER, content: prompt }
        ],
        temperature: 0.3
      })

      if (!response.success || !response.content) {
        return {
          success: false,
          analysisType: 'character',
          error: response.error || 'Failed to identify characters'
        }
      }

      // Parse JSON response
      const result = this.parseJSONResponse<CharacterInfo[]>(response.content)

      return {
        success: true,
        analysisType: 'character',
        result,
        processingTime: Date.now() - startTime
      }

    } catch (error: any) {
      return {
        success: false,
        analysisType: 'character',
        error: error.message || 'Failed to identify characters',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Extract dialogues from novel text
   * 
   * @param novelText - Novel text to analyze
   * @returns Dialogue extraction result
   */
  async extractDialogue(novelText: string): Promise<NovelAnalysisResponse> {
    const startTime = Date.now()

    try {
      // Limit text length for API
      const textSample = novelText.substring(0, 5000)

      const prompt = `
从以下小说文本中提取所有对话：

${textSample}

对每段对话提取：
1. 说话人（speaker）
2. 对话内容（content）
3. 情绪（emotion，可选）
4. 上下文（context，简短描述对话发生的情境）
5. 位置（position，在文本中的大致位置）

以JSON数组格式返回，格式如下：
[
  {
    "speaker": "角色名",
    "content": "对话内容",
    "emotion": "情绪",
    "context": "对话情境",
    "position": 100
  }
]
`

      const response = await this.chat({
        messages: [
          { role: MessageRole.SYSTEM, content: '你是一个专业的小说对话提取助手。' },
          { role: MessageRole.USER, content: prompt }
        ],
        temperature: 0.3
      })

      if (!response.success || !response.content) {
        return {
          success: false,
          analysisType: 'dialogue',
          error: response.error || 'Failed to extract dialogue'
        }
      }

      // Parse JSON response
      const result = this.parseJSONResponse<DialogueInfo[]>(response.content)

      return {
        success: true,
        analysisType: 'dialogue',
        result,
        processingTime: Date.now() - startTime
      }

    } catch (error: any) {
      return {
        success: false,
        analysisType: 'dialogue',
        error: error.message || 'Failed to extract dialogue',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Analyze emotion from text
   * 
   * @param text - Text to analyze
   * @param context - Optional context for better analysis
   * @returns Emotion analysis result
   */
  async analyzeEmotion(text: string, context?: string): Promise<NovelAnalysisResponse> {
    const startTime = Date.now()

    try {
      const contextInfo = context ? `\n\n上下文：${context}` : ''
      
      const prompt = `
分析以下文本的情感：

文本：
${text}${contextInfo}

请分析：
1. 主要情绪（primaryEmotion）：如快乐、悲伤、愤怒、恐惧、惊讶等
2. 情绪强度（intensity）：0-1之间的数值，0表示无情绪，1表示情绪极强
3. 次要情绪（secondaryEmotions）：可能存在的其他情绪
4. 情感倾向（sentiment）：positive/negative/neutral
5. 情感基调（emotionalTone）：整体的情感氛围描述

以JSON格式返回，格式如下：
{
  "primaryEmotion": "主要情绪",
  "intensity": 0.8,
  "secondaryEmotions": ["次要情绪1", "次要情绪2"],
  "sentiment": "positive",
  "emotionalTone": "情感基调描述"
}
`

      const response = await this.chat({
        messages: [
          { role: MessageRole.SYSTEM, content: '你是一个专业的情感分析助手。' },
          { role: MessageRole.USER, content: prompt }
        ],
        temperature: 0.3
      })

      if (!response.success || !response.content) {
        return {
          success: false,
          analysisType: 'emotion',
          error: response.error || 'Failed to analyze emotion'
        }
      }

      // Parse JSON response
      const result = this.parseJSONResponse<EmotionAnalysis>(response.content)

      return {
        success: true,
        analysisType: 'emotion',
        result,
        processingTime: Date.now() - startTime
      }

    } catch (error: any) {
      return {
        success: false,
        analysisType: 'emotion',
        error: error.message || 'Failed to analyze emotion',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Parse JSON response from AI
   * Handles markdown code blocks and extracts JSON
   */
  private parseJSONResponse<T>(content: string): T {
    try {
      // Remove markdown code blocks if present
      let jsonStr = content.trim()
      
      // Remove ```json and ``` markers
      jsonStr = jsonStr.replace(/^```json\s*/i, '')
      jsonStr = jsonStr.replace(/^```\s*/, '')
      jsonStr = jsonStr.replace(/\s*```$/, '')
      
      // Parse JSON
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Failed to parse JSON response:', error)
      console.error('Content:', content)
      throw new Error('Invalid JSON response from AI')
    }
  }

  /**
   * Get service statistics
   */
  getStatistics(): {
    requestCount: number
    errorCount: number
    successRate: number
    lastError: string | null
  } {
    const successRate = this.requestCount > 0 
      ? ((this.requestCount - this.errorCount) / this.requestCount) * 100 
      : 0

    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      successRate: Math.round(successRate * 100) / 100,
      lastError: this.lastError
    }
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.requestCount = 0
    this.errorCount = 0
    this.lastError = null
  }
}

// Export singleton instance
export const aiService = new AIService()
export default aiService
