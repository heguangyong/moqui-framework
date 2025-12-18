<template>
  <div class="characters-view">
    <!-- 工具栏 -->
    <div class="characters-toolbar">
      <div class="search-box">
        <component :is="icons.search" :size="16" class="search-icon" />
        <input 
          type="text" 
          placeholder="搜索角色..." 
          v-model="searchQuery"
          class="search-input"
        />
      </div>
      
      <button class="add-btn" @click="handleAddCharacter">
        <component :is="icons.plus" :size="16" />
        <span>添加角色</span>
      </button>
    </div>
    
    <!-- 角色卡片列表 -->
    <div class="characters-grid">
      <div 
        v-for="character in filteredCharacters" 
        :key="character.id"
        class="character-card"
        :class="{ 'character-card--selected': selectedCharacter?.id === character.id }"
        @click="selectCharacter(character)"
      >
        <div class="character-avatar">
          <div class="avatar-placeholder" :style="{ background: character.color }">
            {{ character.name.charAt(0) }}
          </div>
          <div class="character-role" :class="`role--${character.role}`">
            {{ getRoleLabel(character.role) }}
          </div>
        </div>
        
        <div class="character-info">
          <h3 class="character-name">{{ character.name }}</h3>
          <p class="character-description">{{ character.description || '暂无描述' }}</p>
          
          <div class="character-tags">
            <span 
              v-for="tag in character.tags" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
          
          <div class="character-stats">
            <div class="stat">
              <span class="stat-label">出场次数</span>
              <span class="stat-value">{{ character.appearances || 0 }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">关联场景</span>
              <span class="stat-value">{{ character.scenes || 0 }}</span>
            </div>
          </div>
        </div>
        
        <div class="character-actions">
          <button 
            v-if="!character.isLocked"
            class="action-btn action-btn--lock" 
            @click.stop="lockCharacter(character)" 
            title="锁定档案"
            :disabled="isLocking"
          >
            <component :is="icons.lock" :size="16" />
          </button>
          <button 
            v-else
            class="action-btn action-btn--unlock" 
            @click.stop="unlockCharacter(character)" 
            title="解锁档案"
          >
            <component :is="icons.unlock" :size="16" />
          </button>
          <button class="action-btn" @click.stop="editCharacter(character)" title="编辑">
            <component :is="icons.edit" :size="16" />
          </button>
          <button class="action-btn action-btn--danger" @click.stop="deleteCharacter(character)" title="删除">
            <component :is="icons.trash" :size="16" />
          </button>
        </div>
        
        <!-- 锁定状态指示器 -->
        <div v-if="character.isLocked" class="locked-indicator" title="档案已锁定">
          <component :is="icons.lock" :size="12" />
        </div>
      </div>
      
      <!-- 添加角色卡片 -->
      <div class="character-card character-card--add" @click="handleAddCharacter">
        <div class="add-icon">
          <component :is="icons.plus" :size="32" />
        </div>
        <span>添加新角色</span>
      </div>
    </div>
    
    <!-- 角色详情面板 -->
    <div v-if="selectedCharacter" class="character-detail-panel">
      <div class="panel-header">
        <h2>角色详情</h2>
        <button class="close-btn" @click="selectedCharacter = null">
          <component :is="icons.x" :size="20" />
        </button>
      </div>
      
      <div class="panel-content">
        <div class="detail-avatar">
          <div class="avatar-large" :style="{ background: selectedCharacter.color }">
            {{ selectedCharacter.name.charAt(0) }}
          </div>
        </div>
        
        <div class="detail-section">
          <label>角色名称</label>
          <input 
            type="text" 
            v-model="editingCharacter.name"
            class="detail-input"
          />
        </div>
        
        <div class="detail-section">
          <label>角色类型</label>
          <select v-model="editingCharacter.role" class="detail-select">
            <option value="protagonist">主角</option>
            <option value="supporting">配角</option>
            <option value="antagonist">反派</option>
            <option value="minor">龙套</option>
          </select>
        </div>
        
        <div class="detail-section">
          <label>角色描述</label>
          <textarea 
            v-model="editingCharacter.description"
            class="detail-textarea"
            rows="4"
            placeholder="输入角色描述..."
          ></textarea>
        </div>
        
        <div class="detail-section">
          <label>性格特点</label>
          <div class="tags-input">
            <span 
              v-for="(tag, index) in editingCharacter.tags" 
              :key="index"
              class="tag tag--editable"
            >
              {{ tag }}
              <button class="tag-remove" @click="removeTag(index)">×</button>
            </span>
            <input 
              type="text" 
              v-model="newTag"
              @keyup.enter="addTag"
              placeholder="添加标签..."
              class="tag-input"
            />
          </div>
        </div>
        
        <div class="detail-section">
          <label>外貌特征</label>
          <textarea 
            v-model="editingCharacter.appearance"
            class="detail-textarea"
            rows="3"
            placeholder="描述角色外貌..."
          ></textarea>
        </div>
        
        <div class="panel-actions">
          <button class="btn btn--secondary" @click="selectedCharacter = null">取消</button>
          <button class="btn btn--primary" @click="saveCharacter">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUIStore } from '../stores/ui.js';
