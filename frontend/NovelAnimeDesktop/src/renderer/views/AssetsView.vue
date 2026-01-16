<template>
  <div class="assets-view">
    <!-- 根据 panelContext 显示不同内容 -->
    
    <!-- 资源类型视图 - 全部 -->
    <template v-if="currentCategory === 'all'">
      <div class="view-header">
        <h2>全部资源</h2>
        <p>管理您的所有素材资源</p>
      </div>
      <AssetGrid :assets="allAssets" :loading="loading" @select="selectAsset" @preview="previewAsset" />
    </template>
    
    <!-- 资源类型视图 - 图片 -->
    <template v-else-if="currentCategory === 'image'">
      <div class="view-header">
        <h2>图片资源</h2>
        <p>角色立绘、场景背景、UI素材等</p>
      </div>
      <AssetGrid :assets="imageAssets" :loading="loading" @select="selectAsset" @preview="previewAsset" />
    </template>
    
    <!-- 资源类型视图 - 音频 -->
    <template v-else-if="currentCategory === 'audio'">
      <div class="view-header">
        <h2>音频资源</h2>
        <p>背景音乐、音效、配音等</p>
      </div>
      <AssetGrid :assets="audioAssets" :loading="loading" @select="selectAsset" @preview="previewAsset" />
    </template>
    
    <!-- 资源类型视图 - 视频 -->
    <template v-else-if="currentCategory === 'video'">
      <div class="view-header">
        <h2>视频资源</h2>
        <p>动画片段、过场动画等</p>
      </div>
      <AssetGrid :assets="videoAssets" :loading="loading" @select="selectAsset" @preview="previewAsset" />
    </template>

    <!-- 资源类型视图 - 文档 -->
    <template v-else-if="currentCategory === 'document'">
      <div class="view-header">
        <h2>文档资源</h2>
        <p>剧本、设定文档等</p>
      </div>
      <AssetGrid :assets="documentAssets" :loading="loading" @select="selectAsset" @preview="previewAsset" />
    </template>
    
    <!-- 资源详情视图 -->
    <template v-else-if="viewType === 'asset-detail' && selectedAssetData">
      <div class="view-header">
        <h2>{{ selectedAssetData.name }}</h2>
        <p>{{ getAssetTypeLabel(selectedAssetData.type) }} · {{ formatSize(selectedAssetData.size) }}</p>
      </div>
      <AssetDetail :asset="selectedAssetData" @back="goBack" />
    </template>
    
    <!-- 默认视图 - 资源概览 -->
    <template v-else>
      <div class="view-header">
        <h2>资源库</h2>
        <p>管理项目中的所有素材资源</p>
      </div>
      
      <!-- 资源统计 -->
      <div class="stats-section">
        <h3 class="section-title">资源统计</h3>
        <div class="stats-grid">
          <div class="stat-card" @click="setCategory('image')">
            <div class="stat-icon">
              <component :is="icons.image" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ statistics.imageCount || 0 }}</span>
              <span class="stat-label">图片</span>
            </div>
          </div>
          <div class="stat-card" @click="setCategory('audio')">
            <div class="stat-icon">
              <component :is="icons.music" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ statistics.audioCount || 0 }}</span>
              <span class="stat-label">音频</span>
            </div>
          </div>
          <div class="stat-card" @click="setCategory('video')">
            <div class="stat-icon">
              <component :is="icons.video" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ statistics.videoCount || 0 }}</span>
              <span class="stat-label">视频</span>
            </div>
          </div>
          <div class="stat-card" @click="setCategory('document')">
            <div class="stat-icon">
              <component :is="icons.file" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ statistics.documentCount || 0 }}</span>
              <span class="stat-label">文档</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 最近上传 -->
      <div class="recent-section">
        <h3 class="section-title">最近上传</h3>
        <div v-if="recentAssets.length > 0" class="asset-list">
          <div 
            v-for="asset in recentAssets" 
            :key="asset.id"
            class="asset-item"
            @click="selectAsset(asset)"
          >
            <div class="asset-icon">
              <component :is="getAssetIcon(asset.type)" :size="16" />
            </div>
            <div class="asset-item-info">
              <span class="asset-name">{{ asset.name }}</span>
              <span class="asset-meta">{{ getAssetTypeLabel(asset.type) }} · {{ formatDate(asset.createdAt) }}</span>
            </div>
            <component :is="icons.chevronRight" :size="16" class="asset-arrow" />
          </div>
        </div>
        <div v-else class="content-placeholder">
          <component :is="icons.folder" :size="48" />
          <span>暂无资源</span>
          <p>点击上传按钮添加素材</p>
        </div>
      </div>
      
      <!-- 上传按钮 -->
      <div class="upload-section">
        <button class="btn btn--primary btn--lg" @click="showUploadDialog">
          <component :is="icons.upload" :size="18" />
          <span>上传素材</span>
        </button>
      </div>
    </template>
    
    <!-- 上传对话框 -->
    <AssetUploadDialog
      v-if="showUpload"
      :project-id="currentProjectId"
      @close="showUpload = false"
      @uploaded="onAssetUploaded"
    />
    
    <!-- 预览对话框 -->
    <AssetPreviewDialog
      v-if="previewingAsset"
      :asset="previewingAsset"
      @close="previewingAsset = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNavigationStore } from '../stores/navigation.js';
import { useProjectStore } from '../stores/project.js';
import { icons } from '../utils/icons.js';
import AssetGrid from '../components/assets/AssetGrid.vue';
import AssetDetail from '../components/assets/AssetDetail.vue';
import AssetUploadDialog from '../components/dialogs/AssetUploadDialog.vue';
import AssetPreviewDialog from '../components/dialogs/AssetPreviewDialog.vue';

