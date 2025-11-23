// MCP AI服务
import { MoquiApiService, type ApiResponse } from './base'

export interface TranscriptionResult {
  transcription: string
  language: string
  confidence: number
}

export interface ImageAnalysisResult {
  description: string
  confidence: number
  tags: Array<{
    name: string
    confidence: number
    category: string
  }>
  category: string
  suggestions?: Array<{
    id: string
    title: string
    description: string
    action: string
    icon: string
    color: string
  }>
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  response: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class McpAiService extends MoquiApiService {
  constructor() {
    super()
  }

  /**
   * 语音转文字
   */
  async transcribeAudio(
    audioBlob: Blob,
    options: { language?: string } = {}
  ): Promise<ApiResponse<TranscriptionResult>> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    if (options.language) {
      formData.append('language', options.language)
    }

    return this.upload<TranscriptionResult>('/rest/s1/mcp/transcribe/Audio', formData)
  }

  /**
   * 图像分析
   */
  async analyzeImage(
    imageBlob: Blob,
    analysisType: string = 'comprehensive'
  ): Promise<ApiResponse<ImageAnalysisResult>> {
    const formData = new FormData()
    formData.append('image', imageBlob, 'image.jpg')
    formData.append('analysisType', analysisType)

    return this.upload<ImageAnalysisResult>('/rest/s1/mcp/analyze/Image', formData)
  }

  /**
   * AI对话完成
   */
  async chatComplete(
    messages: ChatMessage[],
    systemPrompt: string = ''
  ): Promise<ApiResponse<ChatResponse>> {
    return this.post<ChatResponse>('/rest/s1/mcp/chat/Complete', {
      messages,
      systemPrompt
    })
  }

  /**
   * 智能推荐
   */
  async getRecommendations(
    context: any,
    options: {
      minScore?: number
      maxResults?: number
    } = {}
  ): Promise<ApiResponse<any>> {
    return this.post('/rest/s1/marketplace/process/AllMatching', {
      context,
      minScore: options.minScore || 0.6,
      maxResults: options.maxResults || 10
    })
  }

  /**
   * 生成业务报告
   */
  async generateReport(
    reportType: 'project' | 'sales' | 'inventory' | 'financial',
    data: any
  ): Promise<ApiResponse<any>> {
    return this.post('/rest/s1/mcp/generate/Report', {
      reportType,
      data
    })
  }

  /**
   * 智能任务分配
   */
  async suggestTaskAssignment(
    projectId: string,
    taskDetails: any
  ): Promise<ApiResponse<any>> {
    return this.post('/rest/s1/mcp/suggest/TaskAssignment', {
      projectId,
      taskDetails
    })
  }

  /**
   * 风险评估
   */
  async assessProjectRisk(
    projectId: string
  ): Promise<ApiResponse<any>> {
    return this.post('/rest/s1/mcp/assess/ProjectRisk', {
      projectId
    })
  }
}

// 导出单例实例
export const mcpAiService = new McpAiService()