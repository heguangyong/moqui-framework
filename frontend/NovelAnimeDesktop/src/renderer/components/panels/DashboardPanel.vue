<template>
  <div class="dashboard-panel">
    <!-- 项目分组 -->
    <div class="section">
      <div class="section-title">项目</div>
      <div class="section-items">
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'project-dashboard' }"
          @click="handleProjectClick('dashboard')"
        >
          <component :is="icons.grid" :size="16" />
          <span>仪表盘</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'project-library' }"
          @click="handleProjectClick('library')"
        >
          <component :is="icons.book" :size="16" />
          <span>我的项目</span>
          <span v-if="projectCounts.my > 0" class="item-badge">{{ projectCounts.my }}</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'project-shared' }"
          @click="handleProjectClick('shared')"
        >
          <component :is="icons.share" :size="16" />
          <span>共享项目</span>
          <span v-if="projectCounts.shared > 0" class="item-badge">{{ projectCounts.shared }}</span>
        </div>
      </div>
    </div>
    
    <!-- 状态分组 -->
    <div class="section">
      <div class="section-title">状态</div>
      <div class="section-items">
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-new' }"
          @click="handleStatusClick('new')"
        >
          <component :is="icons.circle" :size="16" />
          <span>新建</span>
          <span v-if="taskCounts.new > 0" class="item-badge">{{ taskCounts.new }}</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-running' }"
          @click="handleStatusClick('running')"
        >
          <component :is="icons.refresh" :size="16" />
          <span>处理中</span>
          <span v-if="taskCounts.running > 0" class="item-badge item-badge--highlight">{{ taskCounts.running }}</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-review' }"
          @click="handleStatusClick('review')"
        >
          <component :is="icons.users" :size="16" />
          <span>待审核</span>
          <span v-if="taskCounts.review > 0" class="item-badge">{{ taskCounts.review }}</span>
        </div>
      </div>
    </div>
    
    <!-- 历史分组 -->
    <div class="section section--history">
      <div class="section-title">历史</div>
      <div class="section-items">
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'history-recent' }"
          @click="handleHistoryClick('recent')"
        >
          <component :is="icons.clock" :size="16" />
          <span>最近编辑</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'history-archive' }"
          @click="handleHistoryClick('archive')"
        >
          <component :is="icons.archive" :size="16" />
          <span>归档</span>
        </div>
      </div>
    </div>
    
    <!-- 文档分组 -->
    <div class="section section--documents">
      <div class="section-header">
        <div class="section-title">文档</div>
        <span class="add-btn" @click="handleCreateDocument">+</span>
      </div>
      
      <!-- 文档树组件 -->
      <DocumentTree
        @select="handleDocumentSelect"
        @open="handleDocumentOpen"
        @create="handleDocumentCreate"
        @delete="handleDocumentDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../../stores/project.js';
import { useTaskStore } from '../../stores/task.js';
import { useFileStore } from '../../stores/file.js';
import { useUIStore } from '../../stores/ui.js';
import { useNavigationStore } from '../../stores/navigation.js';
import { icons } from '../../utils/icons.js';
import DocumentTree from '../explorer/DocumentTree.vue';

const router = useRouter();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const fileStore = useFileStore();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();

// 统一的激活状态 - 同一时间只有一个按钮被高亮
const activeView = ref('project-dashboard');

// 计算属性
const projectCounts = computed(() => projectStore.projectCounts);
const taskCounts = computed(() => taskStore.taskCounts);

// 项目点击处理
function handleProjectClick(projectType) {
  console.log('🖱️ Project clicked:', projectType);
  activeView.value = `project-${projectType}`;
  
  // 更新面板上下文 - 主视图会监听这个变化
  // 完全重置所有字段，确保不会残留之前的状态
  // 注意: 'dashboard' 类型应该显示默认仪表盘，所以 viewType 设为 null
  const context = { 
    selectedProject: projectType === 'dashboard' ? null : projectType,
    viewType: projectType === 'dashboard' ? null : 'project',
    statusFilter: null,
    historyType: null
  };
  console.log('📤 Updating panelContext:', context);
  navigationStore.updatePanelContext('dashboard', context);
  console.log('✅ panelContext updated, current state:', navigationStore.panelContext.dashboard);
}

// 状态点击处理
function handleStatusClick(statusType) {
  console.log('🖱️ Status clicked:', statusType);
  activeView.value = `status-${statusType}`;
  
  // 更新面板上下文 - 主视图会监听这个变化
  const context = { 
    statusFilter: statusType,
    viewType: 'status',
    selectedProject: null
  };
  console.log('📤 Updating panelContext:', context);
  navigationStore.updatePanelContext('dashboard', context);
  console.log('✅ panelContext updated, current state:', navigationStore.panelContext.dashboard);
}

