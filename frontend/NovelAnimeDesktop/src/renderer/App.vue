<template>
  <div class="app-container">
    <div class="app-layout">
      <!-- 左侧极窄侧边栏 -->
      <aside class="narrow-sidebar">
        <!-- 上半部分：导航区域（占 3/4 空间） -->
        <div class="sidebar-section sidebar-section--nav">
          <!-- 黑色图标区域 -->
          <div class="sidebar-icons">
            <!-- 软件 Logo/Icon（顶部，不是按钮） -->
            <div class="sidebar-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <!-- 分割线（只有这一条） -->
            <div class="sidebar-divider"></div>
            <!-- 导航按钮（数据驱动） -->
            <button 
              v-for="nav in navItems"
              :key="nav.id"
              class="sidebar-icon-btn"
              :class="{ 'sidebar-icon-btn--active': activeNavId === nav.id }"
              @click="handleNavClick(nav)"
              @mouseenter="showTooltip({ label: nav.label }, $event)"
              @mouseleave="hideTooltip"
            >
              <component :is="nav.icon" :size="24" />
            </button>
          </div>
          <!-- 分割线 -->
          <div class="sidebar-section-divider"></div>
          <!-- 竖向文字标签（雕刻风格） -->
          <div class="sidebar-label">NOVEL ANIME</div>
        </div>
        
        <!-- 下半部分：设置区域（占 1/4 空间，即上方的 1/3） -->
        <div class="sidebar-section sidebar-section--settings">
          <!-- 竖向文字标签（雕刻风格，在上方） -->
          <div class="sidebar-label sidebar-label--top">SETTINGS</div>
          <!-- 分割线 -->
          <div class="sidebar-section-divider"></div>
          <!-- 黑色正方形设置按钮（在下方） -->
          <div class="sidebar-icons sidebar-icons--bottom">
            <button 
              class="sidebar-icon-btn sidebar-icon-btn--settings" 
              @click="handleSidebarClick({ route: 'settings', label: 'Settings' })"
              @mouseenter="showTooltip({ label: 'Settings' }, $event)"
              @mouseleave="hideTooltip"
            >
              <component :is="icons.settings" :size="24" />
            </button>
          </div>
        </div>
        
        <!-- 工具提示 -->
        <div 
          v-if="tooltip.visible" 
          class="sidebar-tooltip"
          :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px' }"
        >
          {{ tooltip.text }}
        </div>
      </aside>
      
      <!-- 中间内容面板 - 需求 2.1-2.5: 使用 ContextPanel 动态渲染 -->
      <div class="middle-panel">
        <!-- 左侧菜单区域 - 使用 ContextPanel 组件 -->
        <div class="menu-column">
          <ContextPanel 
            user-name="John Doe"
            user-email="customerpop@gmail.com"
          />
        </div>
        
        <!-- 右侧主工作区 - 需求 3.1: 各视图自行管理头部 -->
        <main class="main-area">
          <div class="workspace-content">
            <!-- 内容区域 - 需求 6.4: 视图切换动画 -->
            <div class="content-area">
              <div v-if="uiStore.loading.global" class="loading-overlay">
                <div class="loading-spinner">
                  <component :is="icons.refresh" :size="24" class="spin" />
                </div>
                <p>Loading...</p>
              </div>
              <router-view v-else v-slot="{ Component }">
                <transition name="view-fade" mode="out-in">
                  <component :is="Component" />
                </transition>
              </router-view>
            </div>
          </div>
        </main>
      </div>
    </div>
    
    <!-- 通知容器 -->
    <div class="notification-container">
      <div 
        v-for="notification in uiStore.notifications" 
        :key="notification.id"
        class="notification"
        :class="`notification--${notification.type}`"
      >
        <div class="notification-icon">
          <component 
            :is="getNotificationIcon(notification.type)" 
            :size="16" 
          />
        </div>
        <div class="notification-content">
          <span class="notification-title">{{ notification.title }}</span>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
        <button 
          class="notification-close"
          @click="uiStore.removeNotification(notification.id)"
        >
          <component :is="icons.x" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, reactive, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProjectStore } from './stores/project.js';
