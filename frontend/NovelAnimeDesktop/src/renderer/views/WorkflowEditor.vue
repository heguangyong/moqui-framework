<template>
  <div class="workflow-editor">
    <!-- 视图头部 -->
    <ViewHeader 
      :title="viewTitle" 
      :subtitle="viewSubtitle"
    >
      <template #actions>
        <template v-if="currentViewType === 'workflow-detail' || currentViewType === 'new' || !currentViewType">
          <div class="custom-select" :class="{ open: dropdownOpen }">
            <div class="select-trigger" @click="toggleDropdown">
              <span>{{ selectedWorkflowName }}</span>
              <span class="arrow">▼</span>
            </div>
            <div class="select-dropdown" v-if="dropdownOpen">
              <div 
                class="select-option" 
                :class="{ selected: selectedWorkflowId === '' }"
                @click="selectWorkflow('')"
              >
                选择工作流
              </div>
              <div 
                v-for="workflow in workflows" 
                :key="workflow.id"
                class="select-option-row"
                :class="{ selected: selectedWorkflowId === workflow.id }"
              >
                <span class="option-name" @click="selectWorkflow(workflow.id)">{{ workflow.name }}</span>
                <button 
                  class="option-edit" 
                  @click.stop="renameWorkflow(workflow.id)"
                  title="重命名"
                >✎</button>
                <button 
                  class="option-delete" 
                  @click.stop="deleteWorkflow(workflow.id)"
                  title="删除工作流"
                >×</button>
              </div>
            </div>
          </div>
          <button @click="createNewWorkflow" class="btn btn-secondary">新建工作流</button>
          <button @click="createDefaultWorkflow" class="btn btn-secondary">默认工作流</button>
          <button @click="saveWorkflow" class="btn btn-primary" :disabled="!currentWorkflow">
            保存工作流
          </button>
          <button @click="runWorkflow" class="btn btn-success" :disabled="!currentWorkflow || isExecuting">
            {{ isExecuting ? '执行中...' : '运行工作流' }}
          </button>
        </template>
        <template v-else-if="currentViewType === 'status'">
          <button class="btn btn-secondary" @click="refreshStatus">刷新状态</button>
        </template>
        <template v-else-if="currentViewType === 'template'">
          <button class="btn btn-primary" @click="useTemplate">使用此模板</button>
        </template>
      </template>
    </ViewHeader>

    <!-- Execution Progress -->
    <div v-if="isExecuting" class="execution-progress">
      <div class="progress-header">
        <span>{{ executionMessage }}</span>
        <button @click="cancelExecution" class="btn btn-small btn-danger">取消</button>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: executionProgress + '%' }"></div>
      </div>
      <div class="progress-text">{{ executionProgress }}%</div>
    </div>
    
    <!-- Execution Results Panel -->
    <div v-if="showResultsPanel && executionResults" class="execution-results">
      <div class="results-header">
        <h3>执行结果</h3>
        <button @click="showResultsPanel = false" class="btn btn-small">关闭</button>
      </div>
      <div class="results-content">
        <div class="result-status" :class="executionResults.status">
          <span v-if="executionResults.status === 'completed'">✅ 执行成功</span>
          <span v-else>❌ 执行失败</span>
        </div>
        <div class="result-duration" v-if="executionResults.duration">
          耗时: {{ Math.round(executionResults.duration / 1000) }}秒
        </div>
        <div class="result-summary">
          <p>已处理 {{ executionResults.nodeResults?.size || 0 }} 个节点</p>
        </div>
      </div>
    </div>
    
    <div class="editor-content">
      <!-- 状态视图 -->
      <template v-if="currentViewType === 'status'">
        <div class="status-view">
          <div class="status-list">
            <div 
              v-for="workflow in filteredWorkflowsByStatus" 
              :key="workflow.id"
              class="status-item"
              @click="viewWorkflowDetail(workflow)"
            >
              <div class="status-icon" :class="`status-icon--${workflow.status}`">
                <component :is="getStatusIcon(workflow.status)" :size="20" />
              </div>
              <div class="status-info">
                <div class="status-name">{{ workflow.name }}</div>
                <div class="status-desc">{{ workflow.description || '暂无描述' }}</div>
              </div>
              <div class="status-time">{{ formatTime(workflow.updatedAt) }}</div>
            </div>
            <div v-if="filteredWorkflowsByStatus.length === 0" class="empty-status">
              <component :is="icons.inbox" :size="48" />
              <span>暂无{{ statusTitle }}的工作流</span>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 模板视图 -->
      <template v-else-if="currentViewType === 'template'">
        <div class="template-view">
          <div class="template-content">
            <div class="template-preview">
              <component :is="icons.layers" :size="64" />
            </div>
            <div class="template-nodes">
              <h4>包含节点</h4>
              <div class="node-list">
                <div class="node-preview" v-for="node in templateNodes" :key="node">
                  <span class="node-icon">{{ getNodeIcon(node) }}</span>
                  <span>{{ getNodeTitle(node) }}</span>
                </div>
              </div>
            </div>
            <div class="template-actions" style="margin-top: 20px;">
              <button class="btn btn-primary" @click="useTemplate">使用此模板</button>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 执行记录视图 -->
      <template v-else-if="currentViewType === 'execution'">
        <div class="execution-view">
          <div class="execution-detail">
            <div class="execution-info">
              <div class="info-row">
                <span class="info-label">执行ID</span>
                <span class="info-value">{{ selectedExecutionId }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">状态</span>
                <span class="info-value status-badge" :class="`status-badge--${selectedExecutionStatus}`">
                  {{ selectedExecutionStatus === 'success' ? '成功' : selectedExecutionStatus === 'error' ? '失败' : selectedExecutionStatus }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">执行时间</span>
                <span class="info-value">{{ selectedExecutionTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 默认工作流编辑器视图 -->
      <template v-else>
        <div class="node-palette">
        <h3>节点库</h3>
        <div class="node-categories">
          <div class="category">
            <h4>输入节点</h4>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'novel-parser')">
              <span class="node-item-icon">📖</span>
              <span class="node-item-divider"></span>
              <span class="node-item-text">小说解析器</span>
            </div>
          </div>
          
          <div class="category">
            <h4>处理节点</h4>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'character-analyzer')">
              <span class="node-item-icon">👤</span>
              <span class="node-item-divider"></span>
              <span class="node-item-text">角色分析器</span>
            </div>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'scene-generator')">
              <span class="node-item-icon">🎬</span>
              <span class="node-item-divider"></span>
              <span class="node-item-text">场景生成器</span>
            </div>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'script-converter')">
              <span class="node-item-icon">📝</span>
              <span class="node-item-divider"></span>
              <span class="node-item-text">脚本转换器</span>
            </div>
          </div>
          
          <div class="category">
            <h4>输出节点</h4>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'video-generator')">
              <span class="node-item-icon">🎥</span>
              <span class="node-item-divider"></span>
              <span class="node-item-text">视频生成器</span>
            </div>
          </div>
        </div>

        <!-- Workflow validation -->
        <div class="validation-section" v-if="currentWorkflow">
          <h4>工作流验证</h4>
          <button @click="validateWorkflow" class="btn btn-small">验证工作流</button>
          <div v-if="validationResult" class="validation-result">
            <div v-if="validationResult.isValid" class="validation-success">
              ✅ 工作流验证通过
            </div>
            <div v-else class="validation-errors">
              <div v-for="error in validationResult.errors" :key="error.message" class="error-item">
                ❌ {{ error.message }}
              </div>
            </div>
            <div v-if="validationResult.warnings.length > 0" class="validation-warnings">
              <div v-for="warning in validationResult.warnings" :key="warning.message" class="warning-item">
                ⚠️ {{ warning.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="workflow-canvas" @drop="dropNode" @dragover.prevent>
        <div v-if="!currentWorkflow" class="empty-canvas">
          <div class="empty-message">
            <h3>请选择或创建一个工作流</h3>
            <p>从上方选择现有工作流，或创建新的工作流开始编辑</p>
          </div>
        </div>
        
        <div v-else class="canvas-grid">
          <div 
            v-for="node in currentWorkflowNodes" 
            :key="node.id"
            class="workflow-node"
            :class="{ 'node-running': node.status === 'running', 'node-completed': node.status === 'completed' }"
            :style="{ left: node.position.x + 'px', top: node.position.y + 'px' }"
            @mousedown="startDragNode($event, node)"
          >
            <div class="node-header">
              <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
              <span class="node-title">{{ node.name }}</span>
              <button @click="removeNode(node.id)" class="node-remove">×</button>
            </div>
            <div class="node-content">
              <div class="node-inputs">
                <div v-for="input in getNodeInputs(node.type)" :key="input" class="input-port">
                  ● {{ input }}
                </div>
              </div>
              <div class="node-outputs">
                <div v-for="output in getNodeOutputs(node.type)" :key="output" class="output-port">
                  {{ output }} ●
                </div>
              </div>
            </div>
          </div>
          
          <!-- 连接线 -->
          <svg class="connections-layer">
            <line 
              v-for="connection in currentWorkflowConnections" 
              :key="connection.id"
              :x1="getConnectionX1(connection)" 
              :y1="getConnectionY1(connection)"
              :x2="getConnectionX2(connection)" 
              :y2="getConnectionY2(connection)"
              stroke="rgba(255,255,255,0.6)" 
              stroke-width="2"
            />
          </svg>
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useWorkflowStore } from '../stores/workflow.js';
import { useProjectStore } from '../stores/project.js';
import { useUIStore } from '../stores/ui.js';
import { useNavigationStore } from '../stores/navigation.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';

const workflowStore = useWorkflowStore();
const projectStore = useProjectStore();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();

// Reactive data
const selectedWorkflowId = ref('');
const validationResult = ref(null);
const currentExecutionId = ref(null);
const executionResults = ref(null);
const showResultsPanel = ref(false);
const dropdownOpen = ref(false);

// 从 panelContext 获取当前视图状态
const workflowContext = computed(() => navigationStore.panelContext.workflow || {});
const currentViewType = computed(() => workflowContext.value?.viewType || '');
const statusFilter = computed(() => workflowContext.value?.statusFilter || '');
const selectedTemplateId = computed(() => workflowContext.value?.templateId || '');
const selectedExecutionId = computed(() => workflowContext.value?.executionId || '');
const selectedExecutionName = computed(() => workflowContext.value?.executionName || '');
const selectedExecutionStatus = computed(() => workflowContext.value?.executionStatus || 'success');
const selectedExecutionTime = computed(() => workflowContext.value?.executionTime || '');

// 模板数据
const templates = ref([
  { id: 't1', name: '标准转换流程', description: '完整的小说到视频转换流程', nodes: ['novel-parser', 'character-analyzer', 'scene-generator', 'script-converter', 'video-generator'] },
  { id: 't2', name: '快速预览流程', description: '快速生成预览视频', nodes: ['novel-parser', 'scene-generator', 'video-generator'] },
  { id: 't3', name: '高质量输出', description: '高质量视频输出流程', nodes: ['novel-parser', 'character-analyzer', 'scene-generator', 'script-converter', 'video-generator'] }
]);

const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === selectedTemplateId.value);
});

