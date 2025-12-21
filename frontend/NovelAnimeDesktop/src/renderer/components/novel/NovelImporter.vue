<template>
  <div class="novel-importer">
    <div class="importer-header">
      <h3>导入小说</h3>
      <p class="subtitle">支持文本输入或文件上传</p>
    </div>

    <div class="import-tabs">
      <button 
        :class="['tab-button', { active: activeTab === 'text' }]"
        @click="activeTab = 'text'"
      >
        文本输入
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'file' }]"
        @click="activeTab = 'file'"
      >
        文件上传
      </button>
    </div>

    <!-- Text Input Tab -->
    <div v-if="activeTab === 'text'" class="tab-content">
      <div class="form-group">
        <label for="title">小说标题 *</label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          placeholder="请输入小说标题"
          :disabled="isImporting"
        />
      </div>

      <div class="form-group">
        <label for="author">作者</label>
        <input
          id="author"
          v-model="formData.author"
          type="text"
          placeholder="请输入作者姓名"
          :disabled="isImporting"
        />
      </div>

      <div class="form-group">
        <label for="content">小说内容 *</label>
        <textarea
          id="content"
          v-model="formData.content"
          placeholder="请粘贴或输入小说内容..."
          rows="12"
          :disabled="isImporting"
          @input="updateWordCount"
        ></textarea>
        <div class="content-stats">
          <span class="word-count">字数: {{ wordCount }}</span>
          <span class="cost-estimate">预估成本: {{ estimatedCost }} 积分</span>
        </div>
      </div>
    </div>

    <!-- File Upload Tab -->
    <div v-if="activeTab === 'file'" class="tab-content">
      <div class="form-group">
        <label for="file-title">小说标题</label>
        <input
          id="file-title"
          v-model="formData.title"
          type="text"
          placeholder="留空将自动从文件名提取"
          :disabled="isImporting"
        />
      </div>

      <div class="form-group">
        <label for="file-author">作者</label>
        <input
          id="file-author"
          v-model="formData.author"
          type="text"
          placeholder="请输入作者姓名"
          :disabled="isImporting"
        />
      </div>

      <div class="file-upload-area">
        <div 
          class="drop-zone"
          :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
          @drop="handleFileDrop"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".txt,.docx,.pdf"
            style="display: none"
            @change="handleFileSelect"
            :disabled="isImporting"
          />
          
          <div v-if="!selectedFile" class="drop-zone-content">
            <div class="upload-icon">📄</div>
            <p class="upload-text">点击选择文件或拖拽到此处</p>
            <p class="upload-hint">支持 .txt, .docx, .pdf 格式</p>
          </div>
          
          <div v-else class="file-info">
            <div class="file-icon">📄</div>
            <div class="file-details">
              <p class="file-name">{{ selectedFile.name }}</p>
              <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              <p v-if="fileWordCount > 0" class="file-word-count">
                字数: {{ fileWordCount }}
              </p>
            </div>
            <button 
              class="remove-file-btn"
              @click.stop="removeFile"
              :disabled="isImporting"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div v-if="fileWordCount > 0" class="content-stats">
        <span class="cost-estimate">预估成本: {{ estimatedCost }} 积分</span>
      </div>
    </div>

    <!-- Import Actions -->
    <div class="import-actions">
      <button 
        class="cancel-btn"
        @click="$emit('cancel')"
        :disabled="isImporting"
      >
        取消
      </button>
      <button 
        class="import-btn"
        @click="handleImport"
        :disabled="!canImport || isImporting"
      >
        <span v-if="isImporting" class="loading-spinner">⏳</span>
        {{ isImporting ? '导入中...' : '开始导入' }}
      </button>
    </div>

    <!-- Progress -->
    <div v-if="isImporting" class="import-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${importProgress}%` }"></div>
      </div>
      <p class="progress-text">{{ progressMessage }}</p>
    </div>

    <!-- Error Display -->
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="close-error">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { novelApi } from '../../services'

// Props
interface Props {
  projectId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  cancel: []
  success: [result: any]
  error: [error: string]
}>()

// Reactive data
const activeTab = ref<'text' | 'file'>('text')
const isImporting = ref(false)
const importProgress = ref(0)
const progressMessage = ref('')
const errorMessage = ref('')
const isDragOver = ref(false)
const selectedFile = ref<File | null>(null)
const fileWordCount = ref(0)

const formData = ref({
  title: '',
  author: '',
  content: ''
})

const fileInput = ref<HTMLInputElement>()

// Computed
const wordCount = computed(() => {
  return formData.value.content.length
})

const estimatedCost = computed(() => {
  const words = activeTab.value === 'text' ? wordCount.value : fileWordCount.value
  return Math.max(1, Math.ceil(words / 1000))
})

