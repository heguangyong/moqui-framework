<template>
  <div class="my-projects-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="我的项目" 
      subtitle="管理您的所有项目"
      :showNewButton="true"
      newButtonText="新建项目"
      :showRefreshButton="true"
      @new="handleNewProject"
      @refresh="handleRefresh"
    />
    
    <!-- 项目列表 -->
    <div class="projects-content">
      <!-- 有项目时显示列表 -->
      <div v-if="projects.length > 0" class="projects-grid">
        <div 
          v-for="project in projects" 
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
      </div>
      
      <!-- 无项目时显示空状态 -->
      <EmptyState 
        v-else
        icon="folder"
        title="暂无项目"
        description="点击上方「新建项目」按钮创建您的第一个项目"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project.js';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const router = useRouter();
const projectStore = useProjectStore();
const uiStore = useUIStore();

// 所有项目
const projects = computed(() => projectStore.projects);

function getStatusLabel(status) {
  const labels = {
    draft: '草稿',
    processing: '处理中',
    completed: '已完成'
  };
  return labels[status] || status;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}

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

function handleOpenProject(project) {
  router.push(`/project/${project.id}`);
}

function handleRefresh() {
  projectStore.loadAllProjects();
}
</script>

<style scoped>
.my-projects-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.projects-content {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

/* 项目网格 */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

/* 项目卡片 - 统一简洁风格 */
.project-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.project-card:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(120, 140, 130, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a5a52;
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
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-description {
  font-size: 12px;
  color: #6c6c6e;
  margin-bottom: 12px;
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
  color: #6a6a6a;
}


</style>
