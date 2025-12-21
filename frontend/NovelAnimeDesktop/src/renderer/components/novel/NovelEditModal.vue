<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>编辑小说</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="edit-title">标题 *</label>
          <input
            id="edit-title"
            v-model="formData.title"
            type="text"
            placeholder="请输入小说标题"
            :disabled="isSaving"
          />
          <span v-if="errors.title" class="error-text">{{ errors.title }}</span>
        </div>
        
        <div class="form-group">
          <label for="edit-author">作者</label>
          <input
            id="edit-author"
            v-model="formData.author"
            type="text"
            placeholder="请输入作者姓名"
            :disabled="isSaving"
          />
        </div>
        
        <div class="form-group">
          <label for="edit-status">状态</label>
          <select
            id="edit-status"
            v-model="formData.status"
            :disabled="isSaving"
          >
            <option value="imported">已导入</option>
            <option value="analyzing">分析中</option>
            <option value="characters_extracted">角色已提取</option>
            <option value="scenes_analyzed">场景已分析</option>
            <option value="episodes_generated">集数已生成</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        
        <div class="info-display">
          <div class="info-row">
            <span class="info-label">字数:</span>
            <span class="info-value">{{ formatWordCount(novel.wordCount) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">创建时间:</span>
            <span class="info-value">{{ formatDateTime(novel.createdDate) }}</span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          class="btn btn-secondary" 
          @click="$emit('close')"
          :disabled="isSaving"
        >
          取消
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleSave"
          :disabled="isSaving || !isValid"
        >
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  novel: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

const isSaving = ref(false)
const formData = ref({
  title: '',
  author: '',
  status: ''
})
const errors = ref({})

// 初始化表单数据
watch(() => props.novel, (newVal) => {
  if (newVal) {
    formData.value = {
      title: newVal.title || '',
      author: newVal.author || '',
      status: newVal.status || 'imported'
    }
  }
}, { immediate: true })

const isValid = computed(() => {
  return formData.value.title.trim().length > 0
})

function validate() {
  errors.value = {}
  
  if (!formData.value.title.trim()) {
    errors.value.title = '标题不能为空'
    return false
  }
  
  return true
}

async function handleSave() {
  if (!validate()) return
  
  isSaving.value = true
  try {
    const updates = {
      title: formData.value.title.trim(),
      author: formData.value.author.trim() || undefined,
      status: formData.value.status
    }
    
    emit('save', updates)
  } finally {
    isSaving.value = false
  }
}

function formatWordCount(count) {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toLocaleString()
}

function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input:disabled,
.form-group select:disabled {
  background: #f8f9fa;
  color: #999;
}

.error-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #e74c3c;
}

.info-display {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 13px;
  color: #666;
}

.info-value {
  font-size: 13px;
  color: #2c2c2e;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}
</style>
