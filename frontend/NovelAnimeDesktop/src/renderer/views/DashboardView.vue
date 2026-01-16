<template>
  <div class="dashboard-view">
    <!-- 根据 panelContext 显示不同内容 -->
    
    <!-- 状态视图 - 进行中 -->
    <template v-if="currentViewType === 'status' && statusFilter === 'running'">
      <div class="view-header">
        <h2>进行中</h2>
        <p>正在处理的任务</p>
      </div>
      <ProcessingTaskList />
    </template>
    
    <!-- 状态视图 - 已完成 -->
    <template v-else-if="currentViewType === 'status' && statusFilter === 'completed'">
      <div class="view-header">
        <h2>已完成</h2>
        <p>已完成的任务</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.check" :size="48" />
        <span>已完成任务列表</span>
        <p>这里将显示所有已完成的任务</p>
      </div>
    </template>
    
    <!-- 快捷入口 - 最近打开 -->
    <template v-else-if="currentViewType === 'shortcut' && shortcutType === 'recent'">
      <div class="view-header">
        <h2>最近打开</h2>
        <p>您最近打开的项目和文件</p>
      </div>
      <div v-if="recentProjects.length > 0" class="recent-projects-section">
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
      <div v-else class="content-placeholder">
        <component :is="icons.clock" :size="48" />
        <span>暂无最近打开的项目</span>
      </div>
    </template>
    
    <!-- 快捷入口 - 收藏 -->
    <template v-else-if="currentViewType === 'shortcut' && shortcutType === 'favorites'">
      <div class="view-header">
        <h2>收藏</h2>
        <p>您收藏的项目和文件</p>
      </div>
      <div class="content-placeholder">
        <component :is="icons.star" :size="48" />
        <span>暂无收藏</span>
        <p>点击项目右侧的星标可添加收藏</p>
      </div>
    </template>

    <!-- 全部项目视图 -->
    <template v-else-if="currentViewType === 'project' && selectedProject === 'library'">
      <div class="view-header">
        <h2>全部项目</h2>
        <p>管理您的所有项目</p>
      </div>
      <ProjectList />
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
                :class="{ 
                  'step-btn--primary': currentStep === index && !step.completed,
                  'step-btn--completed': step.completed
                }"
                @click.stop="handleStepAction(step)"
                :disabled="!step.enabled || isImporting"
              >
                {{ getStepButtonLabel(step) }}
              </button>
              <span v-else-if="step.actionLabel" class="step-btn-placeholder">
                {{ step.actionLabel }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 导入进度显示 -->
        <div v-if="isImporting" class="import-progress-section">
          <div class="progress-header">
            <span class="progress-message">{{ importMessage }}</span>
            <span class="progress-percent">{{ importProgress }}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: importProgress + '%' }"></div>
          </div>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="importError" class="import-error">
          <component :is="icons.alertCircle" :size="16" />
          <span>{{ importError }}</span>
          <button class="error-close" @click="importError = ''">×</button>
        </div>
      </div>

      <!-- 当前进行中的项目 -->
      <div v-if="activeProject" class="active-project-section">
        <h3 class="section-title">当前项目</h3>
        <div class="active-project-card" :class="{ 'active-project-card--completed': activeProject.status === 'completed' }">
          <div class="project-info">
            <div class="project-icon" :class="{ 'project-icon--completed': activeProject.status === 'completed' }">
              <component :is="activeProject.status === 'completed' ? icons.check : icons.folder" :size="24" />
            </div>
            <div class="project-details">
              <h4>{{ activeProject.name }}</h4>
              <p>{{ getStatusText(activeProject.status) }} · {{ activeProject.progress }}% 完成</p>
            </div>
          </div>
          <div class="project-progress">
            <div class="progress-bar" :class="{ 'progress-bar--completed': activeProject.status === 'completed' }">
              <div class="progress-fill" :class="{ 'progress-fill--completed': activeProject.status === 'completed' }" :style="{ width: activeProject.progress + '%' }"></div>
            </div>
          </div>
          <!-- 已完成：显示查看结果和新建项目按钮 -->
          <template v-if="activeProject.status === 'completed'">
            <button class="continue-btn continue-btn--success" @click="viewResults">
              查看结果
              <component :is="icons.eye" :size="16" />
            </button>
            <button class="continue-btn continue-btn--secondary" @click="startNewProject">
              新建项目
              <component :is="icons.plus" :size="16" />
            </button>
          </template>
          <!-- 未完成：显示继续处理按钮 -->
          <template v-else>
            <button class="continue-btn" @click="continueProject">
              继续处理
              <component :is="icons.arrowRight" :size="16" />
            </button>
          </template>
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
import { ref, computed, onMounted, watch, h } from 'vue';
import { useRouter } from 'vue-router';
import { useNavigationStore } from '../stores/navigation.js';
import { useProjectStore } from '../stores/project.js';
import { icons } from '../utils/icons.js';
import { apiService, novelApi, pipelineApi } from '../services/index.ts';

const router = useRouter();
const navigationStore = useNavigationStore();
const projectStore = useProjectStore();

// 从 panelContext 获取当前视图状态
const dashboardContext = computed(() => navigationStore.panelContext.dashboard);
const currentViewType = computed(() => dashboardContext.value?.viewType);
const selectedProject = computed(() => dashboardContext.value?.selectedProject);
const statusFilter = computed(() => dashboardContext.value?.statusFilter);
const shortcutType = computed(() => dashboardContext.value?.shortcutType);

