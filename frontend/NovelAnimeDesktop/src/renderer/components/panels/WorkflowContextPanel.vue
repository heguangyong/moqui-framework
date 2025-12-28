<template>
  <div class="workflow-context-panel">
    <!-- 工作流分组 -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">工作流</div>
        <span class="add-btn" @click="handleCreateWorkflow">+</span>
      </div>
      <div class="section-items">
        <div 
          v-for="workflow in workflows"
          :key="workflow.id"
          class="section-item"
          :class="{ 'section-item--active': activeView === `workflow-${workflow.id}` }"
          @click="handleWorkflowClick(workflow)"
        >
          <component :is="icons.gitBranch" :size="16" />
          <span>{{ workflow.name }}</span>
          <span class="item-badge">{{ workflow.count }}</span>
        </div>
      </div>
    </div>
    
    <!-- 状态分组 - 工作流统计 -->
    <div class="section">
      <div class="section-title">状态</div>
      <div class="section-items">
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-running' }"
          @click="handleStatusClick('running')"
        >
          <component :is="icons.refresh" :size="16" />
          <span>运行中</span>
          <span class="item-badge">{{ workflowCounts.running }}</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-completed' }"
          @click="handleStatusClick('completed')"
        >
          <component :is="icons.check" :size="16" />
          <span>已完成</span>
          <span class="item-badge">{{ workflowCounts.completed }}</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-failed' }"
          @click="handleStatusClick('failed')"
        >
          <component :is="icons.xCircle" :size="16" />
          <span>失败</span>
          <span class="item-badge">{{ workflowCounts.failed }}</span>
        </div>
      </div>
    </div>
    
    <!-- 模板分组 -->
    <div class="section">
      <div class="section-title">模板</div>
      <div class="section-items">
        <div 
          v-for="template in templates"
          :key="template.id"
          class="section-item"
          :class="{ 'section-item--active': activeView === `template-${template.id}` }"
          @click="handleTemplateClick(template)"
        >
          <component :is="icons.layers" :size="16" />
          <span>{{ template.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- 执行记录分组 -->
    <div class="section section--executions">
      <div class="section-title">执行记录</div>
      <div class="section-items">
        <div 
          v-for="execution in recentExecutions"
          :key="execution.id"
          class="section-item"
          :class="{ 'section-item--active': activeView === `execution-${execution.id}` }"
          @click="handleExecutionClick(execution)"
        >
          <component :is="getExecutionIcon(execution.status)" :size="16" />
          <span>{{ execution.name }}</span>
          <span class="execution-time">{{ execution.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUIStore } from '../../stores/ui.js';
import { useNavigationStore } from '../../stores/navigation.js';
import { useWorkflowStore } from '../../stores/workflow.js';
import { icons } from '../../utils/icons.js';

const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();
const workflowStore = useWorkflowStore();

// 确保在工作流页面
function ensureWorkflowPage() {
  if (route.path !== '/workflow') {
    router.push('/workflow');
  }
}

// 统一的激活状态 - 同一时间只有一个按钮被高亮
const activeView = ref('');

// 从 workflowStore 获取工作流数据
const workflows = computed(() => {
  const storeWorkflows = workflowStore.workflows;
  return storeWorkflows.map(w => ({
    ...w,
    count: w.nodes?.length || 0
  }));
});

// 工作流统计 - 默认为0
const workflowCounts = computed(() => {
  const counts = { running: 0, completed: 0, failed: 0 };
  workflows.value.forEach(w => {
    if (w.status === 'running') counts.running++;
    else if (w.status === 'completed') counts.completed++;
    else if (w.status === 'error' || w.status === 'failed') counts.failed++;
  });
  return counts;
});

// 初始化时加载工作流
onMounted(async () => {
  workflowStore.loadAllWorkflows();
  console.log('📋 WorkflowContextPanel mounted, workflows:', workflowStore.workflows);
});

// 工作流点击处理
function handleWorkflowClick(workflow) {
  console.log('🖱️ Workflow clicked:', workflow.id, workflow.name);
  activeView.value = `workflow-${workflow.id}`;
  ensureWorkflowPage();
  
  // 设置当前工作流
  const success = workflowStore.setCurrentWorkflow(workflow.id);
  console.log('📌 setCurrentWorkflow result:', success);
  
  // 更新 panelContext
  navigationStore.updatePanelContext('workflow', { 
    selectedWorkflow: workflow.id,
    viewType: 'workflow-detail',
    statusFilter: null,
    templateId: null,
    executionId: null
  });
}

const templates = ref([
  { id: 't1', name: '标准转换流程' },
  { id: 't2', name: '快速预览流程' },
  { id: 't3', name: '高质量输出' }
]);

const recentExecutions = ref([
  { id: 'e1', name: '第一章转换', status: 'success', time: '2分钟前' },
  { id: 'e2', name: '角色提取', status: 'success', time: '10分钟前' },
  { id: 'e3', name: '场景生成', status: 'success', time: '1小时前' }
]);

// 获取执行状态图标
function getExecutionIcon(status) {
  const iconMap = {
    success: icons.check,
    error: icons.xCircle,
    running: icons.refresh,
    pending: icons.clock
  };
  return iconMap[status] || icons.circle;
}

// 模板点击处理
function handleTemplateClick(template) {
  activeView.value = `template-${template.id}`;
  ensureWorkflowPage();
  navigationStore.updatePanelContext('workflow', { 
    templateId: template.id,
    viewType: 'template',
    selectedWorkflow: null,
    statusFilter: null,
    executionId: null
  });
}

// 执行记录点击处理
function handleExecutionClick(execution) {
  activeView.value = `execution-${execution.id}`;
  ensureWorkflowPage();
  navigationStore.updatePanelContext('workflow', { 
    executionId: execution.id,
    executionName: execution.name,
    executionStatus: execution.status,
    executionTime: execution.time,
    viewType: 'execution',
    selectedWorkflow: null,
    statusFilter: null,
    templateId: null
  });
}

// 创建工作流
function handleCreateWorkflow() {
  activeView.value = '';
  ensureWorkflowPage();
  navigationStore.updatePanelContext('workflow', { 
    viewType: 'new',
    selectedWorkflow: null,
    statusFilter: null,
    templateId: null,
    executionId: null
  });
}

// 状态点击处理
function handleStatusClick(statusType) {
  activeView.value = `status-${statusType}`;
  ensureWorkflowPage();
  navigationStore.updatePanelContext('workflow', { 
    statusFilter: statusType,
    viewType: 'status',
    selectedWorkflow: null,
    templateId: null,
    executionId: null
  });
}
</script>

<style scoped>
.workflow-context-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.section {
  padding: 10px 14px;
  position: relative;
}

.section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
}

.section:last-child::after {
  display: none;
}

.section--executions {
  flex: 1;
}

.section-title {
  font-size: 9px;
  font-weight: 700;
  color: #9a9a9a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.08),
    0 -1px 0 rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.add-btn {
  background: transparent;
  border: 1.5px dashed #8a8a8a;
  color: #2c2c2e;
  cursor: pointer;
  padding: 0;
  padding-bottom: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 700;
  line-height: 0;
}

.add-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: #6a6a6a;
}

.section-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 8px;
  font-size: 13px;
  color: #2c2c2e;
}

.section-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.section-item--active {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  backdrop-filter: blur(10px);
  color: #2c2c2e;
  position: relative;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* 右侧独立标注线 - 左深右浅渐变，立体凸起 */
.section-item--active::after {
  content: '';
  position: absolute;
  right: -14px;
  top: 3px;
  bottom: 3px;
  width: 5px;
  background: linear-gradient(90deg, #8a8a8a, #b8b8b8);
  border-radius: 3px;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.section-item span {
  flex: 1;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--idle {
  background-color: #9a9a9a;
}

.status-dot--running {
  background-color: #3b82f6;
  animation: pulse 1.5s infinite;
}

.status-dot--completed {
  background-color: #22c55e;
}

.status-dot--error {
  background-color: #ef4444;
}

.execution-time {
  font-size: 11px;
  color: #9a9a9a;
  flex-shrink: 0;
}

.item-badge {
  background-color: #b0b0b0;
  color: #5a5a5c;
  font-size: 10px;
  font-weight: 600;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
  min-height: 18px !important;
  max-width: 18px !important;
  max-height: 18px !important;
  border-radius: 50% !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  flex-shrink: 0;
  padding: 0 !important;
  line-height: 1;
}

.section-item--active .item-badge {
  background-color: #e8e8e8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
