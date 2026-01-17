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
        const token = localStorage.getItem('novel_anime_access_token')
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
          localStorage.removeItem('novel_anime_access_token')
          localStorage.removeItem('novel_anime_refresh_token')
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
      // 使用 auth/status 端点检测连接，不需要 userId
      const response = await this.axiosInstance.get('/auth/status', {
        timeout: 3000
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
        const token = response.data.token || response.data.accessToken
        if (token) {
          localStorage.setItem('novel_anime_access_token', token)
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
        const token = response.data.token || response.data.accessToken
        if (token) {
          localStorage.setItem('novel_anime_access_token', token)
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
      localStorage.removeItem('novel_anime_access_token')
      localStorage.removeItem('novel_anime_refresh_token')
      return true
    } catch (error) {
      console.error('Logout failed:', error)
      localStorage.removeItem('novel_anime_access_token')
      localStorage.removeItem('novel_anime_refresh_token')
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
    // 优先使用登录用户的 userId
    const userData = localStorage.getItem('novel_anime_user_data')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.userId) {
          localStorage.setItem('novel_anime_user_id', user.userId)
          return user.userId
        }
      } catch (e) {
        console.warn('Failed to parse user data:', e)
      }
    }
    
    // Check if we have a stored userId
    const storedUserId = localStorage.getItem('novel_anime_user_id')
    if (storedUserId && storedUserId !== 'test-user-001') {
      return storedUserId
    }
    
    // 开发模式下使用默认用户 ID (john.doe 的 userId)
    if (this.isDevelopment) {
      const defaultUserId = 'EX_JOHN_DOE'
      localStorage.setItem('novel_anime_user_id', defaultUserId)
      console.log('🔧 Using default development userId:', defaultUserId)
      return defaultUserId
    }
    
    // 如果没有登录用户，返回空字符串让后端处理
    console.warn('No valid userId found, user should login first')
    return ''
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

  /**
   * Update project status
   */
  async updateProject(projectId: string, data: {
    name?: string
    description?: string
    status?: string
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.put(`/project/${projectId}`, data)
      return {
        success: response.data?.success !== false,
        message: response.data?.message
      }
    } catch (error: any) {
      console.error('Failed to update project:', error)
      return {
        success: false,
        message: error.message || 'Failed to update project'
      }
    }
  }

  // ========== Workflow API ==========

  /**
   * Get workflows list
   */
  async getWorkflows(params?: {
    projectId?: string
    userId?: string
    status?: string
  }): Promise<{
    success: boolean
    workflows: Array<any>
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get('/workflows', { params })
      return {
        success: true,
        workflows: response.data.workflows || []
      }
    } catch (error: any) {
      console.error('Failed to get workflows:', error)
      return {
        success: false,
        workflows: [],
        message: error.message
      }
    }
  }

  /**
   * Get single workflow
   */
  async getWorkflow(workflowId: string): Promise<{
    success: boolean
    workflow?: any
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get(`/workflow/${workflowId}`)
      return {
        success: true,
        workflow: response.data.workflow
      }
    } catch (error: any) {
      console.error('Failed to get workflow:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Create workflow
   */
  async createWorkflow(data: {
    projectId?: string
    userId?: string
    name: string
    description?: string
    status?: string
    nodes?: Array<any>
    connections?: Array<any>
  }): Promise<{
    success: boolean
    workflowId?: string
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.post('/workflow', data)
      return {
        success: true,
        workflowId: response.data.workflowId
      }
    } catch (error: any) {
      console.error('Failed to create workflow:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(workflowId: string, data: {
    name?: string
    description?: string
    status?: string
    nodes?: Array<any>
    connections?: Array<any>
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      await this.axiosInstance.put(`/workflow/${workflowId}`, data)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to update workflow:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId: string): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      await this.axiosInstance.delete(`/workflow/${workflowId}`)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to delete workflow:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  // ========== Workflow Execution API ==========

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(params?: {
    workflowId?: string
    status?: string
  }): Promise<{
    success: boolean
    executions: Array<any>
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get('/workflow-executions', { params })
      return {
        success: true,
        executions: response.data.executions || []
      }
    } catch (error: any) {
      console.error('Failed to get workflow executions:', error)
      return {
        success: false,
        executions: [],
        message: error.message
      }
    }
  }

  /**
   * Get single workflow execution
   */
  async getWorkflowExecution(executionId: string): Promise<{
    success: boolean
    execution?: any
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get(`/workflow-execution/${executionId}`)
      return {
        success: true,
        execution: response.data.execution
      }
    } catch (error: any) {
      console.error('Failed to get workflow execution:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Create workflow execution
   */
  async createWorkflowExecution(data: {
    workflowId: string
    workflowName?: string
    status?: string
    nodeCount?: number
    logs?: Array<any>
  }): Promise<{
    success: boolean
    executionId?: string
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.post('/workflow-execution', data)
      return {
        success: true,
        executionId: response.data.executionId
      }
    } catch (error: any) {
      console.error('Failed to create workflow execution:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Update workflow execution
   */
  async updateWorkflowExecution(executionId: string, data: {
    status?: string
    endTime?: string
    duration?: number
    logs?: Array<any>
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      await this.axiosInstance.put(`/workflow-execution/${executionId}`, data)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to update workflow execution:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  // ========== Workflow Template API ==========

  /**
   * Get workflow templates
   */
  async getWorkflowTemplates(params?: {
    userId?: string
    isBuiltIn?: string
  }): Promise<{
    success: boolean
    templates: Array<any>
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get('/workflow-templates', { params })
      return {
        success: true,
        templates: response.data.templates || []
      }
    } catch (error: any) {
      console.error('Failed to get workflow templates:', error)
      return {
        success: false,
        templates: [],
        message: error.message
      }
    }
  }

  /**
   * Get single workflow template
   */
  async getWorkflowTemplate(templateId: string): Promise<{
    success: boolean
    template?: any
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get(`/workflow-template/${templateId}`)
      return {
        success: true,
        template: response.data.template
      }
    } catch (error: any) {
      console.error('Failed to get workflow template:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Create workflow template
   */
  async createWorkflowTemplate(data: {
    userId?: string
    name: string
    description?: string
    isBuiltIn?: string
    nodeCount?: number
    estimatedTime?: string
    useCase?: string
    nodes?: Array<any>
    connections?: Array<any>
  }): Promise<{
    success: boolean
    templateId?: string
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.post('/workflow-template', data)
      return {
        success: true,
        templateId: response.data.templateId
      }
    } catch (error: any) {
      console.error('Failed to create workflow template:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Update workflow template
   */
  async updateWorkflowTemplate(templateId: string, data: {
    name?: string
    description?: string
    nodeCount?: number
    estimatedTime?: string
    useCase?: string
    nodes?: Array<any>
    connections?: Array<any>
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      await this.axiosInstance.put(`/workflow-template/${templateId}`, data)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to update workflow template:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Delete workflow template
   */
  async deleteWorkflowTemplate(templateId: string): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.delete(`/workflow-template/${templateId}`)
      return {
        success: response.data?.success !== false,
        message: response.data?.message
      }
    } catch (error: any) {
      console.error('Failed to delete workflow template:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  // ========== Asset API ==========

  /**
   * Get assets list
   */
  async getAssets(params?: {
    projectId?: string
    novelId?: string
    userId?: string
    assetType?: string
  }): Promise<{
    success: boolean
    assets: Array<any>
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get('/assets', { params })
      return {
        success: true,
        assets: response.data.assets || []
      }
    } catch (error: any) {
      console.error('Failed to get assets:', error)
      return {
        success: false,
        assets: [],
        message: error.message
      }
    }
  }

  /**
   * Get single asset
   */
  async getAsset(assetId: string): Promise<{
    success: boolean
    asset?: any
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get(`/asset/${assetId}`)
      return {
        success: true,
        asset: response.data.asset
      }
    } catch (error: any) {
      console.error('Failed to get asset:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Create asset
   */
  async createAsset(data: {
    projectId?: string
    novelId?: string
    userId?: string
    assetType: string
    name: string
    description?: string
    filePath?: string
    fileSize?: number
    metadata?: any
    version?: string
    isShared?: string
  }): Promise<{
    success: boolean
    assetId?: string
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.post('/asset', data)
      return {
        success: true,
        assetId: response.data.assetId
      }
    } catch (error: any) {
      console.error('Failed to create asset:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Update asset
   */
  async updateAsset(assetId: string, data: {
    name?: string
    description?: string
    filePath?: string
    fileSize?: number
    metadata?: any
    version?: string
    isShared?: string
  }): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      await this.axiosInstance.put(`/asset/${assetId}`, data)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to update asset:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      await this.axiosInstance.delete(`/asset/${assetId}`)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to delete asset:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  // ========== Novel API ==========

  /**
   * Get single novel with chapters
   */
  async getNovel(novelId: string): Promise<{
    success: boolean
    novel?: any
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get(`/novel/${novelId}`)
      return {
        success: true,
        novel: response.data.novel || response.data
      }
    } catch (error: any) {
      console.error('Failed to get novel:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Get novels list
   */
  async getNovels(projectId?: string): Promise<{
    success: boolean
    novels: Array<any>
    message?: string
  }> {
    try {
      const response = await this.axiosInstance.get('/novels', {
        params: projectId ? { projectId } : undefined
      })
      return {
        success: true,
        novels: response.data.novels || []
      }
    } catch (error: any) {
      console.error('Failed to get novels:', error)
      return {
        success: false,
        novels: [],
        message: error.message
      }
    }
  }

  // ========== User Settings API ==========

  /**
   * Get user settings
   */
  async getUserSettings(userId?: string): Promise<{
    success: boolean
    settings?: any
    message?: string
  }> {
    try {
      const effectiveUserId = userId || await this.getOrCreateDefaultUser()
      const response = await this.axiosInstance.get('/user-settings', {
        params: { userId: effectiveUserId }
      })
      return {
        success: true,
        settings: response.data.settings
      }
    } catch (error: any) {
      console.error('Failed to get user settings:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(data: {
    userId?: string
    theme?: string
    language?: string
    notifications?: {
      email?: boolean
      push?: boolean
    }
    defaultWorkflowTemplate?: string
    autoSave?: boolean
  }): Promise<{
    success: boolean
    settings?: any
    message?: string
  }> {
    try {
      const effectiveUserId = data.userId || await this.getOrCreateDefaultUser()
      const response = await this.axiosInstance.put('/user-settings', {
        ...data,
        userId: effectiveUserId
      })
      return {
        success: true,
        settings: response.data.settings
      }
    } catch (error: any) {
      console.error('Failed to update user settings:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService