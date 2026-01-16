<template>
  <div class="novel-text-editor">
    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <button @click="handleSave" class="toolbar-btn" :disabled="!hasChanges || isSaving" title="保存 (Ctrl+S)">
          <component :is="icons.save" :size="16" />
          <span>{{ isSaving ? '保存中...' : '保存' }}</span>
        </button>
        <button @click="showFindReplace = !showFindReplace" class="toolbar-btn" title="查找替换 (Ctrl+F)">
          <component :is="icons.search" :size="16" />
          <span>查找</span>
        </button>
      </div>
      
      <div class="toolbar-right">
        <div class="word-count">
          <span class="count-label">字数:</span>
          <span class="count-value">{{ formatNumber(wordCount) }}</span>
        </div>
        <div class="char-count">
          <span class="count-label">字符:</span>
          <span class="count-value">{{ formatNumber(charCount) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 查找替换面板 -->
    <div v-if="showFindReplace" class="find-replace-panel">
      <div class="find-row">
        <input 
          v-model="findText"
          type="text"
          placeholder="查找..."
          class="find-input"
          @keyup.enter="findNext"
          @input="handleFindInput"
        />
        <button @click="findPrevious" class="find-btn" title="上一个 (Shift+Enter)">
          <component :is="icons.chevronUp" :size="14" />
        </button>
        <button @click="findNext" class="find-btn" title="下一个 (Enter)">
          <component :is="icons.chevronDown" :size="14" />
        </button>
        <span class="find-count" v-if="findText">{{ currentMatch }}/{{ totalMatches }}</span>
        <button @click="showFindReplace = false" class="close-btn">
          <component :is="icons.x" :size="14" />
        </button>
      </div>
      <div class="replace-row">
        <input 
          v-model="replaceText"
          type="text"
          placeholder="替换为..."
          class="replace-input"
          @keyup.enter="replaceNext"
        />
        <button @click="replaceNext" class="replace-btn">替换</button>
        <button @click="replaceAll" class="replace-btn">全部替换</button>
      </div>
    </div>
    
    <!-- 文本编辑区 -->
    <div class="editor-container">
      <textarea
        ref="textareaRef"
        v-model="content"
        class="editor-textarea"
        placeholder="在此输入或粘贴小说内容..."
        @input="handleInput"
        @keydown="handleKeydown"
        spellcheck="false"
      ></textarea>
    </div>
    
    <!-- 状态栏 -->
    <div class="editor-statusbar">
      <span class="status-item">行: {{ currentLine }}</span>
      <span class="status-item">列: {{ currentColumn }}</span>
      <span class="status-item" v-if="hasChanges">● 未保存</span>
      <span class="status-item" v-else>已保存</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { icons } from '../../utils/icons.js';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  novelId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

// 编辑器状态
const textareaRef = ref(null);
const content = ref(props.modelValue);
const originalContent = ref(props.modelValue);
const isSaving = ref(false);
const hasChanges = computed(() => content.value !== originalContent.value);

// 查找替换状态
const showFindReplace = ref(false);
const findText = ref('');
const replaceText = ref('');
const currentMatch = ref(0);
const totalMatches = ref(0);
const matches = ref([]);

// 光标位置
const currentLine = ref(1);
const currentColumn = ref(1);

// 字数统计
const wordCount = computed(() => {
  if (!content.value) return 0;
  // 中文字符
  const chineseChars = (content.value.match(/[\u4e00-\u9fa5]/g) || []).length;
  // 英文单词
  const englishWords = (content.value.match(/\b[a-zA-Z]+\b/g) || []).length;
  return chineseChars + englishWords;
});

const charCount = computed(() => {
  return content.value.length;
});

// 监听内容变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal;
    originalContent.value = newVal;
  }
});

// 处理输入
function handleInput() {
  emit('update:modelValue', content.value);
  updateCursorPosition();
}

// 更新光标位置
function updateCursorPosition() {
  if (!textareaRef.value) return;
  
  const textarea = textareaRef.value;
  const cursorPos = textarea.selectionStart;
  const textBeforeCursor = content.value.substring(0, cursorPos);
  
  currentLine.value = (textBeforeCursor.match(/\n/g) || []).length + 1;
  const lastNewline = textBeforeCursor.lastIndexOf('\n');
  currentColumn.value = cursorPos - lastNewline;
}

