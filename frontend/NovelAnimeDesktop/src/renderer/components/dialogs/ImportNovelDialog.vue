<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog">
      <div class="dialog-header">
        <h2>导入小说</h2>
        <button class="close-btn" @click="handleClose">
          <component :is="icons.x" :size="20" />
        </button>
      </div>
      
      <div class="dialog-content">
        <!-- 步骤指示器 -->
        <div class="steps">
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="step"
            :class="{ 
              'step--active': currentStep === index,
              'step--completed': currentStep > index
            }"
          >
            <div class="step-number">
              <component v-if="currentStep > index" :is="icons.check" :size="14" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="step-label">{{ step }}</span>
          </div>
        </div>
        
        <!-- 步骤 1: 选择文件 -->
        <div v-if="currentStep === 0" class="step-content">
          <DropZone
            :accepted-formats="['.txt', '.md']"
            @drop="handleFileDrop"
            @error="handleFileError"
          />
          
          <div v-if="selectedFile" class="selected-file">
            <component :is="icons.fileText" :size="20" />
            <div class="file-info">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
            </div>
            <button class="remove-btn" @click="selectedFile = null">
              <component :is="icons.x" :size="16" />
            </button>
          </div>
        </div>
        
        <!-- 步骤 2: 解析中 -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="parsing-status">
            <div class="parsing-icon">
              <component :is="icons.refresh" :size="32" class="spin" />
            </div>
            <h3>正在解析小说...</h3>
            <p>{{ parsingMessage }}</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: parsingProgress + '%' }"></div>
            </div>
            <span class="progress-text">{{ parsingProgress }}%</span>
          </div>
        </div>
        
        <!-- 步骤 3: 解析结果 -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="parse-result">
            <div class="result-header">
              <component :is="icons.check" :size="24" class="success-icon" />
              <h3>解析完成</h3>
            </div>
            
            <div class="result-stats">
              <div class="stat-item">
                <span class="stat-value">{{ parseResult.chapters?.length || 0 }}</span>
                <span class="stat-label">章节</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ parseResult.characters?.length || 0 }}</span>
                <span class="stat-label">角色</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ formatWordCount(parseResult.wordCount) }}</span>
                <span class="stat-label">字数</span>
              </div>
            </div>
            
            <!-- 章节列表 -->
            <div class="result-section">
              <h4>章节结构</h4>
              <div class="chapter-list">
                <div 
                  v-for="(chapter, index) in parseResult.chapters?.slice(0, 5)" 
                  :key="index"
                  class="chapter-item"
                >
                  <span class="chapter-number">{{ index + 1 }}</span>
                  <span class="chapter-title">{{ chapter.title }}</span>
                </div>
                <div v-if="parseResult.chapters?.length > 5" class="more-chapters">
                  还有 {{ parseResult.chapters.length - 5 }} 个章节...
                </div>
              </div>
            </div>
            
            <!-- 识别的角色 -->
            <div class="result-section" v-if="parseResult.characters?.length > 0">
              <h4>识别的角色</h4>
              <div class="character-tags">
                <span 
                  v-for="(char, index) in parseResult.characters?.slice(0, 10)" 
                  :key="index"
                  class="character-tag"
                >
                  {{ char.name }}
                </span>
                <span v-if="parseResult.characters?.length > 10" class="more-tag">
                  +{{ parseResult.characters.length - 10 }}
                </span>
              </div>
            </div>
            
            <!-- 项目名称 -->
            <div class="result-section">
              <h4>项目名称</h4>
              <input 
                type="text" 
                v-model="projectName"
                class="project-name-input"
                placeholder="输入项目名称"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button 
          v-if="currentStep > 0 && currentStep < 2" 
          class="btn btn--secondary"
          @click="handleBack"
          :disabled="isParsing"
        >
          上一步
        </button>
        <div class="spacer"></div>
        <button class="btn btn--secondary" @click="handleClose">
          取消
        </button>
        <button 
          v-if="currentStep === 0"
          class="btn btn--primary"
          @click="handleNext"
          :disabled="!selectedFile"
        >
          开始解析
        </button>
        <button 
          v-if="currentStep === 2"
          class="btn btn--primary"
          @click="handleCreate"
          :disabled="!projectName.trim()"
        >
          创建项目
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../../stores/project.js';
import { useNovelStore } from '../../stores/novel.js';
import { useUIStore } from '../../stores/ui.js';
import { icons } from '../../utils/icons.js';
import { NovelParser } from '../../services/NovelParser.ts';
import { CharacterSystem } from '../../services/CharacterSystem.ts';
import DropZone from '../ui/DropZone.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'success']);

