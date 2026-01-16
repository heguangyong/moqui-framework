<template>
  <div class="progress-indicator">
    <!-- 进度头部信息 -->
    <div class="progress-header">
      <div class="progress-title">
        <h3>{{ title }}</h3>
        <span class="progress-subtitle">{{ subtitle }}</span>
      </div>
      <div class="progress-actions" v-if="showActions">
        <button 
          v-if="canCancel && !isCompleted" 
          class="content-btn content-btn--secondary"
          @click="handleCancel"
          :disabled="isCancelling"
        >
          <component :is="icons.x" :size="14" />
          {{ isCancelling ? '取消中...' : '取消' }}
        </button>
        <button 
          v-if="canRetry && (isFailed || isCancelled)" 
          class="content-btn content-btn--primary"
          @click="handleRetry"
          :disabled="isRetrying"
        >
          <component :is="icons.refresh" :size="14" />
          {{ isRetrying ? '重试中...' : '重试' }}
        </button>
      </div>
    </div>

    <!-- 当前阶段信息 -->
    <div class="current-stage" v-if="currentStage">
      <div class="stage-info">
        <div class="stage-name">
          <component :is="getStageIcon(currentStage.type)" :size="16" />
          <span>{{ currentStage.name }}</span>
        </div>
        <div class="stage-status">
          <span class="stage-progress">{{ Math.round(currentStage.progress || 0) }}%</span>
          <span class="stage-time" v-if="estimatedTimeRemaining">
            剩余 {{ formatTime(estimatedTimeRemaining) }}
          </span>
        </div>
      </div>
      
      <!-- 阶段进度条 -->
      <div class="stage-progress-bar">
        <div 
          class="stage-progress-fill"
          :class="getProgressClass()"
          :style="{ width: `${currentStage.progress || 0}%` }"
        ></div>
      </div>
      
      <!-- 阶段描述 -->
      <div class="stage-description" v-if="currentStage.description">
        {{ currentStage.description }}
      </div>
    </div>

    <!-- 整体进度条 -->
    <div class="overall-progress">
      <div class="progress-info">
        <span class="progress-label">整体进度</span>
        <span class="progress-percentage">{{ Math.round(overallProgress) }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :class="getProgressClass()"
          :style="{ width: `${overallProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- 阶段列表 -->
    <div class="stages-list" v-if="stages && stages.length > 0">
      <div 
        v-for="(stage, index) in stages" 
        :key="stage.id || index"
        class="stage-item"
        :class="getStageItemClass(stage, index)"
      >
        <div class="stage-indicator">
          <component 
            :is="getStageStatusIcon(stage)" 
            :size="16" 
            :class="getStageIconClass(stage)"
          />
        </div>
        <div class="stage-content">
          <div class="stage-name">{{ stage.name }}</div>
          <div class="stage-meta">
            <span v-if="stage.startTime" class="stage-time">
              {{ formatDateTime(stage.startTime) }}
            </span>
            <span v-if="stage.duration" class="stage-duration">
              耗时 {{ formatDuration(stage.duration) }}
            </span>
          </div>
        </div>
        <div class="stage-progress" v-if="stage.status === 'running'">
          {{ Math.round(stage.progress || 0) }}%
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div class="error-info" v-if="error">
      <div class="error-header">
        <component :is="icons.alertCircle" :size="16" />
        <span>处理失败</span>
      </div>
      <div class="error-message">{{ error.message }}</div>
      <div class="error-details" v-if="error.details">
        <details>
          <summary>查看详细信息</summary>
          <pre>{{ error.details }}</pre>
        </details>
      </div>
    </div>

    <!-- 完成信息 -->
    <div class="completion-info" v-if="isCompleted">
      <div class="completion-header">
        <component :is="icons.check" :size="16" />
        <span>处理完成</span>
      </div>
      <div class="completion-summary">
        <span>总耗时: {{ formatDuration(totalDuration) }}</span>
        <span v-if="processedItems">处理项目: {{ processedItems }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { icons } from '../../utils/icons.js';

// Props
const props = defineProps({
  title: {
    type: String,
    default: '处理进度'
  },
  subtitle: {
    type: String,
    default: ''
  },
  currentStage: {
    type: Object,
    default: null
  },
  stages: {
    type: Array,
    default: () => []
  },
  overallProgress: {
    type: Number,
    default: 0
  },
  estimatedTimeRemaining: {
    type: Number,
    default: null
  },
  totalDuration: {
    type: Number,
    default: null
  },
  processedItems: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    default: 'idle', // idle, running, completed, failed, cancelled
    validator: (value) => ['idle', 'running', 'completed', 'failed', 'cancelled'].includes(value)
  },
  error: {
    type: Object,
    default: null
  },
  canCancel: {
    type: Boolean,
    default: true
  },
  canRetry: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 1000 // 1秒
  }
});

// Emits
const emit = defineEmits(['cancel', 'retry', 'refresh']);

// State
const isCancelling = ref(false);
const isRetrying = ref(false);
const refreshTimer = ref(null);

// Computed
const isRunning = computed(() => props.status === 'running');
const isCompleted = computed(() => props.status === 'completed');
const isFailed = computed(() => props.status === 'failed');
const isCancelled = computed(() => props.status === 'cancelled');

