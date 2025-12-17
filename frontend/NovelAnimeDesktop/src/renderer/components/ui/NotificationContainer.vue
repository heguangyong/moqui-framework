<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification"
          :class="[
            `notification--${notification.type}`,
            { 'notification--dismissible': notification.dismissible !== false }
          ]"
        >
          <div class="notification__icon">
            <component 
              :is="getNotificationIcon(notification.type)" 
              :size="20"
            />
          </div>
          
          <div class="notification__content">
            <h4 v-if="notification.title" class="notification__title">
              {{ notification.title }}
            </h4>
            <p class="notification__message">
              {{ notification.message }}
            </p>
          </div>
          
          <button
            v-if="notification.dismissible !== false"
            class="notification__close"
            @click="dismissNotification(notification.id)"
          >
            <component :is="icons.close" :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useUIStore } from '@/stores/ui.js';
import { icons } from '@/utils/icons.js';

const uiStore = useUIStore();

const notifications = computed(() => uiStore.notifications);

function getNotificationIcon(type) {
  switch (type) {
    case 'success':
      return icons.check;
    case 'error':
      return icons.alertCircle;
    case 'warning':
      return icons.alertCircle;
    case 'info':
    default:
      return icons.info;
  }
}

function dismissNotification(id) {
  uiStore.removeNotification(id);
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: var(--spacing-4);
  right: var(--spacing-4);
  z-index: var(--z-modal);
  max-width: 400px;
  width: 100%;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-3);
  background-color: var(--main-area-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--main-area-shadow-hover);
  backdrop-filter: blur(10px);
  
  &--success {
    border-left: 4px solid var(--color-success);
    
    .notification__icon {
      color: var(--color-success);
    }
  }
  
  &--error {
    border-left: 4px solid var(--color-error);
    
    .notification__icon {
      color: var(--color-error);
    }
  }
  
  &--warning {
    border-left: 4px solid var(--color-warning);
    
    .notification__icon {
      color: var(--color-warning);
    }
  }
  
  &--info {
    border-left: 4px solid var(--color-info);
    
    .notification__icon {
      color: var(--color-info);
    }
  }
}

.notification__icon {
  flex: 0 0 auto;
  margin-top: 2px;
}

.notification__content {
  flex: 1;
  min-width: 0;
}

.notification__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.notification__message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-normal);
}

.notification__close {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--border-radius);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: var(--transition-colors);
  
  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-secondary);
  }
}

/* 动画 */
.notification-enter-active {
  transition: all var(--transition-normal);
}

.notification-leave-active {
  transition: all var(--transition-normal);
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
  transition: transform var(--transition-normal);
}

/* 响应式 */
@media (max-width: 640px) {
  .notification-container {
    top: var(--spacing-2);
    right: var(--spacing-2);
    left: var(--spacing-2);
    max-width: none;
  }
  
  .notification {
    margin-bottom: var(--spacing-2);
  }
}
</style>