<template>
  <div class="tab-bar" ref="tabBarRef">
    <div class="tabs-container" ref="tabsContainerRef">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab"
        :class="{ 
          'tab--active': activeTabId === tab.id,
          'tab--modified': tab.modified
        }"
        @click="selectTab(tab)"
        @mousedown.middle="closeTab(tab)"
      >
        <component 
          v-if="tab.icon" 
          :is="tab.icon" 
          :size="14" 
          class="tab-icon"
        />
        <span class="tab-title">{{ tab.title }}</span>
        <span v-if="tab.modified" class="tab-modified-indicator">●</span>
        <button 
          class="tab-close"
          @click.stop="closeTab(tab)"
          @mousedown.stop
        >
          <component :is="icons.x" :size="12" />
        </button>
      </div>
    </div>
    
    <!-- 溢出菜单 -->
    <div v-if="hasOverflow" class="overflow-menu">
      <button class="overflow-btn" @click="toggleOverflowMenu">
        <component :is="icons.chevronDown" :size="16" />
      </button>
      
      <div v-if="showOverflowMenu" class="overflow-dropdown">
        <div 
          v-for="tab in overflowTabs" 
          :key="tab.id"
          class="overflow-item"
          :class="{ 'overflow-item--active': activeTabId === tab.id }"
          @click="selectTab(tab); showOverflowMenu = false"
        >
          <component 
            v-if="tab.icon" 
            :is="tab.icon" 
            :size="14" 
            class="overflow-icon"
          />
          <span>{{ tab.title }}</span>
          <span v-if="tab.modified" class="overflow-modified">●</span>
        </div>
      </div>
    </div>
    
    <!-- 新建标签按钮 -->
    <button v-if="showAddButton" class="add-tab-btn" @click="$emit('add')">
      <component :is="icons.plus" :size="14" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { icons } from '../../utils/icons.js';

const props = defineProps({
  tabs: {
    type: Array,
    default: () => []
  },
  activeTabId: {
    type: String,
    default: ''
  },
  showAddButton: {
    type: Boolean,
    default: false
  },
  maxVisibleTabs: {
    type: Number,
    default: 8
  }
});

const emit = defineEmits(['select', 'close', 'add']);

// Refs
const tabBarRef = ref(null);
const tabsContainerRef = ref(null);
const showOverflowMenu = ref(false);
const visibleTabCount = ref(props.maxVisibleTabs);

// 计算溢出标签
const hasOverflow = computed(() => props.tabs.length > visibleTabCount.value);
const visibleTabs = computed(() => props.tabs.slice(0, visibleTabCount.value));
const overflowTabs = computed(() => props.tabs.slice(visibleTabCount.value));

// 方法
function selectTab(tab) {
  emit('select', tab);
}

function closeTab(tab) {
  emit('close', tab);
}

function toggleOverflowMenu() {
  showOverflowMenu.value = !showOverflowMenu.value;
}

// 计算可见标签数量
function calculateVisibleTabs() {
  if (!tabsContainerRef.value) return;
  
  const containerWidth = tabsContainerRef.value.offsetWidth;
  const tabWidth = 150; // 估计每个标签的宽度
  const maxTabs = Math.floor(containerWidth / tabWidth);
  visibleTabCount.value = Math.max(1, Math.min(maxTabs, props.maxVisibleTabs));
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  if (showOverflowMenu.value && !event.target.closest('.overflow-menu')) {
    showOverflowMenu.value = false;
  }
}

// 生命周期
onMounted(() => {
  calculateVisibleTabs();
  window.addEventListener('resize', calculateVisibleTabs);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('resize', calculateVisibleTabs);
  document.removeEventListener('click', handleClickOutside);
});

// 监听标签变化
watch(() => props.tabs.length, () => {
  nextTick(calculateVisibleTabs);
});
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  height: 36px;
  background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 0 8px;
  gap: 4px;
}

.tabs-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 2px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px 6px 0 0;
  font-size: 12px;
  color: #6c6c6e;
  cursor: pointer;
  transition: all 0.15s;
  max-width: 150px;
  min-width: 80px;
  position: relative;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.3);
  color: #2c2c2e;
}

.tab--active {
  background: rgba(255, 255, 255, 0.5);
  color: #2c2c2e;
  font-weight: 500;
}

.tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #4a90d9;
  border-radius: 2px 2px 0 0;
}

.tab--modified .tab-title {
  font-style: italic;
}

.tab-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-modified-indicator {
  color: #e67e22;
  font-size: 10px;
  margin-left: -2px;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  color: #8a8a8c;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
}

.tab:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #e74c3c;
}

/* 溢出菜单 */
.overflow-menu {
  position: relative;
}

.overflow-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  color: #6c6c6e;
  cursor: pointer;
  transition: all 0.15s;
}

.overflow-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #2c2c2e;
}

.overflow-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  min-width: 180px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  margin-top: 4px;
}

.overflow-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #4a4a4c;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}

.overflow-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.overflow-item--active {
  background: rgba(74, 144, 217, 0.1);
  color: #4a90d9;
}

.overflow-icon {
  opacity: 0.7;
}

.overflow-modified {
  color: #e67e22;
  font-size: 10px;
  margin-left: auto;
}

/* 新建标签按钮 */
.add-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  color: #6c6c6e;
  cursor: pointer;
  transition: all 0.15s;
}

.add-tab-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #4a90d9;
}
</style>
