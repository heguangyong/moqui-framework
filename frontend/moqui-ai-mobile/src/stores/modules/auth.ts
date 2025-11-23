// 认证状态管理
import { defineStore } from 'pinia'
import { moquiApi } from '@/services/api/base'

export interface User {
  userId: string
  username: string
  firstName?: string
  lastName?: string
  email?: string
  roles: string[]
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: localStorage.getItem('jwt_access_token'),
    refreshToken: localStorage.getItem('jwt_refresh_token'),
    user: null,
    isAuthenticated: false,
    isLoading: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.accessToken && state.isAuthenticated,
    hasRole: (state) => (role: string) => {
      return state.user?.roles?.includes(role) || false
    }
  },

  actions: {
    /**
     * 用户登录
     */
    async login(credentials: LoginCredentials) {
      this.isLoading = true

      try {
        const response = await moquiApi.post('/rest/s1/moqui/auth/login', credentials)

        if (response.success && response.data?.success) {
          this.accessToken = response.data.accessToken
          this.refreshToken = response.data.refreshToken
          this.user = response.data.user
          this.isAuthenticated = true

          // 持久化存储
          localStorage.setItem('jwt_access_token', this.accessToken)
          localStorage.setItem('jwt_refresh_token', this.refreshToken)

          return { success: true }
        } else {
          return {
            success: false,
            error: response.data?.message || response.error || '登录失败'
          }
        }
      } catch (error: any) {
        console.error('Login failed:', error)
        return {
          success: false,
          error: error.message || '网络错误，请重试'
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 刷新Token
     */
    async refreshAccessToken() {
      if (!this.refreshToken) {
        this.logout()
        return false
      }

      try {
        const response = await moquiApi.post('/rest/s1/moqui/auth/refresh', {
          refreshToken: this.refreshToken
        })

        if (response.success && response.data?.success) {
          this.accessToken = response.data.accessToken
          localStorage.setItem('jwt_access_token', this.accessToken)
          return true
        } else {
          this.logout()
          return false
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.logout()
        return false
      }
    },

    /**
     * 用户登出
     */
    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      this.isAuthenticated = false

      localStorage.removeItem('jwt_access_token')
      localStorage.removeItem('jwt_refresh_token')
    },

    /**
     * 初始化认证状态
     */
    async initializeAuth() {
      if (this.accessToken) {
        this.isLoading = true

        try {
          // 验证当前token有效性
          const response = await moquiApi.get('/rest/s1/moqui/auth/validate')

          if (response.success && response.data?.valid) {
            this.user = response.data.user
            this.isAuthenticated = true
          } else {
            // Token无效，尝试刷新
            const refreshSuccess = await this.refreshAccessToken()
            if (!refreshSuccess) {
              this.logout()
            }
          }
        } catch (error) {
          console.error('Auth initialization failed:', error)
          this.logout()
        } finally {
          this.isLoading = false
        }
      }
    },

    /**
     * 检查权限
     */
    checkPermission(permission: string): boolean {
      return this.user?.roles?.some(role =>
        role === 'ADMIN' || role.includes(permission)
      ) || false
    }
  }
})