<template>
  <div class="workflow-guide">
    <h3 class="section-title">快速开始</h3>
    <div class="steps-container">
      <div 
        v-for="(step, index) in steps" 
        :key="step.id"
        class="step-card"
        :class="{ 
          'step-card--active': currentStep === index,
          'step-card--completed': step.completed,
          'step-card--disabled': !step.enabled
        }"
        @click="handleStepClick(step, index)"
      >
        <div class="step-number" :class="{ 'step-number--completed': step.completed }">
          <component v-if="step.completed" :is="icons.check" :size="14" />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="step-content">
          <div class="step-icon">
            <component :is="step.icon" :size="24" />
          </div>
          <div class="step-info">
            <h4 class="step-title">{{ step.title }}</h4>
            <p class="step-description">{{ step.description }}</p>
          </div>
        </div>
        <div class="step-action">
          <button 
            v-if="step.actionLabel && (currentStep === index || step.completed)"
            class="step-btn"
            :class="{ 
              'step-btn--primary': currentStep === index && !step.completed,
              'step-btn--completed': step.completed
            }"
            @click.stop="handleStepAction(step)"
            :disabled="!step.enabled || isImporting"
          >
            {{ getStepButtonLabel(step) }}
          </button>
          <span v-else-if="step.actionLabel" class="step-btn-placeholder">
            {{ step.actionLabel }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 导入进度显示 -->
    <div v-if="isImporting" class="import-progress-section">
      <div class="progress-header">
        <span class="progress-message">{{ importMessage }}</span>
        <span class="progress-percent">{{ importProgress }}%</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: importProgress + '%' }"></div>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="importError" class="import-error">
      <component :is="icons.alertCircle" :size="16" />
      <span>{{ importError }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import * as icons from '@/utils/icons';

const props = defineProps({
  steps: {
    type: Array,
    required: true
  },
  currentStep: {
    type: Number,
    required: true
  },
  isImporting: {
    type: Boolean,
    default: false
  },
  importProgress: {
    type: Number,
    default: 0
  },
  importMessage: {
    type: String,
    default: ''
  },
  importError: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['step-click', 'step-action']);

function handleStepClick(step, index) {
  if (step.enabled || step.completed) {
    emit('step-click', { step, index });
  }
}

function handleStepAction(step) {
  emit('step-action', step);
}

function getStepButtonLabel(step) {
  if (step.completed) {
    // 完成后的按钮文字
    const completedLabels = {
      import: '重新导入',
      parse: '重新解析',
      characters: '查看角色',
      generate: '查看结果'
    };
    return completedLabels[step.id] || step.actionLabel;
  }
  return step.actionLabel;
}
</script>

<style scoped>
/* 向导式流程步骤 */
.workflow-guide {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 12px 0;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-card:hover:not(.step-card--disabled) {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.1);
}

.step-card--active {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(100, 140, 120, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.step-card--completed {
  background: rgba(100, 160, 130, 0.1);
  border-color: rgba(100, 160, 130, 0.2);
}

.step-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #8a8a8c;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-card--active .step-number {
  background: rgba(100, 140, 120, 0.2);
  border-color: rgba(100, 140, 120, 0.3);
  color: #4a6a52;
}

.step-number--completed {
  background: rgba(100, 160, 130, 0.3) !important;
  border-color: rgba(100, 160, 130, 0.4) !important;
  color: #3a6a4a !important;
}

.step-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-icon {
  color: #7a7a7c;
}

.step-card--active .step-icon {
  color: #5a6a5e;
}

.step-card--completed .step-icon {
  color: #4a7a5a;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 2px 0;
}

.step-description {
  font-size: 12px;
  color: #7a7a7c;
  margin: 0;
}

.step-action {
  flex-shrink: 0;
}

.step-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 16px;
  background-color: #c8c8c8;
  border: none;
  border-radius: 6px;
  color: #2c2c2e;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.step-btn:hover:not(:disabled) {
  background-color: #d8d8d8;
}

.step-btn--primary {
  background-color: #7a9188;
  color: #ffffff;
}

.step-btn--primary:hover:not(:disabled) {
  background-color: #6a8178;
}

.step-btn--completed {
  background-color: #5ab05e;
  color: #ffffff;
}

.step-btn--completed:hover:not(:disabled) {
  background-color: #4a9a4e;
}

.step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-btn-placeholder {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  color: #a0a0a2;
  font-size: 12px;
}

/* 导入进度 */
.import-progress-section {
  margin-top: 12px;
  padding: 12px;
  background: rgba(100, 140, 120, 0.08);
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-message {
  font-size: 12px;
  color: #5a6a5e;
  font-weight: 500;
}

.progress-percent {
  font-size: 12px;
  color: #7a8a7e;
  font-weight: 600;
}

.progress-bar-container {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #7aa88a;
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 错误提示 */
.import-error {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #dc2626;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
