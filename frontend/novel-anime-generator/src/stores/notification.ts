import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'progress';
  progress?: number;
  duration?: number; // 自动消失时间（毫秒），0表示不自动消失
  actions?: NotificationAction[];
  createdAt: Date;
  dismissed?: boolean;
}

export interface NotificationAction {
  label: string;
  color?: string;
  action: () => void;
}

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([]);
  const maxNotifications = ref(5);

  // Getters
  const visibleNotifications = computed(() => 
    notifications.value.filter(n => !n.dismissed).slice(0, maxNotifications.value)
  );

  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.dismissed).length
  );

  // Actions
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const newNotification: Notification = {
      id,
      createdAt: new Date(),
      duration: notification.type === 'error' ? 0 : 5000, // 错误通知不自动消失
      ...notification
    };

    notifications.value.unshift(newNotification);

    // 自动消失
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, newNotification.duration);
    }

    // 限制通知数量
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50);
    }

    return id;
  };

  const dismissNotification = (id: string) => {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.dismissed = true;
    }
  };

  const clearAllNotifications = () => {
    notifications.value.forEach(n => n.dismissed = true);
  };

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  const updateNotificationProgress = (id: string, progress: number) => {
    const notification = notifications.value.find(n => n.id === id);
    if (notification && notification.type === 'progress') {
      notification.progress = Math.max(0, Math.min(100, progress));
    }
  };

  // 便捷方法
  const showInfo = (title: string, message?: string, duration?: number) => {
    return addNotification({
      title,
      message,
      type: 'info',
      duration
    });
  };

  const showSuccess = (title: string, message?: string, duration?: number) => {
    return addNotification({
      title,
      message,
      type: 'success',
      duration
    });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    return addNotification({
      title,
      message,
      type: 'warning',
      duration
    });
  };

  const showError = (title: string, message?: string, actions?: NotificationAction[]) => {
    return addNotification({
      title,
      message,
      type: 'error',
      actions,
      duration: 0 // 错误通知不自动消失
    });
  };

  const showProgress = (title: string, message?: string, initialProgress: number = 0) => {
    return addNotification({
      title,
      message,
      type: 'progress',
      progress: initialProgress,
      duration: 0 // 进度通知不自动消失
    });
  };

  // 示例通知
  const showWelcomeNotification = () => {
    showSuccess(
      '欢迎使用小说动漫生成器',
      '系统已成功启动，您可以开始创建项目了',
      8000
    );
  };

  return {
    // State
    notifications,
    maxNotifications,
    
    // Getters
    visibleNotifications,
    unreadCount,
    
    // Actions
    addNotification,
    dismissNotification,
    clearAllNotifications,
    removeNotification,
    updateNotificationProgress,
    
    // 便捷方法
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showProgress,
    showWelcomeNotification
  };
});