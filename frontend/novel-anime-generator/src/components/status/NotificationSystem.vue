<template>
  <div class="notification-system">
    <!-- Notification Container -->
    <div class="notification-container">
      <transition-group name="notification" tag="div">
        <div
          v-for="notification in visibleNotifications"
          :key="notification.id"
          :class="getNotificationClass(notification)"
          class="notification-item"
        >
          <div class="notification-content">
            <div class="row items-start q-gutter-sm">
              <q-icon
                :name="getNotificationIcon(notification.type)"
                :color="getNotificationColor(notification.type)"
                size="20px"
              />
              
              <div class="col">
                <div class="notification-title text-weight-medium">
                  {{ notification.title }}
                </div>
                <div v-if="notification.message" class="notification-message text-caption">
                  {{ notification.message }}
                </div>
                
                <!-- Progress bar for progress notifications -->
                <q-linear-progress
                  v-if="notification.type === 'progress' && notification.progress !== undefined"
                  :value="notification.progress / 100"
                  color="primary"
                  size="2px"
                  class="q-mt-xs"
                />
                
                <!-- Action buttons -->
                <div v-if="notification.actions" class="notification-actions q-mt-xs">
                  <q-btn
                    v-for="action in notification.actions"
                    :key="action.label"
                    :label="action.label"
                    :color="action.color || 'primary'"
                    size="sm"
                    flat
                    dense
                    @click="handleAction(notification, action)"
                    class="q-mr-xs"
                  />
                </div>
              </div>
              
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="close"
                @click="dismissNotification(notification.id)"
                class="notification-close"
              />
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Notification Bell Icon -->
    <q-btn
      v-if="hasUnreadNotifications"
      fab-mini
      color="primary"
      icon="notifications"
      class="notification-bell"
      @click="showNotificationHistory = true"
    >
      <q-badge
        v-if="unreadCount > 0"
        color="red"
        text-color="white"
        :label="unreadCount > 99 ? '99+' : unreadCount.toString()"
        floating
      />
    </q-btn>

    <!-- Notification History Dialog -->
    <q-dialog v-model="showNotificationHistory" position="right">
      <q-card style="width: 400px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">通知历史</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="notification-history">
            <div
              v-for="notification in allNotifications"
              :key="notification.id"
              class="history-item q-pa-sm q-mb-sm bg-grey-1 rounded-borders"
            >
              <div class="row items-start q-gutter-sm">
                <q-icon
                  :name="getNotificationIcon(notification.type)"
                  :color="getNotificationColor(notification.type)"
                  size="16px"
                />
                <div class="col">
                  <div class="text-weight-medium text-caption">
                    {{ notification.title }}
                  </div>
                  <div v-if="notification.message" class="text-caption text-grey-7">
                    {{ notification.message }}
                  </div>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    {{ formatTime(notification.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="allNotifications.length === 0" class="text-center text-grey-6 q-pa-md">
              暂无通知
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="清空历史"
            color="negative"
            flat
            @click="clearHistory"
          />
          <q-btn
            label="全部已读"
            color="primary"
            flat
            @click="markAllAsRead"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface NotificationAction {
  label: string;
  color?: string;
  handler: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'progress';
  title: string;
  message?: string;
  progress?: number;
  actions?: NotificationAction[];
  timestamp: Date;
  duration?: number;
  persistent?: boolean;
  read?: boolean;
}

// State
const allNotifications = ref<Notification[]>([]);
const visibleNotifications = ref<Notification[]>([]);
const showNotificationHistory = ref(false);

// Computed
const unreadCount = computed(() => 
  allNotifications.value.filter(n => !n.read).length
);

const hasUnreadNotifications = computed(() => unreadCount.value > 0);

// Methods
const getNotificationIcon = (type: Notification['type']): string => {
  switch (type) {
    case 'success':
      return 'check_circle';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    case 'progress':
      return 'hourglass_empty';
    default:
      return 'notifications';
  }
};

const getNotificationColor = (type: Notification['type']): string => {
  switch (type) {
    case 'success':
      return 'positive';
    case 'error':
      return 'negative';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    case 'progress':
      return 'primary';
    default:
      return 'grey';
  }
};

const getNotificationClass = (notification: Notification): string => {
  const baseClass = 'notification';
  const typeClass = `notification--${notification.type}`;
  return `${baseClass} ${typeClass}`;
};

const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
};

const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
  const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  const newNotification: Notification = {
    ...notification,
    id,
    timestamp: new Date(),
    read: false
  };

  allNotifications.value.unshift(newNotification);
  
  // Add to visible notifications if not persistent or has no duration
  if (!notification.persistent || notification.duration) {
    visibleNotifications.value.push(newNotification);
    
    // Auto-dismiss after duration
    if (notification.duration !== undefined && notification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, notification.duration);
    } else if (!notification.persistent) {
      // Default auto-dismiss for non-persistent notifications
      const defaultDuration = notification.type === 'error' ? 8000 : 4000;
      setTimeout(() => {
        dismissNotification(id);
      }, defaultDuration);
    }
  }

  return id;
};

