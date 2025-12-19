<template>
  <div class="assets-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="资源库" 
      subtitle="管理项目资源文件"
    >
      <template #actions>
        <div class="view-toggle">
          <button 
            class="view-btn"
            :class="{ 'view-btn--active': viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <component :is="icons.grid" :size="16" />
          </button>
          <button 
            class="view-btn"
            :class="{ 'view-btn--active': viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            <component :is="icons.list" :size="16" />
          </button>
        </div>
        <button class="upload-btn" @click="handleUpload">
          <component :is="icons.upload" :size="16" />
          <span>上传资源</span>
        </button>
      </template>
    </ViewHeader>
    
    <!-- 工具栏 -->
    <div class="assets-toolbar">
      <div class="search-box">
        <component :is="icons.search" :size="16" class="search-icon" />
        <input 
          type="text" 
          placeholder="搜索资源..." 
          v-model="searchQuery"
          class="search-input"
        />
      </div>
      
      <div class="filter-group">
        <button 
          v-for="filter in filters" 
          :key="filter.id"
          class="filter-btn"
          :class="{ 'filter-btn--active': activeFilter === filter.id }"
          @click="setFilter(filter.id)"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>
    
    <!-- 资源网格视图 -->
    <div v-if="viewMode === 'grid'" class="assets-grid">
      <div 
        v-for="asset in filteredAssets" 
        :key="asset.id"
        class="asset-card"
        :class="{ 'asset-card--selected': selectedAsset?.id === asset.id }"
        @click="selectAsset(asset)"
        @dblclick="previewAsset(asset)"
      >
        <div class="asset-preview">
          <component 
            :is="getAssetIcon(asset.type)" 
            :size="28" 
            class="asset-icon"
            :class="`asset-icon--${asset.type}`"
          />
        </div>
        <div class="asset-info">
          <div class="asset-name">{{ asset.name }}</div>
          <div class="asset-meta">
            <span class="asset-type">{{ getTypeLabel(asset.type) }}</span>
            <span class="asset-size">{{ formatSize(asset.size) }}</span>
          </div>
        </div>
        <div class="asset-actions">
          <button class="action-btn" @click.stop="editAsset(asset)" title="编辑">
            <component :is="icons.edit" :size="14" />
          </button>
          <button class="action-btn action-btn--danger" @click.stop="deleteAsset(asset)" title="删除">
            <component :is="icons.trash" :size="14" />
          </button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <EmptyState 
        v-if="filteredAssets.length === 0"
        icon="box"
        title="暂无资源"
        :description="searchQuery ? '没有找到匹配的资源' : '点击上传按钮添加资源'"
      />
    </div>
    
    <!-- 资源列表视图 -->
    <div v-else class="assets-list">
      <div class="list-header">
        <div class="list-col list-col--name">名称</div>
        <div class="list-col list-col--type">类型</div>
        <div class="list-col list-col--size">大小</div>
        <div class="list-col list-col--date">修改日期</div>
        <div class="list-col list-col--actions">操作</div>
      </div>
      
      <div 
        v-for="asset in filteredAssets" 
        :key="asset.id"
        class="list-row"
        :class="{ 'list-row--selected': selectedAsset?.id === asset.id }"
        @click="selectAsset(asset)"
        @dblclick="previewAsset(asset)"
      >
        <div class="list-col list-col--name">
          <component :is="getAssetIcon(asset.type)" :size="20" :class="`asset-icon--${asset.type}`" />
          <span>{{ asset.name }}</span>
        </div>
        <div class="list-col list-col--type">{{ getTypeLabel(asset.type) }}</div>
        <div class="list-col list-col--size">{{ formatSize(asset.size) }}</div>
        <div class="list-col list-col--date">{{ formatDate(asset.modifiedAt) }}</div>
        <div class="list-col list-col--actions">
          <button class="action-btn" @click.stop="editAsset(asset)">
            <component :is="icons.edit" :size="14" />
          </button>
          <button class="action-btn action-btn--danger" @click.stop="deleteAsset(asset)">
            <component :is="icons.trash" :size="14" />
          </button>
        </div>
      </div>
      
      <EmptyState 
        v-if="filteredAssets.length === 0"
        icon="box"
        title="暂无资源"
        :description="searchQuery ? '没有找到匹配的资源' : '点击上传按钮添加资源'"
      />
    </div>
    
    <!-- 资源预览面板 -->
    <div v-if="previewingAsset" class="preview-panel">
      <div class="preview-header">
        <h3>{{ previewingAsset.name }}</h3>
        <button class="close-btn" @click="previewingAsset = null">
          <component :is="icons.x" :size="20" />
        </button>
      </div>
      <div class="preview-content">
        <div class="preview-image" v-if="previewingAsset.type === 'image'">
          <component :is="icons.image" :size="120" />
        </div>
        <div class="preview-video" v-else-if="previewingAsset.type === 'video'">
          <component :is="icons.video" :size="120" />
        </div>
        <div class="preview-character" v-else-if="previewingAsset.type === 'character'">
          <component :is="icons.users" :size="120" />
        </div>
        <div class="preview-scene" v-else>
          <component :is="icons.layers" :size="120" />
        </div>
      </div>
      <div class="preview-details">
        <div class="detail-row">
          <span class="detail-label">类型</span>
          <span class="detail-value">{{ getTypeLabel(previewingAsset.type) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">大小</span>
          <span class="detail-value">{{ formatSize(previewingAsset.size) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">创建时间</span>
          <span class="detail-value">{{ formatDate(previewingAsset.createdAt) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">修改时间</span>
          <span class="detail-value">{{ formatDate(previewingAsset.modifiedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const uiStore = useUIStore();

// 状态
const searchQuery = ref('');
const activeFilter = ref('all');
const viewMode = ref('grid');
const selectedAsset = ref(null);
const previewingAsset = ref(null);

// 筛选器 - 与 AssetsPanel 保持一致
const filters = [
  { id: 'all', label: '全部' },
  { id: 'character', label: '角色' },
  { id: 'scene', label: '场景' },
  { id: 'image', label: '图片' },
  { id: 'audio', label: '音频' },
  { id: 'video', label: '视频' }
];

// 模拟资源数据 - 包含所有分类
const assets = ref([
  { id: '1', name: '主角立绘', type: 'character', size: 2048000, createdAt: new Date('2024-01-15'), modifiedAt: new Date('2024-01-20') },
  { id: '2', name: '城市背景', type: 'scene', size: 5120000, createdAt: new Date('2024-01-10'), modifiedAt: new Date('2024-01-18') },
  { id: '3', name: '配角A', type: 'character', size: 1536000, createdAt: new Date('2024-01-12'), modifiedAt: new Date('2024-01-12') },
  { id: '4', name: '森林场景', type: 'scene', size: 4096000, createdAt: new Date('2024-01-08'), modifiedAt: new Date('2024-01-16') },
  { id: '5', name: '特效素材1', type: 'image', size: 512000, createdAt: new Date('2024-01-05'), modifiedAt: new Date('2024-01-05') },
  { id: '6', name: '背景音乐1', type: 'audio', size: 3072000, createdAt: new Date('2024-01-03'), modifiedAt: new Date('2024-01-10') },
  { id: '7', name: '片头动画', type: 'video', size: 10240000, createdAt: new Date('2024-01-01'), modifiedAt: new Date('2024-01-14') }
]);

// 过滤后的资源
const filteredAssets = computed(() => {
  let result = assets.value;
  
  // 按类型筛选
  if (activeFilter.value !== 'all') {
    result = result.filter(a => a.type === activeFilter.value);
  }
  
  // 按搜索词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(a => a.name.toLowerCase().includes(query));
  }
  
  return result;
});

// 方法
function setFilter(filterId) {
  activeFilter.value = filterId;
}

function selectAsset(asset) {
  selectedAsset.value = asset;
}

function previewAsset(asset) {
  previewingAsset.value = asset;
}

function editAsset(asset) {
  uiStore.addNotification({
    type: 'info',
    title: '编辑资源',
    message: `正在编辑: ${asset.name}`,
    timeout: 2000
  });
}

function deleteAsset(asset) {
  if (confirm(`确定要删除 "${asset.name}" 吗？`)) {
    const index = assets.value.findIndex(a => a.id === asset.id);
    if (index > -1) {
      assets.value.splice(index, 1);
      if (selectedAsset.value?.id === asset.id) {
        selectedAsset.value = null;
      }
      if (previewingAsset.value?.id === asset.id) {
        previewingAsset.value = null;
      }
      uiStore.addNotification({
        type: 'success',
        title: '删除成功',
        message: `"${asset.name}" 已删除`,
        timeout: 2000
      });
    }
  }
}

function handleUpload() {
  uiStore.addNotification({
    type: 'info',
    title: '上传资源',
    message: '请选择要上传的文件',
    timeout: 2000
  });
}

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

function getTypeLabel(type) {
  const labels = {
    character: '角色',
    scene: '场景',
    image: '图片',
    audio: '音频',
    video: '视频'
  };
  return labels[type] || type;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}
</script>

<style scoped>
.assets-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

/* 工具栏 */
.assets-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  width: 240px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a7a7c;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.2);
  color: #2c2c2e;
}

.search-input:focus {
  outline: none;
  background: rgba(200, 200, 200, 0.5);
  border-color: #8a8a8a;
}

.filter-group {
  display: flex;
  gap: 4px;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #4a4a4c;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.filter-btn--active {
  background: rgba(120, 140, 130, 0.25);
  border-color: rgba(100, 120, 110, 0.3);
  color: #4a5a52;
}

.view-toggle {
  display: flex;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  padding: 6px 10px;
  border: none;
  background: rgba(255, 255, 255, 0.3);
  color: #6c6c6e;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  color: #4a4a4c;
}

.view-btn--active {
  background: rgba(120, 140, 130, 0.25);
  color: #4a5a52;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(120, 140, 130, 0.25);
  border: 1px solid rgba(100, 120, 110, 0.3);
  border-radius: 6px;
  color: #4a5a52;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.upload-btn:hover {
  background: rgba(120, 140, 130, 0.35);
  color: #3a4a42;
}

/* 网格视图 */
.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  align-content: start;
}

.asset-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  height: fit-content;
}

.asset-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.asset-card--selected {
  border-color: #8a8a8a;
  box-shadow: 0 0 0 2px rgba(138, 138, 138, 0.3);
}

.asset-preview {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  margin-bottom: 8px;
}

.asset-icon--character { color: #9b59b6; }
.asset-icon--scene { color: #27ae60; }
.asset-icon--image { color: #e67e22; }
.asset-icon--audio { color: #3498db; }
.asset-icon--video { color: #e74c3c; }

.asset-info {
  margin-bottom: 6px;
}

.asset-name {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8a8a8c;
}

.asset-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.asset-card:hover .asset-actions {
  opacity: 1;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4c;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

.action-btn--danger:hover {
  background: #e74c3c;
  color: #fff;
}

/* 列表视图 */
.assets-list {
  flex: 1;
  overflow-y: auto;
}

.list-header {
  display: flex;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #6c6c6e;
}

.list-row {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: background 0.2s;
}

.list-row:hover {
  background: rgba(255, 255, 255, 0.1);
}

.list-row--selected {
  background: rgba(74, 144, 217, 0.1);
}

.list-col {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.list-col--name {
  flex: 2;
  gap: 8px;
}

.list-col--type { flex: 1; }
.list-col--size { flex: 1; }
.list-col--date { flex: 1; }
.list-col--actions { 
  flex: 0 0 80px;
  justify-content: flex-end;
  gap: 4px;
}



/* 预览面板 */
.preview-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.preview-header h3 {
  font-size: 16px;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #6c6c6e;
  cursor: pointer;
}

.close-btn:hover {
  color: #2c2c2e;
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.02);
}

.preview-details {
  padding: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 13px;
}

.detail-label {
  color: #6c6c6e;
}

.detail-value {
  color: #2c2c2e;
  font-weight: 500;
}
</style>
