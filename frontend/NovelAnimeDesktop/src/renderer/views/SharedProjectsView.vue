<template>
  <div class="shared-projects-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="共享项目" 
      subtitle="查看和管理共享的项目"
    />
    
    <!-- 项目列表 -->
    <div class="projects-content">
      <!-- 有项目时显示列表 -->
      <div v-if="sharedProjects.length > 0" class="projects-grid">
        <div 
          v-for="project in sharedProjects" 
          :key="project.id"
          class="project-card"
          @click="handleOpenProject(project)"
        >
          <div class="project-header">
            <div class="project-icon">
              <component :is="icons.users" :size="20" />
            </div>
            <div class="project-status" :class="`project-status--${project.status}`">
              {{ getStatusLabel(project.status) }}
            </div>
          </div>
          <div class="project-name">{{ project.name }}</div>
          <div class="project-description">{{ project.description || '暂无描述' }}</div>
          <div class="project-meta">
            <span class="project-owner">
              <component :is="icons.user" :size="12" />
              {{ project.owner || '未知' }}
            </span>
            <span class="project-date">
              {{ formatDate(project.updatedAt || project.createdAt) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 无项目时显示空状态 -->
      <EmptyState 
        v-else
        icon="users"
        title="暂无共享项目"
        description="当有人与您共享项目时，它们将显示在这里"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const router = useRouter();
const projectStore = useProjectStore();

// 共享项目
const sharedProjects = computed(() => {
  return projectStore.sharedProjects || [];
});

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

function handleOpenProject(project) {
  router.push(`/project/${project.id}`);
}
</script>

<style scoped>
.shared-projects-view {
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

.project-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 16px;
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
  margin-bottom: 12px;
}

.project-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
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

.project-owner {
  display: flex;
  align-items: center;
  gap: 4px;
}

.project-date {
  color: #a0a0a2;
}


</style>
