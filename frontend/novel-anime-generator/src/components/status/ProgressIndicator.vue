<template>
  <div class="progress-indicator">
    <!-- Global Progress Bar -->
    <q-linear-progress
      v-if="globalProgress.visible"
      :value="globalProgress.value"
      :color="globalProgress.color"
      :indeterminate="globalProgress.indeterminate"
      class="global-progress"
      size="3px"
    />

    <!-- Task Progress Panel -->
    <q-card v-if="showTaskProgress && activeTasks.length > 0" class="task-progress-panel">
      <q-card-section class="q-pa-sm">
        <div class="row items-center q-mb-xs">
          <q-icon name="hourglass_empty" size="16px" class="q-mr-xs" />
          <span class="text-caption text-weight-medium">正在处理 ({{ activeTasks.length }})</span>
          <q-space />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="close"
            @click="showTaskProgress = false"
          />
        </div>
        
        <div class="task-list">
          <div
            v-for="task in activeTasks"
            :key="task.id"
            class="task-item q-mb-xs"
          >
            <div class="row items-center q-mb-xs">
              <q-icon
                :name="getTaskIcon(task.status)"
                :color="getTaskColor(task.status)"
                size="14px"
                class="q-mr-xs"
              />
              <span class="text-caption ellipsis">{{ task.name }}</span>
              <q-space />
              <span class="text-caption text-grey-6">
                {{ task.progress }}%
              </span>
            </div>
            
            <q-linear-progress
              :value="task.progress / 100"
              :color="getTaskColor(task.status)"
              size="2px"
              class="q-mb-xs"
            />
            
            <div v-if="task.message" class="text-caption text-grey-7 q-ml-md">
              {{ task.message }}
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Status Bar -->
    <div class="status-bar bg-grey-2">
      <div class="row items-center q-px-sm" style="height: 24px;">
        <!-- Left side - Current status -->
        <div class="row items-center">
          <q-icon
            :name="statusIcon"
            :color="statusColor"
            size="14px"
            class="q-mr-xs"
          />
          <span class="text-caption">{{ statusMessage }}</span>
        </div>

        <q-space />

        <!-- Right side - System info -->
        <div class="row items-center q-gutter-md">
          <!-- Memory usage -->
          <div class="row items-center" v-if="systemInfo.memory">
            <q-icon name="memory" size="12px" class="q-mr-xs" />
            <span class="text-caption">{{ systemInfo.memory }}</span>
          </div>

          <!-- Active connections -->
          <div class="row items-center" v-if="systemInfo.connections">
            <q-icon name="wifi" size="12px" class="q-mr-xs" />
            <span class="text-caption">{{ systemInfo.connections }}</span>
          </div>

          <!-- Current time -->
          <span class="text-caption">{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface TaskProgress {
  id: string;
  name: string;
  progress: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  message?: string;
  startTime: Date;
}

interface GlobalProgress {
  visible: boolean;
  value: number;
  color: string;
  indeterminate: boolean;
}

interface SystemInfo {
  memory?: string;
  connections?: string;
}

// State
const globalProgress = ref<GlobalProgress>({
  visible: false,
  value: 0,
  color: 'primary',
  indeterminate: false
});

const activeTasks = ref<TaskProgress[]>([]);
const showTaskProgress = ref(false);
const currentTime = ref('');
const systemInfo = ref<SystemInfo>({});

// Status
const statusMessage = ref('就绪');
const statusIcon = ref('check_circle');
const statusColor = ref('positive');

// Timer for updating time
let timeInterval: NodeJS.Timeout | null = null;

// Computed
const hasActiveTasks = computed(() => activeTasks.value.length > 0);

// Methods
const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
};

const updateSystemInfo = () => {
  // Simulate system info updates
  systemInfo.value = {
    memory: `${Math.floor(Math.random() * 40 + 60)}%`,
    connections: `${Math.floor(Math.random() * 5 + 1)}`
  };
};

const getTaskIcon = (status: TaskProgress['status']): string => {
  switch (status) {
    case 'running':
      return 'play_circle';
    case 'completed':
      return 'check_circle';
    case 'failed':
      return 'error';
    case 'paused':
      return 'pause_circle';
    default:
      return 'radio_button_unchecked';
  }
};