import { useProjectStore } from '../stores/project.js';
import { CharacterSystem } from '../services/CharacterSystem.ts';
import { icons } from '../utils/icons.js';

const uiStore = useUIStore();
const projectStore = useProjectStore();

// 状态
const searchQuery = ref('');
const selectedCharacter = ref(null);
const editingCharacter = ref({});
const newTag = ref('');
const isLocking = ref(false);

// 角色数据 - 从项目Store获取或使用本地数据
const characters = ref([]);

// 初始化
onMounted(() => {
  loadCharacters();
});

// 加载角色数据
function loadCharacters() {
  // 优先从当前项目加载
  if (projectStore.currentProject?.characters) {
    characters.value = projectStore.currentProject.characters.map(c => ({
      ...c,
      color: c.color || getRandomColor(),
      tags: c.tags || extractTagsFromAttributes(c.attributes),
      description: c.description || formatDescription(c.attributes),
      appearance: c.appearance || c.attributes?.appearance || '',
      appearances: c.appearanceCount || c.appearances?.length || 0,
      scenes: c.sceneCount || 0,
      isLocked: !!CharacterSystem.getLockedProfile(c.id)
    }));
  } else {
    // 使用示例数据
    characters.value = [
      {
        id: '1',
        name: '李明',
        role: 'protagonist',
        description: '故事的主角，一个勇敢而善良的年轻人',
        tags: ['勇敢', '善良', '正义'],
        color: 'linear-gradient(135deg, #667eea, #764ba2)',
        appearances: 45,
        scenes: 12,
        appearance: '黑色短发，身材高大，眼神坚定',
        isLocked: false
      },
      {
        id: '2',
        name: '王芳',
        role: 'supporting',
        description: '主角的青梅竹马，聪明伶俐',
        tags: ['聪明', '温柔', '坚强'],
        color: 'linear-gradient(135deg, #f093fb, #f5576c)',
        appearances: 32,
        scenes: 8,
        appearance: '长发飘飘，面容清秀',
        isLocked: false
      },
      {
        id: '3',
        name: '张威',
        role: 'antagonist',
        description: '故事的反派，野心勃勃',
        tags: ['狡猾', '野心', '冷酷'],
        color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        appearances: 18,
        scenes: 6,
        appearance: '面容阴沉，眼神锐利',
        isLocked: false
      },
      {
        id: '4',
        name: '老陈',
        role: 'minor',
        description: '村里的老人，见多识广',
        tags: ['智慧', '和蔼'],
        color: 'linear-gradient(135deg, #43e97b, #38f9d7)',
        appearances: 8,
        scenes: 3,
        appearance: '白发苍苍，慈眉善目',
        isLocked: false
      }
    ];
  }
}

// 从属性中提取标签
function extractTagsFromAttributes(attributes) {
  if (!attributes) return [];
  const tags = [];
  if (attributes.personality) {
    tags.push(...attributes.personality.split(',').map(t => t.trim()).filter(Boolean));
  }
  return tags.slice(0, 5);
}

// 格式化描述
function formatDescription(attributes) {
  if (!attributes) return '';
  const parts = [];
  if (attributes.gender) parts.push(attributes.gender === 'male' ? '男性' : '女性');
  if (attributes.age) parts.push(`${attributes.age}岁`);
  if (attributes.occupation) parts.push(attributes.occupation);
  if (attributes.personality) parts.push(attributes.personality);
  return parts.join('，') || '暂无描述';
}

