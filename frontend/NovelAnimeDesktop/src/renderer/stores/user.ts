/**
 * Novel Anime User Store
 * Manages unified user profile state combining UserAccount and NovelAnimeUser data
 * 
 * This store is designed to work with the refactored user system where:
 * - UserAccount (Moqui built-in) handles authentication (username, email, password)
 * - NovelAnimeUser (business extension) stores app-specific data (credits, avatarUrl, status)
 * 
 * Requirements: 4.1, 4.2, 4.4
 */
import { defineStore } from 'pinia'
import { authApi } from '../services/authApi'

// User profile interface combining UserAccount and NovelAnimeUser data
export interface UserProfile {
  userId: string
  username: string
  email: string
  fullName: string
  credits: number
  avatarUrl: string | null
  status: 'active' | 'suspended' | 'inactive'
}

// User store state interface
export interface UserState {
  userId: string | null
  username: string
  email: string
  fullName: string
  credits: number
  avatarUrl: string | null
  status: 'active' | 'suspended' | 'inactive'
  isLoggedIn: boolean
  isLoading: boolean
  error: string | null
}

// localStorage keys for persistence
const STORAGE_KEYS = {
  USER_DATA: 'novel_anime_user_data',
  SESSION_TOKEN: 'novel_anime_access_token'
}

