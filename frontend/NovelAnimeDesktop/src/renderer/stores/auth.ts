/**
 * Novel Anime Authentication Store
 * Manages user authentication state for Novel Anime Generator
 * Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.5, 6.1, 6.2, 7.1, 7.2, 7.3
 */
import { defineStore } from 'pinia'
import { authApi } from '../services/authApi'

// User interface for Novel Anime
export interface NovelAnimeUser {
  userId: string
  email: string
  username: string
  credits: number
  avatarUrl: string | null
  authProvider: 'local' | 'github' | 'google' | 'wechat'
  status: string
  createdDate: string
  lastLoginDate: string
}

// Registration credentials
export interface RegisterCredentials {
  email: string
  password: string
  username?: string
}

// Login credentials
export interface LoginCredentials {
  email: string
  password: string
}

// OAuth provider types
export type OAuthProvider = 'github' | 'google' | 'wechat'

// WeChat QR code response
export interface WeChatQRCodeResponse {
  qrCodeUrl: string
  ticket: string
  expireSeconds: number
}

// WeChat login status
export type WeChatLoginStatus = 'waiting' | 'scanned' | 'confirmed' | 'expired' | 'error'

// Auth state interface (Requirements: 2.3, 2.5)
export interface AuthState {
  user: NovelAnimeUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  oauthProvider: OAuthProvider | null
  wechatQRCode: WeChatQRCodeResponse | null
  wechatLoginStatus: WeChatLoginStatus | null
}

