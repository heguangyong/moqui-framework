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
      <QuickActions
        v-if="recentProjects.length > 0"
        :projects="recentProjects"
        @open-project="openProject"
      />
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
      <ProjectList 
        @open-project="openProject"
        @project-deleted="handleProjectDeleted"
      />
    </template>
    
    <!-- 默认仪表盘视图 - 向导式流程 -->
    <template v-else>
      <div class="dashboard-header">
        <h1>小说动漫生成器</h1>
        <p>将您的小说转换为精彩动漫，只需四步</p>
      </div>
      
      <!-- 向导式流程步骤 -->
      <WorkflowSteps
        :steps="workflowSteps"
        :current-step="currentStep"
        :is-importing="isImporting"
        :import-progress="importProgress"
        :import-message="importMessage"
        :import-error="importError"
        @step-click="handleStepClick"
        @step-action="handleStepAction"
      />

      <!-- 当前进行中的项目 -->
      <ProjectOverview
        v-if="activeProject"
        :project="activeProject"
        @continue="continueProject"
        @view-results="viewResults"
        @new-project="startNewProject"
      />
      
      <!-- 最近项目 -->
      <QuickActions
        :projects="recentProjects"
        @open-project="openProject"
      />
      
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
import { useNavigationStore } from '../stores/navigation';
import { useProjectStore } from '../stores/project';
import { useUIStore } from '../stores/ui.js';
import { useAuthStore } from '../stores/auth.ts';
import { icons } from '../utils/icons.js';
import { apiService, novelApi, pipelineApi } from '../services/index.ts';
import SessionManager from '../utils/SessionManager.ts';
import ProjectList from './dashboard/ProjectList.vue';
import WorkflowSteps from './dashboard/WorkflowSteps.vue';
import ProjectOverview from './dashboard/ProjectOverview.vue';
import QuickActions from './dashboard/QuickActions.vue';

const router = useRouter();
const navigationStore = useNavigationStore();
const projectStore = useProjectStore();
const uiStore = useUIStore();
const authStore = useAuthStore();

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
  
  // Check authentication status
  const token = localStorage.getItem('novel_anime_access_token');
  console.log('🔐 Auth token:', token ? 'Present ✅' : 'Missing ❌');
  
  // Development environment: Auto-login if no token
  if (!token && import.meta.env.DEV) {
    console.log('🔐 Development mode: Attempting auto-login...');
    await attemptAutoLogin();
  } else if (!token) {
    console.warn('⚠️ User not authenticated - some operations (like delete) may fail');
    // Show warning notification
    uiStore.addNotification({
      type: 'warning',
      title: '提示',
      message: '当前未登录，部分功能（如删除项目）需要登录后使用',
      timeout: 5000
    });
  }
  
  await checkSystemStatus();
  await loadActiveProject();
});