const templateNodes = computed(() => {
  return selectedTemplate.value?.nodes || [];
});

// 动态标题和副标题
const viewTitle = computed(() => {
  switch (currentViewType.value) {
    case 'status':
      return statusTitle.value;
    case 'template':
      return selectedTemplate.value?.name || '模板详情';
    case 'execution':
      return selectedExecutionName.value || '执行记录';
    case 'new':
      return '新建工作流';
    case 'workflow-detail':
      return currentWorkflow.value?.name || '工作流编辑器';
    default:
      return '工作流编辑器';
  }
});

const viewSubtitle = computed(() => {
  switch (currentViewType.value) {
    case 'status':
      return statusDescription.value;
    case 'template':
      return selectedTemplate.value?.description || '查看模板配置';
    case 'execution':
      return selectedExecutionTime.value ? `执行于 ${selectedExecutionTime.value}` : '查看工作流执行历史';
    case 'new':
      return '创建新的工作流';
    case 'workflow-detail':
      return currentWorkflow.value?.description || '编辑工作流节点和连接';
    default:
      return currentWorkflow.value ? `当前: ${currentWorkflow.value.name}` : '设计和执行工作流程';
  }
});

// 状态相关
const statusTitle = computed(() => {
  const titles = {
    running: '运行中',
    completed: '已完成',
    failed: '失败'
  };
  return titles[statusFilter.value] || '工作流状态';
});

