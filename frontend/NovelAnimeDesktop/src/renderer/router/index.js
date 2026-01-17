import { createRouter, createWebHashHistory } from 'vue-router';

/**
 * 路由懒加载配置
 * 使用动态导入优化初始加载性能
 * 
 * Requirements: 9.2
 * 
 * 精简后的核心页面（10个）：
 * - LoginView: 用户登录
 * - DashboardView: 仪表盘（整合项目管理）
 * - WorkflowEditor: 工作流编辑器
 * - CharactersView: 角色列表
 * - CharacterDetailView: 角色详情
 * - AssetsView: 资源库
 * - GeneratedContentView: 生成结果
 * - PreviewView: 内容预览
 * - Settings: 设置
 * - ProfileView: 个人资料
 */

// 核心视图 - 立即加载（首屏需要）
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';

// 其他视图 - 懒加载（按需加载）
const Settings = () => import('../views/Settings.vue');
const WorkflowEditor = () => import('../views/WorkflowEditor.vue');
const AssetsView = () => import('../views/AssetsView.vue');
const CharactersView = () => import('../views/CharactersView.vue');
const CharacterDetailView = () => import('../views/CharacterDetailView.vue');
const ProfileView = () => import('../views/ProfileView.vue');
const PreviewView = () => import('../views/PreviewView.vue');
const GeneratedContentView = () => import('../views/GeneratedContentView.vue');

console.log('🛣️ Router configuration loading with lazy loading...');

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
  // 仪表盘（整合项目管理功能）
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  // 工作流编辑器
  {
    path: '/workflow',
    name: 'workflow',
    component: WorkflowEditor,
    meta: { requiresAuth: true }
  },
  // 生成结果预览
  {
    path: '/generated',
    name: 'generated',
    component: GeneratedContentView,
    meta: { requiresAuth: true }
  },
  // 内容预览
  {
    path: '/preview',
    name: 'preview',
    component: PreviewView,
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

// 检查认证状态 - 统一使用 novel_anime_* 前缀的 key
function checkAuthStatus() {
  try {
    // 检查 localStorage 中的 token
    const token = localStorage.getItem('novel_anime_access_token');
    const userData = localStorage.getItem('novel_anime_user_data');
    
    if (token && userData) {
      console.log('🔐 Found auth token in localStorage');
      return true;
    }
    
    // 只有 token 也算已认证（用户数据可能还未加载）
    if (token) {
      console.log('🔐 Found auth token (user data pending)');
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
