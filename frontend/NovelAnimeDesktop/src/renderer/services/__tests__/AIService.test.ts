/**
 * AI Service Unit Tests
 * 
 * Tests for AI service integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIService } from '../AIService'
import { AIProvider, AIModel, MessageRole } from '../AIServiceTypes'
import { keyStorageService, KeyType } from '../KeyStorageService'

// Mock keyStorageService
vi.mock('../KeyStorageService', () => ({
  keyStorageService: {
    getKey: vi.fn(),
    storeKey: vi.fn(),
    hasKey: vi.fn(),
    validateKeyFormat: vi.fn(),
    deleteKey: vi.fn()
  },
  KeyType: {
    ZHIPU_API_KEY: 'zhipu_api_key',
    OPENAI_API_KEY: 'openai_api_key',
    ANTHROPIC_API_KEY: 'anthropic_api_key',
    STABILITY_API_KEY: 'stability_api_key'
  }
}))

describe('AIService', () => {
  let aiService: AIService

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Create new instance for each test
    aiService = new AIService()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const service = new AIService()
      expect(service).toBeDefined()
    })

    it('should initialize with custom configuration', () => {
      const service = new AIService({
        provider: AIProvider.ZHIPU,
        model: AIModel.GLM_4_PLUS,
        temperature: 0.5
      })
      expect(service).toBeDefined()
    })
  })

  describe('API Key Management', () => {
    it('should set API key successfully', async () => {
      vi.mocked(keyStorageService.validateKeyFormat).mockReturnValue(true)
      vi.mocked(keyStorageService.storeKey).mockResolvedValue(true)

      const result = await aiService.setApiKey('test-api-key')
      
      expect(result).toBe(true)
      expect(keyStorageService.validateKeyFormat).toHaveBeenCalled()
      expect(keyStorageService.storeKey).toHaveBeenCalledWith(
        KeyType.ZHIPU_API_KEY,
        'test-api-key'
      )
    })

    it('should reject invalid API key format', async () => {
      vi.mocked(keyStorageService.validateKeyFormat).mockReturnValue(false)

      const result = await aiService.setApiKey('invalid-key')
      
      expect(result).toBe(false)
      expect(keyStorageService.storeKey).not.toHaveBeenCalled()
    })

    it('should check if API key exists', async () => {
      vi.mocked(keyStorageService.hasKey).mockResolvedValue(true)

      const hasKey = await aiService.hasApiKey()
      
      expect(hasKey).toBe(true)
      expect(keyStorageService.hasKey).toHaveBeenCalledWith(KeyType.ZHIPU_API_KEY)
    })
  })

  describe('Service Status', () => {
    it('should return service status with API key', async () => {
      vi.mocked(keyStorageService.hasKey).mockResolvedValue(true)

      const status = await aiService.getStatus()
      
      expect(status).toMatchObject({
        available: true,
        provider: AIProvider.ZHIPU,
        model: AIModel.GLM_4,
        hasApiKey: true
      })
      expect(status.lastChecked).toBeInstanceOf(Date)
    })

    it('should return service status without API key', async () => {
      vi.mocked(keyStorageService.hasKey).mockResolvedValue(false)

      const status = await aiService.getStatus()
      
      expect(status).toMatchObject({
        available: false,
        provider: AIProvider.ZHIPU,
        model: AIModel.GLM_4,
        hasApiKey: false
      })
    })
  })

  describe('Statistics', () => {
    it('should return initial statistics', () => {
      const stats = aiService.getStatistics()
      
      expect(stats).toEqual({
        requestCount: 0,
        errorCount: 0,
        successRate: 0,
        lastError: null
      })
    })

    it('should reset statistics', () => {
      aiService.resetStatistics()
      
      const stats = aiService.getStatistics()
      expect(stats.requestCount).toBe(0)
      expect(stats.errorCount).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing API key error', async () => {
      vi.mocked(keyStorageService.hasKey).mockResolvedValue(false)

      const response = await aiService.chat({
        messages: [
          { role: MessageRole.USER, content: 'Hello' }
        ]
      })
      
      expect(response.success).toBe(false)
      expect(response.error).toContain('API key not configured')
    })
  })

  describe('JSON Response Parsing', () => {
    it('should parse clean JSON response', () => {
      const service = new AIService()
      const jsonContent = '{"location": "城堡", "timeOfDay": "夜晚"}'
      
      // Access private method through any type
      const result = (service as any).parseJSONResponse(jsonContent)
      
      expect(result).toEqual({
        location: '城堡',
        timeOfDay: '夜晚'
      })
    })

    it('should parse JSON with markdown code blocks', () => {
      const service = new AIService()
      const jsonContent = '```json\n{"location": "城堡"}\n```'
      
      const result = (service as any).parseJSONResponse(jsonContent)
      
      expect(result).toEqual({
        location: '城堡'
      })
    })

    it('should throw error for invalid JSON', () => {
      const service = new AIService()
      const invalidContent = 'not a json'
      
      expect(() => {
        (service as any).parseJSONResponse(invalidContent)
      }).toThrow('Invalid JSON response from AI')
    })
  })

  describe('Retry Logic', () => {
    it('should calculate retry delay with exponential backoff', () => {
      const service = new AIService()
      
      // Access private method
      const delay0 = (service as any).calculateRetryDelay(0)
      const delay1 = (service as any).calculateRetryDelay(1)
      const delay2 = (service as any).calculateRetryDelay(2)
      
      expect(delay0).toBe(1000)  // 1000 * 2^0
      expect(delay1).toBe(2000)  // 1000 * 2^1
      expect(delay2).toBe(4000)  // 1000 * 2^2
    })

    it('should cap retry delay at maximum', () => {
      const service = new AIService()
      
      // Large attempt number should be capped at maxDelay (10000)
      const delay = (service as any).calculateRetryDelay(10)
      
      expect(delay).toBeLessThanOrEqual(10000)
    })
  })
})
