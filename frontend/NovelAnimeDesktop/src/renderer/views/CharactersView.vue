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
          v-if="characters.length > 0"
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
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" title="清除搜索">
          <component :is="icons.x" :size="14" />
        </button>
      </div>
      
      <!-- 筛选和排序 -->
      <div class="toolbar-controls">
        <!-- 角色类型筛选 -->
        <div class="filter-group">
          <label class="filter-label">类型:</label>
          <select v-model="filterRole" class="filter-select">
            <option value="">全部</option>
            <option value="protagonist">主角</option>
            <option value="supporting">配角</option>
            <option value="antagonist">反派</option>
            <option value="minor">龙套</option>
          </select>
        </div>
        
        <!-- 锁定状态筛选 -->
        <div class="filter-group">
          <label class="filter-label">状态:</label>
          <select v-model="filterLocked" class="filter-select">
            <option value="">全部</option>
            <option value="locked">已锁定</option>
            <option value="unlocked">未锁定</option>
          </select>
        </div>
        
        <!-- 排序 -->
        <div class="filter-group">
          <label class="filter-label">排序:</label>
          <select v-model="sortBy" class="filter-select">
            <option value="name">名称</option>
            <option value="role">类型</option>
            <option value="appearances">出场次数</option>
            <option value="scenes">关联场景</option>
          </select>
        </div>
        
        <!-- 排序方向 -->
        <button 
          class="sort-direction-btn" 
          @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'"
          :title="sortDirection === 'asc' ? '升序' : '降序'"
        >
          <component :is="sortDirection === 'asc' ? icons.arrowUp : icons.arrowDown" :size="16" />
        </button>
        
        <!-- 导入导出 -->
        <div class="divider"></div>
        <button class="toolbar-btn" @click="exportCharacters" title="导出角色">
          <component :is="icons.download" :size="16" />
          <span>导出</span>
        </button>
        <button class="toolbar-btn" @click="importCharacters" title="导入角色">
          <component :is="icons.upload" :size="16" />
          <span>导入</span>
        </button>
      </div>
    </div>
    
    <!-- 统计信息栏 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">总计:</span>
        <span class="stat-value">{{ characters.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">主角:</span>
        <span class="stat-value">{{ getCountByRole('protagonist') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">配角:</span>
        <span class="stat-value">{{ getCountByRole('supporting') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">反派:</span>
        <span class="stat-value">{{ getCountByRole('antagonist') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已锁定:</span>
        <span class="stat-value">{{ getLockedCount() }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">显示:</span>
        <span class="stat-value">{{ filteredCharacters.length }}</span>
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
import { useRouter } from 'vue-router';
import { useUIStore } from '../stores/ui.js';
import { useProjectStore } from '../stores/project';
import { useNavigationStore } from '../stores/navigation';
import { CharacterSystem } from '../services/CharacterSystem.ts';
import { characterApi, apiService } from '../services/index.ts';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';

const router = useRouter();
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

// 筛选和排序状态
const filterRole = ref('');
const filterLocked = ref('');
const sortBy = ref('name');
const sortDirection = ref('asc');

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
        color: '#7a9188',
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
        color: '#8a9cad',
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
        color: '#6a6a6a',
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
        color: '#a9adab',
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
  let result = characters.value;
  
  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.tags?.some(t => t.toLowerCase().includes(query))
    );
  }
  
  // 角色类型筛选
  if (filterRole.value) {
    result = result.filter(c => c.role === filterRole.value);
  }
  
  // 锁定状态筛选
  if (filterLocked.value === 'locked') {
    result = result.filter(c => c.isLocked);
  } else if (filterLocked.value === 'unlocked') {
    result = result.filter(c => !c.isLocked);
  }
  
  // 排序
  result = [...result].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy.value) {
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'role':
        const roleOrder = { protagonist: 1, supporting: 2, antagonist: 3, minor: 4 };
        aVal = roleOrder[a.role] || 5;
        bVal = roleOrder[b.role] || 5;
        break;
      case 'appearances':
        aVal = a.appearances || 0;
        bVal = b.appearances || 0;
        break;
      case 'scenes':
        aVal = a.scenes || 0;
        bVal = b.scenes || 0;
        break;
      default:
        return 0;
    }
    
    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
  
  return result;
});

// 是否显示确认所有角色按钮 - 需求 5.3
const showConfirmAllButton = computed(() => {
  // 🔥 REFACTOR: Use project.status instead of workflowState
  // 当有角色且项目状态为 analyzed 或 parsed 时显示
  const hasCharacters = characters.value.length > 0;
  const project = projectStore.currentProject;
  const status = project?.status;
  const inReviewStage = status === 'analyzed' || status === 'parsed';
  
  console.log('👥 showConfirmAllButton check:', {
    hasCharacters,
    inReviewStage,
    status,
    charactersCount: characters.value.length
  });
  
  // 只要有角色且在审核阶段就显示按钮
  return hasCharacters && inReviewStage;
});

// 是否所有角色都已确认 - 需求 5.4
const allCharactersConfirmed = computed(() => {
  // 🔥 REFACTOR: Use project.status instead of workflowState
  const project = projectStore.currentProject;
  const status = project?.status;
  return status === 'characters_confirmed' || status === 'generating' || status === 'completed';
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
async function confirmAllCharacters() {
  console.log('👥 confirmAllCharacters called');
  
  // 标记所有角色为已确认
  characters.value.forEach((character) => {
    character.confirmed = true;

    // 自动锁定主要角色
    if (character.role === 'protagonist' || character.role === 'antagonist') {
      if (!character.isLocked) {
        lockCharacter(character);
      }
    }
  });

  // 更新后端项目状态
  try {
    const projectId =
      projectStore.currentProject?.id || projectStore.currentProject?.projectId;
    console.log('👥 Updating project status, projectId:', projectId);
    if (projectId) {
      const response = await apiService.axiosInstance.put(`/project/${projectId}`, {
        status: 'characters_confirmed',
      });
      console.log('👥 Project status update response:', response.data);
    }
  } catch (error) {
    console.warn('Failed to update project status:', error);
  }

  // 🔥 REFACTOR: Removed navigationStore.confirmCharacters() call
  // Backend API call above already updated project status to 'characters_confirmed'
  // No need for separate workflowState management

  uiStore.addNotification({
    type: 'success',
    title: '角色确认完成',
    message: '所有角色已确认，即将进入动漫生成步骤',
    timeout: 2000,
  });

  // 延迟后返回仪表盘
  setTimeout(() => {
    router.push('/');
  }, 1500);
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
    protagonist: '#7a9188', // 主角 - 绿灰色
    supporting: '#8a9cad',  // 配角 - 蓝灰色
    antagonist: '#6a6a6a',  // 反派 - 深灰色
    minor: '#a9adab'        // 龙套 - 浅灰色
  };
  return roleColors[role] || roleColors.minor;
}

function getRandomColor() {
  // 统一使用灰色系纯色，与系统风格一致
  const colors = [
    '#7a9188', // 绿灰
    '#8a9cad', // 蓝灰
    '#6a6a6a', // 深灰
    '#a9adab', // 浅灰
    '#959c99', // 中灰
    '#8a8a95'  // 紫灰
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 统计功能
function getCountByRole(role) {
  return characters.value.filter(c => c.role === role).length;
}

function getLockedCount() {
  return characters.value.filter(c => c.isLocked).length;
}

// 导出角色数据
function exportCharacters() {
  try {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projectId: projectStore.currentProject?.id,
      projectName: projectStore.currentProject?.name,
      characters: characters.value.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
        description: c.description,
        tags: c.tags,
        appearance: c.appearance,
        appearances: c.appearances,
        scenes: c.scenes,
        isLocked: c.isLocked
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `characters_${projectStore.currentProject?.name || 'export'}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    uiStore.addNotification({
      type: 'success',
      title: '导出成功',
      message: `已导出 ${characters.value.length} 个角色`,
      timeout: 2000
    });
  } catch (error) {
    console.error('Export failed:', error);
    uiStore.addNotification({
      type: 'error',
      title: '导出失败',
      message: error.message,
      timeout: 3000
    });
  }
}

// 导入角色数据
function importCharacters() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // 验证数据格式
      if (!importData.characters || !Array.isArray(importData.characters)) {
        throw new Error('无效的角色数据格式');
      }
      
      // 询问导入方式
      const mode = confirm(
        `发现 ${importData.characters.length} 个角色\n\n` +
        `点击"确定"追加到现有角色\n` +
        `点击"取消"替换所有角色`
      ) ? 'append' : 'replace';
      
      if (mode === 'replace') {
        characters.value = [];
      }
      
      // 导入角色
      let importedCount = 0;
      let skippedCount = 0;
      
      for (const char of importData.characters) {
        // 检查是否已存在
        const exists = characters.value.some(c => c.id === char.id || c.name === char.name);
        
        if (exists && mode === 'append') {
          skippedCount++;
          continue;
        }
        
        // 确保有颜色
        if (!char.color) {
          char.color = getColorByRole(char.role);
        }
        
        characters.value.push({
          ...char,
          id: char.id || `char_${Date.now()}_${Math.random()}`,
          tags: char.tags || [],
          appearances: char.appearances || 0,
          scenes: char.scenes || 0,
          isLocked: char.isLocked || false
        });
        
        importedCount++;
      }
      
      uiStore.addNotification({
        type: 'success',
        title: '导入成功',
        message: `已导入 ${importedCount} 个角色${skippedCount > 0 ? `，跳过 ${skippedCount} 个重复角色` : ''}`,
        timeout: 3000
      });
    } catch (error) {
      console.error('Import failed:', error);
      uiStore.addNotification({
        type: 'error',
        title: '导入失败',
        message: error.message,
        timeout: 3000
      });
    }
  };
  
  input.click();
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
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  width: 280px;
  flex-shrink: 0;
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
  padding: 10px 36px 10px 40px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  background-color: #c8c8c8;
  color: #2c2c2e;
  transition: all 0.15s ease;
}

.search-input:hover {
  background-color: #d0d0d0;
}

.search-input:focus {
  outline: none;
  background-color: #e8e8e8;
  border: 1px solid rgba(122, 145, 136, 0.5);
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 4px;
  padding: 4px;
  color: #7a7a7c;
  cursor: pointer;
  transition: all 0.2s;
}

.search-clear:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #4a4a4c;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label {
  font-size: 12px;
  color: #6c6c6e;
  font-weight: 500;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  color: #2c2c2e;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.3);
}

.filter-select:focus {
  outline: none;
  border-color: #8a8a8a;
  background: rgba(200, 200, 200, 0.5);
}

.sort-direction-btn {
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: #4a4a4c;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.sort-direction-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: #4a4a4c;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 统计信息栏 */
.stats-bar {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item .stat-label {
  font-size: 11px;
  color: #6c6c6e;
  font-weight: 500;
}

.stat-item .stat-value {
  font-size: 13px;
  color: #2c2c2e;
  font-weight: 600;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(165, 188, 182, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #2c2c2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: rgba(145, 168, 162, 0.85);
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
  background-color: #c8c8c8;
  color: #2c2c2e;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background-color: #d8d8d8;
}

.action-btn--danger:hover {
  background-color: #e53e3e;
  color: #ffffff;
}

.action-btn--lock:hover {
  background-color: #5ab05e;
  color: #ffffff;
}

.action-btn--unlock {
  color: #5ab05e;
}

.action-btn--unlock:hover {
  background-color: #d69e2e;
  color: #ffffff;
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
  background: rgba(222, 230, 226, 0.97);
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
  background: rgba(190, 209, 205, 0.45);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--secondary {
  background-color: #c8c8c8;
  color: #2c2c2e;
}

.btn--secondary:hover:not(:disabled) {
  background-color: #d8d8d8;
}

.btn--primary {
  background-color: #7a9188;
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background-color: #6a8178;
}

/* 头部按钮样式 - 使用系统统一风格 */
.confirm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  background-color: #7a9188;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #6a8178;
}

.confirm-btn:disabled {
  background-color: #c8c8c8;
  color: #8a8a8a;
  cursor: not-allowed;
}

.add-character-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  background-color: #c8c8c8;
  border: none;
  border-radius: 6px;
  color: #2c2c2e;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.add-character-btn:hover {
  background-color: #d8d8d8;
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
