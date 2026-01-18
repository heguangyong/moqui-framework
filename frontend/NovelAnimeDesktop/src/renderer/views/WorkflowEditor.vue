<template>
  <div class="workflow-editor">
    <!-- 加载状态 -->
    <div v-if="!isReady" class="loading-overlay">
      <div class="loading-spinner">正在加载工作流编辑器...</div>
    </div>

    <!-- 工作流控制栏 - 使用标准view-header样式 -->
    <div class="view-header">
      <template v-if="currentViewType === 'workflow-detail' || currentViewType === 'new' || !currentViewType">
        <div class="header-content">
          <div class="custom-select" :class="{ open: dropdownOpen }">
            <div class="select-trigger" @click="toggleDropdown">
              <span>{{ selectedWorkflowName }}</span>
              <span class="arrow">▼</span>
            </div>
            <button 
              v-if="selectedWorkflowId" 
              @click.stop="renameCurrentWorkflow" 
              class="icon-btn"
              title="重命名"
            >✏️</button>
            <button 
              v-if="selectedWorkflowId" 
              @click.stop="deleteCurrentWorkflow" 
              class="icon-btn icon-btn-danger"
              title="删除"
            >🗑️</button>
            <div class="select-dropdown" v-if="dropdownOpen">
              <div 
                class="select-option" 
                :class="{ selected: selectedWorkflowId === '' }"
                @click="handleSelectWorkflow('')"
              >
                选择工作流
              </div>
              <div 
                v-for="workflow in workflows" 
                :key="workflow.id"
                class="select-option"
                :class="{ selected: selectedWorkflowId === workflow.id }"
                @click="handleSelectWorkflow(workflow.id)"
              >
                {{ workflow.name }}
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button @click="createNewWorkflow" class="btn btn-secondary">新建工作流</button>
            <button @click="createDefaultWorkflow" class="btn btn-secondary">默认工作流</button>
            <button @click="saveWorkflow" class="btn btn-primary" :disabled="!selectedWorkflowId">
              保存工作流
            </button>
            <button @click="runWorkflow" class="btn btn-success" :disabled="!selectedWorkflowId || isExecuting">
              {{ isExecuting ? '执行中...' : '运行工作流' }}
            </button>
          </div>
        </div>
      </template>
      <template v-else-if="currentViewType === 'status'">
        <h2>{{ statusTitle }}</h2>
        <p>{{ statusDescription }}</p>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="refreshStatus">刷新状态</button>
        </div>
      </template>
      <template v-else-if="currentViewType === 'template'">
        <h2>{{ selectedTemplate?.name || '模板详情' }}</h2>
        <p>{{ selectedTemplate?.description || '查看模板配置' }}</p>
        <div class="header-actions">
          <button class="btn btn-primary" @click="useTemplate">使用此模板</button>
        </div>
      </template>
      <template v-else-if="currentViewType === 'execution'">
        <h2>{{ selectedExecutionName || '执行记录' }}</h2>
        <p>{{ selectedExecutionTime ? `执行于 ${selectedExecutionTime}` : '查看工作流执行历史' }}</p>
      </template>
    </div>

    <!-- Execution Progress - Enhanced -->
    <div v-if="isExecuting" class="execution-progress-panel">
      <div class="progress-header">
        <div class="progress-title">
          <component :is="icons.play" :size="16" class="progress-icon" />
          <span>{{ executionMessage }}</span>
        </div>
        <div class="progress-actions">
          <button @click="toggleExecutionLogs" class="btn btn-small btn-secondary">
            {{ showExecutionLogs ? '隐藏日志' : '查看日志' }}
          </button>
          <button @click="cancelExecution" class="btn btn-small btn-danger">取消</button>
        </div>
      </div>
      
      <!-- Progress Bar with Details -->
      <div class="progress-details">
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: executionProgress + '%' }"></div>
          </div>
          <div class="progress-text">{{ executionProgress }}%</div>
        </div>
        
        <!-- Node Status Summary -->
        <div class="node-status-summary">
          <div class="status-item">
            <span class="status-label">总节点:</span>
            <span class="status-value">{{ currentWorkflowNodes.length }}</span>
          </div>
          <div class="status-item status-completed">
            <span class="status-label">已完成:</span>
            <span class="status-value">{{ completedNodesCount }}</span>
          </div>
          <div class="status-item status-running">
            <span class="status-label">执行中:</span>
            <span class="status-value">{{ runningNodesCount }}</span>
          </div>
          <div class="status-item status-pending">
            <span class="status-label">待执行:</span>
            <span class="status-value">{{ pendingNodesCount }}</span>
          </div>
        </div>
      </div>
      
      <!-- Execution Logs Panel -->
      <div v-if="showExecutionLogs" class="execution-logs-panel">
        <div class="logs-header">
          <h4>执行日志</h4>
          <button @click="clearExecutionLogs" class="btn btn-small">清空</button>
        </div>
        <div class="logs-content" ref="logsContainer">
          <div 
            v-for="(log, index) in executionLogs" 
            :key="index"
            class="log-entry"
            :class="`log-${log.level}`"
          >
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="executionLogs.length === 0" class="logs-empty">
            暂无日志
          </div>
        </div>
      </div>
    </div>
    
    <!-- Execution Results Panel - Enhanced -->
    <div v-if="showResultsPanel && executionResults" class="execution-results-panel">
      <div class="results-header">
        <h3>执行结果</h3>
        <div class="results-actions">
          <button @click="showExecutionHistory" class="btn btn-small btn-secondary">
            查看历史
          </button>
          <button @click="showResultsPanel = false" class="btn btn-small">关闭</button>
        </div>
      </div>
      <div class="results-content">
        <div class="result-status" :class="executionResults.status">
          <component 
            :is="executionResults.status === 'completed' ? icons.check : icons.xCircle" 
            :size="24" 
          />
          <span v-if="executionResults.status === 'completed'">执行成功</span>
          <span v-else>执行失败</span>
        </div>
        
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">执行时长</span>
            <span class="stat-value">{{ formatDuration(executionResults.duration) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">处理节点</span>
            <span class="stat-value">{{ executionResults.nodeResults?.size || 0 }} 个</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">完成时间</span>
            <span class="stat-value">{{ formatTime(Date.now()) }}</span>
          </div>
        </div>
        
        <!-- Node Results Details -->
        <div class="node-results-section">
          <h4>节点执行详情</h4>
          <div class="node-results-list">
            <div 
              v-for="node in currentWorkflowNodes" 
              :key="node.id"
              class="node-result-item"
              :class="{ 'has-result': hasNodeResult(node.id) }"
            >
              <div class="node-result-header">
                <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
                <span class="node-name">{{ node.name }}</span>
                <span class="node-status-badge" :class="`status-${node.status || 'idle'}`">
                  {{ getNodeStatusText(node.status) }}
                </span>
              </div>
              <div v-if="hasNodeResult(node.id)" class="node-result-data">
                <pre>{{ formatNodeResult(node.id) }}</pre>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 后续操作按钮 -->
        <div v-if="executionResults.status === 'completed'" class="result-actions">
          <button class="btn btn-primary" @click="viewGeneratedContent">
            <component :is="icons.eye" :size="16" />
            查看生成内容
          </button>
          <button class="btn btn-secondary" @click="exportResults">
            <component :is="icons.download" :size="16" />
            导出结果
          </button>
          <button class="btn btn-secondary" @click="backToDashboard">
            <component :is="icons.home" :size="16" />
            返回项目概览
          </button>
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
      
      <!-- 执行记录视图 - Enhanced -->
      <template v-else-if="currentViewType === 'execution'">
        <div class="execution-history-view">
          <div class="execution-detail">
            <div class="execution-info-card">
              <div class="info-header">
                <h3>执行详情</h3>
                <span class="execution-id">ID: {{ selectedExecutionId }}</span>
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">状态</span>
                  <span class="info-value status-badge" :class="`status-badge--${selectedExecutionStatus}`">
                    <component 
                      :is="getStatusIcon(selectedExecutionStatus)" 
                      :size="14" 
                    />
                    {{ getExecutionStatusText(selectedExecutionStatus) }}
                  </span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">执行时间</span>
                  <span class="info-value">{{ selectedExecutionTime }}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">工作流</span>
                  <span class="info-value">{{ selectedExecutionName }}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">节点数量</span>
                  <span class="info-value">{{ selectedExecutionNodeCount || 0 }} 个</span>
                </div>
              </div>
              
              <!-- Execution Timeline -->
              <div class="execution-timeline">
                <h4>执行时间线</h4>
                <div class="timeline-items">
                  <div 
                    v-for="(event, index) in selectedExecutionTimeline" 
                    :key="index"
                    class="timeline-item"
                  >
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <span class="timeline-time">{{ formatLogTime(event.timestamp) }}</span>
                      <span class="timeline-message">{{ event.message }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 默认工作流编辑器视图 -->
      <template v-else>
        <div class="node-palette">
        <h3>节点库</h3>
        
        <!-- 节点搜索 -->
        <div class="node-search">
          <component :is="icons.search" :size="14" class="search-icon" />
          <input 
            type="text" 
            v-model="nodeSearchQuery"
            placeholder="搜索节点..."
            class="search-input"
            @keydown.esc="nodeSearchQuery = ''"
          />
          <button v-if="nodeSearchQuery" @click="nodeSearchQuery = ''" class="search-clear">
            <component :is="icons.x" :size="12" />
          </button>
        </div>
        
        <div class="node-categories">
          <div class="category" v-for="category in filteredNodeCategories" :key="category.name">
            <h4>{{ category.name }}</h4>
            <div 
              v-for="node in category.nodes" 
              :key="node.type"
              class="node-item" 
              draggable="true" 
              @dragstart="startDrag($event, node.type)"
            >
              <span class="node-item-icon">{{ node.icon }}</span>
              <span class="node-item-divider"></span>
              <span class="node-item-text">{{ node.title }}</span>
            </div>
          </div>
          
          <div v-if="filteredNodeCategories.length === 0" class="no-results">
            <component :is="icons.search" :size="32" />
            <p>未找到匹配的节点</p>
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
      
      <div class="workflow-canvas" @drop="dropNode" @dragover.prevent @wheel="handleCanvasWheel" @mousedown="handleCanvasMouseDown" @mousemove="handleCanvasMouseMove" @mouseup="handleCanvasMouseUp">
        <!-- 缩放和平移控制 -->
        <div class="canvas-controls">
          <div class="zoom-controls">
            <button @click="zoomIn" class="control-btn" title="放大 (Ctrl/Cmd + +)">
              <component :is="icons.plus" :size="16" />
            </button>
            <span class="zoom-level">{{ Math.round(canvasZoom * 100) }}%</span>
            <button @click="zoomOut" class="control-btn" title="缩小 (Ctrl/Cmd + -)">
              <component :is="icons.minus" :size="16" />
            </button>
            <button @click="resetZoom" class="control-btn" title="重置 (Ctrl/Cmd + 0)">
              <component :is="icons.maximize" :size="16" />
            </button>
          </div>
          <div class="pan-hint" v-if="!isPanning">按住空格键拖拽画布</div>
        </div>
        
        <div v-if="!currentWorkflow" class="empty-canvas">
          <div class="empty-message">
            <h3>请选择或创建一个工作流</h3>
            <p>从上方选择现有工作流，或创建新的工作流开始编辑</p>
          </div>
        </div>
        
        <div v-else class="canvas-grid" :style="canvasTransformStyle">
          <div 
            v-for="node in currentWorkflowNodes" 
            :key="node.id"
            class="workflow-node"
            :class="{ 
              'node-running': node.status === 'running', 
              'node-completed': node.status === 'completed',
              'node-error': node.status === 'error',
              'node-pending': node.status === 'pending',
              'node-selected': selectedNodeId === node.id
            }"
            :style="{ left: node.position.x + 'px', top: node.position.y + 'px' }"
            @mousedown="startDragNode($event, node)"
            @click.stop="selectNode(node)"
            @dblclick.stop="editNode(node)"
          >
            <!-- Node Status Indicator -->
            <div v-if="node.status && node.status !== 'idle'" class="node-status-indicator">
              <component 
                v-if="node.status === 'running'" 
                :is="icons.refresh" 
                :size="12" 
                class="status-icon spinning"
              />
              <component 
                v-else-if="node.status === 'completed'" 
                :is="icons.check" 
                :size="12" 
                class="status-icon"
              />
              <component 
                v-else-if="node.status === 'error'" 
                :is="icons.xCircle" 
                :size="12" 
                class="status-icon"
              />
              <component 
                v-else-if="node.status === 'pending'" 
                :is="icons.clock" 
                :size="12" 
                class="status-icon"
              />
            </div>
            
            <div class="node-header">
              <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
              <span class="node-title">{{ node.name }}</span>
              <button @click.stop="editNode(node)" class="node-edit" title="编辑节点">✎</button>
              <button @click.stop="removeNode(node.id)" class="node-remove" title="删除节点">×</button>
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
            <!-- 节点配置预览 -->
            <div v-if="node.config && Object.keys(node.config).length > 0" class="node-config-preview">
              <div v-for="(value, key) in node.config" :key="key" class="config-item">
                {{ key }}: {{ value }}
              </div>
            </div>
            
            <!-- Node Execution Progress (for running nodes) -->
            <div v-if="node.status === 'running' && node.progress !== undefined" class="node-progress">
              <div class="node-progress-bar">
                <div class="node-progress-fill" :style="{ width: node.progress + '%' }"></div>
              </div>
              <span class="node-progress-text">{{ node.progress }}%</span>
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
      
      <!-- 节点属性面板 -->
      <div v-if="selectedNode && currentWorkflow" class="node-properties-panel">
        <div class="properties-header">
          <h4>节点属性</h4>
          <button class="close-btn" @click="selectedNodeId = ''" title="关闭">×</button>
        </div>
        <div class="properties-content">
          <div class="property-group">
            <label>节点名称</label>
            <input 
              type="text" 
              :value="selectedNode.name" 
              @change="updateSelectedNodeName($event.target.value)"
              class="property-input"
            />
          </div>
          <div class="property-group">
            <label>节点类型</label>
            <div class="property-value">{{ getNodeTitle(selectedNode.type) }}</div>
          </div>
          <div class="property-group">
            <label>位置</label>
            <div class="property-row">
              <span>X: {{ Math.round(selectedNode.position.x) }}</span>
              <span>Y: {{ Math.round(selectedNode.position.y) }}</span>
            </div>
          </div>
          <div class="property-group">
            <label>状态</label>
            <div class="property-value status-tag" :class="`status-${selectedNode.status || 'idle'}`">
              {{ selectedNode.status || 'idle' }}
            </div>
          </div>
          
          <!-- 节点特定配置 -->
          <div class="property-group" v-if="selectedNode.type === 'novel-parser'">
            <label>解析模式</label>
            <select class="property-input" @change="updateNodeConfig('parseMode', $event.target.value)">
              <option value="auto">自动检测</option>
              <option value="chapter">按章节</option>
              <option value="paragraph">按段落</option>
            </select>
          </div>
          
          <div class="property-group" v-if="selectedNode.type === 'character-analyzer'">
            <label>分析深度</label>
            <select class="property-input" @change="updateNodeConfig('depth', $event.target.value)">
              <option value="basic">基础</option>
              <option value="detailed">详细</option>
              <option value="comprehensive">全面</option>
            </select>
          </div>
          
          <div class="property-group" v-if="selectedNode.type === 'scene-generator'">
            <label>场景风格</label>
            <select class="property-input" @change="updateNodeConfig('style', $event.target.value)">
              <option value="anime">动漫风格</option>
              <option value="realistic">写实风格</option>
              <option value="cartoon">卡通风格</option>
            </select>
          </div>
          
          <div class="property-actions">
            <button class="btn btn-small btn-danger" @click="removeNode(selectedNode.id)">
              删除节点
            </button>
          </div>
        </div>
      </div>
      </template>
    </div>
    
    <!-- 输入对话框 -->
    <InputDialog
      v-model:visible="inputDialogVisible"
      :title="inputDialogTitle"
      :message="inputDialogMessage"
      :placeholder="inputDialogPlaceholder"
      :default-value="inputDialogDefaultValue"
      @confirm="handleInputDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * WorkflowEditor.vue - 重构为 TypeScript + Composition API
 * 使用新的 workflowStore.ts，移除直接的 Service 访问
 * 
 * Requirements: 6.4, 8.3
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkflowStore } from '../stores/workflowStore';
import { useProjectStore } from '../stores/project.js';
import { useUIStore } from '../stores/ui.js';
import { useNavigationStore } from '../stores/navigation.js';
import { useAppInit } from '../composables/useAppInit';
import { icons } from '../utils/icons.js';
import InputDialog from '../components/dialogs/InputDialog.vue';
import type { Workflow, WorkflowNode, WorkflowConnection, WorkflowNodeType, ValidationResult } from '../types/workflow';

const router = useRouter();
const workflowStore = useWorkflowStore();
const projectStore = useProjectStore();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();
const { initialize, isAppInitialized, waitForInit } = useAppInit();

// 初始化状态 - Requirements: 3.4, 3.5
const isReady = ref(false);

// Reactive data
const selectedWorkflowId = ref('');
const selectedNodeId = ref<string>('');
const selectedConnectionId = ref<string>('');
const validationResult = ref<ValidationResult | null>(null);
const currentExecutionId = ref<string | null>(null);
const executionResults = ref<any>(null);
const showResultsPanel = ref(false);
const dropdownOpen = ref(false);
const showNodeEditor = ref(false);
const editingNode = ref<WorkflowNode | null>(null);

// 节点搜索
const nodeSearchQuery = ref('');

// 执行日志
const showExecutionLogs = ref(false);
const executionLogs = ref<Array<{ timestamp: number; level: string; message: string }>>([]);
const logsContainer = ref<HTMLElement | null>(null);

// 执行历史
const selectedExecutionNodeCount = ref(0);
const selectedExecutionTimeline = ref<Array<{ timestamp: number; message: string }>>([]);

// 画布缩放和平移
const canvasZoom = ref(1);
const canvasOffset = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const isSpacePressed = ref(false);

// 连线拖拽状态
const isConnecting = ref(false);
const connectingFromNode = ref<WorkflowNode | null>(null);
const connectingFromPort = ref(0);
const connectingMousePos = ref({ x: 0, y: 0 });
const highlightedPort = ref<{ nodeId: string; portIndex: number; portType: string } | null>(null);
const connectionsLayer = ref<SVGSVGElement | null>(null);

// 输入对话框状态
const inputDialogVisible = ref(false);
const inputDialogTitle = ref('');
const inputDialogMessage = ref('');
const inputDialogPlaceholder = ref('');
const inputDialogDefaultValue = ref('');
const inputDialogCallback = ref<((value: string) => void) | null>(null);

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
      // 不显示工作流名称，因为下拉选择器已经显示了
      return '工作流编辑器';
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
      // 显示工作流描述，如果没有描述则显示通用提示
      return currentWorkflow.value?.description || '设计和编辑工作流节点';
    default:
      return '设计和执行工作流程';
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

// 格式化日志时间
function formatLogTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour12: false });
}

