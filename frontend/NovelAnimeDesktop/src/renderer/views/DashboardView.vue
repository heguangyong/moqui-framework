<template>
  <div class="dashboard-view">
    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <div class="stat-card stat-card--primary">
        <div class="stat-header">
          <div class="stat-icon">
            <component :is="icons.book" :size="24" />
          </div>
          <div class="stat-trend stat-trend--up">
            <component :is="icons.trendingUp" :size="14" />
            <span>+12%</span>
          </div>
        </div>
        <div class="stat-value">{{ projectStore.projectCounts.total }}</div>
        <div class="stat-label">总项目数</div>
      </div>
      
      <div class="stat-card stat-card--success">
        <div class="stat-header">
          <div class="stat-icon">
            <component :is="icons.check" :size="24" />
          </div>
          <div class="stat-trend stat-trend--up">
            <component :is="icons.trendingUp" :size="14" />
            <span>+8%</span>
          </div>
        </div>
        <div class="stat-value">{{ taskStore.taskCounts.completed }}</div>
        <div class="stat-label">已完成任务</div>
      </div>
      
      <div class="stat-card stat-card--warning">
        <div class="stat-header">
          <div class="stat-icon">
            <component :is="icons.refresh" :size="24" />
          </div>
        </div>
        <div class="stat-value">{{ taskStore.taskCounts.running }}</div>
        <div class="stat-label">处理中</div>
      </div>
      
      <div class="stat-card stat-card--info">
        <div class="stat-header">
          <div class="stat-icon">
            <component :is="icons.clock" :size="24" />
          </div>
        </div>
        <div class="stat-value">{{ taskStore.taskCounts.review }}</div>
        <div class="stat-label">待审核</div>
      </div>
    </div>
    
    <!-- 快速操作区域 -->
    <div class="quick-actions-section">
      <h3 class="section-title">快速操作</h3>
      <div class="quick-actions">
        <button class="quick-action-btn" @click="handleNewProject">
          <component :is="icons.plus" :size="20" />
          <span>新建项目</span>
        </button>
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
    <div class="recent-activity-section">
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
    
    <!-- 项目列表区域 -->
    <div class="projects-section">
      <div class="section-header">
        <h3 class="section-title">我的项目</h3>
        <button class="view-all-btn" @click="handleViewAllProjects">
          查看全部
          <component :is="icons.arrowRight" :size="14" />
        </button>
      </div>
      
      <div class="projects-grid">
        <div 
          v-for="project in recentProjects" 
          :key="project.id"
          class="project-card"
          @click="handleOpenProject(project)"
        >
          <div class="project-header">
            <div class="project-icon">
              <component :is="icons.book" :size="20" />
            </div>
            <div class="project-status" :class="`project-status--${project.status}`">
              {{ getStatusLabel(project.status) }}
            </div>
          </div>
          <div class="project-name">{{ project.name }}</div>
          <div class="project-description">{{ project.description || '暂无描述' }}</div>
          <div class="project-meta">
            <span class="project-date">
              <component :is="icons.calendar" :size="12" />
              {{ formatDate(project.updatedAt || project.createdAt) }}
            </span>
            <span class="project-progress" v-if="project.progress !== undefined">
              {{ project.progress }}%
            </span>
          </div>
        </div>
        
        <!-- 新建项目卡片 -->
        <div class="project-card project-card--new" @click="handleNewProject">
          <div class="new-project-icon">
            <component :is="icons.plus" :size="32" />
          </div>
          <div class="new-project-text">新建项目</div>
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

const router = useRouter();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const uiStore = useUIStore();

// 最近项目
const recentProjects = computed(() => {
  return projectStore.projects.slice(0, 5);
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

function getStatusLabel(status) {
  const labels = {
    draft: '草稿',
    processing: '处理中',
    completed: '已完成'
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
function handleNewProject() {
  const name = prompt('请输入项目名称:');
  if (name && name.trim()) {
    projectStore.createProject({
      name: name.trim(),
      description: '新建的小说动漫项目',
      type: 'novel-to-anime'
    }).then(project => {
      if (project) {
        uiStore.addNotification({
          type: 'success',
          title: '项目创建成功',
          message: `项目 "${name}" 已创建`,
          timeout: 2000
        });
        router.push(`/project/${project.id}`);
      }
    }).catch(error => {
      uiStore.addNotification({
        type: 'error',
        title: '创建失败',
        message: error.message,
        timeout: 3000
      });
    });
  }
}

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

function handleViewAllProjects() {
  router.push('/projects/my');
}

function handleOpenProject(project) {
  router.push(`/project/${project.id}`);
}
</script>

<style scoped>
.dashboard-view {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-card--primary .stat-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-card--success .stat-icon { background: linear-gradient(135deg, #48bb78, #38a169); }
.stat-card--warning .stat-icon { background: linear-gradient(135deg, #ed8936, #dd6b20); }
.stat-card--info .stat-icon { background: linear-gradient(135deg, #4299e1, #3182ce); }

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stat-trend--up { color: #48bb78; }
.stat-trend--down { color: #f56565; }

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #2c2c2e;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #6c6c6e;
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
  color: #4a90d9;
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

.activity-icon--parse { background: #4a90d9; }
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

/* 项目列表区域 */
.projects-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.project-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.project-status {
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 10px;
}

.project-status--draft { background: #e2e8f0; color: #64748b; }
.project-status--processing { background: #fef3c7; color: #d97706; }
.project-status--completed { background: #d1fae5; color: #059669; }

.project-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-description {
  font-size: 12px;
  color: #6c6c6e;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #8a8a8c;
}

.project-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.project-progress {
  font-weight: 500;
  color: #4a90d9;
}

/* 新建项目卡片 */
.project-card--new {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  background: transparent;
  min-height: 140px;
}

.project-card--new:hover {
  border-color: #4a90d9;
  background: rgba(74, 144, 217, 0.05);
}

.new-project-icon {
  color: #8a8a8c;
  margin-bottom: 8px;
}

.project-card--new:hover .new-project-icon {
  color: #4a90d9;
}

.new-project-text {
  font-size: 13px;
  color: #8a8a8c;
}

.project-card--new:hover .new-project-text {
  color: #4a90d9;
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
