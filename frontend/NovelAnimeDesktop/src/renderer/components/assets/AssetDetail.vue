<template>
  <div class="asset-detail">
    <button class="back-btn" @click="$emit('back')">
      <component :is="icons.arrowLeft" :size="16" />
      <span>返回</span>
    </button>
    
    <div class="detail-content">
      <div class="preview-area">
        <component :is="getAssetIcon(asset.type)" :size="64" />
      </div>
      
      <div class="info-section">
        <h3 class="section-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">文件名</span>
            <span class="info-value">{{ asset.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">类型</span>
            <span class="info-value">{{ getAssetTypeLabel(asset.type) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">大小</span>
            <span class="info-value">{{ formatSize(asset.size) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">上传时间</span>
            <span class="info-value">{{ formatDate(asset.createdAt) }}</span>
          </div>
        </div>
      </div>
      
      <div class="actions-section">
        <button class="btn btn--primary">
          <component :is="icons.download" :size="16" />
          <span>下载</span>
        </button>
        <button class="btn btn--secondary">
          <component :is="icons.edit" :size="16" />
          <span>编辑</span>
        </button>
        <button class="btn btn--danger">
          <component :is="icons.trash" :size="16" />
          <span>删除</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { icons } from '../../utils/icons.js';

defineProps({
  asset: { type: Object, required: true }
});

defineEmits(['back']);

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
  const labels = { image: '图片', audio: '音频', video: '视频', document: '文档' };
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
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}
</script>

<style scoped>
.asset-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: #6c6c6e;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  align-self: flex-start;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #2c2c2e;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-area {
  width: 100%;
  aspect-ratio: 16/9;
  max-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  color: #7a9188;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #9a9a9a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.info-label {
  font-size: 11px;
  color: #8a8a8c;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

.actions-section {
  display: flex;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn--primary {
  background-color: #7a9188;
  color: #ffffff;
}

.btn--primary:hover { background-color: #6a8178; }

.btn--secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
}

.btn--secondary:hover { background-color: #d8d8d8; }

.btn--danger {
  background-color: #e53e3e;
  color: #ffffff;
}

.btn--danger:hover { background-color: #c53030; }
</style>
