<template>
  <div class="main-layout" :class="{ 'dark-theme': isDarkTheme }">
    <!-- Top Menu Bar -->
    <div class="menu-bar">
      <div class="menu-left">
        <div class="app-logo">
          <q-icon name="movie" size="24px" />
          <span class="app-title">小说动漫生成器</span>
        </div>
        <div class="menu-items">
          <q-btn flat dense @click="showCommandPalette = true">
            <q-icon name="search" />
            <q-tooltip>命令面板 (Ctrl+Shift+P)</q-tooltip>
          </q-btn>
        </div>
      </div>
      <div class="menu-right">
        <q-btn flat dense @click="toggleTheme">
          <q-icon :name="isDarkTheme ? 'light_mode' : 'dark_mode'" />
          <q-tooltip>切换主题</q-tooltip>
        </q-btn>
        <q-btn flat dense @click="showSettings = true">
          <q-icon name="settings" />
          <q-tooltip>设置</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Left Sidebar -->
      <ResizablePanel
        v-model:width="leftPanelWidth"
        :min-width="200"
        :max-width="600"
        position="left"
        :collapsed="leftPanelCollapsed"
        @toggle-collapse="leftPanelCollapsed = !leftPanelCollapsed"
      >
        <PanelTabs
          v-model="activeLeftTab"
          :tabs="leftTabs"
          position="left"
        >
          <template #explorer>
            <FileExplorer
              :projects="projects"
              @file-selected="onFileSelected"
              @project-selected="onProjectSelected"
            />
          </template>
          <template #assets>
            <AssetBrowser
              :assets="assets"
              @asset-selected="onAssetSelected"
            />
          </template>
          <template #workflow>
            <WorkflowPanel
              :workflows="workflows"
              @workflow-selected="onWorkflowSelected"
            />
          </template>
        </PanelTabs>
      </ResizablePanel>

      <!-- Center Content -->
      <div class="center-content">
        <!-- Tab Bar -->
        <div class="editor-tabs" v-if="openTabs.length > 0">
          <div
            v-for="tab in openTabs"
            :key="tab.id"
            class="editor-tab"
            :class="{ active: tab.id === activeTabId }"
            @click="activeTabId = tab.id"
          >
            <q-icon :name="getTabIcon(tab.type)" size="16px" />
            <span class="tab-title">{{ tab.title }}</span>
            <q-btn
              flat
              dense
              size="sm"
              icon="close"
              @click.stop="closeTab(tab.id)"
              class="tab-close"
            />
          </div>
        </div>

        <!-- Content Area -->
        <div class="editor-content">
          <component
            :is="getTabComponent(activeTab?.type)"
            v-if="activeTab"
            :key="activeTab.id"
            :tab-data="activeTab"
            @tab-updated="onTabUpdated"
          />
          <WelcomeScreen v-else />
        </div>
      </div>

      <!-- Right Sidebar -->
      <ResizablePanel
        v-model:width="rightPanelWidth"
        :min-width="200"
        :max-width="600"
        position="right"
        :collapsed="rightPanelCollapsed"
        @toggle-collapse="rightPanelCollapsed = !rightPanelCollapsed"
      >
        <PanelTabs
          v-model="activeRightTab"
          :tabs="rightTabs"
          position="right"
        >
          <template #properties>
            <PropertiesPanel
              :selected-item="selectedItem"
              @property-changed="onPropertyChanged"
            />
          </template>
          <template #preview>
            <PreviewPanel
              :preview-data="previewData"
            />
          </template>
          <template #timeline>
            <TimelinePanel
              :timeline-data="timelineData"
              @timeline-changed="onTimelineChanged"
            />
          </template>
        </PanelTabs>
      </ResizablePanel>
    </div>

    <!-- Bottom Panel -->
    <ResizablePanel
      v-model:height="bottomPanelHeight"
      :min-height="100"
      :max-height="400"
      position="bottom"
      :collapsed="bottomPanelCollapsed"
      @toggle-collapse="bottomPanelCollapsed = !bottomPanelCollapsed"
    >
      <PanelTabs
        v-model="activeBottomTab"
        :tabs="bottomTabs"
        position="bottom"
      >
        <template #console>
          <ConsolePanel
            :logs="consoleLogs"
            @clear-logs="clearConsoleLogs"
          />
        </template>
        <template #progress>
          <ProgressPanel
            :tasks="progressTasks"
            @task-action="onTaskAction"
          />
        </template>
        <template #problems>
          <ProblemsPanel
            :problems="problems"
            @problem-selected="onProblemSelected"
          />
        </template>
      </PanelTabs>
    </ResizablePanel>

    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-left">
        <span class="status-item">{{ currentProject?.name || '无项目' }}</span>
        <span class="status-item" v-if="activeWorkflow">
          工作流: {{ activeWorkflow.name }}
        </span>
      </div>
      <div class="status-right">
        <span class="status-item" v-if="processingStatus">
          {{ processingStatus }}
        </span>
        <q-linear-progress
          v-if="progressPercentage > 0"
          :value="progressPercentage / 100"
          size="4px"
          color="primary"
          class="progress-indicator"
        />
      </div>
    </div>

    <!-- Command Palette -->
    <CommandPalette
      v-model="showCommandPalette"
      :commands="availableCommands"
      @command-executed="onCommandExecuted"
    />

    <!-- Settings Dialog -->
    <SettingsDialog
      v-model="showSettings"
      :settings="appSettings"
      @settings-changed="onSettingsChanged"
    />

    <!-- Progress Indicator -->
    <ProgressIndicator ref="progressIndicatorRef" />

    <!-- Notification System -->
    <NotificationSystem ref="notificationSystemRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import ResizablePanel from './ResizablePanel.vue';
