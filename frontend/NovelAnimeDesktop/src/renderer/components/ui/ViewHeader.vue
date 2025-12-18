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
  padding: 20px 24px 16px;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 22px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 3px 0;
}

.header-subtitle {
  font-size: 13px;
  color: #6c6c6e;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: #4a4a4c;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.action-btn--primary {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #2c2c2e;
}

.action-btn--primary:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}
</style>
