<template>
  <div class="asset-category-view">
    <ViewHeader 
      :title="categoryConfig.title" 
      :subtitle="categoryConfig.subtitle"
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
          <span>{{ categoryConfig.uploadText }}</span>
        </button>
      </template>
    </ViewHeader>
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <component :is="icons.search" :size="16" class="search-icon" />
        <input 
          type="text" 
          :placeholder="`搜索${categoryConfig.title}...`" 
          v-model="searchQuery"
          class="search-input"
        />
      </div>
    </div>
    
    <!-- 网格视图 -->
    <div v-if="viewMode === 'grid'" class="assets-grid">
      <div 
        v-for="asset in filteredAssets" 
        :key="asset.id"
        class="asset-card"
        :class="{ 
          'asset-card--selected': selectedAsset?.id === asset.id,
          'asset-card--first': isFirstAsset(asset.id)
        }"
        @click="selectAsset(asset)"
      >
        <div class="asset-preview">
          <component 
            :is="categoryConfig.icon" 
            :size="28" 
            class="asset-icon"
            :style="{ color: categoryConfig.color }"
          />
        </div>
        <div class="asset-info">
          <div class="asset-name">{{ asset.name }}</div>
          <div class="asset-meta">
            <span class="asset-size">{{ formatSize(asset.size) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <EmptyState 
        v-if="filteredAssets.length === 0"
        :icon="categoryIconName"
        :title="categoryConfig.emptyTitle"
        :description="searchQuery ? '没有找到匹配的资源' : categoryConfig.emptyMessage"
      />
    </div>
    
    <!-- 列表视图 -->
    <div v-else class="assets-list">
      <div class="list-header">
        <div class="list-col list-col--name">名称</div>
        <div class="list-col list-col--size">大小</div>
        <div class="list-col list-col--date">修改日期</div>
        <div class="list-col list-col--actions">操作</div>
      </div>
      
      <div 
        v-for="asset in filteredAssets" 
        :key="asset.id"
        class="list-row"
        :class="{ 
          'list-row--selected': selectedAsset?.id === asset.id,
          'list-row--first': isFirstAsset(asset.id)
        }"
        @click="selectAsset(asset)"
      >
        <div class="list-col list-col--name">
          <component :is="categoryConfig.icon" :size="20" :style="{ color: categoryConfig.color }" />
          <span>{{ asset.name }}</span>
        </div>
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
        :icon="categoryIconName"
        :title="categoryConfig.emptyTitle"
        :description="searchQuery ? '没有找到匹配的资源' : categoryConfig.emptyMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUIStore } from '../stores/ui.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const props = defineProps({
  category: {
    type: String,
    default: ''
  }
});

const route = useRoute();
const uiStore = useUIStore();

// 获取分类ID
const categoryId = computed(() => props.category || route.params.category);

// 分类配置
const categoryConfigs = {
  character: {
    title: '角色资源',
    subtitle: '管理角色立绘和人物设定',
    icon: icons.users,
    color: '#9b59b6',
    uploadText: '添加角色',
    emptyTitle: '暂无角色资源',
    emptyMessage: '点击添加角色按钮创建第一个角色'
  },
  scene: {
    title: '场景资源',
    subtitle: '管理背景图和场景设定',
    icon: icons.layers,
    color: '#27ae60',
    uploadText: '添加场景',
    emptyTitle: '暂无场景资源',
    emptyMessage: '点击添加场景按钮创建第一个场景'
  },
  image: {
    title: '图片资源',
    subtitle: '管理特效素材和UI素材',
    icon: icons.image,
    color: '#e67e22',
    uploadText: '上传图片',
    emptyTitle: '暂无图片资源',
    emptyMessage: '点击上传图片按钮添加第一张图片'
  },
  audio: {
    title: '音频资源',
    subtitle: '管理背景音乐和音效',
    icon: icons.music,
    color: '#3498db',
    uploadText: '上传音频',
    emptyTitle: '暂无音频资源',
    emptyMessage: '点击上传音频按钮添加第一个音频'
  },
  video: {
    title: '视频资源',
    subtitle: '管理片头动画和转场效果',
    icon: icons.video,
    color: '#e74c3c',
    uploadText: '上传视频',
    emptyTitle: '暂无视频资源',
    emptyMessage: '点击上传视频按钮添加第一个视频'
  }
};

