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

        <!-- Tab Toggle -->
        <div class="tab-toggle">
          <button 
            :class="['tab-btn', { active: activeTab === 'login' }]"
            @click="activeTab = 'login'"
          >
            登录
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'register' }]"
            @click="activeTab = 'register'"
          >
            注册
          </button>
        </div>

        <!-- Login Form -->
        <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
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

        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="register-email">邮箱</label>
            <input
              id="register-email"
              v-model="registerForm.email"
              type="email"
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div class="form-group">
            <label for="register-username">用户名 (可选)</label>
            <input
              id="register-username"
              v-model="registerForm.username"
              type="text"
              placeholder="请输入用户名"
            />
          </div>

          <div class="form-group">
            <label for="register-password">密码</label>
            <div class="password-input">
              <input
                id="register-password"
                v-model="registerForm.password"
                :type="showRegisterPassword ? 'text' : 'password'"
                placeholder="至少8个字符"
                required
                minlength="8"
              />
              <button type="button" class="toggle-password" @click="showRegisterPassword = !showRegisterPassword">
                {{ showRegisterPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <!-- Password Strength -->
            <div class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :style="{ width: passwordStrength * 100 + '%' }"
                  :class="passwordStrengthClass"
                ></div>
              </div>
              <span class="strength-text" :class="passwordStrengthClass">{{ passwordStrengthText }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="register-confirm">确认密码</label>
            <div class="password-input">
              <input
                id="register-confirm"
                v-model="registerForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="再次输入密码"
                required
              />
              <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                {{ showConfirmPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div v-if="registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword" class="field-error">
              两次密码不一致
            </div>
          </div>

          <div v-if="authStore.error" class="error-message">
            {{ authStore.error }}
          </div>

          <button 
            type="submit" 
            class="submit-btn" 
            :disabled="authStore.isLoading || registerForm.password !== registerForm.confirmPassword"
          >
            {{ authStore.isLoading ? '注册中...' : '注册' }}
          </button>

          <p class="credits-hint">注册即可获得 <strong>500</strong> 积分</p>
        </form>

        <!-- Third-party Login -->
        <div class="oauth-section">
          <div class="divider">
            <span>第三方登录</span>
          </div>
          
          <div class="oauth-buttons">
            <button 
              class="oauth-btn github" 
              @click="handleGitHubLogin"
              :disabled="authStore.oauthProvider === 'github'"
            >
              <span class="oauth-icon">🐙</span>
              GitHub
            </button>

            <button 
              class="oauth-btn google" 
              @click="handleGoogleLogin"
              :disabled="authStore.oauthProvider === 'google'"
            >
              <span class="oauth-icon">🔍</span>
              Google
            </button>

            <button 
              class="oauth-btn wechat" 
              @click="handleWeChatLogin"
              :disabled="authStore.oauthProvider === 'wechat'"
            >
              <span class="oauth-icon">💬</span>
              微信
            </button>
          </div>
        </div>
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

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const uiStore = useUIStore()

// Tab state
const activeTab = ref('login')

// Form states
const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
})

// Password visibility
const showPassword = ref(false)
const showRegisterPassword = ref(false)
const showConfirmPassword = ref(false)

// WeChat dialog
const showWeChatDialog = ref(false)
let wechatPollingInterval: ReturnType<typeof setInterval> | null = null

// Password strength calculation
const passwordStrength = computed(() => {
  const password = registerForm.value.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength += 0.25
  if (password.length >= 12) strength += 0.25
  if (/[A-Z]/.test(password)) strength += 0.15
  if (/[a-z]/.test(password)) strength += 0.1
  if (/[0-9]/.test(password)) strength += 0.15
  if (/[^A-Za-z0-9]/.test(password)) strength += 0.1
  
  return Math.min(strength, 1)
})

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value < 0.3) return 'weak'
  if (passwordStrength.value < 0.6) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  if (!registerForm.value.password) return ''
  if (passwordStrength.value < 0.3) return '弱'
  if (passwordStrength.value < 0.6) return '中等'
  return '强'
})

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
    const { useNavigationStore } = await import('../stores/navigation.js')
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