import { useUIStore } from './stores/ui.js';
import { useTaskStore } from './stores/task.js';
import { useFileStore } from './stores/file.js';
import { useNavigationStore } from './stores/navigation.js';
import { icons } from './utils/icons.js';
import DocumentTree from './components/explorer/DocumentTree.vue';
import ContextPanel from './components/panels/ContextPanel.vue';

const router = useRouter();
const route = useRoute();
const projectStore = useProjectStore();
const uiStore = useUIStore();
const taskStore = useTaskStore();
const fileStore = useFileStore();
const navigationStore = useNavigationStore();

const currentProject = computed(() => projectStore.currentProject);

// 状态视图 - 已移至 DashboardPanel
// const activeStatusView = ref('');

// 工具提示状态
const tooltip = reactive({
  visible: false,
  text: '',
  top: 0,
  left: 0
});

// 用户菜单状态 - 已移至 ContextPanel
// const userMenuVisible = ref(false);

// 文档树展开状态 - 现在由 fileStore 管理

// 项目视图状态 - 已移至 DashboardPanel
// const activeProjectView = ref('dashboard');

// 标签页状态 - 已移至各视图组件
// const activeTab = ref('workflows');
// const tabs = [...];

// 搜索状态 - 已移至各视图组件
// const searchQuery = ref('');

// 侧边栏导航项 - 精简为4个核心功能模块
// 需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
const navItems = [
  {
    id: 'dashboard',
    route: '/dashboard',
    label: '项目概览',
    icon: icons.home,
    description: '查看项目统计和快速操作'
  },
  {
    id: 'workflow',
    route: '/workflow',
    label: '工作流',
    icon: icons.gitBranch,
    description: '编辑和执行转换流程'
  },
  {
    id: 'assets',
    route: '/assets',
    label: '资源库',
    icon: icons.folderOpen,
    description: '管理项目资源文件'
  },
  {
    id: 'characters',
    route: '/characters',
    label: '角色管理',
    icon: icons.users,
    description: '管理角色档案和一致性'
  }
];

// 当前激活的导航ID - 使用 navigation store 管理
// 需求: 1.3, 1.4
const activeNavId = computed(() => navigationStore.activeNavId);

// 导航点击处理 - 需求 1.3, 1.4: 使用 navigation store 管理状态
function handleNavClick(nav) {
  // 使用 navigation store 更新激活状态
  navigationStore.setActiveNav(nav.id);
  
  // 更新 UI store 中的路由状态
  uiStore.setActiveRoute(nav.route);
  
  // 导航到对应路由
  router.push(nav.route);
}

// 动态计算页面标题和内容
const contentPanelTitle = computed(() => {
  switch (route.name) {
    case 'home':
      return '项目';
    case 'files':
      return '文件管理';
    case 'edit':
      return '编辑器';
    case 'workflow':
      return '工作流';
    case 'settings':
      return '设置';
    default:
      return '项目';
  }
});

const mainAreaTitle = computed(() => {
  if (currentProject.value) {
    return currentProject.value.name;
  }
  
  switch (route.name) {
    case 'home':
      return 'Dashboard';
    case 'files':
      return '文件管理';
    case 'edit':
      return '剧本编辑器';
    case 'workflow':
      return '工作流编辑器';
    case 'settings':
      return '应用设置';
    default:
      return '小说动漫生成器';
  }
});

const mainAreaSubtitle = computed(() => {
  if (currentProject.value) {
    return currentProject.value.description || '管理您的创作项目';
  }
  
  switch (route.name) {
    case 'home':
      return '所有工作流和项目概览';
    case 'files':
      return '管理项目文件和资源';
    case 'edit':
      return '创作和编辑您的剧本';
    case 'workflow':
      return '设计和执行工作流程';
    case 'settings':
      return '配置应用程序设置';
    default:
      return '';
  }
});

const showSearch = computed(() => {
  return ['home', 'files', 'edit'].includes(route.name);
});

// 侧边栏交互处理（设置按钮）
function handleSidebarClick(item) {
  // 更新 navigation store 的激活状态
  navigationStore.setActiveNav('settings');
  
  // 更新UI状态
  uiStore.setActiveRoute(item.route);
  
  // 导航到对应路由
  if (item.route) {
    router.push(`/${item.route}`);
  }
}

