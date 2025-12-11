<template>
  <q-page class="push-settings-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <q-btn
        flat
        dense
        round
        icon="arrow_back"
        color="white"
        @click="goBack"
      />
      <div class="header-title">推送设置</div>
      <div class="header-spacer"></div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 推送开关 -->
      <div class="settings-section">
        <div class="section-title">推送通知</div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">接收订单推送</div>
            <div class="setting-desc">开启后将收到符合条件的新订单通知</div>
          </div>
          <q-toggle
            v-model="settings.enabled"
            color="secondary"
            @update:model-value="saveSettings"
          />
        </div>
      </div>

      <!-- 推送偏好 -->
      <div class="settings-section" :class="{ disabled: !settings.enabled }">
        <div class="section-title">推送偏好</div>
        
        <!-- 声音提醒 -->
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">声音提醒</div>
            <div class="setting-desc">收到推送时播放提示音</div>
          </div>
          <q-toggle
            v-model="settings.soundEnabled"
            color="secondary"
            :disable="!settings.enabled"
            @update:model-value="saveSettings"
          />
        </div>

        <!-- 震动提醒 -->
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">震动提醒</div>
            <div class="setting-desc">收到推送时震动提醒</div>
          </div>
          <q-toggle
            v-model="settings.vibrationEnabled"
            color="secondary"
            :disable="!settings.enabled"
            @update:model-value="saveSettings"
          />
        </div>
      </div>

      <!-- 筛选条件 -->
      <div class="settings-section" :class="{ disabled: !settings.enabled }">
        <div class="section-title">筛选条件</div>
        
        <!-- 距离范围 -->
        <div class="setting-item column">
          <div class="setting-info full-width">
            <div class="setting-label">推送距离范围</div>
            <div class="setting-desc">只推送距离当前位置 {{ settings.distanceRange }} 公里内的订单</div>
          </div>
          <div class="slider-container">
            <q-slider
              v-model="settings.distanceRange"
              :min="10"
              :max="100"
              :step="5"
              label
              :label-value="`${settings.distanceRange}km`"
              color="secondary"
              :disable="!settings.enabled"
              @change="saveSettings"
            />
            <div class="slider-labels">
              <span>10km</span>
              <span>100km</span>
            </div>
          </div>
        </div>

        <!-- 车型选择 -->
        <div class="setting-item column">
          <div class="setting-info full-width">
            <div class="setting-label">接收车型</div>
            <div class="setting-desc">选择要接收推送的集装箱类型</div>
          </div>
          <div class="vehicle-types">
            <q-checkbox
              v-for="type in vehicleTypeOptions"
              :key="type.value"
              v-model="settings.vehicleTypes"
              :val="type.value"
              :label="type.label"
              color="secondary"
              :disable="!settings.enabled"
              @update:model-value="saveSettings"
            />
          </div>
        </div>
      </div>

      <!-- 推送历史入口 -->
      <div class="settings-section">
        <div class="setting-item clickable" @click="goToHistory">
          <div class="setting-info">
            <div class="setting-label">推送历史</div>
            <div class="setting-desc">查看最近30天的推送记录</div>
          </div>
          <div class="setting-action">
            <q-badge v-if="unreadCount > 0" color="negative" :label="unreadCount" />
            <q-icon name="chevron_right" color="grey-6" size="24px" />
          </div>
        </div>
      </div>

      <!-- 重置设置 -->
      <div class="reset-section">
        <q-btn
          flat
          no-caps
          color="negative"
          label="重置为默认设置"
          @click="confirmReset"
        />
      </div>
    </div>
  </q-page>
</template>


<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { pushService, type PushSettings } from '@/services/push'

const router = useRouter()
const $q = useQuasar()

// Settings state
const settings = reactive<PushSettings>({
  enabled: true,
  distanceRange: 50,
  vehicleTypes: ['20GP', '40GP', '40HQ'],
  soundEnabled: true,
  vibrationEnabled: true
})

// Unread notification count
const unreadCount = ref(0)

// Vehicle type options
const vehicleTypeOptions = [
  { value: '20GP', label: '20尺标准箱' },
  { value: '40GP', label: '40尺标准箱' },
  { value: '40HQ', label: '40尺高箱' }
]

// Load settings on mount
onMounted(async () => {
  await loadSettings()
  await loadUnreadCount()
})

// Load current settings
async function loadSettings() {
  try {
    const currentSettings = await pushService.getSettings()
    Object.assign(settings, currentSettings)
  } catch (error) {
    console.error('Failed to load push settings:', error)
    $q.notify({
      type: 'negative',
      message: '加载设置失败'
    })
  }
}

// Load unread notification count
async function loadUnreadCount() {
  try {
    unreadCount.value = await pushService.getUnreadCount()
  } catch (error) {
    console.error('Failed to load unread count:', error)
  }
}

// Save settings
async function saveSettings() {
  try {
    await pushService.updateSettings({ ...settings })
  } catch (error) {
    console.error('Failed to save push settings:', error)
    $q.notify({
      type: 'negative',
      message: '保存设置失败'
    })
  }
}

// Confirm reset settings
function confirmReset() {
  $q.dialog({
    title: '重置设置',
    message: '确定要将推送设置重置为默认值吗？',
    cancel: {
      label: '取消',
      flat: true
    },
    ok: {
      label: '确定',
      color: 'negative'
    },
    persistent: true
  }).onOk(async () => {
    await resetSettings()
  })
}

// Reset settings to defaults
async function resetSettings() {
  try {
    await pushService.resetSettings()
    await loadSettings()
    $q.notify({
      type: 'positive',
      message: '设置已重置'
    })
  } catch (error) {
    console.error('Failed to reset settings:', error)
    $q.notify({
      type: 'negative',
      message: '重置设置失败'
    })
  }
}

// Navigate to push history
function goToHistory() {
  router.push('/marketplace/push-history')
}

// Go back
function goBack() {
  router.back()
}
</script>


<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.push-settings-page {
  background: linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%);
  min-height: 100vh;
}

// 页面头部
.page-header {
  background: $primary-color;
  padding: calc(16px + env(safe-area-inset-top)) 16px 16px;
  display: flex;
  align-items: center;
  gap: 12px;

  .header-title {
    flex: 1;
    font-size: 18px;
    font-weight: 600;
    color: white;
  }

  .header-spacer {
    width: 40px;
  }
}

// 设置内容
.settings-content {
  padding: 20px 16px;
}

// 设置分组
.settings-section {
  background: #2C2C2E;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .section-title {
    padding: 16px 16px 8px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

// 设置项
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }

  &.column {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  &.clickable {
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  .setting-info {
    flex: 1;

    &.full-width {
      width: 100%;
    }

    .setting-label {
      font-size: 16px;
      font-weight: 500;
      color: white;
      margin-bottom: 4px;
    }

    .setting-desc {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .setting-action {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// 滑块容器
.slider-container {
  width: 100%;
  padding: 0 8px;

  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
}

// 车型选择
.vehicle-types {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  :deep(.q-checkbox) {
    .q-checkbox__label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
    }
  }
}

// 重置按钮区域
.reset-section {
  text-align: center;
  padding: 24px 0;
}

// Quasar组件样式覆盖
:deep(.q-toggle) {
  .q-toggle__inner {
    color: rgba(255, 255, 255, 0.3);
  }
}

:deep(.q-slider) {
  .q-slider__track-container {
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>
