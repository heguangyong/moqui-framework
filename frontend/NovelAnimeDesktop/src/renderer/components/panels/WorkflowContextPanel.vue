<template>
  <div class="workflow-context-panel">
    <!-- 工作流分组 -->
    <div class="section section--workflows">
      <div class="section-header">
        <div class="section-title">工作流</div>
        <span class="add-btn" @click="handleCreateWorkflow">+</span>
      </div>
      <div class="section-items section-items--scrollable">
        <div 
          v-for="workflow in displayedWorkflows"
          :key="workflow.id"
          class="section-item"
          :class="{ 'section-item--active': activeView === `workflow-${workflow.id}` }"
          @click="handleWorkflowClick(workflow)"
          :title="workflow.name"
        >
          <component :is="icons.gitBranch" :size="16" />
          <span class="workflow-name">{{ truncateName(workflow.name) }}</span>
          <span class="item-badge">{{ workflow.count }}</span>
        </div>
        <!-- 显示更多按钮 -->
        <div 
          v-if="workflows.length > maxDisplayCount && !showAllWorkflows"
          class="show-more-btn"
          @click="showAllWorkflows = true"
        >
          显示更多 ({{ workflows.length - maxDisplayCount }})
        </div>
        <div 
          v-if="showAllWorkflows && workflows.length > maxDisplayCount"
          class="show-more-btn"
          @click="showAllWorkflows = false"
        >
          收起
        </div>
      </div>
    </div>
    
    <!-- 执行状态分组 -->
    <div class="section">
      <div class="section-title">执行状态</div>
      <div class="section-items">
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-running' }"
          @click="handleStatusClick('running')"
        >
          <component :is="icons.refresh" :size="16" />
          <span>运行中</span>
          <span v-if="workflowCounts.running > 0" class="item-badge item-badge--highlight">{{ workflowCounts.running }}</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-completed' }"
          @click="handleStatusClick('completed')"
        >
          <component :is="icons.check" :size="16" />
          <span>已完成</span>
          <span v-if="workflowCounts.completed > 0" class="item-badge">{{ workflowCounts.completed }}</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-failed' }"
          @click="handleStatusClick('failed')"
        >
          <component :is="icons.xCircle" :size="16" />
          <span>失败</span>
          <span v-if="workflowCounts.failed > 0" class="item-badge">{{ workflowCounts.failed }}</span>
        </div>
      </div>
    </div>
    
    <!-- 模板分组 -->
    <div class="section">
      <div class="section-title">快速开始</div>
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
        <template v-if="recentExecutions.length > 0">
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
        </template>
        <div v-else class="empty-hint">
          暂无执行记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * WorkflowContextPanel.vue - 工作流上下文面板
 * 更新为使用新的 workflowStore.ts
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUIStore } from '../../stores/ui.js';
import { useNavigationStore } from '../../stores/navigation.js';
import { useWorkflowStore } from '../../stores/workflowStore';
import { icons } from '../../utils/icons.js';
import type { Workflow } from '../../types/workflow';

const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();
const workflowStore = useWorkflowStore();

// 确保在工作流页面
function ensureWorkflowPage(): void {
  if (route.path !== '/workflow') {
    router.push('/workflow');
  }
}

// 统一的激活状态 - 同一时间只有一个按钮被高亮
const activeView = ref('');

// 控制工作流列表显示
const maxDisplayCount = 5;
const showAllWorkflows = ref(false);

// 从 workflowStore 获取工作流数据
const workflows = computed(() => {
  return workflowStore.workflows.map(w => ({
    ...w,
    count: w.nodes?.length || 0
  }));
});

// 显示的工作流列表（限制数量）
const displayedWorkflows = computed(() => {
  if (showAllWorkflows.value) {
    return workflows.value;
  }
  return workflows.value.slice(0, maxDisplayCount);
});

// 截断名称显示
const maxNameLength = 12;
function truncateName(name: string): string {
  if (!name) return '';
  if (name.length <= maxNameLength) return name;
  return name.substring(0, maxNameLength) + '...';
}

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

