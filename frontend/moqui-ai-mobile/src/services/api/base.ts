// Moqui API服务基类
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class MoquiApiService {
  private api: AxiosInstance

  constructor(baseURL: string = 'http://localhost:8080') {
    this.api = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('jwt_access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器 - 统一错误处理
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Token过期，尝试刷新
          const refreshToken = localStorage.getItem('jwt_refresh_token')
          if (refreshToken) {
            try {
              const refreshResponse = await this.api.post('/rest/s1/moqui/auth/refresh', {
                refreshToken
              })

              if (refreshResponse.data.success) {
                localStorage.setItem('jwt_access_token', refreshResponse.data.accessToken)
                // 重新发送原请求
                error.config.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`
                return this.api.request(error.config)
              }
            } catch (refreshError) {
              // 刷新失败，清除token并跳转登录
              this.clearTokens()
              window.location.href = '/login'
            }
          } else {
            this.clearTokens()
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private clearTokens() {
    localStorage.removeItem('jwt_access_token')
    localStorage.removeItem('jwt_refresh_token')
  }

  // 通用请求方法
  async request<T>(method: string, url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api[method as keyof AxiosInstance](url, data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error(`API ${method.toUpperCase()} ${url} failed:`, error)
      return {
        success: false,
        error: error.message || 'API请求失败'
      }
    }
  }

  // 便捷方法
  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('get', url)
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, data)
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, data)
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url)
  }

  // 文件上传
  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error(`File upload to ${url} failed:`, error)
      return {
        success: false,
        error: error.message || '文件上传失败'
      }
    }
  }
}

// 导出单例实例
export const moquiApi = new MoquiApiService()