/**
 * Authentication API Service
 * Handles all auth-related API calls
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
  username: string
  password: string
}

class AuthApiService {
  private api: AxiosInstance
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
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
    localStorage.removeItem('novel_anime_user_data')
    localStorage.removeItem('novel_anime_user_id')
  }

  // Auth APIs
  async register(data: RegisterRequest): Promise<ApiResponse> {
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
    try {
      const response = await this.api.post('/rest/s1/novel-anime/auth/logout')
      this.clearTokens()
      return { success: true, data: response.data }
    } catch (error: any) {
      this.clearTokens()
      return {
        success: false,
        error: error.response?.data?.message || error.message || '登出失败'
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse> {
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

  async updateProfile(data: { fullName?: string; avatarUrl?: string }): Promise<ApiResponse> {
    try {
      const response = await this.api.put('/rest/s1/novel-anime/auth/profile', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '更新资料失败'
      }
    }
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/rest/s1/novel-anime/auth/change-password', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '修改密码失败'
      }
    }
  }

  async uploadAvatar(file: File): Promise<ApiResponse> {
    try {
      const base64 = await this.fileToBase64(file)
      const response = await this.api.post('/rest/s1/novel-anime/auth/avatar', {
        imageData: base64,
        filename: file.name
      })
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '上传头像失败'
      }
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

export const authApi = new AuthApiService()