const router = useRouter();
const navigationStore = useNavigationStore();
const projectStore = useProjectStore();

// 从 panelContext 获取当前视图状态
const assetsContext = computed(() => navigationStore.panelContext.assets || {});
const currentCategory = computed(() => assetsContext.value?.category);
const viewType = computed(() => assetsContext.value?.viewType);
const selectedAssetId = computed(() => assetsContext.value?.selectedAsset);

// 状态
const loading = ref(false);
const showUpload = ref(false);
const previewingAsset = ref(null);
const allAssets = ref([]);
const statistics = ref({
  imageCount: 5,
  audioCount: 4,
  videoCount: 3,
  documentCount: 2,
  totalSize: 128 * 1024 * 1024
});

// 模拟资源数据
const mockAssets = ref([
  { id: 'a1', name: '主角立绘-正面', type: 'image', size: 2048000, createdAt: new Date() },
  { id: 'a2', name: '主角立绘-侧面', type: 'image', size: 1856000, createdAt: new Date() },
  { id: 'a3', name: '城市背景-白天', type: 'image', size: 4096000, createdAt: new Date() },
  { id: 'a4', name: '城市背景-夜晚', type: 'image', size: 3584000, createdAt: new Date() },
  { id: 'a5', name: '室内场景', type: 'image', size: 2560000, createdAt: new Date() },
  { id: 'a6', name: '背景音乐-主题曲', type: 'audio', size: 5120000, createdAt: new Date() },
  { id: 'a7', name: '背景音乐-战斗', type: 'audio', size: 4608000, createdAt: new Date() },
  { id: 'a8', name: '音效-脚步声', type: 'audio', size: 256000, createdAt: new Date() },
  { id: 'a9', name: '音效-门声', type: 'audio', size: 128000, createdAt: new Date() },
  { id: 'a10', name: '片头动画', type: 'video', size: 20480000, createdAt: new Date() },
  { id: 'a11', name: '过场动画1', type: 'video', size: 15360000, createdAt: new Date() },
  { id: 'a12', name: '片尾动画', type: 'video', size: 18432000, createdAt: new Date() },
  { id: 'a13', name: '剧本大纲', type: 'document', size: 51200, createdAt: new Date() },
  { id: 'a14', name: '角色设定', type: 'document', size: 102400, createdAt: new Date() }
]);

// 计算属性
const currentProjectId = computed(() => projectStore.currentProject?.projectId);

const imageAssets = computed(() => mockAssets.value.filter(a => a.type === 'image'));
const audioAssets = computed(() => mockAssets.value.filter(a => a.type === 'audio'));
const videoAssets = computed(() => mockAssets.value.filter(a => a.type === 'video'));
const documentAssets = computed(() => mockAssets.value.filter(a => a.type === 'document'));
const recentAssets = computed(() => mockAssets.value.slice(0, 5));

const selectedAssetData = computed(() => {
  if (!selectedAssetId.value) return null;
  return mockAssets.value.find(a => a.id === selectedAssetId.value);
});

// 方法
function setCategory(category) {
  navigationStore.updatePanelContext('assets', { 
    category,
    viewType: 'category',
    selectedAsset: null
  });
}

function selectAsset(asset) {
  navigationStore.updatePanelContext('assets', { 
    selectedAsset: asset.id,
    viewType: 'asset-detail'
  });
}

function previewAsset(asset) {
  previewingAsset.value = asset;
}

function goBack() {
  navigationStore.updatePanelContext('assets', { 
    viewType: null,
    selectedAsset: null
  });
}

function showUploadDialog() {
  showUpload.value = true;
}

function onAssetUploaded() {
  showUpload.value = false;
  // 重新加载资源列表
}

function getAssetIcon(type) {
  const iconMap = {
    image: icons.image,
    audio: icons.music,
    video: icons.video,
    document: icons.file
  };
  return iconMap[type] || icons.file;
}

function getAssetTypeLabel(type) {
  const labels = {
    image: '图片',
    audio: '音频',
    video: '视频',
    document: '文档'
  };
  return labels[type] || type;
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
}

onMounted(() => {
  allAssets.value = mockAssets.value;
});
</script>

<style scoped>
.assets-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
}

/* 视图头部 - 与 DashboardView 保持一致 */
.view-header {
  margin-bottom: 24px;
}

.view-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c2c2e;
}

.view-header p {
  margin: 0;
  font-size: 13px;
  color: #6c6c6e;
}

/* 区块标题 */
.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #9a9a9a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

/* 统计区块 */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(122, 145, 136, 0.3);
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(122, 145, 136, 0.15);
  border-radius: 10px;
  color: #7a9188;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #2c2c2e;
}

.stat-label {
  font-size: 12px;
  color: #6c6c6e;
}

/* 最近上传区块 */
.recent-section {
  margin-bottom: 24px;
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.asset-item:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(122, 145, 136, 0.3);
}

.asset-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(122, 145, 136, 0.1);
  border-radius: 6px;
  color: #7a9188;
}

.asset-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.asset-name {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-meta {
  font-size: 11px;
  color: #8a8a8c;
}

.asset-arrow {
  color: #9a9a9a;
  flex-shrink: 0;
}

/* 空状态占位 */
.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #9a9a9a;
  text-align: center;
}

.content-placeholder span {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #6c6c6e;
}

.content-placeholder p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #9a9a9a;
}

/* 上传区块 */
.upload-section {
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  justify-content: center;
}

/* 按钮样式 - 统一风格 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background-color: #7a9188;
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background-color: #6a8178;
}

.btn--lg {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 10px;
}
</style>