// 过滤后的角色
const filteredCharacters = computed(() => {
  if (!searchQuery.value.trim()) {
    return characters.value;
  }
  const query = searchQuery.value.toLowerCase();
  return characters.value.filter(c => 
    c.name.toLowerCase().includes(query) ||
    c.description?.toLowerCase().includes(query) ||
    c.tags?.some(t => t.toLowerCase().includes(query))
  );
});

// 监听选中角色变化
watch(selectedCharacter, (newVal) => {
  if (newVal) {
    editingCharacter.value = { ...newVal, tags: [...(newVal.tags || [])] };
  }
});

// 方法
function selectCharacter(character) {
  selectedCharacter.value = character;
}

function handleAddCharacter() {
  const newCharacter = {
    id: `char_${Date.now()}`,
    name: '新角色',
    role: 'minor',
    description: '',
    tags: [],
    color: getRandomColor(),
    appearances: 0,
    scenes: 0,
    appearance: ''
  };
  characters.value.push(newCharacter);
  selectedCharacter.value = newCharacter;
  
  uiStore.addNotification({
    type: 'success',
    title: '添加成功',
    message: '新角色已创建',
    timeout: 2000
  });
}

function editCharacter(character) {
  selectedCharacter.value = character;
}

function deleteCharacter(character) {
  if (confirm(`确定要删除角色 "${character.name}" 吗？`)) {
    const index = characters.value.findIndex(c => c.id === character.id);
    if (index > -1) {
      characters.value.splice(index, 1);
      if (selectedCharacter.value?.id === character.id) {
        selectedCharacter.value = null;
      }
      uiStore.addNotification({
        type: 'success',
        title: '删除成功',
        message: `角色 "${character.name}" 已删除`,
        timeout: 2000
      });
    }
  }
}

function saveCharacter() {
  const index = characters.value.findIndex(c => c.id === editingCharacter.value.id);
  if (index > -1) {
    characters.value[index] = { ...editingCharacter.value };
    
    // 同步到项目Store
    if (projectStore.currentProject) {
      projectStore.updateCharacter(editingCharacter.value.id, {
        name: editingCharacter.value.name,
        role: editingCharacter.value.role,
        attributes: {
          appearance: editingCharacter.value.appearance,
          personality: editingCharacter.value.tags?.join(', '),
          age: editingCharacter.value.age,
          gender: editingCharacter.value.gender
        }
      });
    }
    
    uiStore.addNotification({
      type: 'success',
      title: '保存成功',
      message: '角色信息已更新',
      timeout: 2000
    });
  }
  selectedCharacter.value = null;
}

// 锁定角色档案
async function lockCharacter(character) {
  isLocking.value = true;
  try {
    // 构建完整的角色对象用于锁定
    const fullCharacter = {
      id: character.id,
      name: character.name,
      role: character.role,
      attributes: {
        appearance: character.appearance,
        personality: character.tags?.join(', '),
        age: character.age,
        gender: character.gender,
        occupation: character.occupation,
        background: character.background
      },
      relationships: character.relationships || [],
      appearances: character.appearances || []
    };
    
    CharacterSystem.createLockedProfile(fullCharacter);
    
    // 更新本地状态
    const index = characters.value.findIndex(c => c.id === character.id);
    if (index > -1) {
      characters.value[index].isLocked = true;
    }
    
    uiStore.addNotification({
      type: 'success',
      title: '锁定成功',
      message: `角色 "${character.name}" 的档案已锁定，将保持一致性`,
      timeout: 3000
    });
  } catch (error) {
    uiStore.addNotification({
      type: 'error',
      title: '锁定失败',
      message: error.message,
      timeout: 3000
    });
  } finally {
    isLocking.value = false;
  }
}

// 解锁角色档案
function unlockCharacter(character) {
  const key = `locked_profile_${character.id}`;
  localStorage.removeItem(key);
  
  // 更新本地状态
  const index = characters.value.findIndex(c => c.id === character.id);
  if (index > -1) {
    characters.value[index].isLocked = false;
  }
  
  uiStore.addNotification({
    type: 'info',
    title: '已解锁',
    message: `角色 "${character.name}" 的档案已解锁`,
    timeout: 2000
  });
}

