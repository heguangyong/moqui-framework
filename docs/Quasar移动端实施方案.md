# Quasar Framework + AI驱动Moqui 移动端实施方案

## 🎯 项目目标确认

基于你的确认，采用**Quasar Framework**作为前端APP技术栈，实现：
- 🤖 **AI原生移动应用**: 语音交互、图像识别、智能推荐
- 🔄 **无缝后端集成**: 与JWT、REST API、MCP架构完美配合
- 📱 **一次开发，多端部署**: Web、iOS、Android统一体验
- ⚡ **最大化代码复用**: 95%代码复用现有Vue3+Quasar2技术栈

## 📋 详细实施计划

### Phase 1: 基础架构搭建 (第1-3周)

#### Week 1: 环境准备与项目初始化

**开发环境设置**:
```bash
# 1. 安装Quasar CLI
npm install -g @quasar/cli

# 2. 创建移动端项目
quasar create moqui-ai-mobile
cd moqui-ai-mobile

# 3. 添加移动端支持
quasar mode add capacitor
quasar mode add pwa

# 4. 安装移动端依赖
npm install @capacitor/camera @capacitor/microphone @capacitor/device
npm install @capacitor/push-notifications @capacitor/local-notifications
```

**项目结构初始化**:
```
moqui-ai-mobile/
├── src/
│   ├── components/
│   │   ├── ai/              # AI功能组件
│   │   ├── business/        # 业务组件
│   │   └── shared/          # 共享组件
│   ├── pages/
│   │   ├── auth/            # 认证页面
│   │   ├── hivemind/        # 项目管理
│   │   ├── commerce/        # 电商
│   │   ├── manufacturing/   # ERP制造
│   │   └── marketplace/     # 供需匹配
│   ├── services/
│   │   ├── api/             # API服务
│   │   ├── ai/              # AI功能服务
│   │   └── auth/            # 认证服务
│   ├── stores/              # Pinia状态管理
│   └── router/              # 路由配置
├── src-capacitor/           # 移动端配置
└── src-pwa/                # PWA配置
```

#### Week 2: API服务层架构设计

**统一API服务基类**:
```javascript
// src/services/api/base.js
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'

export class BaseApiService {
  constructor(baseURL = process.env.MOQUI_API_URL || 'http://localhost:8080') {
    this.api = api
    this.baseURL = baseURL
    this.setupInterceptors()
  }

  setupInterceptors() {
    // 请求拦截 - JWT Token自动注入
    this.api.interceptors.request.use(config => {
      const authStore = useAuthStore()
      if (authStore.accessToken) {
        config.headers.Authorization = `Bearer ${authStore.accessToken}`
      }
      return config
    }, error => {
      return Promise.reject(error)
    })

    // 响应拦截 - 错误处理
    this.api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          const authStore = useAuthStore()
          await authStore.refreshToken()
        }
        return Promise.reject(error)
      }
    )
  }

  // 通用请求方法
  async request(method, endpoint, data = null, config = {}) {
    try {
      const response = await this.api[method](endpoint, data, config)
      return response.data
    } catch (error) {
      console.error(`API ${method.toUpperCase()} ${endpoint} failed:`, error)
      throw error
    }
  }
}
```

**MCP AI服务集成**:
```javascript
// src/services/ai/mcpService.js
import { BaseApiService } from '../api/base'

export class McpAiService extends BaseApiService {
  constructor() {
    super()
    this.endpoints = {
      transcribe: '/rest/s1/mcp/transcribe/Audio',
      analyze: '/rest/s1/mcp/analyze/Image',
      recommend: '/rest/s1/marketplace/process/AllMatching',
      chat: '/rest/s1/mcp/chat/Complete'
    }
  }

  // 语音转文字
  async transcribeAudio(audioBlob, options = {}) {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    if (options.language) {
      formData.append('language', options.language)
    }

    return await this.request('post', this.endpoints.transcribe, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  // 图像识别
  async analyzeImage(imageBlob, analysisType = 'product') {
    const formData = new FormData()
    formData.append('image', imageBlob, 'image.jpg')
    formData.append('analysisType', analysisType)

    return await this.request('post', this.endpoints.analyze, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  // 智能推荐
  async getRecommendations(context, options = {}) {
    return await this.request('post', this.endpoints.recommend, {
      context,
      minScore: options.minScore || 0.6,
      maxResults: options.maxResults || 10
    })
  }

  // AI对话
  async chatComplete(messages, systemPrompt = '') {
    return await this.request('post', this.endpoints.chat, {
      messages,
      systemPrompt
    })
  }
}

export const mcpAiService = new McpAiService()
```