// 当前步骤
const currentStep = ref(0);

// 系统状态
const backendStatus = ref(false);
const aiServiceStatus = ref(false);

// 导入状态
const isImporting = ref(false);
const importProgress = ref(0);
const importMessage = ref('');
const importError = ref('');
const currentNovelId = ref(null);

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
    // 检测后端连接
    backendStatus.value = await apiService.testConnection();
    console.log('🔌 Backend status:', backendStatus.value ? 'Connected' : 'Disconnected');
    
    // 检测 AI 服务状态
    if (backendStatus.value) {
      aiServiceStatus.value = await apiService.testAIService();
    } else {
      aiServiceStatus.value = false;
    }
    console.log('🤖 AI service status:', aiServiceStatus.value ? 'Available' : 'Configuring');
  } catch (error) {
    console.warn('Failed to check system status:', error);
    backendStatus.value = false;
    aiServiceStatus.value = false;
  }
}

// 加载当前进行中的项目
async function loadActiveProject() {
  // 检查是否处于"新建项目"模式
  // 如果 workflowState.stage 是 idle 且 projectStore 中没有当前项目，说明用户想新建项目
  // 此时不应该从后端加载旧项目
  if (navigationStore.workflowState.stage === 'idle' && !projectStore.currentProject) {
    console.log('📊 New project mode detected, skipping project load');
    activeProject.value = null;
    currentNovelId.value = null;
    // 确保步骤状态正确
    workflowSteps.value.forEach((step, index) => {
      step.completed = false;
      step.enabled = index === 0;
    });
    currentStep.value = 0;
    return;
  }

  // 从 store 获取当前项目
  let current = projectStore.currentProject;

  // 如果 store 中没有，尝试从 API 获取用户的项目列表
  if (!current) {
    try {
      const result = await apiService.getProjects();
      if (result.success && result.projects && result.projects.length > 0) {
        // 找到第一个未完成的项目
        current =
          result.projects.find((p) => p.status !== 'completed') ||
          result.projects[0];
        if (current) {
          projectStore.setCurrentProject(current);
        }
      }
    } catch (error) {
      console.warn('Failed to load projects from API:', error);
    }
  }

  if (current) {
    const projectId = current.id || current.projectId;
    
    // 首先从后端获取项目的最新状态
    if (projectId) {
      try {
        console.log('📊 Fetching latest project status from backend for:', projectId);
        const response = await apiService.axiosInstance.get(`/project/${projectId}`);
        if (response.data && response.data.project) {
          current = {
            ...current,
            ...response.data.project,
            id: projectId
          };
          console.log('📊 Got latest project from backend:', current);
          // 更新 store 中的项目数据
          projectStore.setCurrentProject(current);
        }
      } catch (error) {
        console.warn('Failed to fetch latest project status, using cached data:', error);
      }
    }
    
    activeProject.value = {
      ...current,
      id: projectId,
      progress: calculateProgress(current),
    };

    // 尝试加载项目的小说列表，获取 novelId
    if (projectId) {
      try {
        console.log('📚 Loading novels for project:', projectId);
        const result = await novelApi.listNovels(projectId);
        console.log('📚 Novels result:', result);

        if (result.success && result.novels && result.novels.length > 0) {
          // 使用第一个小说的 ID
          currentNovelId.value = result.novels[0].novelId;
          console.log('📚 Loaded novelId from project:', currentNovelId.value);

          // 只有当项目状态不是 completed 时，才用小说状态更新
          // 项目状态 completed 优先级最高，不应被覆盖
          const novelStatus = result.novels[0].status;
          if (novelStatus && activeProject.value.status !== 'completed') {
            activeProject.value.status = novelStatus;
            // 重新计算进度
            activeProject.value.progress = calculateProgress(activeProject.value);
          }
        }
      } catch (error) {
        console.warn('Failed to load novels for project:', error);
      }
    }

    // 如果还是没有 novelId，尝试从 localStorage 恢复
    if (!currentNovelId.value) {
      const storedNovelId = localStorage.getItem('novel_anime_current_novel_id');
      if (storedNovelId) {
        currentNovelId.value = storedNovelId;
        console.log('📚 Restored novelId from localStorage:', currentNovelId.value);
        // 只有当项目状态不是 completed 且状态不明确时，才设置为 imported
        if (activeProject.value.status !== 'completed' && 
            (!activeProject.value.status || activeProject.value.status === 'active')) {
          activeProject.value.status = 'imported';
          // 重新计算进度
          activeProject.value.progress = calculateProgress(activeProject.value);
        }
      }
    }

    // 优先检查 workflowState.stage
    // 如果工作流已完成，强制更新项目状态
    if (navigationStore.workflowState.stage === 'completed') {
      console.log('📊 Workflow completed in workflowState, forcing status to completed');
      activeProject.value.status = 'completed';
      activeProject.value.progress = 100;
    }
    // 如果角色已确认但工作流未完成，显示 75% 进度
    else if (navigationStore.workflowState.charactersConfirmed) {
      console.log('📊 Characters already confirmed in workflowState, forcing status to characters_confirmed');
      activeProject.value.status = 'characters_confirmed';
      activeProject.value.progress = 75;
    }
    
    // 根据项目状态更新步骤
    updateStepsFromProject(activeProject.value);
    
    // 根据项目状态同步工作流状态
    syncWorkflowStateFromProject(activeProject.value);
  }

  console.log(
    '📊 Active project loaded:',
    activeProject.value,
    'novelId:',
    currentNovelId.value,
    'workflowState:',
    navigationStore.workflowState
  );
}

