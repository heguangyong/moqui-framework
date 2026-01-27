<template>
  <div class="dashboard-panel">
    <!-- 项目分组 -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">项目</div>
        <span class="add-btn" @click="handleCreateProject">+</span>
      </div>
      <div class="section-items">
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'project-dashboard' }"
          @click="handleProjectClick('dashboard')"
        >
          <component :is="icons.grid" :size="16" />
          <span>概览</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'project-library' }"
          @click="handleProjectClick('library')"
        >
          <component :is="icons.book" :size="16" />
          <span>全部项目</span>
          <span v-if="projectCounts.total > 0" class="item-badge">{{ projectCounts.total }}</span>
        </div>
      </div>
    </div>
    
    <!-- 任务状态分组 -->
    <div class="section">
      <div class="section-title">任务</div>
      <div class="section-items">
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-running' }"
          @click="handleStatusClick('running')"
        >
          <component :is="icons.refresh" :size="16" />
          <span>进行中</span>
          <span v-if="taskCounts.running > 0" class="item-badge item-badge--highlight">{{ taskCounts.running }}</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'status-completed' }"
          @click="handleStatusClick('completed')"
        >
          <component :is="icons.check" :size="16" />
          <span>已完成</span>
          <span v-if="taskCounts.completed > 0" class="item-badge">{{ taskCounts.completed }}</span>
        </div>
      </div>
    </div>
    
    <!-- 快捷入口分组 -->
    <div class="section section--shortcuts">
      <div class="section-title">快捷入口</div>
      <div class="section-items">
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'shortcut-recent' }"
          @click="handleShortcutClick('recent')"
        >
          <component :is="icons.clock" :size="16" />
          <span>最近打开</span>
        </div>
        <div 
          class="section-item"
          :class="{ 'section-item--active': activeView === 'shortcut-favorites' }"
          @click="handleShortcutClick('favorites')"
        >
          <component :is="icons.star" :size="16" />
          <span>收藏</span>
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
        @rename="handleDocumentRename"
        @delete="handleDocumentDelete"
      />
    </div>
    
    <!-- 创建项目对话框 -->
    <InputDialog
      v-model:visible="showCreateProjectDialog"
      title="创建新项目"
      message="请输入项目名称"
      placeholder="例如：我的小说项目"
      :default-value="projectNameInput"
      @confirm="confirmCreateProject"
    />
    
    <!-- 创建文件夹对话框 -->
    <InputDialog
      v-model:visible="showCreateFolderDialog"
      title="创建文件夹"
      message="请输入文件夹名称"
      placeholder="例如：我的文件夹"
      :default-value="folderNameInput"
      @confirm="confirmCreateFolder"
    />
    
    <!-- 创建文件对话框 -->
    <InputDialog
      v-model:visible="showCreateFileDialog"
      title="创建文件"
      message="请输入文件名称"
      placeholder="例如：我的文件.txt"
      :default-value="fileNameInput"
      @confirm="confirmCreateFile"
    />
    
    <!-- 重命名对话框 -->
    <InputDialog
      v-model:visible="showRenameDialog"
      title="重命名"
      message="请输入新名称"
      :placeholder="renameInput"
      :default-value="renameInput"
      @confirm="confirmRename"
    />
    
    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-if="showDeleteConfirmDialog"
      title="确认删除"
      :message="`确定要删除 &quot;${deleteNodeName}&quot; 吗？此操作无法撤销。`"
      :confirm-text="'删除'"
      :cancel-text="'取消'"
      confirm-type="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirmDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProjectStore } from '../../stores/project';
import { useTaskStore } from '../../stores/task.js';
import { useFileStore } from '../../stores/file.js';
import { useUIStore } from '../../stores/ui.js';
import { useNavigationStore } from '../../stores/navigation';
import { icons } from '../../utils/icons.js';
import DocumentTree from '../explorer/DocumentTree.vue';
import InputDialog from '../dialogs/InputDialog.vue';
import ConfirmDialog from '../ui/ConfirmDialog.vue';

const router = useRouter();
const route = useRoute();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const fileStore = useFileStore();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();

// 统一的激活状态 - 同一时间只有一个按钮被高亮
const activeView = ref('project-dashboard');

// 输入对话框状态
const showCreateProjectDialog = ref(false);
const projectNameInput = ref('');
const showCreateFolderDialog = ref(false);
const folderNameInput = ref('');
const showCreateFileDialog = ref(false);
const fileNameInput = ref('');
const showRenameDialog = ref(false);
const renameInput = ref('');
const showDeleteConfirmDialog = ref(false);
const deleteNodeName = ref('');
const currentParentId = ref(null);
const currentNodeToRename = ref(null);
const currentNodeToDelete = ref(null);

// 计算属性
const projectCounts = computed(() => projectStore.projectCounts);
const taskCounts = computed(() => taskStore.taskCounts);

// 组件挂载时加载项目数据
onMounted(async () => {
  console.log('📊 DashboardPanel mounted, fetching projects...');
  await projectStore.fetchProjects();
  console.log('📊 Projects loaded, count:', projectStore.projects.length);
});

// 🔧 FIX: 监听路由变化，当切换到 dashboard 时刷新项目列表
watch(() => route.path, async (newPath, oldPath) => {
  if (newPath === '/dashboard' && oldPath && oldPath !== '/dashboard') {
    console.log('🔄 Switched to dashboard from', oldPath, ', refreshing projects...');
    await projectStore.fetchProjects();
    console.log('✅ Projects refreshed, count:', projectStore.projects.length);
  }
}, { immediate: false });

// 创建项目
function handleCreateProject() {
  projectNameInput.value = '';
  showCreateProjectDialog.value = true;
}

