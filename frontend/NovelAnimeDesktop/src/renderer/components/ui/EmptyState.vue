<template>
  <div class="empty-state">
    <div class="empty-icon">
      <component :is="iconComponent" :size="iconSize" />
    </div>
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.action || actionText" class="empty-action">
      <slot name="action">
        <button 
          v-if="actionText"
          class="action-btn"
          @click="$emit('action')"
        >
          {{ actionText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { icons } from '../../utils/icons.js';

const props = defineProps({
  // 图标名称 - 需求 6.1
  icon: {
    type: String,
    default: 'inbox'
  },
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 描述文字
  description: {
    type: String,
    default: ''
  },
  // 操作按钮文字
  actionText: {
    type: String,
    default: ''
  },
  // 图标大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
});

defineEmits(['action']);

// 图标组件映射
const iconComponent = computed(() => {
  const iconMap = {
    inbox: icons.inbox,
    folder: icons.folder,
    file: icons.file,
    search: icons.search,
    users: icons.users,
    image: icons.image,
    video: icons.video,
    book: icons.book,
    workflow: icons.gitBranch,
    settings: icons.settings,
    clock: icons.clock,
    archive: icons.archive,
    layers: icons.layers,
    circle: icons.circle,
    refresh: icons.refresh,
    box: icons.box,
    userX: icons.userX
  };
  return iconMap[props.icon] || icons.inbox;
});

const iconSize = computed(() => {
  const sizes = {
    small: 32,
    medium: 48,
    large: 64
  };
  return sizes[props.size];
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  color: #b0b0b0;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: #6c6c6e;
  margin: 0 0 20px 0;
  max-width: 320px;
  line-height: 1.5;
}

.empty-action {
  margin-top: 8px;
}

.action-btn {
  padding: 10px 20px;
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #2c5aa0;
  transform: translateY(-1px);
}
</style>
