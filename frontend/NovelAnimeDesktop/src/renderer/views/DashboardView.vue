<template>
  <div class="dashboard-view">
    <!-- 根据 panelContext 显示不同内容 -->
    
    <!-- 状态视图 - 新建 -->
    <template v-if="currentViewType === 'status' && statusFilter === 'new'">
      <div class="view-header">
        <h2>新建任务</h2>
        <p>等待处理的新任务</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.circle" :size="48" />
        <span>新建任务列表</span>
        <p>这里将显示所有新建的任务</p>
      </div>
    </template>
    
    <!-- 状态视图 - 处理中 -->
    <template v-else-if="currentViewType === 'status' && statusFilter === 'running'">
      <div class="view-header">
        <h2>处理中</h2>
        <p>正在处理的任务</p>
      </div>
      <ProcessingTaskList />
    </template>
    
    <!-- 状态视图 - 待审核 -->
    <template v-else-if="currentViewType === 'status' && statusFilter === 'review'">
      <div class="view-header">
        <h2>待审核</h2>
        <p>等待审核的任务</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.users" :size="48" />
        <span>待审核任务列表</span>
        <p>这里将显示等待审核的任务</p>
      </div>
    </template>
    
    <!-- 历史视图 -->
    <template v-else-if="currentViewType === 'history'">
      <div class="view-header">
        <h2>{{ historyType === 'recent' ? '最近编辑' : '归档' }}</h2>
        <p>{{ historyType === 'recent' ? '您最近编辑的文件' : '已归档的项目和文件' }}</p>
      </div>
      <div class="content-placeholder">
        <component :is="historyType === 'recent' ? icons.clock : icons.archive" :size="48" />
        <span>{{ historyType === 'recent' ? '最近编辑列表' : '归档列表' }}</span>
      </div>
    </template>

    <!-- 我的项目视图 -->
    <template v-else-if="currentViewType === 'project' && selectedProject === 'library'">
      <div class="view-header">
        <h2>我的项目</h2>
        <p>管理您创建的所有项目</p>
      </div>
      <ProjectList />
    </template>
    
    <!-- 共享项目视图 -->
    <template v-else-if="currentViewType === 'project' && selectedProject === 'shared'">
      <div class="view-header">
        <h2>共享项目</h2>
        <p>与您共享的项目</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.share" :size="48" />
        <span>共享项目列表</span>
        <p>这里将显示与您共享的项目</p>
      </div>
    </template>
    
    <!-- 默认仪表盘视图 - 向导式流程 -->
    <template v-else>
      <div class="dashboard-header">
        <h1>小说动漫生成器</h1>
        <p>将您的小说转换为精彩动漫，只需四步</p>
      </div>
      
      <!-- 向导式流程步骤 -->
      <div class="workflow-guide">
        <h3 class="section-title">快速开始</h3>
        <div class="steps-container">
          <div 
            v-for="(step, index) in workflowSteps" 
            :key="step.id"
            class="step-card"
            :class="{ 
              'step-card--active': currentStep === index,
              'step-card--completed': step.completed,
              'step-card--disabled': !step.enabled
            }"
            @click="handleStepClick(step, index)"
          >
            <div class="step-number" :class="{ 'step-number--completed': step.completed }">
              <component v-if="step.completed" :is="icons.check" :size="14" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="step-content">
              <div class="step-icon">
                <component :is="step.icon" :size="24" />
              </div>
              <div class="step-info">
                <h4 class="step-title">{{ step.title }}</h4>
                <p class="step-description">{{ step.description }}</p>
              </div>
            </div>
            <div class="step-action">
              <button 
                v-if="step.actionLabel && (currentStep === index || step.completed)"
                class="step-btn"
                :class="{ 'step-btn--primary': currentStep === index }"
                @click.stop="handleStepAction(step)"
                :disabled="!step.enabled"
              >
                {{ step.actionLabel }}
              </button>
              <span v-else-if="step.actionLabel" class="step-btn-placeholder">
                {{ step.actionLabel }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前进行中的项目 -->
      <div v-if="activeProject" class="active-project-section">
        <h3 class="section-title">当前项目</h3>
        <div class="active-project-card">
          <div class="project-info">
            <div class="project-icon">
              <component :is="icons.folder" :size="24" />
            </div>
            <div class="project-details">
              <h4>{{ activeProject.name }}</h4>
              <p>{{ activeProject.status }} · {{ activeProject.progress }}% 完成</p>
            </div>
          </div>
          <div class="project-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: activeProject.progress + '%' }"></div>
            </div>
          </div>
          <button class="continue-btn" @click="continueProject">
            继续处理
            <component :is="icons.arrowRight" :size="16" />
          </button>
        </div>
      </div>
      
      <!-- 最近项目 -->
      <div v-if="recentProjects.length > 0" class="recent-projects-section">
        <h3 class="section-title">最近项目</h3>
        <div class="project-list">
          <div 
            v-for="project in recentProjects" 
            :key="project.id"
            class="project-item"
            @click="openProject(project)"
          >
            <div class="project-icon-small">
              <component :is="icons.fileText" :size="16" />
            </div>
            <div class="project-item-info">
              <span class="project-name">{{ project.name }}</span>
              <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
            </div>
            <component :is="icons.chevronRight" :size="16" class="project-arrow" />
          </div>
        </div>
      </div>
      
      <!-- 系统状态 -->
      <div class="status-section">
        <h3 class="section-title">系统状态</h3>
        <div class="status-grid">
          <div class="status-item" :class="{ 'status-item--ok': backendStatus }">
            <component :is="backendStatus ? icons.check : icons.x" :size="14" />
            <span>后端服务{{ backendStatus ? '已连接' : '未连接' }}</span>
          </div>
          <div class="status-item status-item--ok">
            <component :is="icons.check" :size="14" />
            <span>前端应用正常</span>
          </div>
          <div class="status-item" :class="{ 'status-item--ok': aiServiceStatus }">
            <component :is="aiServiceStatus ? icons.check : icons.alertCircle" :size="14" />
            <span>AI服务{{ aiServiceStatus ? '可用' : '配置中' }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNavigationStore } from '../stores/navigation.js';
import { useProjectStore } from '../stores/project.js';
import { icons } from '../utils/icons.js';
import { apiService } from '../services/api.ts';

const router = useRouter();
const navigationStore = useNavigationStore();
const projectStore = useProjectStore();

// 从 panelContext 获取当前视图状态
const dashboardContext = computed(() => navigationStore.panelContext.dashboard);
const currentViewType = computed(() => dashboardContext.value?.viewType);
const selectedProject = computed(() => dashboardContext.value?.selectedProject);
const statusFilter = computed(() => dashboardContext.value?.statusFilter);
const historyType = computed(() => dashboardContext.value?.historyType);

// 当前步骤
const currentStep = ref(0);

// 系统状态
const backendStatus = ref(false);
const aiServiceStatus = ref(false);

// 向导式流程步骤
const workflowSteps = ref([
  {
    id: 'import',
    title: '导入小说',
    description: '支持 TXT、DOCX、PDF 格式的小说文件，或直接粘贴文本',
    icon: icons.upload,
    actionLabel: '选择文件',
    action: 'import',
    enabled: true,
    completed: false
  },
  {
    id: 'parse',
    title: '智能解析',
    description: '自动识别章节结构，分析文本内容',
    icon: icons.search,
    actionLabel: '开始解析',
    action: 'parse',
    enabled: false,
    completed: false
  },
  {
    id: 'characters',
    title: '角色确认',
    description: '审核和编辑 AI 识别出的角色信息',
    icon: icons.users,
    actionLabel: '查看角色',
    action: 'characters',
    enabled: false,
    completed: false
  },
  {
    id: 'generate',
    title: '生成动漫',
    description: '配置工作流参数，开始生成动漫内容',
    icon: icons.play,
    actionLabel: '开始生成',
    action: 'generate',
    enabled: false,
    completed: false
  }
]);

// 当前进行中的项目
const activeProject = ref(null);

// 最近项目
const recentProjects = computed(() => {
  return projectStore.recentProjects?.slice(0, 5) || [];
});

// 监听 panelContext 变化
watch(dashboardContext, (newVal) => {
  console.log('👀 Dashboard panelContext changed:', JSON.stringify(newVal));
}, { deep: true, immediate: true });

onMounted(async () => {
  console.log('📊 DashboardView mounted');
  await checkSystemStatus();
  await loadActiveProject();
});

// 检查系统状态
async function checkSystemStatus() {
  try {
    backendStatus.value = await apiService.testConnection();
    // AI服务状态暂时设为与后端一致
    aiServiceStatus.value = backendStatus.value;
  } catch (error) {
    console.warn('Failed to check system status:', error);
    backendStatus.value = false;
    aiServiceStatus.value = false;
  }
}

// 加载当前进行中的项目
async function loadActiveProject() {
  // 从 store 或 API 获取当前项目
  const current = projectStore.currentProject;
  if (current && current.status !== 'completed') {
    activeProject.value = {
      ...current,
      progress: calculateProgress(current)
    };
    // 根据项目状态更新步骤
    updateStepsFromProject(current);
  }
}

// 计算项目进度
function calculateProgress(project) {
  if (!project) return 0;
  const stages = ['imported', 'parsed', 'characters_confirmed', 'completed'];
  const currentIndex = stages.indexOf(project.status);
  return Math.round((currentIndex + 1) / stages.length * 100);
}

// 根据项目状态更新步骤
function updateStepsFromProject(project) {
  if (!project) return;
  
  const statusMap = {
    'imported': 0,
    'parsed': 1,
    'characters_confirmed': 2,
    'completed': 3
  };
  
  const completedIndex = statusMap[project.status] || 0;
  
  workflowSteps.value.forEach((step, index) => {
    step.completed = index < completedIndex;
    step.enabled = index <= completedIndex;
  });
  
  currentStep.value = completedIndex;
}

// 步骤点击处理
function handleStepClick(step, index) {
  if (step.enabled || step.completed) {
    currentStep.value = index;
  }
}

// 步骤操作处理
function handleStepAction(step) {
  switch (step.action) {
    case 'import':
      importNovel();
      break;
    case 'parse':
      startParsing();
      break;
    case 'characters':
      router.push('/characters');
      break;
    case 'generate':
      router.push('/workflow');
      break;
  }
}

// 隐藏的文件输入引用
const fileInputRef = ref(null);

// 导入小说
async function importNovel() {
  console.log('📂 importNovel called, electronAPI:', !!window.electronAPI);
  
  if (window.electronAPI && window.electronAPI.openFile) {
    // Electron 模式：使用原生对话框
    try {
      console.log('🖥️ Using Electron file dialog');
      const filePath = await window.electronAPI.openFile({
        filters: [
          { name: '小说文件', extensions: ['txt', 'docx', 'pdf', 'epub', 'md'] }
        ]
      });
      
      if (filePath) {
        console.log('📄 File selected:', filePath);
        handleFileSelected(filePath);
      }
    } catch (error) {
      console.error('Electron file dialog failed:', error);
      // 回退到 HTML input
      triggerFileInput();
    }
  } else {
    // Web 模式：使用 HTML input 元素
    console.log('🌐 Using HTML file input');
    triggerFileInput();
  }
}

// 触发文件选择
function triggerFileInput() {
  // 创建一个临时的 input 元素
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.docx,.pdf,.epub,.md';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📄 File selected via input:', file.name);
      handleFileSelected(file.name, file);
    }
  };
  input.click();
}

