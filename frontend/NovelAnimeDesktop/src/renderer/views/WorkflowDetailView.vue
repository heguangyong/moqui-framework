<template>
  <div class="workflow-detail-view">
    <ViewHeader 
      :title="workflow?.name || '工作流详情'" 
      :subtitle="workflow?.description || '查看工作流信息'"
    >
      <template #actions>
        <button class="btn btn-primary" @click="editWorkflow">
          编辑工作流
        </button>
        <button class="btn btn-success" @click="runWorkflow">
          运行工作流
        </button>
      </template>
    </ViewHeader>
    
    <div class="view-content">
      <div v-if="!workflow" class="empty-state">
        <component :is="icons.gitBranch" :size="48" class="empty-icon" />
        <h3>工作流不存在</h3>
        <p>未找到指定的工作流</p>
      </div>
      
      <div v-else class="workflow-detail">
        <!-- 工作流信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <component :is="icons.gitBranch" :size="24" />
            <h3>{{ workflow.name }}</h3>
            <span class="status-badge" :class="workflow.status">
              {{ getStatusLabel(workflow.status) }}
            </span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">描述</span>
              <span class="value">{{ workflow.description || '暂无描述' }}</span>
            </div>
            <div class="info-row">
              <span class="label">创建时间</span>
              <span class="value">{{ workflow.createdAt || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="label">最后修改</span>
              <span class="value">{{ workflow.updatedAt || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="label">节点数量</span>
              <span class="value">{{ workflow.nodeCount || 0 }} 个</span>
            </div>
          </div>
        </div>
        
        <!-- 最近执行记录 -->
        <div class="section">
          <h4>最近执行记录</h4>
          <div v-if="recentExecutions.length === 0" class="empty-section">
            <p>暂无执行记录</p>
          </div>
          <div v-else class="execution-list">
            <div 
              v-for="execution in recentExecutions" 
              :key="execution.id"
              class="execution-item"
            >
              <component :is="getStatusIcon(execution.status)" :size="16" />
              <span class="execution-name">{{ execution.name }}</span>
              <span class="execution-time">{{ execution.time }}</span>
              <span class="status-badge small" :class="execution.status">
                {{ getExecutionStatusLabel(execution.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();

const workflowId = computed(() => route.params.id);

// 模拟数据 - 实际应从 store 获取
const workflowsData = {
  '1': { id: '1', name: '小说转视频', description: '将小说内容转换为视频的完整流程', status: 'idle', nodeCount: 5, createdAt: '2024-01-15', updatedAt: '2024-01-20' },
  '2': { id: '2', name: '角色分析流程', description: '分析小说中的角色信息', status: 'running', nodeCount: 3, createdAt: '2024-01-10', updatedAt: '2024-01-18' },
  '3': { id: '3', name: '分镜生成', description: '根据剧本生成分镜脚本', status: 'completed', nodeCount: 4, createdAt: '2024-01-05', updatedAt: '2024-01-16' }
};

const workflow = computed(() => workflowsData[workflowId.value] || null);

// 模拟执行记录
const recentExecutions = ref([
  { id: 'e1', name: '执行 #1', status: 'success', time: '2分钟前' },
  { id: 'e2', name: '执行 #2', status: 'success', time: '1小时前' }
]);

function getStatusLabel(status) {
  const labels = {
    idle: '空闲',
    running: '运行中',
    completed: '已完成',
    failed: '失败'
  };
  return labels[status] || status;
}

function getExecutionStatusLabel(status) {
  const labels = {
    success: '成功',
    error: '失败',
    running: '运行中',
    pending: '等待中'
  };
  return labels[status] || status;
}

function getStatusIcon(status) {
  const iconMap = {
    success: icons.check,
    error: icons.xCircle,
    running: icons.refresh,
    pending: icons.clock
  };
  return iconMap[status] || icons.circle;
}

function editWorkflow() {
  router.push(`/workflow?id=${workflowId.value}`);
}

function runWorkflow() {
  uiStore.addNotification({
    type: 'info',
    title: '开始执行',
    message: `正在执行工作流: ${workflow.value?.name}`,
    timeout: 2000
  });
}
</script>

<style scoped>
.workflow-detail-view {
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

.workflow-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.3), rgba(200, 218, 212, 0.25));
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header h3 {
  flex: 1;
  margin: 0;
  font-size: 1.1rem;
  color: #2c2c2e;
}

.card-body {
  padding: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #7a7a7a;
  font-size: 0.9rem;
}

.info-row .value {
  color: #2c2c2e;
  font-size: 0.9rem;
}

.section {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.2), rgba(200, 218, 212, 0.15));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 1rem;
}

.section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: #5a5a5c;
}

.empty-section {
  text-align: center;
  padding: 1rem;
  color: #9a9a9a;
}

.empty-section p {
  margin: 0;
  font-size: 0.85rem;
}

.execution-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.execution-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

.execution-name {
  flex: 1;
  font-size: 0.9rem;
  color: #2c2c2e;
}

.execution-time {
  font-size: 0.8rem;
  color: #9a9a9a;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.small {
  padding: 0.15rem 0.4rem;
  font-size: 0.7rem;
}

.status-badge.idle {
  background: rgba(150, 150, 150, 0.2);
  color: #6a6a6a;
}

.status-badge.running {
  background: rgba(100, 150, 200, 0.2);
  color: #4a7090;
}

.status-badge.completed,
.status-badge.success {
  background: rgba(100, 180, 140, 0.2);
  color: #4a8060;
}

.status-badge.failed,
.status-badge.error {
  background: rgba(200, 100, 100, 0.2);
  color: #905050;
}

.btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.5), rgba(200, 218, 212, 0.4));
  color: #2c2c2e;
}

.btn:hover {
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.6), rgba(200, 218, 212, 0.5));
}

.btn-primary {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.7), rgba(180, 198, 192, 0.6));
}

.btn-success {
  background: linear-gradient(90deg, rgba(140, 160, 150, 0.7), rgba(170, 198, 182, 0.6));
}
</style>
