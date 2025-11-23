<template>
  <q-card
    class="message-card q-mb-md cursor-pointer"
    :class="[
      { 'hot-message': message.isHot },
      { 'urgent-message': message.isUrgent },
      { 'nearby-message': message.isNearby }
    ]"
    :data-type="message.type"
    @click="$emit('view-detail', message)">
    <q-card-section class="q-pb-sm">
      <!-- 消息头部信息 -->
      <div class="row items-center q-mb-sm">
        <q-chip
          :color="message.type === 'supply' ? 'positive' : 'info'"
          text-color="white"
          :icon="message.type === 'supply' ? 'trending_up' : 'trending_down'"
          size="sm"
          class="type-chip">
          {{ message.type === 'supply' ? '供应' : '需求' }}
        </q-chip>

        <q-space/>

        <div class="text-caption text-grey-6 time-display">
          {{ formatTime(message.publishTime) }}
        </div>
      </div>

      <!-- 消息标题 -->
      <div class="text-h6 q-mb-sm text-weight-medium message-title">
        {{ message.title }}
      </div>

      <!-- 消息描述 -->
      <div class="text-body2 text-grey-8 line-clamp-3 q-mb-md message-description">
        {{ message.description }}
      </div>

      <!-- 分类和位置信息 -->
      <div class="info-row q-mb-md">
        <div class="info-items">
          <div v-if="message.category" class="info-item">
            <q-icon
              name="category"
              size="16px"
              color="primary"
              class="info-icon"/>
            <span class="info-text">
              {{ message.category }}
            </span>
          </div>

          <div v-if="message.location" class="info-item">
            <q-icon
              name="location_on"
              size="16px"
              color="positive"
              class="info-icon"/>
            <span class="info-text">
              {{ message.location }}
            </span>
          </div>
        </div>
      </div>

      <!-- 标签 -->
      <div v-if="message.tags && message.tags.length" class="tags-container q-mb-md">
        <q-chip
          v-for="tag in message.tags.slice(0, 3)"
          :key="tag"
          size="sm"
          class="tag-chip">
          {{ tag }}
        </q-chip>
        <span v-if="message.tags.length > 3" class="text-caption text-grey-6">
          +{{ message.tags.length - 3 }}
        </span>
      </div>
    </q-card-section>

    <q-separator/>

    <!-- 操作按钮 -->
    <q-card-actions align="between" class="q-px-md q-py-sm">
      <div class="publisher-info">
        <q-avatar size="24px" class="publisher-avatar">
          <q-icon name="person"/>
        </q-avatar>
        <span class="text-caption text-grey-6 q-ml-sm">
          {{ message.publisherInfo.nickname || '匿名用户' }}
        </span>
      </div>

      <div class="action-buttons">
        <q-btn
          @click.stop="$emit('view-detail', message)"
          size="sm"
          color="grey-6"
          flat
          dense
          icon="visibility"
          class="view-btn">
          <q-tooltip>查看详情</q-tooltip>
        </q-btn>

        <q-btn
          @click.stop="$emit('contact', message)"
          size="sm"
          :color="message.type === 'supply' ? 'positive' : 'info'"
          flat
          dense
          icon="message"
          class="contact-btn">
          <q-tooltip>联系对方</q-tooltip>
        </q-btn>
      </div>
    </q-card-actions>

    <!-- 匹配度指示器 (如果有匹配分数) -->
    <div v-if="message.matchScore" class="match-indicator">
      <q-linear-progress
        :value="message.matchScore / 100"
        color="white"
        size="4px"
        class="match-progress"/>
      <div class="text-caption q-pa-xs text-center match-text">
        匹配度: {{ message.matchScore }}%
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Message {
  id: string
  type: 'supply' | 'demand'
  title: string
  description: string
  category?: string
  location?: string
  tags: string[]
  contactInfo: any
  publishTime: Date
  status: string
  publisherInfo: any
  matchScore?: number
}

const props = defineProps<{
  message: Message
}>()

// Emits
const emit = defineEmits<{
  'view-detail': [message: Message]
  'contact': [message: Message]
}>()

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
}
</script>

<style scoped lang="scss">
.message-card {
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
  background: white;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: rgba(102, 126, 234, 0.3);
  }
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
  max-height: calc(1.6em * 3);
  color: #4a5568;
}

.info-row {
  margin: 12px 0;
}

.info-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: flex-start;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(102, 126, 234, 0.08);
  padding: 6px 12px;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.15);
  transition: all 0.2s ease;
  min-height: 32px;

  &:hover {
    background: rgba(102, 126, 234, 0.12);
    border-color: rgba(102, 126, 234, 0.25);
  }
}

.info-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
  line-height: 1;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;

  .q-chip {
    background: linear-gradient(45deg, #f7fafc, #edf2f7);
    color: #2d3748;
    border: 1px solid #e2e8f0;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(45deg, #e2e8f0, #cbd5e0);
      transform: translateY(-1px);
    }
  }
}

.publisher-info {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.05);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  min-height: 36px;

  .q-avatar {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;

  .q-btn {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

.match-indicator {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 8px;
  color: white;
  text-align: center;

  .q-linear-progress {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    overflow: hidden;

    .q-linear-progress__track {
      background: rgba(255, 255, 255, 0.9);
    }
  }
}

// Status indicators - 完全简化，移除所有装饰性伪元素
.message-card {
  // 移除所有 ::after 伪元素，避免视觉干扰
  // 状态通过其他方式表达，如卡片样式变化或图标
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}

// Responsive design
@media (max-width: 768px) {
  .message-card {
    margin-bottom: 16px;
    border-radius: 16px;

    &:hover {
      transform: translateY(-3px);
    }
  }

  .info-items {
    gap: 12px;
    flex-wrap: wrap;
  }

  .info-item {
    padding: 5px 10px;
    border-radius: 10px;
    gap: 5px;
  }

  .info-icon {
    font-size: 14px;
  }

  .info-text {
    font-size: 0.75rem;
  }

  .publisher-info {
    padding: 4px 8px;
    border-radius: 16px;
  }

  .action-buttons {
    gap: 4px;

    .q-btn {
      min-width: 36px;
      padding: 4px;
    }
  }
}

@media (max-width: 480px) {
  .tags-container {
    margin-bottom: 8px;

    .q-chip {
      font-size: 11px;
      padding: 2px 8px;
    }
  }

  .line-clamp-3 {
    -webkit-line-clamp: 2;
    max-height: calc(1.6em * 2);
  }

  .info-items {
    gap: 8px;
    justify-content: flex-start;
  }

  .info-item {
    padding: 4px 8px;
    font-size: 0.7rem;
    min-width: fit-content;
  }

  .info-icon {
    font-size: 12px;
  }

  .info-text {
    font-size: 0.7rem;
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .message-card {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
    color: #f9fafb;

    .line-clamp-3 {
      color: #d1d5db;
    }

    .tags-container .q-chip {
      background: linear-gradient(45deg, #374151, #4b5563);
      color: #e5e7eb;
      border-color: #4b5563;
    }

    .publisher-info {
      background: rgba(102, 126, 234, 0.15);
      border-color: rgba(102, 126, 234, 0.3);
    }
  }
}
</style>