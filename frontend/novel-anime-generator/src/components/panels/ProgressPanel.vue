<template>
  <div class="progress-panel">
    <div class="panel-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">进度面板</q-toolbar-title>
        <q-btn flat round dense icon="pause" @click="pauseAll" />
        <q-btn flat round dense icon="stop" @click="stopAll" />
      </q-toolbar>
    </div>

    <div class="panel-content">
      <div v-if="tasks.length > 0" class="tasks-list">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ 'task-completed': task.status === 'completed' }"
        >
          <div class="task-header">
            <div class="task-info">
              <q-icon :name="getTaskIcon(task.status)" :color="getTaskColor(task.status)" />
              <div class="task-details">
                <div class="task-name">{{ task.name }}</div>
                <div class="task-description">{{ task.description }}</div>
              </div>
            </div>
            <div class="task-actions">
              <q-btn
                v-if="task.status === 'running'"
                flat
                round
                dense
                icon="pause"
                @click="pauseTask(task)"
              />
              <q-btn
                v-if="task.status === 'paused'"
                flat
                round
                dense
                icon="play_arrow"
                @click="resumeTask(task)"
              />
              <q-btn
                flat
                round
                dense
                icon="stop"
                @click="stopTask(task)"
              />
            </div>
          </div>

          <div class="task-progress">
            <q-linear-progress
              :value="task.progress / 100"
              :color="getProgressColor(task.status)"
              size="8px"
              class="progress-bar"
            />
            <div class="progress-text">
              <span>{{ task.progress }}%</span>
              <span v-if="task.eta">剩余时间: {{ formatTime(task.eta) }}</span>
            </div>
          </div>

          <div v-if="task.logs && task.logs.length > 0" class="task-logs">
            <div
              v-for="log in task.logs.slice(-3)"
              :key="log.timestamp"
              class="task-log"
            >
              {{ log.message }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-tasks">
        <q-icon name="hourglass_empty" size="48px" color="grey-5" />
        <div class="text-grey-6">暂无进行中的任务</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface TaskLog {
  timestamp: number;
  message: string;
}

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'waiting' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  eta?: number; // seconds
  logs?: TaskLog[];
}

interface Props {
  tasks?: Task[];
}

const props = withDefaults(defineProps<Props>(), {
  tasks: () => []
});

const emit = defineEmits<{
  'task-action': [action: string, task: Task];
}>();

// State
const tasks = ref<Task[]>([]);

// Methods
const pauseAll = () => {
  tasks.value.forEach(task => {
    if (task.status === 'running') {
      pauseTask(task);
    }
  });
};

const stopAll = () => {
  tasks.value.forEach(task => {
    if (task.status !== 'completed') {
      stopTask(task);
    }
  });
};

const pauseTask = (task: Task) => {
  task.status = 'paused';
  emit('task-action', 'pause', task);
};

const resumeTask = (task: Task) => {
  task.status = 'running';
  emit('task-action', 'resume', task);
};

const stopTask = (task: Task) => {
  task.status = 'error';
  emit('task-action', 'stop', task);
};

const getTaskIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    waiting: 'schedule',
    running: 'play_circle',
    paused: 'pause_circle',
    completed: 'check_circle',
    error: 'error'
  };
  return iconMap[status] || 'help';
};

const getTaskColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    waiting: 'grey',
    running: 'blue',
    paused: 'orange',
    completed: 'green',
    error: 'red'
  };
  return colorMap[status] || 'grey';
};

const getProgressColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    waiting: 'grey',
    running: 'primary',
    paused: 'orange',
    completed: 'positive',
    error: 'negative'
  };
  return colorMap[status] || 'grey';
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
};

// Lifecycle
onMounted(() => {
  // 模拟一些任务
  tasks.value = [
    {
      id: '1',
      name: '小说解析',
      description: '正在解析小说文本结构...',
      status: 'completed',
      progress: 100,
      logs: [
        { timestamp: Date.now() - 30000, message: '开始解析小说文件' },
        { timestamp: Date.now() - 20000, message: '检测到15个章节' },
        { timestamp: Date.now() - 10000, message: '解析完成' }
      ]
    },
    {
      id: '2',
      name: '角色分析',
      description: '正在分析角色关系和属性...',
      status: 'running',
      progress: 65,
      eta: 45,
      logs: [
        { timestamp: Date.now() - 15000, message: '开始角色识别' },
        { timestamp: Date.now() - 10000, message: '发现主要角色5个' },
        { timestamp: Date.now() - 5000, message: '正在分析角色关系...' }
      ]
    },
    {
      id: '3',
      name: '视频生成',
      description: '等待角色分析完成...',
      status: 'waiting',
      progress: 0
    }
  ];
});
</script>

<style scoped>
.progress-panel {
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

.tasks-list {
  padding: 8px;
}

.task-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 12px;
  transition: all 0.2s;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-completed {
  background: #f8f9fa;
  border-color: #28a745;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.task-details {
  flex: 1;
}

.task-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.task-description {
  font-size: 12px;
  color: #666;
}

.task-actions {
  display: flex;
  gap: 4px;
}

.task-progress {
  margin-bottom: 8px;
}

.progress-bar {
  margin-bottom: 4px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
}

.task-logs {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  font-size: 11px;
  color: #666;
  font-family: monospace;
}

.task-log {
  margin-bottom: 2px;
}

.task-log:last-child {
  margin-bottom: 0;
}

.no-tasks {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}
</style>