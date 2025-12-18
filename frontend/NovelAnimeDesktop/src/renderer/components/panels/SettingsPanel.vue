<template>
  <div class="settings-panel">
    <!-- Settings Categories -->
    <div class="section section--categories">
      <div class="section-title">Settings</div>
      <div class="section-items">
        <div 
          v-for="category in categories"
          :key="category.id"
          class="section-item"
          :class="{ 'section-item--active': activeCategory === category.id }"
          @click="handleCategoryClick(category)"
        >
          <component :is="category.icon" :size="16" />
          <span>{{ category.name }}</span>
          <component :is="icons.chevronRight" :size="14" class="item-arrow" />
        </div>
      </div>
    </div>
    
    <!-- App Info -->
    <div class="section section--info">
      <div class="section-title">About</div>
      <div class="app-info">
        <div class="app-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="app-details">
          <div class="app-name">Novel Anime Desktop</div>
          <div class="app-version">Version {{ appVersion }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore } from '../../stores/ui.js';
import { useNavigationStore } from '../../stores/navigation.js';
import { icons } from '../../utils/icons.js';

const router = useRouter();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();

// 状态
const activeCategory = ref('ai-config');
const appVersion = ref('1.0.0');

// 设置分类
const categories = ref([
  { id: 'ai-config', name: 'AI 配置', icon: icons.sparkles },
  { id: 'generation', name: '生成参数', icon: icons.zap },
  { id: 'interface', name: '界面设置', icon: icons.layers },
  { id: 'about', name: '关于', icon: icons.info }
]);

// 分类点击处理
function handleCategoryClick(category) {
  activeCategory.value = category.id;
  
  // 更新面板上下文
  navigationStore.updatePanelContext('settings', { activeCategory: category.id });
  
  uiStore.addNotification({
    type: 'info',
    title: category.name,
    message: `正在打开 ${category.name}`,
    timeout: 2000
  });
  
  router.push(`/settings/${category.id}`);
}
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.section {
  padding: 10px 14px;
  position: relative;
}

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

.section:last-child::after {
  display: none;
}

.section--categories {
  flex: 1;
}

.section--info {
  flex-shrink: 0;
}

.section-title {
  font-size: 9px;
  font-weight: 700;
  color: #9a9a9a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.08),
    0 -1px 0 rgba(0, 0, 0, 0.05);
}

.section-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 10px;
  font-size: 13px;
  color: #2c2c2e;
}

.section-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.section-item--active {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  backdrop-filter: blur(10px);
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

.section-item span {
  flex: 1;
}

.item-arrow {
  color: #9a9a9a;
  flex-shrink: 0;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: rgba(160, 160, 160, 0.2);
  border-radius: 8px;
}

.app-logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6a6a6a;
}

.app-details {
  flex: 1;
}

.app-name {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2e;
}

.app-version {
  font-size: 11px;
  color: #6c6c6e;
}
</style>
