<template>
  <div class="app-layout" :class="layoutClasses">
    <!-- 侧边栏 -->
    <SidebarNavigation
      :collapsed="uiStore.layout.sidebarCollapsed"
      :active-route="uiStore.navigation.activeRoute"
      @navigate="handleNavigate"
      @toggle="uiStore.toggleSidebar"
    />
    
    <!-- 内容面板 -->
    <ContentPanel
      :title="contentPanelTitle"
      :width="uiStore.layout.contentPanelWidth"
      :show-search="showSearch"
      :search-placeholder="searchPlaceholder"
      :placeholder-text="contentPanelPlaceholder"
      @update:width="uiStore.setContentPanelWidth"
      @search="handleContentSearch"
    >
      <slot name="content-panel">
        <!-- 默认内容将由路由组件提供 -->
      </slot>
      
      <template #header-actions>
        <button 
          class="icon-btn icon-btn--sm"
          @click="uiStore.toggleSidebar()"
          title="切换侧边栏"
        >
          <component :is="icons.menu" :size="16" />
        </button>
      </template>
    </ContentPanel>
    
    <!-- 主工作区 -->
    <main class="main-area" :class="mainAreaClasses">
      <div class="main-area__header">
        <div class="main-area__title-section">
          <h1 class="main-area__title">{{ mainAreaTitle }}</h1>
          <p v-if="mainAreaSubtitle" class="main-area__subtitle">
            {{ mainAreaSubtitle }}
          </p>
        </div>
        
        <div class="main-area__actions">
          <slot name="main-actions">
            <button
              class="icon-btn"
              @click="toggleFullscreen"
              :title="uiStore.layout.fullscreenMode ? '退出全屏' : '全屏'"
            >
              <component 
                :is="uiStore.layout.fullscreenMode ? icons.minimize : icons.maximize" 
                :size="20" 
              />
            </button>
          </slot>
        </div>
      </div>
      
      <div class="main-area__body">
        <slot name="main-content">
          <div class="main-area-placeholder">
            <component :is="icons.fileText" :size="48" class="placeholder-icon" />
            <h3>欢迎使用小说动漫生成器</h3>
            <p class="text-secondary">选择左侧功能开始创作您的作品</p>
          </div>
        </slot>
      </div>
    </main>
    
    <!-- 调整手柄 -->
    <div 
      class="resize-handle"
      @mousedown="startResize"
    ></div>
    
    <!-- 通知容器 -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore } from '@/stores/ui.js';
import { icons } from '@/utils/icons.js';
import NotificationContainer from '@/components/ui/NotificationContainer.vue';
import SidebarNavigation from './SidebarNavigation.vue';
import ContentPanel from './ContentPanel.vue';

// Props
const props = defineProps({
  contentPanelTitle: {
    type: String,
    default: '项目'
  },
  mainAreaTitle: {
    type: String,
    default: 'Dashboard'
  },
  mainAreaSubtitle: {
    type: String,
    default: ''
  },
  showSearch: {
    type: Boolean,
    default: true
  }
});

// Stores and router
const uiStore = useUIStore();
const router = useRouter();

// Reactive data
const searchQuery = ref('');
const isResizing = ref(false);

// 处理导航事件
function handleNavigate(route) {
  uiStore.setActiveRoute(route);
}

// 处理内容面板搜索
function handleContentSearch(query) {
  uiStore.setSearchQuery(query);
}

// Computed classes
const layoutClasses = computed(() => ({
  'app-layout--fullscreen': uiStore.layout.fullscreenMode
}));

const mainAreaClasses = computed(() => ({
  'main-area--fullscreen': uiStore.layout.fullscreenMode,
  [`main-area--${uiStore.layout.mainAreaMode}`]: true
}));

// Methods

function handleSearch() {
  uiStore.setSearchQuery(searchQuery.value);
}

function clearSearch() {
  searchQuery.value = '';
  uiStore.clearSearch();
}