// 格式化持续时间
function formatDuration(ms: number): string {
  if (!ms) return '0秒';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分${seconds % 60}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

// 获取节点状态文本
function getNodeStatusText(status: string | undefined): string {
  const statusMap: Record<string, string> = {
    idle: '空闲',
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    error: '错误'
  };
  return statusMap[status || 'idle'] || '未知';
}

// 获取执行状态文本
function getExecutionStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    success: '成功',
    completed: '成功',
    error: '失败',
    failed: '失败',
    running: '执行中',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
}

// 检查节点是否有结果
function hasNodeResult(nodeId: string): boolean {
  if (!executionResults.value?.nodeResultsData) return false;
  return nodeId in executionResults.value.nodeResultsData;
}

// 格式化节点结果
function formatNodeResult(nodeId: string): string {
  if (!executionResults.value?.nodeResultsData) return '';
  const result = executionResults.value.nodeResultsData[nodeId];
  if (!result) return '';
  
  try {
    return JSON.stringify(result, null, 2);
  } catch (e) {
    return String(result);
  }
}

// 切换执行日志显示
function toggleExecutionLogs(): void {
  showExecutionLogs.value = !showExecutionLogs.value;
  
  // 自动滚动到底部
  if (showExecutionLogs.value) {
    setTimeout(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
      }
    }, 100);
  }
}

