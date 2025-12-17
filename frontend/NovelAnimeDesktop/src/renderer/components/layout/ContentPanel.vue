<template>
  <div 
    class="content-panel" 
    :style="{ flexBasis: `${width}px` }"
    :class="contentPanelClasses"
  >
    <!-- 面板头部 -->
    <div class="content-panel__header">
      <div class="content-panel__title-section">
        <h2 class="content-panel__title">{{ title }}</h2>
        <p v-if="subtitle" class="content-panel__subtitle">
          {{ subtitle }}
        </p>
      </div>
      
      <div class="content-panel__actions">
        <slot name="header-actions">
          <button 
            v-if="collapsible"
            class="icon-btn icon-btn--sm"
            @click="toggleCollapse"
            :title="collapsed ? '展开面板' : '收起面板'"
          >
            <component 
              :is="collapsed ? icons.chevronRight : icons.chevronLeft" 
              :size="16" 
            />
          </button>
        </slot>
      </div>
    </div>
    
    <!-- 面板主体 -->
    <div class="content-panel__body" v-show="!collapsed">
      <!-- 搜索区域 -->
      <div v-if="showSearch" class="content-panel__search">
        <div class="search-box">
          <component 
            :is="icons.search" 
            :size="16" 
            class="search-box__icon"
          />
          <input
            v-model="searchQuery"
            type="text"
            class="input search-box__input"
            :placeholder="searchPlaceholder"
            @input="handleSearch"
            @keydown.escape="clearSearch"
            ref="searchInput"
          />
          <button
            v-if="searchQuery"
            class="icon-btn icon-btn--sm search-box__clear"
            @click="clearSearch"
            title="清除搜索"
          >
            <component :is="icons.close" :size="14" />
          </button>
        </div>
        
        <!-- 搜索过滤器 -->
        <div v-if="showFilters && searchFilters.length > 0" class="search-filters">
          <button
            v-for="filter in searchFilters"
            :key="filter.id"
            class="filter-chip"
            :class="{ 'filter-chip--active': filter.active }"
            @click="toggleFilter(filter)"
          >
            <component 
              v-if="filter.icon" 
              :is="filter.icon" 
              :size="14" 
              class="filter-chip__icon"
            />
            {{ filter.label }}
            <span v-if="filter.count" class="filter-chip__count">
              {{ filter.count }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="content-panel__content" :class="contentClasses">
        <slot>
          <div class="content-panel-placeholder">
            <component :is="placeholderIcon" :size="32" class="placeholder-icon" />
            <p class="placeholder-text">{{ placeholderText }}</p>
          </div>
        </slot>
      </div>
      
      <!-- 底部操作区 -->
      <div v-if="$slots.footer" class="content-panel__footer">
        <slot name="footer"></slot>
      </div>
    </div>
    
    <!-- 调整手柄 -->
    <div 
      v-if="resizable && !collapsed"
      class="content-panel__resize-handle"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useUIStore } from '@/stores/ui.js';
import { icons } from '@/utils/icons.js';

// Props
const props = defineProps({
  title: {
    type: String,
    default: '内容'
  },
  subtitle: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    default: 300
  },
  minWidth: {
    type: Number,
    default: 240
  },
  maxWidth: {
    type: Number,
    default: 500
  },
  resizable: {
    type: Boolean,
    default: true
  },
  collapsible: {
    type: Boolean,
    default: false
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: '搜索内容...'
  },
  showFilters: {
    type: Boolean,
    default: false
  },
  searchFilters: {
    type: Array,
    default: () => []
  },
  placeholderIcon: {
    type: Object,
    default: () => icons.fileText
  },
  placeholderText: {
    type: String,
    default: '暂无内容'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits([
  'update:width',
  'update:collapsed',
  'search',
  'filter-change',
  'resize-start',
  'resize-end'
]);

// Stores
const uiStore = useUIStore();

// Reactive data
const searchQuery = ref('');
const isResizing = ref(false);
const searchInput = ref(null);

// Computed
const contentPanelClasses = computed(() => ({
  'content-panel--collapsed': props.collapsed,
  'content-panel--resizable': props.resizable,
  'content-panel--loading': props.loading
}));

const contentClasses = computed(() => ({
  'content-panel__content--with-search': props.showSearch,
  'content-panel__content--with-filters': props.showFilters && props.searchFilters.length > 0
}));

// Watch for search query changes from parent
watch(() => uiStore.project.searchQuery, (newQuery) => {
  searchQuery.value = newQuery;
});

// Methods
function handleSearch() {
  emit('search', searchQuery.value);
  uiStore.setSearchQuery(searchQuery.value);
}

function clearSearch() {
  searchQuery.value = '';
  handleSearch();
  
  // 重新聚焦搜索框
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus();
    }
  });
}