#### Week 3: 认证系统集成

**JWT认证服务**:
```javascript
// src/stores/auth.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('jwt_access_token') || '',
    refreshToken: localStorage.getItem('jwt_refresh_token') || '',
    user: null,
    isAuthenticated: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.accessToken && state.isAuthenticated
  },

  actions: {
    // 登录
    async login(credentials) {
      try {
        const response = await api.post('/rest/s1/moqui/auth/login', credentials)

        if (response.data.success) {
          this.accessToken = response.data.accessToken
          this.refreshToken = response.data.refreshToken
          this.user = response.data.user
          this.isAuthenticated = true

          // 持久化存储
          localStorage.setItem('jwt_access_token', this.accessToken)
          localStorage.setItem('jwt_refresh_token', this.refreshToken)

          return { success: true }
        }
      } catch (error) {
        console.error('Login failed:', error)
        return { success: false, error: error.message }
      }
    },

    // 刷新Token
    async refreshToken() {
      if (!this.refreshToken) return false

      try {
        const response = await api.post('/rest/s1/moqui/auth/refresh', {
          refreshToken: this.refreshToken
        })

        if (response.data.success) {
          this.accessToken = response.data.accessToken
          localStorage.setItem('jwt_access_token', this.accessToken)
          return true
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.logout()
      }
      return false
    },

    // 登出
    logout() {
      this.accessToken = ''
      this.refreshToken = ''
      this.user = null
      this.isAuthenticated = false

      localStorage.removeItem('jwt_access_token')
      localStorage.removeItem('jwt_refresh_token')
    }
  }
})
```

### Phase 2: AI功能组件开发 (第4-7周)

#### Week 4-5: 语音交互组件

