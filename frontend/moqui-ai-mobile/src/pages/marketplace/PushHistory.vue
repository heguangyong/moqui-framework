<template>
  <q-page class="push-history-page">
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
      <div class="header-title">推送历史</div>
      <q-btn
        v-if="notifications.length > 0"
        flat
        dense
        round
        icon="more_vert"
        color="white"
        @click="showMenu = true"
      >
        <q-menu v-model="showMenu">
          <q-list style="min-width: 150px">
            <q-item clickable v-close-popup @click="markAllRead">
              <q-item-section avatar>
                <q-icon name="done_all" />
              </q-item-section>
              <q-item-section>全部已读</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="confirmClear">
              <q-item-section avatar>
                <q-icon name="delete_sweep" color="negative" />
              </q-item-section>
              <q-item-section>清空历史</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <q-tabs
        v-model="filterTab"
        class="tabs-container"
        active-color="secondary"
        indicator-color="secondary"
        align="justify"
        dense
      >
        <q-tab name="all" label="全部" />
        <q-tab name="unread" :label="`未读 (${unreadCount})`" />
      </q-tabs>
    </div>


    <!-- 通知列表 -->
    <div class="notification-list">
      <q-infinite-scroll
        @load="loadMore"
        :offset="100"
        :disable="!hasMore"
      >
        <template v-if="filteredNotifications.length > 0">
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="notification-wrapper"
          >
            <PushNotification
              :notification="notification"
              :show-close="false"
              @click="handleNotificationClick"
            />
          </div>
        </template>

        <template #loading>
          <div class="loading-indicator">
            <q-spinner-dots color="secondary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>

      <!-- 空状态 -->
      <div v-if="!loading && filteredNotifications.length === 0" class="empty-state">
        <q-icon name="notifications_off" size="64px" color="grey-6" />
        <div class="empty-title">
          {{ filterTab === 'unread' ? '没有未读通知' : '暂无推送记录' }}
        </div>
        <div class="empty-desc">
          {{ filterTab === 'unread' ? '所有通知都已读' : '最近30天内没有收到推送' }}
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading && notifications.length === 0" class="loading-state">
        <q-spinner-dots color="secondary" size="40px" />
        <div class="loading-text">加载中...</div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import PushNotification from '@/components/push/PushNotification.vue'
import { pushService, type PushNotification as PushNotificationType } from '@/services/push'

const router = useRouter()
const $q = useQuasar()

// State
const notifications = ref<PushNotificationType[]>([])
const loading = ref(false)
const showMenu = ref(false)
const filterTab = ref('all')
const hasMore = ref(true)
const page = ref(1)
const pageSize = 20

// Computed
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const filteredNotifications = computed(() => {
  if (filterTab.value === 'unread') {
    return notifications.value.filter(n => !n.read)
  }
  return notifications.value
})

// Load notifications on mount
onMounted(async () => {
  await loadNotifications()
})

// Load notifications
async function loadNotifications() {
  loading.value = true
  try {
    const history = await pushService.getHistory(30)
    notifications.value = history
    hasMore.value = history.length >= pageSize
  } catch (error) {
    console.error('Failed to load push history:', error)
    $q.notify({
      type: 'negative',
      message: '加载推送历史失败'
    })
  } finally {
    loading.value = false
  }
}

// Load more (infinite scroll)
async function loadMore(index: number, done: (stop?: boolean) => void) {
  // For now, we load all at once since IndexedDB query is fast
  // In a real app with server-side pagination, implement proper pagination
  done(true)
}

// Handle notification click
async function handleNotificationClick(notification: PushNotificationType) {
  if (!notification.read) {
    await pushService.markAsRead(notification.id)
    const index = notifications.value.findIndex(n => n.id === notification.id)
    if (index !== -1) {
      const item = notifications.value[index]
      if (item) {
        item.read = true
      }
    }
  }
}

// Mark all as read
async function markAllRead() {
  try {
    await pushService.markAllAsRead()
    notifications.value.forEach(n => {
      n.read = true
    })
    $q.notify({
      type: 'positive',
      message: '已全部标记为已读'
    })
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    $q.notify({
      type: 'negative',
      message: '操作失败'
    })
  }
}

// Confirm clear history
function confirmClear() {
  $q.dialog({
    title: '清空历史',
    message: '确定要清空所有推送历史吗？此操作不可恢复。',
    cancel: {
      label: '取消',
      flat: true
    },
    ok: {
      label: '清空',
      color: 'negative'
    },
    persistent: true
  }).onOk(async () => {
    await clearHistory()
  })
}

// Clear all history
async function clearHistory() {
  try {
    await pushService.clearHistory()
    notifications.value = []
    $q.notify({
      type: 'positive',
      message: '推送历史已清空'
    })
  } catch (error) {
    console.error('Failed to clear history:', error)
    $q.notify({
      type: 'negative',
      message: '清空失败'
    })
  }
}

// Go back
function goBack() {
  router.back()
}
</script>


<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.push-history-page {
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
}

// 筛选标签
.filter-tabs {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .tabs-container {
    :deep(.q-tab) {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    :deep(.q-tab--active) {
      color: white;
      font-weight: 600;
    }

    :deep(.q-tabs__indicator) {
      background-color: $secondary-color;
    }
  }
}

// 通知列表
.notification-list {
  padding: 16px;
}

.notification-wrapper {
  margin-bottom: 12px;
}

// 加载指示器
.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 20px;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  .empty-title {
    margin-top: 16px;
    font-size: 18px;
    font-weight: 600;
    color: white;
  }

  .empty-desc {
    margin-top: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .loading-text {
    margin-top: 16px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>
