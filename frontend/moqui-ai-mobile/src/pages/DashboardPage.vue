<template>
  <q-page class="dashboard-page column items-center justify-start q-pa-md">
    <!-- 顶部欢迎卡片 -->
    <q-card class="welcome-card full-width q-mb-md bg-gradient">
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-h5 text-white">
              欢迎使用 Moqui AI Mobile
            </div>
            <div class="text-subtitle2 text-white opacity-80">
              AI驱动的企业移动应用
            </div>
          </div>
          <div class="col-auto">
            <q-icon name="psychology" size="48px" color="white"/>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 功能模块卡片 -->
    <div class="modules-grid full-width">
      <q-card
        v-for="module in modules"
        :key="module.id"
        class="module-card cursor-pointer"
        @click="navigateToModule(module)">

        <q-card-section class="text-center">
          <q-icon
            :name="module.icon"
            :color="module.color"
            size="48px"
            class="q-mb-sm"/>
          <div class="text-h6">{{ module.title }}</div>
          <div class="text-caption text-grey-6">
            {{ module.description }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row items-center justify-between">
            <q-chip
              :color="module.statusColor"
              text-color="white"
              size="sm">
              {{ module.status }}
            </q-chip>
            <q-icon name="chevron_right" color="grey-5"/>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- AI功能快速入口 -->
    <q-card class="ai-shortcuts full-width q-mt-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="auto_awesome" class="q-mr-sm"/>
          AI 助手
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-btn
              @click="startVoiceChat"
              color="primary"
              icon="mic"
              label="语音助手"
              class="full-width"
              :loading="aiStore.isVoiceRecording"/>
          </div>
          <div class="col-6">
            <q-btn
              @click="startImageAnalysis"
              color="secondary"
              icon="camera_alt"
              label="图像识别"
              class="full-width"
              :loading="aiStore.isImageAnalyzing"/>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 系统状态 -->
    <q-card class="system-status full-width q-mt-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">系统状态</div>

        <div class="status-items">
          <div class="status-item row items-center justify-between q-mb-sm">
            <span>后端连接</span>
            <q-chip
              :color="systemStatus.backend ? 'positive' : 'negative'"
              text-color="white"
              size="sm">
              {{ systemStatus.backend ? '正常' : '断开' }}
            </q-chip>
          </div>

          <div class="status-item row items-center justify-between q-mb-sm">
            <span>AI服务</span>
            <q-chip
              :color="systemStatus.ai ? 'positive' : 'warning'"
              text-color="white"
              size="sm">
              {{ systemStatus.ai ? '可用' : '不可用' }}
            </q-chip>
          </div>

          <div class="status-item row items-center justify-between">
            <span>用户认证</span>
            <q-chip
              :color="authStore.isLoggedIn ? 'positive' : 'negative'"
              text-color="white"
              size="sm">
              {{ authStore.isLoggedIn ? '已登录' : '未登录' }}
            </q-chip>
          </div>
        </div>

        <q-btn
          @click="$router.push('/api-test')"
          label="API连接测试"
          color="info"
          icon="bug_report"
          outline
          class="full-width q-mt-md"/>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/modules/auth'
import { useAIStore } from '@/stores/modules/ai'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const aiStore = useAIStore()

// 业务模块配置
const modules = ref([
  {
    id: 'hivemind',
    title: '项目管理',
    description: 'HiveMind项目管理系统',
    icon: 'assignment',
    color: 'primary',
    status: '开发中',
    statusColor: 'warning',
    route: '/hivemind'
  },
  {
    id: 'commerce',
    title: '电商管理',
    description: 'PopCommerce电商平台',
    icon: 'store',
    color: 'secondary',
    status: '规划中',
    statusColor: 'info',
    route: '/commerce'
  },
  {
    id: 'manufacturing',
    title: 'ERP制造',
    description: 'MarbleERP制造系统',
    icon: 'precision_manufacturing',
    color: 'accent',
    status: '规划中',
    statusColor: 'info',
    route: '/manufacturing'
  },
  {
    id: 'marketplace',
    title: '供需匹配',
    description: '智能消息匹配平台',
    icon: 'hub',
    color: 'positive',
    status: '已完成',
    statusColor: 'positive',
    route: '/marketplace'
  }
])

// 系统状态
const systemStatus = ref({
  backend: false,
  ai: false
})

onMounted(async () => {
  // 检查系统状态
  await checkSystemStatus()

  // 初始化认证
  if (authStore.accessToken) {
    await authStore.initializeAuth()
  }
})

// 检查系统状态
const checkSystemStatus = async () => {
  try {
    // 检查后端连接
    const response = await fetch('http://localhost:8080/rest/s1/moqui/system/health', {
      method: 'GET',
      timeout: 5000
    })
    systemStatus.value.backend = response.ok

    // 检查AI服务
    if (systemStatus.value.backend) {
      const aiResponse = await fetch('http://localhost:8080/rest/s1/mcp/health')
      systemStatus.value.ai = aiResponse.ok
    }
  } catch (error) {
    console.error('System status check failed:', error)
    systemStatus.value.backend = false
    systemStatus.value.ai = false
  }
}

// 导航到模块
const navigateToModule = (module: any) => {
  if (module.status === '规划中') {
    $q.notify({
      type: 'info',
      message: `${module.title}模块正在开发中，敬请期待！`
    })
    return
  }

  router.push(module.route)
}

// 启动语音助手
const startVoiceChat = () => {
  $q.notify({
    type: 'info',
    message: '语音助手功能即将上线！'
  })
}

// 启动图像识别
const startImageAnalysis = () => {
  $q.notify({
    type: 'info',
    message: '图像识别功能即将上线！'
  })
}
</script>

<style scoped lang="scss">
.dashboard-page {
  background: #f5f5f5;
  min-height: 100vh;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.module-card {
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
}

.ai-shortcuts,
.system-status {
  border-radius: 12px;
}

.status-items {
  .status-item {
    padding: 8px 0;
    border-bottom: 1px solid #eee;

    &:last-child {
      border-bottom: none;
    }
  }
}

@media (max-width: 600px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }
}
</style>