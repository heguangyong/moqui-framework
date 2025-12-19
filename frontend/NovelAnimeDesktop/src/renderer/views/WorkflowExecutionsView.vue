<template>
  <div class="workflow-executions-view">
    <!-- 单个执行记录详情视图 -->
    <template v-if="executionId && currentExecution">
      <ViewHeader 
        :title="currentExecution.name" 
        :subtitle="`工作流: ${currentExecution.workflowName}`"
      >
        <template #actions>
          <button class="btn btn-secondary" @click="rerunExecution">
            重新执行
          </button>
          <button class="btn btn-primary" @click="viewWorkflow">
            查看工作流
          </button>
        </template>
      </ViewHeader>
      
      <div class="view-content">
        <div class="execution-detail">
          <!-- 执行信息卡片 -->
          <div class="info-card">
            <div class="card-header">
              <component :is="getStatusIcon(currentExecution.status)" :size="24" />
              <h3>{{ currentExecution.name }}</h3>
              <span class="status-badge" :class="currentExecution.status">
                {{ getStatusLabel(currentExecution.status) }}
              </span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">工作流</span>
                <span class="value">{{ currentExecution.workflowName }}</span>
              </div>
              <div class="info-row">
                <span class="label">执行时间</span>
                <span class="value">{{ currentExecution.time }}</span>
              </div>
              <div class="info-row">
                <span class="label">耗时</span>
                <span class="value">{{ currentExecution.duration || '未知' }}</span>
              </div>
              <div class="info-row">
                <span class="label">处理节点</span>
                <span class="value">{{ currentExecution.nodeCount || 5 }} 个</span>
              </div>
            </div>
          </div>
          
          <!-- 执行日志 -->
          <div class="section">
            <h4>执行日志</h4>
            <div class="log-list">
              <div v-for="log in currentExecution.logs" :key="log.id" class="log-item" :class="log.type">
                <span class="log-time">{{ log.time }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- 执行记录列表视图 -->
    <template v-else>
      <ViewHeader 
        title="执行记录" 
        subtitle="查看工作流执行历史"
      />
      
      <div class="view-content">
        <EmptyState 
          v-if="executions.length === 0"
          icon="clock"
          title="暂无执行记录"
          description="还没有执行过任何工作流"
        />
        
        <div v-else class="executions-list">
          <div 
            v-for="execution in executions" 
            :key="execution.id"
            class="execution-card"
            :class="{ 'execution-card--active': isFirstExecution(execution.id) }"
            @click="viewExecution(execution)"
          >
            <div class="execution-icon">
              <component :is="getStatusIcon(execution.status)" :size="20" />
            </div>
            <div class="execution-info">
              <h4>{{ execution.name }}</h4>
              <p>{{ execution.workflowName }}</p>
            </div>
            <div class="execution-meta">
              <span class="execution-time">{{ execution.time }}</span>
              <span class="execution-duration" v-if="execution.duration">
                耗时: {{ execution.duration }}
              </span>
            </div>
            <div class="execution-status">
              <span class="status-badge" :class="execution.status">
                {{ getStatusLabel(execution.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();

const executionId = computed(() => route.params.id);

// 模拟数据
const executions = ref([
  { 
    id: 'e1', 
    name: '第一章转换', 
    workflowName: '小说转视频', 
    status: 'success', 
    time: '2分钟前', 
    duration: '45秒',
    nodeCount: 5,
    logs: [
      { id: 'l1', time: '10:30:00', type: 'info', message: '开始执行工作流' },
      { id: 'l2', time: '10:30:05', type: 'info', message: '小说解析器: 开始解析' },
      { id: 'l3', time: '10:30:15', type: 'success', message: '小说解析器: 解析完成' },
      { id: 'l4', time: '10:30:20', type: 'info', message: '角色分析器: 开始分析' },
      { id: 'l5', time: '10:30:35', type: 'success', message: '角色分析器: 分析完成' },
      { id: 'l6', time: '10:30:45', type: 'success', message: '工作流执行完成' }
    ]
  },
  { 
    id: 'e2', 
    name: '角色提取', 
    workflowName: '角色分析流程', 
    status: 'success', 
    time: '10分钟前', 
    duration: '1分30秒',
    nodeCount: 3,
    logs: [
      { id: 'l1', time: '10:20:00', type: 'info', message: '开始执行工作流' },
      { id: 'l2', time: '10:21:30', type: 'success', message: '工作流执行完成' }
    ]
  },
  { 
    id: 'e3', 
    name: '场景生成', 
    workflowName: '分镜生成', 
    status: 'success', 
    time: '1小时前', 
    duration: '3分钟',
    nodeCount: 4,
    logs: [
      { id: 'l1', time: '09:30:00', type: 'info', message: '开始执行工作流' },
      { id: 'l2', time: '09:33:00', type: 'success', message: '工作流执行完成' }
    ]
  }
]);

const currentExecution = computed(() => {
  if (!executionId.value) return null;
  return executions.value.find(e => e.id === executionId.value) || null;
});

function isFirstExecution(id) {
  return executions.value.length > 0 && executions.value[0].id === id;
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

function getStatusLabel(status) {
  const labels = {
    success: '成功',
    error: '失败',
    running: '运行中',
    pending: '等待中'
  };
  return labels[status] || status;
}

function viewExecution(execution) {
  router.push(`/workflow/executions/${execution.id}`);
}

function rerunExecution() {
  // TODO: 实现重新执行逻辑
  if (currentExecution.value) {
    console.log('Rerunning execution:', currentExecution.value.name);
  }
}

function viewWorkflow() {
  router.push('/workflow');
}
</script>

<style scoped>
.workflow-executions-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}



.executions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.execution-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.3), rgba(200, 218, 212, 0.25));
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.execution-card:hover {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.4), rgba(200, 218, 212, 0.35));
}

