<template>
  <div class="project-view">
    <div class="project-header">
      <div class="project-title">
        <h2>项目: {{ project?.name || '未知项目' }}</h2>
        <p v-if="project?.description">{{ project.description }}</p>
      </div>
      <div class="project-actions">
        <button @click="saveProject" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? '保存中...' : '保存' }}
        </button>
        <button @click="generateVideo" class="btn btn-success">生成动画</button>
        <button @click="openWorkflowEditor" class="btn btn-secondary">工作流编辑器</button>
      </div>
    </div>
    
    <div class="project-content">
      <div class="sidebar">
        <div class="section">
          <div class="section-header">
            <h3>小说文件</h3>
            <button @click="addNovelFile" class="btn btn-small">+ 添加</button>
          </div>
          <ul class="file-list">
            <li v-for="file in novelFiles" :key="file.id" 
                @click="openFile(file)" 
                :class="{ active: currentFile?.id === file.id }">
              <span class="file-icon">📄</span>
              <span class="file-name">{{ file.name }}</span>
              <button @click.stop="removeFile(file.id)" class="file-remove">×</button>
            </li>
          </ul>
          <div v-if="novelFiles.length === 0" class="empty-state">
            暂无小说文件
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <h3>角色</h3>
            <button @click="addCharacter" class="btn btn-small">+ 添加</button>
          </div>
          <ul class="character-list">
            <li v-for="character in characters" :key="character.id" @click="editCharacter(character)">
              <span class="character-icon">👤</span>
              <div class="character-info">
                <span class="character-name">{{ character.name }}</span>
                <span class="character-role">{{ character.role }}</span>
              </div>
              <button @click.stop="removeCharacter(character.id)" class="character-remove">×</button>
            </li>
          </ul>
          <div v-if="characters.length === 0" class="empty-state">
            暂无角色信息
          </div>
        </div>

        <div class="section">
          <h3>项目统计</h3>
          <div class="stats" v-if="projectStats">
            <div class="stat-item">
              <span class="stat-label">文件数量:</span>
              <span class="stat-value">{{ projectStats.totalFiles }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">角色数量:</span>
              <span class="stat-value">{{ projectStats.totalCharacters }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总字数:</span>
              <span class="stat-value">{{ projectStats.totalWords }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="main-editor">
        <div class="editor-header">
          <div class="editor-title">
            <span v-if="currentFile">编辑: {{ currentFile.name }}</span>
            <span v-else>选择一个文件开始编辑</span>
          </div>
          <div class="editor-actions" v-if="currentFile">
            <span class="word-count">字数: {{ wordCount }}</span>
            <button @click="saveCurrentFile" class="btn btn-small">保存文件</button>
          </div>
        </div>
        <textarea 
          v-model="editorContent" 
          class="editor-textarea"
          placeholder="在这里编写您的小说内容..."
          @input="updateWordCount"
        ></textarea>
      </div>
    </div>

    <!-- Character Edit Modal -->
    <div v-if="showCharacterModal" class="modal-overlay" @click="closeCharacterModal">
      <div class="modal-content" @click.stop>
        <h3>{{ editingCharacter?.id ? '编辑角色' : '添加角色' }}</h3>
        <form @submit.prevent="saveCharacter">
          <div class="form-group">
            <label>角色名称:</label>
            <input v-model="characterForm.name" type="text" required>
          </div>
          <div class="form-group">
            <label>角色描述:</label>
            <textarea v-model="characterForm.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>角色类型:</label>
            <select v-model="characterForm.role">
              <option value="protagonist">主角</option>
              <option value="supporting">配角</option>
              <option value="secondary">次要角色</option>
              <option value="antagonist">反派</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeCharacterModal" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project.js';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const project = computed(() => projectStore.currentProject);
const novelFiles = computed(() => project.value?.files?.novels || []);
const characters = computed(() => project.value?.files?.characters || []);
const projectStats = computed(() => projectStore.currentProjectStatistics);
const isLoading = computed(() => projectStore.isLoading);

const currentFile = ref(null);
const editorContent = ref('');
const wordCount = ref(0);

// Character modal
const showCharacterModal = ref(false);
const editingCharacter = ref(null);
const characterForm = ref({
  name: '',
  description: '',
  role: 'secondary'
});

onMounted(() => {
  loadProject();
});

watch(() => route.params.id, () => {
  loadProject();
});

function loadProject() {
  const projectId = route.params.id;
  if (projectId && projectId !== 'undefined') {
    projectStore.setCurrentProject(projectId);
  }
}

function openFile(file) {
  // Save current file before switching
  if (currentFile.value && editorContent.value !== currentFile.value.content) {
    saveCurrentFile();
  }
  
  currentFile.value = file;
  editorContent.value = file.content || '';
  updateWordCount();
}

function saveCurrentFile() {
  if (currentFile.value) {
    projectStore.updateNovelFile(currentFile.value.id, {
      content: editorContent.value,
      metadata: {
        ...currentFile.value.metadata,
        wordCount: wordCount.value
      }
    });
  }
}

async function saveProject() {
  // Save current file first
  if (currentFile.value) {
    saveCurrentFile();
  }
  
  try {
    await projectStore.saveCurrentProject();
    alert('项目保存成功！');
  } catch (error) {
    alert('保存失败: ' + error.message);
  }
}

function generateVideo() {
  router.push('/workflow');
}

function openWorkflowEditor() {
  router.push('/workflow');
}

function addNovelFile() {
  const name = prompt('请输入章节名称:');
  if (name) {
    const fileName = name.endsWith('.txt') ? name : `${name}.txt`;
    projectStore.addNovelFile({
      name: fileName,
      content: '',
      metadata: { wordCount: 0, chapterCount: 1 }
    });
  }
}

function removeFile(fileId) {
  if (confirm('确定要删除这个文件吗？')) {
    if (currentFile.value && currentFile.value.id === fileId) {
      currentFile.value = null;
      editorContent.value = '';
    }
    projectStore.removeNovelFile(fileId);
  }
}

function addCharacter() {
  editingCharacter.value = null;
  characterForm.value = {
    name: '',
    description: '',
    role: 'secondary'
  };
  showCharacterModal.value = true;
}

function editCharacter(character) {
  editingCharacter.value = character;
  characterForm.value = {
    name: character.name,
    description: character.description || '',
    role: character.role || 'secondary'
  };
  showCharacterModal.value = true;
}

function saveCharacter() {
  if (!characterForm.value.name.trim()) {
    alert('请输入角色名称');
    return;
  }

  if (editingCharacter.value) {
    // Update existing character
    projectStore.updateCharacter(editingCharacter.value.id, characterForm.value);
  } else {
    // Add new character
    projectStore.addCharacter(characterForm.value);
  }
  
  closeCharacterModal();
}

function removeCharacter(characterId) {
  if (confirm('确定要删除这个角色吗？')) {
    projectStore.removeCharacter(characterId);
  }
}

function closeCharacterModal() {
  showCharacterModal.value = false;
  editingCharacter.value = null;
}

function updateWordCount() {
  wordCount.value = editorContent.value.length;
}
</script>

<style scoped>
.project-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
}

.project-title h2 {
  margin-bottom: 0.5rem;
}

.project-title p {
  opacity: 0.7;
  font-size: 0.9rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
}

.file-list li, .character-list li {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
  position: relative;
}

.file-list li:hover, .character-list li:hover {
  background: rgba(255, 255, 255, 0.1);
}

.file-icon, .character-icon {
  margin-right: 0.5rem;
}

.file-name, .character-name {
  flex: 1;
  font-weight: 500;
}

.character-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.character-role {
  font-size: 0.8rem;
  opacity: 0.7;
}

.file-remove, .character-remove {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem;
  border-radius: 2px;
  opacity: 0;
  transition: all 0.3s;
}

.file-list li:hover .file-remove,
.character-list li:hover .character-remove {
  opacity: 1;
}

.file-remove:hover, .character-remove:hover {
  background: rgba(255, 0, 0, 0.2);
  color: #ff4444;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  opacity: 0.5;
  font-style: italic;
}

.stats {
  padding: 1rem 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-label {
  opacity: 0.7;
}

.stat-value {
  font-weight: 500;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.word-count {
  font-size: 0.8rem;
  opacity: 0.7;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  font-size: 1rem;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.project-actions {
  display: flex;
  gap: 1rem;
}

.project-content {
  flex: 1;
  display: flex;
  gap: 2rem;
}

.sidebar {
  width: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.section {
  margin-bottom: 2rem;
}

.section h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.file-list, .character-list {
  list-style: none;
  margin-bottom: 1rem;
}

.file-list li, .character-list li {
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
}

.file-list li:hover, .character-list li:hover {
  background: rgba(255, 255, 255, 0.1);
}

.file-list li.active {
  background: rgba(255, 255, 255, 0.2);
}

.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.editor-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 500;
}

.editor-textarea {
  flex: 1;
  padding: 1rem;
  background: transparent;
  border: none;
  color: white;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.editor-textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-success {
  background: #FF9800;
  color: white;
}

.btn-small {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>