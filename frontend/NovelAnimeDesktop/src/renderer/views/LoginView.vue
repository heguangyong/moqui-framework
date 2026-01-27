<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <div class="logo-icon">📚</div>
          <h1 class="app-title">Novel Anime</h1>
          <p class="app-subtitle">AI驱动的小说动漫生成器</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="login-username">用户名 / 邮箱</label>
            <input
              id="login-username"
              v-model="loginForm.username"
              type="text"
              placeholder="请输入用户名或邮箱"
              required
            />
          </div>

          <div class="form-group">
            <label for="login-password">密码</label>
            <div class="password-input">
              <input
                id="login-password"
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                required
              />
              <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div v-if="userStore.error || authStore.error" class="error-message">
            {{ userStore.error || authStore.error }}
          </div>

          <button type="submit" class="submit-btn" :disabled="userStore.isLoading || authStore.isLoading">
            {{ (userStore.isLoading || authStore.isLoading) ? '登录中...' : '登录' }}
          </button>
        </form>

        <!-- Third-party Login -->
        <div class="oauth-section">
          <div class="divider">
            <span>第三方登录</span>
          </div>
          
          <div class="oauth-buttons">
            <button 
              class="oauth-btn google" 
              @click="handleGoogleLogin"
              :disabled="authStore.oauthProvider === 'google'"
            >
              <svg class="oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            <button 
              class="oauth-btn wechat" 
              @click="handleWeChatLogin"
              :disabled="authStore.oauthProvider === 'wechat'"
            >
              <svg class="oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" fill="#07C160"/>
              </svg>
              微信
            </button>
          </div>
        </div>
      </div>
      
      <!-- Version Info -->
      <div class="version-info">
        v{{ APP_VERSION }}
      </div>
    </div>

    <!-- WeChat QR Code Dialog -->
    <div v-if="showWeChatDialog" class="dialog-overlay" @click.self="handleCancelWeChatLogin">
      <div class="wechat-dialog">
        <div class="dialog-header">
          <h3>微信扫码登录</h3>
          <button class="close-btn" @click="handleCancelWeChatLogin">✕</button>
        </div>
        <div class="dialog-content">
          <div v-if="authStore.wechatQRCode" class="qrcode-container">
            <img :src="authStore.wechatQRCode.qrCodeUrl" alt="WeChat QR Code" />
          </div>
          <div v-else class="loading">加载中...</div>
          <p class="status-text">{{ wechatStatusText }}</p>
          <button 
            v-if="authStore.wechatLoginStatus === 'expired'" 
            class="refresh-btn"
            @click="handleWeChatLogin"
          >
            刷新二维码
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'
import { useUIStore } from '../stores/ui'
import { APP_VERSION } from '../utils/versionManager.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const uiStore = useUIStore()

// Form states
const loginForm = ref({
  username: 'john.doe',
  password: 'moqui'
})

// Password visibility
const showPassword = ref(false)

// WeChat dialog
const showWeChatDialog = ref(false)
let wechatPollingInterval: ReturnType<typeof setInterval> | null = null

const wechatStatusText = computed(() => {
  switch (authStore.wechatLoginStatus) {
    case 'waiting': return '请使用微信扫描二维码'
    case 'scanned': return '已扫描，请在手机上确认'
    case 'confirmed': return '登录成功！'
    case 'expired': return '二维码已过期，请刷新'
    case 'error': return '出错了，请重试'
    default: return '加载中...'
  }
})

// Handle login
const handleLogin = async () => {
  authStore.clearError()
  userStore.clearError()
  
  // Validate form
  if (!loginForm.value.username || !loginForm.value.password) {
    uiStore.addNotification({
      type: 'warning',
      title: '表单验证',
      message: '请填写用户名/邮箱和密码'
    })
    return
  }
  
  // Use userStore for login (Requirements: 4.1, 4.2)
  // 支持用户名或邮箱登录
  const result = await userStore.login(
    loginForm.value.username,
    loginForm.value.password
  )

  if (result.success) {
    // 重置导航状态，确保显示默认仪表盘
    const { useNavigationStore } = await import('../stores/navigation')
    const navigationStore = useNavigationStore()
    navigationStore.setActiveNav('dashboard')
    navigationStore.resetPanelContext('dashboard')
    
    uiStore.addNotification({
      type: 'success',
      title: '登录成功',
      message: `欢迎回来，${userStore.displayName}！`
    })
    // Navigate to dashboard on success
    const redirectPath = route.query.redirect as string || '/dashboard'
    router.push(redirectPath)
  } else {
    uiStore.addNotification({
      type: 'error',
      title: '登录失败',
      message: result.error || '请检查用户名/邮箱和密码'
    })
  }
}

// Handle Google login
const handleGoogleLogin = async () => {
  const result = await authStore.getGoogleAuthUrl()
  
  if (result.success && result.authUrl) {
    uiStore.addNotification({
      type: 'info',
      title: 'Google 登录',
      message: '正在跳转到 Google 授权页面...'
    })
    window.location.href = result.authUrl
  } else {
    uiStore.addNotification({
      type: 'error',
      title: 'Google 登录失败',
      message: result.error || '无法获取授权链接'
    })
  }
}

