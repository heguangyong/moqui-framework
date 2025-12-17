<template>
  <aside class="sidebar" :class="sidebarClasses">
    <!-- 侧边栏头部 -->
    <div class="sidebar__header">
      <div class="logo" @click="navigateToHome">
        <component 
          :is="icons.zap" 
          :size="24" 
          class="logo-icon"
        />
        <Transition name="fade">
          <span v-if="!collapsed" class="logo-text">
            小说动漫
          </span>
        </Transition>
      </div>
    </div>
    
    <!-- 主导航 -->
    <nav class="sidebar__nav">
      <div class="nav-section">
        <button
          v-for="item in mainNavigationItems"
          :key="item.id"
          class="nav-item"
          :class="{ 'nav-item--active': activeRoute === item.route }"
          @click="navigateTo(item.route)"
          @mouseenter="showTooltip(item, $event)"
          @mouseleave="hideTooltip"
          :aria-label="item.label"
        >
          <component 
            :is="item.icon" 
            :size="iconSize" 
            class="nav-item__icon"
          />
          <Transition name="slide-fade">
            <span v-if="!collapsed" class="nav-item__label">
              {{ item.label }}
            </span>
          </Transition>
          <Transition name="slide-fade">
            <span 
              v-if="item.badge && !collapsed" 
              class="nav-item__badge badge"
              :class="`badge--${item.badgeType || 'secondary'}`"
            >
              {{ item.badge }}
            </span>
          </Transition>
        </button>
      </div>
      
      <!-- 分隔线 -->
      <div v-if="!collapsed" class="nav-divider"></div>
      
      <!-- 项目相关导航 -->
      <div v-if="currentProject" class="nav-section">
        <div v-if="!collapsed" class="nav-section-title">
          当前项目
        </div>
        <button
          v-for="item in projectNavigationItems"
          :key="item.id"
          class="nav-item"
          :class="{ 'nav-item--active': activeRoute === item.route }"
          @click="navigateTo(item.route)"
          @mouseenter="showTooltip(item, $event)"
          @mouseleave="hideTooltip"
          :aria-label="item.label"
        >
          <component 
            :is="item.icon" 
            :size="iconSize" 
            class="nav-item__icon"
          />
          <Transition name="slide-fade">
            <span v-if="!collapsed" class="nav-item__label">
              {{ item.label }}
            </span>
          </Transition>
        </button>
      </div>
    </nav>
    
    <!-- 侧边栏底部 -->
    <div class="sidebar__footer">
      <button
        class="nav-item"
        @click="toggleSidebar"
        @mouseenter="showTooltip({ label: collapsed ? '展开侧边栏' : '收起侧边栏' }, $event)"
        @mouseleave="hideTooltip"
        :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
      >
        <component 
          :is="collapsed ? icons.chevronRight : icons.chevronLeft" 
          :size="iconSize" 
          class="nav-item__icon"
        />
        <Transition name="slide-fade">
          <span v-if="!collapsed" class="nav-item__label">
            收起
          </span>
        </Transition>
      </button>
      
      <button
        class="nav-item"
        @click="navigateTo('settings')"
        :class="{ 'nav-item--active': activeRoute === 'settings' }"
        @mouseenter="showTooltip({ label: '设置' }, $event)"
        @mouseleave="hideTooltip"
        aria-label="设置"
      >
        <component 
          :is="icons.settings" 
          :size="iconSize" 
          class="nav-item__icon"
        />
        <Transition name="slide-fade">
          <span v-if="!collapsed" class="nav-item__label">
            设置
          </span>
        </Transition>
      </button>
    </div>
    
    <!-- 工具提示 -->
    <Teleport to="body">
      <div
        v-if="tooltip.show && collapsed"
        class="nav-tooltip"
        :style="tooltipStyle"
      >
        {{ tooltip.text }}
      </div>
    </Teleport>
  </aside>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore } from '@/stores/ui.js';
import { useProjectStore } from '@/stores/project.js';
import { icons } from '@/utils/icons.js';

// Props
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  activeRoute: {
    type: String,
    default: 'home'
  }
});

// Emits
const emit = defineEmits(['navigate', 'toggle']);

// Stores
const router = useRouter();
const uiStore = useUIStore();
const projectStore = useProjectStore();

// Reactive data
const tooltip = reactive({
  show: false,
  text: '',
  x: 0,
  y: 0
});

// Computed
const sidebarClasses = computed(() => ({
  'sidebar--collapsed': props.collapsed,
  'sidebar--expanded': !props.collapsed
}));

const iconSize = computed(() => props.collapsed ? 20 : 18);

const currentProject = computed(() => projectStore.currentProject);

// 主导航项
const mainNavigationItems = computed(() => [
  {
    id: 'home',
    route: 'home',
    label: '首页',
    icon: icons.home,
    shortcut: 'Ctrl+1'
  },
  {
    id: 'files',
    route: 'files',
    label: '文件',
    icon: icons.fileText,
    badge: projectStore.fileCount || null,
    badgeType: 'secondary',
    shortcut: 'Ctrl+2'
  },
  {
    id: 'edit',
    route: 'edit',
    label: '编辑',
    icon: icons.edit,
    shortcut: 'Ctrl+3'
  },
  {
    id: 'workflow',
    route: 'workflow',
    label: '工作流',
    icon: icons.workflow,
    badge: projectStore.workflowCount || null,
    badgeType: 'primary',
    shortcut: 'Ctrl+4'
  }
]);

