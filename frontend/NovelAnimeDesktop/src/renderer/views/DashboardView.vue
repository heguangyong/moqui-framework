<template>
  <div class="dashboard-view">
    <!-- 根据 panelContext 显示不同内容 -->
    
    <!-- 状态视图 - 新建 -->
    <template v-if="currentViewType === 'status' && statusFilter === 'new'">
      <div class="view-header">
        <h2>新建任务</h2>
        <p>等待处理的新任务</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.circle" :size="48" />
        <span>新建任务列表</span>
        <p>这里将显示所有新建的任务</p>
      </div>
    </template>
    
    <!-- 状态视图 - 处理中 -->
    <template v-else-if="currentViewType === 'status' && statusFilter === 'running'">
      <div class="view-header">
        <h2>处理中</h2>
        <p>正在处理的任务</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.refresh" :size="48" />
        <span>处理中任务列表</span>
        <p>这里将显示正在处理的任务</p>
      </div>
    </template>
    
    <!-- 状态视图 - 待审核 -->
    <template v-else-if="currentViewType === 'status' && statusFilter === 'review'">
      <div class="view-header">
        <h2>待审核</h2>
        <p>等待审核的任务</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.users" :size="48" />
        <span>待审核任务列表</span>
        <p>这里将显示等待审核的任务</p>
      </div>
    </template>
    
    <!-- 历史视图 - 最近编辑 -->
    <template v-else-if="currentViewType === 'history' && historyType === 'recent'">
      <div class="view-header">
        <h2>最近编辑</h2>
        <p>您最近编辑的文件</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.clock" :size="48" />
        <span>最近编辑列表</span>
        <p>这里将显示您最近编辑的文件</p>
      </div>
    </template>
    
    <!-- 历史视图 - 归档 -->
    <template v-else-if="currentViewType === 'history' && historyType === 'archive'">
      <div class="view-header">
        <h2>归档</h2>
        <p>已归档的项目和文件</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.archive" :size="48" />
        <span>归档列表</span>
        <p>这里将显示已归档的项目和文件</p>
      </div>
    </template>
    
    <!-- 我的项目视图 -->
    <template v-else-if="currentViewType === 'project' && selectedProject === 'library'">
      <div class="view-header">
        <h2>我的项目</h2>
        <p>管理您创建的所有项目</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.book" :size="48" />
        <span>我的项目列表</span>
        <p>这里将显示您创建的所有项目</p>
      </div>
    </template>
    
    <!-- 共享项目视图 -->
    <template v-else-if="currentViewType === 'project' && selectedProject === 'shared'">
      <div class="view-header">
        <h2>共享项目</h2>
        <p>与您共享的项目</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.share" :size="48" />
        <span>共享项目列表</span>
        <p>这里将显示与您共享的项目</p>
      </div>
    </template>
    
    <!-- 默认仪表盘视图 (包括 project-dashboard、无状态、或任何其他情况) -->
    <template v-else>
      <div class="dashboard-header">
        <h1>小说动漫生成器</h1>
        <p>欢迎使用小说动漫生成器！</p>
      </div>
      
      <!-- 快速操作区域 -->
      <div class="quick-actions-section">
        <h3 class="section-title">快速操作</h3>
        <div class="quick-actions">
          <button class="quick-action-btn" @click="handleTestPage">
            <span>🧪</span>
            <span>组件测试</span>
          </button>
          <button class="quick-action-btn" @click="handleOpenWorkflow">
            <span>⚡</span>
            <span>工作流编辑</span>
          </button>
          <button class="quick-action-btn" @click="handleOpenSettings">
            <span>⚙️</span>
            <span>系统设置</span>
          </button>
        </div>
      </div>
      
      <!-- 最近活动区域 -->
      <div class="recent-activity-section">
        <div class="section-header">
          <h3 class="section-title">最近活动</h3>
        </div>
        
        <div class="activity-list">
          <div 
            v-for="activity in recentActivities" 
            :key="activity.id"
            class="activity-item"
          >
            <div :class="`activity-icon activity-icon--${activity.type}`">
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
      
      <!-- 状态信息 -->
      <div class="status-section">
        <h3 class="section-title">系统状态</h3>
        <div class="status-info">
          <p>✅ 前端应用运行正常</p>
          <p>✅ 组件库已加载</p>
          <p>✅ API服务已配置</p>
          <p>🔧 开发模式已启用</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNavigationStore } from '../stores/navigation.js';
import { icons } from '../utils/icons.js';

const router = useRouter();
const navigationStore = useNavigationStore();

// 从 panelContext 获取当前视图状态
const dashboardContext = computed(() => navigationStore.panelContext.dashboard);

const currentViewType = computed(() => dashboardContext.value?.viewType);
const selectedProject = computed(() => dashboardContext.value?.selectedProject);
const statusFilter = computed(() => dashboardContext.value?.statusFilter);
const historyType = computed(() => dashboardContext.value?.historyType);

// 监听 panelContext 变化
watch(
  dashboardContext,
  (newVal, oldVal) => {
    console.log('👀 Dashboard panelContext changed:', JSON.stringify(newVal));
    console.log('  viewType:', newVal?.viewType);
    console.log('  selectedProject:', newVal?.selectedProject);
    console.log('  statusFilter:', newVal?.statusFilter);
    console.log('  historyType:', newVal?.historyType);
  },
  { deep: true, immediate: true }
);

// 最近活动
const recentActivities = ref([]);

onMounted(() => {
  console.log('📊 DashboardView onMounted started')
  try {
    loadRecentActivities();
    console.log('✅ DashboardView mounted successfully')
  } catch (error) {
    console.error('💥 Error in DashboardView onMounted:', error)
  }
});

function loadRecentActivities() {
  // 模拟活动数据
  const activities = [
    {
      id: '1',
      type: 'parse',
      title: '小说解析完成',
      description: '《测试小说》已成功解析为章节',
      time: new Date(Date.now() - 1000 * 60 * 30) // 30分钟前
    },
    {
      id: '2', 
      type: 'analyze',
      title: '角色分析完成',
      description: '提取到5个主要角色',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2小时前
    }
  ];
  
  recentActivities.value = activities;
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
function handleTestPage() {
  router.push('/test');
}

function handleOpenWorkflow() {
  router.push('/workflow');
}

function handleOpenSettings() {
  router.push('/settings');
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

/* 视图头部 */
.view-header {
  margin-bottom: 24px;
}

.view-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.view-header p {
  font-size: 13px;
  color: #6c6c6e;
  margin: 0;
}

/* 内容占位符 */
.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #8a8a8c;
  gap: 12px;
  text-align: center;
}

.content-placeholder span {
  font-size: 16px;
  font-weight: 500;
  color: #5a5a5c;
}

.content-placeholder p {
  font-size: 13px;
  color: #8a8a8c;
  margin: 0;
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
