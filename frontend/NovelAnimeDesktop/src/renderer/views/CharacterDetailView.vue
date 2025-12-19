<template>
  <div class="character-detail-view">
    <!-- 视图头部 -->
    <ViewHeader 
      :title="character?.name || '角色详情'" 
      :subtitle="getRoleLabel(character?.role)"
    >
      <template #actions>
        <button 
          v-if="character && !character.isLocked"
          class="action-btn action-btn--lock" 
          @click="lockCharacter"
        >
          <component :is="icons.lock" :size="16" />
          <span>锁定档案</span>
        </button>
        <button 
          v-else-if="character"
          class="action-btn action-btn--unlock" 
          @click="unlockCharacter"
        >
          <component :is="icons.unlock" :size="16" />
          <span>解锁档案</span>
        </button>
        <button class="action-btn" @click="goBack">
          <component :is="icons.arrowLeft" :size="16" />
          <span>返回列表</span>
        </button>
      </template>
    </ViewHeader>

    <!-- 角色详情内容 -->
    <div v-if="character" class="detail-content">
      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <div class="avatar-section">
            <div class="avatar-large" :style="{ background: character.color }">
              {{ character.name.charAt(0) }}
            </div>
            <div class="locked-badge" v-if="character.isLocked">
              <component :is="icons.lock" :size="12" />
              已锁定
            </div>
          </div>
          <div class="basic-info">
            <h2 class="character-name">{{ character.name }}</h2>
            <div class="character-role-badge" :class="`role--${character.role}`">
              {{ getRoleLabel(character.role) }}
            </div>
            <p class="character-description">{{ character.description || '暂无描述' }}</p>
          </div>
        </div>
      </div>

      <!-- 详细信息区域 -->
      <div class="detail-grid">
        <!-- 性格特点 -->
        <div class="detail-card">
          <div class="card-title">
            <component :is="icons.tag" :size="16" />
            性格特点
          </div>
          <div class="tags-container">
            <span v-for="tag in character.tags" :key="tag" class="tag">{{ tag }}</span>
            <span v-if="!character.tags?.length" class="empty-text">暂无标签</span>
          </div>
        </div>

        <!-- 外貌特征 -->
        <div class="detail-card">
          <div class="card-title">
            <component :is="icons.user" :size="16" />
            外貌特征
          </div>
          <p class="card-content">{{ character.appearance || '暂无描述' }}</p>
        </div>

        <!-- 统计数据 -->
        <div class="detail-card">
          <div class="card-title">
            <component :is="icons.barChart" :size="16" />
            出场统计
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ character.appearances || 0 }}</span>
              <span class="stat-label">出场次数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ character.scenes || 0 }}</span>
              <span class="stat-label">关联场景</span>
            </div>
          </div>
        </div>

        <!-- 角色关系 -->
        <div class="detail-card detail-card--wide">
          <div class="card-title">
            <component :is="icons.users" :size="16" />
            角色关系
          </div>
          <div class="relationships">
            <div v-if="relationships.length" class="relationship-list">
              <div v-for="rel in relationships" :key="rel.id" class="relationship-item">
                <div class="rel-avatar" :style="{ background: rel.color }">
                  {{ rel.name.charAt(0) }}
                </div>
                <div class="rel-info">
                  <span class="rel-name">{{ rel.name }}</span>
                  <span class="rel-type">{{ rel.relationship }}</span>
                </div>
              </div>
            </div>
            <span v-else class="empty-text">暂无关联角色</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn btn--primary" @click="editCharacter">
          <component :is="icons.edit" :size="16" />
          编辑角色
        </button>
        <button class="btn btn--danger" @click="deleteCharacter">
          <component :is="icons.trash" :size="16" />
          删除角色
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 未找到 -->
    <EmptyState 
      v-else
      icon="userX"
      title="未找到角色"
      description="该角色不存在或已被删除"
      actionText="返回角色列表"
      @action="goBack"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUIStore } from '../stores/ui.js';
import { useProjectStore } from '../stores/project.js';
import { icons } from '../utils/icons.js';
import ViewHeader from '../components/ui/ViewHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();
const projectStore = useProjectStore();

const loading = ref(true);
const character = ref(null);

