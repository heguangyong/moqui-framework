<template>
  <div v-if="project" class="active-project-section">
    <h3 class="section-title">当前项目</h3>
    <div class="active-project-card" :class="{ 'active-project-card--completed': project.status === 'completed' }">
      <div class="project-info">
        <div class="project-icon" :class="{ 'project-icon--completed': project.status === 'completed' }">
          <component :is="project.status === 'completed' ? icons.check : icons.folder" :size="24" />
        </div>
        <div class="project-details">
          <h4>{{ project.name }}</h4>
          <p>{{ getStatusText(project.status) }} · {{ project.progress }}% 完成</p>
        </div>
      </div>
      <div class="project-progress">
        <div class="progress-bar" :class="{ 'progress-bar--completed': project.status === 'completed' }">
          <div class="progress-fill" :class="{ 'progress-fill--completed': project.status === 'completed' }" :style="{ width: project.progress + '%' }"></div>
        </div>
      </div>
      <!-- 已完成：显示查看结果和新建项目按钮 -->
      <template v-if="project.status === 'completed'">
        <button class="continue-btn continue-btn--success" @click="handleViewResults">
          查看结果
          <component :is="icons.eye" :size="16" />
        </button>
        <button class="continue-btn continue-btn--secondary" @click="handleStartNewProject">
          新建项目
          <component :is="icons.plus" :size="16" />
        </button>
      </template>
      <!-- 未完成：显示继续处理按钮 -->
      <template v-else>
        <button class="continue-btn" @click="handleContinueProject">
          继续处理
          <component :is="icons.arrowRight" :size="16" />
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { Folder, Check, Eye, Plus, ArrowRight } from 'lucide-vue-next';

// Icons
const icons = {
  folder: Folder,
  check: Check,
  eye: Eye,
  plus: Plus,
  arrowRight: ArrowRight
};

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['continue', 'view-results', 'new-project']);

// 获取状态显示文本
function getStatusText(status) {
  const statusTexts = {
    active: '进行中',
    importing: '导入中',
    imported: '已导入',
    analyzing: '分析中',
    analyzed: '已分析',
    parsing: '解析中',
    parsed: '已解析',
    characters_confirmed: '角色已确认',
    characters_continue: '角色确认中',
    generating: '生成中',
    completed: '已完成'
  };
  return statusTexts[status] || status || '进行中';
}

// Event handlers
function handleContinueProject() {
  emit('continue');
}

function handleViewResults() {
  emit('view-results');
}

function handleStartNewProject() {
  emit('new-project');
}
</script>

<style scoped>
/* 当前项目卡片 */
.active-project-section {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #7a7a7c;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.active-project-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(100, 140, 120, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5a7a62;
}

.project-icon--completed {
  background: rgba(90, 176, 94, 0.15);
  color: #5ab05e;
}

.project-details h4 {
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 2px 0;
}

.project-details p {
  font-size: 12px;
  color: #7a7a7c;
  margin: 0;
}

.project-progress {
  padding: 0 4px;
}

.progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar--completed {
  background: rgba(90, 176, 94, 0.2);
}

.progress-fill {
  height: 100%;
  background: #7aa88a;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill--completed {
  background: #5ab05e;
}

.continue-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  background-color: #7a9188;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.continue-btn:hover {
  background-color: #6a8178;
}

/* 完成状态的按钮样式 */
.continue-btn--success {
  background-color: #5ab05e;
  color: #ffffff;
}

.continue-btn--success:hover {
  background-color: #4a9a4e;
}

.continue-btn--secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
}

.continue-btn--secondary:hover {
  background-color: #d8d8d8;
}
</style>