// 确认创建项目
async function confirmCreateProject(name) {
  if (name && name.trim()) {
    console.log('📝 DashboardPanel: Creating project:', name);
    const project = await projectStore.createProject({ 
      name: name.trim(),
      description: '新建的小说动漫项目',
      type: 'novel-to-anime'
    });
    
    if (project) {
      console.log('✅ DashboardPanel: Project created successfully:', project);
      uiStore.addNotification({
        type: 'success',
        title: '创建成功',
        message: `项目 "${name}" 已创建`,
        timeout: 2000
      });
      
      // Note: projectStore.createProject() now automatically calls fetchProjects()
      // No need to manually refresh here
      
      // 切换到项目库视图以显示新项目
      activeView.value = 'project-library';
      handleProjectClick('library');
    } else {
      console.error('❌ DashboardPanel: Project creation failed');
      uiStore.addNotification({
        type: 'error',
        title: '创建失败',
        message: projectStore.error || '无法创建项目，请重试',
        timeout: 5000
      });
    }
  }
  showCreateProjectDialog.value = false;
}

// 项目点击处理
function handleProjectClick(projectType) {
  console.log('🖱️ Project clicked:', projectType);
  activeView.value = `project-${projectType}`;
  
  // 更新面板上下文 - 主视图会监听这个变化
  const context = { 
    selectedProject: projectType === 'dashboard' ? null : projectType,
    viewType: projectType === 'dashboard' ? null : 'project',
    statusFilter: null,
    shortcutType: null
  };
  console.log('📤 Updating panelContext:', context);
  navigationStore.updatePanelContext('dashboard', context);
  console.log('✅ panelContext updated, current state:', navigationStore.panelContext.dashboard);
  
  // 确保导航到 dashboard 页面
  if (router.currentRoute.value.path !== '/dashboard') {
    console.log('🔄 Navigating to /dashboard');
    router.push('/dashboard');
  }
}

// 状态点击处理
function handleStatusClick(statusType) {
  console.log('🖱️ Status clicked:', statusType);
  activeView.value = `status-${statusType}`;
  
  // 更新面板上下文 - 主视图会监听这个变化
  const context = { 
    statusFilter: statusType,
    viewType: 'status',
    selectedProject: null,
    shortcutType: null
  };
  console.log('📤 Updating panelContext:', context);
  navigationStore.updatePanelContext('dashboard', context);
  console.log('✅ panelContext updated, current state:', navigationStore.panelContext.dashboard);
  
  // 确保导航到 dashboard 页面
  if (router.currentRoute.value.path !== '/dashboard') {
    console.log('🔄 Navigating to /dashboard');
    router.push('/dashboard');
  }
}

// 快捷入口点击处理
function handleShortcutClick(shortcutType) {
  console.log('🖱️ Shortcut clicked:', shortcutType);
  activeView.value = `shortcut-${shortcutType}`;
  
  // 更新面板上下文 - 主视图会监听这个变化
  const context = { 
    shortcutType: shortcutType,
    viewType: 'shortcut',
    selectedProject: null,
    statusFilter: null
  };
  console.log('📤 Updating panelContext:', context);
  navigationStore.updatePanelContext('dashboard', context);
  console.log('✅ panelContext updated, current state:', navigationStore.panelContext.dashboard);
  
  // 确保导航到 dashboard 页面
  if (router.currentRoute.value.path !== '/dashboard') {
    console.log('🔄 Navigating to /dashboard');
    router.push('/dashboard');
  }
}

// 文档操作
function handleCreateDocument() {
  currentParentId.value = null;
  folderNameInput.value = '';
  showCreateFolderDialog.value = true;
}

function confirmCreateFolder(name) {
  if (name && name.trim()) {
    fileStore.addFolder(currentParentId.value, { name: name.trim() });
    uiStore.addNotification({
      type: 'success',
      title: '创建成功',
      message: `文件夹 "${name}" 已创建`,
      timeout: 2000
    });
  }
  showCreateFolderDialog.value = false;
}

function confirmCreateFile(name) {
  if (name && name.trim()) {
    fileStore.addFile(currentParentId.value, { name: name.trim() });
    uiStore.addNotification({
      type: 'success',
      title: '创建成功',
      message: `文件 "${name}" 已创建`,
      timeout: 2000
    });
  }
  showCreateFileDialog.value = false;
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
  currentParentId.value = parentId;
  if (type === 'folder') {
    folderNameInput.value = '';
    showCreateFolderDialog.value = true;
  } else {
    fileNameInput.value = '';
    showCreateFileDialog.value = true;
  }
}

function handleDocumentRename(node) {
  currentNodeToRename.value = node;
  renameInput.value = node.name;
  showRenameDialog.value = true;
}

function confirmRename(newName) {
  if (newName && newName.trim() && currentNodeToRename.value) {
    fileStore.renameNode(currentNodeToRename.value.id, newName.trim());
    uiStore.addNotification({
      type: 'success',
      title: '重命名成功',
      message: `已重命名为 "${newName}"`,
      timeout: 2000
    });
  }
  showRenameDialog.value = false;
  currentNodeToRename.value = null;
}

function handleDocumentDelete(node) {
  currentNodeToDelete.value = node;
  deleteNodeName.value = node.name;
  showDeleteConfirmDialog.value = true;
}

function confirmDelete() {
  if (currentNodeToDelete.value) {
    fileStore.deleteNode(currentNodeToDelete.value.id);
    uiStore.addNotification({
      type: 'success',
      title: '删除成功',
      message: `"${deleteNodeName.value}" 已删除`,
      timeout: 2000
    });
  }
  showDeleteConfirmDialog.value = false;
  currentNodeToDelete.value = null;
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

.section--shortcuts {
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
  background: rgba(205, 214, 210, 0.45);
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
  background: #a1a1a1;
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
