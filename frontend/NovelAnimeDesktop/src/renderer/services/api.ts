import axios, { AxiosInstance } from 'axios'

/**
 * API Service for Novel Anime Generator
 * Handles communication with the Moqui backend
 */
class ApiService {
  private baseURL: string
  public axiosInstance: AxiosInstance
  private isDevelopment: boolean

  constructor() {
    // Updated to match our backend API structure - 使用 import.meta.env 替代 process.env
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/rest/s1/novel-anime'
    this.isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true'
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.isDevelopment ? 5000 : 30000, // 开发模式下使用较短超时
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: any) => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        console.error('API Error:', error)
        
        // 在开发模式下，如果是网络错误，返回模拟数据
        if (this.isDevelopment && (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR')) {
          console.warn('Backend not available, using mock data')
          return this.getMockResponse(error.config)
        }
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          // Redirect to login if needed
        }
        
        return Promise.reject(error)
      }
    )
  }

  /**
   * 开发模式下的模拟响应
   */
  private getMockResponse(config: any) {
    const url = config.url || ''
    const method = config.method || 'get'
    
    // 模拟成功响应
    const mockResponse = {
      data: {
        success: true,
        message: 'Mock response (backend not available)',
        // 根据不同的API返回不同的模拟数据
        ...(url.includes('/projects') && { projects: [] }),
        ...(url.includes('/novels') && { novels: [] }),
        ...(url.includes('/characters') && { characters: [] }),
        ...(url.includes('/credits') && { credits: 1000 })
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    }
    
    return Promise.resolve(mockResponse)
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/auth/status')
      return response.status === 200
    } catch (error) {
      console.error('API connection test failed:', error)
      return false
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/auth/user')
      return response.data
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{
    success: boolean
    token?: string
    user?: any
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.post('/auth/login', {
        email,
        password
      })

      if (response.data.success) {
        const token = response.data.token
        if (token) {
          localStorage.setItem('auth_token', token)
        }
        
        return {
          success: true,
          token: token,
          user: response.data.user
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed'
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      }
    }
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, username?: string): Promise<{
    success: boolean
    token?: string
    user?: any
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.post('/auth/register', {
        email,
        password,
        username
      })

      if (response.data.success) {
        const token = response.data.token
        if (token) {
          localStorage.setItem('auth_token', token)
        }
        
        return {
          success: true,
          token: token,
          user: response.data.user
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed'
        }
      }
    } catch (error: any) {
      console.error('Registration failed:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      }
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<boolean> {
    try {
      await this.axiosInstance.post('/auth/logout')
      localStorage.removeItem('auth_token')
      return true
    } catch (error) {
      console.error('Logout failed:', error)
      localStorage.removeItem('auth_token') // Remove token anyway
      return false
    }
  }

  /**
   * Get user credits
   */
  async getCredits(): Promise<{
    credits: number
    history?: Array<any>
  }> {
    try {
      const response = await this.axiosInstance.get('/credits')
      return {
        credits: response.data.credits || 0,
        history: response.data.history || []
      }
    } catch (error) {
      console.error('Failed to get credits:', error)
      return { credits: 0 }
    }
  }

  /**
   * Get projects list
   */
  async getProjects(userId?: string): Promise<Array<any>> {
    try {
      const params = userId ? { userId } : {}
      const response = await this.axiosInstance.get('/projects', { params })
      return response.data.projects || []
    } catch (error) {
      console.error('Failed to get projects:', error)
      return []
    }
  }

  /**
   * Create new project
   */
  async createProject(data: {
    name: string
    description?: string
  }): Promise<{
    success: boolean
    project?: any
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.post('/projects', data)
      
      return {
        success: response.data.success || true,
        project: response.data.project,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Failed to create project:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create project'
      }
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService