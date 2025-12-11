// Moqui API服务基类
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { networkMonitor, offlineCacheService } from '@/services/network'
import { errorMessageService } from '@/services/error'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  cached?: boolean // 标记请求是否被缓存（离线模式）
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

  // 通用请求方法 - 支持离线缓存 (Requirements 5.2, 5.3)
  async request<T>(method: string, url: string, data?: any, options?: { offlineCache?: boolean }): Promise<ApiResponse<T>> {
    const shouldCache = options?.offlineCache && ['post', 'put', 'delete'].includes(method.toLowerCase())

    // 检查网络状态 (Requirements 5.2)
    if (!networkMonitor.isOnline() && shouldCache) {
      // 离线模式：缓存请求
      try {
        await offlineCacheService.cacheRequest({
          url: this.api.defaults.baseURL + url,
          method: method.toUpperCase() as 'POST' | 'PUT' | 'DELETE',
          body: data,
          headers: {
            Authorization: localStorage.getItem('jwt_access_token') || ''
          }
        })
        return {
          success: true,
          cached: true,
          message: '请求已缓存，将在网络恢复后自动提交'
        }
      } catch (cacheError) {
        console.error('Failed to cache offline request:', cacheError)
        return {
          success: false,
          error: '离线缓存失败'
        }
      }
    }

    try {
      let response: AxiosResponse
      if (method.toLowerCase() === 'get' || method.toLowerCase() === 'delete') {
        response = await this.api[method.toLowerCase() as 'get' | 'delete'](url)
      } else {
        response = await this.api[method.toLowerCase() as 'post' | 'put'](url, data)
      }
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error(`API ${method.toUpperCase()} ${url} failed:`, error)
      
      // 使用错误消息服务获取友好的错误信息 (Requirements 7.1)
      const errorInfo = errorMessageService.parseApiError(error)
      
      return {
        success: false,
        error: errorInfo.message,
        message: errorInfo.suggestion
      }
    }
  }

  // 便捷方法
  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('get', url)
  }

  async post<T>(url: string, data?: any, options?: { offlineCache?: boolean }): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, data, options)
  }

  async put<T>(url: string, data?: any, options?: { offlineCache?: boolean }): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, data, options)
  }

  async delete<T>(url: string, options?: { offlineCache?: boolean }): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url, undefined, options)
  }

  // 支持离线缓存的POST请求
  async postWithOfflineSupport<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.post<T>(url, data, { offlineCache: true })
  }

  // 支持离线缓存的PUT请求
  async putWithOfflineSupport<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.put<T>(url, data, { offlineCache: true })
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