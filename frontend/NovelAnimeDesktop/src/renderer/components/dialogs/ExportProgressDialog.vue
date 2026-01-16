<template>
  <div v-if="visible" class="export-progress-overlay">
    <div class="export-progress-dialog">
      <div class="dialog-header">
        <h3>导出进度</h3>
        <button 
          v-if="canCancel" 
          @click="handleCancel" 
          class="cancel-btn"
        >
          取消
        </button>
      </div>
      
      <div class="dialog-content">
        <!-- 状态图标 -->
        <div class="status-icon" :class="`status-${progress.status}`">
          <component 
            v-if="progress.status === 'preparing'" 
            :is="icons.settings" 
            :size="32" 
            class="preparing-icon"
          />
          <component 
            v-else-if="progress.status === 'exporting'" 
            :is="icons.download" 
            :size="32" 
            class="exporting-icon"
          />
          <component 
            v-else-if="progress.status === 'completed'" 
            :is="icons.check" 
            :size="32" 
            class="completed-icon"
          />
          <component 
            v-else-if="progress.status === 'error'" 
            :is="icons.xCircle" 
            :size="32" 
            class="error-icon"
          />
        </div>
        
        <!-- 进度信息 -->
        <div class="progress-info">
          <div class="progress-message">{{ progress.message }}</div>
          <div class="progress-details">
            <span>{{ progress.current }} / {{ progress.total }}</span>
            <span class="progress-percentage">{{ progress.percentage }}%</span>
          </div>
        </div>
        
        <!-- 进度条 -->
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progress.percentage + '%' }"
              :class="`fill-${progress.status}`"
            ></div>
          </div>
        </div>
        
        <!-- 当前处理项 -->
        <div v-if="progress.currentItem && progress.status === 'exporting'" class="current-item">
          <span class="current-label">正在处理:</span>
          <span class="current-text">{{ progress.currentItem }}</span>
        </div>
        
        <!-- 预计时间 -->
        <div v-if="estimatedTime && progress.status === 'exporting'" class="estimated-time">
          <span class="time-label">预计剩余时间:</span>
          <span class="time-text">{{ formatTime(estimatedTime) }}</span>
        </div>
        
        <!-- 完成信息 -->
        <div v-if="progress.status === 'completed'" class="completion-info">
          <div class="completion-message">导出完成！</div>
          <div v-if="exportPath" class="export-path">
            <span class="path-label">保存位置:</span>
            <span class="path-text">{{ exportPath }}</span>
          </div>
        </div>
        
        <!-- 错误信息 -->
        <div v-if="progress.status === 'error'" class="error-info">
          <div class="error-message">{{ progress.message }}</div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button 
          v-if="progress.status === 'completed'" 
          @click="openExportFolder" 
          class="btn btn-secondary"
        >
          <component :is="icons.folder" :size="14" />
          打开文件夹
        </button>
        
        <button 
          v-if="progress.status === 'completed' || progress.status === 'error'" 
          @click="close" 
          class="btn btn-primary"
        >
          关闭
        </button>
        
        <button 
          v-if="progress.status === 'exporting' && canCancel" 
          @click="handleCancel" 
          class="btn btn-danger"
        >
          取消导出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { icons } from '../../utils/icons.js';
import type { ExportProgress } from '../../services/ExportService';

interface Props {
  visible: boolean;
  progress: ExportProgress;
  exportPath?: string;
  canCancel?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'cancel'): void;
  (e: 'openFolder', path: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  canCancel: true
});

const emit = defineEmits<Emits>();

// 响应式数据
const startTime = ref<number>(0);
const estimatedTime = ref<number>(0);

// 计算属性
const elapsedTime = computed(() => {
  if (startTime.value === 0) return 0;
  return Date.now() - startTime.value;
});

// 监听进度变化，计算预计时间
watch(() => props.progress, (newProgress) => {
  if (newProgress.status === 'exporting') {
    if (startTime.value === 0) {
      startTime.value = Date.now();
    }
    
    // 计算预计剩余时间
    if (newProgress.percentage > 0 && newProgress.percentage < 100) {
      const elapsed = elapsedTime.value;
      const totalEstimated = (elapsed / newProgress.percentage) * 100;
      estimatedTime.value = totalEstimated - elapsed;
    }
  } else if (newProgress.status === 'preparing') {
    startTime.value = 0;
    estimatedTime.value = 0;
  }
}, { deep: true });

