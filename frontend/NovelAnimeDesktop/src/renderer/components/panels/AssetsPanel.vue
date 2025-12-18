<template>
  <div class="assets-panel">
    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <component :is="icons.search" :size="14" class="search-icon" />
        <input 
          type="text" 
          placeholder="搜索资源..." 
          class="search-input"
          v-model="searchQuery"
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">
          <component :is="icons.x" :size="12" />
        </button>
      </div>
    </div>
    
    <!-- 分类 分组 -->
    <div class="section">
      <div class="section-title">分类</div>
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
          <span v-if="category.count > 0" class="item-badge">{{ category.count }}</span>
        </div>
      </div>
    </div>
    
    <!-- 筛选 分组 -->
    <div class="section">
      <div class="section-title">筛选</div>
      <div class="filter-tags">
        <span 
          v-for="filter in filters"
          :key="filter.id"
          class="filter-tag"
          :class="{ 'filter-tag--active': activeFilters.includes(filter.id) }"
          @click="toggleFilter(filter.id)"
        >
          {{ filter.name }}
        </span>
      </div>
    </div>
    
    <!-- 最近资源 分组 -->
    <div class="section section--recent">
      <div class="section-title">最近</div>
      <div class="section-items">
        <div 
          v-for="asset in recentAssets"
          :key="asset.id"
          class="section-item"
          :class="{ 'section-item--active': activeAsset === asset.id }"
          @click="handleAssetClick(asset)"
        >
          <component :is="getAssetIcon(asset.type)" :size="16" />
          <span>{{ asset.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore } from '../../stores/ui.js';
import { useNavigationStore } from '../../stores/navigation.js';
import { icons } from '../../utils/icons.js';

const router = useRouter();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();

// 状态
const searchQuery = ref('');
const activeCategory = ref(null);
const activeFilters = ref([]);
const activeAsset = ref(null);

// 分类数据 - 与 AssetsView 保持一致
const categories = ref([
  { id: 'character', name: '角色', icon: icons.users, count: 12 },
  { id: 'scene', name: '场景', icon: icons.layers, count: 8 },
  { id: 'image', name: '图片', icon: icons.image, count: 5 },
  { id: 'audio', name: '音频', icon: icons.music, count: 4 },
  { id: 'video', name: '视频', icon: icons.video, count: 3 }
]);

// 筛选器
const filters = ref([
  { id: 'used', name: '已使用' },
  { id: 'unused', name: '未使用' },
  { id: 'locked', name: '已锁定' },
  { id: 'recent', name: '最近添加' }
]);

// 最近资源
const recentAssets = ref([
  { id: 'a1', name: '主角立绘', type: 'character' },
  { id: 'a2', name: '城市背景', type: 'scene' },
  { id: 'a3', name: '背景音乐1', type: 'audio' }
]);

// 获取资源图标 - 与 AssetsView 保持一致
function getAssetIcon(type) {
  const iconMap = {
    character: icons.users,
    scene: icons.layers,
    image: icons.image,
    audio: icons.music,
    video: icons.video
  };
  return iconMap[type] || icons.file;
}

// 搜索处理
function handleSearch() {
  navigationStore.updatePanelContext('assets', { searchQuery: searchQuery.value });
}

function clearSearch() {
  searchQuery.value = '';
  navigationStore.updatePanelContext('assets', { searchQuery: '' });
}

// 分类点击处理
function handleCategoryClick(category) {
  activeCategory.value = category.id;
  activeAsset.value = null; // 清除最近资源的选中状态
  navigationStore.updatePanelContext('assets', { category: category.id });
  
  uiStore.addNotification({
    type: 'info',
    title: category.name,
    message: `正在加载 ${category.name} 资源`,
    timeout: 2000
  });
  
  router.push(`/assets/${category.id}`);
}

// 筛选器切换
function toggleFilter(filterId) {
  const index = activeFilters.value.indexOf(filterId);
  if (index > -1) {
    activeFilters.value.splice(index, 1);
  } else {
    activeFilters.value.push(filterId);
  }
}

// 资源点击处理
function handleAssetClick(asset) {
  activeAsset.value = asset.id;
  activeCategory.value = null; // 清除分类的选中状态
  
  uiStore.addNotification({
    type: 'info',
    title: asset.name,
    message: '正在打开资源详情',
    timeout: 2000
  });
  
  // 根据资源类型导航到对应分类页面
  router.push(`/assets/${asset.type}?highlight=${asset.id}`);
}
</script>

<style scoped>
.assets-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.search-section {
  padding: 10px 14px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #7a7a7c;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 28px 8px 32px;
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
  background-color: rgba(200, 200, 200, 0.5);
  border: 1px solid rgba(150, 150, 150, 0.4);
}

.search-input::placeholder {
  color: #7a7a7c;
}

.search-clear {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #7a7a7c;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.search-clear:hover {
  background-color: rgba(0, 0, 0, 0.1);
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

.section--recent {
  flex: 1;
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
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 8px;
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
  flex-shrink: 0;
  padding: 0 !important;
  line-height: 1;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  color: #6c6c6e;
  background-color: rgba(160, 160, 160, 0.3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-tag:hover {
  background-color: rgba(160, 160, 160, 0.5);
}

.filter-tag--active {
  background-color: #2c2c2e;
  color: #ffffff;
}
</style>
