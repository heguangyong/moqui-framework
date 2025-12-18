<template>
  <div class="workflow-status-view">
    <ViewHeader 
      :title="statusTitle" 
      :subtitle="statusSubtitle"
    />
    
    <div class="view-content">
      <div v-if="filteredWorkflows.length === 0" class="empty-state">
        <component :is="statusIcon" :size="48" class="empty-icon" />
        <h3>{{ emptyTitle }}</h3>
        <p>{{ emptyMessage }}</p>
      </div>
      
      <div v-else class="workflow-list">
        <div 
          v-for="workflow in filteredWorkflows" 
          :key="workflow.id"
          class="workflow-card"
          @click="openWorkflow(workflow)"
        >
          <div class="workflow-icon">
            <component :is="icons.gitBranch" :size="24" />
          </div>
          <div class="workflow-info">
            <h4>{{ workflow.name }}</h4>
            <p>{{ workflow.description || '暂无描述' }}</p>
          </div>
          <div class="workflow-status">
            <span class="status-badge" :class="workflow.status">
              {{ getStatusLabel(workflow.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';

const route = useRoute();
const router = useRouter();

const status = computed(() => route.params.status || 'running');

const statusConfig = {
  running: {
    title: '运行中的工作流',
    subtitle: '当前正在执行的工作流',
    icon: icons.refresh,
    emptyTitle: '没有运行中的工作流',
    emptyMessage: '当前没有正在执行的工作流'
  },
  completed: {
    title: '已完成的工作流',
    subtitle: '执行成功的工作流',
    icon: icons.check,
    emptyTitle: '没有已完成的工作流',
    emptyMessage: '还没有工作流执行完成'
  },
  failed: {
    title: '失败的工作流',
    subtitle: '执行失败的工作流',
    icon: icons.xCircle,
    emptyTitle: '没有失败的工作流',
    emptyMessage: '太棒了！没有失败的工作流'
  }
};

const statusTitle = computed(() => statusConfig[status.value]?.title || '工作流');
const statusSubtitle = computed(() => statusConfig[status.value]?.subtitle || '');
const statusIcon = computed(() => statusConfig[status.value]?.icon || icons.gitBranch);
const emptyTitle = computed(() => statusConfig[status.value]?.emptyTitle || '暂无数据');
const emptyMessage = computed(() => statusConfig[status.value]?.emptyMessage || '');

// 模拟数据 - 实际应从 store 获取
const filteredWorkflows = computed(() => []);

function getStatusLabel(workflowStatus) {
  const labels = {
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    idle: '空闲'
  };
  return labels[workflowStatus] || workflowStatus;
}

function openWorkflow(workflow) {
  router.push(`/workflow/${workflow.id}`);
}
</script>

<style scoped>
.workflow-status-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #6a6a6a;
}

.empty-icon {
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #5a5a5c;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.workflow-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.3), rgba(200, 218, 212, 0.25));
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.workflow-card:hover {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.4), rgba(200, 218, 212, 0.35));
  transform: translateY(-1px);
}

.workflow-icon {
  color: #6a6a6a;
}

.workflow-info {
  flex: 1;
}

.workflow-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #2c2c2e;
}

.workflow-info p {
  margin: 0;
  font-size: 0.8rem;
  color: #6a6a6a;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.running {
  background: rgba(100, 150, 200, 0.2);
  color: #4a7090;
}

.status-badge.completed {
  background: rgba(100, 180, 140, 0.2);
  color: #4a8060;
}

.status-badge.failed {
  background: rgba(200, 100, 100, 0.2);
  color: #905050;
}
</style>
