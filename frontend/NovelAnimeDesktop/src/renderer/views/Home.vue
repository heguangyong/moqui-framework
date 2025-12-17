<template>
  <div class="home-view">
    <div class="welcome-section">
      <div class="welcome-header">
        <h1>🎬 欢迎使用小说动漫生成器</h1>
        <p>使用AI技术将您的小说转换为精美的动画视频</p>
      </div>
      
      <div class="quick-actions">
        <div class="action-card" @click="createNewProject">
          <div class="action-icon">📝</div>
          <h3>新建项目</h3>
          <p>创建一个新的小说动漫项目</p>
        </div>
        
        <div class="action-card" @click="openExistingProject">
          <div class="action-icon">📂</div>
          <h3>打开项目</h3>
          <p>打开现有的项目文件</p>
        </div>
        
        <div class="action-card" @click="openWorkflowEditor">
          <div class="action-icon">⚙️</div>
          <h3>工作流编辑器</h3>
          <p>创建和编辑处理工作流</p>
        </div>
      </div>
    </div>
    
    <div class="recent-projects" v-if="recentProjects.length > 0">
      <h2>最近的项目</h2>
      <div class="project-list">
        <div 
          v-for="project in recentProjects" 
          :key="project.id"
          class="project-item"
          @click="openProject(project.id)"
        >
          <div class="project-info">
            <h4>{{ project.name }}</h4>
            <p>{{ formatDate(project.lastModified) }}</p>
          </div>
          <div class="project-type">{{ project.type }}</div>
        </div>
      </div>
    </div>
    
    <div class="features-section">
      <h2>主要功能</h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">📖</div>
          <h4>智能小说解析</h4>
          <p>自动分析小说结构、角色和情节</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">👥</div>
          <h4>角色管理</h4>
          <p>创建和管理小说中的角色信息</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🎬</div>
          <h4>场景生成</h4>
          <p>将文字描述转换为视觉场景</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🎥</div>
          <h4>视频生成</h4>
          <p>使用AI技术生成动画视频</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project.js';

const router = useRouter();
const projectStore = useProjectStore();

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
      alert('创建项目失败: ' + error.message);
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
      alert('打开项目失败: ' + error.message);
    }
  }
}

function openWorkflowEditor() {
  router.push('/workflow');
}

function openProject(projectId) {
  router.push(`/project/${projectId}`);
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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-header p {
  font-size: 1.2rem;
  opacity: 0.8;
  margin-bottom: 2rem;
}

.quick-actions {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  width: 250px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.action-card p {
  opacity: 0.8;
  font-size: 0.9rem;
}

.recent-projects {
  margin-bottom: 3rem;
}

.recent-projects h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.project-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(5px);
}

.project-info h4 {
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.project-info p {
  opacity: 0.7;
  font-size: 0.85rem;
}

.project-type {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.features-section {
  margin-top: 3rem;
}

.features-section h2 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.8rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-item h4 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.feature-item p {
  opacity: 0.8;
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>