const router = useRouter();
const projectStore = useProjectStore();
const novelStore = useNovelStore();
const uiStore = useUIStore();

// 状态
const currentStep = ref(0);
const selectedFile = ref(null);
const isParsing = ref(false);
const parsingProgress = ref(0);
const parsingMessage = ref('');
const parseResult = ref({});
const projectName = ref('');

const steps = ['选择文件', '解析小说', '确认结果'];

// 监听对话框显示状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetState();
  }
});

// 方法
function resetState() {
  currentStep.value = 0;
  selectedFile.value = null;
  isParsing.value = false;
  parsingProgress.value = 0;
  parsingMessage.value = '';
  parseResult.value = {};
  projectName.value = '';
}

function handleClose() {
  if (isParsing.value) {
    if (!confirm('解析正在进行中，确定要取消吗？')) {
      return;
    }
  }
  emit('close');
}

function handleFileDrop(file) {
  selectedFile.value = file;
  // 自动设置项目名称
  projectName.value = file.name.replace(/\.[^/.]+$/, '');
}

function handleFileError(errors) {
  errors.forEach(err => {
    uiStore.addNotification({
      type: 'error',
      title: '文件错误',
      message: `${err.file}: ${err.error}`,
      timeout: 5000
    });
  });
}

function handleBack() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

async function handleNext() {
  if (currentStep.value === 0 && selectedFile.value) {
    await parseNovel();
  }
}

async function parseNovel() {
  currentStep.value = 1;
  isParsing.value = true;
  parsingProgress.value = 0;
  parsingMessage.value = '验证文件格式...';
  
  try {
    // 步骤1: 使用NovelParser验证文件
    parsingProgress.value = 10;
    const validation = NovelParser.validateFile(selectedFile.value);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }
    
    // 显示警告（如果有）
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(w => {
        console.warn('文件警告:', w.message);
      });
    }
    
    parsingProgress.value = 20;
    parsingMessage.value = '提取文本内容...';
    await delay(300);
    
    // 步骤2: 使用NovelParser解析小说结构
    parsingProgress.value = 40;
    parsingMessage.value = '分析章节结构...';
    
    const novelStructure = await NovelParser.parseNovel(
      selectedFile.value, 
      projectName.value || undefined
    );
    
    parsingProgress.value = 60;
    parsingMessage.value = '识别角色信息...';
    await delay(300);
    
    // 步骤3: 使用CharacterSystem识别角色
    const characters = CharacterSystem.identifyCharacters(novelStructure.chapters);
    
    // 追踪重复出现的角色
    const trackedCharacters = CharacterSystem.trackRecurringCharacters(
      characters, 
      novelStructure.chapters
    );
    
    parsingProgress.value = 80;
    parsingMessage.value = '验证内容完整性...';
    await delay(300);
    
    // 步骤4: 验证内容完整性
    const contentValidation = NovelParser.validateContentIntegrity(novelStructure);
    if (!contentValidation.isValid) {
      console.warn('内容验证警告:', contentValidation.warnings);
    }
    
    parsingProgress.value = 100;
    parsingMessage.value = '解析完成';
    
    // 存储解析结果
    parseResult.value = {
      novelStructure,
      chapters: novelStructure.chapters,
      characters: trackedCharacters,
      wordCount: novelStructure.metadata.wordCount,
      language: novelStructure.metadata.language,
      description: novelStructure.metadata.description
    };
    
    // 更新项目名称（如果未设置）
    if (!projectName.value) {
      projectName.value = novelStructure.title;
    }
    
    await delay(500);
    currentStep.value = 2;
    
  } catch (error) {
    uiStore.addNotification({
      type: 'error',
      title: '解析失败',
      message: error.message,
      timeout: 5000
    });
    currentStep.value = 0;
  } finally {
    isParsing.value = false;
  }
}

