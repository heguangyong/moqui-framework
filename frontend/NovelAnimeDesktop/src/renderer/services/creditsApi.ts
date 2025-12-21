/**
 * Credits API Service
 * Handles all credits-related API calls
 * Requirements: 3.1, 3.4, 4.1, 4.2, 4.3, 8.1, 8.2
 */
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ConsumeCreditsRequest {
  amount: number
  operationType: string
  description?: string
}

export interface CreditsHistoryRequest {
  page?: number
  pageSize?: number
  type?: 'consume' | 'add' | 'initial' | 'refund'
}

class CreditsApiService {
  private api: AxiosInstance
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('novel_anime_access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle auth errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired - let auth store handle it
          localStorage.removeItem('novel_anime_access_token')
          localStorage.removeItem('novel_anime_refresh_token')
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * Get credits balance (Requirement: 3.1)
   */
  async getBalance(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/rest/s1/novel-anime/credits/balance')
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '获取积分余额失败'
      }
    }
  }

  /**
   * Consume credits (Requirements: 4.1, 4.2, 4.3, 8.1)
   */
  async consume(data: ConsumeCreditsRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/rest/s1/novel-anime/credits/consume', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '消费积分失败'
      }
    }
  }

  /**
   * Get credits history (Requirements: 3.4, 8.2)
   */
  async getHistory(params?: CreditsHistoryRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/rest/s1/novel-anime/credits/history', { params })
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '获取积分历史失败'
      }
    }
  }
}

export const creditsApi = new CreditsApiService()
