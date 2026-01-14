# 移动端前端系统设计文档

## 概述

基于Quasar Framework构建的AI原生移动应用系统，实现跨平台统一体验，与Moqui后端完美集成，提供完整的业务功能和多模态AI交互能力。

## 技术架构

### 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                   移动端应用架构                             │
├─────────────────────────────────────────────────────────────┤
│  Vue 3.5 + Quasar 2.18 + TypeScript + Capacitor          │
├─────────────────────────────────────────────────────────────┤
│     Pinia状态管理  │  Vue Router  │  AI服务集成             │
├─────────────────────────────────────────────────────────────┤
│        JWT认证     │   REST API   │   WebSocket             │
├─────────────────────────────────────────────────────────────┤
│              Moqui Framework 后端服务                       │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈选择

#### 前端框架
- **Vue 3.5**: 现代响应式框架，Composition API
- **Quasar 2.18**: 跨平台UI框架，Material Design
- **TypeScript 5.9**: 类型安全和开发体验
- **Vite 7.x**: 快速构建工具

#### 移动端集成
- **Capacitor 7.x**: 原生功能访问
- **PWA**: 渐进式Web应用支持
- **Cordova插件**: 扩展原生功能

#### 状态管理
- **Pinia 3.x**: 现代状态管理
- **Vue Router 4.x**: 路由管理
- **VueUse**: 组合式工具库

## 项目结构设计

### 目录结构
```
mobile-app/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── common/         # 通用组件
│   │   ├── ai/             # AI交互组件
│   │   └── business/       # 业务组件
│   ├── pages/              # 页面组件
│   │   ├── auth/           # 认证页面
│   │   ├── dashboard/      # 仪表板
│   │   ├── hivemind/       # 项目管理
│   │   ├── marketplace/    # 供需撮合
│   │   └── commerce/       # 电商功能
│   ├── layouts/            # 布局组件
│   ├── stores/             # Pinia状态管理
│   │   ├── auth.ts         # 认证状态
│   │   ├── user.ts         # 用户状态
│   │   ├── ai.ts           # AI服务状态
│   │   └── business.ts     # 业务状态
│   ├── services/           # API服务层
│   │   ├── api.ts          # 基础API服务
│   │   ├── auth.ts         # 认证服务
│   │   ├── ai.ts           # AI服务
│   │   └── business.ts     # 业务服务
│   ├── composables/        # 组合式函数
│   ├── utils/              # 工具函数
│   └── types/              # TypeScript类型
├── src-capacitor/          # Capacitor配置
├── src-pwa/               # PWA配置
└── quasar.config.ts       # Quasar配置
```

## 核心组件设计

### 1. 认证系统集成

#### JWT认证服务
```typescript
// services/auth.ts
export class AuthService {
  private api: ApiService
  
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const response = await this.api.post('/rest/s1/auth/login', credentials)
    
    if (response.success) {
      // 存储JWT token
      await this.storeToken(response.token)
      // 更新用户状态
      await this.updateUserProfile()
      return { success: true, user: response.user }
    }
    
    return { success: false, error: response.message }
  }
  
  async refreshToken(): Promise<boolean> {
    try {
      const response = await this.api.post('/rest/s1/auth/refresh')
      await this.storeToken(response.token)
      return true
    } catch (error) {
      await this.logout()
      return false
    }
  }
  
  private async storeToken(token: string): Promise<void> {
    await Preferences.set({ key: 'auth_token', value: token })
  }
}
```

#### 认证状态管理
```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  const login = async (credentials: LoginCredentials) => {
    const authService = new AuthService()
    const result = await authService.login(credentials)
    
    if (result.success) {
      isAuthenticated.value = true
      user.value = result.user
      token.value = result.token
    }
    
    return result
  }
  
  const logout = async () => {
    await Preferences.remove({ key: 'auth_token' })
    isAuthenticated.value = false
    user.value = null
    token.value = null
  }
  
  return {
    isAuthenticated,
    user,
    token,
    login,
    logout
  }
})
```

### 2. AI服务集成

