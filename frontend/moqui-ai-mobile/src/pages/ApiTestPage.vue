<template>
  <q-page class="api-test-page q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- 连接状态卡片 -->
      <div class="col-12 col-md-6">
        <q-card class="connection-status">
          <q-card-section>
            <div class="text-h6">
              <q-icon name="link" class="q-mr-sm"/>
              后端连接状态
            </div>
          </q-card-section>

          <q-card-section>
            <div class="status-grid">
              <div class="status-item">
                <span>Moqui后端</span>
                <q-chip
                  :color="connectionStatus.backend ? 'positive' : 'negative'"
                  text-color="white"
                  :icon="connectionStatus.backend ? 'check_circle' : 'error'">
                  {{ connectionStatus.backend ? '在线' : '离线' }}
                </q-chip>
              </div>

              <div class="status-item">
                <span>REST API</span>
                <q-chip
                  :color="connectionStatus.restApi ? 'positive' : 'negative'"
                  text-color="white"
                  :icon="connectionStatus.restApi ? 'check_circle' : 'error'">
                  {{ connectionStatus.restApi ? '可用' : '不可用' }}
                </q-chip>
              </div>

              <div class="status-item">
                <span>MCP AI服务</span>
                <q-chip
                  :color="connectionStatus.mcpAi ? 'positive' : 'warning'"
                  text-color="white"
                  :icon="connectionStatus.mcpAi ? 'check_circle' : 'help'">
                  {{ connectionStatus.mcpAi ? '可用' : '未知' }}
                </q-chip>
              </div>
            </div>

            <q-btn
              @click="testConnections"
              label="重新检测"
              color="primary"
              icon="refresh"
              :loading="isTestingConnection"
              class="q-mt-md full-width"/>
          </q-card-section>
        </q-card>
      </div>

      <!-- JWT认证测试 -->
      <div class="col-12 col-md-6">
        <q-card class="auth-test">
          <q-card-section>
            <div class="text-h6">
              <q-icon name="security" class="q-mr-sm"/>
              JWT认证测试
            </div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="testLogin">
              <q-input
                v-model="loginForm.username"
                label="用户名"
                outlined
                dense
                class="q-mb-sm">
              </q-input>

              <q-input
                v-model="loginForm.password"
                label="密码"
                type="password"
                outlined
                dense
                class="q-mb-md">
              </q-input>

              <q-btn
                type="submit"
                label="测试登录"
                color="primary"
                icon="login"
                :loading="isTestingAuth"
                class="full-width q-mb-sm"
                size="md"
                style="min-height: 40px;"/>
            </q-form>

            <q-btn
              v-if="authStore.isLoggedIn"
              @click="testProtectedApi"
              label="测试受保护API"
              color="secondary"
              icon="verified_user"
              :loading="isTestingProtected"
              class="full-width q-mb-sm"/>

            <q-btn
              v-if="authStore.isLoggedIn"
              @click="authStore.logout"
              label="登出"
              color="negative"
              icon="logout"
              outline
              class="full-width"/>
          </q-card-section>

          <!-- 认证状态显示 -->
          <q-card-section v-if="authStore.isLoggedIn" class="bg-green-1">
            <div class="text-subtitle2">✅ 认证成功</div>
            <div class="text-caption">
              用户: {{ authStore.user?.username || 'N/A' }}
            </div>
            <div class="text-caption">
              Token: {{ authStore.accessToken?.substring(0, 20) }}...
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- API测试结果 -->
      <div class="col-12">
        <q-card class="api-results">
          <q-card-section>
            <div class="text-h6">
              <q-icon name="bug_report" class="q-mr-sm"/>
              API测试结果
            </div>
          </q-card-section>

          <q-card-section>
            <q-tabs v-model="activeTab" dense>
              <q-tab name="basic" label="基础API"/>
              <q-tab name="auth" label="认证API"/>
              <q-tab name="mcp" label="MCP AI"/>
              <q-tab name="logs" label="请求日志"/>
            </q-tabs>

            <q-separator/>

            <q-tab-panels v-model="activeTab" animated>
              <!-- 基础API测试 -->
              <q-tab-panel name="basic">
                <div class="test-section">
                  <q-btn
                    @click="testBasicEndpoints"
                    label="测试基础端点"
                    color="primary"
                    icon="api"
                    :loading="isTestingBasic"
                    class="q-mb-md"/>

                  <div v-if="testResults.basic" class="test-results">
                    <div v-for="(result, endpoint) in testResults.basic" :key="endpoint" class="result-item">
                      <div class="result-header">
                        <span class="endpoint">{{ endpoint }}</span>
                        <q-chip
                          :color="result.success ? 'positive' : 'negative'"
                          text-color="white"
                          size="sm">
                          {{ result.status }}
                        </q-chip>
                      </div>
                      <div v-if="result.data" class="result-data">
                        <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
                      </div>
                      <div v-if="result.error" class="result-error">
                        {{ result.error }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- 认证API测试 -->
              <q-tab-panel name="auth">
                <div class="test-section">
                  <q-btn
                    @click="testAuthEndpoints"
                    label="测试认证端点"
                    color="secondary"
                    icon="verified"
                    :loading="isTestingAuthApi"
                    :disable="!authStore.isLoggedIn"
                    class="q-mb-md"/>

                  <div v-if="testResults.auth" class="test-results">
                    <div v-for="(result, endpoint) in testResults.auth" :key="endpoint" class="result-item">
                      <div class="result-header">
                        <span class="endpoint">{{ endpoint }}</span>
                        <q-chip
                          :color="result.success ? 'positive' : 'negative'"
                          text-color="white"
                          size="sm">
                          {{ result.status }}
                        </q-chip>
                      </div>
                      <div v-if="result.data" class="result-data">
                        <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- MCP AI测试 -->
              <q-tab-panel name="mcp">
                <div class="test-section">
                  <q-btn
                    @click="testMcpEndpoints"
                    label="测试MCP AI服务"
                    color="accent"
                    icon="psychology"
                    :loading="isTestingMcp"
                    :disable="!authStore.isLoggedIn"
                    class="q-mb-md"/>

                  <div v-if="testResults.mcp" class="test-results">
                    <div v-for="(result, endpoint) in testResults.mcp" :key="endpoint" class="result-item">
                      <div class="result-header">
                        <span class="endpoint">{{ endpoint }}</span>
                        <q-chip
                          :color="result.success ? 'positive' : 'negative'"
                          text-color="white"
                          size="sm">
                          {{ result.status }}
                        </q-chip>
                      </div>
                      <div v-if="result.data" class="result-data">
                        <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- 请求日志 -->
              <q-tab-panel name="logs">
                <div class="logs-section">
                  <q-btn
                    @click="clearLogs"
                    label="清空日志"
                    color="negative"
                    icon="clear_all"
                    size="sm"
                    outline
                    class="q-mb-md"/>

                  <div class="logs-container">
                    <div v-for="(log, index) in requestLogs" :key="index" class="log-entry">
                      <div class="log-header">
                        <span class="timestamp">{{ formatTime(log.timestamp) }}</span>
                        <span class="method">{{ log.method }}</span>
                        <span class="url">{{ log.url }}</span>
                        <q-chip
                          :color="log.success ? 'positive' : 'negative'"
                          text-color="white"
                          size="sm">
                          {{ log.status }}
                        </q-chip>
                      </div>
                      <div v-if="log.error" class="log-error">{{ log.error }}</div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/modules/auth'
import { moquiApi } from '@/services/api/base'

const $q = useQuasar()
const authStore = useAuthStore()

// 状态管理
const connectionStatus = ref({
  backend: false,
  restApi: false,
  mcpAi: false
})

const loginForm = ref({
  username: 'john.doe',
  password: 'moqui'
})

const isTestingConnection = ref(false)
const isTestingAuth = ref(false)
const isTestingProtected = ref(false)
const isTestingBasic = ref(false)
const isTestingAuthApi = ref(false)
const isTestingMcp = ref(false)

const activeTab = ref('basic')

const testResults = ref({
  basic: null as any,
  auth: null as any,
  mcp: null as any
})

const requestLogs = ref([] as any[])

onMounted(() => {
  testConnections()
})

// 测试连接状态
const testConnections = async () => {
  isTestingConnection.value = true

  try {
    // 测试Moqui后端基础连接
    try {
      const response = await fetch('http://localhost:8080/Login', {
        method: 'HEAD',
        mode: 'cors'
      })
      connectionStatus.value.backend = response.ok
      logRequest('HEAD', '/Login', response.ok, response.status.toString())
    } catch (error) {
      connectionStatus.value.backend = false
      logRequest('HEAD', '/Login', false, 'Network Error')
    }

    // 测试REST API (使用认证端点验证API可用性)
    if (connectionStatus.value.backend) {
      try {
        const response = await fetch('http://localhost:8080/rest/s1/', {
          method: 'GET',
          mode: 'cors'
        })
        // REST API根路径返回404是正常的，说明REST服务在运行
        connectionStatus.value.restApi = response.status === 404
        logRequest('GET', '/rest/s1/', connectionStatus.value.restApi, response.status.toString())
      } catch (error) {
        connectionStatus.value.restApi = false
        logRequest('GET', '/rest/s1/', false, 'API Error')
      }
    }

    // 测试MCP AI服务
    if (connectionStatus.value.restApi && authStore.isLoggedIn) {
      try {
        const response = await moquiApi.get('/rest/s1/mcp/health')
        connectionStatus.value.mcpAi = response.success
        logRequest('GET', '/rest/s1/mcp/health', response.success, response.success ? '200' : 'Error')
      } catch (error) {
        connectionStatus.value.mcpAi = false
        logRequest('GET', '/rest/s1/mcp/health', false, 'MCP Error')
      }
    }

  } finally {
    isTestingConnection.value = false
  }
}

// 测试JWT登录
const testLogin = async () => {
  isTestingAuth.value = true

  try {
    const result = await authStore.login(loginForm.value)

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'JWT认证测试成功'
      })
      logRequest('POST', '/rest/s1/moqui/auth/login', true, '200')

      // 重新测试连接状态
      await testConnections()
    } else {
      $q.notify({
        type: 'negative',
        message: `认证失败: ${result.error}`
      })
      logRequest('POST', '/rest/s1/moqui/auth/login', false, 'Auth Error')
    }
  } finally {
    isTestingAuth.value = false
  }
}