// 计算项目进度
function calculateProgress(project) {
  if (!project) return 0;

  // 状态到进度百分比的映射
  const progressMap = {
    active: 25, // 活跃状态（已导入）
    importing: 10,
    imported: 25,
    analyzing: 35, // 分析中
    analyzed: 50, // 已分析（等同于 parsed）
    parsing: 35,
    parsed: 50,
    characters_confirmed: 75,
    generating: 85,
    completed: 100,
  };

  return progressMap[project.status] || 0;
}

// 根据项目状态更新步骤
function updateStepsFromProject(project) {
  if (!project) return;

  // 优先检查 workflowState.stage === 'completed'
  if (navigationStore.workflowState.stage === 'completed') {
    console.log('📊 Workflow completed in workflowState, setting all steps completed');
    workflowSteps.value.forEach((step) => {
      step.completed = true;
      step.enabled = true;
    });
    currentStep.value = 3;
    // 同时更新项目进度显示
    if (activeProject.value) {
      activeProject.value.progress = 100;
      activeProject.value.status = 'completed';
    }
    return;
  }

  // 检查 navigationStore.workflowState.charactersConfirmed
  if (navigationStore.workflowState.charactersConfirmed) {
    console.log('📊 Characters confirmed in workflowState, setting step to 3');
    workflowSteps.value.forEach((step, index) => {
      step.completed = index < 3;
      step.enabled = index <= 3;
    });
    currentStep.value = 3;
    // 同时更新项目进度显示
    if (activeProject.value) {
      activeProject.value.progress = 75;
      activeProject.value.status = 'characters_confirmed';
    }
    return;
  }

  // 状态到当前步骤的映射
  const statusMap = {
    active: 1, // 活跃状态（已导入）-> 步骤1（解析）
    importing: 0, // 导入中 -> 步骤0
    imported: 1, // 已导入 -> 步骤1（解析）
    analyzing: 1, // 分析中 -> 步骤1
    analyzed: 2, // 已分析 -> 步骤2（角色确认）
    parsing: 1, // 解析中 -> 步骤1
    parsed: 2, // 已解析 -> 步骤2（角色确认）
    characters_confirmed: 3, // 角色已确认 -> 步骤3（生成）
    generating: 3, // 生成中 -> 步骤3
    completed: 4, // 已完成 -> 全部完成
  };

  const currentStepIndex = statusMap[project.status] ?? 0;
  
  workflowSteps.value.forEach((step, index) => {
    step.completed = index < currentStepIndex;
    step.enabled = index <= currentStepIndex;
  });
  
  // 设置当前步骤（不超过最大步骤索引）
  currentStep.value = Math.min(currentStepIndex, workflowSteps.value.length - 1);
}

// 根据项目状态同步工作流状态
function syncWorkflowStateFromProject(project) {
  if (!project) return;
  
  const status = project.status;
  console.log('🔄 Syncing workflow state from project status:', status);
  
  // 根据项目状态设置工作流阶段
  if (status === 'analyzed' || status === 'parsed') {
    // 解析完成，进入角色审核阶段
    if (navigationStore.workflowState.stage !== 'character-review' && 
        navigationStore.workflowState.stage !== 'workflow-ready' &&
        navigationStore.workflowState.stage !== 'executing' &&
        navigationStore.workflowState.stage !== 'completed') {
      navigationStore.setParseResult({
        chaptersCreated: 0,
        scenesCreated: 0,
        charactersExtracted: 0
      });
      console.log('🔄 Set workflow stage to character-review');
    }
  } else if (status === 'characters_confirmed') {
    // 角色已确认，进入工作流就绪阶段
    if (!navigationStore.workflowState.charactersConfirmed) {
      navigationStore.confirmCharacters();
      console.log('🔄 Set workflow stage to workflow-ready');
    }
  } else if (status === 'generating') {
    // 生成中
    if (navigationStore.workflowState.stage !== 'executing') {
      navigationStore.startExecution();
      console.log('🔄 Set workflow stage to executing');
    }
  } else if (status === 'completed') {
    // 已完成
    if (navigationStore.workflowState.stage !== 'completed') {
      navigationStore.setExecutionResult({});
      console.log('🔄 Set workflow stage to completed');
    }
  }
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
      viewCharacters();
      break;
    case 'generate':
      // 如果已完成，跳转到查看结果
      if (step.completed) {
        viewResults();
      } else {
        // 跳转到工作流页面，并设置为模板选择视图
        navigationStore.updatePanelContext('workflow', {
          viewType: 'template',
          templateId: 't1', // 默认选择"标准转换流程"模板
          selectedWorkflow: null,
          statusFilter: null,
          executionId: null
        });
        router.push('/workflow');
      }
      break;
  }
}

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
        await handleElectronFile(filePath);
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
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.docx,.pdf,.epub,.md';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📄 File selected via input:', file.name);
      await handleWebFile(file);
    }
  };
  input.click();
}

