<template>
  <q-card class="match-result-card" @click="$emit('view-detail', match.message)">
    <!-- 匹配度指示器 -->
    <div class="match-score-indicator">
      <q-linear-progress
        :value="match.matchScore / 100"
        :color="getScoreColor(match.matchScore)"
        size="6px"
        class="full-width"/>
    </div>

    <q-card-section class="q-pb-sm">
      <!-- 消息头部 -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="message-type">
          <q-chip
            :color="match.message.type === 'supply' ? 'positive' : 'info'"
            text-color="white"
            :icon="match.message.type === 'supply' ? 'trending_up' : 'trending_down'"
            size="sm">
            {{ match.message.type === 'supply' ? '供应' : '需求' }}
          </q-chip>
        </div>

        <div class="match-score">
          <q-chip
            :color="getScoreColor(match.matchScore)"
            text-color="white"
            icon="psychology"
            size="sm">
            {{ match.matchScore }}% 匹配
          </q-chip>
        </div>
      </div>

      <!-- 消息标题 -->
      <div class="text-h6 q-mb-sm text-weight-medium">
        {{ match.message.title }}
      </div>

      <!-- 消息描述 -->
      <div class="text-body2 text-grey-8 line-clamp-2 q-mb-md">
        {{ match.message.description }}
      </div>

      <!-- 基础信息 -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="row items-center">
            <q-icon
              v-if="match.message.category"
              name="category"
              size="14px"
              color="grey-6"
              class="q-mr-xs"/>
            <span v-if="match.message.category" class="text-caption text-grey-6 q-mr-md">
              {{ match.message.category }}
            </span>

            <q-icon
              v-if="match.message.location"
              name="location_on"
              size="14px"
              color="grey-6"
              class="q-mr-xs"/>
            <span v-if="match.message.location" class="text-caption text-grey-6">
              {{ match.message.location }}
            </span>
          </div>
        </div>
      </div>

      <!-- 标签 -->
      <div v-if="match.message.tags && match.message.tags.length" class="tags-container q-mb-md">
        <q-chip
          v-for="tag in match.message.tags.slice(0, 3)"
          :key="tag"
          size="sm"
          color="grey-2"
          text-color="grey-8"
          class="q-mr-xs q-mb-xs">
          {{ tag }}
        </q-chip>
      </div>

      <!-- 匹配原因 -->
      <div v-if="match.matchReason && match.matchReason.length" class="match-reasons q-mb-md">
        <div class="text-caption text-weight-medium text-grey-7 q-mb-xs">
          <q-icon name="lightbulb" size="14px" class="q-mr-xs"/>
          匹配原因
        </div>
        <div class="reasons-list">
          <div
            v-for="reason in match.matchReason.slice(0, 2)"
            :key="reason"
            class="reason-item">
            <q-icon name="check_circle" size="12px" color="positive" class="q-mr-xs"/>
            <span class="text-caption text-grey-8">{{ reason }}</span>
          </div>
          <div v-if="match.matchReason.length > 2" class="reason-item">
            <span class="text-caption text-grey-6">
              +{{ match.matchReason.length - 2 }} 更多原因
            </span>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator/>

    <!-- 操作区域 -->
    <q-card-actions align="between" class="q-px-md q-py-sm">
      <div class="publisher-info">
        <q-avatar size="24px" color="grey-3" text-color="grey-7">
          <q-icon name="person"/>
        </q-avatar>
        <span class="text-caption text-grey-6 q-ml-sm">
          {{ match.message.publisherInfo.nickname || '匿名用户' }}
        </span>
      </div>

      <div class="action-buttons">
        <q-btn
          @click.stop="$emit('view-detail', match.message)"
          size="sm"
          color="grey-6"
          flat
          dense
          icon="visibility"
          class="q-mr-sm">
          <q-tooltip>查看详情</q-tooltip>
        </q-btn>

        <q-btn
          @click.stop="$emit('contact', match.message)"
          size="sm"
          :color="getScoreColor(match.matchScore)"
          flat
          dense
          icon="message">
          <q-tooltip>联系对方</q-tooltip>
        </q-btn>
      </div>
    </q-card-actions>

    <!-- 高匹配度标识 -->
    <div v-if="match.matchScore >= 90" class="high-match-badge">
      <q-icon name="star" color="amber" size="16px"/>
      <span class="text-caption text-amber q-ml-xs">高匹配</span>
    </div>
  </q-card>
</template>

<script setup lang="ts">
interface MatchResult {
  messageId: string
  message: {
    id: string
    type: 'supply' | 'demand'
    title: string
    description: string
    category?: string
    location?: string
    tags: string[]
    contactInfo: any
    publishTime: Date
    publisherInfo: any
  }
  matchScore: number
  matchReason: string[]
}

const props = defineProps<{
  match: MatchResult
}>()

const emit = defineEmits<{
  'view-detail': [message: any]
  'contact': [message: any]
}>()

// 根据匹配度获取颜色
const getScoreColor = (score: number) => {
  if (score >= 90) return 'deep-purple'
  if (score >= 80) return 'purple'
  if (score >= 70) return 'indigo'
  if (score >= 60) return 'blue'
  return 'grey'
}
</script>

<style scoped lang="scss">
.match-result-card {
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
}

.match-score-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  max-height: calc(1.5em * 2);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.match-reasons {
  background: #f0f9ff;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #2196f3;
}

.reasons-list {
  .reason-item {
    display: flex;
    align-items: center;
    margin-bottom: 2px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.publisher-info {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  align-items: center;
}

.high-match-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 193, 7, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
}

@media (max-width: 600px) {
  .match-result-card {
    margin-bottom: 12px;
  }

  .action-buttons {
    .q-btn {
      min-width: 32px;
    }
  }

  .high-match-badge {
    top: 8px;
    right: 8px;
    padding: 2px 6px;
  }
}
</style>