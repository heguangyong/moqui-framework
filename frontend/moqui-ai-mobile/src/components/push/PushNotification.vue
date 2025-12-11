<template>
  <transition name="slide-down">
    <div
      v-if="visible"
      class="push-notification"
      :class="{ 'is-read': notification.read }"
      @click="handleClick"
    >
      <div class="notification-icon">
        <q-icon name="local_shipping" size="24px" color="white" />
      </div>
      
      <div class="notification-content">
        <div class="notification-header">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
        </div>
        
        <div class="notification-body">{{ notification.body }}</div>
        
        <div v-if="notification.data" class="notification-meta">
          <span v-if="notification.data.route" class="meta-item">
            <q-icon name="route" size="14px" />
            {{ notification.data.route }}
          </span>
          <span v-if="notification.data.freight" class="meta-item freight">
            <q-icon name="payments" size="14px" />
            ¥{{ formatPrice(notification.data.freight) }}
          </span>
          <span v-if="notification.data.distance" class="meta-item">
            <q-icon name="straighten" size="14px" />
            {{ notification.data.distance.toFixed(1) }}km
          </span>
        </div>
      </div>

      <q-btn
        v-if="showClose"
        flat
        dense
        round
        icon="close"
        size="sm"
        color="grey-6"
        class="close-btn"
        @click.stop="handleClose"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { PushNotification } from '@/services/push'

interface Props {
  notification: PushNotification
  visible?: boolean
  showClose?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  showClose: true,
  autoHide: false,
  autoHideDelay: 5000
})


const emit = defineEmits<{
  (e: 'click', notification: PushNotification): void
  (e: 'close', notification: PushNotification): void
}>()

const router = useRouter()

// Format timestamp to relative time
function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  })
}

// Format price
function formatPrice(price: number): string {
  return price.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

// Handle notification click - navigate to order detail
function handleClick() {
  emit('click', props.notification)
  router.push(`/marketplace/order/${props.notification.orderId}`)
}

// Handle close button click
function handleClose() {
  emit('close', props.notification)
}
</script>

<style scoped lang="scss">
@import '@/styles/shanghai-port-theme.scss';

.push-notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #2C2C2E;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid $secondary-color;

  &:hover {
    background: #333336;
  }

  &.is-read {
    border-left-color: transparent;
    opacity: 0.7;

    .notification-icon {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: $secondary-color;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}

.notification-title {
  font-size: 15px;
  font-weight: 600;
  color: white;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.notification-body {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);

    &.freight {
      color: $secondary-color;
      font-weight: 600;
    }
  }
}

.close-btn {
  flex-shrink: 0;
  margin: -8px -8px 0 0;
}

// Transition animation
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
