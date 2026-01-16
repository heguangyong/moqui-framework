<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>上传素材</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="icon-close"></i>
        </button>
      </div>

      <div class="dialog-body">
        <!-- 文件选择区域 -->
        <div
          class="upload-area"
          :class="{ dragging: isDragging }"
          @drop.prevent="onDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @click="selectFile"
        >
          <i class="icon-upload"></i>
          <p>拖拽文件到此处或点击选择</p>
          <p class="hint">支持图片、音频、视频和文档</p>
          <input
            ref="fileInput"
            type="file"
            accept="image/*,audio/*,video/*,.pdf,.txt,.doc,.docx"
            style="display: none"
            @change="onFileSelected"
          />
        </div>

        <!-- 文件信息 -->
        <div v-if="selectedFile" class="file-info">
          <div class="file-preview">
            <img
              v-if="previewUrl && isImage"
              :src="previewUrl"
              alt="预览"
            />
            <i v-else :class="getFileIcon()" class="file-icon"></i>
          </div>
          <div class="file-details">
            <h4>{{ selectedFile.name }}</h4>
            <p>{{ formatSize(selectedFile.size) }}</p>
            <p>{{ getFileType() }}</p>
          </div>
          <button class="remove-btn" @click="removeFile">
            <i class="icon-close"></i>
          </button>
        </div>

        <!-- 表单 -->
        <div v-if="selectedFile" class="form-section">
          <div class="form-group">
            <label>素材名称 *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="输入素材名称"
              required
            />
          </div>

          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="form.description"
              placeholder="输入素材描述（可选）"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>标签</label>
            <div class="tags-input">
              <span
                v-for="(tag, index) in form.tags"
                :key="index"
                class="tag"
              >
                {{ tag }}
                <button @click="removeTag(index)">×</button>
              </span>
              <input
                v-model="newTag"
                type="text"
                placeholder="添加标签..."
                @keydown.enter.prevent="addTag"
              />
            </div>
          </div>
        </div>

        <!-- 上传进度 -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <p>上传中... {{ progress }}%</p>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="error-message">
          <i class="icon-alert"></i>
          {{ error }}
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="$emit('close')">
          取消
        </button>
        <button
          class="btn btn-primary"
          :disabled="!canUpload"
          @click="uploadAsset"
        >
          <i class="icon-upload"></i>
          上传
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'uploaded'])

// 状态
const selectedFile = ref(null)
const previewUrl = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const progress = ref(0)
const error = ref(null)
const fileInput = ref(null)

// 表单数据
const form = ref({
  name: '',
  description: '',
  tags: []
})
const newTag = ref('')

// 计算属性
const isImage = computed(() => {
  return selectedFile.value?.type.startsWith('image/')
})

const canUpload = computed(() => {
  return selectedFile.value && form.value.name && !uploading.value
})

// 文件选择
const selectFile = () => {
  fileInput.value?.click()
}

const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (file) {
    handleFile(file)
  }
}

const onDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    handleFile(file)
  }
}

const handleFile = (file) => {
  // 验证文件大小 (50MB)
  if (file.size > 50 * 1024 * 1024) {
    error.value = '文件大小不能超过 50MB'
    return
  }

  selectedFile.value = file
  form.value.name = file.name.replace(/\.[^/.]+$/, '') // 移除扩展名
  error.value = null

  // 生成预览
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeFile = () => {
  selectedFile.value = null
  previewUrl.value = null
  form.value.name = ''
  form.value.description = ''
  form.value.tags = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 标签管理
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}

// 上传
const uploadAsset = async () => {
  if (!canUpload.value) return

  uploading.value = true
  progress.value = 0
  error.value = null

  try {
    // 读取文件为 Base64
    const fileContent = await readFileAsBase64(selectedFile.value)

    // 确定素材类型
    const assetType = getAssetType(selectedFile.value.type)

    // 准备上传数据
    const uploadData = {
      projectId: props.projectId,
      userId: 'current-user', // TODO: 从用户状态获取
      assetType,
      name: form.value.name,
      description: form.value.description,
      fileContent,
      fileName: selectedFile.value.name,
      fileSize: selectedFile.value.size,
      mimeType: selectedFile.value.type,
      tags: form.value.tags
    }

    // 上传
    const response = await fetch('/rest/s1/novel-anime/assets/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uploadData)
    })

    if (response.ok) {
      progress.value = 100
      emit('uploaded')
      emit('close')
    } else {
      const errorData = await response.json()
      error.value = errorData.message || '上传失败'
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = '上传失败：' + err.message
  } finally {
    uploading.value = false
  }
}

// 工具函数
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // 移除 data:*/*;base64, 前缀
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const getAssetType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}

const getFileType = () => {
  if (!selectedFile.value) return ''
  const type = selectedFile.value.type
  if (type.startsWith('image/')) return '图片'
  if (type.startsWith('audio/')) return '音频'
  if (type.startsWith('video/')) return '视频'
  return '文档'
}

const getFileIcon = () => {
  if (!selectedFile.value) return 'icon-file'
  const type = selectedFile.value.type
  if (type.startsWith('image/')) return 'icon-image'
  if (type.startsWith('audio/')) return 'icon-music'
  if (type.startsWith('video/')) return 'icon-video'
  return 'icon-file'
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
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

.dialog-content {
  background: var(--bg-secondary);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
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
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-primary);
}

.upload-area:hover,
.upload-area.dragging {
  border-color: var(--primary-color);
  background: var(--bg-hover);
}

.upload-area i {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.upload-area p {
  margin: 0.5rem 0;
  color: var(--text-primary);
}

.upload-area .hint {
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

/* 文件信息 */
.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-top: 1rem;
}

.file-preview {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 2.5rem;
  color: var(--text-tertiary);
}

.file-details {
  flex: 1;
}

.file-details h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.file-details p {
  margin: 0.125rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.remove-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: var(--danger-color);
  color: white;
}

/* 表单 */
.form-section {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input[type='text'],
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

/* 标签输入 */
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--primary-color-light);
  color: var(--primary-color);
  border-radius: 3px;
  font-size: 0.85rem;
}

.tag button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
}

.tags-input input {
  flex: 1;
  min-width: 120px;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
}

/* 上传进度 */
.upload-progress {
  margin-top: 1rem;
  text-align: center;
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s;
}

.upload-progress p {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 错误信息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--danger-color-light);
  color: var(--danger-color);
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-color-dark);
}
</style>
