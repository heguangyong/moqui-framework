<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-content info-dialog">
      <div class="dialog-header">
        <h3>素材详情</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="icon-close"></i>
        </button>
      </div>

      <div class="dialog-body">
        <!-- 素材基本信息 -->
        <div class="info-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">名称:</span>
              <span class="value">{{ asset.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">类型:</span>
              <span class="value">{{ getAssetTypeLabel(asset.type) }}</span>
            </div>
            <div class="info-item">
              <span class="label">大小:</span>
              <span class="value">{{ formatSize(asset.size) }}</span>
            </div>
            <div class="info-item">
              <span class="label">上传时间:</span>
              <span class="value">{{ formatDate(asset.createdDate) }}</span>
            </div>
            <div v-if="asset.description" class="info-item full-width">
              <span class="label">描述:</span>
              <span class="value">{{ asset.description }}</span>
            </div>
          </div>
        </div>

        <!-- 引用信息 -->
        <div class="info-section">
          <h4>
            <i class="icon-link"></i>
            引用情况
          </h4>
          
          <div v-if="loadingReferences" class="loading-state">
            <div class="spinner-small"></div>
            <span>检查引用中...</span>
          </div>

          <div v-else-if="references.length === 0" class="no-references">
            <i class="icon-check-circle"></i>
            <p>该素材未被引用，可以安全删除</p>
          </div>

          <div v-else class="references-list">
            <div class="reference-warning">
              <i class="icon-alert"></i>
              <p>该素材正在被 {{ references.length }} 个项目使用</p>
            </div>
            
            <div
              v-for="ref in references"
              :key="ref.id"
              class="reference-item"
            >
              <div class="ref-icon">
                <i :class="getRefIcon(ref.type)"></i>
              </div>
              <div class="ref-info">
                <h5>{{ ref.name }}</h5>
                <p class="ref-type">{{ getRefTypeLabel(ref.type) }}</p>
              </div>
              <button class="ref-action" @click="goToReference(ref)">
                <i class="icon-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 元数据 -->
        <div v-if="asset.metadata" class="info-section">
          <h4>元数据</h4>
          <div class="info-grid">
            <div v-if="asset.metadata.dimensions" class="info-item">
              <span class="label">尺寸:</span>
              <span class="value">
                {{ asset.metadata.dimensions.width }} × {{ asset.metadata.dimensions.height }}
              </span>
            </div>
            <div v-if="asset.metadata.duration" class="info-item">
              <span class="label">时长:</span>
              <span class="value">{{ formatDuration(asset.metadata.duration) }}</span>
            </div>
            <div v-if="asset.metadata.mimeType" class="info-item">
              <span class="label">MIME类型:</span>
              <span class="value">{{ asset.metadata.mimeType }}</span>
            </div>
            <div v-if="asset.metadata.fileHash" class="info-item full-width">
              <span class="label">文件哈希:</span>
              <span class="value hash">{{ asset.metadata.fileHash }}</span>
            </div>
            <div v-if="asset.metadata.tags && asset.metadata.tags.length > 0" class="info-item full-width">
              <span class="label">标签:</span>
              <span class="value">
                <span v-for="tag in asset.metadata.tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- 使用统计 -->
        <div class="info-section">
          <h4>使用统计</h4>
          <div class="stats-grid">
            <div class="stat-card">
              <i class="icon-link"></i>
              <div class="stat-value">{{ references.length }}</div>
              <div class="stat-label">引用次数</div>
            </div>
            <div class="stat-card">
              <i class="icon-eye"></i>
              <div class="stat-value">-</div>
              <div class="stat-label">预览次数</div>
            </div>
            <div class="stat-card">
              <i class="icon-download"></i>
              <div class="stat-value">-</div>
              <div class="stat-label">下载次数</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button
          v-if="references.length === 0"
          class="btn btn-danger"
          @click="confirmDelete"
        >
          <i class="icon-trash"></i>
          删除素材
        </button>
        <button
          v-else
          class="btn btn-danger"
          @click="confirmForceDelete"
        >
          <i class="icon-alert"></i>
          强制删除
        </button>
        <button class="btn btn-secondary" @click="$emit('close')">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  asset: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'delete'])