// Handle WeChat login
const handleWeChatLogin = async () => {
  showWeChatDialog.value = true
  
  const result = await authStore.initiateWeChatLogin()
  
  if (result.success) {
    startWeChatPolling()
  } else {
    uiStore.addNotification({
      type: 'error',
      title: '微信登录失败',
      message: result.error || '无法获取二维码'
    })
  }
}

const startWeChatPolling = () => {
  stopWeChatPolling()
  
  wechatPollingInterval = setInterval(async () => {
    const result = await authStore.checkWeChatLoginStatus()
    
    if (result.success) {
      if (result.status === 'confirmed') {
        stopWeChatPolling()
        showWeChatDialog.value = false
        uiStore.addNotification({
          type: 'success',
          title: '微信登录成功',
          message: `欢迎，${authStore.displayName}！`
        })
        const redirectPath = route.query.redirect as string || '/'
        router.push(redirectPath)
      } else if (result.status === 'expired') {
        stopWeChatPolling()
        uiStore.addNotification({
          type: 'warning',
          title: '二维码已过期',
          message: '请点击刷新重新获取'
        })
      }
    }
  }, 2000)
}

const stopWeChatPolling = () => {
  if (wechatPollingInterval) {
    clearInterval(wechatPollingInterval)
    wechatPollingInterval = null
  }
}

const handleCancelWeChatLogin = () => {
  stopWeChatPolling()
  authStore.cancelWeChatLogin()
  showWeChatDialog.value = false
}

onUnmounted(() => {
  stopWeChatPolling()
})
</script>

<style scoped lang="scss">
/* 登录页面 - 与系统灰色调风格一致 */
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #8a8a8a;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.version-info {
  text-align: center;
  margin-top: 16px;
  font-size: 11px;
  color: #6a6a6c;
  opacity: 0.8;
}

.login-card {
  background: #b0b0b0;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .logo-icon {
    font-size: 48px;
    margin-bottom: 12px;
    filter: grayscale(30%);
  }

  .app-title {
    font-size: 22px;
    font-weight: 700;
    color: #2c2c2e;
    margin: 0 0 6px;
    letter-spacing: 0.5px;
  }

  .app-subtitle {
    font-size: 13px;
    color: #5a5a5c;
    margin: 0;
  }
}

.auth-form {
  .form-group {
    margin-bottom: 18px;

    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #3c3c3e;
      margin-bottom: 6px;
    }

    input {
      width: 100%;
      padding: 12px 14px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      background-color: #c8c8c8;
      color: #2c2c2e;
      box-sizing: border-box;
      transition: all 0.15s ease;

      &::placeholder {
        color: #7a7a7c;
      }

      &:hover {
        background-color: #d0d0d0;
      }

      &:focus {
        outline: none;
        background-color: #e8e8e8;
        border: 1px solid rgba(122, 145, 136, 0.5);
      }
    }
  }

  .password-input {
    position: relative;

    input {
      padding-right: 44px;
    }

    .toggle-password {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      opacity: 0.6;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }
  }

  .field-error {
    font-size: 12px;
    color: #c0392b;
    margin-top: 4px;
  }
}

.error-message {
  background: rgba(192, 57, 43, 0.15);
  color: #922b21;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
  border: 1px solid rgba(192, 57, 43, 0.2);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background-color: #7a9188;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background-color: #6a8178;
  }

  &:active:not(:disabled) {
    background-color: #5a7168;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.oauth-section {
  margin-top: 32px;

  .divider {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    &::before, &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(0, 0, 0, 0.1);
    }

    span {
      padding: 0 14px;
      font-size: 12px;
      color: #6a6a6c;
      font-weight: 500;
    }
  }

  .oauth-buttons {
    display: flex;
    gap: 12px;

    .oauth-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.3);
      font-size: 13px;
      font-weight: 500;
      color: #3c3c3e;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.5);
        border-color: rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .oauth-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
    }
  }
}

/* WeChat Dialog - 灰色调风格 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.wechat-dialog {
  background: #b0b0b0;
  border-radius: 14px;
  width: 320px;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c2c2e;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #6a6a6c;
      transition: color 0.2s;

      &:hover {
        color: #3c3c3e;
      }
    }
  }

  .dialog-content {
    padding: 24px;
    text-align: center;

    .qrcode-container {
      margin-bottom: 16px;
      padding: 12px;
      background: #fff;
      border-radius: 10px;
      display: inline-block;

      img {
        width: 180px;
        height: 180px;
      }
    }

    .loading {
      padding: 60px 0;
      color: #6a6a6c;
    }

    .status-text {
      font-size: 14px;
      color: #5a5a5c;
      margin: 0;
    }

    .refresh-btn {
      margin-top: 16px;
      padding: 10px 28px;
      background: #424242;
      color: #e8e8e8;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #525252;
      }
    }
  }
}
</style>
