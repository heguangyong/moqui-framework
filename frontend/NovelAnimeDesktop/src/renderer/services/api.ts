import axios from 'axios'
import type { NovelStructure, ValidationResult } from '../types/core'

/**
 * API Service for Novel Anime Generator
 * Handles communication with the Moqui backend
 */
class ApiService {
  private baseURL: string
  private axiosInstance

  constructor() {
    // Default to localhost for development
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds for large file uploads
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add request interceptor for authentication if needed
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error)
        return Promise.reject(error)
      }
    )
  }

  /**
   * Validates novel file content
   */
  async validateNovelFile(fileContent: string, fileName?: string): Promise<ValidationResult> {
    try {
      const response = await this.axiosInstance.post('/rest/s1/novel-anime/validateNovelFile', {
        fileContent,
        fileName
      })

      return {
        isValid: response.data.isValid,
        errors: response.data.errorMessage ? [{
          code: 'VALIDATION_ERROR',
          message: response.data.errorMessage,
          severity: 'error' as const
        }] : [],
        warnings: (response.data.warnings || []).map((warning: string) => ({
          code: 'VALIDATION_WARNING',
          message: warning,
          severity: 'warning' as const
        }))
      }
    } catch (error) {
      console.error('Failed to validate novel file:', error)
      return {
        isValid: false,
        errors: [{
          code: 'API_ERROR',
          message: 'Failed to validate file. Please try again.',
          severity: 'error' as const
        }],
        warnings: []
      }
    }
  }

  /**
   * Parses novel content and creates structured data
   */
  async parseNovel(textContent: string, title?: string, author?: string): Promise<{
    novelId: string
    novelStructure: NovelStructure
  }> {
    try {
      const response = await this.axiosInstance.post('/rest/s1/novel-anime/parseNovel', {
        textContent,
        title,
        author
      })

      return {
        novelId: response.data.novelId,
        novelStructure: response.data.novelStructure
      }
    } catch (error) {
      console.error('Failed to parse novel:', error)
      throw new Error('Failed to parse novel. Please check the file format and try again.')
    }
  }

  /**
   * Retrieves novel structure by ID
   */
  async getNovel(novelId: string): Promise<NovelStructure | null> {
    try {
      const response = await this.axiosInstance.get(`/rest/s1/novel-anime/novel/${novelId}`)
      return response.data
    } catch (error) {
      console.error('Failed to retrieve novel:', error)
      return null
    }
  }

  /**
   * Lists all novels
   */
  async listNovels(): Promise<Array<{
    novelId: string
    title: string
    author: string
    wordCount: number
    status: string
    createdDate: string
  }>> {
    try {
      const response = await this.axiosInstance.get('/rest/s1/novel-anime/novels')
      return response.data.novels || []
    } catch (error) {
      console.error('Failed to list novels:', error)
      return []
    }
  }

  /**
   * Deletes a novel
   */
  async deleteNovel(novelId: string): Promise<boolean> {
    try {
      await this.axiosInstance.delete(`/rest/s1/novel-anime/novel/${novelId}`)
      return true
    } catch (error) {
      console.error('Failed to delete novel:', error)
      return false
    }
  }

  /**
   * Updates novel metadata
   */
  async updateNovel(novelId: string, updates: {
    title?: string
    author?: string
    status?: string
  }): Promise<boolean> {
    try {
      await this.axiosInstance.put(`/rest/s1/novel-anime/novel/${novelId}`, updates)
      return true
    } catch (error) {
      console.error('Failed to update novel:', error)
      return false
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService