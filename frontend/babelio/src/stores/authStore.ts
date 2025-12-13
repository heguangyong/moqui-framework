import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface User {
  userId: string
  username: string
  userFullName?: string
  emailAddress?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('jwt_access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('jwt_refresh_token'))
  const loading = ref(false)

  const isLoggedIn = computed(() => !!accessToken.value)

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const response = await axios.post('/rest/s1/moqui/auth/login', {
        username,
        password
      })
      const result = response.data

      if (result.success && result.accessToken) {
        accessToken.value = result.accessToken
        refreshToken.value = result.refreshToken
        localStorage.setItem('jwt_access_token', result.accessToken)
        if (result.refreshToken) {
          localStorage.setItem('jwt_refresh_token', result.refreshToken)
        }
        user.value = result.user || {
          userId: result.userId,
          username: username,
          userFullName: result.userFullName
        }
        // 保存用户信息到 localStorage
        localStorage.setItem('babelio_user', JSON.stringify(user.value))
        return { success: true }
      }
      return { success: false, message: result.message || '登录失败' }
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.response?.data?.errors || '登录失败，请检查用户名和密码'
      return { success: false, message: errMsg }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('jwt_access_token')
    localStorage.removeItem('jwt_refresh_token')
    localStorage.removeItem('babelio_user')
  }

  async function checkAuth() {
    if (!accessToken.value) return false
    // 如果已有 user 信息，直接返回 true（避免 verify API 权限问题）
    if (user.value) return true
    // 从 localStorage 恢复用户信息
    const savedUser = localStorage.getItem('babelio_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
        return true
      } catch {
        // ignore
      }
    }
    // 有 token 但没有用户信息，认为已登录
    return true
  }

  // 兼容旧的 token 属性
  const token = computed(() => accessToken.value)

  return { user, token, accessToken, refreshToken, loading, isLoggedIn, login, logout, checkAuth }
})