// 测试受保护API
const testProtectedApi = async () => {
  isTestingProtected.value = true

  try {
    const response = await moquiApi.get('/rest/s1/moqui/auth/verify')

    if (response.success) {
      $q.notify({
        type: 'positive',
        message: 'JWT Token验证成功'
      })
      logRequest('GET', '/rest/s1/moqui/auth/verify', true, '200')
    } else {
      $q.notify({
        type: 'negative',
        message: 'JWT Token验证失败'
      })
      logRequest('GET', '/rest/s1/moqui/auth/verify', false, 'Token Error')
    }
  } finally {
    isTestingProtected.value = false
  }
}

// 测试基础端点
const testBasicEndpoints = async () => {
  isTestingBasic.value = true
  testResults.value.basic = {}

  const endpoints = [
    { path: '/Login', method: 'HEAD', desc: '登录页面' },
    { path: '/rest/s1/', method: 'GET', desc: 'REST API根路径' },
    { path: '/rest/s1/moqui/auth/login', method: 'POST', desc: 'JWT认证端点', body: {} }
  ]

  for (const endpoint of endpoints) {
    try {
      const options: RequestInit = {
        method: endpoint.method,
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      }

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body)
      }

      const response = await fetch(`http://localhost:8080${endpoint.path}`, options)

      let data = null
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : null
      } catch {
        data = 'Response not JSON'
      }

      testResults.value.basic[endpoint.path] = {
        success: endpoint.path === '/rest/s1/' ? response.status === 404 : response.ok,
        status: response.status,
        data: typeof data === 'object' ? data : (data?.substring(0, 200) + '...' || '')
      }

      logRequest(endpoint.method, endpoint.path,
        endpoint.path === '/rest/s1/' ? response.status === 404 : response.ok,
        response.status.toString())
    } catch (error: any) {
      testResults.value.basic[endpoint.path] = {
        success: false,
        status: 'Error',
        error: error.message
      }
      logRequest(endpoint.method, endpoint.path, false, error.message)
    }
  }

  isTestingBasic.value = false
}