// 工具提示定时器
let tooltipTimer = null;

// 工具提示显示 - 需求 1.2: 300ms 延迟显示
function showTooltip(item, event) {
  // 清除之前的定时器
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
  
  const rect = event.target.getBoundingClientRect();
  
  // 300ms 延迟后显示 tooltip
  tooltipTimer = setTimeout(() => {
    tooltip.visible = true;
    tooltip.text = item.label;
    tooltip.top = rect.top + rect.height / 2 - 16;
    tooltip.left = rect.right + 12;
  }, 300);
}

// 工具提示隐藏
function hideTooltip() {
  // 清除定时器
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
  tooltip.visible = false;
}

// 用户菜单切换
function toggleUserMenu() {
  userMenuVisible.value = !userMenuVisible.value;
}

// 用户操作处理
function handleUserAction(action) {
  userMenuVisible.value = false;
  
  switch (action) {
    case 'profile':
      router.push('/profile');
      break;
    case 'settings':
      router.push('/settings');
      break;
    case 'logout':
      // TODO: 处理登出逻辑
      break;
  }
}

// 项目点击处理 - 已移至 DashboardPanel
// 状态点击处理 - 已移至 DashboardPanel
// 历史记录点击处理 - 已移至 DashboardPanel

// 文件夹展开/折叠处理 - 现在由 DocumentTree 组件和 fileStore 管理

// 创建新项目处理 - 已移至各视图组件
// 文档树事件处理 - 已移至 DashboardPanel

// 刷新处理 - 已移至各视图组件
// 统计卡片点击处理 - 已移至各视图组件
// 标签页点击处理 - 已移至各视图组件
// 搜索处理 - 已移至各视图组件

// 获取通知图标
function getNotificationIcon(type) {
  const iconMap = {
    success: icons.check,
    error: icons.alertCircle,
    warning: icons.alertCircle,
    info: icons.info
  };
  return iconMap[type] || icons.info;
}

onMounted(() => {
  // 初始化UI状态
  uiStore.initializeFromStorage();
  
  // 初始化导航状态 - 需求 1.4
  navigationStore.initializeFromStorage();
  
  // 加载任务数据
  taskStore.loadTasks();
  
  // 加载文件树数据
  fileStore.loadFromStorage();
  
  // 强制侧边栏展开
  uiStore.layout.sidebarCollapsed = false;
  
  // 根据当前路由设置激活的导航项
  const currentPath = route.path;
  const matchedNav = navItems.find(nav => currentPath.startsWith(nav.route));
  if (matchedNav) {
    navigationStore.setActiveNav(matchedNav.id);
  }
  
  console.log('App mounted, UI store initialized');
  
  // 监听菜单事件
  if (window.electronAPI) {
    window.electronAPI.onMenuAction((action) => {
      switch (action) {
        case 'new-project':
          createProject();
          break;
        case 'open-project':
          openProject();
          break;
        case 'workflow-editor':
          router.push('/workflow');
          break;
        case 'generate-animation':
          generateAnimation();
          break;
      }
    });
  }
});

// 监听路由变化，同步激活状态 - 需求 1.4
watch(() => route.path, (newPath) => {
  // 检查是否是设置页面
  if (newPath.startsWith('/settings')) {
    navigationStore.setActiveNav('settings');
    return;
  }
  
  // 检查其他导航项
  const matchedNav = navItems.find(nav => newPath.startsWith(nav.route));
  if (matchedNav) {
    navigationStore.setActiveNav(matchedNav.id);
  }
});

async function createProject() {
  const name = prompt('请输入项目名称:');
  if (name) {
    try {
      const project = await projectStore.createProject({ 
        name,
        description: '新建的小说动漫项目',
        type: 'novel-to-anime'
      });
      
      if (project) {
        uiStore.addNotification({
          type: 'success',
          title: '项目创建成功',
          message: `项目 "${name}" 已创建`
        });
        router.push(`/project/${project.id}`);
      }
    } catch (error) {
      uiStore.addNotification({
        type: 'error',
        title: '创建项目失败',
        message: error.message
      });
    }
  }
}