// 项目相关导航项
const projectNavigationItems = computed(() => {
  if (!currentProject.value) return [];
  
  return [
    {
      id: 'project-overview',
      route: `project/${currentProject.value.id}`,
      label: '项目概览',
      icon: icons.grid
    },
    {
      id: 'project-characters',
      route: `project/${currentProject.value.id}/characters`,
      label: '角色管理',
      icon: icons.users
    },
    {
      id: 'project-assets',
      route: `project/${currentProject.value.id}/assets`,
      label: '素材库',
      icon: icons.star
    }
  ];
});

const tooltipStyle = computed(() => ({
  position: 'fixed',
  left: `${tooltip.x}px`,
  top: `${tooltip.y}px`,
  transform: 'translateY(-50%)',
  zIndex: 'var(--z-tooltip)'
}));

// Methods
function navigateTo(route) {
  emit('navigate', route);
  router.push(`/${route}`);
}

function navigateToHome() {
  navigateTo('home');
}

function toggleSidebar() {
  emit('toggle');
  uiStore.toggleSidebar();
}

function showTooltip(item, event) {
  if (!props.collapsed) return;
  
  const rect = event.currentTarget.getBoundingClientRect();
  tooltip.show = true;
  tooltip.text = item.label;
  tooltip.x = rect.right + 8;
  tooltip.y = rect.top + rect.height / 2;
}

function hideTooltip() {
  tooltip.show = false;
}

// 键盘快捷键处理
function handleKeydown(event) {
  if (event.ctrlKey || event.metaKey) {
    const keyMap = {
      '1': 'home',
      '2': 'files',
      '3': 'edit',
      '4': 'workflow'
    };
    
    const route = keyMap[event.key];
    if (route) {
      event.preventDefault();
      navigateTo(route);
    }
  }
  
  // Alt + S: 切换侧边栏
  if (event.altKey && event.key === 's') {
    event.preventDefault();
    toggleSidebar();
  }
}

// 生命周期
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  console.log('SidebarNavigation mounted, collapsed:', props.collapsed);
  console.log('Active route:', props.activeRoute);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.sidebar {
  flex: 0 0 var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  transition: flex-basis var(--transition-normal);
  user-select: none;
  
  &--expanded {
    flex-basis: var(--sidebar-width-expanded);
  }
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--sidebar-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--sidebar-text);
  cursor: pointer;
  transition: var(--transition-colors);
  
  &:hover {
    color: var(--sidebar-text);
    
    .logo-icon {
      color: var(--color-primary-hover);
    }
  }
}

.logo-icon {
  color: var(--color-primary);
  transition: var(--transition-colors);
}

.logo-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.sidebar__nav {
  flex: 1;
  padding: var(--spacing-4) 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-section {
  margin-bottom: var(--spacing-4);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.nav-section-title {
  padding: 0 var(--spacing-4) var(--spacing-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--sidebar-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-divider {
  height: 1px;
  margin: var(--spacing-4) var(--spacing-4);
  background-color: var(--sidebar-border);
}

.nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  margin-bottom: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--sidebar-text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition-colors);
  text-align: left;
  position: relative;
  
  &:hover {
    background-color: var(--sidebar-bg-hover);
    color: var(--sidebar-text);
  }
  
  &--active {
    background-color: var(--color-primary);
    color: var(--text-inverse);
    
    &:hover {
      background-color: var(--color-primary-hover);
    }
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background-color: var(--text-inverse);
      border-radius: 0 2px 2px 0;
    }
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
}

.nav-item__icon {
  flex: 0 0 20px;
  margin-right: var(--spacing-3);
  transition: var(--transition-colors);
}

.nav-item__label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item__badge {
  margin-left: auto;
  font-size: var(--font-size-xs);
}

.sidebar__footer {
  padding: var(--spacing-4);
  border-top: 1px solid var(--sidebar-border);
}

/* 工具提示 */
.nav-tooltip {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  color: var(--text-inverse);
  background-color: var(--sidebar-bg);
  border-radius: var(--border-radius);
  white-space: nowrap;
  box-shadow: var(--main-area-shadow);
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 4px solid transparent;
    border-right-color: var(--sidebar-bg);
  }
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all var(--transition-normal);
}

.slide-fade-leave-active {
  transition: all var(--transition-fast);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 响应式 */
@media (max-width: 1024px) {
  .sidebar {
    flex-basis: var(--sidebar-width) !important;
  }
  
  .nav-item__label,
  .nav-item__badge,
  .nav-section-title,
  .nav-divider {
    display: none;
  }
  
  .logo-text {
    display: none;
  }
}

@media (max-width: 768px) {
  .sidebar {
    flex: 0 0 60px;
    flex-direction: row;
    height: 60px;
    border-right: none;
    border-bottom: 1px solid var(--sidebar-border);
  }
  
  .sidebar__header {
    flex: 0 0 60px;
    height: 100%;
    border-right: 1px solid var(--sidebar-border);
    border-bottom: none;
  }
  
  .sidebar__nav {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0 var(--spacing-2);
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .nav-section {
    display: flex;
    margin-bottom: 0;
    margin-right: var(--spacing-2);
  }
  
  .sidebar__footer {
    flex: 0 0 auto;
    display: flex;
    padding: var(--spacing-2);
    border-top: none;
    border-left: 1px solid var(--sidebar-border);
  }
  
  .nav-item {
    margin-bottom: 0;
    margin-right: var(--spacing-1);
    min-width: 44px;
    justify-content: center;
  }
}
</style>