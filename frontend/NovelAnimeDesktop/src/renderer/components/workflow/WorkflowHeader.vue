<template>
  <div class="workflow-header">
    <!-- 工作流选择器 -->
    <div class="workflow-selector">
      <div class="custom-select" :class="{ open: dropdownOpen }">
        <div class="select-trigger" @click="toggleDropdown">
          <span>{{ selectedWorkflowName }}</span>
          <span class="arrow">▼</span>
        </div>
        <div class="select-dropdown" v-if="dropdownOpen">
          <div 
            class="select-option" 
            :class="{ selected: !selectedWorkflowId }"
            @click="handleSelect('')"
          >
            选择工作流
          </div>
          <div 
            v-for="wf in workflows" 
            :key="wf.id"
            class="select-option-row"
            :class="{ selected: selectedWorkflowId === wf.id }"
          >
            <span class="option-name" @click="handleSelect(wf.id)">{{ wf.name }}</span>
            <button class="option-edit" @click.stop="$emit('rename', wf.id)" title="重命名">✎</button>
            <button class="option-delete" @click.stop="$emit('delete', wf.id)" title="删除">×</button>
          </div>
        </div>
      </div>
      <!-- 当前工作流操作按钮 -->
      <template v-if="workflow">
        <button @click="$emit('rename', workflow.id)" class="btn btn-icon" title="重命名工作流">✎</button>
        <button @click="$emit('delete', workflow.id)" class="btn btn-icon btn-danger-icon" title="删除工作流">🗑</button>
      </template>
    </div>
    
    <div class="action-divider"></div>
    
    <!-- 操作按钮 -->
    <button @click="$emit('create')" class="btn btn-secondary">新建</button>
    <button @click="$emit('create-default')" class="btn btn-secondary">默认流程</button>
    <button @click="$emit('save')" class="btn btn-primary" :disabled="!workflow">保存</button>
    <button @click="$emit('run')" class="btn btn-success" :disabled="!workflow || isExecuting">
      {{ isExecuting ? '执行中...' : '运行' }}
    </button>
  </div>
</template>


<script setup lang="ts">
/**
 * WorkflowHeader.vue - 工作流头部组件
 * 接收 workflow, workflows props，emit select, create, save, delete 事件
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Workflow } from '../../types/workflow';

// Props
interface Props {
  workflow: Workflow | null;
  workflows: Workflow[];
  selectedWorkflowId: string;
  isExecuting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isExecuting: false,
});

// Emits
const emit = defineEmits<{
  select: [workflowId: string];
  create: [];
  'create-default': [];
  save: [];
  run: [];
  rename: [workflowId: string];
  delete: [workflowId: string];
}>();

// Local state
const dropdownOpen = ref(false);

// Computed
const selectedWorkflowName = computed((): string => {
  if (!props.selectedWorkflowId) return '选择工作流';
  const wf = props.workflows.find(w => w.id === props.selectedWorkflowId);
  return wf ? wf.name : '选择工作流';
});

// Methods
function toggleDropdown(): void {
  dropdownOpen.value = !dropdownOpen.value;
}

function handleSelect(workflowId: string): void {
  dropdownOpen.value = false;
  emit('select', workflowId);
}

function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (!target.closest('.custom-select')) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.workflow-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.workflow-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 4px;
}

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
}

.select-trigger:hover {
  color: #4a4a4a;
  background: rgba(0, 0, 0, 0.05);
}

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
  padding: 4px 8px 4px 12px;
  color: #4a4a4c;
  font-size: 12px;
  transition: background 0.15s;
}

.select-option-row:hover {
  background: rgba(0, 0, 0, 0.05);
}

.select-option-row.selected {
  background: rgba(120, 140, 130, 0.2);
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

/* 按钮样式 */
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
  white-space: nowrap;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: #2c2c2e;
}

.btn-secondary {
  background: rgba(160, 160, 160, 0.15);
  color: #6a6a6a;
}

.btn-secondary:hover {
  background: rgba(160, 160, 160, 0.25);
}

.btn-primary {
  background: rgba(120, 140, 130, 0.25);
  color: #4a5a52;
}

.btn-primary:hover {
  background: rgba(120, 140, 130, 0.35);
}

.btn-success {
  background: rgba(100, 160, 130, 0.2);
  color: #4a7a5a;
}

.btn-success:hover {
  background: rgba(100, 160, 130, 0.3);
}

.btn-icon {
  width: 28px;
  padding: 0;
  background: transparent;
  border: none;
  color: #6a6a6a;
  font-size: 14px;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.08);
}

.btn-danger-icon:hover {
  background: rgba(200, 100, 100, 0.15);
  color: #a04040;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
