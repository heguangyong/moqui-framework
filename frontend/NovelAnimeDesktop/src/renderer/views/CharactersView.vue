<template>
  <div class="characters-view">
    <!-- 视图头部 -->
    <ViewHeader 
      title="角色管理" 
      subtitle="管理角色档案和一致性"
    >
      <template #actions>
        <!-- 确认所有角色按钮 - 需求 5.3, 5.4 -->
        <button 
          v-if="showConfirmAllButton"
          class="confirm-btn"
          @click="confirmAllCharacters"
          :disabled="allCharactersConfirmed"
        >
          <component :is="icons.check" :size="16" />
          <span>{{ allCharactersConfirmed ? '已确认' : '确认全部' }}</span>
        </button>
        <button class="add-character-btn" @click="handleAddCharacter">
          <component :is="icons.plus" :size="16" />
          <span>添加角色</span>
        </button>
      </template>
    </ViewHeader>
    
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
            <template v-if="character.tags && character.tags.length > 0">
              <span 
                v-for="tag in character.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </template>
            <span v-else class="tag tag--placeholder">暂无标签</span>
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
    <div v-if="selectedCharacter" class="panel-overlay" @click.self="selectedCharacter = null"></div>
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
          <div class="custom-select" :class="{ 'custom-select--open': roleSelectOpen }">
            <div class="custom-select__trigger" @click="roleSelectOpen = !roleSelectOpen">
              <span>{{ getRoleLabel(editingCharacter.role) }}</span>
              <component :is="icons.chevronDown" :size="16" class="select-arrow" />
            </div>
            <div v-if="roleSelectOpen" class="custom-select__options">
              <div 
                v-for="option in roleOptions" 
                :key="option.value"
                class="custom-select__option"
                :class="{ 'custom-select__option--selected': editingCharacter.role === option.value }"
                @click="selectRole(option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
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
import { useNavigationStore } from '../stores/navigation.js';
import { CharacterSystem } from '../services/CharacterSystem.ts';
import { characterApi } from '../services/index.ts';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';

const uiStore = useUIStore();
const projectStore = useProjectStore();
const navigationStore = useNavigationStore();

// 状态
const searchQuery = ref('');
const selectedCharacter = ref(null);
const editingCharacter = ref({});
const newTag = ref('');
const isLocking = ref(false);
const isLoading = ref(false);
const roleSelectOpen = ref(false);

// 从 panelContext 获取 novelId
const novelId = computed(() => navigationStore.panelContext.characters?.novelId);

// 角色类型选项
const roleOptions = [
  { value: 'protagonist', label: '主角' },
  { value: 'supporting', label: '配角' },
  { value: 'antagonist', label: '反派' },
  { value: 'minor', label: '龙套' }
];

// 选择角色类型
function selectRole(value) {
  editingCharacter.value.role = value;
  roleSelectOpen.value = false;
}

// 角色数据 - 从项目Store获取或使用本地数据
const characters = ref([]);

// 初始化
onMounted(() => {
  loadCharacters();
});

// 监听 novelId 变化
watch(novelId, (newVal) => {
  if (newVal) {
    loadCharactersFromBackend(newVal);
  }
}, { immediate: true });

// 从后端加载角色数据
async function loadCharactersFromBackend(nId) {
  if (!nId) return;
  
  isLoading.value = true;
  try {
    const result = await characterApi.getCharacters(nId);
    
    if (result.success && result.characters) {
      characters.value = result.characters.map(c => ({
        id: c.characterId,
        name: c.name,
        role: c.role || 'minor',
        description: c.description || '',
        tags: c.personality ? c.personality.split(',').map(t => t.trim()) : [],
        color: getColorByRole(c.role || 'minor'),
        appearances: c.mentionCount || 0,
        scenes: 0,
        appearance: c.appearance || '',
        isLocked: c.isLocked || false,
        extractionConfidence: c.extractionConfidence || 0
      }));
      
      uiStore.addNotification({
        type: 'success',
        title: '加载成功',
        message: `已加载 ${characters.value.length} 个角色`,
        timeout: 2000
      });
    }
  } catch (error) {
    console.error('Failed to load characters from backend:', error);
    // 回退到本地数据
    loadCharacters();
  } finally {
    isLoading.value = false;
  }
}

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
        color: 'linear-gradient(135deg, #6a7a72, #8fa89e)',
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
        color: 'linear-gradient(135deg, #7a8a9a, #9ab0c0)',
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
        color: 'linear-gradient(135deg, #5a5a5a, #7a7a7a)',
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
        color: 'linear-gradient(135deg, #9a9a9a, #b8c0bc)',
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

