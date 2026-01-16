<template>
  <div class="asset-grid">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>
    
    <div v-else-if="assets.length === 0" class="empty-state">
      <component :is="icons.folder" :size="48" />
      <span>暂无资源</span>
    </div>
    
    <div v-else class="grid-container">
      <div 
        v-for="asset in assets" 
        :key="asset.id"
        class="asset-card"
        @click="$emit('select', asset)"
        @dblclick="$emit('preview', asset)"
      >
        <div class="asset-thumbnail">
          <component :is="getAssetIcon(asset.type)" :size="32" />
        </div>
        <div class="asset-info">
          <span class="asset-name">{{ asset.name }}</span>
          <span class="asset-size">{{ formatSize(asset.size) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { icons } from '../../utils/icons.js';

defineProps({
  assets: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

defineEmits(['select', 'preview']);

function getAssetIcon(type) {
  const iconMap = {
    image: icons.image,
    audio: icons.music,
    video: icons.video,
    document: icons.file
  };
  return iconMap[type] || icons.file;
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
</script>

<style scoped>
.asset-grid {
  flex: 1;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #9a9a9a;
  text-align: center;
}

.loading-state span,
.empty-state span {
  margin-top: 12px;
  font-size: 14px;
  color: #6c6c6e;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(122, 145, 136, 0.2);
  border-top-color: #7a9188;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.asset-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.asset-card:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(122, 145, 136, 0.3);
}

.asset-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(122, 145, 136, 0.1);
  border-radius: 8px;
  color: #7a9188;
  margin-bottom: 10px;
}

.asset-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.asset-name {
  font-size: 12px;
  font-weight: 500;
  color: #2c2c2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-size {
  font-size: 11px;
  color: #8a8a8c;
}
</style>
