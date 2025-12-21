/**
 * App Initialization Composable
 * Handles authentication check on app startup
 * Requirements: 7.2, 6.4
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCreditsStore } from '../stores/credits'
import { useUIStore } from '../stores/ui'

export function useAppInit() {
  const router = useRouter()
  const authStore = useAuthStore()
  const creditsStore = useCreditsStore()
  const uiStore = useUIStore()
  
  const isInitializing = ref(true)
  const initError = ref<string | null>(null)

  /**
   * Initialize app authentication state (Requirement 7.2)
   * Validates token on startup and loads user data
   */
  async function initializeAuth() {
    isInitializing.value = true
    initError.value = null

    try {
      // Check if we have a stored token
      if (authStore.accessToken) {
        // Validate token with backend (Requirement 7.2)
        const result = await authStore.validateToken()

        if (result.success) {
          // Token is valid, load credits balance
          await creditsStore.fetchBalance()
          console.log('Auth initialized successfully')
          
          // Show welcome back notification
          uiStore.addNotification({
            type: 'success',
            title: '欢迎回来',
            message: `${authStore.displayName}，您的积分余额：${creditsStore.formattedBalance}`
          })
        } else {
          // Token invalid, user needs to login (Requirement 7.3)
          console.log('Token invalid, redirecting to login')
          uiStore.addNotification({
            type: 'warning',
            title: '登录已过期',
            message: '请重新登录'
          })
          // Don't redirect here - let route guards handle it
        }
      } else {
        console.log('No token found')
      }
    } catch (error: any) {
      console.error('Auth initialization failed:', error)
      initError.value = error.message
      uiStore.addNotification({
        type: 'error',
        title: '初始化失败',
        message: '无法验证登录状态，请重新登录'
      })
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * Handle startup auth states (Requirement 6.4, 7.2, 7.3)
   */
  function handleStartupRedirect() {
    const currentPath = router.currentRoute.value.path
    
    // If not authenticated and not on login page, redirect to login
    if (!authStore.isAuthenticated && currentPath !== '/login') {
      router.push({
        path: '/login',
        query: { redirect: currentPath }
      })
    }
  }

  return {
    isInitializing,
    initError,
    initializeAuth,
    handleStartupRedirect
  }
}