// 示例角色数据
const sampleCharacters = [
  {
    id: 'c1',
    name: '李明',
    role: 'protagonist',
    description: '故事的主角，一个勇敢而善良的年轻人，在逆境中不断成长',
    tags: ['勇敢', '善良', '正义', '坚韧'],
    color: 'linear-gradient(135deg, #6a7a72, #8fa89e)',
    appearances: 45,
    scenes: 12,
    appearance: '黑色短发，身材高大，眼神坚定，常穿深色外套',
    isLocked: true
  },
  {
    id: 'c2',
    name: '王芳',
    role: 'supporting',
    description: '主角的青梅竹马，聪明伶俐，是主角最信任的伙伴',
    tags: ['聪明', '温柔', '坚强', '细心'],
    color: 'linear-gradient(135deg, #7a8a9a, #9ab0c0)',
    appearances: 32,
    scenes: 8,
    appearance: '长发飘飘，面容清秀，笑容温暖',
    isLocked: true
  },
  {
    id: 'c3',
    name: '张伟',
    role: 'supporting',
    description: '主角的好友，性格开朗，总能在关键时刻提供帮助',
    tags: ['开朗', '忠诚', '幽默'],
    color: 'linear-gradient(135deg, #8a9a92, #a8b8b0)',
    appearances: 28,
    scenes: 7,
    appearance: '中等身材，总是带着笑容',
    isLocked: false
  },
  {
    id: 'c4',
    name: '刘洋',
    role: 'antagonist',
    description: '故事的反派，野心勃勃，为达目的不择手段',
    tags: ['狡猾', '野心', '冷酷', '精明'],
    color: 'linear-gradient(135deg, #5a5a5a, #7a7a7a)',
    appearances: 18,
    scenes: 6,
    appearance: '面容阴沉，眼神锐利，穿着考究',
    isLocked: false
  },
  {
    id: 'c5',
    name: '陈静',
    role: 'supporting',
    description: '神秘的女子，身份成谜，似乎知道很多秘密',
    tags: ['神秘', '冷静', '智慧'],
    color: 'linear-gradient(135deg, #9a9a9a, #b8c0bc)',
    appearances: 15,
    scenes: 5,
    appearance: '气质优雅，眼神深邃',
    isLocked: true
  }
];

// 角色关系数据
const relationships = computed(() => {
  if (!character.value) return [];
  
  // 根据角色返回不同的关系
  const relMap = {
    'c1': [
      { id: 'c2', name: '王芳', relationship: '青梅竹马', color: 'linear-gradient(135deg, #7a8a9a, #9ab0c0)' },
      { id: 'c3', name: '张伟', relationship: '好友', color: 'linear-gradient(135deg, #8a9a92, #a8b8b0)' },
      { id: 'c4', name: '刘洋', relationship: '宿敌', color: 'linear-gradient(135deg, #5a5a5a, #7a7a7a)' }
    ],
    'c2': [
      { id: 'c1', name: '李明', relationship: '青梅竹马', color: 'linear-gradient(135deg, #6a7a72, #8fa89e)' },
      { id: 'c5', name: '陈静', relationship: '闺蜜', color: 'linear-gradient(135deg, #9a9a9a, #b8c0bc)' }
    ],
    'c3': [
      { id: 'c1', name: '李明', relationship: '好友', color: 'linear-gradient(135deg, #6a7a72, #8fa89e)' }
    ],
    'c4': [
      { id: 'c1', name: '李明', relationship: '宿敌', color: 'linear-gradient(135deg, #6a7a72, #8fa89e)' }
    ],
    'c5': [
      { id: 'c2', name: '王芳', relationship: '闺蜜', color: 'linear-gradient(135deg, #7a8a9a, #9ab0c0)' }
    ]
  };
  
  return relMap[character.value.id] || [];
});

// 加载角色数据
function loadCharacter() {
  loading.value = true;
  character.value = null; // 重置角色数据
  const id = route.params.id;
  
  if (!id) {
    loading.value = false;
    return;
  }
  
  // 模拟加载延迟
  setTimeout(() => {
    // 优先从项目数据加载
    if (projectStore.currentProject?.characters) {
      const found = projectStore.currentProject.characters.find(c => c.id === id);
      if (found) {
        character.value = { ...found };
        loading.value = false;
        return;
      }
    }
    
    // 从示例数据加载
    const sampleChar = sampleCharacters.find(c => c.id === id);
    if (sampleChar) {
      character.value = { ...sampleChar };
    }
    
    loading.value = false;
  }, 200);
}

