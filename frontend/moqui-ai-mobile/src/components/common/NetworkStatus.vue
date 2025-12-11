<template>
  <Transition name="slide-down">
    <div
      v-if="shouldShow"
      class="network-status"
      :class="statusClass"
    >
      <div class="network-status__content">
        <q-icon :name="statusIcon" size="20px" />
        <span class="network-status__message">{{ statusMessage }}</span>
        
        <template v-if="isOffline">
          <span v-if="pendingCount > 0" class="network-status__pending">
            {{ pendingCount }} 个待同步
          </span>
        </template>
        
        <template v-if="isSyncing">
          <q-spinner-dots size="16px" color="white" />
          <span class="network-status__progress">
            {{ syncProgress.completed }}/{{ syncProgress.total }}
          </span>
        </template>
        
        <q-btn
          v-if="showRetryButton"
          flat
          dense
          size="sm"
          label="重试"
          class="network-status__retry"
          @click="handleRetry"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  networkMonitor,
  syncService,
  offlineCacheService,
  type SyncProgress
} from '@/services/network'

// Props
interface Props {
  showWhenOnline?: boolean
  position?: 'top' | 'bottom'
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  showWhenOnline: false,
  position: 'top',
  autoHide: true,
  autoHideDelay: 3000
})


// Emits
const emit = defineEmits<{
  online: []
  offline: []
  'sync-start': []
  'sync-complete': [result: { success: number; failed: number }]
}>()

// State
const isOnline = ref(true)
const isSyncing = ref(false)
const pendingCount = ref(0)
const syncProgress = ref<SyncProgress>({
  status: 'idle',
  total: 0,
  completed: 0,
  failed: 0
})
const showOnlineMessage = ref(false)
const autoHideTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Computed
const isOffline = computed(() => !isOnline.value)

const shouldShow = computed(() => {
  if (isOffline.value) return true
  if (isSyncing.value) return true
  if (showOnlineMessage.value && props.showWhenOnline) return true
  return false
})

const statusClass = computed(() => ({
  'network-status--offline': isOffline.value,
  'network-status--online': isOnline.value && showOnlineMessage.value,
  'network-status--syncing': isSyncing.value,
  [`network-status--${props.position}`]: true
}))

const statusIcon = computed(() => {
  if (isSyncing.value) return 'sync'
  if (isOffline.value) return 'cloud_off'
  return 'cloud_done'
})

const statusMessage = computed(() => {
  if (isSyncing.value) return '正在同步...'
  if (isOffline.value) return '网络已断开'
  return '网络已恢复'
})

const showRetryButton = computed(() => {
  return isOnline.value && !isSyncing.value && pendingCount.value > 0
})

// Methods
const updatePendingCount = async () => {
  pendingCount.value = await offlineCacheService.getPendingCount()
}

const handleRetry = async () => {
  if (isSyncing.value) return
  emit('sync-start')
  const result = await syncService.syncAll()
  emit('sync-complete', { success: result.success, failed: result.failed })
}

const startAutoHideTimer = () => {
  if (!props.autoHide) return
  
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
  }
  
  autoHideTimer.value = setTimeout(() => {
    showOnlineMessage.value = false
  }, props.autoHideDelay)
}

// Lifecycle
let unsubscribeNetwork: (() => void) | undefined
let unsubscribeProgress: (() => void) | undefined
let unsubscribeComplete: (() => void) | undefined

onMounted(async () => {
  // Initial state
  isOnline.value = networkMonitor.isOnline()
  await updatePendingCount()

  // Subscribe to network changes
  unsubscribeNetwork = networkMonitor.onNetworkChange((event) => {
    isOnline.value = event.status === 'online'
    
    if (event.status === 'online') {
      showOnlineMessage.value = true
      emit('online')
      startAutoHideTimer()
    } else {
      emit('offline')
    }
    
    updatePendingCount()
  })

  // Subscribe to sync progress
  unsubscribeProgress = syncService.onProgress((progress) => {
    syncProgress.value = progress
    isSyncing.value = progress.status === 'syncing'
  })

  // Subscribe to sync completion
  unsubscribeComplete = syncService.onComplete((result) => {
    isSyncing.value = false
    updatePendingCount()
  })
})

onUnmounted(() => {
  unsubscribeNetwork?.()
  unsubscribeProgress?.()
  unsubscribeComplete?.()
  
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
  }
})

// Watch for online status to update pending count
watch(isOnline, () => {
  updatePendingCount()
})
</script>


<style scoped lang="scss">
@import '@/styles/variables';

.network-status {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
  
  &--top {
    top: 0;
  }
  
  &--bottom {
    bottom: 0;
  }
  
  &--offline {
    background-color: #f44336;
  }
  
  &--online {
    background-color: #4caf50;
  }
  
  &--syncing {
    background-color: #2196f3;
  }
  
  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    max-width: 600px;
    margin: 0 auto;
  }
  
  &__message {
    font-weight: 500;
  }
  
  &__pending {
    opacity: 0.9;
    font-size: 12px;
  }
  
  &__progress {
    font-size: 12px;
    opacity: 0.9;
  }
  
  &__retry {
    margin-left: 8px;
    color: white;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}

// Transition animations
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
