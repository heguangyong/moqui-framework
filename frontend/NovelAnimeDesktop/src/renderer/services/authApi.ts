/**
 * Authentication API Service
 * Handles all auth-related API calls
 * Requirements: All auth related requirements
 */
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface RegisterRequest {
  email: string
  password: string
  username?: string
}

export interface LoginRequest {
  email: string
  password: string
}

// 开发模式模拟用户数据
const DEV_MOCK_USER = {
  userId: 'dev-user-001',
  email: 'abc@123.com',
  username: 'DevUser',
  credits: 500,
  avatarUrl: null,
  authProvider: 'local' as const,
  status: 'active',
  createdDate: new Date().toISOString(),
  lastLoginDate: new Date().toISOString()
}

// 检查是否为开发模式
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

class AuthApiService {
  private api: AxiosInstance
  private baseUrl: string

  constructor() {
    // 使用 import.meta.env 替代 process.env，这是 Vite 推荐的方式
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000, // 减少超时时间
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
          const refreshToken = localStorage.getItem('novel_anime_refresh_token')
          if (refreshToken && !error.config._retry) {
            error.config._retry = true
            try {
              const refreshResponse = await this.api.post('/rest/s1/novel-anime/auth/refresh', {
                refreshToken
              })

              if (refreshResponse.data.success) {
                localStorage.setItem('novel_anime_access_token', refreshResponse.data.accessToken)
                localStorage.setItem('novel_anime_refresh_token', refreshResponse.data.refreshToken)
                error.config.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`
                return this.api.request(error.config)
              }
            } catch (refreshError) {
              this.clearTokens()
            }
          } else {
            this.clearTokens()
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private clearTokens() {
    localStorage.removeItem('novel_anime_access_token')
    localStorage.removeItem('novel_anime_refresh_token')
  }

  /**
   * 开发模式模拟登录
   */
  private mockLogin(data: LoginRequest): ApiResponse {
    console.log('🔧 Dev mode: Mock login for', data.email)
    
    // 模拟登录验证 - 开发模式下接受任何邮箱
    const mockToken = `dev-token-${Date.now()}`
    const mockRefreshToken = `dev-refresh-${Date.now()}`
    
    // 保存到 localStorage 以便路由守卫检查
    localStorage.setItem('auth_token', mockToken)
    localStorage.setItem('auth_user', JSON.stringify({
      ...DEV_MOCK_USER,
      email: data.email,
      username: data.email.split('@')[0]
    }))
    
    return {
      success: true,
      data: {
        success: true,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
        user: {
          ...DEV_MOCK_USER,
          email: data.email,
          username: data.email.split('@')[0]
        }
      }
    }
  }

  /**
   * 开发模式模拟注册
   */
  private mockRegister(data: RegisterRequest): ApiResponse {
    console.log('🔧 Dev mode: Mock register for', data.email)
    
    const mockToken = `dev-token-${Date.now()}`
    const mockRefreshToken = `dev-refresh-${Date.now()}`
    
    localStorage.setItem('auth_token', mockToken)
    localStorage.setItem('auth_user', JSON.stringify({
      ...DEV_MOCK_USER,
      email: data.email,
      username: data.username || data.email.split('@')[0]
    }))
    
    return {
      success: true,
      data: {
        success: true,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
        user: {
          ...DEV_MOCK_USER,
          email: data.email,
          username: data.username || data.email.split('@')[0]
        }
      }
    }
  }

  // Auth APIs
  async register(data: RegisterRequest): Promise<ApiResponse> {
    // 开发模式下使用模拟注册
    if (isDevelopment) {
      return this.mockRegister(data)
    }
    
    try {
      const response = await this.api.post('/rest/s1/novel-anime/auth/register', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '注册失败'
      }
    }
  }

  async login(data: LoginRequest): Promise<ApiResponse> {
    // 开发模式下使用模拟登录
    if (isDevelopment) {
      return this.mockLogin(data)
    }
    
    try {
      const response = await this.api.post('/rest/s1/novel-anime/auth/login', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '登录失败'
      }
    }
  }

  async validateToken(): Promise<ApiResponse> {
    // 开发模式下检查本地存储
    if (isDevelopment) {
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('auth_user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          return { success: true, data: { valid: true, user } }
        } catch {
          return { success: false, error: 'Invalid user data' }
        }
      }
      return { success: false, error: 'No token found' }
    }
    
    try {
      const response = await this.api.get('/rest/s1/novel-anime/auth/validate')
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '验证失败'
      }
    }
  }

  async logout(): Promise<ApiResponse> {
    // 开发模式下清除本地存储
    if (isDevelopment) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      return { success: true, data: { success: true } }
    }
    
    try {
      const response = await this.api.post('/rest/s1/novel-anime/auth/logout')
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '登出失败'
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse> {
    // 开发模式下模拟刷新
    if (isDevelopment) {
      const newToken = `dev-token-${Date.now()}`
      const newRefreshToken = `dev-refresh-${Date.now()}`
      return {
        success: true,
        data: {
          success: true,
          accessToken: newToken,
          refreshToken: newRefreshToken
        }
      }
    }
    
    try {
      const response = await this.api.post('/rest/s1/novel-anime/auth/refresh', { refreshToken })
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Token刷新失败'
      }
    }
  }

  // OAuth APIs
  async getGitHubAuthUrl(): Promise<ApiResponse> {
    if (isDevelopment) {
      return { success: false, error: '开发模式下不支持OAuth登录' }
    }
    try {
      const response = await this.api.get('/rest/s1/novel-anime/auth/oauth/github/url')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message || '获取GitHub授权URL失败' }
    }
  }

  async loginWithGitHub(code: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/rest/s1/novel-anime/auth/oauth/github', { code })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message || 'GitHub登录失败' }
    }
  }

  async getGoogleAuthUrl(): Promise<ApiResponse> {
    if (isDevelopment) {
      return { success: false, error: '开发模式下不支持OAuth登录' }
    }
    try {
      const response = await this.api.get('/rest/s1/novel-anime/auth/oauth/google/url')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message || '获取Google授权URL失败' }
    }
  }

  async loginWithGoogle(code: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/rest/s1/novel-anime/auth/oauth/google', { code })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Google登录失败' }
    }
  }

  async getWeChatQRCode(): Promise<ApiResponse> {
    if (isDevelopment) {
      return { success: false, error: '开发模式下不支持微信登录' }
    }
    try {
      const response = await this.api.get('/rest/s1/novel-anime/auth/wechat/qrcode')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message || '获取微信二维码失败' }
    }
  }

  async checkWeChatLoginStatus(ticket: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/rest/s1/novel-anime/auth/wechat/status', {
        params: { ticket }
      })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message || '检查微信状态失败' }
    }
  }
}

export const authApi = new AuthApiService()