async function openProject() {
  if (window.electronAPI) {
    try {
      const projectPath = await window.electronAPI.openProject();
      if (projectPath) {
        const project = await projectStore.loadProject(projectPath);
        if (project) {
          uiStore.addNotification({
            type: 'success',
            title: '项目打开成功',
            message: `项目 "${project.name}" 已打开`
          });
          router.push(`/project/${project.id}`);
        }
      }
    } catch (error) {
      uiStore.addNotification({
        type: 'error',
        title: '打开项目失败',
        message: error.message
      });
    }
  }
}

async function saveProject() {
  if (currentProject.value) {
    try {
      uiStore.setGlobalLoading(true);
      const success = await projectStore.saveCurrentProject();
      if (success) {
        uiStore.addNotification({
          type: 'success',
          title: '保存成功',
          message: '项目已保存'
        });
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      uiStore.addNotification({
        type: 'error',
        title: '保存失败',
        message: error.message
      });
    } finally {
      uiStore.setGlobalLoading(false);
    }
  }
}

function generateAnimation() {
  if (currentProject.value) {
    router.push('/workflow');
  } else {
    uiStore.addNotification({
      type: 'warning',
      title: '需要项目',
      message: '请先创建或打开一个项目'
    });
  }
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-layout {
  display: flex !important;
  height: 100vh !important;
  background: #8a8a8a !important;
  overflow: hidden !important;
  padding: 12px !important;
  gap: 12px !important;
}

/* 极窄侧边栏样式 - 严格控制宽度 */
.narrow-sidebar {
  flex: 0 0 56px !important;
  display: flex !important;
  flex-direction: column !important;
  background: transparent !important;
  border: none !important;
  width: 56px !important;
  min-width: 56px !important;
  max-width: 56px !important;
  box-shadow: none !important;
  z-index: 100 !important;
  gap: 8px !important;
}

/* 侧边栏区域 - 浅灰色中间层，垂直布局，带立体效果 */
.sidebar-section {
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #b8b8b8, #a8a8a8);
  border-radius: 12px;
  padding: 6px;
  gap: 0;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

/* 导航区域 - 占据 3/4 空间 */
.sidebar-section--nav {
  flex: 3;
}

/* 设置区域 - 占据 1/4 空间（上方的 1/3） */
.sidebar-section--settings {
  flex: 1;
}

/* 图标容器 - 黑色最上层，扩展填充（减去文字区域），带立体效果 */
.sidebar-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #2a2a2a, #1a1a1a);
  border-radius: 8px;
  padding: 8px 4px;
  gap: 2px;
  flex: 1;
  width: 40px;
  align-self: center;
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

/* 软件 Logo - 顶部图标（不是按钮），亮色 */
.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.sidebar-logo svg {
  width: 24px;
  height: 24px;
}

/* 分隔线 - Logo 下方（黑色区域内）- 雕刻线效果 */
.sidebar-divider {
  width: 22px;
  height: 1px;
  margin: 8px 0;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  /* 雕刻线效果：下方亮线 */
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* 按钮之间的分隔线（黑色区域内，略窄） */
.sidebar-btn-divider {
  width: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #404040, transparent);
  margin: 18px 0;
}

/* 区域分隔线（灰色区域内）- 雕刻线效果，纯灰色 */
.sidebar-section-divider {
  width: 24px;
  height: 1px;
  align-self: center;
  margin: 16px 0;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  /* 雕刻线效果：下方亮线，极淡 */
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* 下方设置区域的分割线 - 靠近底部按钮 */
.sidebar-section--settings .sidebar-section-divider {
  margin-top: auto;
  margin-bottom: 16px;
}

/* 竖向文字标签 - 雕刻风格，固定高度，靠下对齐（上方区域） */
.sidebar-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 16px 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  white-space: nowrap;
  text-transform: uppercase;
  flex: 0 0 60px;
  /* 雕刻效果 - 凹陷文字，纯灰色无亮光 */
  color: #9a9a9a;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.08),
    0 -1px 0 rgba(0, 0, 0, 0.05);
}

/* 设置区域的文字标签 - 在顶部，靠上对齐 */
.sidebar-label--top {
  order: -1;
  justify-content: flex-start;
}

/* 设置区域的图标容器 - 固定大小正方形，靠下对齐 */
.sidebar-icons--bottom {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  padding: 0;
  align-self: center;
  justify-content: center;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, #2a2a2a, #1a1a1a);
  border-radius: 8px;
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

/* 图标按钮 - 所有图标都是亮色 */
.sidebar-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 2px auto;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-icon-btn:hover {
  background-color: rgba(100, 100, 100, 0.4);
  color: #ffffff;
}

/* 选中的图标 - 需求 1.3: 明显的高亮状态 */
.sidebar-icon-btn--active {
  background-color: rgba(100, 100, 100, 0.6);
  color: #ffffff;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* 设置按钮 - 正方形，亮色 */
.sidebar-icon-btn--settings {
  width: 32px;
  height: 32px;
  margin: 0;
  color: #e0e0e0;
}

/* 工具提示样式 - 需求 1.2: 优化显示效果 */
.sidebar-tooltip {
  position: fixed;
  z-index: 1000;
  background-color: #1a202c;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  transform: translateY(-50%);
  opacity: 0;
  animation: tooltipFadeIn 0.15s ease forwards;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

.sidebar-tooltip::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  border: 4px solid transparent;
  border-right-color: #1a202c;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  padding: 16px;
  border-bottom: 1px solid #374151;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f9fafb;
  cursor: pointer;
}

.logo-icon {
  color: #7a7a7a;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.25s ease-in-out;
}

.sidebar--collapsed .logo-text {
  opacity: 0;
  width: 0;
}

.sidebar__nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 4px;
  font-size: 14px;
  color: #d1d5db;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-align: left;
}

.nav-item:hover {
  background-color: #374151;
  color: #f9fafb;
}

.nav-item--active {
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.8), rgba(200, 218, 212, 0.7));
  color: #2c2c2e;
}

.nav-item__icon {
  flex: 0 0 20px;
  margin-right: 12px;
}

.nav-item__label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.25s ease-in-out;
}

.sidebar--collapsed .nav-item__label {
  opacity: 0;
  width: 0;
}

.sidebar__footer {
  padding: 16px;
  border-top: 1px solid #374151;
}

/* 中间内容面板样式 */
.middle-panel {
  flex: 1 !important;
  display: flex !important;
  flex-direction: row !important;
  background: linear-gradient(145deg, #b8b8b8, #a8a8a8) !important;
  border: none !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1) !important;
  z-index: 50 !important;
}

/* 左侧菜单列容器 */
.menu-column {
  flex: 0 0 280px;
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 用户信息区域 */
.user-section {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: none;
  background: transparent;
  gap: 10px;
  margin: 0;
  border-radius: 12px 12px 0 0;
}

/* 用户区域下方分割线 - 已移除 */

.user-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8a8a8a, #a0b0aa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
  margin-bottom: 1px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dropdown-arrow {
  font-size: 10px;
  color: #6c6c6e;
}

.user-email {
  font-size: 11px;
  color: #6c6c6e;
}

/* 用户下拉菜单 */
.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 8px 0;
  margin-top: 4px;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-menu-item:hover {
  background-color: #f7fafc;
}

.user-menu-divider {
  height: 1px;
  background-color: #e2e8f0;
  margin: 8px 0;
}

/* 分组区域样式 */
.section {
  padding: 10px 14px;
  background: transparent;
  border-bottom: none;
  margin: 0;
  position: relative;
}

/* 分组区域分割线 - 雕刻线效果 */
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

.section:last-child {
  border-bottom: none;
  margin: 0;
}

.section:last-child::after {
  display: none;
}

.section--history {
  flex: 1;
  margin-bottom: 0;
}

.section--documents {
  flex: 0 0 auto;
  border-bottom: none;
  padding-bottom: 14px;
  margin-bottom: 0;
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
  /* 雕刻效果 */
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
  text-align: center;
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
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 8px;
  font-size: 13px;
  color: #2c2c2e;
  margin-bottom: 0;
}

.section-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.section-item--active {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #2c2c2e;
  position: relative;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* 右侧独立标注线 - 左深右浅渐变，立体凸起 */
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

.section-item--active:hover {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.6), rgba(200, 218, 212, 0.5));
}

/* 选中状态的 badge - 接近白色的浅灰背景，与其他badge数字颜色一致 */
.section-item--active .item-badge {
  background-color: #e8e8e8;
  color: #5a5a5c;
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

.item-badge--highlight {
  background-color: #b0b0b0;
  color: #5a5a5c;
}

/* 搜索框样式 */
.search-box {
  position: relative;
  margin-bottom: 10px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a7a7c;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 10px 8px 32px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  background-color: rgba(160, 160, 160, 0.3);
  color: #2c2c2e;
  transition: all 0.2s;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 2px rgba(0, 0, 0, 0.08);
}

.search-input:focus {
  outline: none;
  background-color: #ffffff;
  border-color: rgba(150, 150, 150, 0.5);
}

.search-input::placeholder {
  color: #7a7a7c;
}

/* 文档树样式 */
.document-tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: 1.5px solid #7a7a7a;
  border-radius: 10px;
  padding: 10px;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.03);
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 6px;
  font-size: 12px;
  color: #2c2c2e;
  opacity: 0;
  animation: fadeInUp 0.3s ease forwards;
  margin-bottom: 0;
}

.tree-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.tree-item--nested {
  padding-left: 20px;
}

.tree-item--nested-2 {
  padding-left: 32px;
}

.tree-chevron {
  margin-right: 2px;
  color: #8e8e93;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.tree-item--expanded .tree-chevron {
  transform: rotate(90deg);
}

.tree-spacer {
  width: 14px;
  margin-right: 2px;
}

.tree-item--folder {
  font-weight: 500;
}

.tree-item--folder.tree-item--expanded {
  background-color: rgba(80, 80, 80, 0.2);
  border-radius: 4px;
  color: #2c2c2e;
}

.tree-item--file {
  color: #6c6c70;
}

.tree-item span {
  flex: 1;
}

.item-count {
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

.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: #9ca3af;
}

.content-placeholder p {
  margin: 8px 0 0 0;
  font-size: 14px;
}

/* 主工作区样式 */
.main-area {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  background-color: #a5a5a5 !important;
  overflow: hidden !important;
  min-width: 0 !important;
  border-radius: 8px !important;
  margin: 8px !important;
  margin-left: 0 !important;
  box-shadow: 
    inset 1px 1px 3px rgba(0, 0, 0, 0.08),
    inset -1px -1px 2px rgba(255, 255, 255, 0.25) !important;
}

/* 主工作区头部 */
.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: none;
  background-color: transparent;
  margin: 0;
}

