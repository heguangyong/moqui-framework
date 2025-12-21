<template>
  <div class="large-file-processor">
    <!-- 文件信息 -->
    <div class="file-info" v-if="fileInfo">
      <div class="file-header">
        <div class="file-details">
          <h4>{{ fileInfo.name }}</h4>
          <div class="file-meta">
            <span>大小: {{ formatFileSize(fileInfo.size) }}</span>
            <span>类型: {{ fileInfo.type || '未知' }}</span>
            <span v-if="fileInfo.wordCount">字数: {{ fileInfo.wordCount.toLocaleString() }}</span>
          </div>
        </div>
        <div class="file-actions">
          <button 
            v-if="canPause && isProcessing" 
            class="content-btn content-btn--secondary"
            @click="pauseProcessing"
            :disabled="isPausing"
          >
            <component :is="icons.pause" :size="14" />
            {{ isPausing ? '暂停中...' : '暂停' }}
          </button>
          <button 
            v-if="canResume && isPaused" 
            class="content-btn content-btn--primary"
            @click="resumeProcessing"
            :disabled="isResuming"
          >
            <component :is="icons.play" :size="14" />
            {{ isResuming ? '恢复中...' : '恢复' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 分块处理进度 -->
    <div class="chunk-progress" v-if="chunkInfo">
      <div class="chunk-header">
        <span class="chunk-title">分块处理进度</span>
        <span class="chunk-stats">
          {{ chunkInfo.processedChunks }} / {{ chunkInfo.totalChunks }} 块
        </span>
      </div>
      
      <!-- 分块进度条 -->
      <div class="chunk-progress-bar">
        <div 
          class="chunk-progress-fill"
          :style="{ width: `${chunkProgress}%` }"
        ></div>
      </div>
      
      <!-- 分块详情 -->
      <div class="chunk-details">
        <div class="chunk-info-item">
          <span>块大小: {{ formatFileSize(chunkInfo.chunkSize) }}</span>
        </div>
        <div class="chunk-info-item">
          <span>处理速度: {{ formatProcessingSpeed() }}</span>
        </div>
        <div class="chunk-info-item" v-if="estimatedTimeRemaining">
          <span>预计剩余: {{ formatTime(estimatedTimeRemaining) }}</span>
        </div>
      </div>
    </div>

    <!-- 内存使用监控 -->
    <div class="memory-monitor" v-if="memoryInfo && showMemoryInfo">
      <div class="memory-header">
        <component :is="icons.barChart3" :size="16" />
        <span>内存使用情况</span>
      </div>
      <div class="memory-bars">
        <div class="memory-bar">
          <div class="memory-label">已使用</div>
          <div class="memory-progress">
            <div 
              class="memory-fill"
              :class="getMemoryClass(memoryInfo.usedPercent)"
              :style="{ width: `${memoryInfo.usedPercent}%` }"
            ></div>
          </div>
          <div class="memory-value">{{ formatFileSize(memoryInfo.used) }}</div>
        </div>
        <div class="memory-bar">
          <div class="memory-label">总内存</div>
          <div class="memory-progress">
            <div class="memory-fill memory-fill--total" style="width: 100%"></div>
          </div>
          <div class="memory-value">{{ formatFileSize(memoryInfo.total) }}</div>
        </div>
      </div>
      <div class="memory-warning" v-if="memoryInfo.usedPercent > 80">
        <component :is="icons.alertCircle" :size="14" />
        <span>内存使用率较高，建议暂停其他应用</span>
      </div>
    </div>

    <!-- 处理状态 -->
    <div class="processing-status">
      <div class="status-item">
        <span class="status-label">状态:</span>
        <span class="status-value" :class="getStatusClass()">
          {{ getStatusText() }}
        </span>
      </div>
      <div class="status-item" v-if="startTime">
        <span class="status-label">开始时间:</span>
        <span class="status-value">{{ formatDateTime(startTime) }}</span>
      </div>
      <div class="status-item" v-if="elapsedTime">
        <span class="status-label">已用时间:</span>
        <span class="status-value">{{ formatTime(elapsedTime) }}</span>
      </div>
    </div>

    <!-- 错误处理 -->
    <div class="error-section" v-if="error">
      <div class="error-header">
        <component :is="icons.alertCircle" :size="16" />
        <span>处理错误</span>
      </div>
      <div class="error-message">{{ error.message }}</div>
      <div class="error-actions">
        <button 
          class="content-btn content-btn--primary"
          @click="retryFromLastChunk"
          :disabled="isRetrying"
        >
          <component :is="icons.refresh" :size="14" />
          {{ isRetrying ? '重试中...' : '从断点重试' }}
        </button>
        <button 
          class="content-btn content-btn--secondary"
          @click="restartProcessing"
          :disabled="isRestarting"
        >
          <component :is="icons.rotateCcw" :size="14" />
          {{ isRestarting ? '重新开始中...' : '重新开始' }}
        </button>
      </div>
    </div>

    <!-- 完成信息 -->
    <div class="completion-section" v-if="isCompleted">
      <div class="completion-header">
        <component :is="icons.check" :size="16" />
        <span>处理完成</span>
      </div>
      <div class="completion-stats">
        <div class="stat-item">
          <span class="stat-label">总耗时:</span>
          <span class="stat-value">{{ formatTime(totalDuration) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">处理块数:</span>
          <span class="stat-value">{{ chunkInfo?.totalChunks || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均速度:</span>
          <span class="stat-value">{{ formatProcessingSpeed(true) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { icons } from '../../utils/icons.js';

// Props
const props = defineProps({
  fileInfo: {
    type: Object,
    default: null
  },
  chunkInfo: {
    type: Object,
    default: null
  },
  memoryInfo: {
    type: Object,
    default: null
  },
  status: {
    type: String,
    default: 'idle', // idle, processing, paused, completed, failed
    validator: (value) => ['idle', 'processing', 'paused', 'completed', 'failed'].includes(value)
  },
  error: {
    type: Object,
    default: null
  },
  startTime: {
    type: Number,
    default: null
  },
  elapsedTime: {
    type: Number,
    default: null
  },
  totalDuration: {
    type: Number,
    default: null
  },
  estimatedTimeRemaining: {
    type: Number,
    default: null
  },
  canPause: {
    type: Boolean,
    default: true
  },
  canResume: {
    type: Boolean,
    default: true
  },
  showMemoryInfo: {
    type: Boolean,
    default: true
  },
  processingSpeed: {
    type: Number,
    default: null // bytes per second
  }
});

// Emits
const emit = defineEmits(['pause', 'resume', 'retry', 'restart']);

// State
const isPausing = ref(false);
const isResuming = ref(false);
const isRetrying = ref(false);
const isRestarting = ref(false);

// Computed
const isProcessing = computed(() => props.status === 'processing');
const isPaused = computed(() => props.status === 'paused');
const isCompleted = computed(() => props.status === 'completed');
const isFailed = computed(() => props.status === 'failed');

const chunkProgress = computed(() => {
  if (!props.chunkInfo) return 0;
  return (props.chunkInfo.processedChunks / props.chunkInfo.totalChunks) * 100;
});

// Methods
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

function formatDateTime(timestamp) {
  if (!timestamp) return '--';
  
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatProcessingSpeed(useAverage = false) {
  const speed = useAverage && props.totalDuration 
    ? (props.fileInfo?.size || 0) / (props.totalDuration / 1000)
    : props.processingSpeed;
    
  if (!speed || speed === 0) return '--';
  
  return `${formatFileSize(speed)}/s`;
}

function getStatusText() {
  const statusMap = {
    idle: '等待中',
    processing: '处理中',
    paused: '已暂停',
    completed: '已完成',
    failed: '处理失败'
  };
  return statusMap[props.status] || props.status;
}

function getStatusClass() {
  return {
    'status--idle': props.status === 'idle',
    'status--processing': props.status === 'processing',
    'status--paused': props.status === 'paused',
    'status--completed': props.status === 'completed',
    'status--failed': props.status === 'failed'
  };
}

function getMemoryClass(percent) {
  if (percent > 90) return 'memory-fill--critical';
  if (percent > 80) return 'memory-fill--warning';
  if (percent > 60) return 'memory-fill--high';
  return 'memory-fill--normal';
}

async function pauseProcessing() {
  if (isPausing.value) return;
  
  isPausing.value = true;
  try {
    emit('pause');
  } finally {
    setTimeout(() => {
      isPausing.value = false;
    }, 1000);
  }
}

async function resumeProcessing() {
  if (isResuming.value) return;
  
  isResuming.value = true;
  try {
    emit('resume');
  } finally {
    setTimeout(() => {
      isResuming.value = false;
    }, 1000);
  }
}

async function retryFromLastChunk() {
  if (isRetrying.value) return;
  
  isRetrying.value = true;
  try {
    emit('retry', { fromLastChunk: true });
  } finally {
    setTimeout(() => {
      isRetrying.value = false;
    }, 1000);
  }
}

async function restartProcessing() {
  if (isRestarting.value) return;
  
  isRestarting.value = true;
  try {
    emit('restart');
  } finally {
    setTimeout(() => {
      isRestarting.value = false;
    }, 1000);
  }
}
</script>

<style scoped>
.large-file-processor {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}

/* 文件信息 */
.file-info {
  margin-bottom: 20px;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.file-details h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 8px 0;
}

.file-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6c6c6e;
}

.file-actions {
  display: flex;
  gap: 8px;
}

/* 分块进度 */
.chunk-progress {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.chunk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chunk-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.chunk-stats {
  font-size: 13px;
  font-weight: 600;
  color: #6a8a7a;
}

.chunk-progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.chunk-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6a8a7a, #8aaa9a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.chunk-details {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #6c6c6e;
}

/* 内存监控 */
.memory-monitor {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.memory-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
  margin-bottom: 12px;
}

.memory-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.memory-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.memory-label {
  flex: 0 0 60px;
  font-size: 12px;
  color: #6c6c6e;
}

.memory-progress {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.memory-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.memory-fill--normal {
  background: #6a8a7a;
}

.memory-fill--high {
  background: #a09060;
}

.memory-fill--warning {
  background: #a07070;
}

.memory-fill--critical {
  background: #a05050;
}

.memory-fill--total {
  background: rgba(0, 0, 0, 0.2);
}

.memory-value {
  flex: 0 0 80px;
  font-size: 12px;
  color: #4a4a4c;
  text-align: right;
}

.memory-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #a07070;
  background: rgba(200, 120, 120, 0.1);
  padding: 8px;
  border-radius: 4px;
}

/* 处理状态 */
.processing-status {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

.status-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.status-label {
  color: #6c6c6e;
}

.status-value {
  font-weight: 500;
  color: #2c2c2e;
}

.status--processing {
  color: #6a8a7a !important;
}

.status--paused {
  color: #a09060 !important;
}

.status--completed {
  color: #6a8a7a !important;
}

.status--failed {
  color: #a07070 !important;
}

/* 错误处理 */
.error-section {
  background: rgba(200, 120, 120, 0.1);
  border: 1px solid rgba(200, 120, 120, 0.2);
  border-radius: 8px;
  padding: 16px;
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
  margin-bottom: 12px;
}

.error-actions {
  display: flex;
  gap: 8px;
}

/* 完成信息 */
.completion-section {
  background: rgba(106, 138, 122, 0.1);
  border: 1px solid rgba(106, 138, 122, 0.2);
  border-radius: 8px;
  padding: 16px;
}

.completion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6a8a7a;
  margin-bottom: 12px;
}

.completion-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.stat-label {
  color: #5a7a6a;
}

.stat-value {
  font-weight: 500;
  color: #4a6a5a;
}

/* 响应式 */
@media (max-width: 768px) {
  .file-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .file-meta {
    flex-direction: column;
    gap: 4px;
  }
  
  .chunk-details {
    flex-direction: column;
    gap: 8px;
  }
  
  .processing-status {
    flex-direction: column;
    gap: 8px;
  }
  
  .completion-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .error-actions {
    flex-direction: column;
  }
}
</style>