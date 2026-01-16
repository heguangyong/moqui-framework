<template>
  <div class="settings-panel">
    <!-- 设置分类 -->
    <div class="section section--categories">
      <div class="section-title">设置</div>
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
        </div>
      </div>
    </div>
    
    <!-- 快捷操作 -->
    <div class="section">
      <div class="section-title">快捷操作</div>
      <div class="section-items">
        <div class="section-item" @click="handleQuickAction('clear-cache')">
          <component :is="icons.trash" :size="16" />
          <span>清除缓存</span>
        </div>
        <div class="section-item" @click="handleQuickAction('export-settings')">
          <component :is="icons.download" :size="16" />
          <span>导出设置</span>
        </div>
      </div>
    </div>
    
    <!-- 应用信息 -->
    <div class="section section--info">
      <div class="section-title">关于</div>
      <div class="app-info">
        <div class="app-logo">
          <component :is="icons.sparkles" :size="28" />
        </div>
        <div class="app-details">
          <div class="app-name">小说动漫生成器</div>
          <div class="app-version">版本 {{ appVersion }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useNavigationStore } from '../../stores/navigation.js';
import { useUIStore } from '../../stores/ui.js';
import { icons } from '../../utils/icons.js';

const navigationStore = useNavigationStore();
const uiStore = useUIStore();

// 应用版本
const appVersion = ref('1.0.0');

// 设置分类 - 精简为核心设置项
const categories = ref([
  { id: 'profile', name: '个人资料', icon: icons.user },
  { id: 'ai', name: 'AI服务', icon: icons.zap },
  { id: 'generation', name: '生成参数', icon: icons.settings },
  { id: 'interface', name: '界面设置', icon: icons.eye }
]);

// 当前激活的分类 - 从 navigationStore 获取
const activeCategory = computed(() => {
  return navigationStore.panelContext.settings?.activeCategory || 'profile';
});

// 分类点击处理
function handleCategoryClick(category) {
  // 更新面板上下文，Settings.vue 会监听这个变化
  navigationStore.updatePanelContext('settings', { activeCategory: category.id });
}

// 快捷操作处理
function handleQuickAction(action) {
  switch (action) {
    case 'clear-cache':
      // 清除缓存
      localStorage.removeItem('novel_anime_cache');
      uiStore.addNotification({
        type: 'success',
        title: '清除成功',
        message: '缓存已清除',
        timeout: 2000
      });
      break;
    case 'export-settings':
      // 导出设置
      const settings = {
        theme: localStorage.getItem('novel_anime_theme'),
        language: localStorage.getItem('novel_anime_language')
      };
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'novel-anime-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      uiStore.addNotification({
        type: 'success',
        title: '导出成功',
        message: '设置已导出',
        timeout: 2000
      });
      break;
  }
}

// 有效的分类ID列表
const validCategoryIds = categories.value.map(c => c.id);

// 初始化
onMounted(() => {
  // 如果没有设置过或是无效值，默认选中个人资料
  const currentCategory = navigationStore.panelContext.settings?.activeCategory;
  if (!currentCategory || !validCategoryIds.includes(currentCategory)) {
    navigationStore.updatePanelContext('settings', { activeCategory: 'profile' });
  }
});
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
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 8px;
  font-size: 13px;
  color: #5a5a5c;
  background: transparent;
  border: none;
  border-radius: 0;
}

.section-item:hover {
  color: #2c2c2e;
}

.section-item--active {
  background: rgba(205, 214, 210, 0.45);
  backdrop-filter: blur(10px);
  color: #2c2c2e;
  position: relative;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* 右侧独立标注线 - 纯色，立体凸起 */
.section-item--active::after {
  content: '';
  position: absolute;
  right: -14px;
  top: 3px;
  bottom: 3px;
  width: 5px;
  background: #a1a1a1;
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