const canImport = computed(() => {
  if (activeTab.value === 'text') {
    return formData.value.title.trim() && formData.value.content.trim()
  } else {
    return selectedFile.value && fileWordCount.value > 0
  }
})

// Methods
const updateWordCount = () => {
  // Word count is automatically computed
}

const triggerFileInput = () => {
  if (!isImporting.value) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = async (file: File) => {
  selectedFile.value = file
  
  // Auto-fill title from filename if not set
  if (!formData.value.title) {
    formData.value.title = file.name.replace(/\.[^/.]+$/, '')
  }
  
  // Read file content to estimate word count
  try {
    const content = await readFileContent(file)
    fileWordCount.value = content.length
  } catch (error) {
    console.error('Failed to read file:', error)
    errorMessage.value = '无法读取文件内容'
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

const removeFile = () => {
  selectedFile.value = null
  fileWordCount.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleImport = async () => {
  if (!canImport.value) return
  
  isImporting.value = true
  importProgress.value = 0
  progressMessage.value = '准备导入...'
  errorMessage.value = ''
  
  try {
    let result
    
    if (activeTab.value === 'text') {
      // Text import
      progressMessage.value = '正在导入文本...'
      importProgress.value = 30
      
      result = await novelApi.importText({
        projectId: props.projectId,
        title: formData.value.title,
        author: formData.value.author || undefined,
        content: formData.value.content
      })
    } else {
      // File import
      progressMessage.value = '正在读取文件...'
      importProgress.value = 20
      
      const fileContent = await readFileContent(selectedFile.value!)
      const base64Content = btoa(unescape(encodeURIComponent(fileContent)))
      
      progressMessage.value = '正在导入文件...'
      importProgress.value = 50
      
      result = await novelApi.importFile({
        projectId: props.projectId,
        title: formData.value.title || undefined,
        author: formData.value.author || undefined,
        fileName: selectedFile.value!.name,
        fileContent: base64Content
      })
    }
    
    importProgress.value = 80
    progressMessage.value = '处理导入结果...'
    
    if (result.success) {
      importProgress.value = 100
      progressMessage.value = '导入完成！'
      
      setTimeout(() => {
        emit('success', result)
      }, 500)
    } else {
      throw new Error(result.message || '导入失败')
    }
    
  } catch (error: any) {
    console.error('Import failed:', error)
    errorMessage.value = error.message || '导入过程中发生错误'
    emit('error', error.message || '导入失败')
  } finally {
    isImporting.value = false
    importProgress.value = 0
    progressMessage.value = ''
  }
}

// Watch for tab changes to reset form
watch(activeTab, () => {
  errorMessage.value = ''
})
</script>

<style scoped>
.novel-importer {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.importer-header {
  text-align: center;
  margin-bottom: 24px;
}

.importer-header h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.import-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #ecf0f1;
}

.tab-button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  color: #7f8c8d;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: #3498db;
}

.tab-button.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.tab-content {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
}

.content-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #7f8c8d;
}

.cost-estimate {
  color: #e74c3c;
  font-weight: 500;
}

.file-upload-area {
  margin-bottom: 16px;
}

.drop-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafbfc;
}

.drop-zone:hover {
  border-color: #3498db;
  background: #f0f8ff;
}

.drop-zone.drag-over {
  border-color: #3498db;
  background: #e3f2fd;
}

.drop-zone.has-file {
  border-color: #27ae60;
  background: #f0fff4;
  padding: 16px;
}

.drop-zone-content {
  pointer-events: none;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-weight: 500;
}

.upload-hint {
  margin: 0;
  color: #7f8c8d;
  font-size: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.file-icon {
  font-size: 24px;
}

.file-details {
  flex: 1;
}

.file-name {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.file-size,
.file-word-count {
  margin: 0;
  color: #7f8c8d;
  font-size: 12px;
}

.remove-file-btn {
  padding: 4px 8px;
  border: none;
  background: #e74c3c;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-file-btn:hover {
  background: #c0392b;
}

.import-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.cancel-btn,
.import-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #ecf0f1;
  color: #7f8c8d;
}

.cancel-btn:hover:not(:disabled) {
  background: #d5dbdb;
}

.import-btn {
  background: #3498db;
  color: white;
}

.import-btn:hover:not(:disabled) {
  background: #2980b9;
}

.import-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.loading-spinner {
  margin-right: 8px;
}

.import-progress {
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #ecf0f1;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.progress-text {
  margin: 0;
  text-align: center;
  color: #7f8c8d;
  font-size: 12px;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

.close-error {
  padding: 4px 8px;
  border: none;
  background: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 16px;
}
</style>