import PanelTabs from './PanelTabs.vue';
import FileExplorer from '../explorer/FileExplorer.vue';
import AssetBrowser from '../panels/AssetBrowser.vue';
import WorkflowPanel from '../panels/WorkflowPanel.vue';
import PropertiesPanel from '../panels/PropertiesPanel.vue';
import PreviewPanel from '../panels/PreviewPanel.vue';
import TimelinePanel from '../panels/TimelinePanel.vue';
import ConsolePanel from '../panels/ConsolePanel.vue';
import ProgressPanel from '../panels/ProgressPanel.vue';
import ProblemsPanel from '../panels/ProblemsPanel.vue';
import CommandPalette from '../dialogs/CommandPalette.vue';
import SettingsDialog from '../dialogs/SettingsDialog.vue';
import NotificationSystem from '../status/NotificationSystem.vue';
import ProgressIndicator from '../status/ProgressIndicator.vue';
import WelcomeScreen from '../welcome/WelcomeScreen.vue';
import { useLayoutStore } from '../../stores/layout';
import { useProjectStore } from '../../stores/project';
import { useWorkflowStore } from '../../stores/workflow';
import { useNotificationStore } from '../../stores/notification';

const $q = useQuasar();
const layoutStore = useLayoutStore();
const projectStore = useProjectStore();
const workflowStore = useWorkflowStore();
const notificationStore = useNotificationStore();

// Theme management
const isDarkTheme = ref($q.dark.isActive);

// Panel state
const leftPanelWidth = ref(300);
const rightPanelWidth = ref(300);
const bottomPanelHeight = ref(200);
const leftPanelCollapsed = ref(false);
const rightPanelCollapsed = ref(false);
const bottomPanelCollapsed = ref(true);

// Tab management
const activeLeftTab = ref('explorer');
const activeRightTab = ref('properties');
const activeBottomTab = ref('console');
const activeTabId = ref<string | null>(null);
const openTabs = ref<any[]>([]);

// Dialog state
const showCommandPalette = ref(false);
const showSettings = ref(false);

// Data
const projects = ref<any[]>([]);
const assets = ref<any[]>([]);
const workflows = ref<any[]>([]);
const selectedItem = ref<any>(null);
const previewData = ref<any>(null);
const timelineData = ref<any>(null);
const consoleLogs = ref<any[]>([]);
const progressTasks = ref<any[]>([]);
const problems = ref<any[]>([]);
const currentProject = ref<any>(null);
const activeWorkflow = ref<any>(null);
const processingStatus = ref<string>('');
const progressPercentage = ref(0);
const appSettings = ref<any>({});
const notifications = ref<any[]>([]);
const availableCommands = ref<any[]>([]);

// Tab definitions
const leftTabs = [
  { id: 'explorer', label: '资源管理器', icon: 'folder' },
  { id: 'assets', label: '素材库', icon: 'collections' },
  { id: 'workflow', label: '工作流', icon: 'account_tree' }
];

