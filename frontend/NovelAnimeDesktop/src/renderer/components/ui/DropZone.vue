<template>
  <div 
    class="drop-zone"
    :class="{ 
      'drop-zone--active': isDragging,
      'drop-zone--invalid': isDragging && !isValidFile
    }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div class="drop-zone-content">
      <div class="drop-zone-icon">
        <component :is="isDragging ? icons.upload : icons.file" :size="48" />
      </div>
      <div class="drop-zone-text">
        <h3 v-if="isDragging && isValidFile">释放以导入文件</h3>
        <h3 v-else-if="isDragging && !isValidFile">不支持的文件格式</h3>
        <h3 v-else>拖拽文件到此处</h3>
        <p v-if="!isDragging">
          支持的格式: {{ acceptedFormatsText }}
        </p>
        <p v-else-if="!isValidFile" class="error-text">
          请选择 {{ acceptedFormatsText }} 格式的文件
        </p>
      </div>
      <button v-if="!isDragging" class="browse-btn" @click="openFilePicker">
        <component :is="icons.folder" :size="16" />
        <span>浏览文件</span>
      </button>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input 
      ref="fileInputRef"
      type="file"
      :accept="acceptedFormats.join(',')"
      :multiple="multiple"
      class="file-input"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { icons } from '../../utils/icons.js';

const props = defineProps({
  acceptedFormats: {
    type: Array,
    default: () => ['.txt', '.md']
  },
  multiple: {
    type: Boolean,
    default: false
  },
  maxSize: {
    type: Number,
    default: 50 * 1024 * 1024 // 50MB
  }
});

const emit = defineEmits(['drop', 'error']);

// Refs
const fileInputRef = ref(null);
const isDragging = ref(false);
const isValidFile = ref(true);
const dragCounter = ref(0);

// 计算属性
const acceptedFormatsText = computed(() => {
  return props.acceptedFormats.map(f => f.replace('.', '').toUpperCase()).join(', ');
});

// 方法
function handleDragEnter(event) {
  dragCounter.value++;
  isDragging.value = true;
  
  // 检查文件类型
  if (event.dataTransfer.items) {
    const items = Array.from(event.dataTransfer.items);
    isValidFile.value = items.some(item => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        return file && isAcceptedFile(file);
      }
      return false;
    });
  }
}

function handleDragOver(event) {
  event.dataTransfer.dropEffect = isValidFile.value ? 'copy' : 'none';
}

function handleDragLeave() {
  dragCounter.value--;
  if (dragCounter.value === 0) {
    isDragging.value = false;
    isValidFile.value = true;
  }
}

function handleDrop(event) {
  isDragging.value = false;
  dragCounter.value = 0;
  isValidFile.value = true;
  
  const files = Array.from(event.dataTransfer.files);
  processFiles(files);
}

function openFilePicker() {
  fileInputRef.value?.click();
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  processFiles(files);
  // 重置输入以允许选择相同文件
  event.target.value = '';
}

function processFiles(files) {
  const validFiles = [];
  const errors = [];
  
  for (const file of files) {
    // 检查文件格式
    if (!isAcceptedFile(file)) {
      errors.push({
        file: file.name,
        error: `不支持的文件格式。支持的格式: ${acceptedFormatsText.value}`
      });
      continue;
    }
    
    // 检查文件大小
    if (file.size > props.maxSize) {
      errors.push({
        file: file.name,
        error: `文件过大。最大支持 ${formatSize(props.maxSize)}`
      });
      continue;
    }
    
    validFiles.push(file);
    
    // 如果不支持多文件，只处理第一个
    if (!props.multiple) break;
  }
  
  if (errors.length > 0) {
    emit('error', errors);
  }
  
  if (validFiles.length > 0) {
    emit('drop', props.multiple ? validFiles : validFiles[0]);
  }
}

function isAcceptedFile(file) {
  const fileName = file.name.toLowerCase();
  const fileExt = '.' + fileName.split('.').pop();
  
  return props.acceptedFormats.some(format => {
    const normalizedFormat = format.toLowerCase();
    // 检查扩展名
    if (normalizedFormat.startsWith('.')) {
      return fileExt === normalizedFormat;
    }
    // 检查 MIME 类型
    return file.type === normalizedFormat || file.type.startsWith(normalizedFormat);
  });
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
</script>

<style scoped>
.drop-zone {
  position: relative;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
}

.drop-zone:hover {
  border-color: rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.1);
}

.drop-zone--active {
  border-color: #4a90d9;
  border-style: solid;
  background: rgba(74, 144, 217, 0.1);
}

.drop-zone--active .drop-zone-icon {
  color: #4a90d9;
  transform: scale(1.1);
}

.drop-zone--invalid {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.drop-zone--invalid .drop-zone-icon {
  color: #e74c3c;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.drop-zone-icon {
  color: #8a8a8c;
  transition: all 0.3s ease;
}

.drop-zone-text h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

.drop-zone-text p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6c6c6e;
}

.drop-zone-text .error-text {
  color: #e74c3c;
}

.browse-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #4a90d9;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.browse-btn:hover {
  background: #3a7bc8;
  transform: translateY(-1px);
}

.file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
