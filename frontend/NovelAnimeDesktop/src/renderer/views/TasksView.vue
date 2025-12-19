<template>
  <div class="tasks-view">
    <!-- 视图头部 -->
    <ViewHeader 
      :title="viewTitle" 
      :subtitle="viewSubtitle"
      :showRefreshButton="true"
      @refresh="handleRefresh"
    />
    
    <!-- 任务列表 -->
    <div class="tasks-content">
      <!-- 有任务时显示列表 -->
      <div v-if="filteredTasks.length > 0" class="tasks-list">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="task-card"
          @click="handleOpenTask(task)"
        >
          <div class="task-header">
            <div class="task-icon" :class="`task-icon--${task.type}`">
              <component :is="getTaskIcon(task.type)" :size="18" />
            </div>
            <div class="task-status" :class="`task-status--${task.status}`">
              {{ getStatusLabel(task.status) }}
            </div>
          </div>
          <div class="task-name">{{ task.name }}</div>
          <div class="task-description">{{ task.description || getTaskTypeLabel(task.type) }}</div>
          <div class="task-meta">
            <span class="task-project" v-if="task.projectName">
              <component :is="icons.folder" :size="12" />
              {{ task.projectName }}
            </span>
            <span class="task-date">
              <component :is="icons.clock" :size="12" />
              {{ formatDate(task.createdAt) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 无任务时显示空状态 -->
      <EmptyState 
        v-else
        :icon="emptyIconName"
        :title="emptyTitle"
        :description="emptyDescription"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '../stores/task.js';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const uiStore = useUIStore();

// 当前状态类型
const statusType = computed(() => route.params.status || 'new');

// 视图标题配置
const viewConfig = computed(() => {
  const configs = {
    new: {
      title: '新建任务',
      subtitle: '等待处理的任务',
      emptyTitle: '暂无新建任务',
      emptyDescription: '当有新任务创建时，它们将显示在这里',
      emptyIconName: 'circle'
    },
    running: {
      title: '处理中',
      subtitle: '正在执行的任务',
      emptyTitle: '暂无处理中的任务',
      emptyDescription: '当有任务开始执行时，它们将显示在这里',
      emptyIconName: 'refresh'
    },
    review: {
      title: '待审核',
      subtitle: '需要审核确认的任务',
      emptyTitle: '暂无待审核任务',
      emptyDescription: '当有任务完成需要审核时，它们将显示在这里',
      emptyIconName: 'users'
    }
  };
  return configs[statusType.value] || configs.new;
});

const viewTitle = computed(() => viewConfig.value.title);
const viewSubtitle = computed(() => viewConfig.value.subtitle);
const emptyIconName = computed(() => viewConfig.value.emptyIconName);
const emptyTitle = computed(() => viewConfig.value.emptyTitle);
const emptyDescription = computed(() => viewConfig.value.emptyDescription);

// 状态映射
const statusMapping = {
  new: 'pending',
  running: 'running',
  review: 'review'
};

// 过滤后的任务
const filteredTasks = computed(() => {
  const targetStatus = statusMapping[statusType.value] || 'pending';
  return taskStore.tasks.filter(task => task.status === targetStatus);
});

function getTaskIcon(type) {
  const iconMap = {
    parse: icons.fileText,
    analyze: icons.users,
    script: icons.file,
    storyboard: icons.image,
    video: icons.video
  };
  return iconMap[type] || icons.zap;
}

function getStatusLabel(status) {
  const labels = {
    pending: '等待中',
    running: '处理中',
    review: '待审核',
    completed: '已完成',
    failed: '失败'
  };
  return labels[status] || status;
}

function getTaskTypeLabel(type) {
  const labels = {
    parse: '小说解析任务',
    analyze: '角色分析任务',
    script: '剧本生成任务',
    storyboard: '分镜生成任务',
    video: '视频合成任务'
  };
  return labels[type] || '处理任务';
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}

function handleOpenTask(task) {
  // 根据任务类型跳转到对应页面
  if (task.projectId) {
    router.push(`/project/${task.projectId}`);
  }
}

function handleRefresh() {
  taskStore.loadTasks();
}
</script>

<style scoped>
.tasks-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tasks-content {
  flex: 1;
  padding: 0 24px 24px;
  overflow-y: auto;
}

/* 任务列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.task-icon--parse { background: #7a7a7a; }
.task-icon--analyze { background: #9b59b6; }
.task-icon--script { background: #27ae60; }
.task-icon--storyboard { background: #e67e22; }
.task-icon--video { background: #e74c3c; }

.task-status {
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 10px;
}

.task-status--pending { background: #e2e8f0; color: #64748b; }
.task-status--running { background: #fef3c7; color: #d97706; }
.task-status--review { background: #dbeafe; color: #2563eb; }
.task-status--completed { background: #d1fae5; color: #059669; }
.task-status--failed { background: #fee2e2; color: #dc2626; }

.task-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 4px;
}

.task-description {
  font-size: 12px;
  color: #6c6c6e;
  margin-bottom: 10px;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #8a8a8c;
}

.task-project,
.task-date {
  display: flex;
  align-items: center;
  gap: 4px;
}


</style>