// 处理 Electron 文件选择
async function handleElectronFile(filePath) {
  isImporting.value = true;
  importProgress.value = 10;
  importMessage.value = '正在读取文件...';
  importError.value = '';
  
  try {
    // 读取文件内容
    const content = await window.electronAPI.readFile(filePath);
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
    const title = fileName.replace(/\.[^/.]+$/, '');
    
    importProgress.value = 30;
    importMessage.value = '正在上传到服务器...';
    
    await uploadNovelToBackend(title, content, fileName);
  } catch (error) {
    console.error('Failed to read file:', error);
    importError.value = '读取文件失败: ' + error.message;
    isImporting.value = false;
  }
}

// 处理 Web 文件选择
async function handleWebFile(file) {
  isImporting.value = true;
  importProgress.value = 10;
  importMessage.value = '正在读取文件...';
  importError.value = '';
  
  try {
    const content = await readFileContent(file);
    const title = file.name.replace(/\.[^/.]+$/, '');
    
    importProgress.value = 30;
    importMessage.value = '正在上传到服务器...';
    
    await uploadNovelToBackend(title, content, file.name);
  } catch (error) {
    console.error('Failed to read file:', error);
    importError.value = '读取文件失败: ' + error.message;
    isImporting.value = false;
  }
}

// 读取文件内容
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// 上传小说到后端
async function uploadNovelToBackend(title, content, fileName) {
  try {
    // 确保有项目ID，如果没有则创建一个默认项目
    let projectId = projectStore.currentProject?.id || projectStore.currentProject?.projectId;
    let projectData = projectStore.currentProject;
    
    if (!projectId) {
      importMessage.value = '正在创建项目...';
      const projectResult = await apiService.createProject({
        name: title,
        description: `从文件 ${fileName} 导入的小说项目`
      });
      
      if (projectResult.success && projectResult.project) {
        projectId = projectResult.project.projectId || projectResult.project.id;
        projectData = {
          id: projectId,
          name: title,
          status: 'imported',
          ...projectResult.project
        };
        // 将项目添加到 store 并设置为当前项目
        projectStore.setCurrentProject(projectData);
      } else {
        // 使用默认项目ID
        projectId = 'default-project';
        projectData = { id: projectId, name: title, status: 'imported' };
      }
    }
    
    importProgress.value = 50;
    importMessage.value = '正在导入小说...';
    
    // 调用后端 API 导入小说
    const result = await novelApi.importText({
      projectId,
      title,
      content
    });
    
    if (result.success && result.novel) {
      currentNovelId.value = result.novel.novelId;

      // 存储到 localStorage，供 mock 响应使用
      localStorage.setItem('novel_anime_current_novel_id', result.novel.novelId);
      localStorage.setItem('novel_anime_current_novel_title', title);
      
      // 同时将小说内容存储到 localStorage，供工作流执行时使用
      // 使用 NovelParser 的存储格式
      const novelStorageData = {
        id: result.novel.novelId,
        title: title,
        author: result.novel.author || '未知作者',
        chapters: result.novel.chapters || [],
        metadata: {
          wordCount: content.length,
          language: 'zh'
        },
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`novel_${result.novel.novelId}`, JSON.stringify(novelStorageData));
      console.log('📚 小说数据已存储到 localStorage:', result.novel.novelId);

      importProgress.value = 100;
      importMessage.value = '导入成功！';

      // 更新步骤状态 - 导入完成，进入解析步骤
      workflowSteps.value[0].completed = true;
      workflowSteps.value[1].enabled = true;
      currentStep.value = 1;

      // 更新当前活动项目
      activeProject.value = {
        ...projectData,
        id: projectId,
        name: title,
        status: 'imported',
        progress: 25,
      };

      // 存储到 navigation store
      navigationStore.startImport(fileName);

      // 短暂延迟后重置导入状态
      setTimeout(() => {
        isImporting.value = false;
        importProgress.value = 0;
        importMessage.value = '';
      }, 1500);
    } else {
      throw new Error(result.message || '导入失败');
    }
  } catch (error) {
    console.error('Upload failed:', error);
    importError.value = '导入失败: ' + (error.message || '未知错误');
    isImporting.value = false;
  }
}

