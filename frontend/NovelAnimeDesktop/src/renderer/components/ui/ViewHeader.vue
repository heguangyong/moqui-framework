<template>
  <div class="view-header">
    <div class="header-info">
      <h1 class="header-title">{{ title }}</h1>
      <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
    </div>
    <div class="header-actions">
      <slot name="actions">
        <!-- 默认操作按钮 -->
        <button 
          v-if="showNewButton" 
          class="action-btn action-btn--primary" 
          @click="$emit('new')"
        >
          <component :is="icons.plus" :size="16" />
          <span>{{ newButtonText }}</span>
        </button>
        <button 
          v-if="showRefreshButton" 
          class="action-btn" 
          @click="$emit('refresh')"
        >
          <component :is="icons.refresh" :size="16" />
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { icons } from '../../utils/icons.js';

// Props
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  showNewButton: {
    type: Boolean,
    default: false
  },
  newButtonText: {
    type: String,
    default: 'New'
  },
  showRefreshButton: {
    type: Boolean,
    default: false
  }
});

// Emits
defineEmits(['new', 'refresh']);
</script>

<style scoped>
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 18px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.02), transparent);
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: #1c1c1e;
  margin: 0 0 4px 0;
  letter-spacing: -0.3px;
}

.header-subtitle {
  font-size: 13px;
  color: #8a8a8c;
  margin: 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 内容区统一按钮样式 - 简洁无渐变风格 */
.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.5);
  color: #5a5a5c;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: #2c2c2e;
  border-color: rgba(0, 0, 0, 0.18);
}

.action-btn--primary {
  background: rgba(120, 140, 130, 0.25);
  color: #4a5a52;
  border-color: rgba(100, 120, 110, 0.3);
}

.action-btn--primary:hover {
  background: rgba(120, 140, 130, 0.35);
  color: #3a4a42;
}
</style>