function close(): void {
  emit('update:visible', false);
}

function handleCancel(): void {
  emit('cancel');
}

function openExportFolder(): void {
  if (props.exportPath) {
    emit('openFolder', props.exportPath);
  }
}

function formatTime(ms: number): string {
  if (ms <= 0) return '计算中...';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}
</script>

<style scoped>
.export-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.export-progress-dialog {
  width: 90%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

.cancel-btn {
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  color: #666;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(200, 120, 120, 0.1);
  border-color: rgba(200, 120, 120, 0.3);
  color: #8a5050;
}

.dialog-content {
  padding: 32px 24px;
  text-align: center;
}

/* 状态图标 */
.status-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.status-icon.status-preparing {
  color: #3498db;
}

.status-icon.status-exporting {
  color: #2ecc71;
}

.status-icon.status-completed {
  color: #27ae60;
}

.status-icon.status-error {
  color: #e74c3c;
}

.preparing-icon {
  animation: spin 2s linear infinite;
}

.exporting-icon {
  animation: bounce 1.5s ease-in-out infinite;
}

.completed-icon {
  animation: checkmark 0.6s ease-out;
}

.error-icon {
  animation: shake 0.5s ease-in-out;
}

/* 进度信息 */
.progress-info {
  margin-bottom: 20px;
}

.progress-message {
  font-size: 16px;
  font-weight: 500;
  color: #2c2c2e;
  margin-bottom: 8px;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.progress-percentage {
  font-weight: 600;
  color: #2c2c2e;
}

/* 进度条 */
.progress-bar-container {
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.fill-preparing {
  background: #4aa3d8;
  animation: pulse 1.5s ease-in-out infinite;
}

.progress-fill.fill-exporting {
  background: #40d47e;
}

.progress-fill.fill-completed {
  background: #2bd468;
}

.progress-fill.fill-error {
  background: #e9594f;
}

/* 当前处理项 */
.current-item {
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(46, 204, 113, 0.05);
  border-radius: 8px;
  border-left: 3px solid #2ecc71;
}

.current-label {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.current-text {
  font-size: 14px;
  color: #2c2c2e;
  font-weight: 500;
}

/* 预计时间 */
.estimated-time {
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}

.time-label {
  margin-right: 8px;
}

.time-text {
  font-weight: 500;
  color: #2c2c2e;
}

/* 完成信息 */
.completion-info {
  text-align: left;
}

.completion-message {
  font-size: 16px;
  font-weight: 600;
  color: #27ae60;
  margin-bottom: 12px;
  text-align: center;
}

.export-path {
  padding: 12px;
  background: rgba(39, 174, 96, 0.05);
  border-radius: 8px;
  border-left: 3px solid #27ae60;
}

.path-label {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.path-text {
  font-size: 13px;
  color: #2c2c2e;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  word-break: break-all;
}

/* 错误信息 */
.error-info {
  text-align: left;
}

.error-message {
  padding: 12px;
  background: rgba(231, 76, 60, 0.05);
  border-radius: 8px;
  border-left: 3px solid #e74c3c;
  color: #c0392b;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 20px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.btn-secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
  border-color: rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background-color: #d8d8d8;
}

.btn-primary {
  background-color: #7a9188;
  color: #ffffff;
  border-color: rgba(100, 120, 110, 0.3);
}

.btn-primary:hover {
  background-color: #6a8178;
}

.btn-danger {
  background-color: #e53e3e;
  color: #ffffff;
  border-color: rgba(200, 120, 120, 0.25);
}

.btn-danger:hover {
  background-color: #c53030;
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

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
}

@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .export-progress-dialog {
    width: 95%;
    margin: 20px;
  }
  
  .dialog-content {
    padding: 24px 20px;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .btn {
    width: 100%;
  }
}
</style>