// 初始化时加载工作流和模板
onMounted(async () => {
  await workflowStore.loadWorkflows();
  await loadTemplates();
  console.log('📋 WorkflowContextPanel mounted, workflows:', workflowStore.workflows.length);
});

// 工作流点击处理
function handleWorkflowClick(workflow: Workflow & { count: number }): void {
  console.log('🖱️ Workflow clicked:', workflow.id, workflow.name);
  activeView.value = `workflow-${workflow.id}`;
  ensureWorkflowPage();
  
  // 设置当前工作流
  const success = workflowStore.selectWorkflow(workflow.id);
  console.log('📌 selectWorkflow result:', success);
  
  // 更新 panelContext
  navigationStore.updatePanelContext('workflow', { 
    selectedWorkflow: workflow.id,
    viewType: 'workflow-detail',
    statusFilter: null,
    templateId: null,
    executionId: null
  });
}

interface Template {
  id: string;
  name: string;
}

const templates = ref<Template[]>([]);

// 加载模板数据
async function loadTemplates(): Promise<void> {
  try {
    const { apiService } = await import('../../services/index.ts');
    const result = await apiService.getWorkflowTemplates();
    if (result.success && result.templates.length > 0) {
      templates.value = result.templates.map((t: any) => ({
        id: t.templateId || t.id,
        name: t.name
      }));
    } else {
      // 默认模板
      templates.value = [
        { id: 't1', name: '标准转换流程' },
        { id: 't2', name: '快速预览流程' },
        { id: 't3', name: '高质量输出' }
      ];
    }
  } catch (error) {
    console.error('Failed to load templates:', error);
    templates.value = [
      { id: 't1', name: '标准转换流程' },
      { id: 't2', name: '快速预览流程' },
      { id: 't3', name: '高质量输出' }
    ];
  }
}

// 从 store 获取执行记录
const recentExecutions = computed(() => {
  return workflowStore.executions
    .sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime())
    .slice(0, 5)
    .map(exec => ({
      id: exec.id,
      name: exec.workflowName || '未命名工作流',
      status: exec.status === 'completed' ? 'success' : exec.status === 'failed' ? 'error' : exec.status,
      time: formatRelativeTime(exec.startTime)
    }));
});

// 格式化相对时间
function formatRelativeTime(timestamp: number | string | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  return `${diffDays}天前`;
}

// 获取执行状态图标
function getExecutionIcon(status: string) {
  const iconMap: Record<string, any> = {
    success: icons.check,
    error: icons.xCircle,
    running: icons.refresh,
    pending: icons.clock
  };
  return iconMap[status] || icons.circle;
}

// 模板点击处理
function handleTemplateClick(template: Template): void {
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

interface Execution {
  id: string;
  name: string;
  status: string;
  time: string;
}

// 执行记录点击处理
function handleExecutionClick(execution: Execution): void {
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
function handleCreateWorkflow(): void {
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
function handleStatusClick(statusType: string): void {
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
  background: rgba(205, 214, 210, 0.45);
  backdrop-filter: blur(10px);
  color: #2c2c2e;
  position: relative;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* 右侧独立标注线 - 纯色，立体凸起 */
.section-item--active::after {
  content: '';
  position: absolute;
  right: -14px;
  top: 3px;
  bottom: 3px;
  width: 5px;
  background: #a1a1a1;
  border-radius: 3px;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.section-item span {
  flex: 1;
  min-width: 0;
}

.workflow-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-items--scrollable {
  max-height: 180px;
  overflow-y: auto;
}

.section-items--scrollable::-webkit-scrollbar {
  width: 4px;
}

.section-items--scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.section-items--scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.section-items--scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

.show-more-btn {
  font-size: 11px;
  color: #7a7a7c;
  padding: 6px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.show-more-btn:hover {
  color: #4a4a4c;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
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

.empty-hint {
  font-size: 12px;
  color: #9a9a9a;
  padding: 8px 10px;
  text-align: center;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