.workspace-title h1 {
  font-size: 22px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 3px 0;
}

.workspace-subtitle {
  font-size: 13px;
  color: #6c6c6e;
  margin: 0;
}

/* 工作区操作按钮 */
.workspace-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  color: #4a4a4c;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: rgba(0, 0, 0, 0.2);
  background-color: rgba(255, 255, 255, 0.3);
}

.action-btn--primary {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  border-color: #8a8a8a;
  color: #2c2c2e;
}

.action-btn--primary:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
  border-color: #7a7a7a;
}

/* 主工作区内容 */
.workspace-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 统计卡片 */
.stats-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 12px;
  padding: 16px 20px;
  max-width: 320px;
  transition: all 0.3s ease;
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.stat-card:hover {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.6), rgba(200, 218, 212, 0.5));
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 16px;
  color: #2c2c2e;
  font-weight: 600;
}

.stat-icon {
  color: #6c6c6e;
}

.stat-content {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.stat-number {
  font-size: 48px;
  font-weight: 700;
  color: #2c2c2e;
  line-height: 1;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #7ee8a8;
  font-weight: 600;
  background: rgba(60, 60, 60, 0.85);
  border-radius: 6px;
  padding: 4px 8px;
  margin-bottom: 4px;
}

.stat-action {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #4a4a4c;
  font-size: 12px;
  font-weight: 500;
  transition: color 0.2s;
}

.stat-card:hover .stat-action {
  color: #2c2c2e;
}

.stat-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(165, 165, 165, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  color: #4a4a4c;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
}

.stat-action-btn:hover {
  background: rgba(165, 165, 165, 0.45);
  color: #2c2c2e;
}

/* 标签页区域 */
.tabs-section {
  flex: 1;
}

.tabs-section .section-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 12px 0;
}

.tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.tab {
  background: transparent;
  border: none;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: #8a8a8c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #4a4a4c;
}

.tab--active {
  color: #2c2c2e;
  border-bottom-color: #2c2c2e;
}

/* 主工作区搜索 */
.workspace-search {
  position: relative;
  margin-bottom: 16px;
  max-width: 320px;
}

.workspace-search .search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a7a7c;
  pointer-events: none;
}

.workspace-search .search-input {
  width: 100%;
  padding: 8px 32px 8px 32px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 12px;
  background-color: rgba(165, 165, 165, 0.5);
  color: #2c2c2e;
  transition: all 0.2s;
}

.workspace-search .search-input::placeholder {
  color: #7a7a7c;
}

.workspace-search .search-input:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.15);
  background-color: rgba(180, 180, 180, 0.6);
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.search-clear:hover {
  background-color: #edf2f7;
  color: #4a5568;
}

/* 内容区域 */
.content-area {
  flex: 1;
  min-height: 200px;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.loading-spinner {
  margin-bottom: 16px;
}

.spin {
  animation: spin 1s linear infinite;
  color: #6a6a6a;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}



/* 动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 通知系统 */
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.7), rgba(200, 218, 212, 0.6));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  animation: slideInRight 0.3s ease forwards;
}

.notification--success {
}