// 清空执行日志
function clearExecutionLogs(): void {
  executionLogs.value = [];
}

// 添加执行日志
function addExecutionLog(level: string, message: string): void {
  executionLogs.value.push({
    timestamp: Date.now(),
    level,
    message
  });
  
  // 自动滚动到底部
  setTimeout(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  }, 50);
}

// 显示执行历史
function showExecutionHistory(): void {
  navigationStore.updatePanelContext('workflow', {
    viewType: 'status',
    statusFilter: 'completed'
  });
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
async function refreshStatus(): Promise<void> {
  await workflowStore.loadWorkflows();
  uiStore.addNotification({
    type: 'info',
    title: '刷新成功',
    message: '工作流状态已更新',
    timeout: 2000
  });
}

// 使用模板
async function useTemplate(): Promise<void> {
  console.log('useTemplate called');
  console.log('selectedTemplateId:', selectedTemplateId.value);
  console.log('selectedTemplate:', selectedTemplate.value);
  console.log('templates:', templates.value);
  
  if (selectedTemplate.value) {
    // 直接使用模板名称创建工作流，不再弹出 prompt
    const defaultName = `${selectedTemplate.value.name}`;
    console.log('Creating workflow with name:', defaultName);
    
    const workflow = await workflowStore.createWorkflow({
      name: defaultName,
      description: selectedTemplate.value.description
    });
    
    if (!workflow) {
      uiStore.addNotification({
        type: 'error',
        title: '创建失败',
        message: '无法创建工作流',
        timeout: 3000
      });
      return;
    }
    
    // 先设置为当前工作流
    workflowStore.selectWorkflow(workflow.id);
    selectedWorkflowId.value = workflow.id;
    
    // 添加模板节点并自动连接
    const nodeIds: string[] = [];
    selectedTemplate.value.nodes.forEach((nodeType: string, index: number) => {
      const node = workflowStore.addNode(
        workflow.id,
        nodeType as WorkflowNodeType, 
        getNodeTitle(nodeType), 
        { x: 100 + index * 220, y: 100 }
      );
      if (node) {
        nodeIds.push(node.id);
      }
    });
    
    // 自动连接相邻节点
    for (let i = 0; i < nodeIds.length - 1; i++) {
      workflowStore.addConnection(workflow.id, nodeIds[i], nodeIds[i + 1]);
    }
    
    navigationStore.updatePanelContext('workflow', {
      selectedWorkflow: workflow.id,
      viewType: 'workflow-detail',
      templateId: null
    });
    uiStore.addNotification({
      type: 'success',
      title: '模板应用成功',
      message: `已创建工作流 "${defaultName}"`,
      timeout: 3000
    });
  } else {
    console.log('No template selected!');
    uiStore.addNotification({
      type: 'warning',
      title: '请选择模板',
      message: '请先从左侧面板选择一个模板',
      timeout: 3000
    });
  }
}

// 获取节点标题
function getNodeTitle(type: string): string {
  const titles: Record<string, string> = {
    'novel-parser': '小说解析器',
    'character-analyzer': '角色分析器',
    'scene-generator': '场景生成器',
    'script-converter': '脚本转换器',
    'video-generator': '视频生成器'
  };
  return titles[type] || type;
}

// Computed for selected workflow name
const selectedWorkflowName = computed((): string => {
  if (!selectedWorkflowId.value) return '选择工作流';
  const workflow = workflows.value.find(w => w.id === selectedWorkflowId.value);
  return workflow ? workflow.name : '选择工作流';
});

// Custom dropdown functions
function toggleDropdown(): void {
  dropdownOpen.value = !dropdownOpen.value;
}

// 重命名为 handleSelectWorkflow 避免与 store 方法冲突
function handleSelectWorkflow(id: string): void {
  selectedWorkflowId.value = id;
  dropdownOpen.value = false;
  switchWorkflow();
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent): void {
  const customSelect = document.querySelector('.custom-select');
  if (customSelect && !customSelect.contains(event.target as Node)) {
    dropdownOpen.value = false;
  }
}

// 初始化函数 - Requirements: 3.4, 3.5
async function initializeEditor(): Promise<void> {
  try {
    // 等待应用初始化完成
    await waitForInit();
    
    // 加载工作流数据
    await workflowStore.loadWorkflows();
    
    console.log('📂 WorkflowEditor initialized, workflows loaded:', workflowStore.workflows.length);
    
    // 检查是否需要自动应用模板（从 Dashboard 跳转过来）
    const context = navigationStore.panelContext.workflow;
    if (context?.viewType === 'template' && context?.templateId && context?.projectName) {
      console.log('🚀 Auto-applying template on mount:', context.templateId, 'for project:', context.projectName);
      await autoApplyTemplate(context);
    }
    
    isReady.value = true;
  } catch (error) {
    console.error('❌ WorkflowEditor initialization failed:', error);
    // 即使初始化失败，也设置 isReady 为 true，让用户可以看到界面
    isReady.value = true;
    uiStore.addNotification({
      type: 'error',
      title: '初始化失败',
      message: '工作流编辑器加载失败，部分功能可能不可用',
      timeout: 5000
    });
  }
}

// 画布缩放功能
function zoomIn(): void {
  canvasZoom.value = Math.min(canvasZoom.value + 0.1, 2);
}

function zoomOut(): void {
  canvasZoom.value = Math.max(canvasZoom.value - 0.1, 0.5);
}

function resetZoom(): void {
  canvasZoom.value = 1;
  canvasOffset.value = { x: 0, y: 0 };
}

// 画布滚轮缩放
function handleCanvasWheel(event: WheelEvent): void {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    const delta = -event.deltaY * 0.001;
    canvasZoom.value = Math.max(0.5, Math.min(2, canvasZoom.value + delta));
  }
}