async function handleCreate() {
  try {
    // 存储小说结构到NovelStore
    const novelId = await NovelParser.storeNovelStructure(parseResult.value.novelStructure);
    
    // 为主要角色创建锁定档案
    const mainCharacters = parseResult.value.characters.filter(
      c => c.role === 'protagonist' || c.role === 'antagonist' || c.role === 'supporting'
    );
    
    for (const character of mainCharacters) {
      CharacterSystem.createLockedProfile(character);
    }
    
    // 创建项目
    const project = await projectStore.createProject({
      name: projectName.value.trim(),
      description: parseResult.value.description || `从 ${selectedFile.value.name} 导入`,
      type: 'novel-to-anime',
      novelId,
      novel: {
        id: novelId,
        file: selectedFile.value.name,
        title: parseResult.value.novelStructure.title,
        author: parseResult.value.novelStructure.author,
        chapters: parseResult.value.chapters,
        wordCount: parseResult.value.wordCount,
        language: parseResult.value.language
      },
      characters: parseResult.value.characters.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
        attributes: c.attributes,
        appearanceCount: c.appearances?.length || 0
      }))
    });
    
    if (project) {
      uiStore.addNotification({
        type: 'success',
        title: '项目创建成功',
        message: `项目 "${projectName.value}" 已创建，识别到 ${parseResult.value.characters.length} 个角色`,
        timeout: 3000
      });
      
      emit('success', project);
      emit('close');
      
      router.push(`/project/${project.id}`);
    }
  } catch (error) {
    uiStore.addNotification({
      type: 'error',
      title: '创建失败',
      message: error.message,
      timeout: 5000
    });
  }
}

// 辅助函数
// 辅助函数已移至NovelParser和CharacterSystem服务

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatWordCount(count) {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  return count?.toString() || '0';
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

.dialog {
  width: 600px;
  max-height: 80vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: #6c6c6e;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #2c2c2e;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 步骤指示器 */
.steps {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a8a8c;
}

.step--active {
  color: #4a90d9;
}

.step--completed {
  color: #27ae60;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.step--active .step-number {
  background: #4a90d9;
  color: #fff;
}

.step--completed .step-number {
  background: #27ae60;
  color: #fff;
}

.step-label {
  font-size: 13px;
  font-weight: 500;
}

/* 步骤内容 */
.step-content {
  min-height: 200px;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(74, 144, 217, 0.1);
  border-radius: 8px;
}

.selected-file .file-info {
  flex: 1;
}

.selected-file .file-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c2c2e;
}

.selected-file .file-size {
  font-size: 12px;
  color: #6c6c6e;
}

.selected-file .remove-btn {
  background: none;
  border: none;
  color: #8a8a8c;
  cursor: pointer;
}

.selected-file .remove-btn:hover {
  color: #e74c3c;
}

/* 解析状态 */
.parsing-status {
  text-align: center;
  padding: 40px;
}

.parsing-icon {
  color: #4a90d9;
  margin-bottom: 16px;
}

.parsing-status h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.parsing-status p {
  margin: 0 0 24px;
  color: #6c6c6e;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90d9, #667eea);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #6c6c6e;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 解析结果 */
.parse-result {
  padding: 0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.success-icon {
  color: #27ae60;
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
}

.result-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #4a90d9;
}

.stat-label {
  font-size: 12px;
  color: #6c6c6e;
}

.result-section {
  margin-bottom: 20px;
}

.result-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #2c2c2e;
}

.chapter-list {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 12px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-number {
  width: 24px;
  height: 24px;
  background: #4a90d9;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.chapter-title {
  font-size: 13px;
  color: #2c2c2e;
}

.more-chapters {
  padding: 8px 0;
  font-size: 12px;
  color: #8a8a8c;
  text-align: center;
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.character-tag {
  padding: 6px 12px;
  background: rgba(74, 144, 217, 0.1);
  color: #4a90d9;
  border-radius: 16px;
  font-size: 12px;
}

.more-tag {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.05);
  color: #8a8a8c;
  border-radius: 16px;
  font-size: 12px;
}

.project-name-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
}

.project-name-input:focus {
  outline: none;
  border-color: #4a90d9;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.spacer {
  flex: 1;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--secondary {
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4c;
}

.btn--secondary:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.15);
}

.btn--primary {
  background: #4a90d9;
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: #3a7bc8;
}
</style>
