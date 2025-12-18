<template>
  <div class="dashboard-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="仪表盘" 
      subtitle="任务概览和快速操作"
    />
    
    <!-- 欢迎引导 - 需求 5.1: 首次打开显示快速开始指南 -->
    <WelcomeGuide v-if="showWelcomeGuide" />
    
    <!-- 快速操作区域 -->
    <div class="quick-actions-section" v-if="!showWelcomeGuide">
      <h3 class="section-title">快速操作</h3>
      <div class="quick-actions">
        <button class="quick-action-btn" @click="handleImportNovel">
          <component :is="icons.upload" :size="20" />
          <span>导入小说</span>
        </button>
        <button class="quick-action-btn" @click="handleOpenWorkflow">
          <component :is="icons.workflow" :size="20" />
          <span>工作流编辑</span>
        </button>
        <button class="quick-action-btn" @click="handleOpenSettings">
          <component :is="icons.settings" :size="20" />
          <span>系统设置</span>
        </button>
      </div>
    </div>
    
    <!-- 最近活动区域 -->
    <div class="recent-activity-section" v-if="!showWelcomeGuide">
      <div class="section-header">
        <h3 class="section-title">最近活动</h3>
        <button class="view-all-btn" @click="handleViewAllActivity">
          查看全部
          <component :is="icons.arrowRight" :size="14" />
        </button>
      </div>
      
      <div class="activity-list">
        <div 
          v-for="activity in recentActivities" 
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon" :class="`activity-icon--${activity.type}`">
            <component :is="getActivityIcon(activity.type)" :size="16" />
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-description">{{ activity.description }}</div>
          </div>
          <div class="activity-time">{{ formatTime(activity.time) }}</div>
        </div>
        
        <div v-if="recentActivities.length === 0" class="activity-empty">
          <component :is="icons.clock" :size="32" />
          <span>暂无最近活动</span>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project.js';
import { useTaskStore } from '../stores/task.js';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import WelcomeGuide from '../components/welcome/WelcomeGuide.vue';

const router = useRouter();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const uiStore = useUIStore();

// 是否显示欢迎引导 - 需求 5.1: 首次打开或无项目时显示
const showWelcomeGuide = computed(() => {
  return projectStore.projects.length === 0;
});

// 最近活动
const recentActivities = ref([]);

onMounted(() => {
  loadRecentActivities();
});

function loadRecentActivities() {
  // 从任务中生成活动记录
  const activities = [];
  
  taskStore.tasks.slice(0, 10).forEach(task => {
    activities.push({
      id: task.id,
      type: task.type,
      title: task.name,
      description: `项目任务 - ${getTaskStatusLabel(task.status)}`,
      time: task.completedAt || task.startedAt || task.createdAt
    });
  });
  
  // 按时间排序
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  recentActivities.value = activities.slice(0, 5);
}

function getActivityIcon(type) {
  const iconMap = {
    parse: icons.fileText,
    analyze: icons.users,
    script: icons.file,
    storyboard: icons.image,
    video: icons.video
  };
  return iconMap[type] || icons.zap;
}

function getTaskStatusLabel(status) {
  const labels = {
    pending: '等待中',
    running: '处理中',
    review: '待审核',
    completed: '已完成',
    failed: '失败'
  };
  return labels[status] || status;
}

function formatTime(time) {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return formatDate(time);
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}

// 操作处理
function handleImportNovel() {
  uiStore.addNotification({
    type: 'info',
    title: '导入小说',
    message: '请拖拽TXT文件到窗口或点击选择文件',
    timeout: 2000
  });
}

function handleOpenWorkflow() {
  router.push('/workflow');
}

function handleOpenSettings() {
  router.push('/settings');
}

function handleViewAllActivity() {
  uiStore.addNotification({
    type: 'info',
    title: '活动记录',
    message: '正在打开活动记录页面',
    timeout: 2000
  });
}
</script>

<style scoped>
.dashboard-view {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  overflow-y: auto;
}

/* 快速操作区域 */
.quick-actions-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 12px 0;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #2c2c2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 最近活动区域 */
.recent-activity-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #6a6a6a;
  font-size: 12px;
  cursor: pointer;
}

.view-all-btn:hover {
  text-decoration: underline;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.activity-icon--parse { background: #7a7a7a; }
.activity-icon--analyze { background: #9b59b6; }
.activity-icon--script { background: #27ae60; }
.activity-icon--storyboard { background: #e67e22; }
.activity-icon--video { background: #e74c3c; }

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

.activity-description {
  font-size: 11px;
  color: #6c6c6e;
}

.activity-time {
  font-size: 11px;
  color: #8a8a8c;
}

.activity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #8a8a8c;
  gap: 8px;
  font-size: 13px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-wrap: wrap;
  }
}
</style>