// 处理键盘事件
function handleKeydown(event) {
  // Ctrl+S 保存
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    handleSave();
  }
  
  // Ctrl+F 查找
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault();
    showFindReplace.value = true;
  }
  
  // Tab 键插入空格
  if (event.key === 'Tab') {
    event.preventDefault();
    const start = event.target.selectionStart;
    const end = event.target.selectionEnd;
    content.value = content.value.substring(0, start) + '    ' + content.value.substring(end);
    event.target.selectionStart = event.target.selectionEnd = start + 4;
  }
  
  updateCursorPosition();
}

// 保存
async function handleSave() {
  if (!hasChanges.value || isSaving.value) return;
  
  isSaving.value = true;
  try {
    await emit('save', content.value);
    originalContent.value = content.value;
  } finally {
    isSaving.value = false;
  }
}

// 查找功能
function handleFindInput() {
  if (!findText.value) {
    matches.value = [];
    totalMatches.value = 0;
    currentMatch.value = 0;
    return;
  }
  
  // 查找所有匹配
  const regex = new RegExp(escapeRegex(findText.value), 'gi');
  const text = content.value;
  matches.value = [];
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.value.push({
      index: match.index,
      length: match[0].length
    });
  }
  
  totalMatches.value = matches.value.length;
  currentMatch.value = totalMatches.value > 0 ? 1 : 0;
  
  if (totalMatches.value > 0) {
    highlightMatch(0);
  }
}

function findNext() {
  if (matches.value.length === 0) return;
  
  currentMatch.value = currentMatch.value >= totalMatches.value ? 1 : currentMatch.value + 1;
  highlightMatch(currentMatch.value - 1);
}

function findPrevious() {
  if (matches.value.length === 0) return;
  
  currentMatch.value = currentMatch.value <= 1 ? totalMatches.value : currentMatch.value - 1;
  highlightMatch(currentMatch.value - 1);
}

function highlightMatch(index) {
  if (!textareaRef.value || !matches.value[index]) return;
  
  const match = matches.value[index];
  textareaRef.value.focus();
  textareaRef.value.setSelectionRange(match.index, match.index + match.length);
  textareaRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 替换功能
function replaceNext() {
  if (matches.value.length === 0 || currentMatch.value === 0) return;
  
  const match = matches.value[currentMatch.value - 1];
  content.value = 
    content.value.substring(0, match.index) +
    replaceText.value +
    content.value.substring(match.index + match.length);
  
  emit('update:modelValue', content.value);
  handleFindInput(); // 重新查找
}

function replaceAll() {
  if (!findText.value || matches.value.length === 0) return;
  
  const regex = new RegExp(escapeRegex(findText.value), 'g');
  content.value = content.value.replace(regex, replaceText.value);
  
  emit('update:modelValue', content.value);
  handleFindInput(); // 重新查找
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

// 生命周期
onMounted(() => {
  updateCursorPosition();
  
  // 监听点击事件更新光标位置
  if (textareaRef.value) {
    textareaRef.value.addEventListener('click', updateCursorPosition);
  }
});

onBeforeUnmount(() => {
  if (textareaRef.value) {
    textareaRef.value.removeEventListener('click', updateCursorPosition);
  }
});
</script>

<style scoped>
.novel-text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.5);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.2);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.word-count, .char-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.count-label {
  color: #8a8a8c;
}

.count-value {
  font-weight: 600;
  color: #2c2c2e;
}

/* 查找替换面板 */
.find-replace-panel {
  padding: 12px 16px;
  background: rgba(120, 140, 130, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.find-row, .replace-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.replace-row {
  margin-top: 8px;
}

.find-input, .replace-input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  font-size: 13px;
}

.find-input:focus, .replace-input:focus {
  outline: none;
  border-color: rgba(120, 140, 130, 0.5);
}

.find-btn, .replace-btn {
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.find-btn {
  display: flex;
  align-items: center;
  padding: 6px;
}

.find-btn:hover, .replace-btn:hover {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.2);
}

.find-count {
  font-size: 12px;
  color: #8a8a8c;
  min-width: 40px;
  text-align: center;
}

.close-btn {
  padding: 4px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* 编辑器容器 */
.editor-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  padding: 20px;
  border: none;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.8;
  color: #2c2c2e;
  background: white;
  outline: none;
}

.editor-textarea::placeholder {
  color: #c7c7cc;
}

/* 状态栏 */
.editor-statusbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  color: #8a8a8c;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
