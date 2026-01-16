<template>
  <div class="context-panel">
    <!-- 用户信息区域（始终显示） -->
    <div class="user-section" @click="toggleUserMenu">
      <div class="user-avatar">
        <div class="avatar-circle">
          <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="avatar" class="avatar-img" />
          <span v-else class="avatar-initials">{{ userInitials }}</span>
        </div>
      </div>
      <div class="user-info">
        <div class="user-name">{{ displayName }} <span class="dropdown-arrow">▾</span></div>
        <div class="user-email">{{ userEmail }}</div>
      </div>
      <!-- 积分显示 - 简洁样式 -->
      <div class="credits-display" @click.stop="showCreditsHistory">
        <component :is="icons.star" :size="14" />
        <span>{{ userCredits }}</span>
      </div>
    </div>
    
    <!-- 用户下拉菜单 - 系统风格 -->
    <div v-if="userMenuVisible" class="user-menu">
      <div class="user-menu-item" @click.stop="openProfileEdit">
        <component :is="icons.edit" :size="16" />
        <span>编辑资料</span>
      </div>
      <div class="user-menu-item" @click.stop="openChangePassword">
        <component :is="icons.lock" :size="16" />
        <span>修改密码</span>
      </div>
      <div class="user-menu-item" @click.stop="showCreditsHistory">
        <component :is="icons.star" :size="16" />
        <span>积分记录</span>
        <span class="menu-credits">{{ userCredits }}</span>
      </div>
      <div class="user-menu-divider"></div>
      <div class="user-menu-item user-menu-item--danger" @click.stop="handleLogout">
        <component :is="icons.logOut" :size="16" />
        <span>退出登录</span>
      </div>
    </div>
    
    <!-- 动态面板内容 -->
    <component 
      :is="currentPanelComponent" 
      v-bind="panelProps"
    />
    
    <!-- 积分历史对话框 -->
    <CreditsHistoryDialog 
      v-model="creditsHistoryVisible"
    />
    
    <!-- 编辑资料对话框 -->
    <ProfileEditDialog 
      v-model="profileEditVisible"
      @saved="onProfileSaved"
    />
    
    <!-- 修改密码对话框 -->
    <ChangePasswordDialog 
      v-model="changePasswordVisible"
      @changed="onPasswordChanged"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useNavigationStore } from '../../stores/navigation.js';
import { useUserStore } from '../../stores/user';
import { useUIStore } from '../../stores/ui';
import { icons } from '../../utils/icons.js';
import CreditsHistoryDialog from '../dialogs/CreditsHistoryDialog.vue';
import ProfileEditDialog from '../dialogs/ProfileEditDialog.vue';
import ChangePasswordDialog from '../dialogs/ChangePasswordDialog.vue';

// 异步加载面板组件
const DashboardPanel = defineAsyncComponent(() => import('./DashboardPanel.vue'));
const WorkflowContextPanel = defineAsyncComponent(() => import('./WorkflowContextPanel.vue'));
const AssetsPanel = defineAsyncComponent(() => import('./AssetsPanel.vue'));
const CharactersPanel = defineAsyncComponent(() => import('./CharactersPanel.vue'));
const SettingsPanel = defineAsyncComponent(() => import('./SettingsPanel.vue'));

// Props - 接收来自 App.vue 的用户数据
const props = defineProps({
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  userCredits: {
    type: Number,
    default: 0
  },
  userAvatarUrl: {
    type: String,
    default: null
  }
});

const router = useRouter();
const navigationStore = useNavigationStore();
const userStore = useUserStore();
const uiStore = useUIStore();

// 用户菜单状态
const userMenuVisible = ref(false);
const creditsHistoryVisible = ref(false);
const profileEditVisible = ref(false);
const changePasswordVisible = ref(false);

// 显示名称 - 使用 props（来自 userStore）
const displayName = computed(() => {
  return props.userName || 'User';
});

// 用户首字母（用于头像占位）
const userInitials = computed(() => {
  return userStore.initials || 'U';
});

// 面板组件映射
const panelComponentMap = {
  dashboard: DashboardPanel,
  workflow: WorkflowContextPanel,
  assets: AssetsPanel,
  characters: CharactersPanel,
  settings: SettingsPanel
};

// 当前面板组件 - 需求 2.1-2.5
const currentPanelComponent = computed(() => {
  return panelComponentMap[navigationStore.activeNavId] || DashboardPanel;
});

// 面板属性
const panelProps = computed(() => {
  return navigationStore.currentPanelContext;
});

