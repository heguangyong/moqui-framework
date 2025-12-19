<template>
  <div class="welcome-guide">
    <!-- 欢迎标题 -->
    <div class="welcome-header">
      <h1 class="welcome-title">欢迎使用 Novel Anime</h1>
      <p class="welcome-subtitle">将您的小说转换为精彩动漫</p>
    </div>

    <!-- 快速开始步骤 - 需求 5.1 -->
    <div class="quick-start">
      <h2 class="section-title">快速开始</h2>
      <div class="steps">
        <div 
          v-for="(step, index) in steps" 
          :key="step.id"
          class="step-card"
          :class="{ 'step-card--active': currentStep === index }"
          @click="handleStepClick(step, index)"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content">
            <div class="step-icon">
              <component :is="step.icon" :size="24" />
            </div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-description">{{ step.description }}</p>
          </div>
          <div class="step-action">
            <button 
              v-if="step.action && currentStep === index"
              class="step-btn"
              @click.stop="handleAction(step)"
            >
              {{ step.actionLabel }}
            </button>
            <span 
              v-else-if="step.action"
              class="step-btn-placeholder"
            >
              {{ step.actionLabel }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近项目 -->
    <div v-if="recentProjects.length > 0" class="recent-projects">
      <h2 class="section-title">最近项目</h2>
      <div class="project-list">
        <div 
          v-for="project in recentProjects" 
          :key="project.id"
          class="project-card"
          @click="openProject(project)"
        >
          <div class="project-icon">
            <component :is="icons.folder" :size="20" />
          </div>
          <div class="project-info">
            <div class="project-name">{{ project.name }}</div>
            <div class="project-date">{{ formatDate(project.updatedAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../../stores/project.js';
import { useUIStore } from '../../stores/ui.js';
import { icons } from '../../utils/icons.js';

const router = useRouter();
const projectStore = useProjectStore();
const uiStore = useUIStore();

// 当前步骤
const currentStep = ref(0);

// 快速开始步骤 - 需求 5.1
const steps = [
  {
    id: 'import',
    title: '导入小说',
    description: '支持 TXT、EPUB 等格式的小说文件',
    icon: icons.upload,
    action: 'import',
    actionLabel: '选择文件'
  },
  {
    id: 'parse',
    title: '智能解析',
    description: '自动识别章节、角色和场景',
    icon: icons.search,
    action: null,
    actionLabel: null
  },
  {
    id: 'characters',
    title: '角色确认',
    description: '审核和编辑识别出的角色信息',
    icon: icons.users,
    action: 'characters',
    actionLabel: '查看角色'
  },
  {
    id: 'workflow',
    title: '生成动漫',
    description: '配置工作流并开始生成',
    icon: icons.play,
    action: 'workflow',
    actionLabel: '开始创作'
  }
];

// 最近项目
const recentProjects = computed(() => {
  return projectStore.recentProjects?.slice(0, 3) || [];
});

// 步骤点击处理
function handleStepClick(step, index) {
  currentStep.value = index;
}

// 操作处理
function handleAction(step) {
  switch (step.action) {
    case 'import':
      importNovel();
      break;
    case 'characters':
      router.push('/characters');
      break;
    case 'workflow':
      router.push('/workflow');
      break;
  }
}

// 导入小说 - 需求 5.2
async function importNovel() {
  if (window.electronAPI) {
    try {
      const filePath = await window.electronAPI.openFile({
        filters: [
          { name: '小说文件', extensions: ['txt', 'epub', 'md'] }
        ]
      });
      
      if (filePath) {
        uiStore.addNotification({
          type: 'info',
          title: '正在导入',
          message: '正在解析小说文件...',
          timeout: 3000
        });
        
        // 导入完成后自动跳转到解析结果 - 需求 5.2
        router.push({
          path: '/import/result',
          query: { file: filePath }
        });
      }
    } catch (error) {
      uiStore.addNotification({
        type: 'error',
        title: '导入失败',
        message: error.message,
        timeout: 5000
      });
    }
  }
}

// 打开项目
function openProject(project) {
  projectStore.setCurrentProject(project);
  router.push(`/project/${project.id}`);
}

// 格式化日期
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
.welcome-guide {
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.welcome-header {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c2c2e;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 16px;
  color: #6c6c6e;
  margin: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #4a4a4c;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 快速开始步骤 */
.quick-start {
  margin-bottom: 40px;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 列表项 - 统一带线框 */
.step-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-card:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.12);
}

/* 选中状态 - 简洁高亮 */
.step-card--active {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.15);
}

.step-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #8a8a8c;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-card--active .step-number {
  background: rgba(120, 140, 130, 0.3);
  border-color: rgba(100, 120, 110, 0.4);
  color: #4a5a52;
}

.step-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-icon {
  color: #6c6c6e;
}

.step-card--active .step-icon {
  color: #5a5a5a;
}

.step-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0;
}

.step-description {
  font-size: 13px;
  color: #6c6c6e;
  margin: 0;
  flex: 1;
}

.step-action {
  flex-shrink: 0;
}

/* 步骤按钮 - 内容区简洁风格 */
.step-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 14px;
  background: rgba(120, 140, 130, 0.25);
  border: 1px solid rgba(100, 120, 110, 0.3);
  border-radius: 6px;
  color: #4a5a52;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.step-btn:hover {
  background: rgba(120, 140, 130, 0.35);
  color: #3a4a42;
}

/* 未选中状态的按钮 - 带线框 */
.step-btn-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  color: #9a9a9c;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* 最近项目 */
.recent-projects {
  margin-top: 32px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  background: rgba(255, 255, 255, 0.5);
}

.project-icon {
  color: #6c6c6e;
}

.project-info {
  flex: 1;
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.project-date {
  font-size: 12px;
  color: #8a8a8c;
}
</style>