const getTaskColor = (status: TaskProgress['status']): string => {
  switch (status) {
    case 'running':
      return 'primary';
    case 'completed':
      return 'positive';
    case 'failed':
      return 'negative';
    case 'paused':
      return 'warning';
    default:
      return 'grey';
  }
};

const startGlobalProgress = (indeterminate = false) => {
  globalProgress.value = {
    visible: true,
    value: 0,
    color: 'primary',
    indeterminate
  };
  
  if (!indeterminate) {
    // Simulate progress
    const interval = setInterval(() => {
      globalProgress.value.value += 0.1;
      if (globalProgress.value.value >= 1) {
        clearInterval(interval);
        setTimeout(() => {
          globalProgress.value.visible = false;
        }, 500);
      }
    }, 100);
  }
};

const stopGlobalProgress = () => {
  globalProgress.value.visible = false;
};

const addTask = (name: string, id?: string): string => {
  const taskId = id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  const task: TaskProgress = {
    id: taskId,
    name,
    progress: 0,
    status: 'running',
    startTime: new Date()
  };
  
  activeTasks.value.push(task);
  showTaskProgress.value = true;
  
  // Update status
  statusMessage.value = `正在处理: ${name}`;
  statusIcon.value = 'hourglass_empty';
  statusColor.value = 'primary';
  
  return taskId;
};

const updateTask = (taskId: string, progress: number, message?: string) => {
  const task = activeTasks.value.find(t => t.id === taskId);
  if (task) {
    task.progress = Math.min(100, Math.max(0, progress));
    if (message) task.message = message;
    
    if (progress >= 100) {
      task.status = 'completed';
      setTimeout(() => removeTask(taskId), 2000);
    }
  }
};

const failTask = (taskId: string, message?: string) => {
  const task = activeTasks.value.find(t => t.id === taskId);
  if (task) {
    task.status = 'failed';
    if (message) task.message = message;
    
    // Update global status
    statusMessage.value = `任务失败: ${task.name}`;
    statusIcon.value = 'error';
    statusColor.value = 'negative';
    
    setTimeout(() => removeTask(taskId), 5000);
  }
};

const pauseTask = (taskId: string) => {
  const task = activeTasks.value.find(t => t.id === taskId);
  if (task) {
    task.status = 'paused';
  }
};

const resumeTask = (taskId: string) => {
  const task = activeTasks.value.find(t => t.id === taskId);
  if (task) {
    task.status = 'running';
  }
};

const removeTask = (taskId: string) => {
  const index = activeTasks.value.findIndex(t => t.id === taskId);
  if (index !== -1) {
    activeTasks.value.splice(index, 1);
    
    // Update status if no more active tasks
    if (activeTasks.value.length === 0) {
      statusMessage.value = '就绪';
      statusIcon.value = 'check_circle';
      statusColor.value = 'positive';
      showTaskProgress.value = false;
    }
  }
};

const clearAllTasks = () => {
  activeTasks.value = [];
  showTaskProgress.value = false;
  statusMessage.value = '就绪';
  statusIcon.value = 'check_circle';
  statusColor.value = 'positive';
};

// Expose methods for external use
defineExpose({
  startGlobalProgress,
  stopGlobalProgress,
  addTask,
  updateTask,
  failTask,
  pauseTask,
  resumeTask,
  removeTask,
  clearAllTasks
});

// Lifecycle
onMounted(() => {
  updateTime();
  updateSystemInfo();
  
  timeInterval = setInterval(() => {
    updateTime();
    updateSystemInfo();
  }, 1000);
  
  // Simulate some initial tasks for demo
  setTimeout(() => {
    const taskId = addTask('解析小说文件');
    setTimeout(() => updateTask(taskId, 50, '正在分析章节结构...'), 1000);
    setTimeout(() => updateTask(taskId, 100, '解析完成'), 2000);
  }, 2000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.progress-indicator {
  position: relative;
}

.global-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.task-progress-panel {
  position: fixed;
  bottom: 30px;
  right: 16px;
  width: 300px;
  max-height: 200px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.task-list {
  max-height: 120px;
  overflow-y: auto;
}

.task-item {
  padding: 4px 0;
}

.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid #e0e0e0;
  font-size: 11px;
  z-index: 999;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}
</style>