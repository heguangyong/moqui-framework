<template>
  <div class="home-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="欢迎使用小说动漫生成器" 
      subtitle="使用AI技术将您的小说转换为精美的动画视频"
    />
    
    <!-- 快速操作区域 -->
    <div class="quick-actions-section">
      <h3 class="section-title">快速开始</h3>
      <div class="quick-actions">
        <div class="action-card" @click="createNewProject">
          <div class="action-card__icon">📝</div>
          <h4 class="action-card__title">新建项目</h4>
          <p class="action-card__description">创建一个新的小说动漫项目</p>
        </div>
        
        <div class="action-card" @click="openExistingProject">
          <div class="action-card__icon">📂</div>
          <h4 class="action-card__title">打开项目</h4>
          <p class="action-card__description">打开现有的项目文件</p>
        </div>
        
        <div class="action-card" @click="openWorkflowEditor">
          <div class="action-card__icon">⚙️</div>
          <h4 class="action-card__title">工作流编辑器</h4>
          <p class="action-card__description">创建和编辑处理工作流</p>
        </div>
      </div>
    </div>
    
    <!-- 最近项目 -->
    <div class="recent-projects-section" v-if="recentProjects.length > 0">
      <div class="section-header">
        <h3 class="section-title">最近的项目</h3>
        <button class="btn btn--secondary" @click="viewAllProjects">
          查看全部
          <component :is="icons.arrowRight" :size="14" />
        </button>
      </div>
      <div class="project-list">
        <div 
          v-for="project in recentProjects" 
          :key="project.id"
          class="project-card"
          @click="openProject(project.id)"
        >
          <div class="project-card__info">
            <h4 class="project-card__name">{{ project.name }}</h4>
            <p class="project-card__date">{{ formatDate(project.lastModified) }}</p>
          </div>
          <span class="project-card__badge">{{ project.type }}</span>
        </div>
      </div>
    </div>
    
    <!-- 功能介绍 -->
    <div class="features-section">
      <h3 class="section-title">主要功能</h3>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-card__icon">📖</div>
          <h4 class="feature-card__title">智能小说解析</h4>
          <p class="feature-card__description">自动分析小说结构、角色和情节</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-card__icon">👥</div>
          <h4 class="feature-card__title">角色管理</h4>
          <p class="feature-card__description">创建和管理小说中的角色信息</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-card__icon">🎬</div>
          <h4 class="feature-card__title">场景生成</h4>
          <p class="feature-card__description">将文字描述转换为视觉场景</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-card__icon">🎥</div>
          <h4 class="feature-card__title">视频生成</h4>
          <p class="feature-card__description">使用AI技术生成动画视频</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project.js';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';

const router = useRouter();
const projectStore = useProjectStore();
const uiStore = useUIStore();

const recentProjects = ref([]);

onMounted(() => {
  loadRecentProjects();
});

function loadRecentProjects() {
  projectStore.loadAllProjects();
  recentProjects.value = projectStore.recentProjects;
}

async function createNewProject() {
  const name = prompt('请输入项目名称:');
  if (name) {
    try {
      const project = await projectStore.createProject({
        name,
        description: '新建的小说动漫项目',
        type: 'novel-to-anime'
      });
      
      if (project) {
        router.push(`/project/${project.id}`);
      }
    } catch (error) {
      uiStore.addNotification({
        type: 'error',
        title: '创建失败',
        message: error.message,
        timeout: 3000
      });
    }
  }
}

async function openExistingProject() {
  if (window.electronAPI) {
    try {
      const projectPath = await window.electronAPI.openProject();
      if (projectPath) {
        const project = await projectStore.loadProject(projectPath);
        if (project) {
          router.push(`/project/${project.id}`);
        }
      }
    } catch (error) {
      uiStore.addNotification({
        type: 'error',
        title: '打开失败',
        message: error.message,
        timeout: 3000
      });
    }
  }
}

function openWorkflowEditor() {
  router.push('/workflow');
}

function openProject(projectId) {
  router.push(`/project/${projectId}`);
}

function viewAllProjects() {
  router.push('/projects/my');
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
</script>

<style scoped>
.home-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

/* 快速操作区域 */
.quick-actions-section {
  padding: 0 24px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #9a9a9a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.action-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
  width: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  text-align: center;
}

.action-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.action-card__icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.action-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 6px 0;
}

.action-card__description {
  font-size: 12px;
  color: #6c6c6e;
  margin: 0;
  line-height: 1.4;
}

/* 最近项目区域 */
.recent-projects-section {
  padding: 0 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header .section-title {
  margin: 0;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.project-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(5px);
}

.project-card__info {
  flex: 1;
}

.project-card__name {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.project-card__date {
  font-size: 12px;
  color: #8a8a8c;
  margin: 0;
}

.project-card__badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  color: #5a5a5c;
}

/* 功能介绍区域 */
.features-section {
  padding: 0 24px 24px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.feature-card__icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.feature-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 6px 0;
}

.feature-card__description {
  font-size: 11px;
  color: #6c6c6e;
  margin: 0;
  line-height: 1.5;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .quick-actions {
    flex-direction: column;
  }
  
  .action-card {
    width: 100%;
  }
}
</style>