const router = useRouter()

// 状态
const references = ref([])
const loadingReferences = ref(false)

// 加载引用信息
const loadReferences = async () => {
  loadingReferences.value = true
  try {
    const response = await fetch(
      `/rest/s1/novel-anime/asset/${props.asset.assetId}/references`
    )

    if (response.ok) {
      const data = await response.json()
      references.value = data.references || []
    }
  } catch (error) {
    console.error('Failed to load references:', error)
  } finally {
    loadingReferences.value = false
  }
}

// 工具函数
const getAssetTypeLabel = (type) => {
  const labels = {
    image: '图片',
    audio: '音频',
    video: '视频',
    document: '文档'
  }
  return labels[type] || type
}

const getRefTypeLabel = (type) => {
  const labels = {
    workflow: '工作流',
    scene: '场景',
    character: '角色',
    project: '项目'
  }
  return labels[type] || type
}

const getRefIcon = (type) => {
  const icons = {
    workflow: 'icon-workflow',
    scene: 'icon-image',
    character: 'icon-user',
    project: 'icon-folder'
  }
  return icons[type] || 'icon-link'
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

// 跳转到引用
const goToReference = (ref) => {
  if (ref.type === 'workflow') {
    router.push({ name: 'workflow', query: { id: ref.id } })
  } else if (ref.type === 'scene') {
    router.push({ name: 'scenes', query: { id: ref.id } })
  } else if (ref.type === 'character') {
    router.push({ name: 'character-detail', params: { id: ref.id } })
  }
  emit('close')
}

// 确认删除
const confirmDelete = () => {
  if (confirm(`确定要删除素材 "${props.asset.name}" 吗？`)) {
    emit('delete', props.asset)
    emit('close')
  }
}

// 确认强制删除
const confirmForceDelete = () => {
  const refNames = references.value.map((r) => r.name).join('、')
  if (
    confirm(
      `该素材正在被以下项目使用：${refNames}\n\n强制删除可能导致这些项目出现问题。确定要继续吗？`
    )
  ) {
    emit('delete', props.asset, true) // 传递 forceDelete 标志
    emit('close')
  }
}

// 初始化
onMounted(() => {
  loadReferences()
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.info-dialog {
  width: 90%;
  max-width: 700px;
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
}

.close-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
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
  flex-direction: column;
  gap: 1.5rem;
}

/* 信息区块 */
.info-section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 1.5rem;
}

.info-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item .label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-item .value {
  font-size: 0.95rem;
  color: var(--text-primary);
  word-break: break-word;
}

.info-item .value.hash {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-tertiary);
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

/* 引用列表 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--text-secondary);
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-references {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--success-color);
}

.no-references i {
  font-size: 2.5rem;
}

.no-references p {
  margin: 0;
  font-size: 0.95rem;
}

.reference-warning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--warning-color-light);
  color: var(--warning-color);
  border-radius: 4px;
  margin-bottom: 1rem;
}

.reference-warning i {
  font-size: 1.25rem;
}

.reference-warning p {
  margin: 0;
  font-size: 0.9rem;
}

.references-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reference-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s;
}

.reference-item:hover {
  border-color: var(--primary-color);
  background: var(--bg-hover);
}

.ref-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color-light);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 1.25rem;
}

.ref-info {
  flex: 1;
}

.ref-info h5 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.ref-type {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.ref-action {
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.ref-action:hover {
  background: var(--bg-tertiary);
  color: var(--primary-color);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.stat-card i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
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

.btn-danger {
  background: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background: var(--danger-color-dark);
}

/* 响应式 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