// Auto-login for development environment
async function attemptAutoLogin() {
  try {
    // Use auth store's login method to properly set user state
    const result = await authStore.login({
      email: 'test@example.com',
      password: 'test123'
    });
    
    if (result.success && result.user) {
      console.log('✅ Auto-login successful, user:', result.user);
      uiStore.addNotification({
        type: 'success',
        title: '自动登录成功',
        message: `开发环境已自动登录: ${result.user.username || result.user.email}`,
        timeout: 3000
      });
    } else {
      console.warn('⚠️ Auto-login failed:', result.error);
      uiStore.addNotification({
        type: 'warning',
        title: '未登录',
        message: '自动登录失败，请手动登录。部分功能需要登录后使用。',
        timeout: 5000
      });
    }
  } catch (error) {
    console.error('❌ Auto-login error:', error);
    uiStore.addNotification({
      type: 'warning',
      title: '未登录',
      message: '当前未登录，部分功能（如删除项目）需要登录后使用',
      timeout: 5000
    });
  }
}

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
  // 🔥 REFACTOR: Removed workflowState check - use project.status instead
  // 检查是否有当前项目
  if (!projectStore.currentProject) {
    console.log('📊 No current project, skipping project load');
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
    
    // 🔥 REFACTOR: Use SessionManager to validate project data
    // Verify project still exists in the project list
    await projectStore.fetchProjects();
    const projectExists = projectStore.projects.find(
      p => (p.id || p.projectId) === projectId
    );
    
    if (!projectExists) {
      console.warn('⚠️ Current project no longer exists (deleted), clearing...');
      projectStore.clearCurrentProject();
      activeProject.value = null;
      currentNovelId.value = null;
      
      // 🔥 REFACTOR: Use SessionManager to clean up
      SessionManager.cleanupProjectData(projectId);
      
      // 重置步骤状态
      workflowSteps.value.forEach((step, index) => {
        step.completed = false;
        step.enabled = index === 0;
      });
      currentStep.value = 0;
      
      // 尝试加载下一个可用项目
      const nextProject = projectStore.projects[0];
      if (nextProject) {
        console.log('🔄 Loading next available project:', nextProject.name);
        current = nextProject;
        projectStore.setCurrentProject(current);
        // 继续执行后续逻辑
      } else {
        console.log('📊 No projects available');
        return; // 没有项目了，直接返回
      }
    }
    
    // 从后端获取项目的最新状态
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
      // 🔥 DELETED: progress: calculateProgress(current)
      // Progress should come from backend
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

          // 🔥 DELETED: Update project status from novel status
          // This was causing new projects to inherit status from OTHER projects' novels
          // Project status should ONLY come from backend
        }
      } catch (error) {
        console.warn('Failed to load novels for project:', error);
      }
    }

    // 🔥 REFACTOR: Use SessionManager to validate localStorage data
    // If still no novelId, try to restore from SessionManager
    if (!currentNovelId.value) {
      // Validate that session data belongs to current project
      if (!SessionManager.validateProjectData(projectId)) {
        console.warn('⚠️ Session data does not match current project, cleaning up...');
        SessionManager.cleanupProjectData(projectId);
        console.log('✅ Old session data cleared, starting fresh');
      }
    }

    // 🔥 DELETED: Removed hardcoded progress settings
    // Progress should come from backend, not be inferred from workflowState
    // This was causing new projects to show 50% progress incorrectly
    
    // 根据项目状态更新步骤
    updateStepsFromProject(activeProject.value);
    
    // 🔥 REFACTOR: Removed syncWorkflowStateFromProject - use project.status directly
  }

  console.log(
    '📊 Active project loaded:',
    activeProject.value,
    'novelId:',
    currentNovelId.value
  );
}

// 🔥 DELETED: calculateProgress() function
// This function was hardcoding progress values based on status
// Progress should come from backend, not be calculated on frontend