const categoryConfig = computed(() => {
  return categoryConfigs[categoryId.value] || categoryConfigs.character;
});

// 图标名称映射
const categoryIconNames = {
  character: 'users',
  scene: 'layers',
  image: 'image',
  audio: 'inbox',
  video: 'video'
};

const categoryIconName = computed(() => {
  return categoryIconNames[categoryId.value] || 'box';
});

// 状态
const searchQuery = ref('');
const viewMode = ref('grid');
const selectedAsset = ref(null);

// 模拟数据 - 根据分类返回不同数据
const allAssets = {
  character: [
    { id: 'c1', name: '主角立绘', size: 2048000, modifiedAt: new Date('2024-01-20') },
    { id: 'c2', name: '配角A', size: 1536000, modifiedAt: new Date('2024-01-18') },
    { id: 'c3', name: '反派角色', size: 1800000, modifiedAt: new Date('2024-01-15') }
  ],
  scene: [
    { id: 's1', name: '城市背景', size: 5120000, modifiedAt: new Date('2024-01-18') },
    { id: 's2', name: '森林场景', size: 4096000, modifiedAt: new Date('2024-01-16') },
    { id: 's3', name: '室内场景', size: 3500000, modifiedAt: new Date('2024-01-14') }
  ],
  image: [
    { id: 'i1', name: '特效素材1', size: 512000, modifiedAt: new Date('2024-01-15') },
    { id: 'i2', name: 'UI按钮素材', size: 256000, modifiedAt: new Date('2024-01-12') }
  ],
  audio: [
    { id: 'a1', name: '背景音乐1', size: 3072000, modifiedAt: new Date('2024-01-10') },
    { id: 'a2', name: '战斗音效', size: 1024000, modifiedAt: new Date('2024-01-08') }
  ],
  video: [
    { id: 'v1', name: '片头动画', size: 10240000, modifiedAt: new Date('2024-01-14') },
    { id: 'v2', name: '转场效果', size: 2048000, modifiedAt: new Date('2024-01-10') }
  ]
};

const assets = computed(() => allAssets[categoryId.value] || []);

const filteredAssets = computed(() => {
  if (!searchQuery.value.trim()) return assets.value;
  const query = searchQuery.value.toLowerCase();
  return assets.value.filter(a => a.name.toLowerCase().includes(query));
});

function isFirstAsset(id) {
  return filteredAssets.value.length > 0 && filteredAssets.value[0].id === id;
}

function selectAsset(asset) {
  selectedAsset.value = asset;
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
  uiStore.addNotification({
    type: 'warning',
    title: '删除资源',
    message: `确认删除: ${asset.name}`,
    timeout: 2000
  });
}

function handleUpload() {
  uiStore.addNotification({
    type: 'info',
    title: categoryConfig.value.uploadText,
    message: '请选择要上传的文件',
    timeout: 2000
  });
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
  return new Date(date).toLocaleDateString('zh-CN');
}
</script>

<style scoped>
.asset-category-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.toolbar {
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

.view-toggle {
  display: flex;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: #6c6c6e;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.view-btn--active {
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.8), rgba(200, 218, 212, 0.7));
  color: #2c2c2e;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #2c2c2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}

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

.asset-card--selected,
.asset-card--first {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  font-size: 11px;
  color: #8a8a8c;
}

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

.list-row--selected,
.list-row--first {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.4), rgba(200, 218, 212, 0.3));
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

.list-col--size { flex: 1; }
.list-col--date { flex: 1; }
.list-col--actions { 
  flex: 0 0 80px;
  justify-content: flex-end;
  gap: 4px;
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

.btn {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  color: #2c2c2e;
}

.btn-primary:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}
</style>