const statusDescription = computed(() => {
  const descriptions = {
    running: '正在执行的工作流',
    completed: '已成功完成的工作流',
    failed: '执行失败的工作流'
  };
  return descriptions[statusFilter.value] || '查看工作流执行状态';
});

// 按状态筛选工作流
const filteredWorkflowsByStatus = computed(() => {
  if (!statusFilter.value) return workflows.value;
  return workflows.value.filter(w => w.status === statusFilter.value);
});

// 获取状态图标
function getStatusIcon(status) {
  const iconMap = {
    running: icons.refresh,
    completed: icons.check,
    failed: icons.xCircle,
    idle: icons.circle
  };
  return iconMap[status] || icons.circle;
}

// 格式化时间
function formatTime(time) {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN');
}

// 查看工作流详情
function viewWorkflowDetail(workflow) {
  selectedWorkflowId.value = workflow.id;
  workflowStore.setCurrentWorkflow(workflow.id);
  navigationStore.updatePanelContext('workflow', {
    selectedWorkflow: workflow.id,
    viewType: 'workflow-detail',
    statusFilter: null,
    templateId: null,
    executionId: null
  });
}

// 刷新状态
function refreshStatus() {
  workflowStore.loadAllWorkflows();
  uiStore.addNotification({
    type: 'info',
    title: '刷新成功',
    message: '工作流状态已更新',
    timeout: 2000
  });
}

