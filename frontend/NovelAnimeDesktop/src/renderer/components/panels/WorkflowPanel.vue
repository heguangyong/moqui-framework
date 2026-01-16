<template>
  <div class="workflow-panel">
    <div class="panel-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">工作流面板</q-toolbar-title>
        <q-btn flat round dense icon="add" @click="createWorkflow" />
      </q-toolbar>
    </div>

    <div class="panel-content">
      <q-list>
        <q-item
          v-for="workflow in workflows"
          :key="workflow.id"
          clickable
          @click="selectWorkflow(workflow)"
          :class="{ 'bg-blue-1': selectedWorkflow?.id === workflow.id }"
        >
          <q-item-section avatar>
            <q-icon name="account_tree" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ workflow.name }}</q-item-label>
            <q-item-label caption>{{ workflow.description }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip dense size="sm" :color="getStatusColor(workflow.status)">
              {{ getStatusLabel(workflow.status) }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'error';
}

interface Props {
  workflows?: Workflow[];
}

const props = withDefaults(defineProps<Props>(), {
  workflows: () => []
});

const emit = defineEmits<{
  'workflow-selected': [workflow: Workflow];
}>();

// State
const selectedWorkflow = ref<Workflow | null>(null);
const workflows = ref<Workflow[]>([]);

// Methods
const createWorkflow = () => {
  console.log('创建新工作流');
};

const selectWorkflow = (workflow: Workflow) => {
  selectedWorkflow.value = workflow;
  emit('workflow-selected', workflow);
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    idle: 'grey-4',
    running: 'blue-4',
    completed: 'green-4',
    error: 'red-4'
  };
  return colorMap[status] || 'grey-4';
};

const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    idle: '空闲',
    running: '运行中',
    completed: '已完成',
    error: '错误'
  };
  return labelMap[status] || '未知';
};

const loadWorkflows = () => {
  // 从 localStorage 加载工作流数据
  try {
    const savedWorkflows = localStorage.getItem('novel_anime_workflows');
    if (savedWorkflows) {
      const parsed = JSON.parse(savedWorkflows);
      if (Array.isArray(parsed) && parsed.length > 0) {
        workflows.value = parsed.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description || '工作流',
          status: w.status || 'idle'
        }));
        return;
      }
    }
  } catch (e) {
    console.warn('加载工作流失败:', e);
  }
  
  // 如果没有保存的工作流，显示空列表
  workflows.value = [];
};

// Lifecycle
onMounted(() => {
  loadWorkflows();
});
</script>

<style scoped>
.workflow-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}
</style>