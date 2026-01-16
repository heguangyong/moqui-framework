<template>
  <div v-if="error" class="error-display" :class="`error-${severity}`">
    <div class="error-icon">
      <span v-if="severity === 'error' || severity === 'critical'">❌</span>
      <span v-else-if="severity === 'warning'">⚠️</span>
      <span v-else>ℹ️</span>
    </div>
    <div class="error-content">
      <div class="error-title">{{ title || getDefaultTitle() }}</div>
      <div class="error-message">{{ error.message }}</div>
      <div v-if="showDetails && error.details" class="error-details">
        <details>
          <summary>详细信息</summary>
          <pre>{{ error.details }}</pre>
        </details>
      </div>
    </div>
    <div class="error-actions">
      <button v-if="canRetry" @click="$emit('retry')" class="btn btn-retry">
        重试
      </button>
      <button @click="$emit('dismiss')" class="btn btn-dismiss">
        关闭
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ErrorDisplay.vue - 错误显示组件
 * 显示错误信息，提供重试按钮
 * 
 * Requirements: 7.3
 */
import { computed } from 'vue';
import type { AppError, ErrorSeverity } from '../../services/errorHandler';
import { isRetryableError } from '../../services/errorHandler';

// Props
interface Props {
  error: AppError | null;
  title?: string;
  severity?: ErrorSeverity;
  showDetails?: boolean;
  allowRetry?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'error',
  showDetails: false,
  allowRetry: true,
});

// Emits
defineEmits<{
  retry: [];
  dismiss: [];
}>();

// Computed
const canRetry = computed(() => {
  if (!props.allowRetry || !props.error) return false;
  return isRetryableError(props.error);
});

// Methods
function getDefaultTitle(): string {
  switch (props.severity) {
    case 'critical':
      return '严重错误';
    case 'error':
      return '操作失败';
    case 'warning':
      return '警告';
    case 'info':
      return '提示';
    default:
      return '错误';
  }
}
</script>

<style scoped>
.error-display {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-error,
.error-critical {
  background: rgba(255, 240, 240, 0.95);
  border-color: rgba(200, 100, 100, 0.3);
}

.error-warning {
  background: rgba(255, 250, 240, 0.95);
  border-color: rgba(200, 160, 100, 0.3);
}

.error-info {
  background: rgba(240, 248, 255, 0.95);
  border-color: rgba(100, 150, 200, 0.3);
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
  min-width: 0;
}

.error-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 4px;
}

.error-message {
  font-size: 0.8125rem;
  color: #4a4a4c;
  line-height: 1.4;
}

.error-details {
  margin-top: 8px;
}

.error-details summary {
  font-size: 0.75rem;
  color: #6a6a6c;
  cursor: pointer;
}

.error-details pre {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-size: 0.6875rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.btn-retry {
  background: rgba(100, 160, 130, 0.2);
  color: #4a7a5a;
  border-color: rgba(100, 160, 130, 0.3);
}

.btn-retry:hover {
  background: rgba(100, 160, 130, 0.3);
}

.btn-dismiss {
  background: rgba(160, 160, 160, 0.15);
  color: #6a6a6a;
}

.btn-dismiss:hover {
  background: rgba(160, 160, 160, 0.25);
}
</style>