// 切换用户菜单
function toggleUserMenu() {
  userMenuVisible.value = !userMenuVisible.value;
}

// 关闭用户菜单
function closeUserMenu() {
  userMenuVisible.value = false;
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  // 使用 nextTick 延迟检查，避免与菜单项点击冲突
  if (!userMenuVisible.value) return;
  
  const contextPanel = document.querySelector('.context-panel');
  const userMenu = document.querySelector('.user-menu');
  
  // 如果点击的是菜单内部，不关闭
  if (userMenu && userMenu.contains(event.target)) {
    return;
  }
  
  // 如果点击的是用户区域，由 toggleUserMenu 处理
  const userSection = document.querySelector('.user-section');
  if (userSection && userSection.contains(event.target)) {
    return;
  }
  
  // 其他区域点击，关闭菜单
  closeUserMenu();
}

// 显示积分历史
function showCreditsHistory() {
  userMenuVisible.value = false;
  creditsHistoryVisible.value = true;
}

// 打开编辑资料对话框 - Requirement 8.1
function openProfileEdit() {
  userMenuVisible.value = false;
  profileEditVisible.value = true;
}

// 打开修改密码对话框 - Requirement 8.1
function openChangePassword() {
  userMenuVisible.value = false;
  changePasswordVisible.value = true;
}

// 资料保存成功回调
function onProfileSaved() {
  uiStore.addNotification({
    type: 'success',
    title: '保存成功',
    message: '个人资料已更新'
  });
}

// 密码修改成功回调
function onPasswordChanged() {
  uiStore.addNotification({
    type: 'success',
    title: '修改成功',
    message: '密码已更新，请使用新密码登录'
  });
}

// 用户操作
function handleUserAction(action) {
  // 先关闭菜单
  userMenuVisible.value = false;
  
  // 使用 nextTick 确保菜单关闭后再导航
  nextTick(() => {
    switch (action) {
      case 'profile':
        // 更新 navigation store 的激活状态
        navigationStore.setActiveNav('settings');
        // 设置分类为个人资料
        navigationStore.updatePanelContext('settings', { activeCategory: 'profile' });
        // 导航到设置页面
        router.push('/settings');
        break;
      case 'settings':
        // 更新 navigation store 的激活状态
        navigationStore.setActiveNav('settings');
        // 设置分类为 AI 服务（默认）
        navigationStore.updatePanelContext('settings', { activeCategory: 'ai' });
        // 导航到设置页面
        router.push('/settings');
        break;
    }
  });
}

// 退出登录
async function handleLogout() {
  console.log('🚪 Logout initiated...');
  userMenuVisible.value = false;
  
  // 使用 userStore 进行登出
  await userStore.logout();
  console.log('🧹 User store logout completed');
  
  // 验证 localStorage 已清除
  const tokenAfterLogout = localStorage.getItem('novel_anime_access_token');
  console.log('🔍 Token after logout:', tokenAfterLogout ? 'STILL EXISTS!' : 'cleared');
  
  uiStore.addNotification({
    type: 'success',
    title: '已退出',
    message: '您已成功退出登录'
  });
  
  console.log('🔄 Redirecting to /login...');
  await router.push('/login');
  console.log('✅ Router push completed');
}

// 初始化
onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.context-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 用户信息区域 */
.user-section {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 10px;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.user-section:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #959da2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.avatar-initials {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
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

/* 积分显示 - 简洁样式 */
.credits-display {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--sidebar-text-secondary, #6c6c6e);
  cursor: pointer;
  border-radius: var(--border-radius, 6px);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.credits-display:hover {
  background-color: var(--sidebar-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--sidebar-text, #2c2c2e);
}

/* 用户下拉菜单 - 系统风格 */
.user-menu {
  position: absolute;
  top: 54px;
  left: 8px;
  right: 8px;
  z-index: 1000;
  background-color: #d8d8d8;
  border: 1px solid #c8c8c8;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 6px 0;
  animation: menuSlideIn 0.15s ease;
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #3c3c3e;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.user-menu-item:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.user-menu-item--danger {
  color: #c0392b;
}

.user-menu-item--danger:hover {
  background-color: rgba(192, 57, 43, 0.06);
}

.menu-credits {
  margin-left: auto;
  font-size: 12px;
  color: #8c8c8e;
}

.user-menu-divider {
  height: 1px;
  background-color: #c8c8c8;
  margin: 6px 0;
}

/* 头像图片 */
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
</style>