.execution-icon {
  color: #6a6a6a;
}

.execution-info {
  flex: 1;
}

.execution-info h4 {
  margin: 0 0 0.2rem 0;
  font-size: 0.9rem;
  color: #2c2c2e;
}

.execution-info p {
  margin: 0;
  font-size: 0.75rem;
  color: #7a7a7a;
}

.execution-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.execution-time {
  font-size: 0.75rem;
  color: #7a7a7a;
}

.execution-duration {
  font-size: 0.7rem;
  color: #9a9a9a;
}

.status-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.status-badge.success {
  background: rgba(100, 180, 140, 0.2);
  color: #4a8060;
}

.status-badge.error {
  background: rgba(200, 100, 100, 0.2);
  color: #905050;
}

.status-badge.running {
  background: rgba(100, 150, 200, 0.2);
  color: #4a7090;
}

.status-badge.pending {
  background: rgba(180, 180, 100, 0.2);
  color: #808050;
}

/* 执行详情样式 */
.execution-detail {
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
  color: #6a6a6a;
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

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 0.85rem;
}

.log-item.info {
  border-left: 3px solid #7a9a9a;
}

.log-item.success {
  border-left: 3px solid #6a9a7a;
}

.log-item.error {
  border-left: 3px solid #9a6a6a;
}

.log-time {
  color: #9a9a9a;
  font-family: monospace;
  font-size: 0.8rem;
}

.log-message {
  color: #2c2c2e;
  flex: 1;
}

/* 第一个执行记录高亮 */
.execution-card--active {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.5);
  color: #5a5a5c;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: #2c2c2e;
  border-color: rgba(0, 0, 0, 0.18);
}

.btn-secondary {
  background: rgba(160, 160, 160, 0.15);
  color: #6a6a6a;
  border-color: rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: rgba(160, 160, 160, 0.25);
  color: #5a5a5a;
}

.btn-primary {
  background: rgba(120, 140, 130, 0.25);
  color: #4a5a52;
  border-color: rgba(100, 120, 110, 0.3);
}

.btn-primary:hover {
  background: rgba(120, 140, 130, 0.35);
  color: #3a4a42;
}
</style>