// 历史记录点击处理
function handleHistoryClick(historyType) {
  console.log('🖱️ History clicked:', historyType);
  activeView.value = `history-${historyType}`;
  
  // 更新面板上下文 - 主视图会监听这个变化
  const context = { 
    historyType: historyType,
    viewType: 'history',
    selectedProject: null,
    statusFilter: null
  };
  console.log('📤 Updating panelContext:', context);
  navigationStore.updatePanelContext('dashboard', context);
  console.log('✅ panelContext updated, current state:', navigationStore.panelContext.dashboard);
}

// 文档操作
function handleCreateDocument() {
  const name = prompt('请输入文件夹名称:');
  if (name && name.trim()) {
    fileStore.addFolder(null, { name: name.trim() });
    uiStore.addNotification({
      type: 'success',
      title: '创建成功',
      message: `文件夹 "${name}" 已创建`,
      timeout: 2000
    });
  }
}

function handleDocumentSelect(node) {
  // 文件选中时不显示通知，直接处理选中逻辑
  console.log('Selected:', node.name);
}

function handleDocumentOpen(node) {
  const fileType = node.fileType || 'other';
  switch (fileType) {
    case 'novel':
      router.push(`/edit/novel/${node.id}`);
      break;
    case 'script':
      router.push(`/edit/script/${node.id}`);
      break;
    case 'storyboard':
      router.push(`/edit/storyboard/${node.id}`);
      break;
    case 'video':
      router.push(`/preview/video/${node.id}`);
      break;
    default:
      router.push(`/edit/file/${node.id}`);
  }
}

function handleDocumentCreate({ type, parentId }) {
  if (type === 'folder') {
    const name = prompt('请输入文件夹名称:');
    if (name && name.trim()) {
      fileStore.addFolder(parentId, { name: name.trim() });
      uiStore.addNotification({
        type: 'success',
        title: '创建成功',
        message: `文件夹 "${name}" 已创建`,
        timeout: 2000
      });
    }
  } else {
    const name = prompt('请输入文件名称:');
    if (name && name.trim()) {
      fileStore.addFile(parentId, { name: name.trim() });
      uiStore.addNotification({
        type: 'success',
        title: '创建成功',
        message: `文件 "${name}" 已创建`,
        timeout: 2000
      });
    }
  }
}

function handleDocumentDelete(node) {
  uiStore.addNotification({
    type: 'success',
    title: '删除成功',
    message: `"${node.name}" 已删除`,
    timeout: 2000
  });
}
</script>

<style scoped>
.dashboard-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 分组区域样式 */
.section {
  padding: 10px 14px;
  position: relative;
}

.section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
}

.section:last-child::after {
  display: none;
}

.section--history {
  flex-shrink: 0;
}

.section--documents {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 14px;
}

.section--documents::after {
  display: none;
}

.section-title {
  font-size: 9px;
  font-weight: 700;
  color: #9a9a9a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.08),
    0 -1px 0 rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.add-btn {
  background: transparent;
  border: 1.5px dashed #8a8a8a;
  color: #2c2c2e;
  cursor: pointer;
  padding: 0;
  padding-bottom: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 700;
  line-height: 0;
}

.add-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: #6a6a6a;
  color: #6a6a6a;
}

.section-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 8px;
  font-size: 13px;
  color: #5a5a5c;
  background: transparent;
  border: none;
  border-radius: 0;
}

.section-item:hover {
  color: #2c2c2e;
}

.section-item--active {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  backdrop-filter: blur(10px);
  color: #2c2c2e;
  position: relative;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.section-item--active::after {
  content: '';
  position: absolute;
  right: -14px;
  top: 3px;
  bottom: 3px;
  width: 5px;
  background: linear-gradient(90deg, #8a8a8a, #b8b8b8);
  border-radius: 3px;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.section-item span {
  flex: 1;
}

.item-badge {
  background-color: #b0b0b0;
  color: #5a5a5c;
  font-size: 10px;
  font-weight: 600;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
  min-height: 18px !important;
  max-width: 18px !important;
  max-height: 18px !important;
  border-radius: 50% !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  flex-shrink: 0;
  padding: 0 !important;
  line-height: 1;
}

.section-item--active .item-badge {
  background-color: #e8e8e8;
}

.item-badge--highlight {
  background-color: #b0b0b0;
}
</style>
