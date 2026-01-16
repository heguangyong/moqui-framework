<template>
  <div 
    class="workflow-canvas" 
    @drop="handleDrop" 
    @dragover.prevent 
    @click="$emit('clear-selection')"
    ref="canvasRef"
  >
    <div v-if="nodes.length === 0" class="empty-canvas">
      <div class="empty-message">
        <h3>请选择或创建一个工作流</h3>
        <p>从上方选择现有工作流，或创建新的工作流开始编辑</p>
      </div>
    </div>
    
    <div v-else class="canvas-grid">
      <!-- 节点 -->
      <WorkflowNode
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :selected="selectedNodeId === node.id"
        :highlighted-port="highlightedPort"
        @select="$emit('node-select', $event)"
        @edit="$emit('node-edit', $event)"
        @remove="$emit('node-remove', $event)"
        @position-change="handlePositionChange"
        @connection-start="handleConnectionStart"
        @connection-end="handleConnectionEnd"
        @port-hover="handlePortHover"
        @port-leave="handlePortLeave"
      />
      
      <!-- 连接线 SVG -->
      <svg class="connections-layer" ref="connectionsLayer">
        <!-- 已有连接线 -->
        <g v-for="connection in connections" :key="connection.id">
          <path 
            :d="getConnectionPath(connection)"
            fill="none"
            stroke="rgba(100, 160, 200, 0.8)" 
            stroke-width="2"
            class="connection-line"
            :class="{ 'connection-selected': selectedConnectionId === connection.id }"
            @click.stop="$emit('connection-select', connection)"
          />
          <!-- 删除按钮 -->
          <g 
            v-if="selectedConnectionId === connection.id"
            class="connection-delete"
            @click.stop="$emit('connection-remove', connection.id)"
            :transform="`translate(${getConnectionMidpoint(connection).x}, ${getConnectionMidpoint(connection).y})`"
          >
            <circle r="10" fill="#ff6b6b" />
            <text x="0" y="4" text-anchor="middle" fill="white" font-size="14">×</text>
          </g>
        </g>
        <!-- 正在拖拽的临时连线 -->
        <path 
          v-if="isConnecting"
          :d="tempConnectionPath"
          fill="none"
          stroke="rgba(100, 200, 150, 0.8)" 
          stroke-width="2"
          stroke-dasharray="5,5"
          class="temp-connection"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * WorkflowCanvas.vue - 工作流画布组件
 * 接收 nodes, connections props，emit node-add, node-remove, connection-add 事件
 * 
 * Requirements: 4.3, 4.4
 */
import { ref, computed } from 'vue';
import WorkflowNode from './WorkflowNode.vue';
import type { WorkflowNode as WorkflowNodeType, WorkflowConnection, WorkflowNodeType as NodeType } from '../../types/workflow';

// Props
interface Props {
  nodes: WorkflowNodeType[];
  connections: WorkflowConnection[];
  selectedNodeId?: string;
  selectedConnectionId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selectedNodeId: '',
  selectedConnectionId: '',
});

// Emits
const emit = defineEmits<{
  'node-add': [type: NodeType, name: string, position: { x: number; y: number }];
  'node-select': [node: WorkflowNodeType];
  'node-edit': [node: WorkflowNodeType];
  'node-remove': [nodeId: string];
  'node-position-change': [nodeId: string, position: { x: number; y: number }];
  'connection-add': [fromNodeId: string, toNodeId: string];
  'connection-select': [connection: WorkflowConnection];
  'connection-remove': [connectionId: string];
  'clear-selection': [];
}>();

// Refs
const canvasRef = ref<HTMLElement | null>(null);
const connectionsLayer = ref<SVGSVGElement | null>(null);

// Connection dragging state
const isConnecting = ref(false);
const connectingFromNode = ref<WorkflowNodeType | null>(null);
const connectingFromPort = ref(0);
const connectingMousePos = ref({ x: 0, y: 0 });
const highlightedPort = ref<{ nodeId: string; portIndex: number; portType: string } | null>(null);

// Node type titles
const nodeTypeTitles: Record<string, string> = {
  'novel-parser': '小说解析器',
  'character-analyzer': '角色分析器',
  'scene-generator': '场景生成器',
  'script-converter': '脚本转换器',
  'video-generator': '视频生成器',
};

// Computed
const tempConnectionPath = computed((): string => {
  if (!connectingFromNode.value) return '';
  
  const fromNode = connectingFromNode.value;
  const x1 = fromNode.position.x + 150;
  const y1 = fromNode.position.y + 50;
  const x2 = connectingMousePos.value.x;
  const y2 = connectingMousePos.value.y;
  
  const controlOffset = Math.min(Math.abs(x2 - x1) / 2, 80);
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
});