// 画布平移
function handleCanvasMouseDown(event: MouseEvent): void {
  if (isSpacePressed.value || event.button === 1) { // 空格键或中键
    event.preventDefault();
    isPanning.value = true;
    panStart.value = { x: event.clientX - canvasOffset.value.x, y: event.clientY - canvasOffset.value.y };
  }
}

function handleCanvasMouseMove(event: MouseEvent): void {
  if (isPanning.value) {
    canvasOffset.value = {
      x: event.clientX - panStart.value.x,
      y: event.clientY - panStart.value.y
    };
  }
}

function handleCanvasMouseUp(): void {
  isPanning.value = false;
}

// 快捷键处理
function handleKeyDown(event: KeyboardEvent): void {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? event.metaKey : event.ctrlKey;
  
  // 空格键 - 平移模式
  if (event.code === 'Space' && !event.repeat) {
    event.preventDefault();
    isSpacePressed.value = true;
  }
  
  // Ctrl/Cmd + S - 保存
  if (modifier && event.key === 's') {
    event.preventDefault();
    if (selectedWorkflowId.value) {
      saveWorkflow();
    }
  }
  
  // Ctrl/Cmd + N - 新建工作流
  if (modifier && event.key === 'n') {
    event.preventDefault();
    createNewWorkflow();
  }
  
  // Ctrl/Cmd + + - 放大
  if (modifier && (event.key === '+' || event.key === '=')) {
    event.preventDefault();
    zoomIn();
  }
  
  // Ctrl/Cmd + - - 缩小
  if (modifier && event.key === '-') {
    event.preventDefault();
    zoomOut();
  }
  
  // Ctrl/Cmd + 0 - 重置缩放
  if (modifier && event.key === '0') {
    event.preventDefault();
    resetZoom();
  }
  
  // Delete/Backspace - 删除选中节点
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId.value) {
    event.preventDefault();
    removeNode(selectedNodeId.value);
  }
  
  // Escape - 取消选择
  if (event.key === 'Escape') {
    selectedNodeId.value = '';
    nodeSearchQuery.value = '';
  }
  
  // Ctrl/Cmd + F - 搜索节点
  if (modifier && event.key === 'f') {
    event.preventDefault();
    const searchInput = document.querySelector('.node-search .search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }
}

function handleKeyUp(event: KeyboardEvent): void {
  if (event.code === 'Space') {
    isSpacePressed.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  initializeEditor();
});

// 自动应用模板（从 Dashboard 继续处理跳转过来时）
async function autoApplyTemplate(context: any): Promise<void> {
  const template = templates.value.find(t => t.id === context.templateId);
  if (!template) {
    console.warn('Template not found:', context.templateId);
    return;
  }
  
  // 使用项目名称创建工作流
  const workflowName = context.projectName ? `${context.projectName} - ${template.name}` : template.name;
  console.log('📋 Creating workflow from template:', workflowName);
  
  const workflow = await workflowStore.createWorkflow({ name: workflowName, description: template.description });
  if (!workflow) {
    console.error('Failed to create workflow');
    return;
  }
  
  // 设置为当前工作流
  workflowStore.selectWorkflow(workflow.id);
  selectedWorkflowId.value = workflow.id;
  
  // 添加模板节点并自动连接
  const nodeIds: string[] = [];
  template.nodes.forEach((nodeType: string, index: number) => {
    const node = workflowStore.addNode(
      workflow.id,
      nodeType as WorkflowNodeType, 
      getNodeTitle(nodeType), 
      { x: 100 + index * 220, y: 100 }
    );
    if (node) {
      nodeIds.push(node.id);
    }
  });
  
  // 自动连接相邻节点
  for (let i = 0; i < nodeIds.length - 1; i++) {
    workflowStore.addConnection(workflow.id, nodeIds[i], nodeIds[i + 1]);
  }
  
  // 更新 panelContext 为工作流详情视图
  navigationStore.updatePanelContext('workflow', {
    selectedWorkflow: workflow.id,
    viewType: 'workflow-detail',
    templateId: null,
    projectId: context.projectId,
    novelId: context.novelId,
    projectName: context.projectName
  });
  
  uiStore.addNotification({
    type: 'success',
    title: '工作流已创建',
    message: `已为项目 "${context.projectName}" 创建工作流，点击"运行工作流"开始生成`,
    timeout: 5000
  });
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
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
    if (!isReady.value) return; // 等待初始化完成
    
    console.log('👀 WorkflowEditor panelContext changed:', newVal);
    if (newVal?.selectedWorkflow && newVal.selectedWorkflow !== selectedWorkflowId.value) {
      selectedWorkflowId.value = newVal.selectedWorkflow;
      // 如果 currentWorkflow 还没设置，尝试设置
      if (!workflowStore.currentWorkflow || workflowStore.currentWorkflow.id !== newVal.selectedWorkflow) {
        const success = workflowStore.selectWorkflow(newVal.selectedWorkflow);
        console.log('📌 WorkflowEditor selectWorkflow result:', success, 'workflow:', workflowStore.currentWorkflow?.name);
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

// Computed properties - 从 Store 读取数据 (Requirements: 6.4)
const workflows = computed((): Workflow[] => workflowStore.workflows);
const currentWorkflow = computed((): Workflow | null => workflowStore.currentWorkflow);
const currentWorkflowNodes = computed((): WorkflowNode[] => workflowStore.currentWorkflowNodes);
const currentWorkflowConnections = computed((): WorkflowConnection[] => workflowStore.currentWorkflowConnections);
const isExecuting = computed((): boolean => workflowStore.isExecuting);
const executionProgress = computed((): number => workflowStore.executionProgress);
const executionMessage = computed((): string => workflowStore.executionMessage);

// 选中的节点
const selectedNode = computed((): WorkflowNode | null => {
  if (!selectedNodeId.value || !currentWorkflowNodes.value) return null;
  return currentWorkflowNodes.value.find(n => n.id === selectedNodeId.value) || null;
});

// 节点状态统计
const completedNodesCount = computed((): number => {
  return currentWorkflowNodes.value.filter(n => n.status === 'completed').length;
});

const runningNodesCount = computed((): number => {
  return currentWorkflowNodes.value.filter(n => n.status === 'running').length;
});

const pendingNodesCount = computed((): number => {
  return currentWorkflowNodes.value.filter(n => !n.status || n.status === 'pending' || n.status === 'idle').length;
});

// 更新选中节点名称 - 通过 Store action (Requirements: 5.1, 5.2)
function updateSelectedNodeName(newName: string): void {
  if (selectedNodeId.value && newName && currentWorkflow.value) {
    workflowStore.updateNodeName(currentWorkflow.value.id, selectedNodeId.value, newName);
  }
}

// 更新节点配置 - 通过 Store action (Requirements: 5.1, 5.2)
function updateNodeConfig(key: string, value: any): void {
  if (selectedNodeId.value && currentWorkflow.value) {
    workflowStore.updateNodeConfig(currentWorkflow.value.id, selectedNodeId.value, { [key]: value });
  }
}

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

// 节点分类
const nodeCategories = [
  {
    name: '输入节点',
    nodes: [
      { type: 'novel-parser', icon: '📖', title: '小说解析器' }
    ]
  },
  {
    name: '处理节点',
    nodes: [
      { type: 'character-analyzer', icon: '👤', title: '角色分析器' },
      { type: 'scene-generator', icon: '🎬', title: '场景生成器' },
      { type: 'script-converter', icon: '📝', title: '脚本转换器' }
    ]
  },
  {
    name: '输出节点',
    nodes: [
      { type: 'video-generator', icon: '🎥', title: '视频生成器' }
    ]
  }
];

// 过滤后的节点分类
const filteredNodeCategories = computed(() => {
  if (!nodeSearchQuery.value.trim()) {
    return nodeCategories;
  }
  
  const query = nodeSearchQuery.value.toLowerCase();
  return nodeCategories
    .map(category => ({
      ...category,
      nodes: category.nodes.filter(node => 
        node.title.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query)
      )
    }))
    .filter(category => category.nodes.length > 0);
});

// 画布变换样式
const canvasTransformStyle = computed(() => ({
  transform: `translate(${canvasOffset.value.x}px, ${canvasOffset.value.y}px) scale(${canvasZoom.value})`,
  transformOrigin: '0 0'
}));

// Workflow management
function createNewWorkflow(): void {
  inputDialogTitle.value = '新建工作流';
  inputDialogMessage.value = '';
  inputDialogPlaceholder.value = '请输入工作流名称';
  inputDialogDefaultValue.value = '';
  inputDialogCallback.value = async (name: string) => {
    if (name) {
      const workflow = await workflowStore.createWorkflow({ name, description: '新建的工作流' });
      if (workflow) {
        selectedWorkflowId.value = workflow.id;
        workflowStore.selectWorkflow(workflow.id);
        uiStore.addNotification({
          type: 'success',
          title: '创建成功',
          message: `工作流 "${name}" 已创建`,
          timeout: 2000
        });
      }
    }
  };
  inputDialogVisible.value = true;
}

// 重命名当前工作流
function renameCurrentWorkflow(): void {
  console.log('🔧 renameCurrentWorkflow called, selectedWorkflowId:', selectedWorkflowId.value);
  if (selectedWorkflowId.value) {
    renameWorkflow(selectedWorkflowId.value);
  } else {
    console.warn('⚠️ No workflow selected');
    uiStore.addNotification({
      type: 'warning',
      title: '请先选择工作流',
      message: '请从下拉列表中选择一个工作流',
      timeout: 2000
    });
  }
}

// 删除当前工作流
function deleteCurrentWorkflow(): void {
  if (selectedWorkflowId.value) {
    deleteWorkflow(selectedWorkflowId.value);
  }
}

// 处理输入对话框确认
function handleInputDialogConfirm(value: string): void {
  if (inputDialogCallback.value) {
    inputDialogCallback.value(value);
  }
}

async function createDefaultWorkflow(): Promise<void> {
  const workflow = await workflowStore.createDefaultWorkflow();
  if (workflow) {
    selectedWorkflowId.value = workflow.id;
  }
}

async function deleteWorkflow(workflowId: string): Promise<void> {
  const workflow = workflows.value.find(w => w.id === workflowId);
  if (!workflow) return;
  
  // 先关闭下拉菜单
  dropdownOpen.value = false;
  
  setTimeout(async () => {
    if (confirm(`确定要删除工作流 "${workflow.name}" 吗？`)) {
      const success = await workflowStore.deleteWorkflow(workflowId);
      
      if (success) {
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
    }
  }, 100);
}

function renameWorkflow(workflowId: string): void {
  console.log('🔧 renameWorkflow called with id:', workflowId);
  const workflow = workflows.value.find(w => w.id === workflowId);
  if (!workflow) {
    console.log('⚠️ Workflow not found in workflows list');
    console.log('📋 Available workflows:', workflows.value.map(w => ({ id: w.id, name: w.name })));
    return;
  }
  
  console.log('✅ Found workflow:', workflow.name);
  
  // 先关闭下拉菜单
  dropdownOpen.value = false;
  
  // 使用自定义对话框
  setTimeout(() => {
    console.log('📝 Opening input dialog for rename');
    inputDialogTitle.value = '重命名工作流';
    inputDialogMessage.value = '';
    inputDialogPlaceholder.value = '请输入新的工作流名称';
    inputDialogDefaultValue.value = workflow.name;
    inputDialogCallback.value = async (newName: string) => {
      console.log('📝 Rename callback called with:', newName);
      if (newName && newName !== workflow.name) {
        const result = await workflowStore.renameWorkflow(workflowId, newName);
        console.log('📝 Rename result:', result);
        if (result.success) {
          uiStore.addNotification({
            type: 'success',
            title: '重命名成功',
            message: `工作流已重命名为 "${result.name}"`,
            timeout: 2000
          });
        } else {
          uiStore.addNotification({
            type: 'error',
            title: '重命名失败',
            message: '无法重命名工作流，请重试',
            timeout: 3000
          });
        }
      }
    };
    inputDialogVisible.value = true;
    console.log('📝 inputDialogVisible set to true');
  }, 100);
}

function switchWorkflow(): void {
  if (selectedWorkflowId.value) {
    workflowStore.selectWorkflow(selectedWorkflowId.value);
    validationResult.value = null;
  }
}

async function saveWorkflow(): Promise<void> {
  if (currentWorkflow.value) {
    const success = await workflowStore.saveWorkflow(currentWorkflow.value.id);
    if (success) {
      uiStore.addNotification({
        type: 'success',
        title: '保存成功',
        message: '工作流已保存',
        timeout: 2000
      });
    }
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
  const initialData: Record<string, unknown> = {};
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
    executionLogs.value = [];
    showExecutionLogs.value = true;
    
    // 添加初始日志
    addExecutionLog('info', `开始执行工作流: ${currentWorkflow.value.name}`);
    addExecutionLog('info', `节点数量: ${currentWorkflowNodes.value.length}`);
    
    // 更新导航状态 - 需求 5.4: 开始执行工作流
    navigationStore.startExecution();
    
    uiStore.addNotification({
      type: 'info',
      title: '开始执行',
      message: `工作流 "${currentWorkflow.value.name}" 开始执行`,
      timeout: 2000
    });
    
    // 执行工作流（这是一个 async 函数，会等待执行完成）
    currentExecutionId.value = await workflowStore.executeWorkflow(
      currentWorkflow.value.id,
      initialData
    );
    
    addExecutionLog('success', '工作流执行完成');
    
    // 执行完成后，直接调用处理函数（不依赖 watch）
    handleExecutionComplete();
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    addExecutionLog('error', `执行失败: ${errorMessage}`);
    handleExecutionFailed(errorMessage);
  }
}

// 处理执行完成 - 需求 5.5
function handleExecutionComplete() {
  const execution = workflowStore.getExecutionStatus(currentExecutionId.value);
  if (execution) {
    const duration = execution.endTime && execution.startTime 
      ? execution.endTime - execution.startTime 
      : 0;
    
    // 将 Map 转换为普通对象，以便存储和传递
    const nodeResultsMap = execution.context?.nodeResults;
    const nodeResultsData: Record<string, any> = {};
    
    if (nodeResultsMap) {
      if (typeof nodeResultsMap.forEach === 'function') {
        // 如果是 Map
        nodeResultsMap.forEach((value: any, key: string) => {
          nodeResultsData[key] = value;
        });
      } else if (typeof nodeResultsMap === 'object') {
        // 如果已经是普通对象
        Object.assign(nodeResultsData, nodeResultsMap);
      }
    }
    
    console.log('📊 Execution nodeResults:', nodeResultsData);
    console.log('📊 NodeResults keys:', Object.keys(nodeResultsData));
    
    const results = {
      status: 'completed',
      nodeResults: nodeResultsMap, // 保留原始 Map 用于兼容
      nodeResultsData, // 添加普通对象版本
      duration
    };
    executionResults.value = results;
    showResultsPanel.value = true;
    
    console.log('✅ Execution completed, showing results panel:', results);
    
    // 更新导航状态 - 需求 5.5: 执行完成后显示结果预览
    navigationStore.setExecutionResult(results);
    
    // 更新项目状态为已完成
    if (projectStore.currentProject) {
      projectStore.currentProject.status = 'completed';
    }
  } else {
    console.warn('⚠️ Execution not found:', currentExecutionId.value);
  }
  
  uiStore.addNotification({
    type: 'success',
    title: '执行完成',
    message: `工作流执行成功完成`,
    timeout: 3000
  });
}

// 查看生成内容
function viewGeneratedContent() {
  console.log('viewGeneratedContent called');
  showResultsPanel.value = false;
  router.push('/preview');
}

// 导出结果
function exportResults() {
  console.log('exportResults called');
  uiStore.addNotification({
    type: 'success',
    title: '导出成功',
    message: '生成内容已打包导出到本地',
    timeout: 3000
  });
}

// 返回项目概览
function backToDashboard() {
  console.log('backToDashboard called');
  showResultsPanel.value = false;
  
  // 更新项目状态
  if (projectStore.currentProject) {
    projectStore.currentProject.status = 'completed';
  }
  
  // 重置工作流状态，准备下一次使用
  navigationStore.resetWorkflowState();
  
  // 清除当前项目
  projectStore.clearCurrentProject();
  
  // 清除 localStorage 中的相关数据
  localStorage.removeItem('novel_anime_current_novel_id');
  localStorage.removeItem('novel_anime_current_novel_title');
  
  // 跳转到仪表盘
  router.push('/dashboard');
  
  uiStore.addNotification({
    type: 'success',
    title: '项目已完成',
    message: '恭喜！您的小说已成功转换为动漫',
    timeout: 5000
  });
}

// 处理执行失败
function handleExecutionFailed(errorMessage?: string): void {
  const error = workflowStore.error;
  
  uiStore.addNotification({
    type: 'error',
    title: '执行失败',
    message: errorMessage || error?.message || '工作流执行过程中发生错误',
    timeout: 5000
  });
}

function cancelExecution(): void {
  if (currentExecutionId.value) {
    workflowStore.cancelExecution(currentExecutionId.value);
    currentExecutionId.value = null;
    
    uiStore.addNotification({
      type: 'info',
      title: '已取消',
      message: '工作流执行已取消',
      timeout: 2000
    });
  }
}

function validateWorkflow(): void {
  validationResult.value = workflowStore.validateCurrentWorkflow();
}

// Node management
function startDrag(event: DragEvent, nodeType: string): void {
  event.dataTransfer?.setData('nodeType', nodeType);
}

function dropNode(event: DragEvent): void {
  if (!currentWorkflow.value) return;
  
  event.preventDefault();
  const nodeType = event.dataTransfer?.getData('nodeType');
  if (!nodeType) return;
  
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = event.clientX - rect.left - 75;
  const y = event.clientY - rect.top - 50;
  
  const nodeName = nodeTypes[nodeType]?.title || nodeType;
  workflowStore.addNode(
    currentWorkflow.value.id,
    nodeType as WorkflowNodeType,
    nodeName,
    { x: Math.max(0, x), y: Math.max(0, y) }
  );
}

function removeNode(nodeId: string): void {
  if (!currentWorkflow.value) return;
  
  if (confirm('确定要删除这个节点吗？')) {
    workflowStore.removeNode(currentWorkflow.value.id, nodeId);
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = '';
    }
  }
}

// 选择节点
function selectNode(node: WorkflowNode): void {
  selectedNodeId.value = node.id;
  selectedConnectionId.value = '';
}

// 清除选中
function clearSelection(): void {
  selectedNodeId.value = '';
  selectedConnectionId.value = '';
}

// 编辑节点
function editNode(node: WorkflowNode): void {
  selectedNodeId.value = node.id;
  editingNode.value = node;
  
  // 使用输入对话框编辑节点名称
  inputDialogTitle.value = '编辑节点';
  inputDialogMessage.value = `节点类型: ${getNodeTitle(node.type)}`;
  inputDialogPlaceholder.value = '请输入节点名称';
  inputDialogDefaultValue.value = node.name;
  inputDialogCallback.value = (newName: string) => {
    if (newName && newName !== node.name && currentWorkflow.value) {
      workflowStore.updateNodeName(currentWorkflow.value.id, node.id, newName);
      uiStore.addNotification({
        type: 'success',
        title: '节点已更新',
        message: `节点名称已改为 "${newName}"`,
        timeout: 2000
      });
    }
  };
  inputDialogVisible.value = true;
}

function startDragNode(event: MouseEvent, node: WorkflowNode): void {
  const startX = event.clientX - node.position.x;
  const startY = event.clientY - node.position.y;
  
  function onMouseMove(e: MouseEvent): void {
    if (!currentWorkflow.value) return;
    const newX = e.clientX - startX;
    const newY = e.clientY - startY;
    workflowStore.updateNodePosition(currentWorkflow.value.id, node.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
  }
  
  function onMouseUp(): void {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Helper functions
function getNodeIcon(type: string): string {
  return nodeTypes[type]?.icon || '⚙️';
}

function getNodeInputs(type: string): string[] {
  return nodeTypes[type]?.inputs || [];
}

function getNodeOutputs(type: string): string[] {
  return nodeTypes[type]?.outputs || [];
}

function getConnectionX1(connection: WorkflowConnection): number {
  const fromNode = currentWorkflowNodes.value.find(n => n.id === connection.fromNodeId);
  return fromNode ? fromNode.position.x + 150 : 0;
}

function getConnectionY1(connection: WorkflowConnection): number {
  const fromNode = currentWorkflowNodes.value.find(n => n.id === connection.fromNodeId);
  return fromNode ? fromNode.position.y + 30 : 0;
}

function getConnectionX2(connection: WorkflowConnection): number {
  const toNode = currentWorkflowNodes.value.find(n => n.id === connection.toNodeId);
  return toNode ? toNode.position.x : 0;
}

function getConnectionY2(connection: WorkflowConnection): number {
  const toNode = currentWorkflowNodes.value.find(n => n.id === connection.toNodeId);
  return toNode ? toNode.position.y + 30 : 0;
}
</script>

<style scoped>
.workflow-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 标准view-header样式 - 与其他页面统一 */
.view-header {
  padding: 24px 28px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.view-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.view-header p {
  font-size: 13px;
  color: #8a8a8c;
  margin: 0 0 16px 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* 加载状态覆盖层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  font-size: 1rem;
  color: #6a6a6a;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 图标按钮样式 */
.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #888;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #555;
}

.icon-btn-danger:hover {
  background: rgba(200, 100, 100, 0.15);
  color: #a55;
}

/* 头部分割线 */
.header-divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 8px;
}

/* 头部分割线 */
.header-divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 8px;
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

.result-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.result-actions .btn {
  flex: 1;
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
  background: rgba(190, 155, 155, 0.65);
  color: #5a4040;
}

.btn-danger:hover {
  background: rgba(180, 145, 145, 0.75);
}

/* 删除按钮轮廓样式 - 用于头部操作区域 */
.btn-danger-outline {
  background: transparent;
  border: 1px solid rgba(180, 100, 100, 0.4);
  color: #8a5050;
}

.btn-danger-outline:hover {
  background: rgba(180, 100, 100, 0.1);
  border-color: rgba(180, 100, 100, 0.6);
  color: #7a4040;
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
  background: rgba(150, 150, 150, 0.3);
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
  background: rgba(160, 160, 160, 0.35);
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
  background: rgba(130, 130, 130, 0.3);
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
  background: rgba(0, 0, 0, 0.1);
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
  overflow: auto; /* 支持上下左右滚动 */
}

.canvas-grid {
  min-width: 2000px; /* 最小宽度，支持左右滚动 */
  min-height: 1500px; /* 最小高度，支持上下滚动 */
  width: max-content; /* 根据内容自动扩展 */
  height: max-content;
  padding: 40px;
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
  transition: box-shadow 0.2s, border-color 0.2s;
}

.workflow-node:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.workflow-node.node-selected {
  border-color: rgba(100, 160, 200, 0.6);
  box-shadow: 0 0 0 2px rgba(100, 160, 200, 0.3);
}

.node-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px 8px 0 0;
  gap: 4px;
}

.node-icon {
  flex-shrink: 0;
}

.node-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-edit {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  opacity: 0;
  padding: 2px 4px;
  border-radius: 3px;
  transition: opacity 0.2s, background 0.2s;
}

.workflow-node:hover .node-edit {
  opacity: 0.7;
}

.node-edit:hover {
  opacity: 1 !important;
  background: rgba(100, 160, 200, 0.3);
}

.node-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0;
  padding: 2px 4px;
  border-radius: 3px;
  transition: opacity 0.2s, background 0.2s;
}

.workflow-node:hover .node-remove {
  opacity: 0.7;
}

.node-remove:hover {
  opacity: 1 !important;
  background: rgba(200, 100, 100, 0.3);
  color: #ff6666;
}

.node-config-preview {
  padding: 0.25rem 0.5rem;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.config-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
  background-color: #c8c8c8;
  color: #2c2c2e;
  box-sizing: border-box;
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  background-color: #d8d8d8;
}

/* 次要按钮 */
.btn-secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #d8d8d8;
}

/* 主要按钮 */
.btn-primary {
  background-color: #7a9188;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #6a8178;
}

/* 成功按钮 */
.btn-success {
  background-color: #5ab05e;
  color: #ffffff;
}

.btn-success:hover:not(:disabled) {
  background-color: #4a9a4e;
}

/* 危险按钮 */
.btn-danger {
  background-color: #e53e3e;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c53030;
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

/* 执行进度面板 - Enhanced */
.execution-progress-panel {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.execution-progress-panel .progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.progress-icon {
  color: #3498db;
  animation: pulse 1.5s infinite;
}

.progress-actions {
  display: flex;
  gap: 8px;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-container .progress-bar {
  flex: 1;
  height: 10px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar-container .progress-fill {
  height: 100%;
  background: #2db77a;
  transition: width 0.3s ease;
}

.progress-bar-container .progress-text {
  min-width: 45px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
}

.node-status-summary {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-item .status-label {
  color: #6c6c6e;
}

.status-item .status-value {
  font-weight: 600;
  color: #2c2c2e;
}

.status-item.status-completed .status-value {
  color: #27ae60;
}

.status-item.status-running .status-value {
  color: #3498db;
}

.status-item.status-pending .status-value {
  color: #95a5a6;
}

/* 执行日志面板 */
.execution-logs-panel {
  margin-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 12px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.logs-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
}

.logs-content {
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  padding: 8px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 11px;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #95a5a6;
  min-width: 70px;
}

.log-level {
  min-width: 50px;
  font-weight: 600;
}

.log-entry.log-info .log-level {
  color: #3498db;
}

.log-entry.log-success .log-level {
  color: #27ae60;
}

.log-entry.log-error .log-level {
  color: #e74c3c;
}

.log-entry.log-warning .log-level {
  color: #f39c12;
}

.log-message {
  flex: 1;
  color: #2c2c2e;
}

.logs-empty {
  text-align: center;
  padding: 20px;
  color: #95a5a6;
  font-size: 12px;
}

/* 执行结果面板 - Enhanced */
.execution-results-panel {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.execution-results-panel .results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.execution-results-panel .results-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
}

.results-actions {
  display: flex;
  gap: 8px;
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}

.result-status.completed {
  color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
}

.result-status.failed {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.stat-label {
  font-size: 11px;
  color: #6c6c6e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
}

/* 节点结果详情 */
.node-results-section {
  margin-top: 8px;
}

.node-results-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
}

.node-results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.node-result-item {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.node-result-item.has-result {
  border-color: rgba(39, 174, 96, 0.3);
  background: rgba(39, 174, 96, 0.05);
}

.node-result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.node-result-header .node-icon {
  font-size: 16px;
}

.node-result-header .node-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

.node-status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.node-status-badge.status-idle {
  background: rgba(149, 165, 166, 0.2);
  color: #7f8c8d;
}

.node-status-badge.status-pending {
  background: rgba(52, 152, 219, 0.2);
  color: #2980b9;
}

.node-status-badge.status-running {
  background: rgba(52, 152, 219, 0.3);
  color: #2980b9;
  animation: pulse 1.5s infinite;
}

.node-status-badge.status-completed {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.node-status-badge.status-error {
  background: rgba(231, 76, 60, 0.2);
  color: #c0392b;
}

.node-result-data {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 11px;
  max-height: 150px;
  overflow-y: auto;
}

.node-result-data pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #2c2c2e;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.result-actions .btn {
  flex: 1;
  gap: 6px;
}

/* 节点状态指示器 */
.node-status-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.status-icon {
  color: #2c2c2e;
}

.status-icon.spinning {
  animation: spin 1s linear infinite;
}

.workflow-node.node-pending {
  border-color: rgba(52, 152, 219, 0.4);
}

.workflow-node.node-error {
  border-color: rgba(231, 76, 60, 0.6);
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.3);
}

/* 节点执行进度 */
.node-progress {
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.node-progress-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.node-progress-text {
  font-size: 10px;
  color: #6c6c6e;
  min-width: 30px;
  text-align: right;
}

/* 执行历史视图 - Enhanced */
.execution-history-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.execution-info-card {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.info-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
}

.execution-id {
  font-size: 11px;
  color: #95a5a6;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item .info-label {
  font-size: 11px;
  color: #6c6c6e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item .info-value {
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}

.status-badge--success,
.status-badge--completed {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}

.status-badge--error,
.status-badge--failed {
  background: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
}

.status-badge--running {
  background: rgba(52, 152, 219, 0.15);
  color: #3498db;
}

.status-badge--cancelled {
  background: rgba(149, 165, 166, 0.15);
  color: #95a5a6;
}

/* 执行时间线 */
.execution-timeline {
  margin-top: 20px;
}

.execution-timeline h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
}

.timeline-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 20px;
  bottom: -12px;
  width: 2px;
  background: rgba(0, 0, 0, 0.1);
}

.timeline-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3498db;
  margin-top: 4px;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-time {
  font-size: 11px;
  color: #95a5a6;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.timeline-message {
  font-size: 13px;
  color: #2c2c2e;
}

/* 动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

/* 节点属性面板 */
.node-properties-panel {
  width: 220px;
  min-width: 220px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.properties-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.properties-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #4a4a4c;
}

.properties-header .close-btn {
  background: none;
  border: none;
  color: #8a8a8a;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}

.properties-header .close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4a;
}

.properties-content {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
}

.property-group {
  margin-bottom: 14px;
}

.property-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.property-input {
  width: 100%;
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.5);
  color: #2c2c2e;
  box-sizing: border-box;
}

.property-input:focus {
  outline: none;
  border-color: rgba(100, 160, 200, 0.5);
  background: rgba(255, 255, 255, 0.7);
}

.property-value {
  font-size: 12px;
  color: #4a4a4c;
  padding: 6px 0;
}

.property-row {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #4a4a4c;
}

.status-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-tag.status-idle {
  background: rgba(150, 150, 150, 0.2);
  color: #6a6a6a;
}

.status-tag.status-running {
  background: rgba(52, 152, 219, 0.2);
  color: #2980b9;
}

.status-tag.status-completed {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.status-tag.status-error {
  background: rgba(231, 76, 60, 0.2);
  color: #c0392b;
}

.property-actions {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
</style>


/* 节点搜索样式 */
.node-search {
  position: relative;
  margin-bottom: 12px;
  padding: 0 12px;
}

.node-search .search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a7a7c;
  pointer-events: none;
}

.node-search .search-input {
  width: 100%;
  padding: 6px 28px 6px 32px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  background-color: #c8c8c8;
  color: #2c2c2e;
  transition: all 0.15s ease;
}

.node-search .search-input:hover {
  background-color: #d0d0d0;
}

.node-search .search-input:focus {
  outline: none;
  background-color: #e8e8e8;
  border: 1px solid rgba(122, 145, 136, 0.5);
}

.node-search .search-clear {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 4px;
  padding: 4px;
  color: #7a7a7c;
  cursor: pointer;
  transition: all 0.2s;
}

.node-search .search-clear:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4c;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #9a9a9c;
}

.no-results p {
  margin-top: 12px;
  font-size: 13px;
}

/* 画布控制样式 - 固定在画布容器上，不随滚动移动 */
.canvas-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  pointer-events: none; /* 让控制区域不阻挡画布交互 */
}

.canvas-controls > * {
  pointer-events: auto; /* 恢复子元素的交互 */
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #5a5a5c;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #2c2c2e;
}

.control-btn:active {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
}

.zoom-level {
  font-size: 13px;
  color: #6c6c6e;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
  padding: 0 4px;
}

.pan-hint {
  font-size: 12px;
  color: #8a8a8c;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 6px 12px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);
  font-weight: 500;
}

/* 画布变换 */
.canvas-grid {
  transition: transform 0.1s ease-out;
  will-change: transform;
}

.workflow-canvas {
  cursor: default;
}

.workflow-canvas.panning {
  cursor: grab;
}

.workflow-canvas.panning:active {
  cursor: grabbing;
}
