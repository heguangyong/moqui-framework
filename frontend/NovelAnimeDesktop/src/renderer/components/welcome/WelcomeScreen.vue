<template>
  <div class="welcome-screen">
    <div class="welcome-container">
      <!-- Logo and Title -->
      <div class="welcome-header">
        <q-icon name="movie" size="80px" color="primary" />
        <h1 class="welcome-title">小说动漫生成器</h1>
        <p class="welcome-subtitle">使用AI技术将小说转换为精美的动画视频</p>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <q-card class="action-card" @click="createNewProject">
          <q-card-section class="text-center">
            <q-icon name="add_circle" size="48px" color="primary" />
            <div class="action-title">新建项目</div>
            <div class="action-description">创建一个新的小说转动漫项目</div>
          </q-card-section>
        </q-card>

        <q-card class="action-card" @click="openProject">
          <q-card-section class="text-center">
            <q-icon name="folder_open" size="48px" color="secondary" />
            <div class="action-title">打开项目</div>
            <div class="action-description">打开现有的项目文件</div>
          </q-card-section>
        </q-card>

        <q-card class="action-card" @click="importNovel">
          <q-card-section class="text-center">
            <q-icon name="upload_file" size="48px" color="accent" />
            <div class="action-title">导入小说</div>
            <div class="action-description">导入TXT格式的小说文件</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Recent Projects -->
      <div class="recent-section" v-if="recentProjects.length > 0">
        <h3>最近的项目</h3>
        <div class="recent-projects">
          <q-card
            v-for="project in recentProjects"
            :key="project.id"
            class="recent-project-card"
            @click="openRecentProject(project)"
          >
            <q-card-section>
              <div class="project-name">{{ project.name }}</div>
              <div class="project-path">{{ project.path }}</div>
              <div class="project-date">{{ formatDate(project.lastOpened) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Features Overview -->
      <div class="features-section">
        <h3>主要功能</h3>
        <div class="features-grid">
          <div class="feature-item">
            <q-icon name="auto_stories" size="32px" color="blue" />
            <div class="feature-title">智能解析</div>
            <div class="feature-description">自动识别章节结构和角色关系</div>
          </div>
          <div class="feature-item">
            <q-icon name="people" size="32px" color="green" />
            <div class="feature-title">角色管理</div>
            <div class="feature-description">AI驱动的角色分析和一致性保持</div>
          </div>
          <div class="feature-item">
            <q-icon name="movie_creation" size="32px" color="purple" />
            <div class="feature-title">分镜生成</div>
            <div class="feature-description">自动创建专业的分镜头脚本</div>
          </div>
          <div class="feature-item">
            <q-icon name="smart_toy" size="32px" color="orange" />
            <div class="feature-title">AI视频</div>
            <div class="feature-description">集成多种AI视频生成服务</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
}

const $q = useQuasar();

// State
const recentProjects = ref<RecentProject[]>([]);

// Methods
const createNewProject = () => {
  $q.dialog({
    title: '新建项目',
    message: '请输入项目名称:',
    prompt: {
      model: '',
      type: 'text',
      placeholder: '我的小说项目'
    },
    cancel: true,
    persistent: true
  }).onOk((projectName: string) => {
    if (projectName.trim()) {
      console.log('Creating new project:', projectName);
      // 实际项目创建逻辑
      $q.notify({
        type: 'positive',
        message: `项目 "${projectName}" 创建成功！`,
        position: 'top'
      });
    }
  });
};

const openProject = () => {
  // 模拟文件选择对话框
  $q.notify({
    type: 'info',
    message: '正在打开文件选择对话框...',
    position: 'top'
  });
  console.log('Opening project file dialog');
};

const importNovel = () => {
  // 模拟小说导入
  $q.notify({
    type: 'info',
    message: '正在打开小说文件选择对话框...',
    position: 'top'
  });
  console.log('Importing novel file');
};

const openRecentProject = (project: RecentProject) => {
  console.log('Opening recent project:', project.name);
  $q.notify({
    type: 'positive',
    message: `正在打开项目 "${project.name}"...`,
    position: 'top'
  });
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

const loadRecentProjects = () => {
  // 模拟加载最近项目
  recentProjects.value = [
    {
      id: '1',
      name: '三体动画项目',
      path: '/Users/demo/Projects/三体动画',
      lastOpened: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1天前
    },
    {
      id: '2',
      name: '流浪地球短片',
      path: '/Users/demo/Projects/流浪地球',
      lastOpened: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3天前
    }
  ];
};

// Lifecycle
onMounted(() => {
  loadRecentProjects();
});
</script>

<style scoped lang="scss">
.welcome-screen {
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(135deg, #8a8a8a 0%, #a0b0aa 100%);
  color: white;
}

.welcome-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.welcome-header {
  text-align: center;
  margin-bottom: 60px;
}

.welcome-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 20px 0 10px;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 60px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.15);
  }
}

.action-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 16px 0 8px;
  color: white;
}

.action-description {
  font-size: 0.9rem;
  opacity: 0.8;
  color: white;
}

.recent-section {
  margin-bottom: 60px;
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 24px;
    color: white;
  }
}

.recent-projects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.recent-project-card {
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
  }
}

.project-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.project-path {
  font-size: 0.85rem;
  opacity: 0.7;
  color: white;
  margin-bottom: 8px;
  word-break: break-all;
}

.project-date {
  font-size: 0.8rem;
  opacity: 0.6;
  color: white;
}

.features-section {
  h3 {
    font-size: 1.5rem;
    margin-bottom: 24px;
    text-align: center;
    color: white;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.feature-item {
  text-align: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
  }
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 16px 0 8px;
  color: white;
}

.feature-description {
  font-size: 0.9rem;
  opacity: 0.8;
  color: white;
  line-height: 1.4;
}

// 响应式设计
@media (max-width: 768px) {
  .welcome-container {
    padding: 20px 16px;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>