// 开始解析
async function startParsing() {
  // 如果没有 novelId，尝试从当前项目加载
  if (!currentNovelId.value && activeProject.value) {
    try {
      const projectId = activeProject.value.id || activeProject.value.projectId;
      console.log('📚 startParsing: Loading novels for project:', projectId);
      if (projectId) {
        const result = await novelApi.listNovels(projectId);
        if (result.success && result.novels && result.novels.length > 0) {
          currentNovelId.value = result.novels[0].novelId;
          console.log('📚 startParsing: Loaded novelId:', currentNovelId.value);
        }
      }
    } catch (error) {
      console.warn('Failed to load novelId in startParsing:', error);
    }
  }

  if (!currentNovelId.value) {
    importError.value = '请先导入小说';
    return;
  }

  isImporting.value = true;
  importProgress.value = 10;
  importMessage.value = '正在分析章节结构...';
  importError.value = '';
  
  try {
    // 调用结构分析 API
    const structureResult = await novelApi.analyzeStructure(currentNovelId.value);
    
    if (!structureResult.success) {
      throw new Error(structureResult.message || '结构分析失败');
    }
    
    importProgress.value = 50;
    importMessage.value = '正在提取角色信息...';
    
    // 调用角色提取 API
    const characterResult = await apiService.axiosInstance.post('/novels/extract-characters', {
      novelId: currentNovelId.value
    });
    
    importProgress.value = 100;
    importMessage.value = '解析完成！';
    
    // 从后端获取解析后的章节数据并更新 localStorage
    try {
      const novelDetail = await novelApi.getNovel(currentNovelId.value);
      if (novelDetail.success && novelDetail.novel) {
        const storedData = localStorage.getItem(`novel_${currentNovelId.value}`);
        if (storedData) {
          const novelData = JSON.parse(storedData);
          novelData.chapters = novelDetail.novel.chapters || [];
          novelData.lastUpdated = new Date().toISOString();
          localStorage.setItem(`novel_${currentNovelId.value}`, JSON.stringify(novelData));
          console.log('📚 已更新 localStorage 中的章节数据:', novelData.chapters.length, '章');
        } else {
          // 如果 localStorage 中没有数据，创建新的
          const novelStorageData = {
            id: currentNovelId.value,
            title: novelDetail.novel.title || localStorage.getItem('novel_anime_current_novel_title') || '未命名小说',
            author: novelDetail.novel.author || '未知作者',
            chapters: novelDetail.novel.chapters || [],
            metadata: {
              wordCount: novelDetail.novel.wordCount || 0,
              language: 'zh'
            },
            createdDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem(`novel_${currentNovelId.value}`, JSON.stringify(novelStorageData));
          console.log('📚 已创建 localStorage 中的小说数据:', novelStorageData.chapters.length, '章');
        }
      }
    } catch (error) {
      console.warn('获取章节数据失败，工作流可能使用模拟数据:', error);
    }
    
    // 更新步骤状态 - 解析完成，进入角色确认步骤
    workflowSteps.value[0].completed = true;
    workflowSteps.value[1].completed = true;
    workflowSteps.value[2].enabled = true;
    currentStep.value = 2;
    
    // 更新当前活动项目状态
    if (activeProject.value) {
      activeProject.value.status = 'parsed';
      activeProject.value.progress = 50;
    }
    
    // 存储解析结果
    navigationStore.setParseResult({
      chaptersCreated: structureResult.chaptersCreated,
      scenesCreated: structureResult.scenesCreated,
      charactersExtracted: characterResult.data?.charactersExtracted || 0
    });
    
    setTimeout(() => {
      isImporting.value = false;
      importProgress.value = 0;
      importMessage.value = '';
    }, 1500);
    
  } catch (error) {
    console.error('Parsing failed:', error);
    importError.value = '解析失败: ' + (error.message || '未知错误');
    isImporting.value = false;
  }
}

// 查看角色
async function viewCharacters() {
  console.log('👥 viewCharacters called, currentNovelId:', currentNovelId.value);
  
  // 如果没有 currentNovelId，尝试从当前项目加载
  if (!currentNovelId.value && projectStore.currentProject) {
    try {
      const projectId = projectStore.currentProject.id || projectStore.currentProject.projectId;
      console.log('📚 Trying to load novelId for project:', projectId);
      if (projectId) {
        const result = await novelApi.listNovels(projectId);
        console.log('📚 listNovels result:', result);
        if (result.success && result.novels && result.novels.length > 0) {
          currentNovelId.value = result.novels[0].novelId;
          console.log('📚 Loaded novelId for characters:', currentNovelId.value);
        }
      }
    } catch (error) {
      console.warn('Failed to load novelId:', error);
    }
  }
  
  // 如果还是没有 novelId，尝试从 localStorage 恢复
  if (!currentNovelId.value) {
    const storedNovelId = localStorage.getItem('novel_anime_current_novel_id');
    if (storedNovelId) {
      currentNovelId.value = storedNovelId;
      console.log('📚 Restored novelId from localStorage for characters:', currentNovelId.value);
    }
  }
  
  if (currentNovelId.value) {
    // 将 novelId 传递给角色页面
    navigationStore.updatePanelContext('characters', {
      novelId: currentNovelId.value
    });
    console.log('👥 Navigating to characters with novelId:', currentNovelId.value);
  } else {
    console.warn('⚠️ No novelId available for characters page');
  }
  
  router.push('/characters');
}

// 获取状态显示文本
function getStatusText(status) {
  const statusTexts = {
    active: '进行中',
    importing: '导入中',
    imported: '已导入',
    analyzing: '分析中',
    analyzed: '已分析',
    parsing: '解析中',
    parsed: '已解析',
    characters_confirmed: '角色已确认',
    generating: '生成中',
    completed: '已完成'
  };
  return statusTexts[status] || status || '进行中';
}

// 获取步骤按钮文字 - 完成后显示不同文字
function getStepButtonLabel(step) {
  if (step.completed) {
    // 完成后的按钮文字
    const completedLabels = {
      import: '重新导入',
      parse: '重新解析',
      characters: '查看角色',
      generate: '查看结果'
    };
    return completedLabels[step.id] || step.actionLabel;
  }
  return step.actionLabel;
}

// 查看结果 - 项目完成后查看生成内容
async function viewResults() {
  console.log('👁️ viewResults called');
  
  // 确保有 novelId
  if (!currentNovelId.value && activeProject.value) {
    try {
      const projectId = activeProject.value.id || activeProject.value.projectId;
      if (projectId) {
        const result = await novelApi.listNovels(projectId);
        if (result.success && result.novels && result.novels.length > 0) {
          currentNovelId.value = result.novels[0].novelId;
        }
      }
    } catch (error) {
      console.warn('Failed to load novelId:', error);
    }
  }
  
  // 存储 novelId 到 localStorage，供 GeneratedContentView 使用
  if (currentNovelId.value) {
    localStorage.setItem('novel_anime_current_novel_id', currentNovelId.value);
  }
  
  // 存储项目 ID
  if (activeProject.value) {
    const projectId = activeProject.value.id || activeProject.value.projectId;
    if (projectId) {
      localStorage.setItem('novel_anime_current_project_id', projectId);
    }
  }
  
  // 直接跳转到生成结果页面
  router.push('/generated');
}

// 新建项目 - 重置状态开始新项目
function startNewProject() {
  console.log('➕ startNewProject called');
  // 重置工作流状态
  navigationStore.resetWorkflowState();
  // 清除当前项目
  projectStore.setCurrentProject(null);
  activeProject.value = null;
  currentNovelId.value = null;
  // 重置步骤
  workflowSteps.value.forEach((step, index) => {
    step.completed = false;
    step.enabled = index === 0;
  });
  currentStep.value = 0;
  // 清除 localStorage 中的 novelId
  localStorage.removeItem('novel_anime_current_novel_id');
  localStorage.removeItem('novel_anime_current_novel_title');
}

// 继续处理项目 - 根据项目状态跳转到对应的向导步骤
async function continueProject() {
  console.log('🔄 continueProject called, activeProject:', activeProject.value);
  console.log('🔄 workflowState:', navigationStore.workflowState);
  
  if (!activeProject.value) {
    console.warn('No active project found');
    return;
  }
  
  // 确保有 novelId
  if (!currentNovelId.value) {
    try {
      const projectId = activeProject.value.id || activeProject.value.projectId;
      console.log('📚 Loading novels for project:', projectId);
      if (projectId) {
        const result = await novelApi.listNovels(projectId);
        if (result.success && result.novels && result.novels.length > 0) {
          currentNovelId.value = result.novels[0].novelId;
          console.log('📚 Loaded novelId:', currentNovelId.value);
          
          // 同时更新项目状态（从小说状态推断）
          const novelStatus = result.novels[0].status;
          if (novelStatus) {
            activeProject.value.status = novelStatus;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load novelId:', error);
    }
  }
  
  // 优先检查 navigationStore.workflowState
  // 如果角色已确认，直接跳转到步骤 3
  if (navigationStore.workflowState.charactersConfirmed) {
    console.log('🎯 Characters confirmed, going to step 3 (generate)');
    currentStep.value = 3;
    workflowSteps.value.forEach((step, index) => {
      step.completed = index < 3;
      step.enabled = index <= 3;
    });
    // 设置 panelContext，让 WorkflowEditor 自动选择模板视图
    navigationStore.updatePanelContext('workflow', {
      viewType: 'template',
      templateId: 't1', // 默认选择"标准转换流程"模板
      selectedWorkflow: null,
      statusFilter: null,
      executionId: null,
      // 传递项目信息
      projectId: activeProject.value.id || activeProject.value.projectId,
      novelId: currentNovelId.value,
      projectName: activeProject.value.name
    });
    router.push('/workflow');
    return;
  }
  
  // 根据项目状态确定当前步骤
  // 状态映射：状态 -> 当前应该在哪个步骤
  const status = activeProject.value.status || 'imported';
  console.log('📊 Project status:', status);

  // 状态到步骤的映射（步骤索引从0开始）
  // imported: 导入完成 -> 当前在步骤1（智能解析）
  // parsed: 解析完成 -> 当前在步骤2（角色确认）
  // characters_confirmed: 角色确认完成 -> 当前在步骤3（生成动漫）
  const statusToStep = {
    active: 1, // 活跃状态（已导入）-> 进入步骤1（解析）
    importing: 0, // 导入中 -> 还在步骤0
    imported: 1, // 已导入 -> 进入步骤1（解析）
    analyzing: 1, // 分析中 -> 还在步骤1
    analyzed: 2, // 已分析 -> 进入步骤2（角色确认）
    parsing: 1, // 解析中 -> 还在步骤1
    parsed: 2, // 已解析 -> 进入步骤2（角色确认）
    characters_confirmed: 3, // 角色已确认 -> 进入步骤3（生成）
    generating: 3, // 生成中 -> 还在步骤3
    completed: 3, // 已完成 -> 步骤3
  };

  const targetStep = statusToStep[status] ?? 1;
  console.log('🎯 Target step:', targetStep);
  
  currentStep.value = targetStep;
  
  // 更新步骤状态：targetStep 之前的步骤都已完成，targetStep 及之前的步骤都启用
  workflowSteps.value.forEach((step, index) => {
    step.completed = index < targetStep;
    step.enabled = index <= targetStep;
  });
  
  // 滚动到向导区域
  const guideElement = document.querySelector('.workflow-guide');
  if (guideElement) {
    guideElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // 根据目标步骤执行相应操作
  if (targetStep === 2 && currentNovelId.value) {
    // 角色确认步骤，跳转到角色页面
    await viewCharacters();
  } else if (targetStep === 3) {
    // 生成动漫步骤，跳转到工作流页面，并设置模板视图
    navigationStore.updatePanelContext('workflow', {
      viewType: 'template',
      templateId: 't1', // 默认选择"标准转换流程"模板
      selectedWorkflow: null,
      statusFilter: null,
      executionId: null,
      // 传递项目信息
      projectId: activeProject.value.id || activeProject.value.projectId,
      novelId: currentNovelId.value,
      projectName: activeProject.value.name
    });
    router.push('/workflow');
  }
  // 步骤0和1留在当前页面，用户点击按钮操作
}

// 打开项目 - 从最近项目列表或项目列表点击
async function openProject(project) {
  console.log('📂 openProject called:', project);
  
  const projectId = project.id || project.projectId;
  
  // 首先从后端获取项目的最新状态
  let latestProject = { ...project };
  if (projectId) {
    try {
      console.log('📂 Fetching latest project status from backend...');
      const response = await apiService.axiosInstance.get(`/project/${projectId}`);
      if (response.data && response.data.project) {
        latestProject = {
          ...project,
          ...response.data.project,
          id: projectId
        };
        console.log('📂 Got latest project from backend:', latestProject);
      }
    } catch (error) {
      console.warn('Failed to fetch latest project status, using cached data:', error);
    }
  }
  
  // 设置当前项目（使用最新数据）
  projectStore.setCurrentProject(latestProject);
  
  // 设置为当前活动项目
  activeProject.value = {
    ...latestProject,
    id: projectId,
    progress: calculateProgress(latestProject)
  };
  
  // 尝试加载项目的小说列表，获取 novelId
  if (projectId) {
    try {
      console.log('📚 Loading novels for project:', projectId);
      const result = await novelApi.listNovels(projectId);
      console.log('📚 Novels result:', result);

      if (result.success && result.novels && result.novels.length > 0) {
        // 使用第一个小说的 ID
        currentNovelId.value = result.novels[0].novelId;
        console.log('📚 Loaded novelId:', currentNovelId.value);
        
        // 存储到 localStorage
        localStorage.setItem('novel_anime_current_novel_id', result.novels[0].novelId);
        if (result.novels[0].title) {
          localStorage.setItem('novel_anime_current_novel_title', result.novels[0].title);
        }

        // 如果项目状态不是 completed，则根据小说状态更新
        // 但如果项目已经是 completed，保持 completed 状态
        if (activeProject.value.status !== 'completed') {
          const novelStatus = result.novels[0].status;
          if (novelStatus) {
            activeProject.value.status = novelStatus;
            activeProject.value.progress = calculateProgress(activeProject.value);
            console.log('📚 Updated project status from novel:', novelStatus);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load novels for project:', error);
    }
  }
  
  // 根据项目状态更新步骤
  updateStepsFromProject(activeProject.value);
  
  // 根据项目状态同步工作流状态
  syncWorkflowStateFromProject(activeProject.value);
  
  // 重置 panelContext 回到仪表盘主视图
  navigationStore.updatePanelContext('dashboard', {
    selectedProject: null,
    viewType: null,
    statusFilter: null,
    historyType: null
  });
  
  // 滚动到向导区域
  const guideElement = document.querySelector('.workflow-guide');
  if (guideElement) {
    guideElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  console.log('📂 Project opened, status:', activeProject.value.status, 'progress:', activeProject.value.progress);
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

// 占位组件 - 使用渲染函数
const ProcessingTaskList = {
  setup() {
    return () => h('div', { class: 'content-placeholder' }, [
      h('span', '处理中的任务列表')
    ]);
  }
};

// 项目列表组件 - 显示用户的所有项目
const ProjectList = {
  setup() {
    const projectStore = useProjectStore();
    const router = useRouter();
    
    const projects = computed(() => projectStore.projects);
    const isLoading = computed(() => projectStore.isLoading);
    
    // 组件挂载时从 API 加载项目
    onMounted(async () => {
      console.log('📋 ProjectList mounted, fetching projects...');
      await projectStore.fetchProjects();
      console.log('📋 Projects loaded:', projectStore.projects.length);
      console.log('📋 Projects data:', JSON.stringify(projectStore.projects));
    });
    
    function getStatusLabel(status) {
      const labels = { 
        draft: '草稿', 
        processing: '处理中', 
        completed: '已完成',
        active: '进行中',
        imported: '已导入',
        parsed: '已解析',
        analyzing: '分析中',
        generating: '生成中'
      };
      return labels[status] || status || '草稿';
    }
    
    function formatProjectDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('zh-CN');
    }
    
    // 点击项目时调用外部的 openProject 函数
    async function handleProjectClick(project) {
      console.log('📋 ProjectList: handleProjectClick', project);
      // 调用外部定义的 openProject 函数
      await openProject(project);
    }
    
    // 渲染函数
    return () => {
      // 加载中状态
      if (isLoading.value) {
        return h('div', { class: 'project-loading-state' }, [
          h('div', { class: 'project-loading-spinner' }),
          h('span', '加载中...')
        ]);
      }
      
      // 有项目时显示列表
      if (projects.value.length > 0) {
        return h('div', { class: 'project-grid' }, 
          projects.value.map(project => 
            h('div', { 
              class: 'project-card-item',
              key: project.id || project.projectId,
              onClick: () => handleProjectClick(project)
            }, [
              h('div', { class: 'project-card-header' }, [
                h('div', { class: 'project-card-icon' }, [
                  h(icons.folder, { size: 20 })
                ]),
                h('div', { class: ['project-status-badge', `project-status-badge--${project.status || 'draft'}`] }, 
                  getStatusLabel(project.status))
              ]),
              h('div', { class: 'project-card-name' }, project.name || '未命名项目'),
              h('div', { class: 'project-card-desc' }, project.description || '暂无描述'),
              h('div', { class: 'project-card-footer' }, [
                h('span', { class: 'project-card-date' }, formatProjectDate(project.updatedAt || project.createdAt))
              ])
            ])
          )
        );
      }
      
      // 空状态
      return h('div', { class: 'project-empty-state' }, [
        h('div', { class: 'project-empty-icon' }, [
          h(icons.folder, { size: 48 })
        ]),
        h('div', { class: 'project-empty-title' }, '暂无项目'),
        h('div', { class: 'project-empty-desc' }, '返回仪表盘创建您的第一个项目')
      ]);
    };
  }
};
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
  background-color: #c8c8c8;
  border: none;
  border-radius: 6px;
  color: #2c2c2e;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.step-btn:hover:not(:disabled) {
  background-color: #d8d8d8;
}

.step-btn--primary {
  background-color: #7a9188;
  color: #ffffff;
}

.step-btn--primary:hover:not(:disabled) {
  background-color: #6a8178;
}

.step-btn--completed {
  background-color: #5ab05e;
  color: #ffffff;
}

.step-btn--completed:hover:not(:disabled) {
  background-color: #4a9a4e;
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
  background: #7aa88a;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.continue-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  background-color: #7a9188;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.continue-btn:hover {
  background-color: #6a8178;
}

/* 完成状态的按钮样式 */
.continue-btn--success {
  background-color: #5ab05e;
  color: #ffffff;
}

.continue-btn--success:hover {
  background-color: #4a9a4e;
}

.continue-btn--secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
}

.continue-btn--secondary:hover {
  background-color: #d8d8d8;
}

/* 完成状态的项目卡片 */
.active-project-card--completed {
  border-color: rgba(76, 175, 80, 0.3);
  background: rgba(76, 175, 80, 0.05);
}

.project-icon--completed {
  background: rgba(76, 175, 80, 0.2);
  color: #2e7d32;
}

.progress-bar--completed {
  background: rgba(76, 175, 80, 0.15);
}

.progress-fill--completed {
  background: #5ab05e;
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

/* 导入进度样式 */
.import-progress-section {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(100, 140, 120, 0.1);
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-message {
  font-size: 13px;
  color: #4a6a52;
  font-weight: 500;
}

.progress-percent {
  font-size: 12px;
  color: #6a8a72;
}

.progress-bar-container {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #7aa88a;
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 错误提示样式 */
.import-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(200, 100, 100, 0.1);
  border: 1px solid rgba(200, 100, 100, 0.2);
  border-radius: 8px;
  color: #8a4a4a;
  font-size: 13px;
}

.import-error span {
  flex: 1;
}

.error-close {
  padding: 2px 6px;
  background: none;
  border: none;
  color: #8a4a4a;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.7;
}

.error-close:hover {
  opacity: 1;
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

/* 项目列表组件样式 - 使用 :deep() 因为 ProjectList 是内联组件 */
:deep(.project-list-container) {
  padding: 0;
}

:deep(.project-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

:deep(.project-card-item) {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

:deep(.project-card-item:hover) {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.project-card-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

:deep(.project-card-icon) {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(100, 140, 120, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5a7a62;
}

:deep(.project-status-badge) {
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.06);
  color: #6c6c6e;
}

:deep(.project-status-badge--draft) { background: rgba(100, 116, 139, 0.15); color: #64748b; }
:deep(.project-status-badge--processing) { background: rgba(217, 119, 6, 0.15); color: #d97706; }
:deep(.project-status-badge--completed) { background: rgba(5, 150, 105, 0.15); color: #059669; }
:deep(.project-status-badge--active) { background: rgba(37, 99, 235, 0.15); color: #2563eb; }
:deep(.project-status-badge--imported) { background: rgba(79, 70, 229, 0.15); color: #4f46e5; }
:deep(.project-status-badge--parsed) { background: rgba(219, 39, 119, 0.15); color: #db2777; }
:deep(.project-status-badge--analyzing) { background: rgba(217, 119, 6, 0.15); color: #d97706; }
:deep(.project-status-badge--generating) { background: rgba(234, 88, 12, 0.15); color: #ea580c; }

:deep(.project-card-name) {
  font-size: 15px;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.project-card-desc) {
  font-size: 12px;
  color: #7a7a7c;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

:deep(.project-card-footer) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.project-card-date) {
  font-size: 11px;
  color: #9a9a9c;
}

/* 空状态 */
:deep(.project-empty-state) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

:deep(.project-empty-icon) {
  color: #b0b0b2;
  margin-bottom: 16px;
  opacity: 0.5;
}

:deep(.project-empty-title) {
  font-size: 16px;
  font-weight: 600;
  color: #5a5a5c;
  margin-bottom: 8px;
}

:deep(.project-empty-desc) {
  font-size: 13px;
  color: #8a8a8c;
}

/* 加载状态 */
:deep(.project-loading-state) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: #6c6c6e;
}

:deep(.project-loading-spinner) {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(100, 140, 120, 0.2);
  border-top-color: rgba(100, 140, 120, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