// 获取角色类型标签
function getRoleLabel(role) {
  const labels = {
    protagonist: '主角',
    supporting: '配角',
    antagonist: '反派',
    minor: '龙套'
  };
  return labels[role] || role || '未知';
}

// 返回列表
function goBack() {
  router.push('/characters');
}

// 编辑角色
function editCharacter() {
  router.push('/characters');
}

// 删除角色
function deleteCharacter() {
  if (confirm(`确定要删除角色 "${character.value?.name}" 吗？`)) {
    router.push('/characters');
  }
}

// 锁定角色
function lockCharacter() {
  if (character.value) {
    character.value.isLocked = true;
  }
}

// 解锁角色
function unlockCharacter() {
  if (character.value) {
    character.value.isLocked = false;
  }
}

// 监听路由变化
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadCharacter();
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadCharacter();
});
</script>

<style scoped>
.character-detail-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 基本信息卡片 - 统一简洁风格 */
.info-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.card-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.locked-badge {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(100, 160, 130, 0.3);
  border: 1px solid rgba(100, 160, 130, 0.4);
  border-radius: 12px;
  font-size: 10px;
  color: #4a7a5a;
  white-space: nowrap;
}

.basic-info {
  flex: 1;
}

.character-name {
  font-size: 28px;
  font-weight: 700;
  color: #2c2c2e;
  margin: 0 0 8px 0;
}

.character-role-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.role--protagonist { background: rgba(130, 160, 140, 0.3); color: #4a6a52; }
.role--supporting { background: rgba(100, 140, 180, 0.3); color: #3a5a7a; }
.role--antagonist { background: rgba(180, 120, 120, 0.3); color: #7a4a4a; }
.role--minor { background: rgba(160, 160, 160, 0.3); color: #5a5a5a; }

.character-description {
  font-size: 14px;
  color: #5a5a5c;
  line-height: 1.6;
  margin: 0;
}

/* 详细信息网格 */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.detail-card {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 16px;
}

.detail-card--wide {
  grid-column: 1 / -1;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #4a4a4c;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.card-content {
  font-size: 14px;
  color: #5a5a5c;
  line-height: 1.6;
  margin: 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 12px;
  padding: 5px 12px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  color: #4a4a4c;
}

.empty-text {
  font-size: 13px;
  color: #9a9a9c;
  font-style: italic;
}

/* 统计数据 */
.stats-grid {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #2c2c2e;
}

.stat-label {
  font-size: 12px;
  color: #8a8a8c;
  margin-top: 4px;
}

/* 角色关系 */
.relationship-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.relationship-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.relationship-item:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.1);
}

.rel-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.rel-info {
  display: flex;
  flex-direction: column;
}

.rel-name {
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2e;
}

.rel-type {
  font-size: 11px;
  color: #7a7a7c;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.5);
  color: #5a5a5c;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: #2c2c2e;
  border-color: rgba(0, 0, 0, 0.18);
}

.btn--primary {
  background: rgba(120, 140, 130, 0.25);
  color: #4a5a52;
  border-color: rgba(100, 120, 110, 0.3);
}

.btn--primary:hover {
  background: rgba(120, 140, 130, 0.35);
  color: #3a4a42;
}

.btn--danger {
  background: rgba(200, 120, 120, 0.15);
  color: #8a5050;
  border-color: rgba(200, 120, 120, 0.25);
}

.btn--danger:hover {
  background: rgba(200, 120, 120, 0.25);
  color: #7a4040;
}

/* 头部操作按钮 */
.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  color: #5a5a5c;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: #2c2c2e;
  border-color: rgba(0, 0, 0, 0.18);
}

.action-btn--lock {
  background: rgba(100, 160, 130, 0.2);
  color: #4a7a5a;
  border-color: rgba(100, 160, 130, 0.3);
}

.action-btn--lock:hover {
  background: rgba(100, 160, 130, 0.3);
  color: #3a6a4a;
}

.action-btn--unlock {
  background: rgba(180, 150, 100, 0.2);
  color: #7a6a4a;
  border-color: rgba(180, 150, 100, 0.3);
}

.action-btn--unlock:hover {
  background: rgba(180, 150, 100, 0.3);
  color: #6a5a3a;
}

/* 加载状态 */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #8a8a8c;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(138, 138, 138, 0.2);
  border-top-color: #8a8a8a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}


</style>
