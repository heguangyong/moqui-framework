<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-content preview-dialog">
      <div class="dialog-header">
        <h3>{{ asset.name }}</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="icon-close"></i>
        </button>
      </div>

      <div class="dialog-body">
        <!-- 图片预览 -->
        <div v-if="asset.type === 'image'" class="preview-container image-preview">
          <img :src="getAssetUrl(asset.path)" :alt="asset.name" @error="onImageError" />
        </div>

        <!-- 音频预览 -->
        <div v-else-if="asset.type === 'audio'" class="preview-container audio-preview">
          <div class="audio-icon">
            <i class="icon-music"></i>
          </div>
          <audio ref="audioPlayer" controls :src="getAssetUrl(asset.path)">
            您的浏览器不支持音频播放
          </audio>
        </div>

        <!-- 视频预览 -->
        <div v-else-if="asset.type === 'video'" class="preview-container video-preview">
          <video ref="videoPlayer" controls :src="getAssetUrl(asset.path)">
            您的浏览器不支持视频播放
          </video>
        </div>

        <!-- 文档预览 -->
        <div v-else class="preview-container document-preview">
          <div class="document-icon">
            <i class="icon-file"></i>
          </div>
          <p>{{ getAssetTypeLabel(asset.type) }}</p>
          <p class="hint">此类型文件不支持预览</p>
        </div>

        <!-- 素材信息 -->
        <div class="asset-details">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-row">
              <span class="label">名称:</span>
              <span class="value">{{ asset.name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">类型:</span>
              <span class="value">{{ getAssetTypeLabel(asset.type) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">大小:</span>
              <span class="value">{{ formatSize(asset.size) }}</span>
            </div>
            <div v-if="asset.description" class="detail-row">
              <span class="label">描述:</span>
              <span class="value">{{ asset.description }}</span>
            </div>
            <div class="detail-row">
              <span class="label">上传时间:</span>
              <span class="value">{{ formatDate(asset.createdDate) }}</span>
            </div>
          </div>

          <!-- 元数据 -->
          <div v-if="asset.metadata" class="detail-section">
            <h4>元数据</h4>
            <div v-if="asset.metadata.dimensions" class="detail-row">
              <span class="label">尺寸:</span>
              <span class="value">
                {{ asset.metadata.dimensions.width }} × {{ asset.metadata.dimensions.height }}
              </span>
            </div>
            <div v-if="asset.metadata.duration" class="detail-row">
              <span class="label">时长:</span>
              <span class="value">{{ formatDuration(asset.metadata.duration) }}</span>
            </div>
            <div v-if="asset.metadata.mimeType" class="detail-row">
              <span class="label">MIME类型:</span>
              <span class="value">{{ asset.metadata.mimeType }}</span>
            </div>
            <div v-if="asset.metadata.tags && asset.metadata.tags.length > 0" class="detail-row">
              <span class="label">标签:</span>
              <span class="value">
                <span v-for="tag in asset.metadata.tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="downloadAsset">
          <i class="icon-download"></i>
          下载
        </button>
        <button class="btn btn-primary" @click="$emit('close')">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  asset: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const audioPlayer = ref(null)
const videoPlayer = ref(null)

// 工具函数
const getAssetUrl = (path) => {
  return `/rest/s1/novel-anime/asset-file/${path}`
}

const getAssetTypeLabel = (type) => {
  const labels = {
    image: '图片',
    audio: '音频',
    video: '视频',
    document: '文档'
  }
  return labels[type] || type
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const onImageError = (e) => {
  e.target.src = '/placeholder-image.png'
}

const downloadAsset = () => {
  const url = getAssetUrl(props.asset.path)
  const link = document.createElement('a')
  link.href = url
  link.download = props.asset.name
  link.click()
}

// 键盘事件
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  
  // 停止媒体播放
  if (audioPlayer.value) {
    audioPlayer.value.pause()
  }
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-dialog {
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
}

.dialog-content {
  background: var(--bg-secondary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
}

/* 预览容器 */
.preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: 8px;
  min-height: 400px;
}

.image-preview img {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
  border-radius: 4px;
}

.audio-preview {
  flex-direction: column;
  gap: 2rem;
}

.audio-icon {
  font-size: 5rem;
  color: var(--primary-color);
}

.audio-preview audio {
  width: 100%;
  max-width: 500px;
}

.video-preview video {
  max-width: 100%;
  max-height: 600px;
  border-radius: 4px;
}

.document-preview {
  flex-direction: column;
  gap: 1rem;
}

.document-icon {
  font-size: 5rem;
  color: var(--text-tertiary);
}

.document-preview p {
  margin: 0;
  color: var(--text-secondary);
}

.document-preview .hint {
  font-size: 0.9rem;
  color: var(--text-tertiary);
}

/* 素材详情 */
.asset-details {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 1rem;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row .label {
  color: var(--text-secondary);
  min-width: 80px;
  flex-shrink: 0;
}

.detail-row .value {
  color: var(--text-primary);
  flex: 1;
  word-break: break-word;
}

.tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: var(--primary-color-light);
  color: var(--primary-color);
  border-radius: 3px;
  font-size: 0.75rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-color-dark);
}

/* 响应式 */
@media (max-width: 768px) {
  .dialog-body {
    flex-direction: column;
  }

  .asset-details {
    width: 100%;
  }
}
</style>