#### 多模态AI组件
```vue
<!-- components/ai/MultimodalInput.vue -->
<template>
  <div class="multimodal-input">
    <!-- 文本输入 -->
    <q-input
      v-model="textInput"
      placeholder="输入消息或问题..."
      @keyup.enter="sendMessage"
    >
      <template v-slot:append>
        <q-btn flat round icon="send" @click="sendMessage" />
      </template>
    </q-input>
    
    <!-- 语音输入 -->
    <q-btn
      :color="isRecording ? 'negative' : 'primary'"
      :icon="isRecording ? 'stop' : 'mic'"
      round
      @click="toggleRecording"
    />
    
    <!-- 图像输入 -->
    <q-btn
      color="secondary"
      icon="camera_alt"
      round
      @click="captureImage"
    />
    
    <!-- AI响应显示 -->
    <div v-if="aiResponse" class="ai-response">
      <q-card class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle2">AI助手回复：</div>
          <div class="q-mt-sm">{{ aiResponse }}</div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAIStore } from 'stores/ai'

const aiStore = useAIStore()
const textInput = ref('')
const isRecording = ref(false)
const aiResponse = ref('')

const sendMessage = async () => {
  if (!textInput.value.trim()) return
  
  const response = await aiStore.sendTextMessage(textInput.value)
  aiResponse.value = response.content
  textInput.value = ''
}

const toggleRecording = async () => {
  if (isRecording.value) {
    const audioBlob = await aiStore.stopRecording()
    const response = await aiStore.sendVoiceMessage(audioBlob)
    aiResponse.value = response.content
  } else {
    await aiStore.startRecording()
  }
  isRecording.value = !isRecording.value
}

const captureImage = async () => {
  const imageBlob = await aiStore.captureImage()
  const response = await aiStore.sendImageMessage(imageBlob)
  aiResponse.value = response.content
}
</script>
```

#### AI服务状态管理
```typescript
// stores/ai.ts
export const useAIStore = defineStore('ai', () => {
  const isProcessing = ref(false)
  const conversationHistory = ref<AIMessage[]>([])
  
  const sendTextMessage = async (text: string): Promise<AIResponse> => {
    isProcessing.value = true
    
    try {
      const response = await aiService.sendText({
        message: text,
        context: conversationHistory.value
      })
      
      // 更新对话历史
      conversationHistory.value.push(
        { role: 'user', content: text },
        { role: 'assistant', content: response.content }
      )
      
      return response
    } finally {
      isProcessing.value = false
    }
  }
  
  const sendVoiceMessage = async (audioBlob: Blob): Promise<AIResponse> => {
    isProcessing.value = true
    
    try {
      // 先转换为文字
      const transcription = await aiService.speechToText(audioBlob)
      // 然后处理文字消息
      return await sendTextMessage(transcription.text)
    } finally {
      isProcessing.value = false
    }
  }
  
  const sendImageMessage = async (imageBlob: Blob): Promise<AIResponse> => {
    isProcessing.value = true
    
    try {
      const response = await aiService.analyzeImage({
        image: imageBlob,
        context: conversationHistory.value
      })
      
      conversationHistory.value.push(
        { role: 'user', content: '[图片]', image: imageBlob },
        { role: 'assistant', content: response.content }
      )
      
      return response
    } finally {
      isProcessing.value = false
    }
  }
  
  return {
    isProcessing,
    conversationHistory,
    sendTextMessage,
    sendVoiceMessage,
    sendImageMessage
  }
})
```

### 3. 业务功能集成

#### 统一API服务层
```typescript
// services/api.ts
export class ApiService {
  private baseURL = 'http://localhost:8080'
  private authStore = useAuthStore()
  
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    }
    
    // 添加JWT认证头
    if (this.authStore.token) {
      headers.Authorization = `Bearer ${this.authStore.token}`
    }
    
    try {
      const response = await fetch(`${this.baseURL}${config.url}`, {
        method: config.method || 'GET',
        headers,
        body: config.data ? JSON.stringify(config.data) : undefined
      })
      
      if (response.status === 401) {
        // Token过期，尝试刷新
        const refreshed = await this.authStore.refreshToken()
        if (refreshed) {
          // 重试原请求
          return this.request(config)
        } else {
          // 刷新失败，跳转登录
          await this.authStore.logout()
          throw new Error('Authentication required')
        }
      }
      
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error) {
      return { success: false, error: error.message, status: 0 }
    }
  }
  
  get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params) : ''
    return this.request({ url: url + queryString, method: 'GET' })
  }
  
  post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request({ url, method: 'POST', data })
  }
}
```

