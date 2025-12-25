import axios, { AxiosInstance } from 'axios'

// Vite 环境变量类型声明
declare global {
  interface ImportMeta {
    env: {
      VITE_API_BASE_URL?: string
      VITE_DEV_MODE?: string
      DEV?: boolean
      [key: string]: any
    }
  }
}

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
    // 更宽松的开发模式检测：Vite DEV 模式、环境变量、或者 localhost URL
    this.isDevelopment = import.meta.env.DEV === true || 
                         import.meta.env.VITE_DEV_MODE === 'true' ||
                         this.baseURL.includes('localhost')
    
    console.log('🔧 ApiService initialized:', {
      baseURL: this.baseURL,
      isDevelopment: this.isDevelopment,
      'import.meta.env.DEV': import.meta.env.DEV
    })
    
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
   * Test API connection - 检测后端服务是否可用
   */
  async testConnection(): Promise<boolean> {
    try {
      // 尝试调用一个简单的 API 来检测连接
      // 使用 projects 端点因为它不需要认证
      const response = await this.axiosInstance.get('/projects', {
        params: { userId: 'test-user-001' },
        timeout: 3000 // 短超时用于快速检测
      })
      console.log('✅ Backend connection test:', response.status === 200 ? 'OK' : 'Failed')
      return response.status === 200
    } catch (error: any) {
      // 如果有响应（即使是错误响应），说明后端是可用的
      if (error.response) {
        console.log('✅ Backend is reachable (status:', error.response.status, ')')
        return true
      }
      console.error('❌ Backend connection test failed:', error.message)
      return false
    }
  }

  /**
   * Test AI service availability - 检测 AI 服务是否可用
   */
  async testAIService(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/ai/status', {
        timeout: 3000
      })
      return response.data?.available === true || response.data?.success === true
    } catch (error: any) {
      // 如果后端返回了响应，检查 AI 配置状态
      if (error.response?.data) {
        return error.response.data.available === true
      }
      // AI 服务可能未配置，但这不是错误
      console.warn('AI service status check failed:', error.message)
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
  async getProjects(userId?: string): Promise<{
    success: boolean
    projects: Array<any>
    message?: string
  }> {
    try {
      // 确保有 userId
      let effectiveUserId = userId || localStorage.getItem('novel_anime_user_id')
      if (!effectiveUserId) {
        effectiveUserId = await this.getOrCreateDefaultUser()
      }
      
      const response = await this.axiosInstance.get('/projects', { 
        params: { userId: effectiveUserId } 
      })
      
      return {
        success: true,
        projects: response.data.projects || response.data || []
      }
    } catch (error: any) {
      console.error('Failed to get projects:', error)
      // 如果有 mock 响应数据
      if (error.response?.data) {
        return {
          success: error.response.data.success !== false,
          projects: error.response.data.projects || []
        }
      }
      return {
        success: false,
        projects: [],
        message: error.message
      }
    }
  }

  /**
   * Get or create default user for development
   * Returns userId that can be used for API calls
   */
  async getOrCreateDefaultUser(): Promise<string> {
    // Check if we have a stored userId
    const storedUserId = localStorage.getItem('novel_anime_user_id')
    if (storedUserId) {
      return storedUserId
    }
    
    // Try to register a default test user
    try {
      const testEmail = `test_${Date.now()}@novelanime.local`
      const response = await this.axiosInstance.post('/auth/register', {
        email: testEmail,
        password: 'test123456',
        username: '测试用户'
      })
      
      if (response.data.success && response.data.user?.userId) {
        const newUserId: string = response.data.user.userId
        localStorage.setItem('novel_anime_user_id', newUserId)
        console.log('✅ Created default user:', newUserId)
        return newUserId
      }
    } catch (error) {
      console.warn('Failed to create default user:', error)
    }
    
    // Fallback: use a hardcoded test userId (for development only)
    const fallbackUserId = 'test-user-001'
    localStorage.setItem('novel_anime_user_id', fallbackUserId)
    return fallbackUserId
  }

  /**
   * Create new project
   */
  async createProject(data: {
    name: string
    description?: string
    userId?: string
  }): Promise<{
    success: boolean
    project?: any
    message?: string
  }> {
    try {
      // Ensure we have a userId
      let userId = data.userId || localStorage.getItem('novel_anime_user_id')
      if (!userId) {
        userId = await this.getOrCreateDefaultUser()
      }
      
      const response = await this.axiosInstance.post('/projects', {
        name: data.name,
        description: data.description,
        userId: userId
      })
      
      const responseData = response.data
      return {
        success: responseData.success !== false,
        project: responseData.project,
        message: responseData.message
      }
    } catch (error: any) {
      console.error('Failed to create project:', error)
      // 如果错误响应中有数据，尝试使用它（可能是 mock 数据）
      if (error.response?.data) {
        return {
          success: error.response.data.success !== false,
          project: error.response.data.project,
          message: error.response.data.message
        }
      }
      return {
        success: false,
        message: error.message || 'Failed to create project'
      }
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService