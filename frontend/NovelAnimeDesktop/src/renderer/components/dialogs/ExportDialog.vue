<template>
  <div v-if="visible" class="export-dialog-overlay" @click.self="close">
    <div class="export-dialog">
      <div class="dialog-header">
        <h3>导出内容</h3>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <div class="dialog-content">
        <!-- 导出格式选择 -->
        <div class="form-group">
          <label>导出格式</label>
          <div class="format-options">
            <label class="format-option">
              <input 
                type="radio" 
                v-model="exportFormat" 
                value="json"
              />
              <span class="format-label">
                <component :is="icons.fileText" :size="20" />
                JSON 数据
              </span>
            </label>
            
            <label class="format-option">
              <input 
                type="radio" 
                v-model="exportFormat" 
                value="text"
              />
              <span class="format-label">
                <component :is="icons.fileText" :size="20" />
                文本文件
              </span>
            </label>
            
            <label class="format-option">
              <input 
                type="radio" 
                v-model="exportFormat" 
                value="images"
              />
              <span class="format-label">
                <component :is="icons.image" :size="20" />
                图片序列
              </span>
            </label>
          </div>
        </div>
        
        <!-- 导出范围 -->
        <div class="form-group">
          <label>导出范围</label>
          <div class="range-options">
            <label class="range-option">
              <input 
                type="radio" 
                v-model="exportRange" 
                value="all"
              />
              全部 ({{ totalItems }} 项)
            </label>
            
            <label class="range-option">
              <input 
                type="radio" 
                v-model="exportRange" 
                value="current"
              />
              当前项
            </label>
            
            <label class="range-option">
              <input 
                type="radio" 
                v-model="exportRange" 
                value="custom"
              />
              自定义范围
            </label>
          </div>
          
          <div v-if="exportRange === 'custom'" class="custom-range">
            <input 
              type="number" 
              v-model.number="customStart" 
              :min="1" 
              :max="totalItems"
              placeholder="起始"
            />
            <span>至</span>
            <input 
              type="number" 
              v-model.number="customEnd" 
              :min="1" 
              :max="totalItems"
              placeholder="结束"
            />
          </div>
        </div>
        
        <!-- 导出选项 -->
        <div class="form-group">
          <label>导出选项</label>
          <div class="export-options">
            <label class="option-checkbox">
              <input 
                type="checkbox" 
                v-model="includeMetadata"
              />
              包含元数据
            </label>
            
            <label class="option-checkbox" v-if="exportFormat === 'images'">
              <input 
                type="checkbox" 
                v-model="includeTimestamps"
              />
              添加时间戳
            </label>
            
            <label class="option-checkbox">
              <input 
                type="checkbox" 
                v-model="openAfterExport"
              />
              导出后打开文件夹
            </label>
          </div>
        </div>
        
        <!-- 文件名 -->
        <div class="form-group">
          <label>文件名</label>
          <input 
            type="text" 
            v-model="fileName" 
            class="file-name-input"
            placeholder="输入文件名"
          />
        </div>
      </div>
      
      <div class="dialog-footer">
        <button @click="close" class="btn btn-secondary">取消</button>
        <button @click="handleExport" class="btn btn-primary">
          <component :is="icons.download" :size="14" />
          开始导出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { icons } from '../../utils/icons.js';

interface Props {
  visible: boolean;
  contentType: 'scene' | 'storyboard';
  totalItems: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'export', options: ExportOptions): void;
}

interface ExportOptions {
  format: string;
  range: string;
  customStart?: number;
  customEnd?: number;
  includeMetadata: boolean;
  includeTimestamps: boolean;
  openAfterExport: boolean;
  fileName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const exportFormat = ref('json');
const exportRange = ref('all');
const customStart = ref(1);
const customEnd = ref(props.totalItems);
const includeMetadata = ref(true);
const includeTimestamps = ref(false);
const openAfterExport = ref(true);
const fileName = ref('');

// 监听 totalItems 变化
watch(() => props.totalItems, (newVal) => {
  customEnd.value = newVal;
});

// 监听 contentType 变化，更新默认文件名
watch(() => props.contentType, (newVal) => {
  fileName.value = newVal === 'scene' ? 'scenes' : 'storyboards';
}, { immediate: true });

function close(): void {
  emit('update:visible', false);
}

function handleExport(): void {
  const options: ExportOptions = {
    format: exportFormat.value,
    range: exportRange.value,
    customStart: exportRange.value === 'custom' ? customStart.value : undefined,
    customEnd: exportRange.value === 'custom' ? customEnd.value : undefined,
    includeMetadata: includeMetadata.value,
    includeTimestamps: includeTimestamps.value,
    openAfterExport: openAfterExport.value,
    fileName: fileName.value || (props.contentType === 'scene' ? 'scenes' : 'storyboards')
  };
  
  emit('export', options);
}
</script>

<style scoped>
.export-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.export-dialog {
  width: 90%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.5);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c2c2e;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #2c2c2e;
}

.dialog-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 24px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
}

.format-options,
.range-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-option,
.range-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-option:hover,
.range-option:hover {
  background: rgba(120, 140, 130, 0.05);
  border-color: rgba(120, 140, 130, 0.3);
}

.format-option input[type="radio"],
.range-option input[type="radio"] {
  cursor: pointer;
}

.format-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4a4a4c;
}

.custom-range {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.custom-range input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 14px;
}

.custom-range span {
  color: #666;
  font-size: 14px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4a4a4c;
  cursor: pointer;
}

.option-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.file-name-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.file-name-input:focus {
  outline: none;
  border-color: rgba(120, 140, 130, 0.5);
  box-shadow: 0 0 0 3px rgba(120, 140, 130, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.5);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 20px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.btn-secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
  border-color: rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background-color: #d8d8d8;
}

.btn-primary {
  background-color: #7a9188;
  color: #ffffff;
  border-color: rgba(100, 120, 110, 0.3);
}

.btn-primary:hover {
  background-color: #6a8178;
}
</style>