#### 业务服务集成
```typescript
// services/business.ts
export class BusinessService {
  private api = new ApiService()
  
  // HiveMind项目管理
  async getProjects(): Promise<Project[]> {
    const response = await this.api.get('/rest/s1/hivemind/projects')
    return response.data || []
  }
  
  async createTask(projectId: string, task: CreateTaskRequest): Promise<Task> {
    const response = await this.api.post(`/rest/s1/hivemind/projects/${projectId}/tasks`, task)
    return response.data
  }
  
  // Marketplace供需撮合
  async getSupplyDemands(): Promise<SupplyDemand[]> {
    const response = await this.api.get('/rest/s1/marketplace/supply-demands')
    return response.data || []
  }
  
  async createSupplyDemand(data: CreateSupplyDemandRequest): Promise<SupplyDemand> {
    const response = await this.api.post('/rest/s1/marketplace/supply-demands', data)
    return response.data
  }
  
  // PopCommerce电商
  async getProducts(): Promise<Product[]> {
    const response = await this.api.get('/rest/s1/commerce/products')
    return response.data || []
  }
  
  async createOrder(order: CreateOrderRequest): Promise<Order> {
    const response = await this.api.post('/rest/s1/commerce/orders', order)
    return response.data
  }
}
```

## 跨平台部署配置

### Capacitor配置
```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.moqui.mobile',
  appName: 'Moqui AI Mobile',
  webDir: 'dist/spa',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#1976d2',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Camera: {
      permissions: ['camera', 'photos']
    },
    Microphone: {
      permissions: ['microphone']
    }
  }
}

export default config
```

### PWA配置
```typescript
// quasar.config.ts - PWA部分
pwa: {
  workboxMode: 'generateSW',
  injectPwaMetaTags: true,
  swFilename: 'sw.js',
  manifestFilename: 'manifest.json',
  useCredentialsForManifestTag: false,
  manifest: {
    name: 'Moqui AI Mobile',
    short_name: 'Moqui AI',
    description: 'AI原生移动应用平台',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#1976d2',
    icons: [
      {
        src: 'icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png'
      },
      {
        src: 'icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'icons/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png'
      },
      {
        src: 'icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: 'icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
}
```

## 性能优化策略

### 代码分割
```typescript
// router/routes.ts
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/DashboardPage.vue')
      },
      {
        path: '/hivemind',
        component: () => import(/* webpackChunkName: "hivemind" */ 'pages/HiveMindPage.vue')
      },
      {
        path: '/marketplace',
        component: () => import(/* webpackChunkName: "marketplace" */ 'pages/MarketplacePage.vue')
      },
      {
        path: '/commerce',
        component: () => import(/* webpackChunkName: "commerce" */ 'pages/CommercePage.vue')
      }
    ]
  }
]
```

### 缓存策略
```typescript
// utils/cache.ts
export class CacheManager {
  private storage = new Map<string, CacheItem>()
  
  set(key: string, data: any, ttl: number = 300000): void {
    this.storage.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }
  
  get(key: string): any | null {
    const item = this.storage.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.storage.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.storage.clear()
  }
}
```

## 测试策略

### 单元测试
```typescript
// tests/components/MultimodalInput.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import MultimodalInput from 'src/components/ai/MultimodalInput.vue'

describe('MultimodalInput', () => {
  it('should send text message when enter is pressed', async () => {
    const pinia = createPinia()
    const wrapper = mount(MultimodalInput, {
      global: {
        plugins: [pinia]
      }
    })
    
    const input = wrapper.find('input')
    await input.setValue('Hello AI')
    await input.trigger('keyup.enter')
    
    // 验证消息发送
    expect(wrapper.emitted('message-sent')).toBeTruthy()
  })
})
```

### 端到端测试
```typescript
// tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test'

test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/')
  
  // 填写登录表单
  await page.fill('[data-testid="username"]', 'john.doe')
  await page.fill('[data-testid="password"]', 'moqui')
  await page.click('[data-testid="login-button"]')
  
  // 验证跳转到仪表板
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
})
```

---

**设计版本**: v1.0  
**最后更新**: 2025年1月13日  
**设计状态**: 完成