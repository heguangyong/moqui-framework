<template>
  <div class="console-panel">
    <div class="panel-header">
      <q-toolbar class="bg-grey-1">
        <q-toolbar-title class="text-subtitle2">控制台</q-toolbar-title>
        <q-btn flat round dense icon="clear_all" @click="clearLogs" />
      </q-toolbar>
    </div>

    <div class="panel-content">
      <div class="console-content" ref="consoleContent">
        <div
          v-for="log in logs"
          :key="log.id"
          :class="getLogClass(log.level)"
          class="console-log"
        >
          <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';

interface ConsoleLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

interface Props {
  logs?: ConsoleLog[];
}

const props = withDefaults(defineProps<Props>(), {
  logs: () => []
});

const emit = defineEmits<{
  'clear-logs': [];
}>();

// State
const consoleContent = ref<HTMLElement>();
const logs = ref<ConsoleLog[]>([]);

// Methods
const clearLogs = () => {
  logs.value = [];
  emit('clear-logs');
};

const getLogClass = (level: string): string => {
  return `log-${level}`;
};

const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const scrollToBottom = async () => {
  await nextTick();
  if (consoleContent.value) {
    consoleContent.value.scrollTop = consoleContent.value.scrollHeight;
  }
};

const addLog = (level: ConsoleLog['level'], message: string) => {
  const log: ConsoleLog = {
    id: Date.now().toString(),
    timestamp: new Date(),
    level,
    message
  };
  logs.value.push(log);
  scrollToBottom();
};

// Lifecycle
onMounted(() => {
  // 模拟一些日志
  addLog('info', '应用程序启动完成');
  addLog('info', '正在加载项目配置...');
  addLog('warn', '未找到AI服务配置，使用默认设置');
  addLog('info', '项目加载完成');
  addLog('debug', '调试模式已启用');
});

// Expose methods for parent components
defineExpose({
  addLog,
  clearLogs
});
</script>

<style scoped>
.console-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow: hidden;
}

.console-content {
  height: 100%;
  overflow-y: auto;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  padding: 8px;
}

.console-log {
  display: flex;
  margin-bottom: 2px;
  padding: 2px 0;
}

.log-timestamp {
  color: #808080;
  margin-right: 8px;
  min-width: 80px;
}

.log-level {
  margin-right: 8px;
  min-width: 50px;
  font-weight: bold;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-info .log-level {
  color: #4fc3f7;
}

.log-warn .log-level {
  color: #ffb74d;
}

.log-error .log-level {
  color: #f48fb1;
}

.log-debug .log-level {
  color: #81c784;
}

.log-error {
  background: rgba(244, 143, 177, 0.1);
}

.log-warn {
  background: rgba(255, 183, 77, 0.1);
}

/* Scrollbar styling */
.console-content::-webkit-scrollbar {
  width: 8px;
}

.console-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.console-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.console-content::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>