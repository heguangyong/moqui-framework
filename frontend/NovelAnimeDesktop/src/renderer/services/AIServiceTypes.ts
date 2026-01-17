/**
 * AI Service Type Definitions
 * 
 * Defines types and interfaces for AI service integration
 * Supports multiple AI providers with a unified interface
 */

/**
 * AI Provider Types
 */
export enum AIProvider {
  ZHIPU = 'zhipu',      // 智谱AI GLM-4
  OPENAI = 'openai',    // OpenAI GPT
  ANTHROPIC = 'anthropic', // Claude
  LOCAL = 'local'       // Local fallback
}

/**
 * AI Model Types
 */
export enum AIModel {
  // 智谱AI Models
  GLM_4 = 'glm-4',
  GLM_4_PLUS = 'glm-4-plus',
  GLM_4V = 'glm-4v',
  GLM_4V_PLUS = 'glm-4v-plus',
  
  // OpenAI Models
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  
  // Local fallback
  LOCAL_MODEL = 'local'
}

/**
 * AI Service Configuration
 */
export interface AIServiceConfig {
  provider: AIProvider
  model: AIModel
  apiKey?: string
  baseURL?: string
  timeout?: number
  maxRetries?: number
  temperature?: number
}

/**
 * AI Message Role
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant'
}

/**
 * AI Chat Message
 */
export interface AIMessage {
  role: MessageRole
  content: string
}

/**
 * AI Request Options
 */
export interface AIRequestOptions {
  model?: AIModel
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  timeout?: number
}

/**
 * AI Response
 */
export interface AIResponse {
  success: boolean
  content?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  finishReason?: string
  error?: string
  provider?: AIProvider
}

/**
 * Scene Analysis Result
 */
export interface SceneAnalysis {
  location: string
  timeOfDay: string
  weather?: string
  atmosphere: string
  characters: string[]
  actions: string[]
  emotions?: string[]
}

/**
 * Character Identification Result
 */
export interface CharacterInfo {
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  firstMention: string
  description?: string
  appearance?: string
  personality?: string
}

/**
 * Dialogue Extraction Result
 */
export interface DialogueInfo {
  speaker: string
  content: string
  emotion?: string
  context?: string
  position?: number
}

/**
 * Emotion Analysis Result
 */
export interface EmotionAnalysis {
  primaryEmotion: string
  intensity: number  // 0-1
  secondaryEmotions?: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  emotionalTone?: string
}

/**
 * Novel Analysis Request
 */
export interface NovelAnalysisRequest {
  text: string
  analysisType: 'scene' | 'character' | 'dialogue' | 'emotion'
  context?: string
}

/**
 * Novel Analysis Response
 */
export interface NovelAnalysisResponse {
  success: boolean
  analysisType: string
  result?: SceneAnalysis | CharacterInfo[] | DialogueInfo[] | EmotionAnalysis | any
  error?: string
  processingTime?: number
}

/**
 * AI Service Status
 */
export interface AIServiceStatus {
  available: boolean
  provider: AIProvider
  model: AIModel
  hasApiKey: boolean
  lastError?: string
  lastChecked: Date
}

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

/**
 * Error Types
 */
export enum AIErrorType {
  NETWORK_ERROR = 'network_error',
  API_KEY_ERROR = 'api_key_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  TIMEOUT_ERROR = 'timeout_error',
  INVALID_REQUEST = 'invalid_request',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * AI Service Error
 */
export class AIServiceError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}