// 根据项目状态更新步骤
function updateStepsFromProject(project) {
  if (!project) return;

  // 🔥 REFACTOR: Removed workflowState checks - use project.status only
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

// 🔥 DELETED: syncWorkflowStateFromProject() function
// This function was causing state synchronization issues
// Now we use project.status directly without syncing to workflowState

// 步骤点击处理
function handleStepClick({ step, index }) {
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
      
      // 检查是否存在同名项目
      let projectName = title;
      const existingProjects = await apiService.getProjects();
      if (existingProjects.success && existingProjects.projects) {
        const duplicateNames = existingProjects.projects
          .filter(p => p.name && p.name.startsWith(title))
          .map(p => p.name);
        
        if (duplicateNames.length > 0) {
          // 找到同名项目，自动添加编号
          let counter = 2;
          while (duplicateNames.includes(`${title} (${counter})`)) {
            counter++;
          }
          projectName = `${title} (${counter})`;
          console.log(`⚠️ 项目名称重复，自动重命名为: ${projectName}`);
        }
      }
      
      // 🔧 FIX: Use projectStore.createProject() instead of apiService.createProject()
      // This ensures the project is added to the store and the list is refreshed
      console.log('📝 DashboardView: Creating project via store:', projectName);
      projectData = await projectStore.createProject({
        name: projectName,
        description: `从文件 ${fileName} 导入的小说项目`
      });
      
      if (projectData) {
        // 🔧 FIX: Extract backend projectId - this is the authoritative ID
        projectId = projectData.projectId || projectData.id;
        
        // 🔧 FIX: Validate that we have a valid backend projectId
        if (!projectId) {
          throw new Error('后端未返回有效的项目ID，无法继续导入');
        }
        
        console.log('✅ Backend returned projectId:', projectId);
        console.log('✅ Project created successfully with backend projectId:', projectId, 'name:', projectName);
        
        // Note: projectStore.createProject() now automatically:
        // 1. Adds project to store's projects array
        // 2. Calls fetchProjects() to refresh the list
        // 3. Sets the project as current project
        // So we don't need to manually do these steps
      } else {
        // 创建项目失败，抛出错误
        throw new Error(projectStore.error || '创建项目失败，无法导入小说');
      }
    }
    
    // 🔧 FIX: Validate projectId before proceeding to novel import
    if (!projectId) {
      throw new Error('项目ID无效，无法导入小说');
    }
    
    console.log('📤 Importing novel with projectId:', projectId);
    
    importProgress.value = 50;
    importMessage.value = '正在导入小说...';
    
    // 调用后端 API 导入小说
    const result = await novelApi.importText({
      projectId,      // 🔧 FIX: Use the backend projectId
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
        // 🔥 DELETED: Removed hardcoded progress: 25
        // Progress should come from backend
      };

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
    importError.value = '小说导入失败: ' + (error.message || '未知错误');
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
      // 🔥 DELETED: Removed hardcoded progress: 50
      // This was the root cause of new projects showing 50% progress
      // Progress should come from backend
    }
    
    // 🔥 DELETED: Removed navigationStore.setParseResult() call
    // This method was deleted in Phase 1 refactoring
    // Parse results are already stored in the project/novel data
    
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
    characters_continue: '角色确认中',
    generating: '生成中',
    completed: '已完成'
  };
  return statusTexts[status] || status || '进行中';
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
  // 🔥 REFACTOR: Removed resetWorkflowState - no longer needed
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
  // 🔥 REFACTOR: Removed workflowState logging - use project.status only
  
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
          
          // 🔥 DELETED: Update project status from novel status
          // Project status should ONLY come from backend
        }
      }
    } catch (error) {
      console.warn('Failed to load novelId:', error);
    }
  }
  
  // 🔥 REFACTOR: Removed workflowState.charactersConfirmed check
  // Use project.status directly instead
  
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
    // 🔥 DELETED: progress: calculateProgress(latestProject)
    // Progress should come from backend
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

        // 🔥 DELETED: Update project status from novel status
        // This was causing new projects to inherit status from OTHER projects' novels
        // Project status should ONLY come from backend, not be inferred from novel status
      }
    } catch (error) {
      console.warn('Failed to load novels for project:', error);
    }
  }
  
  // 根据项目状态更新步骤
  updateStepsFromProject(activeProject.value);
  
  // 🔥 REFACTOR: Removed syncWorkflowStateFromProject - use project.status directly
  
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

// 处理项目删除事件 - 从 ProjectList 组件触发
async function handleProjectDeleted(projectId) {
  console.log('🗑️ handleProjectDeleted called for projectId:', projectId);
  
  // 如果删除的是当前活动项目，清除并重新加载
  if (activeProject.value && 
      (activeProject.value.id === projectId || activeProject.value.projectId === projectId)) {
    console.log('🔄 Deleted project was active project, clearing and reloading...');
    activeProject.value = null;
    currentNovelId.value = null;
    
    // 重置步骤状态
    workflowSteps.value.forEach((step, index) => {
      step.completed = false;
      step.enabled = index === 0;
    });
    currentStep.value = 0;
    
    // 重新加载活动项目（会自动选择下一个项目）
    await loadActiveProject();
  }
}

// 占位组件 - 使用渲染函数
const ProcessingTaskList = {
  setup() {
    return () => h('div', { class: 'content-placeholder' }, [
      h('span', '处理中的任务列表')
    ]);
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

/* 完成状态的项目卡片 - DELETED (moved to ProjectOverview.vue) */

/* 最近项目列表 - DELETED (moved to QuickActions.vue) */

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


</style>
