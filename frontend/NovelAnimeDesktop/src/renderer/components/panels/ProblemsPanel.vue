<template>
  <div class="problems-panel">
    <div class="panel-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">问题面板</q-toolbar-title>
        <q-btn flat round dense icon="refresh" @click="refreshProblems" />
      </q-toolbar>
    </div>

    <div class="panel-content">
      <div v-if="problems.length > 0" class="problems-list">
        <div
          v-for="problem in problems"
          :key="problem.id"
          class="problem-item"
          :class="getProblemClass(problem.severity)"
          @click="selectProblem(problem)"
        >
          <div class="problem-icon">
            <q-icon :name="getProblemIcon(problem.severity)" :color="getProblemColor(problem.severity)" />
          </div>
          <div class="problem-content">
            <div class="problem-message">{{ problem.message }}</div>
            <div class="problem-details">
              <span class="problem-file">{{ problem.file }}</span>
              <span v-if="problem.line" class="problem-location">第{{ problem.line }}行</span>
              <span class="problem-source">{{ problem.source }}</span>
            </div>
          </div>
          <div class="problem-actions">
            <q-btn
              flat
              round
              dense
              icon="open_in_new"
              size="sm"
              @click.stop="openProblem(problem)"
            />
          </div>
        </div>
      </div>
      
      <div v-else class="no-problems">
        <q-icon name="check_circle" size="48px" color="green-5" />
        <div class="text-green-6">没有发现问题</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Problem {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
  source: string;
}

interface Props {
  problems?: Problem[];
}

const props = withDefaults(defineProps<Props>(), {
  problems: () => []
});

const emit = defineEmits<{
  'problem-selected': [problem: Problem];
}>();

// State
const problems = ref<Problem[]>([]);

// Methods
const refreshProblems = () => {
  // 刷新问题列表
  loadProblems();
};

const selectProblem = (problem: Problem) => {
  emit('problem-selected', problem);
};

const openProblem = (problem: Problem) => {
  console.log('打开问题:', problem.file, problem.line);
  selectProblem(problem);
};

const getProblemClass = (severity: string): string => {
  return `problem-${severity}`;
};

const getProblemIcon = (severity: string): string => {
  const iconMap: Record<string, string> = {
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  return iconMap[severity] || 'help';
};

const getProblemColor = (severity: string): string => {
  const colorMap: Record<string, string> = {
    error: 'red',
    warning: 'orange',
    info: 'blue'
  };
  return colorMap[severity] || 'grey';
};

const loadProblems = () => {
  // 问题列表应该由 IDE 或构建工具提供
  // 目前显示空状态，等待实际问题数据
  problems.value = [];
};

// Lifecycle
onMounted(() => {
  loadProblems();
});
</script>

<style scoped>
.problems-panel {
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

.problems-list {
  padding: 4px;
}

.problem-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.problem-item:hover {
  background: #f5f5f5;
}

.problem-error {
  border-left-color: #f44336;
}

.problem-warning {
  border-left-color: #ff9800;
}

.problem-info {
  border-left-color: #2196f3;
}

.problem-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.problem-content {
  flex: 1;
  min-width: 0;
}

.problem-message {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
  word-break: break-word;
}

.problem-details {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #666;
}

.problem-file {
  font-weight: 500;
}

.problem-location {
  color: #888;
}

.problem-source {
  color: #999;
  font-style: italic;
}

.problem-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.problem-item:hover .problem-actions {
  opacity: 1;
}

.no-problems {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}
</style>