// Methods
function handleDrop(event: DragEvent): void {
  event.preventDefault();
  const nodeType = event.dataTransfer?.getData('nodeType');
  if (!nodeType || !canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left - 75;
  const y = event.clientY - rect.top - 50;
  
  const nodeName = nodeTypeTitles[nodeType] || nodeType;
  emit('node-add', nodeType as NodeType, nodeName, { x: Math.max(0, x), y: Math.max(0, y) });
}

function handlePositionChange(nodeId: string, position: { x: number; y: number }): void {
  emit('node-position-change', nodeId, position);
}

function handleConnectionStart(node: WorkflowNodeType, portIndex: number, event: MouseEvent): void {
  event.preventDefault();
  isConnecting.value = true;
  connectingFromNode.value = node;
  connectingFromPort.value = portIndex;
  
  if (!canvasRef.value) return;
  const canvasRect = canvasRef.value.getBoundingClientRect();
  
  const handleMouseMove = (e: MouseEvent): void => {
    connectingMousePos.value = {
      x: e.clientX - canvasRect.left + (canvasRef.value?.scrollLeft || 0),
      y: e.clientY - canvasRect.top + (canvasRef.value?.scrollTop || 0)
    };
  };
  
  const handleMouseUp = (): void => {
    if (isConnecting.value) {
      cancelConnection();
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleConnectionEnd(toNodeId: string, _toPortIndex: number, _portType: string): void {
  if (!isConnecting.value || !connectingFromNode.value) return;
  
  if (connectingFromNode.value.id !== toNodeId) {
    emit('connection-add', connectingFromNode.value.id, toNodeId);
  }
  
  cancelConnection();
}

function cancelConnection(): void {
  isConnecting.value = false;
  connectingFromNode.value = null;
  connectingFromPort.value = 0;
  connectingMousePos.value = { x: 0, y: 0 };
  highlightedPort.value = null;
}

function handlePortHover(nodeId: string, portIndex: number, portType: string): void {
  if (isConnecting.value) {
    highlightedPort.value = { nodeId, portIndex, portType };
  }
}

function handlePortLeave(): void {
  highlightedPort.value = null;
}

function getConnectionPath(connection: WorkflowConnection): string {
  const fromNode = props.nodes.find(n => n.id === connection.fromNodeId);
  const toNode = props.nodes.find(n => n.id === connection.toNodeId);
  
  if (!fromNode || !toNode) return '';
  
  const x1 = fromNode.position.x + 150;
  const y1 = fromNode.position.y + 50;
  const x2 = toNode.position.x;
  const y2 = toNode.position.y + 50;
  
  const controlOffset = Math.min(Math.abs(x2 - x1) / 2, 80);
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
}

function getConnectionMidpoint(connection: WorkflowConnection): { x: number; y: number } {
  const fromNode = props.nodes.find(n => n.id === connection.fromNodeId);
  const toNode = props.nodes.find(n => n.id === connection.toNodeId);
  
  if (!fromNode || !toNode) return { x: 0, y: 0 };
  
  const x1 = fromNode.position.x + 150;
  const y1 = fromNode.position.y + 50;
  const x2 = toNode.position.x;
  const y2 = toNode.position.y + 50;
  
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}
</script>


<style scoped>
.workflow-canvas {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  position: relative;
  overflow: auto;
  min-height: 0;
}

.workflow-canvas::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.workflow-canvas::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.workflow-canvas::-webkit-scrollbar-thumb {
  background: rgba(100, 100, 100, 0.5);
  border-radius: 4px;
}

.workflow-canvas::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 100, 0.7);
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

.canvas-grid {
  min-width: 100%;
  min-height: 100%;
  width: max-content;
  height: max-content;
  padding: 20px;
  padding-right: 100px;
  padding-bottom: 100px;
  position: relative;
  background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.connection-line {
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke 0.2s, stroke-width 0.2s;
}

.connection-line:hover {
  stroke: rgba(100, 200, 150, 0.9);
  stroke-width: 3;
}

.connection-line.connection-selected {
  stroke: rgba(255, 150, 100, 0.9);
  stroke-width: 3;
}

.connection-delete {
  pointer-events: all;
  cursor: pointer;
  transition: transform 0.2s;
}

.connection-delete:hover {
  transform: scale(1.2);
}

.temp-connection {
  pointer-events: none;
}
</style>