// 测试认证端点
const testAuthEndpoints = async () => {
  isTestingAuthApi.value = true
  testResults.value.auth = {}

  const endpoints = [
    { path: '/rest/s1/moqui/auth/verify', method: 'GET', desc: 'Token验证' },
    { path: '/rest/s1/marketplace/stats', method: 'GET', desc: '市场统计' }
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await moquiApi.get(endpoint.path)

      testResults.value.auth[endpoint.path] = {
        success: response.success,
        status: response.success ? 'OK' : 'Error',
        data: response.data
      }

      logRequest(endpoint.method, endpoint.path, response.success, response.success ? 'OK' : 'Error')
    } catch (error: any) {
      testResults.value.auth[endpoint.path] = {
        success: false,
        status: 'Error',
        error: error.message
      }
      logRequest(endpoint.method, endpoint.path, false, error.message)
    }
  }

  isTestingAuthApi.value = false
}

// 测试MCP端点
const testMcpEndpoints = async () => {
  isTestingMcp.value = true
  testResults.value.mcp = {}

  const endpoints = [
    { path: '/rest/s1/mcp/system/status', method: 'GET', desc: 'MCP系统状态' },
    { path: '/rest/s1/marketplace/stats', method: 'GET', desc: '市场统计数据' }
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await moquiApi.get(endpoint.path)

      testResults.value.mcp[endpoint.path] = {
        success: response.success,
        status: response.success ? 'OK' : 'Error',
        data: response.data
      }

      logRequest(endpoint.method, endpoint.path, response.success, response.success ? 'OK' : 'Error')
    } catch (error: any) {
      testResults.value.mcp[endpoint.path] = {
        success: false,
        status: 'Error',
        error: error.message
      }
      logRequest(endpoint.method, endpoint.path, false, error.message)
    }
  }

  isTestingMcp.value = false
}