function toggleFullscreen() {
  uiStore.toggleFullscreen();
}

// Resize functionality
function startResize(event) {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  event.preventDefault();
}

function handleResize(event) {
  if (!isResizing.value) return;
  
  const rect = document.querySelector('.app-layout').getBoundingClientRect();
  const sidebarWidth = uiStore.layout.sidebarCollapsed ? 64 : 240;
  const newWidth = event.clientX - rect.left - sidebarWidth;
  
  uiStore.setContentPanelWidth(newWidth);
}

function stopResize() {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
}

// Lifecycle
onMounted(() => {
  // 初始化UI状态
  uiStore.initializeFromStorage();
  
  // 调试信息
  console.log('MainLayout mounted, sidebar collapsed:', uiStore.layout.sidebarCollapsed);
  console.log('UI Store state:', uiStore.layout);
  
  // 监听键盘快捷键
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

function handleKeydown(event) {
  // Ctrl/Cmd + B: 切换侧边栏
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault();
    uiStore.toggleSidebar();
  }
  
  // F11: 切换全屏
  if (event.key === 'F11') {
    event.preventDefault();
    toggleFullscreen();
  }
  
  // Ctrl/Cmd + K: 聚焦搜索
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    const searchInput = document.querySelector('.search-box__input');
    if (searchInput) {
      searchInput.focus();
    }
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--content-panel-bg);
}

/* 确保侧边栏可见 */
.sidebar {
  flex: 0 0 var(--sidebar-width-expanded);
  display: flex;
  flex-direction: column;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  transition: flex-basis var(--transition-normal);
  z-index: 10;
}

.sidebar--collapsed {
  flex-basis: var(--sidebar-width) !important;
}

/* 内容面板 */
.content-panel {
  flex: 0 0 var(--content-panel-width);
  display: flex;
  flex-direction: column;
  background-color: var(--content-panel-bg);
  border-right: 1px solid var(--content-panel-border);
  min-width: var(--content-panel-min-width);
  max-width: var(--content-panel-max-width);
  overflow: hidden;
}

/* 主工作区 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--main-area-bg);
  overflow: hidden;
  
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 var(--spacing-6);
    border-bottom: 1px solid var(--border-color);
    background-color: var(--main-area-bg);
  }
  
  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0;
  }
  
  &__subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: var(--spacing-1) 0 0 0;
  }
  
  &__body {
    flex: 1;
    padding: var(--spacing-6);
    overflow-y: auto;
  }
}



.content-panel-placeholder,
.main-area-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-secondary);
}

.placeholder-icon {
  margin-bottom: var(--spacing-4);
  color: var(--text-tertiary);
}

.main-area-placeholder h3 {
  margin-bottom: var(--spacing-2);
  color: var(--text-primary);
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: transparent;
  cursor: col-resize;
  z-index: 10;
  left: calc(var(--sidebar-width) + var(--content-panel-width));
  transition: left var(--transition-normal);
}

.resize-handle:hover {
  background: var(--color-primary);
  opacity: 0.5;
}

.app-layout--fullscreen .sidebar,
.app-layout--fullscreen .content-panel,
.app-layout--fullscreen .resize-handle {
  display: none;
}

.main-area__title-section {
  flex: 1;
}

.main-area__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .sidebar {
    flex-basis: var(--sidebar-width) !important;
  }
  
  .nav-item__label,
  .nav-item__badge {
    display: none;
  }
  
  .content-panel {
    flex-basis: 280px !important;
  }
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  
  .sidebar {
    flex: 0 0 60px;
    flex-direction: row;
  }
  
  .sidebar__nav {
    display: flex;
    flex-direction: row;
    padding: 0 var(--spacing-4);
  }
  
  .sidebar__header,
  .sidebar__footer {
    display: none;
  }
  
  .content-panel {
    flex: 0 0 200px;
    resize: vertical;
  }
  
  .resize-handle {
    display: none;
  }
}
</style>