// Methods
function getStageIcon(type) {
  const iconMap = {
    import: icons.upload,
    parse: icons.fileText,
    extract: icons.users,
    analyze: icons.search,
    generate: icons.zap,
    export: icons.download,
    default: icons.circle
  };
  return iconMap[type] || iconMap.default;
}

function getStageStatusIcon(stage) {
  switch (stage.status) {
    case 'completed':
      return icons.check;
    case 'running':
      return icons.refresh;
    case 'failed':
      return icons.alertCircle;
    case 'cancelled':
      return icons.x;
    default:
      return icons.circle;
  }
}

function getStageIconClass(stage) {
  return {
    'stage-icon--completed': stage.status === 'completed',
    'stage-icon--running': stage.status === 'running',
    'stage-icon--failed': stage.status === 'failed',
    'stage-icon--cancelled': stage.status === 'cancelled',
    'stage-icon--pending': stage.status === 'pending'
  };
}

function getStageItemClass(stage, index) {
  return {
    'stage-item--completed': stage.status === 'completed',
    'stage-item--running': stage.status === 'running',
    'stage-item--failed': stage.status === 'failed',
    'stage-item--cancelled': stage.status === 'cancelled',
    'stage-item--pending': stage.status === 'pending'
  };
}

function getProgressClass() {
  return {
    'progress-fill--running': isRunning.value,
    'progress-fill--completed': isCompleted.value,
    'progress-fill--failed': isFailed.value,
    'progress-fill--cancelled': isCancelled.value
  };
}

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds < 0) return '--';
  
  const seconds = Math.floor(milliseconds / 1000);
  return formatTime(seconds);
}

function formatDateTime(timestamp) {
  if (!timestamp) return '--';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

async function handleCancel() {
  if (isCancelling.value) return;
  
  isCancelling.value = true;
  try {
    emit('cancel');
  } finally {
    // 延迟重置状态，给用户反馈
    setTimeout(() => {
      isCancelling.value = false;
    }, 1000);
  }
}

async function handleRetry() {
  if (isRetrying.value) return;
  
  isRetrying.value = true;
  try {
    emit('retry');
  } finally {
    // 延迟重置状态，给用户反馈
    setTimeout(() => {
      isRetrying.value = false;
    }, 1000);
  }
}

function startAutoRefresh() {
  if (!props.autoRefresh || refreshTimer.value) return;
  
  refreshTimer.value = setInterval(() => {
    if (isRunning.value) {
      emit('refresh');
    }
  }, props.refreshInterval);
}

function stopAutoRefresh() {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
}

// Watchers
watch(() => props.status, (newStatus) => {
  if (newStatus === 'running') {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

// Lifecycle
onMounted(() => {
  if (isRunning.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.progress-indicator {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}

/* 进度头部 */
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.progress-title h3 {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.progress-subtitle {
  font-size: 13px;
  color: #6c6c6e;
}

.progress-actions {
  display: flex;
  gap: 8px;
}

/* 当前阶段 */
.current-stage {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.stage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stage-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.stage-status {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6c6c6e;
}

.stage-progress {
  font-weight: 600;
  color: #2c2c2e;
}

.stage-progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.stage-progress-fill {
  height: 100%;
  background: #6a8a7a;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stage-description {
  font-size: 12px;
  color: #8a8a8c;
  line-height: 1.4;
}

/* 整体进度 */
.overall-progress {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 13px;
  font-weight: 500;
  color: #4a4a4c;
}

.progress-percentage {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill--running {
  background: #7a9a8a;
}

.progress-fill--completed {
  background: #728f82;
}

.progress-fill--failed {
  background: #a87878;
}

.progress-fill--cancelled {
  background: #929292;
}

/* 阶段列表 */
.stages-list {
  margin-bottom: 16px;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.stage-item:last-child {
  border-bottom: none;
}

.stage-indicator {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-icon--completed {
  color: #6a8a7a;
}

.stage-icon--running {
  color: #6a8a7a;
  animation: spin 1s linear infinite;
}

.stage-icon--failed {
  color: #a07070;
}

.stage-icon--cancelled {
  color: #8a8a8a;
}

.stage-icon--pending {
  color: #c0c0c0;
}

.stage-content {
  flex: 1;
  min-width: 0;
}

.stage-item .stage-name {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
  margin-bottom: 2px;
}

.stage-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #8a8a8c;
}

.stage-item .stage-progress {
  font-size: 12px;
  font-weight: 600;
  color: #6a8a7a;
}

/* 错误信息 */
.error-info {
  background: rgba(200, 120, 120, 0.1);
  border: 1px solid rgba(200, 120, 120, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #a07070;
  margin-bottom: 8px;
}

.error-message {
  font-size: 13px;
  color: #8a5050;
  margin-bottom: 8px;
}

.error-details summary {
  font-size: 12px;
  color: #8a5050;
  cursor: pointer;
  margin-bottom: 8px;
}

.error-details pre {
  font-size: 11px;
  color: #7a4040;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 完成信息 */
.completion-info {
  background: rgba(106, 138, 122, 0.1);
  border: 1px solid rgba(106, 138, 122, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.completion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6a8a7a;
  margin-bottom: 8px;
}

.completion-summary {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #5a7a6a;
}

/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .progress-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .stage-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .completion-summary {
    flex-direction: column;
    gap: 4px;
  }
}
</style>