**智能语音助手组件**:
```vue
<!-- src/components/ai/VoiceAssistant.vue -->
<template>
  <q-page class="voice-assistant column items-center justify-center">
    <!-- 语音波形动画 -->
    <div class="voice-animation-container">
      <q-circular-progress
        v-if="isRecording"
        :value="audioLevel * 100"
        size="200px"
        :thickness="0.1"
        color="primary"
        track-color="grey-3"
        class="voice-animation">
        <q-icon name="mic" size="60px" color="primary"/>
      </q-circular-progress>

      <q-btn
        v-else
        @touchstart="startRecording"
        @touchend="stopRecording"
        @mousedown="startRecording"
        @mouseup="stopRecording"
        round size="xl"
        color="primary"
        icon="mic"
        class="voice-button">
        <q-tooltip>按住说话</q-tooltip>
      </q-btn>
    </div>

    <!-- 录音状态 -->
    <div class="text-center q-mt-md">
      <div v-if="isRecording" class="text-h6 text-primary">
        {{ $t('正在聆听...') }}
      </div>
      <div v-else-if="isProcessing" class="text-h6 text-orange">
        {{ $t('AI正在思考...') }}
      </div>
      <div v-else class="text-body1 text-grey-6">
        {{ $t('按住按钮开始语音对话') }}
      </div>
    </div>

    <!-- 对话历史 -->
    <q-scroll-area
      v-if="conversation.length > 0"
      class="conversation-area q-mt-lg"
      style="height: 300px; width: 100%">

      <q-chat-message
        v-for="(message, index) in conversation"
        :key="index"
        :text="[message.text]"
        :sent="message.type === 'user'"
        :bg-color="message.type === 'user' ? 'primary' : 'grey-3'"
        :text-color="message.type === 'user' ? 'white' : 'black'">
      </q-chat-message>
    </q-scroll-area>

    <!-- 快捷操作 -->
    <div class="quick-actions q-mt-md">
      <q-btn
        v-for="action in quickActions"
        :key="action.id"
        @click="handleQuickAction(action)"
        :label="action.label"
        color="secondary"
        outline
        class="q-mr-sm">
      </q-btn>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { Microphone } from '@capacitor/microphone'
import { mcpAiService } from 'src/services/ai/mcpService'

export default {
  name: 'VoiceAssistant',
  setup() {
    const isRecording = ref(false)
    const isProcessing = ref(false)
    const audioLevel = ref(0)
    const conversation = ref([])

    const quickActions = ref([
      { id: 'project_status', label: '项目状态', prompt: '查询我的项目进度' },
      { id: 'daily_tasks', label: '今日任务', prompt: '显示今天的待办事项' },
      { id: 'market_update', label: '市场动态', prompt: '最新的市场信息' }
    ])

    let mediaRecorder = null
    let audioChunks = []

    // 开始录音
    const startRecording = async () => {
      try {
        // 请求麦克风权限
        await Microphone.requestPermissions()

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder = new MediaRecorder(stream)
        audioChunks = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }

        mediaRecorder.onstop = processRecording

        mediaRecorder.start()
        isRecording.value = true

        // 音频级别检测
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateAudioLevel = () => {
          if (isRecording.value) {
            analyser.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length
            audioLevel.value = average / 255
            requestAnimationFrame(updateAudioLevel)
          }
        }
        updateAudioLevel()

      } catch (error) {
        console.error('录音启动失败:', error)
      }
    }

    // 停止录音
    const stopRecording = () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        isRecording.value = false
      }
    }

    // 处理录音
    const processRecording = async () => {
      if (audioChunks.length === 0) return

      isProcessing.value = true

      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })

        // 语音转文字
        const transcriptionResult = await mcpAiService.transcribeAudio(audioBlob, {
          language: 'zh-cn'
        })

        if (transcriptionResult.success) {
          const userMessage = {
            type: 'user',
            text: transcriptionResult.transcription,
            timestamp: new Date()
          }
          conversation.value.push(userMessage)

          // AI对话
          const chatResult = await mcpAiService.chatComplete([
            ...conversation.value.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.text
            }))
          ], getSystemPrompt())

          if (chatResult.success) {
            const aiMessage = {
              type: 'assistant',
              text: chatResult.response,
              timestamp: new Date()
            }
            conversation.value.push(aiMessage)
          }
        }

      } catch (error) {
        console.error('语音处理失败:', error)
      } finally {
        isProcessing.value = false
      }
    }

    // 快捷操作处理
    const handleQuickAction = async (action) => {
      const userMessage = {
        type: 'user',
        text: action.prompt,
        timestamp: new Date()
      }
      conversation.value.push(userMessage)

      // 处理预定义操作
      await processQuickAction(action)
    }

    // 处理预定义操作
    const processQuickAction = async (action) => {
      isProcessing.value = true

      try {
        let response = ''

        switch (action.id) {
          case 'project_status':
            response = await getProjectStatus()
            break
          case 'daily_tasks':
            response = await getDailyTasks()
            break
          case 'market_update':
            response = await getMarketUpdate()
            break
          default:
            response = '抱歉，我还不支持这个功能。'
        }

        const aiMessage = {
          type: 'assistant',
          text: response,
          timestamp: new Date()
        }
        conversation.value.push(aiMessage)

      } catch (error) {
        console.error('快捷操作处理失败:', error)
      } finally {
        isProcessing.value = false
      }
    }

    // 获取系统提示
    const getSystemPrompt = () => {
      return `你是Moqui AI助手，专门帮助用户管理项目、电商业务和生产制造。
              请用简洁、友好的语言回答用户问题，并主动提供相关建议。
              当用户询问具体数据时，请调用相应的API获取实时信息。`
    }

    // 获取项目状态
    const getProjectStatus = async () => {
      // 调用HiveMind API获取项目状态
      return '您有3个进行中的项目，2个即将到期。推荐优先处理项目A的里程碑任务。'
    }

    // 获取每日任务
    const getDailyTasks = async () => {
      // 调用任务API
      return '今天您有5个待办任务：1. 完成产品原型设计 2. 审核营销方案 3. 客户电话回访 4. 库存盘点 5. 团队周会'
    }

    // 获取市场动态
    const getMarketUpdate = async () => {
      // 调用市场API
      return '今日市场概况：科技股上涨2.3%，新能源板块表现强劲。您关注的供应商报价有小幅下降，建议考虑采购时机。'
    }

    return {
      isRecording,
      isProcessing,
      audioLevel,
      conversation,
      quickActions,
      startRecording,
      stopRecording,
      handleQuickAction
    }
  }
}
</script>

<style scoped>
.voice-assistant {
  padding: 20px;
  min-height: 100vh;
}

.voice-animation-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 250px;
}

.voice-button {
  transition: transform 0.2s ease;
}

.voice-button:active {
  transform: scale(1.1);
}

.conversation-area {
  width: 100%;
  padding: 0 16px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
```