// Initial state
const getInitialState = (): AuthState => ({
  user: null,
  accessToken: localStorage.getItem('novel_anime_access_token'),
  refreshToken: localStorage.getItem('novel_anime_refresh_token'),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  oauthProvider: null,
  wechatQRCode: null,
  wechatLoginStatus: null
})

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    console.log('🔐 Auth store state initialized')
    return getInitialState()
  },

  getters: {
    isLoggedIn: (state) => !!state.accessToken && state.isAuthenticated,
    userCredits: (state) => state.user?.credits ?? 0,
    hasLowCredits: (state) => (state.user?.credits ?? 0) < 50,
    userAuthProvider: (state) => state.user?.authProvider ?? 'local',
    displayName: (state) => state.user?.username ?? state.user?.email?.split('@')[0] ?? 'User'
  },

  actions: {
    /**
     * Initialize auth store (Requirements: 3.3)
     */
    async initialize() {
      if (this.isInitialized) return
      
      if (this.accessToken) {
        await this.validateToken()
      }
      
      this.isInitialized = true
    },

    /**
     * Register a new user (Requirements: 1.1, 1.5)
     */
    async register(credentials: RegisterCredentials) {
      this.isLoading = true
      this.error = null

      try {
        const response = await authApi.register(credentials)

        if (response.success && response.data?.success) {
          this.accessToken = response.data.accessToken
          this.refreshToken = response.data.refreshToken
          this.user = response.data.user as NovelAnimeUser
          this.isAuthenticated = true
          this.oauthProvider = null
          this.persistTokens()
          return { success: true, user: this.user }
        } else {
          this.error = response.data?.message || response.error || '注册失败'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || '网络错误，请重试'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Login with email and password (Requirements: 2.1, 7.1)
     */
    async login(credentials: LoginCredentials) {
      this.isLoading = true
      this.error = null

      try {
        // Convert email to username for API compatibility
        const response = await authApi.login({
          username: credentials.email,
          password: credentials.password
        })

        if (response.success && response.data?.success) {
          this.accessToken = response.data.accessToken
          this.refreshToken = response.data.refreshToken
          this.user = response.data.user as NovelAnimeUser
          this.isAuthenticated = true
          this.oauthProvider = null
          this.persistTokens()
          return { success: true, user: this.user }
        } else {
          this.error = response.data?.message || response.error || '登录失败'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || '网络错误，请重试'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Logout user (Requirements: 6.1, 6.2)
     */
    async logout() {
      this.isLoading = true
      try {
        await authApi.logout()
      } catch (error) {
        console.error('Logout API call failed:', error)
      }
      this.clearAuthState()
      this.isLoading = false
      return { success: true }
    },

    /**
     * Validate token and auto-login (Requirements: 7.2, 7.3)
     */
    async validateToken() {
      if (!this.accessToken) {
        return { success: false, error: 'No token found' }
      }

      this.isLoading = true
      this.error = null

      try {
        const response = await authApi.validateToken()

        if (response.success && response.data?.valid) {
          this.user = response.data.user as NovelAnimeUser
          this.isAuthenticated = true
          return { success: true, user: this.user }
        } else {
          const refreshResult = await this.refreshAccessToken()
          if (refreshResult.success) {
            return { success: true, user: this.user }
          }
          this.clearAuthState()
          this.error = response.data?.message || 'Token无效，请重新登录'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.clearAuthState()
        this.error = error.message || '验证失败'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Refresh access token
     */
    async refreshAccessToken() {
      if (!this.refreshToken) {
        return { success: false, error: 'No refresh token' }
      }

      try {
        const response = await authApi.refreshToken(this.refreshToken)

        if (response.success && response.data?.success) {
          this.accessToken = response.data.accessToken
          this.refreshToken = response.data.refreshToken
          this.persistTokens()
          return { success: true }
        } else {
          this.clearAuthState()
          return { success: false, error: response.data?.message || 'Token刷新失败' }
        }
      } catch (error: any) {
        this.clearAuthState()
        return { success: false, error: error.message }
      }
    },

    /**
     * Login with GitHub OAuth (Requirements: 2.1.1, 2.1.2)
     */
    async loginWithGitHub(code: string) {
      this.isLoading = true
      this.error = null
      this.oauthProvider = 'github'

      try {
        const response = await authApi.loginWithGitHub(code)

        if (response.success && response.data?.success) {
          this.accessToken = response.data.accessToken
          this.refreshToken = response.data.refreshToken
          this.user = response.data.user as NovelAnimeUser
          this.isAuthenticated = true
          this.persistTokens()
          return { success: true, user: this.user }
        } else {
          this.error = response.data?.message || response.error || 'GitHub登录失败'
          this.oauthProvider = null
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || 'GitHub登录失败'
        this.oauthProvider = null
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async getGitHubAuthUrl() {
      try {
        const response = await authApi.getGitHubAuthUrl()
        if (response.success && response.data?.authUrl) {
          return { success: true, authUrl: response.data.authUrl }
        }
        return { success: false, error: '获取GitHub授权URL失败' }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    /**
     * Login with Google OAuth (Requirements: 2.2.1, 2.2.2)
     */
    async loginWithGoogle(code: string) {
      this.isLoading = true
      this.error = null
      this.oauthProvider = 'google'

      try {
        const response = await authApi.loginWithGoogle(code)

        if (response.success && response.data?.success) {
          this.accessToken = response.data.accessToken
          this.refreshToken = response.data.refreshToken
          this.user = response.data.user as NovelAnimeUser
          this.isAuthenticated = true
          this.persistTokens()
          return { success: true, user: this.user }
        } else {
          this.error = response.data?.message || response.error || 'Google登录失败'
          this.oauthProvider = null
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || 'Google登录失败'
        this.oauthProvider = null
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async getGoogleAuthUrl() {
      try {
        const response = await authApi.getGoogleAuthUrl()
        if (response.success && response.data?.authUrl) {
          return { success: true, authUrl: response.data.authUrl }
        }
        return { success: false, error: '获取Google授权URL失败' }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    /**
     * Initiate WeChat login (Requirements: 2.3.1)
     */
    async initiateWeChatLogin() {
      this.isLoading = true
      this.error = null
      this.oauthProvider = 'wechat'
      this.wechatLoginStatus = 'waiting'

      try {
        const response = await authApi.getWeChatQRCode()

        if (response.success && response.data?.success) {
          this.wechatQRCode = {
            qrCodeUrl: response.data.qrCodeUrl,
            ticket: response.data.ticket,
            expireSeconds: response.data.expireSeconds
          }
          return { success: true, qrCode: this.wechatQRCode }
        } else {
          this.error = response.data?.message || '获取微信二维码失败'
          this.oauthProvider = null
          this.wechatLoginStatus = 'error'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || '获取微信二维码失败'
        this.oauthProvider = null
        this.wechatLoginStatus = 'error'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Check WeChat login status (Requirements: 2.3.1, 2.3.2)
     */
    async checkWeChatLoginStatus() {
      if (!this.wechatQRCode?.ticket) {
        return { success: false, error: 'No WeChat ticket' }
      }

      try {
        const response = await authApi.checkWeChatLoginStatus(this.wechatQRCode.ticket)

        if (response.success && response.data) {
          this.wechatLoginStatus = response.data.status as WeChatLoginStatus

          if (response.data.status === 'confirmed' && response.data.accessToken) {
            this.accessToken = response.data.accessToken
            this.refreshToken = response.data.refreshToken
            this.user = response.data.user as NovelAnimeUser
            this.isAuthenticated = true
            this.wechatQRCode = null
            this.persistTokens()
            return { success: true, status: 'confirmed', user: this.user }
          }

          return { success: true, status: response.data.status }
        } else {
          return { success: false, error: response.data?.message || '检查状态失败' }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },

    cancelWeChatLogin() {
      this.wechatQRCode = null
      this.wechatLoginStatus = null
      if (this.oauthProvider === 'wechat') {
        this.oauthProvider = null
      }
    },

    updateCredits(newBalance: number) {
      if (this.user) {
        this.user.credits = newBalance
      }
    },

    persistTokens() {
      if (this.accessToken) {
        localStorage.setItem('novel_anime_access_token', this.accessToken)
      }
      if (this.refreshToken) {
        localStorage.setItem('novel_anime_refresh_token', this.refreshToken)
      }
      // Store user ID and user data for API calls
      if (this.user) {
        if (this.user.userId) {
          localStorage.setItem('novel_anime_user_id', this.user.userId)
        }
        localStorage.setItem('novel_anime_user_data', JSON.stringify(this.user))
      }
    },

    clearAuthState() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      this.error = null
      this.oauthProvider = null
      this.wechatQRCode = null
      this.wechatLoginStatus = null
      localStorage.removeItem('novel_anime_access_token')
      localStorage.removeItem('novel_anime_refresh_token')
    },

    clearError() {
      this.error = null
    },

    /**
     * Validate token expiration (Requirements: 2.5)
     * Feature: 08-02-auth-diagnosis-fix
     */
    validateTokenExpiration(): boolean {
      if (!this.accessToken) {
        console.warn('[Auth] No access token to validate')
        return false
      }

      try {
        // Decode JWT token (simple base64 decode)
        const parts = this.accessToken.split('.')
        if (parts.length !== 3) {
          console.error('[Auth] Invalid token format')
          return false
        }

        const payload = JSON.parse(atob(parts[1]))
        const exp = payload.exp

        if (!exp) {
          console.warn('[Auth] Token has no expiration time')
          return true // Assume valid if no expiration
        }

        const isExpired = Date.now() >= exp * 1000
        if (isExpired) {
          console.warn('[Auth] Token is expired')
        }

        return !isExpired
      } catch (error) {
        console.error('[Auth] Failed to validate token:', error)
        return false
      }
    },

    /**
     * Get auth state for diagnostics (Requirements: 6.1)
     * Feature: 08-02-auth-diagnosis-fix
     */
    getAuthState() {
      return {
        isAuthenticated: this.isAuthenticated,
        hasAccessToken: !!this.accessToken,
        hasRefreshToken: !!this.refreshToken,
        hasUser: !!this.user,
        userId: this.user?.userId || null,
        username: this.user?.username || null,
        authProvider: this.oauthProvider,
        isTokenValid: this.validateTokenExpiration()
      }
    },

    /**
     * Debug auth state to console (Requirements: 6.4)
     * Feature: 08-02-auth-diagnosis-fix
     */
    debugAuthState() {
      console.log('=== Auth Store State ===')
      console.log('Authenticated:', this.isAuthenticated)
      console.log('Access Token:', this.accessToken ? '✓ Present' : '✗ Missing')
      console.log('Refresh Token:', this.refreshToken ? '✓ Present' : '✗ Missing')
      console.log('User:', this.user ? '✓ Present' : '✗ Missing')
      if (this.user) {
        console.log('  User ID:', this.user.userId)
        console.log('  Username:', this.user.username)
        console.log('  Email:', this.user.email)
      }
      console.log('Token Valid:', this.validateTokenExpiration() ? '✓ Yes' : '✗ No')
      console.log('OAuth Provider:', this.oauthProvider || 'None')
      console.log('========================')
    },

    /**
     * Load tokens from localStorage (Requirements: 2.4)
     * Feature: 08-02-auth-diagnosis-fix
     */
    loadTokens() {
      const accessToken = localStorage.getItem('novel_anime_access_token')
      const refreshToken = localStorage.getItem('novel_anime_refresh_token')
      const userId = localStorage.getItem('novel_anime_user_id')
      const userData = localStorage.getItem('novel_anime_user_data')

      if (accessToken) {
        this.accessToken = accessToken
      }
      if (refreshToken) {
        this.refreshToken = refreshToken
      }
      if (userData) {
        try {
          this.user = JSON.parse(userData) as NovelAnimeUser
        } catch (error) {
          console.error('[Auth] Failed to parse user data:', error)
        }
      }

      // Validate loaded tokens
      if (this.accessToken && this.validateTokenExpiration()) {
        this.isAuthenticated = true
      } else if (this.accessToken) {
        console.warn('[Auth] Loaded token is expired, clearing auth state')
        this.clearAuthState()
      }
    }
  }
})