// 记录请求日志
const logRequest = (method: string, url: string, success: boolean, status: string) => {
  requestLogs.value.unshift({
    timestamp: new Date(),
    method,
    url,
    success,
    status,
    error: !success ? status : null
  })

  // 限制日志数量
  if (requestLogs.value.length > 50) {
    requestLogs.value = requestLogs.value.slice(0, 50)
  }
}

// 清空日志
const clearLogs = () => {
  requestLogs.value = []
}

// 格式化时间
const formatTime = (timestamp: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp)
}
</script>

<style scoped lang="scss">
.api-test-page {
  max-width: 1200px;
  margin: 0 auto;
}

.status-grid {
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e0e0e0;

    &:last-child {
      border-bottom: none;
    }
  }
}

.test-results {
  .result-item {
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .endpoint {
        font-family: monospace;
        font-weight: bold;
      }
    }

    .result-data {
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;

      pre {
        margin: 0;
        white-space: pre-wrap;
      }
    }

    .result-error {
      color: #c10015;
      font-size: 12px;
    }
  }
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;

  .log-entry {
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 12px;

    .log-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .timestamp {
        color: #666;
      }

      .method {
        font-weight: bold;
        color: #1976d2;
      }

      .url {
        font-family: monospace;
        flex: 1;
      }
    }

    .log-error {
      color: #c10015;
      margin-top: 4px;
    }
  }
}
</style>