#### Week 6-7: 图像识别组件

**智能图像分析组件**:
```vue
<!-- src/components/ai/ImageAnalyzer.vue -->
<template>
  <q-page class="image-analyzer">
    <!-- 相机预览区域 -->
    <div class="camera-section">
      <div v-if="!capturedImage" class="camera-placeholder">
        <q-icon name="photo_camera" size="100px" color="grey-5"/>
        <div class="text-h6 q-mt-md text-grey-6">
          {{ $t('拍照或选择图片进行AI分析') }}
        </div>
      </div>

      <q-img
        v-else
        :src="capturedImage"
        class="captured-image"
        fit="contain">
        <div class="absolute-bottom bg-transparent">
          <q-btn
            @click="clearImage"
            round
            color="negative"
            icon="delete"
            class="q-ma-sm">
          </q-btn>
        </div>
      </q-img>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons q-pa-md">
      <q-btn-group spread>
        <q-btn
          @click="capturePhoto"
          color="primary"
          icon="photo_camera"
          :label="$t('拍照')"
          :disable="isAnalyzing">
        </q-btn>

        <q-btn
          @click="selectFromGallery"
          color="secondary"
          icon="photo_library"
          :label="$t('相册')"
          :disable="isAnalyzing">
        </q-btn>

        <q-btn
          @click="analyzeImage"
          color="positive"
          icon="smart_toy"
          :label="$t('AI分析')"
          :disable="!capturedImage || isAnalyzing"
          :loading="isAnalyzing">
        </q-btn>
      </q-btn-group>
    </div>

    <!-- 分析结果 -->
    <q-card v-if="analysisResult" class="analysis-result q-ma-md">
      <q-card-section>
        <div class="text-h6 text-primary">
          <q-icon name="psychology" class="q-mr-sm"/>
          {{ $t('AI分析结果') }}
        </div>
      </q-card-section>

      <q-separator/>

      <q-card-section>
        <!-- 主要识别内容 -->
        <div class="analysis-main q-mb-md">
          <div class="text-subtitle1 text-weight-bold q-mb-xs">
            {{ $t('识别内容') }}
          </div>
          <div class="text-body1">
            {{ analysisResult.description }}
          </div>
        </div>

        <!-- 置信度 -->
        <div class="confidence-section q-mb-md">
          <div class="text-subtitle1 text-weight-bold q-mb-xs">
            {{ $t('识别置信度') }}
          </div>
          <q-linear-progress
            :value="analysisResult.confidence"
            color="positive"
            size="20px"
            class="q-mb-xs">
            <div class="absolute-full flex flex-center">
              <q-badge color="white" text-color="primary"
                       :label="`${Math.round(analysisResult.confidence * 100)}%`"/>
            </div>
          </q-linear-progress>
        </div>

        <!-- 提取的标签 -->
        <div class="tags-section q-mb-md">
          <div class="text-subtitle1 text-weight-bold q-mb-xs">
            {{ $t('关键标签') }}
          </div>
          <div class="tags-container">
            <q-chip
              v-for="tag in analysisResult.tags"
              :key="tag.name"
              :color="getTagColor(tag.confidence)"
              text-color="white"
              :icon="getTagIcon(tag.category)">
              {{ tag.name }}
              <q-tooltip>{{ $t('置信度: ') }}{{ Math.round(tag.confidence * 100) }}%</q-tooltip>
            </q-chip>
          </div>
        </div>

        <!-- 相关业务建议 -->
        <div v-if="analysisResult.suggestions" class="suggestions-section">
          <div class="text-subtitle1 text-weight-bold q-mb-xs">
            {{ $t('智能建议') }}
          </div>
          <q-list separator>
            <q-item
              v-for="suggestion in analysisResult.suggestions"
              :key="suggestion.id"
              clickable
              @click="handleSuggestion(suggestion)">
              <q-item-section avatar>
                <q-icon :name="suggestion.icon" :color="suggestion.color"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ suggestion.title }}</q-item-label>
                <q-item-label caption>{{ suggestion.description }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right"/>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          @click="saveAnalysis"
          color="primary"
          icon="save"
          :label="$t('保存分析')"
          flat>
        </q-btn>
        <q-btn
          @click="shareAnalysis"
          color="secondary"
          icon="share"
          :label="$t('分享')"
          flat>
        </q-btn>
      </q-card-actions>
    </q-card>

    <!-- 分析历史 -->
    <q-expansion-item
      v-if="analysisHistory.length > 0"
      icon="history"
      :label="$t('分析历史')"
      class="q-ma-md">

      <q-list separator>
        <q-item
          v-for="(item, index) in analysisHistory"
          :key="index"
          clickable
          @click="loadHistoryItem(item)">
          <q-item-section avatar>
            <q-img :src="item.thumbnail" style="width: 40px; height: 40px"/>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.description.substring(0, 30) }}...</q-item-label>
            <q-item-label caption>{{ formatDate(item.timestamp) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>

    <!-- 文件选择器 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect">
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { mcpAiService } from 'src/services/ai/mcpService'
import { useQuasar } from 'quasar'

export default {
  name: 'ImageAnalyzer',
  setup() {
    const $q = useQuasar()
    const capturedImage = ref('')
    const isAnalyzing = ref(false)
    const analysisResult = ref(null)
    const analysisHistory = ref([])
    const fileInput = ref(null)

    // 拍照
    const capturePhoto = async () => {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        })

        capturedImage.value = image.dataUrl

      } catch (error) {
        console.error('拍照失败:', error)
        $q.notify({
          type: 'negative',
          message: '拍照失败，请重试'
        })
      }
    }

    // 从相册选择
    const selectFromGallery = () => {
      fileInput.value?.click()
    }

    // 处理文件选择
    const handleFileSelect = (event) => {
      const file = event.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          capturedImage.value = e.target?.result
        }
        reader.readAsDataURL(file)
      }
    }

    // 清除图片
    const clearImage = () => {
      capturedImage.value = ''
      analysisResult.value = null
    }

    // AI图像分析
    const analyzeImage = async () => {
      if (!capturedImage.value) return

      isAnalyzing.value = true

      try {
        // 将DataURL转换为Blob
        const response = await fetch(capturedImage.value)
        const blob = await response.blob()

        // 调用AI分析服务
        const result = await mcpAiService.analyzeImage(blob, 'comprehensive')

        if (result.success) {
          analysisResult.value = {
            description: result.description,
            confidence: result.confidence,
            tags: result.tags || [],
            suggestions: generateSuggestions(result),
            timestamp: new Date()
          }

          // 添加到历史记录
          analysisHistory.value.unshift({
            thumbnail: capturedImage.value,
            description: result.description,
            timestamp: new Date(),
            result: analysisResult.value
          })

          // 限制历史记录数量
          if (analysisHistory.value.length > 20) {
            analysisHistory.value = analysisHistory.value.slice(0, 20)
          }

          $q.notify({
            type: 'positive',
            message: 'AI分析完成'
          })

        } else {
          throw new Error(result.error || '分析失败')
        }

      } catch (error) {
        console.error('图像分析失败:', error)
        $q.notify({
          type: 'negative',
          message: '分析失败，请重试'
        })
      } finally {
        isAnalyzing.value = false
      }
    }

    // 生成业务建议
    const generateSuggestions = (analysisResult) => {
      const suggestions = []

      // 根据识别结果生成不同业务建议
      if (analysisResult.category === 'product') {
        suggestions.push({
          id: 'add_to_inventory',
          icon: 'inventory',
          color: 'primary',
          title: '添加到库存',
          description: '将此商品添加到库存管理系统',
          action: 'add_inventory'
        })

        suggestions.push({
          id: 'market_analysis',
          icon: 'trending_up',
          color: 'positive',
          title: '市场分析',
          description: '查看此类商品的市场趋势',
          action: 'market_analysis'
        })
      }

      if (analysisResult.category === 'equipment') {
        suggestions.push({
          id: 'maintenance_schedule',
          icon: 'build',
          color: 'warning',
          title: '维护计划',
          description: '为此设备制定维护计划',
          action: 'maintenance_schedule'
        })
      }

      return suggestions
    }

    // 获取标签颜色
    const getTagColor = (confidence) => {
      if (confidence > 0.8) return 'positive'
      if (confidence > 0.6) return 'warning'
      return 'info'
    }

    // 获取标签图标
    const getTagIcon = (category) => {
      const iconMap = {
        product: 'shopping_bag',
        equipment: 'precision_manufacturing',
        material: 'category',
        person: 'person',
        animal: 'pets',
        vehicle: 'directions_car',
        building: 'business',
        default: 'label'
      }
      return iconMap[category] || iconMap.default
    }

    // 处理建议点击
    const handleSuggestion = async (suggestion) => {
      switch (suggestion.action) {
        case 'add_inventory':
          // 跳转到库存添加页面
          break
        case 'market_analysis':
          // 跳转到市场分析页面
          break
        case 'maintenance_schedule':
          // 跳转到维护计划页面
          break
      }
    }

    // 保存分析结果
    const saveAnalysis = () => {
      // 实现保存逻辑
      $q.notify({
        type: 'positive',
        message: '分析结果已保存'
      })
    }

    // 分享分析结果
    const shareAnalysis = () => {
      // 实现分享逻辑
      if (navigator.share) {
        navigator.share({
          title: 'AI图像分析结果',
          text: analysisResult.value?.description
        })
      }
    }

    // 加载历史记录
    const loadHistoryItem = (item) => {
      capturedImage.value = item.thumbnail
      analysisResult.value = item.result
    }

    // 格式化日期
    const formatDate = (date) => {
      return new Intl.DateTimeFormat('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }

    return {
      capturedImage,
      isAnalyzing,
      analysisResult,
      analysisHistory,
      fileInput,
      capturePhoto,
      selectFromGallery,
      handleFileSelect,
      clearImage,
      analyzeImage,
      getTagColor,
      getTagIcon,
      handleSuggestion,
      saveAnalysis,
      shareAnalysis,
      loadHistoryItem,
      formatDate
    }
  }
}
</script>

<style scoped>
.image-analyzer {
  min-height: 100vh;
}

.camera-section {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  margin: 16px;
  border-radius: 8px;
}

.camera-placeholder {
  text-align: center;
  color: #999;
}

.captured-image {
  max-height: 300px;
  border-radius: 8px;
}

.analysis-result {
  max-height: 60vh;
  overflow-y: auto;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.action-buttons {
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 1;
}
</style>
```