const updateNotification = (id: string, updates: Partial<Notification>) => {
  const notification = allNotifications.value.find(n => n.id === id);
  if (notification) {
    Object.assign(notification, updates);
    
    // Update visible notification if it exists
    const visibleNotification = visibleNotifications.value.find(n => n.id === id);
    if (visibleNotification) {
      Object.assign(visibleNotification, updates);
    }
  }
};

const dismissNotification = (id: string) => {
  const index = visibleNotifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    visibleNotifications.value.splice(index, 1);
  }
  
  // Mark as read in history
  const notification = allNotifications.value.find(n => n.id === id);
  if (notification) {
    notification.read = true;
  }
};

const handleAction = (notification: Notification, action: NotificationAction) => {
  action.handler();
  dismissNotification(notification.id);
};

const clearHistory = () => {
  allNotifications.value = [];
  visibleNotifications.value = [];
  showNotificationHistory.value = false;
};

const markAllAsRead = () => {
  allNotifications.value.forEach(n => n.read = true);
};

// Convenience methods for different notification types
const showSuccess = (title: string, message?: string, duration?: number) => {
  return addNotification({
    type: 'success',
    title,
    message,
    duration
  });
};

const showError = (title: string, message?: string, persistent = false) => {
  return addNotification({
    type: 'error',
    title,
    message,
    persistent
  });
};

const showWarning = (title: string, message?: string, duration?: number) => {
  return addNotification({
    type: 'warning',
    title,
    message,
    duration
  });
};

const showInfo = (title: string, message?: string, duration?: number) => {
  return addNotification({
    type: 'info',
    title,
    message,
    duration
  });
};

const showProgress = (title: string, message?: string, progress = 0) => {
  return addNotification({
    type: 'progress',
    title,
    message,
    progress,
    persistent: true
  });
};

const showActionNotification = (
  title: string,
  message: string,
  actions: NotificationAction[],
  type: Notification['type'] = 'info'
) => {
  return addNotification({
    type,
    title,
    message,
    actions,
    persistent: true
  });
};

// Expose methods for external use
defineExpose({
  addNotification,
  updateNotification,
  dismissNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showProgress,
  showActionNotification,
  clearHistory,
  markAllAsRead
});

// Demo notifications on mount
onMounted(() => {
  setTimeout(() => {
    showSuccess('系统启动完成', '所有组件已成功加载');
  }, 1000);
  
  setTimeout(() => {
    showInfo('提示', '您可以通过拖拽文件到界面来导入小说');
  }, 3000);
});
</script>

<style scoped>
.notification-system {
  position: relative;
}

.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  width: 350px;
  max-width: 90vw;
}

.notification-item {
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.notification {
  background: white;
  border-left: 4px solid #e0e0e0;
}

.notification--success {
  border-left-color: #4caf50;
}

.notification--error {
  border-left-color: #f44336;
}

.notification--warning {
  border-left-color: #ff9800;
}

.notification--info {
  border-left-color: #2196f3;
}

.notification--progress {
  border-left-color: #9c27b0;
}

.notification-content {
  padding: 16px;
}

.notification-title {
  font-size: 14px;
  line-height: 1.4;
}

.notification-message {
  margin-top: 4px;
  color: #666;
  line-height: 1.4;
}

.notification-actions {
  margin-top: 8px;
}

.notification-close {
  opacity: 0.7;
}

.notification-close:hover {
  opacity: 1;
}

.notification-bell {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1500;
}

.notification-history {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  border-left: 3px solid #e0e0e0;
}

/* Transitions */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>