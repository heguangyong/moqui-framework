<template>
  <div 
    class="workflow-node"
    :class="{ 
      'node-running': node.status === 'running', 
      'node-completed': node.status === 'completed',
      'node-selected': selected
    }"
    :style="{ left: node.position.x + 'px', top: node.position.y + 'px' }"
    @mousedown="handleMouseDown"
    @click.stop="$emit('select', node)"
    @dblclick.stop="$emit('edit', node)"
  >
    <div class="node-header">
      <span class="node-icon">{{ nodeIcon }}</span>
      <span class="node-title">{{ node.name }}</span>
      <button @click.stop="$emit('edit', node)" class="node-edit" title="编辑节点">✎</button>
      <button @click.stop="$emit('remove', node.id)" class="node-remove" title="删除节点">×</button>
    </div>
    <div class="node-content">
      <div class="node-inputs">
        <div 
          v-for="(input, idx) in nodeInputs" 
          :key="input" 
          class="input-port"
          :class="{ 'port-highlight': isHighlightedInput(idx) }"
          @mouseup="$emit('connection-end', node.id, idx, 'input')"
          @mouseenter="$emit('port-hover', node.id, idx, 'input')"
          @mouseleave="$emit('port-leave')"
        >
          <span class="port-dot input-dot">●</span> {{ input }}
        </div>
      </div>
      <div class="node-outputs">
        <div 
          v-for="(output, idx) in nodeOutputs" 
          :key="output" 
          class="output-port"
          @mousedown.stop="$emit('connection-start', node, idx, $event)"
        >
          {{ output }} <span class="port-dot output-dot">●</span>
        </div>
      </div>
    </div>
    <!-- 节点配置预览 -->
    <div v-if="hasConfig" class="node-config-preview">
      <div v-for="(value, key) in node.configuration" :key="key" class="config-item">
        {{ key }}: {{ value }}
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
/**
 * WorkflowNode.vue - 工作流节点组件
 * 接收 node, selected props，emit select, remove, position-change 事件
 * 
 * Requirements: 4.3, 4.5
 */
import { computed } from 'vue';
import type { WorkflowNode } from '../../types/workflow';

// Node type configuration
const nodeTypes: Record<string, { icon: string; inputs: string[]; outputs: string[] }> = {
  'novel-parser': { icon: '📖', inputs: [], outputs: ['文本', '结构'] },
  'character-analyzer': { icon: '👤', inputs: ['文本'], outputs: ['角色信息'] },
  'scene-generator': { icon: '🎬', inputs: ['结构', '角色信息'], outputs: ['场景描述'] },
  'script-converter': { icon: '📝', inputs: ['场景描述'], outputs: ['脚本'] },
  'video-generator': { icon: '🎥', inputs: ['脚本'], outputs: [] },
};

// Props
interface Props {
  node: WorkflowNode;
  selected?: boolean;
  highlightedPort?: { nodeId: string; portIndex: number; portType: string } | null;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  highlightedPort: null,
});

// Emits
const emit = defineEmits<{
  select: [node: WorkflowNode];
  edit: [node: WorkflowNode];
  remove: [nodeId: string];
  'position-change': [nodeId: string, position: { x: number; y: number }];
  'connection-start': [node: WorkflowNode, portIndex: number, event: MouseEvent];
  'connection-end': [nodeId: string, portIndex: number, portType: string];
  'port-hover': [nodeId: string, portIndex: number, portType: string];
  'port-leave': [];
}>();

// Computed
const nodeIcon = computed(() => nodeTypes[props.node.type]?.icon || '⚙️');
const nodeInputs = computed(() => nodeTypes[props.node.type]?.inputs || []);
const nodeOutputs = computed(() => nodeTypes[props.node.type]?.outputs || []);
const hasConfig = computed(() => 
  props.node.configuration && Object.keys(props.node.configuration).length > 0
);

// Methods
function isHighlightedInput(portIndex: number): boolean {
  return props.highlightedPort?.nodeId === props.node.id && 
         props.highlightedPort?.portIndex === portIndex &&
         props.highlightedPort?.portType === 'input';
}

function handleMouseDown(event: MouseEvent): void {
  const startX = event.clientX - props.node.position.x;
  const startY = event.clientY - props.node.position.y;
  
  function onMouseMove(e: MouseEvent): void {
    const newX = Math.max(0, e.clientX - startX);
    const newY = Math.max(0, e.clientY - startY);
    emit('position-change', props.node.id, { x: newX, y: newY });
  }
  
  function onMouseUp(): void {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
</script>

<style scoped>
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

.workflow-node.node-running {
  border-color: #8a8a8a;
  box-shadow: 0 0 10px rgba(140, 140, 140, 0.5);
}

.workflow-node.node-completed {
  border-color: #7a9a8a;
  box-shadow: 0 0 10px rgba(120, 150, 140, 0.5);
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

.node-edit,
.node-remove {
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

.workflow-node:hover .node-edit,
.workflow-node:hover .node-remove {
  opacity: 0.7;
}

.node-edit:hover {
  opacity: 1 !important;
  background: rgba(100, 160, 200, 0.3);
}

.node-remove {
  font-size: 1rem;
}

.node-remove:hover {
  opacity: 1 !important;
  background: rgba(200, 100, 100, 0.3);
  color: #ff6666;
}

.node-content {
  padding: 0.5rem;
}

.node-inputs,
.node-outputs {
  font-size: 0.7rem;
  margin-bottom: 0.25rem;
}

.input-port,
.output-port {
  padding: 0.1rem 0;
  opacity: 0.8;
}

.output-port {
  text-align: right;
}

.port-dot {
  display: inline-block;
  cursor: pointer;
  transition: all 0.2s;
}

.output-dot {
  color: rgba(100, 200, 150, 0.8);
}

.output-dot:hover {
  color: rgba(100, 200, 150, 1);
  transform: scale(1.3);
}

.input-dot {
  color: rgba(100, 160, 200, 0.8);
}

.input-port.port-highlight .input-dot {
  color: rgba(100, 200, 150, 1);
  transform: scale(1.5);
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
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
</style>
