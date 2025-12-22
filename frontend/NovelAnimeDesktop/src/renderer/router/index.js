import { createRouter, createWebHashHistory } from 'vue-router';

// 视图组件导入
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';
import TestView from '../views/TestView.vue';
import Settings from '../views/Settings.vue';
import MyProjectsView from '../views/MyProjectsView.vue';
import WorkflowEditor from '../views/WorkflowEditor.vue';
import AssetsView from '../views/AssetsView.vue';
import CharactersView from '../views/CharactersView.vue';
import CharacterDetailView from '../views/CharacterDetailView.vue';
import ProfileView from '../views/ProfileView.vue';
import NovelsView from '../views/NovelsView.vue';
import ProjectDetailView from '../views/ProjectDetailView.vue';

console.log('🛣️ Router configuration loading...');

const routes = [
  // 登录页面 - 访客可访问
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guest: true }
  },
  // 默认重定向到仪表盘
  {
    path: '/',
    redirect: '/dashboard'
  },
  // 仪表盘
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  // 我的项目
  {
    path: '/projects',
    name: 'projects',
    component: MyProjectsView,
    meta: { requiresAuth: true }
  },
  // 项目详情
  {
    path: '/project/:id/detail',
    name: 'project-detail',
    component: ProjectDetailView,
    meta: { requiresAuth: true }
  },
  // 工作流编辑器
  {
    path: '/workflow',
    name: 'workflow',
    component: WorkflowEditor,
    meta: { requiresAuth: true }
  },
  // 资源库
  {
    path: '/assets',
    name: 'assets',
    component: AssetsView,
    meta: { requiresAuth: true }
  },
  // 角色管理
  {
    path: '/characters',
    name: 'characters',
    component: CharactersView,
    meta: { requiresAuth: true }
  },
  // 角色详情
  {
    path: '/characters/:id',
    name: 'character-detail',
    component: CharacterDetailView,
    meta: { requiresAuth: true }
  },
  // 小说管理
  {
    path: '/novels',
    name: 'novels',
    component: NovelsView,
    meta: { requiresAuth: true }
  },
  // 设置
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  // 个人资料
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  // 测试页面
  {
    path: '/test',
    name: 'test',
    component: TestView,
    meta: { requiresAuth: false }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 导航守卫 - 处理认证逻辑
router.beforeEach(async (to, from, next) => {
  console.log('🔍 Router beforeEach:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    guest: to.meta.guest
  });
  
  // 开发模式：检查是否有本地存储的认证状态
  const isAuthenticated = checkAuthStatus();
  
  // 如果页面需要认证且用户未登录
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('🚫 Auth required, redirecting to login');
    next({ 
      path: '/login', 
      query: { redirect: to.fullPath } 
    });
    return;
  }
  
  // 如果是访客页面（登录页）且用户已登录，重定向到仪表盘
  if (to.meta.guest && isAuthenticated) {
    console.log('✅ Already authenticated, redirecting to dashboard');
    next('/dashboard');
    return;
  }
  
  console.log('✅ Navigation allowed');
  next();
});

// 检查认证状态
function checkAuthStatus() {
  try {
    // 检查 localStorage 中的 token
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (token && user) {
      console.log('🔐 Found auth token in localStorage');
      return true;
    }
    
    // 开发模式：如果没有 token，检查是否启用了开发模式跳过认证
    const devMode = localStorage.getItem('dev_skip_auth');
    if (devMode === 'true') {
      console.log('🔧 Dev mode: skipping auth');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}

console.log('✅ Router configuration loaded');

export default router;