// 是否显示确认所有角色按钮 - 需求 5.3
const showConfirmAllButton = computed(() => {
  // 当处于角色审核阶段时显示
  return navigationStore.workflowState.stage === 'character-review' ||
         (characters.value.length > 0 && !navigationStore.workflowState.charactersConfirmed);
});

// 是否所有角色都已确认 - 需求 5.4
const allCharactersConfirmed = computed(() => {
  return navigationStore.workflowState.charactersConfirmed;
});

// 监听选中角色变化
watch(selectedCharacter, (newVal) => {
  if (newVal) {
    editingCharacter.value = { 
      ...newVal, 
      tags: Array.isArray(newVal.tags) ? [...newVal.tags] : [] 
    };
  }
  // 关闭角色类型下拉框
  roleSelectOpen.value = false;
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
    color: getColorByRole('minor'),
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
    // 根据角色类型更新颜色
    editingCharacter.value.color = getColorByRole(editingCharacter.value.role);
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

// 确认所有角色 - 需求 5.3, 5.4
function confirmAllCharacters() {
  // 标记所有角色为已确认
  characters.value.forEach(character => {
    character.confirmed = true;
    
    // 自动锁定主要角色
    if (character.role === 'protagonist' || character.role === 'antagonist') {
      if (!character.isLocked) {
        lockCharacter(character);
      }
    }
  });
  
  // 更新导航状态 - 需求 5.4: 角色确认后启用工作流执行
  navigationStore.confirmCharacters();
  
  uiStore.addNotification({
    type: 'success',
    title: '角色确认完成',
    message: '所有角色已确认，现在可以执行工作流了',
    timeout: 3000
  });
}

function addTag() {
  if (newTag.value.trim()) {
    // 确保 tags 数组存在
    if (!editingCharacter.value.tags) {
      editingCharacter.value.tags = [];
    }
    if (!editingCharacter.value.tags.includes(newTag.value.trim())) {
      editingCharacter.value.tags.push(newTag.value.trim());
      newTag.value = '';
    }
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

// 根据角色类型获取对应颜色
function getColorByRole(role) {
  const roleColors = {
    protagonist: 'linear-gradient(135deg, #6a7a72, #8fa89e)', // 主角 - 绿灰色
    supporting: 'linear-gradient(135deg, #7a8a9a, #9ab0c0)',  // 配角 - 蓝灰色
    antagonist: 'linear-gradient(135deg, #5a5a5a, #7a7a7a)',  // 反派 - 深灰色
    minor: 'linear-gradient(135deg, #9a9a9a, #b8c0bc)'        // 龙套 - 浅灰色
  };
  return roleColors[role] || roleColors.minor;
}

function getRandomColor() {
  // 统一使用灰色系渐变，与系统风格一致
  const colors = [
    'linear-gradient(135deg, #6a7a72, #8fa89e)', // 绿灰
    'linear-gradient(135deg, #7a8a9a, #9ab0c0)', // 蓝灰
    'linear-gradient(135deg, #5a5a5a, #7a7a7a)', // 深灰
    'linear-gradient(135deg, #9a9a9a, #b8c0bc)', // 浅灰
    'linear-gradient(135deg, #8a8a8a, #a0a8a4)', // 中灰
    'linear-gradient(135deg, #7a7a82, #9a9aa8)'  // 紫灰
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
  background: rgba(200, 200, 200, 0.5);
  border-color: #8a8a8a;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #2c2c2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}

/* 角色卡片网格 */
.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  align-content: start;
}

.character-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  height: fit-content;
}

.character-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.character-card--selected {
  border-color: #8a8a8a;
  box-shadow: 0 0 0 2px rgba(138, 138, 138, 0.3);
}

.character-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.character-role {
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 10px;
}

.role--protagonist { background: rgba(130, 160, 140, 0.3); color: #4a6a52; }
.role--supporting { background: rgba(100, 140, 180, 0.3); color: #3a5a7a; }
.role--antagonist { background: rgba(180, 120, 120, 0.3); color: #7a4a4a; }
.role--minor { background: rgba(160, 160, 160, 0.3); color: #5a5a5a; }

.character-info {
  margin-bottom: 8px;
}

.character-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c2c2e;
  margin: 0 0 4px 0;
}

.character-description {
  font-size: 12px;
  color: #6c6c6e;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  color: #4a4a4c;
}

.tag--placeholder {
  color: #9a9a9c;
  font-style: italic;
  background: transparent;
}

.character-stats {
  display: flex;
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 10px;
  color: #8a8a8c;
}

.stat-value {
  font-size: 14px;
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

/* 添加角色卡片 - 与普通卡片大小一致 */
.character-card--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed rgba(0, 0, 0, 0.15);
  background: transparent;
  padding: 12px;
  min-height: 212px;
}

.character-card--add:hover {
  border-color: #8a8a8a;
  background: rgba(138, 138, 138, 0.06);
}

.add-icon {
  color: #9a9a9c;
  margin-bottom: 4px;
}

.character-card--add:hover .add-icon {
  color: #6a6a6a;
}

.character-card--add span {
  font-size: 11px;
  color: #9a9a9c;
}

.character-card--add:hover span {
  color: #6a6a6a;
}

/* 详情面板 - 毛玻璃风格，居中弹窗 */
.character-detail-panel {
  position: fixed;
  right: 50%;
  top: 50%;
  transform: translate(50%, -50%);
  width: 380px;
  max-height: 85vh;
  background: linear-gradient(180deg, rgba(230, 230, 230, 0.98), rgba(215, 225, 220, 0.96));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.1);
}

.panel-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #2c2c2e;
}

.close-btn {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: #6c6c6e;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #2c2c2e;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
}

.detail-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar-large {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.detail-section {
  margin-bottom: 14px;
}

.detail-section label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #6c6c6e;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-input,
.detail-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.5);
  color: #2c2c2e;
  transition: all 0.2s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.detail-input:focus,
.detail-textarea:focus {
  outline: none;
  border-color: rgba(138, 138, 138, 0.5);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(138, 138, 138, 0.1);
}

/* 自定义下拉框 */
.custom-select {
  position: relative;
  width: 100%;
}

.custom-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.5);
  color: #2c2c2e;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.custom-select__trigger:hover {
  background: rgba(255, 255, 255, 0.6);
}

.custom-select--open .custom-select__trigger {
  border-color: rgba(138, 138, 138, 0.5);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(138, 138, 138, 0.1);
}

.select-arrow {
  color: #6c6c6e;
  transition: transform 0.2s;
}

.custom-select--open .select-arrow {
  transform: rotate(180deg);
}

.custom-select__options {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: rgba(240, 240, 240, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 10;
  overflow: hidden;
}

.custom-select__option {
  padding: 10px 12px;
  font-size: 13px;
  color: #2c2c2e;
  cursor: pointer;
  transition: background 0.15s;
}

.custom-select__option:hover {
  background: rgba(180, 180, 180, 0.3);
}

.custom-select__option--selected {
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.5), rgba(200, 218, 212, 0.4));
  font-weight: 500;
}

.detail-textarea {
  resize: vertical;
  min-height: 80px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  min-height: 44px;
}

.tag--editable {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.08);
  padding: 3px 8px;
  border-radius: 10px;
}

.tag-remove {
  background: none;
  border: none;
  color: #8a8a8c;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
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
  background: transparent;
}

.panel-actions {
  display: flex;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.1);
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn--secondary {
  background: rgba(0, 0, 0, 0.08);
  color: #4a4a4c;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.btn--secondary:hover {
  background: rgba(0, 0, 0, 0.12);
}

.btn--primary {
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  color: #2c2c2e;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn--primary:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}

/* 头部按钮样式 */
.confirm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(90deg, rgba(130, 160, 140, 0.9), rgba(150, 180, 165, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #2c2c2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.confirm-btn:hover {
  background: linear-gradient(90deg, rgba(110, 140, 120, 0.9), rgba(130, 160, 145, 0.8));
}

.confirm-btn:disabled {
  background: rgba(160, 160, 160, 0.5);
  color: #8a8a8a;
  cursor: not-allowed;
}

.add-character-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(90deg, rgba(150, 150, 150, 0.9), rgba(180, 198, 192, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #2c2c2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.add-character-btn:hover {
  background: linear-gradient(90deg, rgba(130, 130, 130, 0.9), rgba(160, 178, 172, 0.8));
}

/* 弹窗遮罩层 */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
  z-index: 99;
}
</style>