// 使用模板
function useTemplate() {
  console.log('useTemplate called');
  console.log('selectedTemplateId:', selectedTemplateId.value);
  console.log('selectedTemplate:', selectedTemplate.value);
  console.log('templates:', templates.value);
  
  if (selectedTemplate.value) {
    // 让用户输入工作流名称
    const defaultName = `${selectedTemplate.value.name} - 副本`;
    console.log('About to show prompt with defaultName:', defaultName);
    const name = prompt('请输入工作流名称:', defaultName);
    
    // 用户取消则不创建
    if (!name) return;
    
    const workflow = workflowStore.createWorkflow(
      name.trim() || defaultName,
      selectedTemplate.value.description
    );
    
    // 先设置为当前工作流，这样 addNode 才能正确添加节点
    workflowStore.setCurrentWorkflow(workflow.id);
    selectedWorkflowId.value = workflow.id;
    
    // 添加模板节点并自动连接
    const nodeIds = [];
    selectedTemplate.value.nodes.forEach((nodeType, index) => {
      const node = workflowStore.addNode(
        nodeType, 
        getNodeTitle(nodeType), 
        { x: 100 + index * 220, y: 100 }
      );
      if (node) {
        nodeIds.push(node.id);
      }
    });
    
    // 自动连接相邻节点
    for (let i = 0; i < nodeIds.length - 1; i++) {
      workflowStore.addConnection(nodeIds[i], nodeIds[i + 1]);
    }
    
    navigationStore.updatePanelContext('workflow', {
      selectedWorkflow: workflow.id,
      viewType: 'workflow-detail',
      templateId: null
    });
    uiStore.addNotification({
      type: 'success',
      title: '模板应用成功',
      message: `已创建工作流 "${name}"`,
      timeout: 3000
    });
  }
}

// 获取节点标题
function getNodeTitle(type) {
  const titles = {
    'novel-parser': '小说解析器',
    'character-analyzer': '角色分析器',
    'scene-generator': '场景生成器',
    'script-converter': '脚本转换器',
    'video-generator': '视频生成器'
  };
  return titles[type] || type;
}

// Computed for selected workflow name
const selectedWorkflowName = computed(() => {
  if (!selectedWorkflowId.value) return '选择工作流';
  const workflow = workflows.value.find(w => w.id === selectedWorkflowId.value);
  return workflow ? workflow.name : '选择工作流';
});

