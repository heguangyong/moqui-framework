<template>
  <div class="characters-panel">
    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <component :is="icons.search" :size="14" class="search-icon" />
        <input 
          type="text" 
          placeholder="搜索角色..." 
          class="search-input"
          v-model="searchQuery"
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">
          <component :is="icons.x" :size="12" />
        </button>
      </div>
    </div>
    
    <!-- 筛选 分组 -->
    <div class="section">
      <div class="section-title">筛选</div>
      <div class="filter-options">
        <div 
          class="filter-option"
          :class="{ 'filter-option--active': filterLocked === null }"
          @click="setFilter(null)"
        >
          全部
        </div>
        <div 
          class="filter-option"
          :class="{ 'filter-option--active': filterLocked === true }"
          @click="setFilter(true)"
        >
          <component :is="icons.lock" :size="12" />
          已锁定
        </div>
        <div 
          class="filter-option"
          :class="{ 'filter-option--active': filterLocked === false }"
          @click="setFilter(false)"
        >
          <component :is="icons.unlock" :size="12" />
          未锁定
        </div>
      </div>
    </div>
    
    <!-- 角色列表 -->
    <div class="section section--characters">
      <div class="section-header">
        <div class="section-title">角色列表</div>
        <span class="add-btn" @click="handleCreateCharacter">+</span>
      </div>
      <div class="section-items">
        <div 
          v-for="character in filteredCharacters"
          :key="character.id"
          class="character-item"
          :class="{ 'character-item--active': selectedCharacter === character.id }"
          @click="handleCharacterClick(character)"
        >
          <div class="character-avatar" :style="{ backgroundColor: character.color }">
            {{ character.name.charAt(0) }}
          </div>
          <div class="character-info">
            <div class="character-name">{{ character.name }}</div>
            <div class="character-role">{{ character.role }}</div>
          </div>
          <component 
            :is="character.locked ? icons.lock : icons.unlock" 
            :size="14" 
            class="character-lock"
            :class="{ 'character-lock--locked': character.locked }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUIStore } from '../../stores/ui.js';
import { useNavigationStore } from '../../stores/navigation.js';
import { icons } from '../../utils/icons.js';

const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();
const navigationStore = useNavigationStore();

// 确保在角色管理页面
function ensureCharactersPage() {
  if (route.path !== '/characters') {
    router.push('/characters');
  }
}

// 状态
const searchQuery = ref('');
const filterLocked = ref(null);
const selectedCharacter = ref(null);

// 角色数据 - 使用灰色系配色，ID 与 CharactersView 保持一致
const characters = ref([
  { id: '1', name: '李明', role: '主角', color: '#6a7a72', locked: true },
  { id: '2', name: '王芳', role: '配角', color: '#7a8a9a', locked: true },
  { id: '3', name: '张威', role: '反派', color: '#5a5a5a', locked: false },
  { id: '4', name: '老陈', role: '龙套', color: '#9a9a9a', locked: false }
]);

// 过滤后的角色列表
const filteredCharacters = computed(() => {
  let result = characters.value;
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.role.toLowerCase().includes(query)
    );
  }
  
  // 锁定状态过滤
  if (filterLocked.value !== null) {
    result = result.filter(c => c.locked === filterLocked.value);
  }
  
  return result;
});

// 搜索处理
function handleSearch() {
  ensureCharactersPage();
  navigationStore.updatePanelContext('characters', { searchQuery: searchQuery.value });
}

function clearSearch() {
  searchQuery.value = '';
  ensureCharactersPage();
  navigationStore.updatePanelContext('characters', { searchQuery: '' });
}

// 设置过滤器
function setFilter(locked) {
  filterLocked.value = locked;
  ensureCharactersPage();
  navigationStore.updatePanelContext('characters', { filterLocked: locked });
}

// 角色点击处理
function handleCharacterClick(character) {
  selectedCharacter.value = character.id;
  // 导航到角色详情页面
  router.push(`/characters/${character.id}`);
}

// 创建角色
function handleCreateCharacter() {
  ensureCharactersPage();
  navigationStore.updatePanelContext('characters', { 
    viewType: 'new-character',
    selectedCharacter: null
  });
}
</script>

<style scoped>
.characters-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.search-section {
  padding: 10px 14px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #7a7a7c;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 28px 8px 32px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  background-color: rgba(160, 160, 160, 0.3);
  color: #2c2c2e;
  transition: all 0.2s;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 2px rgba(0, 0, 0, 0.08);
}

.search-input:focus {
  outline: none;
  background-color: rgba(200, 200, 200, 0.5);
  border: 1px solid rgba(150, 150, 150, 0.4);
}

.search-input::placeholder {
  color: #7a7a7c;
}

.search-clear {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #7a7a7c;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.search-clear:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.section {
  padding: 10px 14px;
  position: relative;
}

.section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
}

.section:last-child::after {
  display: none;
}

.section--characters {
  flex: 1;
}

.section-title {
  font-size: 9px;
  font-weight: 700;
  color: #9a9a9a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.08),
    0 -1px 0 rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.add-btn {
  background: transparent;
  border: 1.5px dashed #8a8a8a;
  color: #2c2c2e;
  cursor: pointer;
  padding: 0;
  padding-bottom: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 700;
  line-height: 0;
}

.add-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: #6a6a6a;
}

.filter-options {
  display: flex;
  gap: 6px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  color: #6c6c6e;
  background-color: rgba(160, 160, 160, 0.3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-option:hover {
  background-color: rgba(160, 160, 160, 0.5);
}

.filter-option--active {
  background-color: #2c2c2e;
  color: #ffffff;
}

.section-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.character-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 10px;
}

.character-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.character-item--active {
  background: linear-gradient(90deg, rgba(210, 210, 210, 0.5), rgba(200, 218, 212, 0.4));
  backdrop-filter: blur(10px);
  color: #2c2c2e;
  position: relative;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* 右侧独立标注线 - 左深右浅渐变，立体凸起 */
.character-item--active::after {
  content: '';
  position: absolute;
  right: -14px;
  top: 3px;
  bottom: 3px;
  width: 5px;
  background: linear-gradient(90deg, #8a8a8a, #b8b8b8);
  border-radius: 3px;
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.character-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.character-info {
  flex: 1;
  min-width: 0;
}

.character-name {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

.character-role {
  font-size: 11px;
  color: #6c6c6e;
}

.character-lock {
  color: #9a9a9a;
  flex-shrink: 0;
}

.character-lock--locked {
  color: #6a6a6a;
}
</style>