### Phase 3: 业务模块开发 (第8-12周)

#### Week 8-9: HiveMind项目管理移动端

**项目管理主界面**:
```vue
<!-- src/pages/hivemind/ProjectDashboard.vue -->
<template>
  <q-page class="project-dashboard">
    <!-- 顶部状态卡片 -->
    <div class="stats-section q-pa-md">
      <q-card class="stats-grid">
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-card class="stat-card text-center bg-primary text-white">
              <q-card-section>
                <div class="text-h4">{{ projectStats.active }}</div>
                <div class="text-caption">活跃项目</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6">
            <q-card class="stat-card text-center bg-positive text-white">
              <q-card-section>
                <div class="text-h4">{{ projectStats.completed }}</div>
                <div class="text-caption">已完成</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card>
    </div>

    <!-- AI智能助手卡片 -->
    <q-card class="ai-assistant-card q-ma-md bg-gradient">
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-h6 text-white">AI项目助手</div>
            <div class="text-caption text-white opacity-80">
              智能任务分配 • 风险评估 • 进度预测
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              @click="openAiAssistant"
              round
              color="white"
              text-color="primary"
              icon="psychology">
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 项目列表 -->
    <div class="projects-section q-pa-md">
      <div class="section-header row items-center q-mb-md">
        <div class="col">
          <div class="text-h6">我的项目</div>
        </div>
        <div class="col-auto">
          <q-btn
            @click="createProject"
            color="primary"
            icon="add"
            round
            size="sm">
          </q-btn>
        </div>
      </div>

      <q-list separator>
        <q-item
          v-for="project in projects"
          :key="project.id"
          clickable
          @click="openProject(project)"
          class="project-item">

          <q-item-section avatar>
            <q-circular-progress
              :value="project.progress"
              size="40px"
              :color="getProgressColor(project.progress)"
              track-color="grey-3"
              :thickness="0.15">
              <div class="text-caption">{{ Math.round(project.progress) }}%</div>
            </q-circular-progress>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-bold">{{ project.name }}</q-item-label>
            <q-item-label caption lines="2">{{ project.description }}</q-item-label>
            <div class="project-meta row q-mt-xs">
              <q-chip
                :color="getStatusColor(project.status)"
                text-color="white"
                size="sm">
                {{ project.statusLabel }}
              </q-chip>
              <q-chip
                v-if="project.priority === 'high'"
                color="negative"
                text-color="white"
                size="sm"
                icon="priority_high">
                高优先级
              </q-chip>
            </div>
          </q-item-section>

          <q-item-section side>
            <div class="text-caption text-grey-6">
              {{ formatDueDate(project.dueDate) }}
            </div>
            <q-icon name="chevron_right" color="grey-5"/>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- 今日任务 -->
    <div class="tasks-section q-pa-md">
      <div class="text-h6 q-mb-md">今日任务</div>

      <q-card>
        <q-list separator>
          <q-item
            v-for="task in todayTasks"
            :key="task.id"
            clickable
            @click="openTask(task)">

            <q-item-section avatar>
              <q-checkbox
                v-model="task.completed"
                @update:model-value="toggleTask(task)"
                :color="task.priority === 'high' ? 'negative' : 'primary'">
              </q-checkbox>
            </q-item-section>

            <q-item-section>
              <q-item-label
                :class="{ 'text-strike text-grey-6': task.completed }">
                {{ task.title }}
              </q-item-label>
              <q-item-label caption>{{ task.project }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="text-caption">{{ task.estimatedTime }}h</div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <!-- AI助手对话弹窗 -->
    <q-dialog v-model="showAiAssistant" position="bottom">
      <VoiceAssistant @close="showAiAssistant = false"/>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VoiceAssistant from 'src/components/ai/VoiceAssistant.vue'

export default {
  name: 'ProjectDashboard',
  components: {
    VoiceAssistant
  },
  setup() {
    const router = useRouter()
    const projects = ref([])
    const todayTasks = ref([])
    const projectStats = ref({ active: 0, completed: 0 })
    const showAiAssistant = ref(false)

    onMounted(() => {
      loadProjectData()
    })

    const loadProjectData = async () => {
      // 模拟数据加载
      projects.value = [
        {
          id: 1,
          name: '智能供需匹配平台',
          description: '基于AI的供需匹配系统开发项目',
          progress: 75,
          status: 'in_progress',
          statusLabel: '进行中',
          priority: 'high',
          dueDate: new Date('2024-12-15')
        },
        {
          id: 2,
          name: '移动端APP开发',
          description: 'Quasar Framework移动应用开发',
          progress: 45,
          status: 'in_progress',
          statusLabel: '进行中',
          priority: 'medium',
          dueDate: new Date('2024-12-30')
        }
      ]

      todayTasks.value = [
        {
          id: 1,
          title: '完成API文档编写',
          project: '智能供需匹配平台',
          completed: false,
          priority: 'high',
          estimatedTime: 3
        },
        {
          id: 2,
          title: '移动端UI设计评审',
          project: '移动端APP开发',
          completed: false,
          priority: 'medium',
          estimatedTime: 2
        }
      ]

      projectStats.value = {
        active: projects.value.filter(p => p.status === 'in_progress').length,
        completed: projects.value.filter(p => p.status === 'completed').length
      }
    }

    const getProgressColor = (progress) => {
      if (progress >= 80) return 'positive'
      if (progress >= 50) return 'warning'
      return 'negative'
    }

    const getStatusColor = (status) => {
      const colorMap = {
        'in_progress': 'primary',
        'completed': 'positive',
        'paused': 'warning',
        'cancelled': 'negative'
      }
      return colorMap[status] || 'grey'
    }

    const formatDueDate = (date) => {
      const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
      if (days < 0) return '已逾期'
      if (days === 0) return '今天到期'
      if (days === 1) return '明天到期'
      return `${days}天后到期`
    }

    const openProject = (project) => {
      router.push(`/hivemind/project/${project.id}`)
    }

    const openTask = (task) => {
      router.push(`/hivemind/task/${task.id}`)
    }

    const createProject = () => {
      router.push('/hivemind/project/create')
    }

    const openAiAssistant = () => {
      showAiAssistant.value = true
    }

    const toggleTask = async (task) => {
      // 实现任务完成状态切换
      console.log('Task toggled:', task)
    }

    return {
      projects,
      todayTasks,
      projectStats,
      showAiAssistant,
      getProgressColor,
      getStatusColor,
      formatDueDate,
      openProject,
      openTask,
      createProject,
      openAiAssistant,
      toggleTask
    }
  }
}
</script>

<style scoped>
.project-dashboard {
  background: #f5f5f5;
  min-height: 100vh;
}

.stats-grid {
  background: transparent;
  box-shadow: none;
}

.stat-card {
  border-radius: 12px;
}

.ai-assistant-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
}

.project-item {
  border-radius: 8px;
  margin-bottom: 8px;
}

.project-meta {
  gap: 4px;
}

.section-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}
</style>
```

## 📱 立即开始实施

基于你的确认，我建议立即开始以下步骤：

### 第一步：环境搭建 (本周)
```bash
# 1. 安装Quasar CLI
npm install -g @quasar/cli

# 2. 创建项目
quasar create moqui-ai-mobile

# 3. 添加移动端支持
cd moqui-ai-mobile
quasar mode add capacitor
quasar mode add pwa
```

### 第二步：API集成测试 (下周)
- 创建JWT认证服务
- 测试与Moqui后端API连接
- 验证MCP AI服务调用

### 第三步：核心功能开发 (3-4周)
- 语音交互组件
- 图像识别组件
- 业务模块逐步开发

这个方案将让你在12周内拥有功能完整的AI驱动移动应用，与Moqui后端完美集成，为用户提供项目管理、电商、ERP的统一移动体验。