function toggleFilter(filter) {
  const updatedFilter = { ...filter, active: !filter.active };
  emit('filter-change', updatedFilter);
  
  if (updatedFilter.active) {
    uiStore.addSearchFilter(updatedFilter);
  } else {
    uiStore.removeSearchFilter(updatedFilter.type);
  }
}

function toggleCollapse() {
  emit('update:collapsed', !props.collapsed);
}

// Resize functionality
function startResize(event) {
  isResizing.value = true;
  emit('resize-start');
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  event.preventDefault();
}

function handleResize(event) {
  if (!isResizing.value) return;
  
  const rect = document.querySelector('.app-layout').getBoundingClientRect();
  const sidebarWidth = uiStore.layout.sidebarCollapsed ? 64 : 240;
  const newWidth = event.clientX - rect.left - sidebarWidth;
  
  const clampedWidth = Math.max(
    props.minWidth,
    Math.min(props.maxWidth, newWidth)
  );
  
  emit('update:width', clampedWidth);
}

function stopResize() {
  isResizing.value = false;
  emit('resize-end');
  
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
}

// 键盘快捷键
function handleKeydown(event) {
  // Ctrl/Cmd + F: 聚焦搜索
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault();
    if (props.showSearch && searchInput.value) {
      searchInput.value.focus();
      searchInput.value.select();
    }
  }
}

// 生命周期
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  
  // 清理resize事件监听器
  if (isResizing.value) {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }
});
</script>

<style scoped>
.content-panel {
  flex: 0 0 var(--content-panel-width);
  display: flex;
  flex-direction: column;
  background-color: var(--content-panel-bg);
  border-right: 1px solid var(--content-panel-border);
  min-width: var(--content-panel-min-width);
  max-width: var(--content-panel-max-width);
  overflow: hidden;
  position: relative;
  transition: flex-basis var(--transition-normal);
  
  &--collapsed {
    flex-basis: 0;
    min-width: 0;
  }
  
  &--loading {
    opacity: 0.7;
    pointer-events: none;
  }
}

.content-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--content-panel-border);
  background-color: var(--main-area-bg);
}

.content-panel__title-section {
  flex: 1;
  min-width: 0;
}

.content-panel__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-panel__subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: var(--spacing-1) 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-left: var(--spacing-2);
}

.content-panel__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-panel__search {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--content-panel-border);
  background-color: var(--main-area-bg);
}

.search-box {
  position: relative;
  margin-bottom: var(--spacing-3);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.search-box__input {
  padding-left: var(--spacing-10);
  padding-right: var(--spacing-8);
}

.search-box__icon {
  position: absolute;
  left: var(--spacing-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-box__clear {
  position: absolute;
  right: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: var(--transition-colors);
  
  &:hover {
    background-color: var(--bg-active);
    color: var(--text-primary);
  }
  
  &--active {
    background-color: var(--color-primary);
    color: var(--text-inverse);
    border-color: var(--color-primary);
    
    &:hover {
      background-color: var(--color-primary-hover);
    }
  }
}

.filter-chip__icon {
  flex: 0 0 auto;
}

.filter-chip__count {
  padding: 0 var(--spacing-1);
  font-size: var(--font-size-xs);
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-sm);
  min-width: 16px;
  text-align: center;
}

.content-panel__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-2);
  
  &--with-search {
    padding-top: 0;
  }
  
  &--with-filters {
    padding-top: 0;
  }
}

.content-panel__footer {
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--content-panel-border);
  background-color: var(--bg-hover);
}

.content-panel-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--text-tertiary);
}

.placeholder-icon {
  margin-bottom: var(--spacing-3);
  opacity: 0.5;
}

.placeholder-text {
  font-size: var(--font-size-sm);
  margin: 0;
}

.content-panel__resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  bottom: 0;
  width: 4px;
  background: transparent;
  cursor: col-resize;
  z-index: 10;
  transition: background-color var(--transition-fast);
  
  &:hover {
    background-color: var(--color-primary);
    opacity: 0.5;
  }
}

/* 响应式 */
@media (max-width: 1024px) {
  .content-panel {
    flex-basis: 280px !important;
    min-width: 240px;
  }
}

@media (max-width: 768px) {
  .content-panel {
    flex: 0 0 200px;
    resize: vertical;
    border-right: none;
    border-bottom: 1px solid var(--content-panel-border);
  }
  
  .content-panel__resize-handle {
    display: none;
  }
  
  .content-panel__header {
    min-height: 56px;
    padding: var(--spacing-3);
  }
  
  .content-panel__search {
    padding: var(--spacing-3);
  }
  
  .search-filters {
    gap: var(--spacing-1);
  }
  
  .filter-chip {
    font-size: 10px;
    padding: 2px var(--spacing-1);
  }
}

/* 加载状态 */
.content-panel--loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>