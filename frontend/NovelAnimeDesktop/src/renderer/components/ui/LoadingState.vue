<template>
  <div 
    class="loading-state"
    :class="{ 
      'loading-state--fullscreen': fullscreen,
      'loading-state--inline': !fullscreen
    }"
  >
    <div class="loading-content">
      <div class="loading-spinner">
        <component :is="icons.refresh" :size="spinnerSize" class="spin" />
      </div>
      <p v-if="message" class="loading-message">{{ message }}</p>
      <p v-if="subMessage" class="loading-sub-message">{{ subMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { icons } from '../../utils/icons.js';

const props = defineProps({
  // 是否全屏模式 - 需求 6.1
  fullscreen: {
    type: Boolean,
    default: false
  },
  // 加载提示信息
  message: {
    type: String,
    default: '加载中...'
  },
  // 次要提示信息
  subMessage: {
    type: String,
    default: ''
  },
  // 加载图标大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
});

const spinnerSize = computed(() => {
  const sizes = {
    small: 20,
    medium: 32,
    large: 48
  };
  return sizes[props.size];
});
</script>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 全屏模式 - 需求 6.1 */
.loading-state--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

/* 内联模式 - 需求 6.1 */
.loading-state--inline {
  padding: 32px;
  min-height: 120px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  color: #6a6a6a;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-message {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
  margin: 0;
}

.loading-sub-message {
  font-size: 12px;
  color: #6c6c6e;
  margin: 0;
}
</style>