const rightTabs = [
  { id: 'properties', label: '属性', icon: 'tune' },
  { id: 'preview', label: '预览', icon: 'preview' },
  { id: 'timeline', label: '时间轴', icon: 'timeline' }
];

const bottomTabs = [
  { id: 'console', label: '控制台', icon: 'terminal' },
  { id: 'progress', label: '进度', icon: 'hourglass_empty' },
  { id: 'problems', label: '问题', icon: 'error_outline' }
];

// Computed
const activeTab = computed(() => {
  return openTabs.value.find(tab => tab.id === activeTabId.value);
});

// Methods
const toggleTheme = () => {
  $q.dark.toggle();
  isDarkTheme.value = $q.dark.isActive;
  layoutStore.setTheme(isDarkTheme.value ? 'dark' : 'light');
};

const getTabIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    novel: 'book',
    workflow: 'account_tree',
    asset: 'image',
    script: 'script',
    storyboard: 'storyboard',
    video: 'movie'
  };
  return iconMap[type] || 'description';
};

const getTabComponent = (type: string): string => {
  const componentMap: Record<string, string> = {
    novel: 'NovelEditor',
    workflow: 'WorkflowEditor',
    asset: 'AssetEditor',
    script: 'ScriptEditor',
    storyboard: 'StoryboardEditor',
    video: 'VideoEditor'
  };
  return componentMap[type] || 'DefaultEditor';
};

const closeTab = (tabId: string) => {
  const index = openTabs.value.findIndex(tab => tab.id === tabId);
  if (index !== -1) {
    openTabs.value.splice(index, 1);
    
    // Switch to another tab if the closed tab was active
    if (activeTabId.value === tabId) {
      if (openTabs.value.length > 0) {
        const newIndex = Math.min(index, openTabs.value.length - 1);
        activeTabId.value = openTabs.value[newIndex].id;
      } else {
        activeTabId.value = null;
      }
    }
  }
};

const createNewProject = () => {
  // Implementation for creating new project
  console.log('Creating new project...');
};

const openProject = () => {
  // Implementation for opening project
  console.log('Opening project...');
};

// Event handlers
const onFileSelected = (file: any) => {
  // Open file in appropriate editor
  const existingTab = openTabs.value.find(tab => tab.filePath === file.path);
  if (existingTab) {
    activeTabId.value = existingTab.id;
  } else {
    const newTab = {
      id: `tab_${Date.now()}`,
      title: file.name,
      type: file.type,
      filePath: file.path,
      data: file
    };
    openTabs.value.push(newTab);
    activeTabId.value = newTab.id;
  }
};

const onProjectSelected = (project: any) => {
  currentProject.value = project;
  projectStore.setCurrentProject(project);
};

const onAssetSelected = (asset: any) => {
  selectedItem.value = asset;
  previewData.value = asset;
};

const onWorkflowSelected = (workflow: any) => {
  activeWorkflow.value = workflow;
  workflowStore.setActiveWorkflow(workflow);
};

const onTabUpdated = (tabData: any) => {
  const tab = openTabs.value.find(t => t.id === tabData.id);
  if (tab) {
    Object.assign(tab, tabData);
  }
};

const onPropertyChanged = (property: any) => {
  if (selectedItem.value) {
    Object.assign(selectedItem.value, property);
  }
};

const onTimelineChanged = (timeline: any) => {
  timelineData.value = timeline;
};

const onTaskAction = (action: string, task: any) => {
  console.log(`Task action: ${action}`, task);
};

const onProblemSelected = (problem: any) => {
  console.log('Problem selected:', problem);
};

const onCommandExecuted = (command: any) => {
  console.log('Command executed:', command);
  showCommandPalette.value = false;
};

const onSettingsChanged = (settings: any) => {
  appSettings.value = settings;
  layoutStore.updateSettings(settings);
};

const onNotificationDismissed = (notificationId: string) => {
  notificationStore.dismissNotification(notificationId);
};