// Custom dropdown functions
function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function selectWorkflow(id) {
  selectedWorkflowId.value = id;
  dropdownOpen.value = false;
  switchWorkflow();
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  const customSelect = document.querySelector('.custom-select');
  if (customSelect && !customSelect.contains(event.target)) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  workflowStore.loadAllWorkflows();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 监听执行状态变化
watch(() => workflowStore.executionStatus, (newStatus) => {
  if (newStatus === 'completed') {
    handleExecutionComplete();
  } else if (newStatus === 'failed') {
    handleExecutionFailed();
  }
});

// 监听 panelContext 变化 - 响应中间面板的点击
watch(
  () => navigationStore.panelContext.workflow,
  (newVal) => {
    console.log('👀 WorkflowEditor panelContext changed:', newVal);
    if (newVal?.selectedWorkflow && newVal.selectedWorkflow !== selectedWorkflowId.value) {
      selectedWorkflowId.value = newVal.selectedWorkflow;
      // 如果 currentWorkflow 还没设置，尝试设置
      if (!workflowStore.currentWorkflow || workflowStore.currentWorkflow.id !== newVal.selectedWorkflow) {
        const success = workflowStore.setCurrentWorkflow(newVal.selectedWorkflow);
        console.log('📌 WorkflowEditor setCurrentWorkflow result:', success, 'workflow:', workflowStore.currentWorkflow?.name);
      }
    }
    if (newVal?.templateId) {
      console.log('📋 Template selected:', newVal.templateId);
    }
    if (newVal?.executionId) {
      console.log('📊 Execution selected:', newVal.executionId);
    }
  },
  { deep: true, immediate: true }
);

// Computed properties
const workflows = computed(() => workflowStore.workflows);
const currentWorkflow = computed(() => workflowStore.currentWorkflow);
const currentWorkflowNodes = computed(() => workflowStore.currentWorkflowNodes);
const currentWorkflowConnections = computed(() => workflowStore.currentWorkflowConnections);
const isExecuting = computed(() => workflowStore.isExecuting);
const executionProgress = computed(() => workflowStore.executionProgress);
const executionMessage = computed(() => workflowStore.executionMessage);

// Node types configuration
const nodeTypes = {
  'novel-parser': {
    icon: '📖',
    title: '小说解析器',
    inputs: [],
    outputs: ['文本', '结构']
  },
  'character-analyzer': {
    icon: '👤',
    title: '角色分析器',
    inputs: ['文本'],
    outputs: ['角色信息']
  },
  'scene-generator': {
    icon: '🎬',
    title: '场景生成器',
    inputs: ['结构', '角色信息'],
    outputs: ['场景描述']
  },
  'script-converter': {
    icon: '📝',
    title: '脚本转换器',
    inputs: ['场景描述'],
    outputs: ['脚本']
  },
  'video-generator': {
    icon: '🎥',
    title: '视频生成器',
    inputs: ['脚本'],
    outputs: []
  }
};

// Workflow management
function createNewWorkflow() {
  const name = prompt('请输入工作流名称:');
  if (name) {
    const workflow = workflowStore.createWorkflow(name, '新建的工作流');
    selectedWorkflowId.value = workflow.id;
    workflowStore.setCurrentWorkflow(workflow.id);
  }
}

function createDefaultWorkflow() {
  const workflow = workflowStore.createDefaultWorkflow();
  selectedWorkflowId.value = workflow.id;
}

function deleteWorkflow(workflowId) {
  const workflow = workflows.value.find(w => w.id === workflowId);
  if (!workflow) return;
  
  // 先关闭下拉菜单
  dropdownOpen.value = false;
  
  setTimeout(() => {
    if (confirm(`确定要删除工作流 "${workflow.name}" 吗？`)) {
      workflowStore.deleteWorkflow(workflowId);
      
      // 如果删除的是当前选中的工作流，清空选择
      if (selectedWorkflowId.value === workflowId) {
        selectedWorkflowId.value = '';
      }
      
      uiStore.addNotification({
        type: 'success',
        title: '删除成功',
        message: `工作流 "${workflow.name}" 已删除`,
        timeout: 2000
      });
    }
  }, 100);
}

function renameWorkflow(workflowId) {
  console.log('renameWorkflow called with id:', workflowId);
  const workflow = workflows.value.find(w => w.id === workflowId);
  if (!workflow) {
    console.log('Workflow not found');
    return;
  }
  
  // 先关闭下拉菜单
  dropdownOpen.value = false;
  
  // 使用 setTimeout 确保下拉菜单关闭后再弹出 prompt
  setTimeout(() => {
    const newName = prompt('请输入新的工作流名称:', workflow.name);
    if (newName && newName.trim() && newName.trim() !== workflow.name) {
      workflowStore.renameWorkflow(workflowId, newName.trim());
      
      uiStore.addNotification({
        type: 'success',
        title: '重命名成功',
        message: `工作流已重命名为 "${newName.trim()}"`,
        timeout: 2000
      });
    }
  }, 100);
}

function switchWorkflow() {
  if (selectedWorkflowId.value) {
    workflowStore.setCurrentWorkflow(selectedWorkflowId.value);
    validationResult.value = null;
  }
}

function saveWorkflow() {
  if (currentWorkflow.value) {
    // In a real implementation, this would save to file system
    console.log('保存工作流:', currentWorkflow.value);
    alert('工作流已保存！');
  }
}

async function runWorkflow() {
  if (!currentWorkflow.value) {
    uiStore.addNotification({
      type: 'warning',
      title: '无法执行',
      message: '请先选择一个工作流',
      timeout: 3000
    });
    return;
  }

  if (currentWorkflowNodes.value.length === 0) {
    uiStore.addNotification({
      type: 'warning',
      title: '无法执行',
      message: '请先添加一些节点到工作流中',
      timeout: 3000
    });
    return;
  }

  // 准备初始数据（从当前项目获取）
  const initialData = {};
  if (projectStore.currentProject) {
    initialData.projectId = projectStore.currentProject.id;
    initialData.novelId = projectStore.currentProject.novelId;
    
    if (projectStore.currentProject.novel) {
      initialData.title = projectStore.currentProject.novel.title;
      initialData.chapters = projectStore.currentProject.novel.chapters;
    }
    
    if (projectStore.currentProject.characters) {
      initialData.characters = projectStore.currentProject.characters;
    }
  }

  try {
    executionResults.value = null;
    showResultsPanel.value = false;
    
    // 更新导航状态 - 需求 5.4: 开始执行工作流
    navigationStore.startExecution();
    
    currentExecutionId.value = await workflowStore.executeWorkflow(
      currentWorkflow.value.id,
      initialData
    );
    
    uiStore.addNotification({
      type: 'info',
      title: '开始执行',
      message: `工作流 "${currentWorkflow.value.name}" 开始执行`,
      timeout: 2000
    });
  } catch (error) {
    uiStore.addNotification({
      type: 'error',
      title: '执行失败',
      message: error.message,
      timeout: 5000
    });
  }
}

// 处理执行完成 - 需求 5.5
function handleExecutionComplete() {
  const execution = workflowStore.getExecutionStatus(currentExecutionId.value);
  if (execution) {
    const results = {
      status: 'completed',
      nodeResults: execution.context?.nodeResults || new Map(),
      duration: execution.endTime - execution.startTime
    };
    executionResults.value = results;
    showResultsPanel.value = true;
    
    // 更新导航状态 - 需求 5.5: 执行完成后显示结果预览
    navigationStore.setExecutionResult(results);
  }
  
  uiStore.addNotification({
    type: 'success',
    title: '执行完成',
    message: `工作流执行成功完成`,
    timeout: 3000
  });
}

// 处理执行失败
function handleExecutionFailed() {
  const error = workflowStore.error;
  
  uiStore.addNotification({
    type: 'error',
    title: '执行失败',
    message: error || '工作流执行过程中发生错误',
    timeout: 5000
  });
}

function cancelExecution() {
  if (currentExecutionId.value) {
    workflowStore.cancelExecution(currentExecutionId.value);
    currentExecutionId.value = null;
  }
}

function validateWorkflow() {
  validationResult.value = workflowStore.validateCurrentWorkflow();
}

// Node management
function startDrag(event, nodeType) {
  event.dataTransfer.setData('nodeType', nodeType);
}

function dropNode(event) {
  if (!currentWorkflow.value) return;
  
  event.preventDefault();
  const nodeType = event.dataTransfer.getData('nodeType');
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left - 75;
  const y = event.clientY - rect.top - 50;
  
  const nodeName = nodeTypes[nodeType]?.title || nodeType;
  workflowStore.addNode(nodeType, nodeName, { x: Math.max(0, x), y: Math.max(0, y) });
}

function removeNode(nodeId) {
  if (confirm('确定要删除这个节点吗？')) {
    workflowStore.removeNode(nodeId);
  }
}

function startDragNode(event, node) {
  const startX = event.clientX - node.position.x;
  const startY = event.clientY - node.position.y;
  
  function onMouseMove(e) {
    const newX = e.clientX - startX;
    const newY = e.clientY - startY;
    workflowStore.updateNodePosition(node.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Helper functions
function getNodeIcon(type) {
  return nodeTypes[type]?.icon || '⚙️';
}

function getNodeInputs(type) {
  return nodeTypes[type]?.inputs || [];
}

function getNodeOutputs(type) {
  return nodeTypes[type]?.outputs || [];
}

function getConnectionX1(connection) {
  const fromNode = currentWorkflowNodes.value.find(n => n.id === connection.fromNodeId);
  return fromNode ? fromNode.position.x + 150 : 0;
}

function getConnectionY1(connection) {
  const fromNode = currentWorkflowNodes.value.find(n => n.id === connection.fromNodeId);
  return fromNode ? fromNode.position.y + 30 : 0;
}

function getConnectionX2(connection) {
  const toNode = currentWorkflowNodes.value.find(n => n.id === connection.toNodeId);
  return toNode ? toNode.position.x : 0;
}

function getConnectionY2(connection) {
  const toNode = currentWorkflowNodes.value.find(n => n.id === connection.toNodeId);
  return toNode ? toNode.position.y + 30 : 0;
}
</script>

<style scoped>
.workflow-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ViewHeader actions styling */
:deep(.header-actions) {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Custom Select Dropdown */
.custom-select {
  position: relative;
}

.select-trigger {
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #6a6a6a;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  box-sizing: border-box;
}

.select-trigger:hover {
  color: #4a4a4a;
  background: rgba(0, 0, 0, 0.05);
}

/* 选中状态 - 简洁风格 */
.custom-select.open .select-trigger {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: #2c2c2e;
}

.select-trigger .arrow {
  font-size: 0.5rem;
  opacity: 0.6;
  transition: transform 0.2s;
}

.custom-select.open .select-trigger .arrow {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 100%;
  width: max-content;
  margin-top: 2px;
  background: rgba(250, 250, 250, 0.98);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.select-option {
  padding: 6px 12px;
  color: #4a4a4c;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.select-option:hover {
  background: rgba(0, 0, 0, 0.05);
}

.select-option.selected {
  background: rgba(120, 140, 130, 0.2);
  color: #3a4a42;
}

.select-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 4px 12px;
  color: #4a4a4c;
  font-size: 12px;
  transition: background 0.15s;
  white-space: nowrap;
}

.select-option-row:hover {
  background: rgba(0, 0, 0, 0.05);
}

.select-option-row.selected {
  background: rgba(120, 140, 130, 0.2);
  color: #3a4a42;
}

.select-option-row .option-name {
  flex: 1;
  cursor: pointer;
  padding: 2px 0;
}

.select-option-row .option-edit,
.select-option-row .option-delete {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
}

.select-option-row:hover .option-edit,
.select-option-row:hover .option-delete {
  opacity: 1;
}

.select-option-row .option-edit:hover {
  background: rgba(100, 150, 200, 0.2);
  color: #48c;
}

.select-option-row .option-delete:hover {
  background: rgba(200, 100, 100, 0.2);
  color: #c44;
}

.execution-progress {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.execution-results {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.results-header h3 {
  margin: 0;
  font-size: 1rem;
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-status {
  font-weight: 600;
  font-size: 1rem;
}

.result-status.completed {
  color: #6a8a7a;
}

.result-status.failed {
  color: #a07070;
}

.result-duration {
  font-size: 0.875rem;
  opacity: 0.8;
}

.result-summary {
  font-size: 0.875rem;
  opacity: 0.9;
}

.result-summary p {
  margin: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: rgba(100, 160, 130, 0.6);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.8;
}

.btn-danger {
  background: linear-gradient(90deg, rgba(180, 140, 140, 0.7), rgba(200, 170, 170, 0.6));
  color: #5a4040;
}

.btn-danger:hover {
  background: linear-gradient(90deg, rgba(170, 130, 130, 0.8), rgba(190, 160, 160, 0.7));
}

.empty-canvas {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.empty-message {
  text-align: center;
  opacity: 0.6;
}

.empty-message h3 {
  margin-bottom: 1rem;
}

.validation-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.validation-section h4 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.validation-result {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.validation-success {
  color: #6a8a7a;
  margin-bottom: 0.5rem;
}

.validation-errors .error-item {
  color: #a07070;
  margin-bottom: 0.25rem;
}

.validation-warnings .warning-item {
  color: #a09060;
  margin-bottom: 0.25rem;
}

.workflow-node.node-running {
  border-color: #8a8a8a;
  box-shadow: 0 0 10px rgba(140, 140, 140, 0.5);
}

.workflow-node.node-completed {
  border-color: #7a9a8a;
  box-shadow: 0 0 10px rgba(120, 150, 140, 0.5);
}

.editor-content {
  flex: 1;
  display: flex;
  gap: 1rem;
}

.node-palette {
  width: 180px;
  min-width: 180px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.875rem;
  backdrop-filter: blur(10px);
  overflow-y: auto;
}

.node-palette h3 {
  margin-bottom: 0.875rem;
  text-align: center;
  font-size: 0.9rem;
  color: #5a5a5c;
}

.category {
  margin-bottom: 1rem;
}

.category h4 {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 节点项 - 灰色系立体控件风格 */
.node-item {
  padding: 0;
  background: linear-gradient(145deg, rgba(160, 160, 160, 0.35), rgba(140, 140, 140, 0.25));
  border: 1px solid rgba(180, 180, 180, 0.4);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: grab;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  color: #4a4a4c;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.node-item:hover {
  background: linear-gradient(145deg, rgba(170, 170, 170, 0.4), rgba(150, 150, 150, 0.3));
  transform: translateY(-2px);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.14),
    0 2px 4px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08);
}

.node-item:active {
  cursor: grabbing;
  transform: translateY(0);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.12),
    inset 0 1px 3px rgba(0, 0, 0, 0.1);
  background: linear-gradient(145deg, rgba(140, 140, 140, 0.35), rgba(120, 120, 120, 0.25));
}

/* 节点图标区域 */
.node-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
  padding: 0.5rem 0;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.03);
}

/* 分割线 */
.node-item-divider {
  width: 1px;
  align-self: stretch;
  background: linear-gradient(
    180deg,
    transparent 10%,
    rgba(0, 0, 0, 0.12) 30%,
    rgba(0, 0, 0, 0.12) 70%,
    transparent 90%
  );
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.15);
}

/* 节点文字区域 */
.node-item-text {
  flex: 1;
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #4a4a4c;
  display: flex;
  align-items: center;
}

.workflow-canvas {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.canvas-grid {
  width: 100%;
  height: 100%;
  position: relative;
  background-image: 
    radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.workflow-node {
  position: absolute;
  width: 150px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: move;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px 8px 0 0;
}

.node-icon {
  margin-right: 0.5rem;
}

.node-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 500;
}

.node-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.7;
}

.node-remove:hover {
  opacity: 1;
  color: #ff4444;
}

.node-content {
  padding: 0.5rem;
}

.node-inputs, .node-outputs {
  font-size: 0.7rem;
  margin-bottom: 0.25rem;
}

.input-port, .output-port {
  padding: 0.1rem 0;
  opacity: 0.8;
}

.output-port {
  text-align: right;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 内容区统一按钮样式 - 简洁无渐变风格 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.5);
  color: #5a5a5c;
  box-sizing: border-box;
  white-space: nowrap;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: #2c2c2e;
  border-color: rgba(0, 0, 0, 0.18);
}

/* 次要按钮 */
.btn-secondary {
  background: rgba(160, 160, 160, 0.15);
  color: #6a6a6a;
  border-color: rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: rgba(160, 160, 160, 0.25);
  color: #5a5a5a;
}

/* 主要按钮 */
.btn-primary {
  background: rgba(120, 140, 130, 0.25);
  color: #4a5a52;
  border-color: rgba(100, 120, 110, 0.3);
}

.btn-primary:hover {
  background: rgba(120, 140, 130, 0.35);
  color: #3a4a42;
}

/* 成功按钮 */
.btn-success {
  background: rgba(100, 160, 130, 0.2);
  color: #4a7a5a;
  border-color: rgba(100, 160, 130, 0.3);
}

.btn-success:hover {
  background: rgba(100, 160, 130, 0.3);
  color: #3a6a4a;
}

/* 危险按钮 */
.btn-danger {
  background: rgba(200, 120, 120, 0.15);
  color: #8a5050;
  border-color: rgba(200, 120, 120, 0.25);
}

.btn-danger:hover {
  background: rgba(200, 120, 120, 0.25);
  color: #7a4040;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-small {
  height: 24px;
  padding: 0 8px;
  font-size: 11px;
}

/* 状态视图样式 */
.status-view,
.template-view,
.execution-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.view-header {
  margin-bottom: 24px;
}

.view-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.view-header p {
  font-size: 13px;
  color: #6c6c6e;
  margin: 0;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.status-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(4px);
}

.status-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.status-icon--running {
  background: #3498db;
  animation: pulse 1.5s infinite;
}

.status-icon--completed {
  background: #27ae60;
}

.status-icon--failed {
  background: #e74c3c;
}

.status-icon--idle {
  background: #95a5a6;
}

.status-info {
  flex: 1;
}

.status-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.status-desc {
  font-size: 12px;
  color: #6c6c6e;
}

.status-time {
  font-size: 11px;
  color: #8a8a8c;
}

.empty-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #8a8a8c;
  gap: 12px;
}

/* 模板视图样式 */
.template-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.template-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-align: center;
}

.template-preview h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #2c2c2e;
}

.template-preview p {
  margin: 0;
  font-size: 13px;
  color: #6c6c6e;
}

.template-nodes h4 {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 12px 0;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.node-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #4a4a4c;
}

.node-preview .node-icon {
  font-size: 16px;
}

/* 执行记录视图样式 */
.execution-detail {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.execution-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #6c6c6e;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge--success {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>