// Handle register
const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    uiStore.addNotification({
      type: 'warning',
      title: '表单验证',
      message: '两次密码不一致'
    })
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.value.email)) {
    uiStore.addNotification({
      type: 'warning',
      title: '表单验证',
      message: '请输入有效的邮箱地址'
    })
    return
  }

  // Validate password length
  if (registerForm.value.password.length < 8) {
    uiStore.addNotification({
      type: 'warning',
      title: '表单验证',
      message: '密码至少需要8个字符'
    })
    return
  }

  authStore.clearError()
  
  const result = await authStore.register({
    email: registerForm.value.email,
    password: registerForm.value.password,
    username: registerForm.value.username || undefined
  })

  if (result.success) {
    uiStore.addNotification({
      type: 'success',
      title: '注册成功',
      message: `欢迎加入！您已获得 500 积分`
    })
    const redirectPath = route.query.redirect as string || '/'
    router.push(redirectPath)
  } else {
    uiStore.addNotification({
      type: 'error',
      title: '注册失败',
      message: result.error || '注册失败，请稍后重试'
    })
  }
}

// Handle GitHub login
const handleGitHubLogin = async () => {
  const result = await authStore.getGitHubAuthUrl()
  
  if (result.success && result.authUrl) {
    uiStore.addNotification({
      type: 'info',
      title: 'GitHub 登录',
      message: '正在跳转到 GitHub 授权页面...'
    })
    window.location.href = result.authUrl
  } else {
    uiStore.addNotification({
      type: 'error',
      title: 'GitHub 登录失败',
      message: result.error || '无法获取授权链接'
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

.login-card {
  background: linear-gradient(145deg, #b8b8b8, #a8a8a8);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;

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

.tab-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

  .tab-btn {
    flex: 1;
    padding: 10px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #5a5a5c;
    cursor: pointer;
    transition: all 0.2s ease;

    &.active {
      background: linear-gradient(145deg, #c8c8c8, #b8b8b8);
      color: #2c2c2e;
      box-shadow: 
        0 2px 6px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.1);
    }
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
      background: rgba(255, 255, 255, 0.5);
      color: #2c2c2e;
      box-sizing: border-box;
      box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.08),
        inset 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &::placeholder {
        color: #7a7a7c;
      }

      &:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.7);
        box-shadow: 
          inset 0 2px 4px rgba(0, 0, 0, 0.08),
          0 0 0 2px rgba(100, 100, 100, 0.2);
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

  .password-strength {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;

    .strength-bar {
      flex: 1;
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;

      .strength-fill {
        height: 100%;
        transition: width 0.3s;

        &.weak { background: #c0392b; }
        &.medium { background: #d68910; }
        &.strong { background: #27ae60; }
      }
    }

    .strength-text {
      font-size: 11px;
      font-weight: 500;
      &.weak { color: #c0392b; }
      &.medium { color: #d68910; }
      &.strong { color: #27ae60; }
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
  background: linear-gradient(180deg, #4a4a4a, #3a3a3a);
  color: #e8e8e8;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #5a5a5a, #4a4a4a);
    transform: translateY(-1px);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.credits-hint {
  text-align: center;
  font-size: 13px;
  color: #5a5a5c;
  margin-top: 14px;

  strong {
    color: #2c2c2e;
    font-weight: 700;
  }
}

.oauth-section {
  margin-top: 28px;

  .divider {
    display: flex;
    align-items: center;
    margin-bottom: 18px;

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
    gap: 10px;

    .oauth-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.3);
      font-size: 12px;
      font-weight: 500;
      color: #3c3c3e;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.5);
        border-color: rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .oauth-icon {
        font-size: 16px;
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
  background: linear-gradient(145deg, #b8b8b8, #a8a8a8);
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
      background: linear-gradient(180deg, #4a4a4a, #3a3a3a);
      color: #e8e8e8;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: linear-gradient(180deg, #5a5a5a, #4a4a4a);
      }
    }
  }
}
</style>