const clearConsoleLogs = () => {
  consoleLogs.value = [];
};

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Command Palette: Ctrl+Shift+P
  if (event.ctrlKey && event.shiftKey && event.key === 'P') {
    event.preventDefault();
    showCommandPalette.value = true;
  }
  
  // Settings: Ctrl+,
  if (event.ctrlKey && event.key === ',') {
    event.preventDefault();
    showSettings.value = true;
  }
  
  // Toggle panels
  if (event.ctrlKey && event.key === '1') {
    event.preventDefault();
    leftPanelCollapsed.value = !leftPanelCollapsed.value;
  }
  
  if (event.ctrlKey && event.key === '2') {
    event.preventDefault();
    rightPanelCollapsed.value = !rightPanelCollapsed.value;
  }
  
  if (event.ctrlKey && event.key === '3') {
    event.preventDefault();
    bottomPanelCollapsed.value = !bottomPanelCollapsed.value;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  
  // Load initial data
  projects.value = projectStore.projects;
  workflows.value = workflowStore.workflows;
  notifications.value = notificationStore.notifications;
  
  // Restore layout state
  const savedLayout = layoutStore.getLayoutState();
  if (savedLayout) {
    leftPanelWidth.value = savedLayout.leftPanelWidth || 300;
    rightPanelWidth.value = savedLayout.rightPanelWidth || 300;
    bottomPanelHeight.value = savedLayout.bottomPanelHeight || 200;
    leftPanelCollapsed.value = savedLayout.leftPanelCollapsed || false;
    rightPanelCollapsed.value = savedLayout.rightPanelCollapsed || false;
    bottomPanelCollapsed.value = savedLayout.bottomPanelCollapsed || true;
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  
  // Save layout state
  layoutStore.saveLayoutState({
    leftPanelWidth: leftPanelWidth.value,
    rightPanelWidth: rightPanelWidth.value,
    bottomPanelHeight: bottomPanelHeight.value,
    leftPanelCollapsed: leftPanelCollapsed.value,
    rightPanelCollapsed: rightPanelCollapsed.value,
    bottomPanelCollapsed: bottomPanelCollapsed.value,
    activeLeftTab: activeLeftTab.value,
    activeRightTab: activeRightTab.value,
    activeBottomTab: activeBottomTab.value
  });
});
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--q-background);
  color: var(--q-text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.menu-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  background: var(--q-primary);
  color: white;
  border-bottom: 1px solid var(--q-separator);
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.app-title {
  font-size: 14px;
}

.menu-items {
  display: flex;
  align-items: center;
  gap: 4px;
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.content-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.center-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.editor-tabs {
  display: flex;
  background: var(--q-background-secondary);
  border-bottom: 1px solid var(--q-separator);
  overflow-x: auto;
}

.editor-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--q-background-tertiary);
  border-right: 1px solid var(--q-separator);
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 120px;
  
  &:hover {
    background: var(--q-background-hover);
  }
  
  &.active {
    background: var(--q-background);
    border-bottom: 2px solid var(--q-primary);
  }
}

.tab-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.tab-close {
  opacity: 0;
  transition: opacity 0.2s;
  
  .editor-tab:hover & {
    opacity: 1;
  }
}

.editor-content {
  flex: 1;
  overflow: hidden;
  background: var(--q-background);
}



.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  background: var(--q-background-secondary);
  border-top: 1px solid var(--q-separator);
  font-size: 12px;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  color: var(--q-text-secondary);
}

.progress-indicator {
  width: 100px;
}

// Dark theme adjustments
.dark-theme {
  --q-background: #1e1e1e;
  --q-background-secondary: #2d2d30;
  --q-background-tertiary: #3e3e42;
  --q-background-hover: #464647;
  --q-text: #cccccc;
  --q-text-primary: #ffffff;
  --q-text-secondary: #969696;
  --q-separator: #3e3e42;
}

// Light theme (default)
:not(.dark-theme) {
  --q-background: #ffffff;
  --q-background-secondary: #f8f8f8;
  --q-background-tertiary: #f0f0f0;
  --q-background-hover: #e8e8e8;
  --q-text: #333333;
  --q-text-primary: #000000;
  --q-text-secondary: #666666;
  --q-separator: #e0e0e0;
}

// Responsive design
@media (max-width: 768px) {
  .menu-bar {
    padding: 0 8px;
  }
  
  .app-title {
    display: none;
  }
  
  .editor-tab {
    min-width: 100px;
    padding: 6px 8px;
  }
  
  .status-bar {
    padding: 0 8px;
  }
}
</style>