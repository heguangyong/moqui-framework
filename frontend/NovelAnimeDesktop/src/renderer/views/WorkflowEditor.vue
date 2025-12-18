<template>
  <div class="workflow-editor">
    <div class="editor-header">
      <div class="editor-title">
        <h2>工作流编辑器</h2>
        <p v-if="currentWorkflow">当前工作流: {{ currentWorkflow.name }}</p>
      </div>
      <div class="editor-actions">
        <select v-model="selectedWorkflowId" @change="switchWorkflow" class="workflow-select">
          <option value="">选择工作流</option>
          <option v-for="workflow in workflows" :key="workflow.id" :value="workflow.id">
            {{ workflow.name }}
          </option>
        </select>
        <button @click="createNewWorkflow" class="btn btn-secondary">新建工作流</button>
        <button @click="createDefaultWorkflow" class="btn btn-secondary">默认工作流</button>
        <button @click="saveWorkflow" class="btn btn-primary" :disabled="!currentWorkflow">
          保存工作流
        </button>
        <button @click="runWorkflow" class="btn btn-success" :disabled="!currentWorkflow || isExecuting">
          {{ isExecuting ? '执行中...' : '运行工作流' }}
        </button>
      </div>
    </div>

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
      <div class="node-palette">
        <h3>节点库</h3>
        <div class="node-categories">
          <div class="category">
            <h4>输入节点</h4>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'novel-parser')">
              📖 小说解析器
            </div>
          </div>
          
          <div class="category">
            <h4>处理节点</h4>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'character-analyzer')">
              👤 角色分析器
            </div>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'scene-generator')">
              🎬 场景生成器
            </div>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'script-converter')">
              📝 脚本转换器
            </div>
          </div>
          
          <div class="category">
            <h4>输出节点</h4>
            <div class="node-item" draggable="true" @dragstart="startDrag($event, 'video-generator')">
              🎥 视频生成器
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useWorkflowStore } from '../stores/workflow.js';
import { useProjectStore } from '../stores/project.js';
import { useUIStore } from '../stores/ui.js';

const workflowStore = useWorkflowStore();
const projectStore = useProjectStore();
const uiStore = useUIStore();

// Reactive data
const selectedWorkflowId = ref('');
const validationResult = ref(null);
const currentExecutionId = ref(null);
const executionResults = ref(null);
const showResultsPanel = ref(false);

// 监听执行状态变化
watch(() => workflowStore.executionStatus, (newStatus) => {
  if (newStatus === 'completed') {
    handleExecutionComplete();
  } else if (newStatus === 'failed') {
    handleExecutionFailed();
  }
});

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

onMounted(() => {
  workflowStore.loadAllWorkflows();
});

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

// 处理执行完成
function handleExecutionComplete() {
  const execution = workflowStore.getExecutionStatus(currentExecutionId.value);
  if (execution) {
    executionResults.value = {
      status: 'completed',
      nodeResults: execution.context?.nodeResults || new Map(),
      duration: execution.endTime - execution.startTime
    };
    showResultsPanel.value = true;
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

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
}

.editor-title h2 {
  margin-bottom: 0.5rem;
}

.editor-title p {
  opacity: 0.7;
  font-size: 0.9rem;
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.workflow-select {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  font-size: 0.875rem;
}

.workflow-select option {
  background: #333;
  color: white;
}

.execution-progress {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(10px);
}

.execution-results {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(76, 175, 80, 0.3);
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
  color: #4CAF50;
}

.result-status.failed {
  color: #f44336;
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
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.8;
}

.btn-danger {
  background: #f44336;
  color: white;
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
  color: #4CAF50;
  margin-bottom: 0.5rem;
}

.validation-errors .error-item {
  color: #f44336;
  margin-bottom: 0.25rem;
}

.validation-warnings .warning-item {
  color: #FF9800;
  margin-bottom: 0.25rem;
}

.workflow-node.node-running {
  border-color: #2196F3;
  box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
}

.workflow-node.node-completed {
  border-color: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.editor-content {
  flex: 1;
  display: flex;
  gap: 1rem;
}

.node-palette {
  width: 250px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  backdrop-filter: blur(10px);
  overflow-y: auto;
}

.node-palette h3 {
  margin-bottom: 1rem;
  text-align: center;
}

.category {
  margin-bottom: 1.5rem;
}

.category h4 {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

.node-item {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  cursor: grab;
  transition: all 0.3s;
  font-size: 0.875rem;
}

.node-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.node-item:active {
  cursor: grabbing;
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

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-success {
  background: #FF9800;
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>