// 处理文件选择
function handleFileSelected(filePath, file = null) {
  // 更新步骤状态
  workflowSteps.value[0].completed = true;
  workflowSteps.value[1].enabled = true;
  currentStep.value = 1;
  
  // 存储文件路径，准备解析
  navigationStore.startImport(filePath);
  
  // 如果有文件对象，可以读取内容
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      console.log('📖 File content loaded, length:', content.length);
      // 可以将内容存储到 store 中
    };
    reader.readAsText(file);
  }
  
  // 跳转到测试页面（那里有 NovelImporter 组件可以继续处理）
  router.push('/test');
}

// 开始解析
async function startParsing() {
  // 跳转到工作流页面进行解析
  router.push('/workflow');
}

// 继续处理项目
function continueProject() {
  if (activeProject.value) {
    router.push(`/project/${activeProject.value.id}/detail`);
  }
}

// 打开项目
function openProject(project) {
  projectStore.setCurrentProject(project);
  router.push(`/project/${project.id}/detail`);
}

// 格式化日期
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 86400000) {
    return '今天';
  } else if (diff < 172800000) {
    return '昨天';
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 占位组件
const ProcessingTaskList = { template: '<div class="content-placeholder"><span>处理中的任务列表</span></div>' };
const ProjectList = { template: '<div class="content-placeholder"><span>项目列表</span></div>' };
</script>

<style scoped>
.dashboard-view {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  overflow-y: auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 8px;
}

.dashboard-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.dashboard-header p {
  font-size: 14px;
  color: #6c6c6e;
  margin: 0;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6c6c6e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

/* 向导式流程步骤 */
.workflow-guide {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-card:hover:not(.step-card--disabled) {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.1);
}

.step-card--active {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(100, 140, 120, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.step-card--completed {
  background: rgba(100, 160, 130, 0.1);
  border-color: rgba(100, 160, 130, 0.2);
}

.step-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #8a8a8c;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-card--active .step-number {
  background: rgba(100, 140, 120, 0.2);
  border-color: rgba(100, 140, 120, 0.3);
  color: #4a6a52;
}

.step-number--completed {
  background: rgba(100, 160, 130, 0.3) !important;
  border-color: rgba(100, 160, 130, 0.4) !important;
  color: #3a6a4a !important;
}

.step-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-icon {
  color: #7a7a7c;
}

.step-card--active .step-icon {
  color: #5a6a5e;
}

.step-card--completed .step-icon {
  color: #4a7a5a;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 2px 0;
}

.step-description {
  font-size: 12px;
  color: #7a7a7c;
  margin: 0;
}

.step-action {
  flex-shrink: 0;
}

.step-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  color: #5a5a5c;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.step-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.18);
}

.step-btn--primary {
  background: rgba(100, 140, 120, 0.25);
  border-color: rgba(100, 140, 120, 0.35);
  color: #3a5a42;
}

.step-btn--primary:hover:not(:disabled) {
  background: rgba(100, 140, 120, 0.35);
}

.step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-btn-placeholder {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  color: #a0a0a2;
  font-size: 12px;
}

/* 当前项目卡片 */
.active-project-section {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.active-project-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(100, 140, 120, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5a7a62;
}

.project-details h4 {
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 2px 0;
}

.project-details p {
  font-size: 12px;
  color: #7a7a7c;
  margin: 0;
}

.project-progress {
  padding: 0 4px;
}

.progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6a9a7a, #8ab89a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.continue-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  background: rgba(100, 140, 120, 0.2);
  border: 1px solid rgba(100, 140, 120, 0.3);
  border-radius: 8px;
  color: #3a5a42;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.continue-btn:hover {
  background: rgba(100, 140, 120, 0.3);
}

/* 最近项目列表 */
.recent-projects-section {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.project-item:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.08);
}

.project-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7a7a7c;
}

.project-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.project-name {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

.project-date {
  font-size: 11px;
  color: #8a8a8c;
}

.project-arrow {
  color: #b0b0b2;
}

/* 系统状态 */
.status-section {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  padding: 16px;
}

.status-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(200, 100, 100, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: #8a5050;
}

.status-item--ok {
  background: rgba(100, 160, 130, 0.1);
  color: #4a7a5a;
}

/* 视图头部 */
.view-header {
  margin-bottom: 16px;
}

.view-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.view-header p {
  font-size: 13px;
  color: #6c6c6e;
  margin: 0;
}

/* 内容占位符 */
.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #8a8a8c;
  gap: 12px;
  text-align: center;
}

.content-placeholder span {
  font-size: 16px;
  font-weight: 500;
  color: #5a5a5c;
}
</style>