// 确认角色（从识别结果中确认）
function confirmCharacter(character) {
  // 标记为已确认
  const index = characters.value.findIndex(c => c.id === character.id);
  if (index > -1) {
    characters.value[index].confirmed = true;
    
    // 自动锁定主要角色
    if (character.role === 'protagonist' || character.role === 'antagonist') {
      lockCharacter(character);
    }
    
    uiStore.addNotification({
      type: 'success',
      title: '确认成功',
      message: `角色 "${character.name}" 已确认`,
      timeout: 2000
    });
  }
}

function addTag() {
  if (newTag.value.trim() && !editingCharacter.value.tags.includes(newTag.value.trim())) {
    editingCharacter.value.tags.push(newTag.value.trim());
    newTag.value = '';
  }
}

function removeTag(index) {
  editingCharacter.value.tags.splice(index, 1);
}

function getRoleLabel(role) {
  const labels = {
    protagonist: '主角',
    supporting: '配角',
    antagonist: '反派',
    minor: '龙套'
  };
  return labels[role] || role;
}

function getRandomColor() {
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a8edea, #fed6e3)'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
</script>

<style scoped>
.characters-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  position: relative;
}

/* 工具栏 */
.characters-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  position: relative;
  width: 280px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a7a7c;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.2);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.4);
  border-color: #4a90d9;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #4a90d9;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #3a7bc8;
}

/* 角色卡片网格 */
.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  flex: 1;
  overflow-y: auto;
}

.character-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.character-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.character-card--selected {
  border-color: #4a90d9;
  box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.3);
}

.character-avatar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.character-role {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
}

.role--protagonist { background: #e8f5e9; color: #2e7d32; }
.role--supporting { background: #e3f2fd; color: #1565c0; }
.role--antagonist { background: #ffebee; color: #c62828; }
.role--minor { background: #f5f5f5; color: #616161; }

.character-info {
  margin-bottom: 12px;
}

.character-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 6px 0;
}

.character-description {
  font-size: 13px;
  color: #6c6c6e;
  margin: 0 0 10px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  color: #4a4a4c;
}

.character-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 11px;
  color: #8a8a8c;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c2c2e;
}

.character-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.character-card:hover .character-actions {
  opacity: 1;
}

.action-btn {
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4c;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

.action-btn--danger:hover {
  background: #e74c3c;
  color: #fff;
}

.action-btn--lock:hover {
  background: #27ae60;
  color: #fff;
}

.action-btn--unlock {
  color: #27ae60;
}

.action-btn--unlock:hover {
  background: #f39c12;
  color: #fff;
}

.locked-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 20px;
  height: 20px;
  background: #27ae60;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

/* 添加角色卡片 */
.character-card--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  background: transparent;
}

.character-card--add:hover {
  border-color: #4a90d9;
  background: rgba(74, 144, 217, 0.05);
}

.add-icon {
  color: #8a8a8c;
  margin-bottom: 8px;
}

.character-card--add:hover .add-icon {
  color: #4a90d9;
}

.character-card--add span {
  font-size: 13px;
  color: #8a8a8c;
}

.character-card--add:hover span {
  color: #4a90d9;
}

/* 详情面板 */
.character-detail-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 380px;
  background: rgba(255, 255, 255, 0.98);
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.panel-header h2 {
  font-size: 18px;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #6c6c6e;
  cursor: pointer;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6c6c6e;
  margin-bottom: 6px;
}

.detail-input,
.detail-select,
.detail-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

.detail-input:focus,
.detail-select:focus,
.detail-textarea:focus {
  outline: none;
  border-color: #4a90d9;
}

.detail-textarea {
  resize: vertical;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #fff;
}

.tag--editable {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-remove {
  background: none;
  border: none;
  color: #8a8a8c;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
}

.tag-remove:hover {
  color: #e74c3c;
}

.tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  outline: none;
  font-size: 12px;
  padding: 4px;
}

.panel-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn--secondary {
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4c;
}

.btn--secondary:hover {
  background: rgba(0, 0, 0, 0.15);
}

.btn--primary {
  background: #4a90d9;
  color: #fff;
}

.btn--primary:hover {
  background: #3a7bc8;
}
</style>