.notification--error {
}

.notification--warning {
}

.notification--info {
}

.notification-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.notification--success .notification-icon {
  color: #6a8a7a;
}

.notification--error .notification-icon {
  color: #e53e3e;
}

.notification--warning .notification-icon {
  color: #d69e2e;
}

.notification--info .notification-icon {
  color: #6a6a6a;
}

.notification-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
}

.notification-title {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}

.notification-message {
  font-size: 13px;
  color: #5a5a5c;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-close {
  background: transparent;
  border: none;
  color: #5a5a5c;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.notification-close:hover {
  background-color: rgba(255, 255, 255, 0.3);
  color: #2c2c2e;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 为各个区域添加动画延迟 */
.user-section {
  animation: slideIn 0.4s ease forwards;
}

.section:nth-child(2) {
  animation: slideIn 0.5s ease forwards;
}

.section:nth-child(3) {
  animation: slideIn 0.6s ease forwards;
}

.section:nth-child(4) {
  animation: slideIn 0.7s ease forwards;
}

.section:nth-child(5) {
  animation: slideIn 0.8s ease forwards;
}

.stat-card {
  animation: fadeInUp 0.6s ease forwards;
}

.tabs {
  animation: fadeInUp 0.7s ease forwards;
}

/* 悬停动画增强 */
.sidebar-icon-btn:hover {
  animation: pulse 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

/* 响应式 */
@media (max-width: 1024px) {
  .middle-panel {
    flex-basis: 320px;
    min-width: 320px;
    max-width: 320px;
  }
  
  .workspace-content {
    padding: 16px 24px;
  }
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  
  .narrow-sidebar {
    flex-direction: row;
    flex-basis: 60px;
    min-height: 60px;
    max-height: 60px;
    min-width: 100%;
    max-width: 100%;
    overflow-x: auto;
  }
  
  .narrow-sidebar__nav {
    flex-direction: row;
    padding: 0 16px;
    gap: 12px;
  }
  
  .narrow-sidebar__footer {
    border-top: none;
    border-left: 1px solid #2d3748;
    padding: 0 16px;
  }
  
  .middle-panel {
    flex-basis: auto;
    min-width: 100%;
    max-width: 100%;
    max-height: 300px;
  }
  
  .main-workspace {
    flex: 1;
  }
  
  .workspace-header {
    padding: 16px 20px 12px;
  }
  
  .workspace-content {
    padding: 16px 20px;
  }
  
  .stat-card {
    max-width: 100%;
  }
  
  .workspace-search {
    max-width: 100%;
  }
}

/* 视图切换动画 - 需求 6.4: 300ms 以内的平滑切换 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 交互反馈优化 - 需求 6.5 */
button,
.clickable {
  transition: all 0.15s ease;
}

button:active,
.clickable:active {
  transform: scale(0.98);
}

/* 统一可点击元素的 hover 和 active 状态 - 需求 6.5 */
.interactive-element {
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.interactive-element:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.interactive-element:active {
  transform: scale(0.98);
}
</style>