// Get initial state from localStorage or defaults
const getInitialState = (): UserState => {
  // Try to restore from localStorage
  const savedData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
  
  if (savedData && hasToken) {
    try {
      const parsed = JSON.parse(savedData)
      return {
        userId: parsed.userId || null,
        username: parsed.username || '',
        email: parsed.email || '',
        fullName: parsed.fullName || '',
        credits: parsed.credits || 0,
        avatarUrl: parsed.avatarUrl || null,
        status: parsed.status || 'active',
        isLoggedIn: true,
        isLoading: false,
        error: null
      }
    } catch (e) {
      console.warn('Failed to parse saved user data:', e)
    }
  }
  
  return {
    userId: null,
    username: '',
    email: '',
    fullName: '',
    credits: 0,
    avatarUrl: null,
    status: 'active',
    isLoggedIn: false,
    isLoading: false,
    error: null
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    console.log('👤 User store initialized')
    return getInitialState()
  },

  getters: {
    /**
     * Display name - prefer fullName, fallback to username, then email prefix
     */
    displayName: (state): string => {
      if (state.fullName) return state.fullName
      if (state.username) return state.username
      if (state.email) return state.email.split('@')[0]
      return 'User'
    },

    /**
     * Check if user has low credits (below 50)
     */
    hasLowCredits: (state): boolean => state.credits < 50,

    /**
     * Check if user account is active
     */
    isActive: (state): boolean => state.status === 'active',

    /**
     * Get user initials for avatar fallback
     */
    initials: (state): string => {
      if (state.fullName) {
        const parts = state.fullName.split(' ')
        if (parts.length >= 2) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return state.fullName.substring(0, 2).toUpperCase()
      }
      if (state.username) {
        return state.username.substring(0, 2).toUpperCase()
      }
      return 'U'
    }
  },

  actions: {
    /**
     * Fetch user profile from backend
     * Combines UserAccount and NovelAnimeUser data
     * Requirements: 4.1
     */
    async fetchProfile(): Promise<{ success: boolean; error?: string }> {
      if (!this.isLoggedIn && !localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)) {
        return { success: false, error: 'Not logged in' }
      }

      this.isLoading = true
      this.error = null

      try {
        const response = await authApi.validateToken()

        if (response.success && response.data?.valid && response.data?.user) {
          const user = response.data.user
          this.setUserData({
            userId: user.userId,
            username: user.username || '',
            email: user.email || user.emailAddress || '',
            fullName: user.userFullName || user.fullName || '',
            credits: user.credits || 0,
            avatarUrl: user.avatarUrl || null,
            status: user.status || 'active'
          })
          return { success: true }
        } else {
          this.error = response.error || 'Failed to fetch profile'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || 'Network error'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Login user with credentials (username or email)
     * Requirements: 4.1, 4.2
     */
    async login(usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> {
      this.isLoading = true
      this.error = null

      // Clear old tokens before login
      localStorage.removeItem('novel_anime_access_token')
      localStorage.removeItem('novel_anime_refresh_token')
      localStorage.removeItem('novel_anime_user_id')

      try {
        const response = await authApi.login({ username: usernameOrEmail, password })
        console.log('🔐 Login response:', response)

        if (response.success && response.data?.success && response.data?.user) {
          // Save tokens to localStorage
          if (response.data.accessToken) {
            console.log('🔑 Saving access token:', response.data.accessToken.substring(0, 50) + '...')
            localStorage.setItem('novel_anime_access_token', response.data.accessToken)
          }
          if (response.data.refreshToken) {
            localStorage.setItem('novel_anime_refresh_token', response.data.refreshToken)
          }
          
          const user = response.data.user
          // Save userId for API calls
          if (user.userId) {
            localStorage.setItem('novel_anime_user_id', user.userId)
            console.log('👤 Saved userId:', user.userId)
          }
          
          this.setUserData({
            userId: user.userId,
            username: user.username || '',
            email: user.email || user.emailAddress || '',
            fullName: user.userFullName || user.fullName || '',
            credits: user.credits || 500,
            avatarUrl: user.avatarUrl || null,
            status: user.status || 'active'
          })
          return { success: true }
        } else {
          this.error = response.data?.message || response.error || 'Login failed'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || 'Network error'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Logout user and clear all state
     * Requirements: 4.4
     */
    async logout(): Promise<{ success: boolean }> {
      this.isLoading = true

      try {
        await authApi.logout()
      } catch (error) {
        console.warn('Logout API call failed:', error)
      }

      this.clearUserData()
      this.isLoading = false
      return { success: true }
    },

    /**
     * Set user data and persist to localStorage
     */
    setUserData(data: Partial<UserProfile>) {
      if (data.userId !== undefined) this.userId = data.userId
      if (data.username !== undefined) this.username = data.username
      if (data.email !== undefined) this.email = data.email
      if (data.fullName !== undefined) this.fullName = data.fullName
      if (data.credits !== undefined) this.credits = data.credits
      if (data.avatarUrl !== undefined) this.avatarUrl = data.avatarUrl
      if (data.status !== undefined) this.status = data.status as UserState['status']
      
      this.isLoggedIn = !!this.userId
      this.persistToStorage()
    },

    /**
     * Update credits balance
     */
    updateCredits(newBalance: number) {
      this.credits = newBalance
      this.persistToStorage()
    },

    /**
     * Clear all user data and remove from localStorage
     */
    clearUserData() {
      this.userId = null
      this.username = ''
      this.email = ''
      this.fullName = ''
      this.credits = 0
      this.avatarUrl = null
      this.status = 'active'
      this.isLoggedIn = false
      this.error = null
      
      // Clear all auth-related localStorage keys
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
      localStorage.removeItem('novel_anime_refresh_token')
      localStorage.removeItem('novel_anime_user_id')
      
      console.log('🧹 All user data and tokens cleared from localStorage')
    },

    /**
     * Persist user data to localStorage
     */
    persistToStorage() {
      const data = {
        userId: this.userId,
        username: this.username,
        email: this.email,
        fullName: this.fullName,
        credits: this.credits,
        avatarUrl: this.avatarUrl,
        status: this.status
      }
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data))
    },

    /**
     * Clear error state
     */
    clearError() {
      this.error = null
    },

    /**
     * Initialize store from storage on app load
     */
    initializeFromStorage() {
      const savedData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
      const hasToken = !!localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
      
      if (savedData && hasToken) {
        try {
          const parsed = JSON.parse(savedData)
          this.setUserData(parsed)
          console.log('👤 User data restored from storage')
        } catch (e) {
          console.warn('Failed to restore user data:', e)
          this.clearUserData()
        }
      }
    },

    /**
     * Update user profile (fullName, avatarUrl)
     * Requirements: 8.3
     */
    async updateProfile(data: { fullName?: string; avatarUrl?: string }): Promise<{ success: boolean; error?: string }> {
      this.isLoading = true
      this.error = null

      try {
        const response = await authApi.updateProfile(data)

        if (response.success && response.data?.success) {
          // Update local state with new values
          if (data.fullName !== undefined) {
            this.fullName = data.fullName
          }
          if (data.avatarUrl !== undefined) {
            this.avatarUrl = data.avatarUrl
          }
          
          // If server returned updated user, use that
          if (response.data.user) {
            const user = response.data.user
            this.setUserData({
              userId: user.userId || this.userId,
              username: user.username || this.username,
              email: user.email || this.email,
              fullName: user.fullName || this.fullName,
              credits: user.credits ?? this.credits,
              avatarUrl: user.avatarUrl ?? this.avatarUrl,
              status: user.status || this.status
            })
          } else {
            this.persistToStorage()
          }
          
          return { success: true }
        } else {
          this.error = response.data?.message || response.error || 'Failed to update profile'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || 'Network error'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Change user password
     * Requirements: 8.4
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
      this.isLoading = true
      this.error = null

      try {
        const response = await authApi.changePassword({ currentPassword, newPassword })

        if (response.success && response.data?.success) {
          return { success: true }
        } else {
          this.error = response.data?.message || response.error || 'Failed to change password'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || 'Network error'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Upload user avatar image
     */
    async uploadAvatar(file: File): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
      this.isLoading = true
      this.error = null

      try {
        const response = await authApi.uploadAvatar(file)

        if (response.success && response.data?.success) {
          const avatarUrl = response.data.avatarUrl
          this.avatarUrl = avatarUrl
          this.persistToStorage()
          return { success: true, avatarUrl }
        } else {
          this.error = response.data?.message || response.error || 'Failed to upload avatar'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.message || 'Network error'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    }
  }
})
